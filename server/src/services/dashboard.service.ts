import { Order } from '../models/order.model';
import { Payment } from '../models/payment.model';
import { Variant } from '../models/variant.model';
import { normalizeOrderStatus } from '../utils/orderStatus';

type DashboardPeriod = '7d' | '30d' | '90d';

type DashboardQuery = {
  period?: string | string[];
  lowStockThreshold?: string | string[];
};

type ParsedDashboardQuery = {
  period: DashboardPeriod;
  lowStockThreshold: number;
};

const PERIOD_DAYS: Record<DashboardPeriod, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

const VIETNAM_TIMEZONE = '+07:00';
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
const REVENUE_ORDER_STATUSES = ['pending', 'paid', 'shipping', 'done'];

const formatToVietnamDate = (value: Date) => new Date(value.getTime() + VIETNAM_OFFSET_MS).toISOString().slice(0, 10);

const getVietnamDateRange = (days: number) => {
  const vietnamNow = new Date(Date.now() + VIETNAM_OFFSET_MS);

  const endDate = new Date(vietnamNow);
  endDate.setUTCHours(23, 59, 59, 999);

  const startDate = new Date(vietnamNow);
  startDate.setUTCDate(vietnamNow.getUTCDate() - (days - 1));
  startDate.setUTCHours(0, 0, 0, 0);

  return {
    startDate: new Date(startDate.getTime() - VIETNAM_OFFSET_MS),
    endDate: new Date(endDate.getTime() - VIETNAM_OFFSET_MS),
  };
};

const parseDashboardQuery = (query: DashboardQuery): ParsedDashboardQuery => {
  const rawPeriod = query.period;
  if (rawPeriod === undefined) {
    return { period: '30d', lowStockThreshold: 5 };
  }

  if (Array.isArray(rawPeriod) || typeof rawPeriod !== 'string' || rawPeriod.trim() === '') {
    throw Object.assign(new Error('period phải là 7d, 30d hoặc 90d'), { status: 400 });
  }

  if (!['7d', '30d', '90d'].includes(rawPeriod)) {
    throw Object.assign(new Error('period phải là 7d, 30d hoặc 90d'), { status: 400 });
  }

  const rawThreshold = query.lowStockThreshold;
  if (rawThreshold === undefined) {
    return { period: rawPeriod as DashboardPeriod, lowStockThreshold: 5 };
  }

  if (Array.isArray(rawThreshold) || typeof rawThreshold !== 'string' || !/^\d+$/.test(rawThreshold.trim())) {
    throw Object.assign(new Error('lowStockThreshold phải là số nguyên không âm'), { status: 400 });
  }

  const parsedThreshold = Number(rawThreshold);
  if (!Number.isInteger(parsedThreshold) || parsedThreshold < 0) {
    throw Object.assign(new Error('lowStockThreshold phải là số nguyên không âm'), { status: 400 });
  }

  return {
    period: rawPeriod as DashboardPeriod,
    lowStockThreshold: parsedThreshold,
  };
};

export const getAdminDashboard = async (query: DashboardQuery) => {
  const { period, lowStockThreshold } = parseDashboardQuery(query);
  const days = PERIOD_DAYS[period];
  const { startDate, endDate } = getVietnamDateRange(days);

  const lowStockBasePipeline = [
    { $match: { stock: { $lte: lowStockThreshold } } },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productData',
      },
    },
    { $unwind: { path: '$productData', preserveNullAndEmptyArrays: true } },
    {
      $match: {
        $or: [{ productData: null }, { 'productData.isActive': { $ne: false } }],
      },
    },
  ];

  const [totalOrders, pendingOrders, orderStatusBreakdown, revenueSummary, revenueSeriesData, lowStockItems, lowStockVariantCount] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
    Order.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['pending', 'paid'] },
    }),
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
      { $sort: { count: -1, status: 1 } },
    ]),
    Payment.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'order',
          foreignField: '_id',
          as: 'orderData',
        },
      },
      { $unwind: '$orderData' },
      {
        $match: {
          'orderData.status': { $in: REVENUE_ORDER_STATUSES },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $ifNull: ['$amount', 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          totalRevenue: 1,
        },
      },
    ]),
    (async () => {
      const [orderSeries, paymentSeries] = await Promise.all([
        Order.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: VIETNAM_TIMEZONE } },
              orders: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              date: '$_id',
              orders: 1,
            },
          },
        ]),
        Payment.aggregate([
          {
            $match: {
              status: 'paid',
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $lookup: {
              from: 'orders',
              localField: 'order',
              foreignField: '_id',
              as: 'orderData',
            },
          },
          { $unwind: '$orderData' },
          {
            $match: {
              'orderData.status': { $in: REVENUE_ORDER_STATUSES },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: VIETNAM_TIMEZONE } },
              revenue: { $sum: { $ifNull: ['$amount', 0] } },
            },
          },
          {
            $project: {
              _id: 0,
              date: '$_id',
              revenue: 1,
            },
          },
        ]),
      ]);

      const orderMap = new Map((orderSeries as Array<{ date: string; orders: number }>).map((item) => [item.date, item]));
      const paymentMap = new Map((paymentSeries as Array<{ date: string; revenue: number }>).map((item) => [item.date, item]));

      const series: Array<{ date: string; revenue: number; orders: number }> = [];
      const cursor = new Date(startDate);

      while (cursor <= endDate) {
        const dateKey = formatToVietnamDate(cursor);
        const orderValue = orderMap.get(dateKey);
        const paymentValue = paymentMap.get(dateKey);

        series.push({
          date: dateKey,
          revenue: paymentValue?.revenue ?? 0,
          orders: orderValue?.orders ?? 0,
        });

        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }

      return series;
    })(),
    Variant.aggregate([
      ...lowStockBasePipeline,
      {
        $project: {
          _id: 0,
          variantId: '$_id',
          productId: '$product',
          productName: { $ifNull: ['$productData.name', ''] },
          sku: 1,
          stock: 1,
        },
      },
      { $sort: { stock: 1, sku: 1 } },
      { $limit: 20 },
    ]),
    Variant.aggregate([
      ...lowStockBasePipeline,
      { $count: 'count' },
    ]),
  ]);

  const totalRevenue = revenueSummary[0]?.totalRevenue ?? 0;
  const lowStockVariants = lowStockVariantCount[0]?.count ?? 0;

  const normalizedStatusBreakdown = Object.values(
    orderStatusBreakdown.reduce(
      (result: Record<string, { status: string; count: number }>, item: any) => {
        const status = normalizeOrderStatus(item.status);
        result[status] = {
          status,
          count: (result[status]?.count || 0) + item.count,
        };
        return result;
      },
      {},
    ),
  );

  return {
    period,
    summary: {
      totalOrders,
      totalRevenue,
      pendingOrders,
      lowStockVariants,
    },
    revenueSeries: revenueSeriesData,
    orderStatusBreakdown: normalizedStatusBreakdown,
    lowStockItems,
    generatedAt: new Date().toISOString(),
  };
};
