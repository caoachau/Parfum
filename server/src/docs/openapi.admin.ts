// =============================================================================
//  OpenAPI - Nhom endpoint quan tri
//  TAT CA endpoint trong tep nay deu di qua authenticate + authorize('admin')
// =============================================================================

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const arrayOf = (name: string) => ({ type: 'array', items: ref(name) });

const envelope = (dataSchema: Record<string, unknown>) => ({
  type: 'object',
  properties: { success: { type: 'boolean', example: true }, data: dataSchema },
});

const ok = (description: string, schema: Record<string, unknown>) => ({
  description,
  content: { 'application/json': { schema } },
});

const json = (schemaRef: string) => ({ 'application/json': { schema: { $ref: schemaRef } } });

const e400 = { $ref: '#/components/responses/BadRequest' };
const e401 = { $ref: '#/components/responses/Unauthorized' };
const e403 = { $ref: '#/components/responses/Forbidden' };
const e404 = { $ref: '#/components/responses/NotFound' };

const adminSecurity = [{ bearerAuth: [] }];
const adminErrors = { 401: e401, 403: e403 };
const idParam = [{ $ref: '#/components/parameters/ObjectIdPath' }];

/** Sinh nhanh bo bon endpoint CRUD cho mot tai nguyen quan tri. */
function crud(opts: {
  tag: string;
  base: string;
  nameSingular: string;
  schema: string;
  updateMethod?: 'put' | 'patch';
  idName?: string;
}) {
  const { tag, base, nameSingular, schema } = opts;
  const updateMethod = opts.updateMethod ?? 'put';
  const idName = opts.idName ?? 'id';
  const idPathParam = {
    name: idName,
    in: 'path',
    required: true,
    schema: ref('ObjectId'),
  };

  return {
    [base]: {
      get: {
        tags: [tag],
        summary: `Danh sach ${nameSingular}`,
        security: adminSecurity,
        responses: { 200: ok('Danh sach', envelope(arrayOf(schema))), ...adminErrors },
      },
      post: {
        tags: [tag],
        summary: `Tao ${nameSingular}`,
        security: adminSecurity,
        requestBody: { required: true, content: json(`#/components/schemas/${schema}`) },
        responses: { 201: ok('Da tao', envelope(ref(schema))), 400: e400, ...adminErrors },
      },
    },
    [`${base}/{${idName}}`]: {
      parameters: [idPathParam],
      [updateMethod]: {
        tags: [tag],
        summary: `Cap nhat ${nameSingular}`,
        security: adminSecurity,
        requestBody: { required: true, content: json(`#/components/schemas/${schema}`) },
        responses: {
          200: ok('Da cap nhat', envelope(ref(schema))),
          400: e400,
          ...adminErrors,
          404: e404,
        },
      },
      delete: {
        tags: [tag],
        summary: `Xoa ${nameSingular}`,
        security: adminSecurity,
        responses: { 200: ok('Da xoa', envelope({ type: 'object' })), ...adminErrors, 404: e404 },
      },
    },
  };
}

