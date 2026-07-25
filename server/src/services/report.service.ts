import { Expense } from '../models/expense.model';
import { Order } from '../models/order.model';
import { Payment } from '../models/payment.model';
import { SupportRequest } from '../models/supportRequest.model';
import { User } from '../models/user.model';
import { Variant } from '../models/variant.model';
import { normalizeOrderStatus } from '../utils/orderStatus';
import {
  LOYAL_MIN_ORDERS,
  VIP_MIN_ORDERS,
  VIP_MIN_SPEND,
  isVipCustomer,
} from '../constants/customerSegment';

type Granularity = 'day' | 'week' | 'month' | 'quarter' | 'year';

function range(query: Record<string, unknown>) {
  const to = query.to ? new Date(String(query.to)) : new Date();
  to.setHours(23, 59, 59, 999);
  const from = query.from ? new Date(String(query.from)) : new Date(to);
  if (!query.from) from.setDate(from.getDate() - 29);
  from.setHours(0, 0, 0, 0);
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from > to) {
    throw Object.assign(new Error('Khoảng thời gian báo cáo không hợp lệ'), { status: 400 });
  }
  const granularity = ['day', 'week', 'month', 'quarter', 'year'].includes(
    String(query.granularity),
  )
    ? (query.granularity as Granularity)
    : 'day';
  return { from, to, granularity };
}