export const adminPaths = {
  '/admin-only': {
    get: {
      tags: ['Admin - Dashboard'],
      summary: 'Endpoint kiem tra nhanh quyen quan tri',
      security: adminSecurity,
      responses: {
        200: ok('Tai khoan co quyen quan tri', {
          type: 'object',
          properties: { message: { type: 'string', example: 'Admin only' } },
        }),
        ...adminErrors,
      },
    },
  },

  // -------------------------------------------------------------- Dashboard --
  '/admin/stats': {
    get: {
      tags: ['Admin - Dashboard'],
      summary: 'Chi so tong quan cho bang dieu khien',
      description: 'Gom so don, doanh thu, canh bao ton kho thap va cac chi so nhanh khac.',
      security: adminSecurity,
      responses: { 200: ok('Chi so tong quan', envelope({ type: 'object' })), ...adminErrors },
    },
  },

  '/admin/search': {
    get: {
      tags: ['Admin - Dashboard'],
      summary: 'Tim kiem nhanh xuyen suot khu vuc quan tri',
      security: adminSecurity,
      parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }],
      responses: { 200: ok('Ket qua tim kiem', envelope({ type: 'object' })), ...adminErrors },
    },
  },

  '/admin/notifications': {
    get: {
      tags: ['Admin - Dashboard'],
      summary: 'Danh sach thong bao quan tri',
      security: adminSecurity,
      responses: {
        200: ok('Danh sach thong bao', envelope({ type: 'array', items: { type: 'object' } })),
        ...adminErrors,
      },
    },
  },

  '/admin/notifications/{id}/seen': {
    patch: {
      tags: ['Admin - Dashboard'],
      summary: 'Danh dau da doc mot thong bao',
      security: adminSecurity,
      parameters: idParam,
      responses: {
        200: ok('Da danh dau', envelope({ type: 'object' })),
        ...adminErrors,
        404: e404,
      },
    },
  },

  '/admin/reports': {
    get: {
      tags: ['Admin - Dashboard'],
      summary: 'Bao cao doanh thu, ton kho va loi nhuan',
      description:
        'Loi nhuan duoc tinh tu gia von luu trong anh chup dong hang, nen so lieu qua khu khong bi sai lech khi gia von hien tai thay doi.',
      security: adminSecurity,
      parameters: [
        { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
      ],
      responses: { 200: ok('Du lieu bao cao', envelope({ type: 'object' })), ...adminErrors },
    },
  },

  '/admin/expenses': {
    post: {
      tags: ['Admin - Dashboard'],
      summary: 'Ghi nhan mot khoan chi phi',
      security: adminSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                amount: { type: 'number' },
                note: { type: 'string' },
                spentAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      responses: {
        201: ok('Da ghi nhan', envelope({ type: 'object' })),
        400: e400,
        ...adminErrors,
      },
    },
  },

  '/admin/expenses/{id}': {
    delete: {
      tags: ['Admin - Dashboard'],
      summary: 'Xoa mot khoan chi phi',
      security: adminSecurity,
      parameters: idParam,
      responses: { 200: ok('Da xoa', envelope({ type: 'object' })), ...adminErrors, 404: e404 },
    },
  },

  '/admin/support/{id}/status': {
    patch: {
      tags: ['Admin - Dashboard'],
      summary: 'Cap nhat trang thai yeu cau ho tro',
      security: adminSecurity,
      parameters: idParam,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: { type: 'string', enum: ['open', 'in_progress', 'resolved', 'closed'] },
              },
            },
          },
        },
      },
      responses: {
        200: ok('Da cap nhat', envelope({ type: 'object' })),
        400: e400,
        ...adminErrors,
        404: e404,
      },
    },
  },

  // ------------------------------------------------------------- Promotions --
  ...crud({
    tag: 'Admin - Promotions',
    base: '/admin/promotions/vouchers',
    nameSingular: 'ma uu dai',
    schema: 'Voucher',
  }),
  ...crud({
    tag: 'Admin - Promotions',
    base: '/admin/promotions/discounts',
    nameSingular: 'chuong trinh giam gia',
    schema: 'Discount',
  }),
  ...crud({
    tag: 'Admin - Promotions',
    base: '/admin/promotions/flash-sales',
    nameSingular: 'dot gia soc',
    schema: 'FlashSale',
  }),

  '/admin/promotions/price-history': {
    get: {
      tags: ['Admin - Promotions'],
      summary: 'Lich su thay doi gia niem yet',
      description:
        'Phuc vu yeu cau phai chung minh duoc gia goc khi cong bo khuyen mai. Moi lan sua gia niem yet deu sinh mot ban ghi kem thoi diem va nguoi thuc hien.',
      security: adminSecurity,
      parameters: [
        { name: 'variant', in: 'query', schema: ref('ObjectId') },
        { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
      ],
      responses: { 200: ok('Lich su gia', envelope(arrayOf('PriceHistoryEntry'))), ...adminErrors },
    },
  },

  // ---------------------------------------------------------------- Catalog --
  '/admin/products': {
    get: {
      tags: ['Admin - Catalog'],
      summary: 'Danh sach san pham cho khu vuc quan tri',
      description: 'Khac ban cong khai o cho tra ve ca san pham dang an va truong gia von.',
      security: adminSecurity,
      parameters: [
        { $ref: '#/components/parameters/PageQuery' },
        { $ref: '#/components/parameters/LimitQuery' },
        { name: 'search', in: 'query', schema: { type: 'string' } },
      ],
      responses: { 200: ok('Danh sach san pham', envelope(arrayOf('Product'))), ...adminErrors },
    },
    post: {
      tags: ['Admin - Catalog'],
      summary: 'Tao san pham',
      security: adminSecurity,
      requestBody: { required: true, content: json('#/components/schemas/Product') },
      responses: { 201: ok('Da tao', envelope(ref('Product'))), 400: e400, ...adminErrors },
    },
  },

  '/admin/products/{id}': {
    parameters: idParam,
    get: {
      tags: ['Admin - Catalog'],
      summary: 'Chi tiet san pham',
      security: adminSecurity,
      responses: { 200: ok('Chi tiet', envelope(ref('Product'))), ...adminErrors, 404: e404 },
    },
    put: {
      tags: ['Admin - Catalog'],
      summary: 'Cap nhat san pham',
      security: adminSecurity,
      requestBody: { required: true, content: json('#/components/schemas/Product') },
      responses: {
        200: ok('Da cap nhat', envelope(ref('Product'))),
        400: e400,
        ...adminErrors,
        404: e404,
      },
    },
    delete: {
      tags: ['Admin - Catalog'],
      summary: 'Xoa san pham',
      security: adminSecurity,
      responses: { 200: ok('Da xoa', envelope({ type: 'object' })), ...adminErrors, 404: e404 },
    },
  },

  ...crud({
    tag: 'Admin - Catalog',
    base: '/admin/variants',
    nameSingular: 'bien the',
    schema: 'Variant',
  }),

  '/admin/brands': {
    get: {
      tags: ['Admin - Catalog'],
      summary: 'Danh sach thuong hieu',
      security: adminSecurity,
      responses: { 200: ok('Danh sach', envelope(arrayOf('Brand'))), ...adminErrors },
    },
    post: {
      tags: ['Admin - Catalog'],
      summary: 'Tao thuong hieu',
      security: adminSecurity,
      requestBody: { required: true, content: json('#/components/schemas/Brand') },
      responses: { 201: ok('Da tao', envelope(ref('Brand'))), 400: e400, ...adminErrors },
    },
  },

  '/admin/brands/{id}': {
    parameters: idParam,
    get: {
      tags: ['Admin - Catalog'],
      summary: 'Chi tiet thuong hieu',
      security: adminSecurity,
      responses: { 200: ok('Chi tiet', envelope(ref('Brand'))), ...adminErrors, 404: e404 },
    },
    put: {
      tags: ['Admin - Catalog'],
      summary: 'Cap nhat thuong hieu',
      security: adminSecurity,
      requestBody: { required: true, content: json('#/components/schemas/Brand') },
      responses: {
        200: ok('Da cap nhat', envelope(ref('Brand'))),
        400: e400,
        ...adminErrors,
        404: e404,
      },
    },
    delete: {
      tags: ['Admin - Catalog'],
      summary: 'Xoa thuong hieu',
      security: adminSecurity,
      responses: { 200: ok('Da xoa', envelope({ type: 'object' })), ...adminErrors, 404: e404 },
    },
  },

  '/admin/brands/import-defaults': {
    post: {
      tags: ['Admin - Catalog'],
      summary: 'Nap nhanh bo thuong hieu mac dinh',
      description: 'Nhan toi da 200 ban ghi trong mot lan goi.',
      security: adminSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['brands'],
              properties: { brands: { type: 'array', maxItems: 200, items: ref('Brand') } },
            },
          },
        },
      },
      responses: { 200: ok('Da nap', envelope({ type: 'object' })), 400: e400, ...adminErrors },
    },
  },

  ...crud({
    tag: 'Admin - Catalog',
    base: '/admin/categories',
    nameSingular: 'danh muc',
    schema: 'Category',
  }),

  ...crud({
    tag: 'Admin - Content',
    base: '/admin/scent-family-cards',
    nameSingular: 'the nhom huong',
    schema: 'ScentFamilyCard',
  }),

  // ----------------------------------------------------------------- Orders --
  '/admin/orders': {
    get: {
      tags: ['Admin - Orders'],
      summary: 'Danh sach don hang co loc',
      security: adminSecurity,
      parameters: [
        { $ref: '#/components/parameters/PageQuery' },
        { $ref: '#/components/parameters/LimitQuery' },
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['pending', 'shipping', 'done', 'cancelled', 'returned'],
          },
        },
        { name: 'search', in: 'query', schema: { type: 'string' } },
      ],
      responses: { 200: ok('Danh sach don', envelope(arrayOf('Order'))), ...adminErrors },
    },
  },

  '/admin/orders/{id}': {
    get: {
      tags: ['Admin - Orders'],
      summary: 'Chi tiet mot don hang',
      security: adminSecurity,
      parameters: idParam,
      responses: { 200: ok('Chi tiet don', envelope(ref('Order'))), ...adminErrors, 404: e404 },
    },
  },

  '/admin/orders/{id}/status': {
    patch: {
      tags: ['Admin - Orders'],
      summary: 'Cap nhat trang thai giao hang',
      description: 'Trang thai giao hang tach roi hoan toan khoi trang thai thanh toan.',
      security: adminSecurity,
      parameters: idParam,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: {
                  type: 'string',
                  enum: ['pending', 'shipping', 'done', 'cancelled', 'returned'],
                },
                reason: { type: 'string', maxLength: 300 },
              },
            },
          },
        },
      },
      responses: {
        200: ok('Da cap nhat', envelope(ref('Order'))),
        400: e400,
        ...adminErrors,
        404: e404,
      },
    },
  },

  '/admin/orders/{id}/payment': {
    patch: {
      tags: ['Admin - Orders'],
      summary: 'Cap nhat trang thai thanh toan',
      security: adminSecurity,
      parameters: idParam,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: { status: { type: 'string', enum: ['paid', 'unpaid'] } },
            },
          },
        },
      },
      responses: {
        200: ok('Da cap nhat', envelope(ref('Payment'))),
        400: e400,
        ...adminErrors,
        404: e404,
      },
    },
  },

  '/admin/orders/{id}/confirm-payment': {
    post: {
      tags: ['Admin - Orders'],
      summary: 'Xac nhan da nhan duoc tien chuyen khoan',
      description:
        'Buoc thu cong bat buoc trong quy trinh doi soat. Webhook chi day don sang trang thai cho xac nhan, con quyet dinh cuoi cung thuoc ve quan tri vien.',
      security: adminSecurity,
      parameters: idParam,
      responses: {
        200: ok('Da xac nhan thanh toan', envelope(ref('Payment'))),
        ...adminErrors,
        404: e404,
      },
    },
  },

  '/admin/orders/{id}/refund': {
    post: {
      tags: ['Admin - Orders'],
      summary: 'Danh dau don da hoan tien',
      security: adminSecurity,
      parameters: idParam,
      responses: {
        200: ok('Da danh dau hoan tien', envelope(ref('Payment'))),
        ...adminErrors,
        404: e404,
      },
    },
  },

  // ------------------------------------------------------------------ Users --
  '/admin/users': {
    get: {
      tags: ['Admin - Users'],
      summary: 'Danh sach nguoi dung',
      security: adminSecurity,
      parameters: [
        { $ref: '#/components/parameters/PageQuery' },
        { $ref: '#/components/parameters/LimitQuery' },
        { name: 'search', in: 'query', schema: { type: 'string' } },
      ],
      responses: { 200: ok('Danh sach nguoi dung', envelope(arrayOf('User'))), ...adminErrors },
    },
  },

  '/admin/users/{id}/role': {
    patch: {
      tags: ['Admin - Users'],
      summary: 'Doi vai tro nguoi dung',
      security: adminSecurity,
      parameters: idParam,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['role'],
              properties: { role: { type: 'string', enum: ['customer', 'admin'] } },
            },
          },
        },
      },
      responses: {
        200: ok('Da doi vai tro', envelope(ref('User'))),
        400: e400,
        ...adminErrors,
        404: e404,
      },
    },
  },

  '/admin/users/{id}': {
    delete: {
      tags: ['Admin - Users'],
      summary: 'Xoa nguoi dung',
      security: adminSecurity,
      parameters: idParam,
      responses: { 200: ok('Da xoa', envelope({ type: 'object' })), ...adminErrors, 404: e404 },
    },
  },

  '/admin/reviews': {
    get: {
      tags: ['Admin - Users'],
      summary: 'Danh sach danh gia cho kiem duyet',
      security: adminSecurity,
      parameters: [
        {
          name: 'approved',
          in: 'query',
          schema: { type: 'boolean' },
          description: 'Loc theo trang thai duyet',
        },
      ],
      responses: { 200: ok('Danh sach danh gia', envelope(arrayOf('Review'))), ...adminErrors },
    },
  },

  '/admin/reviews/{id}/approve': {
    patch: {
      tags: ['Admin - Users'],
      summary: 'Duyet mot danh gia',
      security: adminSecurity,
      parameters: idParam,
      responses: { 200: ok('Da duyet', envelope(ref('Review'))), ...adminErrors, 404: e404 },
    },
  },

  '/admin/reviews/{id}/reject': {
    patch: {
      tags: ['Admin - Users'],
      summary: 'Tu choi mot danh gia',
      security: adminSecurity,
      parameters: idParam,
      responses: { 200: ok('Da tu choi', envelope(ref('Review'))), ...adminErrors, 404: e404 },
    },
  },

  '/admin/reviews/{id}': {
    delete: {
      tags: ['Admin - Users'],
      summary: 'Xoa mot danh gia',
      security: adminSecurity,
      parameters: idParam,
      responses: { 200: ok('Da xoa', envelope({ type: 'object' })), ...adminErrors, 404: e404 },
    },
  },

  // ---------------------------------------------------------------- Content --
  ...crud({
    tag: 'Admin - Content',
    base: '/admin/blog',
    nameSingular: 'bai viet',
    schema: 'BlogArticle',
  }),

  '/admin/blog/import-defaults': {
    post: {
      tags: ['Admin - Content'],
      summary: 'Nap nhanh bo bai viet mac dinh',
      description: 'Nhan toi da 200 bai trong mot lan goi.',
      security: adminSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['articles'],
              properties: { articles: { type: 'array', maxItems: 200, items: ref('BlogArticle') } },
            },
          },
        },
      },
      responses: { 200: ok('Da nap', envelope({ type: 'object' })), 400: e400, ...adminErrors },
    },
  },

  '/admin/site-content': {
    get: {
      tags: ['Admin - Content'],
      summary: 'Danh sach slot noi dung va anh dang dung',
      security: adminSecurity,
      responses: {
        200: ok('Danh sach slot', envelope(arrayOf('SiteContentItem'))),
        ...adminErrors,
      },
    },
    put: {
      tags: ['Admin - Content'],
      summary: 'Doi anh cua mot slot',
      description:
        'Chi doi duoc anh cua cac khoa slot da khai bao san trong cau hinh, khong tao them khoa moi.',
      security: adminSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['key', 'url'],
              properties: { key: { type: 'string' }, url: { type: 'string', format: 'uri' } },
            },
          },
        },
      },
      responses: {
        200: ok('Da cap nhat', envelope(ref('SiteContentItem'))),
        400: e400,
        ...adminErrors,
      },
    },
  },

  '/admin/site-content/reset': {
    post: {
      tags: ['Admin - Content'],
      summary: 'Tra mot slot ve anh mac dinh',
      security: adminSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['key'],
              properties: { key: { type: 'string', minLength: 1 } },
            },
          },
        },
      },
      responses: {
        200: ok('Da tra ve mac dinh', envelope(ref('SiteContentItem'))),
        400: e400,
        ...adminErrors,
      },
    },
  },

  // ------------------------------------------------------------------ Media --
  '/admin/upload': {
    post: {
      tags: ['Admin - Media'],
      summary: 'Tai mot anh len thu muc mac dinh',
      security: adminSecurity,
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['image'],
              properties: { image: { type: 'string', format: 'binary' } },
            },
          },
        },
      },
      responses: {
        200: { description: 'Da tai len', content: json('#/components/schemas/UploadResult') },
        400: e400,
        ...adminErrors,
      },
    },
  },

  '/admin/upload/{folder}': {
    post: {
      tags: ['Admin - Media'],
      summary: 'Tai mot anh len thu muc chi dinh',
      description:
        'Ten thu muc duoc doi chieu voi danh sach cho phep truoc khi tiep nhan tep, nen khong the dung chuoi vuot cap de ghi ra ngoai pham vi.',
      security: adminSecurity,
      parameters: [
        {
          name: 'folder',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            enum: ['products', 'news', 'brand', 'home', 'about', 'feed back'],
          },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['image'],
              properties: { image: { type: 'string', format: 'binary' } },
            },
          },
        },
      },
      responses: {
        200: { description: 'Da tai len', content: json('#/components/schemas/UploadResult') },
        400: {
          description: 'Thu muc anh khong hop le',
          content: json('#/components/schemas/ApiError'),
        },
        ...adminErrors,
      },
    },
  },

  '/admin/media': {
    get: {
      tags: ['Admin - Media'],
      summary: 'Duyet thu vien anh',
      security: adminSecurity,
      parameters: [
        { name: 'folder', in: 'query', schema: { type: 'string' } },
        { name: 'cursor', in: 'query', schema: { type: 'string' } },
      ],
      responses: { 200: ok('Danh sach anh', envelope({ type: 'object' })), ...adminErrors },
    },
  },

  '/admin/media/status': {
    get: {
      tags: ['Admin - Media'],
      summary: 'Tinh trang ket noi Cloudinary',
      security: adminSecurity,
      responses: {
        200: ok('Tinh trang dich vu anh', envelope({ type: 'object' })),
        ...adminErrors,
      },
    },
  },

  '/admin/media/upload': {
    post: {
      tags: ['Admin - Media'],
      summary: 'Tai nhieu anh len thu muc mac dinh',
      description: 'Toi da 10 tep moi lan, moi tep khong qua 5 MB va bat buoc la anh.',
      security: adminSecurity,
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['images'],
              properties: {
                images: {
                  type: 'array',
                  maxItems: 10,
                  items: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
      },
      responses: {
        200: ok(
          'Danh sach anh da tai len',
          envelope({ type: 'array', items: ref('UploadResult') }),
        ),
        400: e400,
        ...adminErrors,
      },
    },
  },

  '/admin/media/upload/{folder}': {
    post: {
      tags: ['Admin - Media'],
      summary: 'Tai nhieu anh len thu muc chi dinh',
      security: adminSecurity,
      parameters: [
        {
          name: 'folder',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            enum: ['products', 'news', 'brand', 'home', 'about', 'feed back'],
          },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['images'],
              properties: {
                images: {
                  type: 'array',
                  maxItems: 10,
                  items: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
      },
      responses: {
        200: ok(
          'Danh sach anh da tai len',
          envelope({ type: 'array', items: ref('UploadResult') }),
        ),
        400: {
          description: 'Thu muc anh khong hop le',
          content: json('#/components/schemas/ApiError'),
        },
        ...adminErrors,
      },
    },
  },

  '/admin/media/delete': {
    post: {
      tags: ['Admin - Media'],
      summary: 'Xoa anh khoi thu vien',
      security: adminSecurity,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['publicId'],
              properties: { publicId: { type: 'string' } },
            },
          },
        },
      },
      responses: {
        200: ok('Da xoa anh', envelope({ type: 'object' })),
        400: e400,
        ...adminErrors,
        404: e404,
      },
    },
  },
};