function periodKey(value: Date, granularity: Granularity) {
  const date = new Date(value);
  if (granularity === 'week') {
    const day = date.getDay() || 7;
    date.setDate(date.getDate() - day + 1);
  }
  const year = date.getFullYear();
  if (granularity === 'year') return String(year);
  if (granularity === 'quarter') return `${year}-Q${Math.floor(date.getMonth() / 3) + 1}`;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  if (granularity === 'month') return `${year}-${month}`;
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function percentChange(current: number, previous: number) {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

const inRange = (value: unknown, from: Date, to: Date) => {
  const time = value ? new Date(value as any).getTime() : NaN;
  return Number.isFinite(time) && time >= from.getTime() && time <= to.getTime();
};

export async function getReports(query: Record<string, unknown>) {
  const { from, to, granularity } = range(query);
  const duration = to.getTime() - from.getTime() + 1;
  const previousTo = new Date(from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - duration + 1);
  const yoyFrom = new Date(from);
  yoyFrom.setFullYear(yoyFrom.getFullYear() - 1);
  const yoyTo = new Date(to);
  yoyTo.setFullYear(yoyTo.getFullYear() - 1);

  const [orders, payments, variants, users, expenses, supportRequests]: any[] = await Promise.all([
    Order.find({ createdAt: { $lte: to } }).lean(),
    Payment.find({ method: { $in: ['cod', 'bank_qr'] } }).lean(),
    Variant.find({})
      .populate({ path: 'product', populate: { path: 'category', select: 'name' } })
      .lean(),
    User.find({ role: 'customer' }).select('name email createdAt').lean(),
    Expense.find({ date: { $lte: to } })
      .sort({ date: -1 })
      .lean(),
    SupportRequest.find({ createdAt: { $lte: to } })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const orderMap = new Map(orders.map((order: any) => [String(order._id), order]));
  const variantMap = new Map(variants.map((variant: any) => [String(variant._id), variant]));
  const validPaidPayments = payments.filter((payment: any) => {
    const order: any = orderMap.get(String(payment.order));
    return (
      payment.status === 'paid' &&
      order &&
      !['cancelled', 'returned'].includes(normalizeOrderStatus(order.status))
    );
  });
  const historicalPaidPayments = validPaidPayments.filter((payment: any) => {
    const paidAt = new Date(payment.paidAt || payment.updatedAt).getTime();
    return Number.isFinite(paidAt) && paidAt <= to.getTime();
  });
  const revenueFor = (start: Date, end: Date) =>
    validPaidPayments
      .filter((payment: any) => inRange(payment.paidAt || payment.updatedAt, start, end))
      .reduce((sum: number, payment: any) => sum + Number(payment.amount || 0), 0);
  const selectedPayments = validPaidPayments.filter((payment: any) =>
    inRange(payment.paidAt || payment.updatedAt, from, to),
  );
  const selectedPaidOrders = selectedPayments.map((payment: any) => ({
    payment,
    order: orderMap.get(String(payment.order)),
  }));
  const selectedOrders = orders.filter((order: any) => inRange(order.createdAt, from, to));
  const selectedExpenses = expenses.filter((expense: any) => inRange(expense.date, from, to));

  const productMap = new Map<string, any>();
  let inventoryValue = 0;
  let stockUnits = 0;
  let costedStockUnits = 0;
  let missingCostSku = 0;
  for (const variant of variants) {
    const stock = Math.max(0, Number(variant.stock) || 0);
    const costPrice = Math.max(0, Number(variant.costPrice) || 0);
    inventoryValue += stock * costPrice;
    stockUnits += stock;
    if (stock > 0 && costPrice > 0) costedStockUnits += stock;
    if (stock > 0 && costPrice <= 0) missingCostSku += 1;

    const product = variant.product;
    if (!product) continue;
    const id = String(product._id);
    if (!productMap.has(id))
      productMap.set(id, {
        id,
        name: product.name,
        category: product.category?.name || 'Khác',
        stock: 0,
        inventoryValue: 0,
        revenue: 0,
        quantity: 0,
        cogs: 0,
      });
    const row = productMap.get(id);
    row.stock += stock;
    row.inventoryValue += stock * costPrice;
  }

  let cogs = 0;
  let costCoveredUnits = 0;
  let soldUnits = 0;
  const categoryMap = new Map<string, number>();
  for (const { order, payment } of selectedPaidOrders as any[]) {
    const itemTotal = (order.items || []).reduce(
      (sum: number, item: any) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0,
    );
    const netRatio = itemTotal ? Number(payment.amount || order.total || 0) / itemTotal : 1;
    for (const item of order.items || []) {
      const variant: any = variantMap.get(String(item.variant));
      const product = variant?.product;
      const quantity = Number(item.quantity || 0);
      const itemRevenue = Number(item.price || 0) * quantity * netRatio;
      const unitCost = Number(item.costPrice || variant?.costPrice || 0);
      const itemCogs = unitCost * quantity;
      soldUnits += quantity;
      if (unitCost > 0) costCoveredUnits += quantity;
      cogs += itemCogs;
      if (product) {
        const row = productMap.get(String(product._id));
        row.quantity += quantity;
        row.revenue += itemRevenue;
        row.cogs += itemCogs;
        categoryMap.set(row.category, (categoryMap.get(row.category) || 0) + itemRevenue);
      }
    }
  }

  const revenue = revenueFor(from, to);
  const previousRevenue = revenueFor(previousFrom, previousTo);
  const yoyRevenue = revenueFor(yoyFrom, yoyTo);
  const expenseTotal = selectedExpenses.reduce(
    (sum: number, item: any) => sum + Number(item.amount || 0),
    0,
  );
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - expenseTotal;
  const seriesMap = new Map<
    string,
    { key: string; revenue: number; expenses: number; cashFlow: number; orders: number }
  >();
  const seriesRow = (key: string) => {
    if (!seriesMap.has(key))
      seriesMap.set(key, { key, revenue: 0, expenses: 0, cashFlow: 0, orders: 0 });
    return seriesMap.get(key)!;
  };
  selectedPayments.forEach(
    (payment: any) =>
      (seriesRow(periodKey(new Date(payment.paidAt || payment.updatedAt), granularity)).revenue +=
        Number(payment.amount || 0)),
  );
  selectedExpenses.forEach(
    (expense: any) =>
      (seriesRow(periodKey(new Date(expense.date), granularity)).expenses += Number(
        expense.amount || 0,
      )),
  );
  selectedOrders.forEach(
    (order: any) => (seriesRow(periodKey(new Date(order.createdAt), granularity)).orders += 1),
  );
  const series = Array.from(seriesMap.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((row) => ({ ...row, cashFlow: row.revenue - row.expenses }));

  const statusCounts: Record<string, number> = {
    pending: 0,
    shipping: 0,
    done: 0,
    cancelled: 0,
    returned: 0,
  };
  selectedOrders.forEach((order: any) => {
    const status = normalizeOrderStatus(order.status);
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  const cancelled = statusCounts.cancelled || 0;
  const returned = statusCounts.returned || 0;

  const allPaidByUser = new Map<string, { orders: number; spend: number; firstAt: Date }>();
  for (const payment of historicalPaidPayments) {
    const order: any = orderMap.get(String(payment.order));
    if (!order?.user) continue;
    const userId = String(order.user);
    const at = new Date(payment.paidAt || payment.updatedAt);
    const value = allPaidByUser.get(userId) || { orders: 0, spend: 0, firstAt: at };
    value.orders += 1;
    value.spend += Number(payment.amount || 0);
    if (at < value.firstAt) value.firstAt = at;
    allPaidByUser.set(userId, value);
  }
  const currentCustomerIds = new Set<string>(
    selectedPaidOrders.map(({ order }: any) => String(order.user || '')).filter(Boolean),
  );
  const previousCustomerIds = new Set<string>(
    validPaidPayments
      .filter((p: any) => inRange(p.paidAt || p.updatedAt, previousFrom, previousTo))
      .map((p: any) => String((orderMap.get(String(p.order)) as any)?.user || ''))
      .filter(Boolean),
  );
  const retained = Array.from(previousCustomerIds).filter((id) =>
    currentCustomerIds.has(id),
  ).length;
  const segments = { new: 0, returning: 0, loyal: 0, vip: 0 };
  const userMap = new Map(users.map((user: any) => [String(user._id), user]));
  const periodPurchasesByUser = new Map<string, Array<{ order: any; payment: any }>>();
  selectedPaidOrders.forEach(({ order, payment }: any) => {
    const userId = String(order?.user || '');
    if (!userId) return;
    const purchases = periodPurchasesByUser.get(userId) || [];
    purchases.push({ order, payment });
    periodPurchasesByUser.set(userId, purchases);
  });

  const segmentRank: Record<string, number> = { vip: 0, loyal: 1, returning: 2, new: 3 };
  const customerDetails = Array.from(currentCustomerIds)
    .map((userId) => {
      const lifetime = allPaidByUser.get(userId);
      const purchases = periodPurchasesByUser.get(userId) || [];
      if (!lifetime || !purchases.length) return null;

      const firstPurchaseInPeriod = lifetime.firstAt.getTime() >= from.getTime();
      let segment: 'new' | 'returning' | 'loyal' | 'vip';
      let reason: string;
      if (isVipCustomer(lifetime.orders, lifetime.spend)) {
        segment = 'vip';
        reason =
          lifetime.orders >= VIP_MIN_ORDERS && lifetime.spend >= VIP_MIN_SPEND
            ? `Có ${lifetime.orders} đơn và tổng chi tiêu ${Math.round(lifetime.spend).toLocaleString('vi-VN')}đ.`
            : lifetime.orders >= VIP_MIN_ORDERS
              ? `Có ${lifetime.orders} đơn, đạt ngưỡng VIP từ ${VIP_MIN_ORDERS} đơn.`
              : `Tổng chi tiêu ${Math.round(lifetime.spend).toLocaleString('vi-VN')}đ, đạt ngưỡng VIP từ ${VIP_MIN_SPEND.toLocaleString('vi-VN')}đ.`;
      } else if (lifetime.orders >= LOYAL_MIN_ORDERS) {
        segment = 'loyal';
        reason = `Có ${lifetime.orders} đơn, đạt ngưỡng khách trung thành từ ${LOYAL_MIN_ORDERS} đơn.`;
      } else if (firstPurchaseInPeriod) {
        segment = 'new';
        reason = `Đơn đầu tiên phát sinh trong kỳ báo cáo; hiện có ${lifetime.orders} đơn.`;
      } else {
        segment = 'returning';
        reason = `Đã mua trước kỳ báo cáo và quay lại mua trong kỳ này; tổng cộng ${lifetime.orders} đơn.`;
      }
      segments[segment] += 1;

      const user: any = userMap.get(userId);
      const firstOrder = purchases[0]?.order;
      const periodSpend = purchases.reduce(
        (sum, item) => sum + Number(item.payment?.amount || item.order?.total || 0),
        0,
      );
      const detailOrders = purchases
        .slice()
        .sort(
          (a, b) =>
            new Date(b.payment?.paidAt || b.order?.updatedAt).getTime() -
            new Date(a.payment?.paidAt || a.order?.updatedAt).getTime(),
        )
        .map(({ order, payment }) => ({
          id: String(order._id),
          code: `#${String(order._id).slice(-8).toUpperCase()}`,
          date: payment?.paidAt || order.createdAt,
          status: normalizeOrderStatus(order.status),
          total: Number(payment?.amount || order.total || 0),
          items: (order.items || []).map((item: any) => {
            const quantity = Number(item.quantity || 0);
            const price = Number(item.finalPrice ?? item.price ?? 0);
            return {
              name: item.name || 'Sản phẩm',
              volume: item.volume || '',
              quantity,
              price,
              total: price * quantity,
            };
          }),
        }));

      return {
        id: userId,
        name: user?.name || firstOrder?.address?.fullName || 'Khách hàng',
        email: user?.email || firstOrder?.address?.email || '',
        segment,
        reason,
        lifetimeOrders: lifetime.orders,
        lifetimeSpend: lifetime.spend,
        periodOrders: purchases.length,
        periodSpend,
        orders: detailOrders,
      };
    })
    .filter(Boolean)
    .sort(
      (a: any, b: any) =>
        segmentRank[a.segment] - segmentRank[b.segment] || b.lifetimeSpend - a.lifetimeSpend,
    );

  const newCustomers = segments.new;
  const returningCustomers = segments.returning + segments.loyal + segments.vip;
  const currentCustomerLifetimeSpend = customerDetails.reduce(
    (sum: number, item: any) => sum + Number(item.lifetimeSpend || 0),
    0,
  );
  const currentCustomerClv = customerDetails.length
    ? currentCustomerLifetimeSpend / customerDetails.length
    : 0;

  const paymentMethods = new Map<string, { method: string; count: number; amount: number }>();
  selectedPayments.forEach((payment: any) => {
    const row = paymentMethods.get(payment.method) || {
      method: payment.method,
      count: 0,
      amount: 0,
    };
    row.count += 1;
    row.amount += Number(payment.amount || 0);
    paymentMethods.set(payment.method, row);
  });

  const processHours: number[] = [];
  const deliveryHours: number[] = [];
  selectedOrders.forEach((order: any) => {
    if (order.shippedAt)
      processHours.push(
        (new Date(order.shippedAt).getTime() - new Date(order.createdAt).getTime()) / 3_600_000,
      );
    if (order.shippedAt && order.completedAt)
      deliveryHours.push(
        (new Date(order.completedAt).getTime() - new Date(order.shippedAt).getTime()) / 3_600_000,
      );
  });
  const selectedSupport = supportRequests.filter((item: any) => inRange(item.createdAt, from, to));
  const resolvedSupport = selectedSupport.filter((item: any) => item.resolvedAt);
  const supportStatusCounts: Record<string, number> = {
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  };
  selectedSupport.forEach((item: any) => {
    const s = item.status || 'open';
    if (s in supportStatusCounts) supportStatusCounts[s] += 1;
  });

  const products = Array.from(productMap.values())
    .map((row) => ({
      ...row,
      margin: row.revenue ? Math.round(((row.revenue - row.cogs) / row.revenue) * 1000) / 10 : null,
    }))
    .sort((a, b) => b.quantity - a.quantity);
  const activeVariants = variants.filter(
    (variant: any) => variant.isActive !== false && variant.product?.isActive !== false,
  );
  const lowStock = activeVariants.filter((variant: any) => {
    const stock = Number(variant.stock) || 0;
    return stock > 0 && stock <= 5;
  }).length;
  const outOfStock = activeVariants.filter(
    (variant: any) => (Number(variant.stock) || 0) <= 0,
  ).length;
  const inventoryCostCoverage = stockUnits ? (costedStockUnits / stockUnits) * 100 : null;
  const soldCostCoverage = soldUnits ? (costCoveredUnits / soldUnits) * 100 : null;
  const slowProducts = products
    .filter((row) => row.stock > 0)
    .sort((a, b) => a.quantity - b.quantity || b.stock - a.stock)
    .slice(0, 10);
  const expenseTotalsByType: Record<string, number> = selectedExpenses.reduce(
    (result: Record<string, number>, item: any) => {
      const amount = Number(item.amount || 0);
      if (Number.isFinite(amount) && amount > 0) {
        result[item.type] = (result[item.type] || 0) + amount;
      }
      return result;
    },
    {},
  );
  const expenseByType = Object.entries(expenseTotalsByType)
    .map(([type, amount]) => ({ type, amount: Number(amount) }))
    .sort((a, b) => b.amount - a.amount);

  return {
    range: { from, to, granularity },
    revenue: {
      total: revenue,
      paidOrderCount: selectedPayments.length,
      previous: previousRevenue,
      previousChange: percentChange(revenue, previousRevenue),
      yoy: yoyRevenue,
      yoyChange: percentChange(revenue, yoyRevenue),
      byCategory: Array.from(categoryMap, ([name, value]) => ({ name, value })),
      byProduct: products.filter((row) => row.quantity > 0),
      series,
    },
    orders: {
      total: selectedOrders.length,
      statusCounts,
      aov: selectedPayments.length ? revenue / selectedPayments.length : 0,
      cancellationRate: selectedOrders.length
        ? ((cancelled + returned) / selectedOrders.length) * 100
        : 0,
      returnRate: selectedOrders.length ? (returned / selectedOrders.length) * 100 : 0,
      series,
    },
    inventory: {
      top: products.filter((row) => row.quantity > 0).slice(0, 10),
      slow: slowProducts,
      products,
      inventoryValue,
      turnover: inventoryValue ? cogs / inventoryValue : null,
      turnoverCogs: cogs,
      lowStock,
      outOfStock,
      activeSkuCount: activeVariants.length,
      stockUnits,
      missingCostSku,
      inventoryCostCoverage,
      costCoverage: soldCostCoverage,
    },
    customers: {
      newCustomers,
      returningCustomers,
      clv: currentCustomerClv,
      retentionRate: previousCustomerIds.size ? (retained / previousCustomerIds.size) * 100 : 0,
      segments,
      totalWithOrders: currentCustomerIds.size,
      registered: users.length,
      details: customerDetails,
    },
    finance: {
      revenue,
      cogs,
      grossProfit,
      operatingExpenses: expenseTotal,
      netProfit,
      expenseByType,
      series,
      costCoverage: soldCostCoverage,
      expenses: selectedExpenses
        .slice(0, 100)
        .map((item: any) => ({
          id: String(item._id),
          type: item.type,
          amount: item.amount,
          date: item.date,
          note: item.note,
        })),
    },
    operations: {
      averageProcessingHours: processHours.length
        ? processHours.reduce((a, b) => a + b, 0) / processHours.length
        : null,
      averageDeliveryHours: deliveryHours.length
        ? deliveryHours.reduce((a, b) => a + b, 0) / deliveryHours.length
        : null,
      timingCoverage: selectedOrders.length
        ? (Math.max(processHours.length, deliveryHours.length) / selectedOrders.length) * 100
        : 0,
      paymentMethods: Array.from(paymentMethods.values()).sort((a, b) => b.count - a.count),
      support: {
        total: selectedSupport.length,
        open: selectedSupport.filter((item: any) => ['open', 'in_progress'].includes(item.status))
          .length,
        resolved: resolvedSupport.length,
        byStatus: supportStatusCounts,
        averageResolutionHours: resolvedSupport.length
          ? resolvedSupport.reduce(
              (sum: number, item: any) =>
                sum +
                (new Date(item.resolvedAt).getTime() - new Date(item.createdAt).getTime()) /
                  3_600_000,
              0,
            ) / resolvedSupport.length
          : null,
      },
      supportRequests: selectedSupport
        .slice(0, 100)
        .map((item: any) => ({
          id: String(item._id),
          name: item.name,
          email: item.email,
          subject: item.subject,
          message: item.message,
          status: item.status,
          createdAt: item.createdAt,
          resolvedAt: item.resolvedAt,
        })),
    },
  };
}

export async function createExpense(input: any) {
  return Expense.create({
    type: input.type,
    amount: input.amount,
    date: input.date,
    note: input.note || '',
  });
}
export async function deleteExpense(id: string) {
  await Expense.findByIdAndDelete(id);
  return { id };
}
export async function createSupportRequest(input: any, userId?: string) {
  return SupportRequest.create({ ...input, user: userId || undefined });
}
export async function updateSupportStatus(id: string, status: string) {
  const resolved = ['resolved', 'closed'].includes(status);
  const item = await SupportRequest.findByIdAndUpdate(
    id,
    { status, resolvedAt: resolved ? new Date() : null },
    { new: true },
  );
  if (!item) throw Object.assign(new Error('Không tìm thấy yêu cầu hỗ trợ'), { status: 404 });
  return item;
}
