// =============================================================================
//  OpenAPI - Nhom endpoint cong khai va danh cho khach hang
// =============================================================================

const json = (schemaRef: string) => ({
  'application/json': { schema: { $ref: schemaRef } },
});

const ok = (description: string, schema: Record<string, unknown>) => ({
  description,
  content: { 'application/json': { schema } },
});

const envelope = (dataSchema: Record<string, unknown>) => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    data: dataSchema,
  },
});

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const arrayOf = (name: string) => ({ type: 'array', items: ref(name) });

const e400 = { $ref: '#/components/responses/BadRequest' };
const e401 = { $ref: '#/components/responses/Unauthorized' };
const e403 = { $ref: '#/components/responses/Forbidden' };
const e404 = { $ref: '#/components/responses/NotFound' };
const e409 = { $ref: '#/components/responses/Conflict' };
const e429 = { $ref: '#/components/responses/TooManyRequests' };

const auth = [{ bearerAuth: [] }];

export const publicPaths = {
  // ------------------------------------------------------------------ Health --
  '/health': {
    get: {
      tags: ['Health'],
      summary: 'Kiem tra tinh trang dich vu',
      description:
        'Endpoint duy nhat duoc dat truoc bo gioi han tan suat, dung cho health check cua Render va cua Docker.',
      security: [],
      responses: {
        200: ok('Dich vu dang chay', {
          type: 'object',
          properties: { status: { type: 'string', example: 'ok' } },
        }),
      },
    },
  },

  // -------------------------------------------------------------------- Auth --
  '/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Dang ky tai khoan',
      description:
        'Mat khau duoc bam bang bcrypt truoc khi luu. Gioi han 10 lan moi 15 phut theo dia chi IP.',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'email', 'phone', 'password'],
              properties: {
                name: { type: 'string', minLength: 2, example: 'Nguyen Van A' },
                email: { type: 'string', format: 'email', example: 'khach@example.com' },
                phone: { type: 'string', pattern: '^0\\d{9}$', example: '0901234567' },
                password: {
                  type: 'string',
                  example: 'Matkhau@2026',
                  description:
                    'Phai dat toan bo dieu kien cua luoc do mat khau manh. Neu thieu, phan hoi liet ke day du moi dieu kien chua dat.',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Tao tai khoan thanh cong',
          content: json('#/components/schemas/AuthResponse'),
        },
        400: e400,
        409: e409,
        429: e429,
      },
    },
  },

  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Dang nhap',
      description:
        'Tra ve access token trong than phan hoi, dong thoi dat refresh token vao cookie httpOnly va cookie csrfToken.',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Dang nhap thanh cong',
          content: json('#/components/schemas/AuthResponse'),
        },
        400: e400,
        401: e401,
        429: e429,
      },
    },
  },

  '/auth/refresh': {
    post: {
      tags: ['Auth'],
      summary: 'Cap lai access token',
      description:
        'Doc refresh token tu cookie httpOnly. Bat buoc kiem tra CSRF theo co che double submit truoc khi cap token moi.',
      security: [{ refreshCookie: [], csrfToken: [] }],
      responses: {
        200: {
          description: 'Cap token moi thanh cong',
          content: json('#/components/schemas/AuthResponse'),
        },
        401: e401,
        403: {
          description: 'Tieu de X-CSRF-Token khong trung voi cookie csrfToken',
          content: json('#/components/schemas/ApiError'),
        },
      },
    },
  },

  '/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'Dang xuat',
      description:
        'Xoa cookie refresh token va vo hieu hoa ban ghi token da bam trong co so du lieu.',
      security: [{ bearerAuth: [], csrfToken: [] }],
      responses: { 200: ok('Da dang xuat', envelope({ type: 'object' })), 401: e401 },
    },
  },

  '/auth/forgot-password': {
    post: {
      tags: ['Auth'],
      summary: 'Gui ma xac thuc dat lai mat khau qua email',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: { email: { type: 'string', format: 'email' } },
            },
          },
        },
      },
      responses: {
        200: ok('Da gui ma neu email ton tai', envelope({ type: 'object' })),
        400: e400,
        429: e429,
      },
    },
  },

  '/auth/verify-password-reset-email-otp': {
    post: {
      tags: ['Auth'],
      summary: 'Xac minh ma OTP gui qua email',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'otp'],
              properties: {
                email: { type: 'string', format: 'email' },
                otp: { type: 'string', pattern: '^\\d{6}$', example: '123456' },
              },
            },
          },
        },
      },
      responses: {
        200: ok(
          'Ma hop le, tra ve token dat lai mat khau',
          envelope({
            type: 'object',
            properties: { token: { type: 'string' } },
          }),
        ),
        400: e400,
        429: e429,
      },
    },
  },

  '/auth/forgot-password-phone': {
    post: {
      tags: ['Auth'],
      summary: 'Gui ma xac thuc dat lai mat khau qua tin nhan',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['phone'],
              properties: { phone: { type: 'string', pattern: '^0\\d{9}$' } },
            },
          },
        },
      },
      responses: {
        200: ok('Da gui ma', envelope({ type: 'object' })),
        400: e400,
        429: e429,
        502: {
          description: 'Khong ket noi duoc dich vu tin nhan',
          content: json('#/components/schemas/ApiError'),
        },
        503: {
          description: 'Dich vu tin nhan chua duoc cau hinh',
          content: json('#/components/schemas/ApiError'),
        },
      },
    },
  },

  '/auth/verify-password-reset-otp': {
    post: {
      tags: ['Auth'],
      summary: 'Xac minh ma OTP gui qua tin nhan',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['phone', 'otp'],
              properties: {
                phone: { type: 'string', pattern: '^0\\d{9}$' },
                otp: { type: 'string', pattern: '^\\d{6}$' },
              },
            },
          },
        },
      },
      responses: {
        200: ok(
          'Ma hop le',
          envelope({ type: 'object', properties: { token: { type: 'string' } } }),
        ),
        400: e400,
        429: e429,
      },
    },
  },

  '/auth/reset-password': {
    post: {
      tags: ['Auth'],
      summary: 'Dat lai mat khau bang token',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token', 'password'],
              properties: {
                token: { type: 'string', minLength: 10 },
                password: { type: 'string', description: 'Phai dat luoc do mat khau manh' },
              },
            },
          },
        },
      },
      responses: {
        200: ok('Doi mat khau thanh cong', envelope({ type: 'object' })),
        400: e400,
        429: e429,
      },
    },
  },

  '/auth/verify-email': {
    post: {
      tags: ['Auth'],
      summary: 'Xac thuc dia chi email bang token',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token'],
              properties: { token: { type: 'string', minLength: 10 } },
            },
          },
        },
      },
      responses: { 200: ok('Da xac thuc email', envelope({ type: 'object' })), 400: e400 },
    },
  },

  '/auth/me/send-verification': {
    post: {
      tags: ['Auth'],
      summary: 'Gui lai thu xac thuc email cho tai khoan dang dang nhap',
      security: auth,
      responses: { 200: ok('Da gui thu', envelope({ type: 'object' })), 401: e401 },
    },
  },

  '/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'Lay ho so tai khoan dang dang nhap',
      security: auth,
      responses: { 200: ok('Ho so nguoi dung', envelope(ref('User'))), 401: e401 },
    },
    put: {
      tags: ['Auth'],
      summary: 'Cap nhat ho so',
      description:
        'Khi ho so duoc hoan thien lan dau, he thong tu dong phat ma uu dai danh cho thanh vien moi neu tai khoan chua co don hang nao.',
      security: auth,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'email'],
              properties: {
                name: { type: 'string', minLength: 1 },
                email: { type: 'string', format: 'email' },
                phone: { type: 'string', pattern: '^0\\d{9}$' },
              },
            },
          },
        },
      },
      responses: {
        200: ok(
          'Da cap nhat',
          envelope({
            type: 'object',
            properties: {
              user: ref('User'),
              profileJustCompleted: { type: 'boolean' },
              newMemberVoucherIssued: { type: 'string', nullable: true },
            },
          }),
        ),
        400: e400,
        401: e401,
      },
    },
  },

  '/auth/me/password': {
    put: {
      tags: ['Auth'],
      summary: 'Doi mat khau',
      security: auth,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['currentPassword', 'newPassword'],
              properties: {
                currentPassword: { type: 'string', minLength: 1 },
                newPassword: { type: 'string', description: 'Phai dat luoc do mat khau manh' },
              },
            },
          },
        },
      },
      responses: { 200: ok('Da doi mat khau', envelope({ type: 'object' })), 400: e400, 401: e401 },
    },
  },

  '/auth/me/notification-preferences': {
    get: {
      tags: ['Auth'],
      summary: 'Xem tuy chon nhan thong bao',
      security: auth,
      responses: {
        200: ok('Bon tuy chon thong bao', envelope(ref('NotificationPreferences'))),
        401: e401,
      },
    },
    put: {
      tags: ['Auth'],
      summary: 'Cap nhat tuy chon nhan thong bao',
      description: 'Phai gui it nhat mot tuy chon, neu gui doi tuong rong se bi tu choi.',
      security: auth,
      requestBody: {
        required: true,
        content: json('#/components/schemas/NotificationPreferences'),
      },
      responses: {
        200: ok('Da cap nhat', envelope(ref('NotificationPreferences'))),
        400: e400,
        401: e401,
      },
    },
  },

  '/auth/me/addresses': {
    post: {
      tags: ['Auth'],
      summary: 'Them dia chi vao so dia chi',
      description:
        'Bat buoc co so dien thoai, phuong xa, tinh thanh va it nhat mot trong hai truong line hoac detail.',
      security: auth,
      requestBody: { required: true, content: json('#/components/schemas/Address') },
      responses: { 201: ok('Da them dia chi', envelope(arrayOf('Address'))), 400: e400, 401: e401 },
    },
  },

  '/auth/me/addresses/{addressId}': {
    parameters: [{ name: 'addressId', in: 'path', required: true, schema: ref('ObjectId') }],
    put: {
      tags: ['Auth'],
      summary: 'Sua mot dia chi',
      security: auth,
      requestBody: { required: true, content: json('#/components/schemas/Address') },
      responses: {
        200: ok('Da cap nhat', envelope(arrayOf('Address'))),
        400: e400,
        401: e401,
        404: e404,
      },
    },
    delete: {
      tags: ['Auth'],
      summary: 'Xoa mot dia chi',
      security: auth,
      responses: { 200: ok('Da xoa', envelope(arrayOf('Address'))), 401: e401, 404: e404 },
    },
  },

  '/auth/me/addresses/{addressId}/default': {
    patch: {
      tags: ['Auth'],
      summary: 'Dat dia chi mac dinh',
      security: auth,
      parameters: [{ name: 'addressId', in: 'path', required: true, schema: ref('ObjectId') }],
      responses: { 200: ok('Da dat mac dinh', envelope(arrayOf('Address'))), 401: e401, 404: e404 },
    },
  },

  // ----------------------------------------------------------------- Catalog --
  '/categories': {
    get: {
      tags: ['Catalog'],
      summary: 'Danh sach danh muc',
      security: [],
      responses: { 200: ok('Danh sach danh muc', envelope(arrayOf('Category'))) },
    },
  },

  '/brands': {
    get: {
      tags: ['Catalog'],
      summary: 'Danh sach thuong hieu',
      security: [],
      responses: { 200: ok('Danh sach thuong hieu', envelope(arrayOf('Brand'))) },
    },
  },

  '/products': {
    get: {
      tags: ['Catalog'],
      summary: 'Danh sach san pham co loc, sap xep va phan trang',
      description:
        'Toan bo viec loc va phan trang duoc thuc hien phia may chu. Giao dien trang Shop dong bo cac tham so nay vao thanh dia chi de duong dan chia se lai duoc.',
      security: [],
      parameters: [
        { $ref: '#/components/parameters/PageQuery' },
        { $ref: '#/components/parameters/LimitQuery' },
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          description:
            'Ho tro nhieu tu khoa, co/khong dau va tim tren ten, thuong hieu, danh muc, gioi tinh, nhom/not huong, nong do, mua va mo ta. Cac tu khoa co y nghia phai cung khop; ket qua mac dinh duoc uu tien theo do lien quan.',
        },
        {
          name: 'brand',
          in: 'query',
          schema: { type: 'string' },
          description: 'Danh sach thuong hieu, ngan cach bang dau phay',
        },
        {
          name: 'gender',
          in: 'query',
          schema: { type: 'string' },
          description: 'Danh sach gioi tinh, ngan cach bang dau phay',
        },
        {
          name: 'scent',
          in: 'query',
          schema: { type: 'string' },
          description: 'Danh sach nhom huong, ngan cach bang dau phay',
        },
        {
          name: 'excludeNote',
          in: 'query',
          schema: { type: 'string' },
          description: 'Loai tru san pham chua not huong nay',
        },
        {
          name: 'sizes',
          in: 'query',
          schema: { type: 'string' },
          description: 'Danh sach dung tich, ngan cach bang dau phay',
        },
        { name: 'minPrice', in: 'query', schema: { type: 'number' } },
        { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
        {
          name: 'sort',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['newest', 'price-asc', 'price-desc', 'name-asc'],
            default: 'newest',
          },
        },
      ],
      responses: {
        200: ok('Ket qua co phan trang', {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: arrayOf('Product'),
            page: { type: 'integer' },
            totalPages: { type: 'integer' },
            total: { type: 'integer' },
          },
        }),
      },
    },
  },

  '/products/filters': {
    get: {
      tags: ['Catalog'],
      summary: 'Tap gia tri loc tong hop tu toan bo catalog',
      description:
        'Duoc khai bao truoc route tham so de khong bi nuot boi duong dan /products/{idOrSlug}.',
      security: [],
      responses: { 200: ok('Cac gia tri loc kha dung', envelope(ref('ProductFilters'))) },
    },
  },

  '/products/{idOrSlug}': {
    get: {
      tags: ['Catalog'],
      summary: 'Chi tiet san pham theo dinh danh hoac duong dan than thien',
      description:
        'Gia cua tung bien the tra ve la gia da qua bo may phan giai gia, kem nhan uu dai neu co.',
      security: [],
      parameters: [{ name: 'idOrSlug', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: ok('Chi tiet san pham', envelope(ref('Product'))), 404: e404 },
    },
  },

  '/variants': {
    get: {
      tags: ['Catalog'],
      summary: 'Danh sach bien the',
      security: [],
      responses: { 200: ok('Danh sach bien the', envelope(arrayOf('Variant'))) },
    },
    post: {
      tags: ['Catalog'],
      summary: 'Tao bien the moi',
      security: auth,
      requestBody: { required: true, content: json('#/components/schemas/Variant') },
      responses: { 201: ok('Da tao', envelope(ref('Variant'))), 400: e400, 401: e401, 403: e403 },
    },
  },

  '/variants/product/{productId}': {
    get: {
      tags: ['Catalog'],
      summary: 'Danh sach bien the cua mot san pham',
      security: [],
      parameters: [{ name: 'productId', in: 'path', required: true, schema: ref('ObjectId') }],
      responses: { 200: ok('Danh sach bien the', envelope(arrayOf('Variant'))), 404: e404 },
    },
  },

  '/variants/{id}': {
    parameters: [{ $ref: '#/components/parameters/ObjectIdPath' }],
    put: {
      tags: ['Catalog'],
      summary: 'Cap nhat bien the',
      security: auth,
      requestBody: { required: true, content: json('#/components/schemas/Variant') },
      responses: {
        200: ok('Da cap nhat', envelope(ref('Variant'))),
        401: e401,
        403: e403,
        404: e404,
      },
    },
    delete: {
      tags: ['Catalog'],
      summary: 'Xoa bien the',
      security: auth,
      responses: {
        200: ok('Da xoa', envelope({ type: 'object' })),
        401: e401,
        403: e403,
        404: e404,
      },
    },
  },

  '/scent-family-cards': {
    get: {
      tags: ['Content'],
      summary: 'Danh sach the nhom huong hien thi cong khai',
      security: [],
      responses: { 200: ok('Danh sach the', envelope(arrayOf('ScentFamilyCard'))) },
    },
  },

  '/site-content': {
    get: {
      tags: ['Content'],
      summary: 'Anh dong theo khoa slot cho trang chu va trang gioi thieu',
      security: [],
      responses: {
        200: ok('Danh sach slot va duong dan anh', envelope(arrayOf('SiteContentItem'))),
      },
    },
  },

  '/blog': {
    get: {
      tags: ['Content'],
      summary: 'Danh sach bai viet da xuat ban',
      security: [],
      parameters: [
        { $ref: '#/components/parameters/PageQuery' },
        { $ref: '#/components/parameters/LimitQuery' },
      ],
      responses: { 200: ok('Danh sach bai viet', envelope(arrayOf('BlogArticle'))) },
    },
  },

  '/blog/{slug}': {
    get: {
      tags: ['Content'],
      summary: 'Chi tiet mot bai viet',
      security: [],
      parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: ok('Noi dung bai viet', envelope(ref('BlogArticle'))), 404: e404 },
    },
  },

  '/blog/subscribe': {
    post: {
      tags: ['Content'],
      summary: 'Dang ky nhan ban tin',
      description:
        'Dia chi email duoc chuan hoa ve chu thuong truoc khi luu, tranh tao ban ghi trung.',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: { email: { type: 'string', format: 'email' } },
            },
          },
        },
      },
      responses: { 200: ok('Da dang ky', envelope({ type: 'object' })), 400: e400 },
    },
  },

  '/support': {
    post: {
      tags: ['Content'],
      summary: 'Gui yeu cau lien he va ho tro',
      description:
        'Khach vang lai gui duoc cac yeu cau thong thuong. Loai returns yeu cau quyen truy cap cua tai khoan hoac X-Guest-Order-Token, don COD/QR da giao va da thanh toan, con trong 3 ngay ke tu completedAt.',
      security: [],
      parameters: [
        {
          name: 'X-Guest-Order-Token',
          in: 'header',
          required: false,
          schema: { type: 'string' },
          description: 'Ma truy cap cho don mua khi chua dang nhap; chi dung voi type=returns.',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'email', 'subject', 'message'],
              properties: {
                name: { type: 'string', minLength: 2, maxLength: 100 },
                email: { type: 'string', format: 'email' },
                subject: { type: 'string', minLength: 1, maxLength: 150 },
                type: {
                  type: 'string',
                  enum: ['general', 'product', 'order', 'returns', 'press', 'other'],
                },
                orderId: ref('ObjectId'),
                message: { type: 'string', minLength: 5, maxLength: 5000 },
              },
            },
          },
        },
      },
      responses: { 201: ok('Da ghi nhan yeu cau', envelope({ type: 'object' })), 400: e400 },
    },
  },

  // ----------------------------------------------------------------- Reviews --
  '/reviews/product/{productId}': {
    get: {
      tags: ['Reviews'],
      summary: 'Danh sach danh gia da duyet cua mot san pham',
      security: [],
      parameters: [{ name: 'productId', in: 'path', required: true, schema: ref('ObjectId') }],
      responses: { 200: ok('Danh sach danh gia', envelope(arrayOf('Review'))), 404: e404 },
    },
  },

  '/reviews': {
    post: {
      tags: ['Reviews'],
      summary: 'Gui danh gia san pham',
      description:
        'Ghi chu trung thuc: endpoint nay hien khong yeu cau dang nhap va khong kiem tra nguoi gui da mua hang hay chua. Danh gia moi mac dinh chua duyet nen chua hien thi cong khai. Rang buoc quyen gui la han che da duoc ghi nhan trong bao cao.',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['product', 'rating'],
              properties: {
                product: ref('ObjectId'),
                name: { type: 'string' },
                rating: { type: 'integer', minimum: 1, maximum: 5 },
                comment: { type: 'string' },
                images: { type: 'array', items: { type: 'string', format: 'uri' } },
              },
            },
          },
        },
      },
      responses: { 201: ok('Da gui, cho duyet', envelope(ref('Review'))), 400: e400 },
    },
  },

  // -------------------------------------------------------------------- Cart --
  '/cart': {
    get: {
      tags: ['Cart'],
      summary: 'Lay gio hang cua toi',
      security: auth,
      responses: { 200: ok('Gio hang', envelope(ref('Cart'))), 401: e401 },
    },
    delete: {
      tags: ['Cart'],
      summary: 'Xoa toan bo gio hang',
      security: auth,
      responses: { 200: ok('Da xoa sach gio', envelope(ref('Cart'))), 401: e401 },
    },
  },

  '/cart/items': {
    post: {
      tags: ['Cart'],
      summary: 'Them mot bien the vao gio',
      security: auth,
      requestBody: { required: true, content: json('#/components/schemas/PriceQuoteItem') },
      responses: {
        200: ok('Gio sau khi them', envelope(ref('Cart'))),
        400: e400,
        401: e401,
        409: e409,
      },
    },
  },

  '/cart/items/{variantId}': {
    parameters: [{ name: 'variantId', in: 'path', required: true, schema: ref('ObjectId') }],
    put: {
      tags: ['Cart'],
      summary: 'Doi so luong mot dong trong gio',
      security: auth,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['quantity'],
              properties: { quantity: { type: 'integer', minimum: 1 } },
            },
          },
        },
      },
      responses: {
        200: ok('Gio sau khi cap nhat', envelope(ref('Cart'))),
        400: e400,
        401: e401,
        404: e404,
      },
    },
    delete: {
      tags: ['Cart'],
      summary: 'Xoa mot dong khoi gio',
      security: auth,
      responses: { 200: ok('Gio sau khi xoa', envelope(ref('Cart'))), 401: e401, 404: e404 },
    },
  },

  '/cart/merge': {
    post: {
      tags: ['Cart'],
      summary: 'Dong bo gio luu tren trinh duyet len may chu',
      description:
        'Duoc goi ngay sau khi dang nhap de khach khong mat cac san pham da chon luc chua dang nhap.',
      security: auth,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { items: { type: 'array', items: ref('PriceQuoteItem') } },
            },
          },
        },
      },
      responses: { 200: ok('Gio sau khi hop nhat', envelope(ref('Cart'))), 400: e400, 401: e401 },
    },
  },

  // ------------------------------------------------------------------ Orders --
  '/orders/price-preview': {
    post: {
      tags: ['Orders'],
      summary: 'Bao gia truoc khi dat hang',
      description:
        'Diem vao duy nhat de lay moi con so hien tren man hinh thanh toan. Giao dien khong tu tinh lai bat ky gia tri nao. Neu ma uu dai khong dung duoc, phan hoi van thanh cong nhung kem truong voucherError mo ta ly do bang tieng Viet.',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['items'],
              properties: {
                items: { type: 'array', minItems: 1, items: ref('PriceQuoteItem') },
                voucherCode: { type: 'string' },
                shippingMethod: { type: 'string', enum: ['standard', 'express'] },
                email: { type: 'string', format: 'email' },
              },
            },
          },
        },
      },
      responses: { 200: ok('Ket qua bao gia', envelope(ref('PriceQuote'))), 400: e400 },
    },
  },

  '/orders/check-stock': {
    post: {
      tags: ['Orders'],
      summary: 'Kiem tra ton kho cua gio truoc khi thanh toan',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { items: { type: 'array', items: ref('PriceQuoteItem') } },
            },
          },
        },
      },
      responses: {
        200: ok(
          'Ket qua kiem tra tung dong',
          envelope({
            type: 'object',
            properties: {
              available: { type: 'boolean' },
              issues: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    variant: ref('ObjectId'),
                    requested: { type: 'integer' },
                    available: { type: 'integer' },
                  },
                },
              },
            },
          }),
        ),
        400: e400,
      },
    },
  },

  '/orders/checkout-preview': {
    get: {
      tags: ['Orders'],
      summary: 'Du lieu khoi tao man hinh thanh toan cho thanh vien',
      description: 'Tra ve gio hien tai, so dia chi va bao gia so bo trong mot lan goi.',
      security: auth,
      responses: { 200: ok('Du lieu khoi tao', envelope({ type: 'object' })), 401: e401 },
    },
  },

  '/orders/lookup': {
    get: {
      tags: ['Orders'],
      summary: 'Tra cuu don danh cho khach vang lai',
      description:
        'Gioi han 10 lan tra cuu moi 15 phut theo dia chi IP de chong do thong tin don hang.',
      security: [],
      parameters: [
        {
          name: 'q',
          in: 'query',
          required: true,
          schema: { type: 'string', minLength: 3, maxLength: 120 },
          description: 'Ma don, so dien thoai hoac dia chi email dat hang',
        },
      ],
      responses: {
        200: ok('Danh sach don khop', envelope(arrayOf('Order'))),
        400: e400,
        429: e429,
      },
    },
  },

  '/orders': {
    get: {
      tags: ['Orders'],
      summary: 'Danh sach don hang cua toi',
      security: auth,
      parameters: [
        { $ref: '#/components/parameters/PageQuery' },
        { $ref: '#/components/parameters/LimitQuery' },
      ],
      responses: { 200: ok('Danh sach don', envelope(arrayOf('Order'))), 401: e401 },
    },
    post: {
      tags: ['Orders'],
      summary: 'Tao don hang',
      description:
        'Cho phep ca khach vang lai. Gia luon duoc tinh lai tren may chu, khong tin gia do phia giao dien gui len. Ton kho duoc tru co dieu kien nen khong bao gio am. Toan bo thao tac nam trong mot giao dich; neu moi truong khong ho tro giao dich, he thong chuyen sang nhanh hoan tac thu cong theo thu tu nguoc.',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['address'],
              properties: {
                method: { type: 'string', enum: ['cod', 'bank_qr'], default: 'cod' },
                shippingMethod: { type: 'string', enum: ['standard', 'express'] },
                address: ref('Address'),
                note: { type: 'string', maxLength: 500 },
                items: { type: 'array', items: ref('PriceQuoteItem') },
                voucherCode: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        201: ok('Da tao don', envelope(ref('Order'))),
        400: e400,
        409: {
          description: 'Het ton kho hoac het suat gia soc',
          content: json('#/components/schemas/ApiError'),
        },
      },
    },
  },

  '/orders/{id}': {
    get: {
      tags: ['Orders'],
      summary: 'Chi tiet mot don hang',
      description:
        'Tai khoan phai so huu don. Guest phai gui token da nhan khi tao don qua X-Guest-Order-Token.',
      security: [],
      parameters: [
        { $ref: '#/components/parameters/ObjectIdPath' },
        { name: 'X-Guest-Order-Token', in: 'header', required: false, schema: { type: 'string' } },
      ],
      responses: { 200: ok('Chi tiet don', envelope(ref('Order'))), 403: e403, 404: e404 },
    },
  },

  '/orders/{id}/payment': {
    get: {
      tags: ['Orders'],
      summary: 'Thong tin thanh toan va ma VietQR cua don',
      security: [],
      parameters: [
        { $ref: '#/components/parameters/ObjectIdPath' },
        { name: 'X-Guest-Order-Token', in: 'header', required: false, schema: { type: 'string' } },
      ],
      responses: { 200: ok('Thong tin thanh toan', envelope(ref('PaymentInfo'))), 404: e404 },
    },
  },

  '/orders/{id}/cancel': {
    post: {
      tags: ['Orders'],
      summary: 'Huy don va hoan ton kho',
      description:
        'Chi chu don da dang nhap moi huy duoc, va chi khi don con o trang thai cho phep huy.',
      security: auth,
      parameters: [{ $ref: '#/components/parameters/ObjectIdPath' }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { reason: { type: 'string', maxLength: 300 } },
            },
          },
        },
      },
      responses: {
        200: ok('Da huy don', envelope(ref('Order'))),
        400: e400,
        401: e401,
        403: e403,
        404: e404,
      },
    },
  },

  '/orders/{id}/cancel-pending-qr': {
    post: {
      tags: ['Orders'],
      summary: 'Huy don chuyen khoan chua thanh toan',
      description:
        'Tai khoan phai so huu don. Guest phai gui token da nhan khi tao don qua X-Guest-Order-Token.',
      security: [],
      parameters: [
        { $ref: '#/components/parameters/ObjectIdPath' },
        { name: 'X-Guest-Order-Token', in: 'header', required: false, schema: { type: 'string' } },
      ],
      responses: { 200: ok('Da huy don', envelope(ref('Order'))), 400: e400, 404: e404 },
    },
  },

  // ------------------------------------------------------- Payment webhooks --
  '/payment-webhooks/sepay': {
    post: {
      tags: ['Payment Webhooks'],
      summary: 'Nhan thong bao bien dong so du tu SePay',
      description:
        'Chu ky HMAC SHA256 duoc tinh tren chuoi ghep gom nhan thoi gian va than yeu cau nguyen ban, so sanh theo thoi gian hang so. Yeu cau qua 300 giay bi tu choi de chong phat lai. Webhook chi ghi nhan giao dich va day don sang trang thai cho quan tri vien xac nhan, khong tu dong danh dau da thanh toan.',
      security: [],
      parameters: [
        {
          name: 'X-SePay-Signature',
          in: 'header',
          required: true,
          schema: { type: 'string', example: 'sha256=9f86d0818...' },
        },
        {
          name: 'X-SePay-Timestamp',
          in: 'header',
          required: true,
          schema: { type: 'string', example: '1785312000' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Dinh danh giao dich, dung de chong ghi trung' },
                transferType: { type: 'string', enum: ['in', 'out'] },
                transferAmount: { type: 'number' },
                accountNumber: { type: 'string' },
                content: { type: 'string', example: 'HOC6650F1C2A9B3D41F8C0E7A12' },
              },
            },
          },
        },
      },
      responses: {
        200: ok('Da xu ly hoac da bo qua kem ly do', {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            reason: {
              type: 'string',
              nullable: true,
              enum: [
                'missing_transaction_id',
                'not_incoming',
                'wrong_account',
                'order_code_not_found',
                'order_not_payable',
                'payment_not_found',
                'amount_mismatch',
              ],
            },
          },
        }),
        401: {
          description: 'Chu ky sai hoac yeu cau da qua han 300 giay',
          content: json('#/components/schemas/ApiError'),
        },
      },
    },
  },

  // ----------------------------------------------------------------- Account --
  '/account/orders': {
    get: {
      tags: ['Account'],
      summary: 'Lich su don hang trong khu vuc tai khoan',
      security: auth,
      responses: { 200: ok('Danh sach don', envelope(arrayOf('Order'))), 401: e401 },
    },
  },

  '/account/wishlist': {
    get: {
      tags: ['Account'],
      summary: 'Danh sach san pham yeu thich',
      security: auth,
      responses: { 200: ok('Danh sach yeu thich', envelope(arrayOf('Product'))), 401: e401 },
    },
  },

  '/account/wishlist/{productId}': {
    parameters: [{ name: 'productId', in: 'path', required: true, schema: ref('ObjectId') }],
    post: {
      tags: ['Account'],
      summary: 'Them san pham vao danh sach yeu thich',
      security: auth,
      responses: {
        200: ok('Da them', envelope(arrayOf('Product'))),
        400: e400,
        401: e401,
        404: e404,
      },
    },
    delete: {
      tags: ['Account'],
      summary: 'Bo san pham khoi danh sach yeu thich',
      security: auth,
      responses: { 200: ok('Da bo', envelope(arrayOf('Product'))), 401: e401, 404: e404 },
    },
  },

  '/account/scent-profile': {
    get: {
      tags: ['Account'],
      summary: 'Ho so mui huong ca nhan',
      security: auth,
      responses: { 200: ok('Ho so mui huong', envelope({ type: 'object' })), 401: e401 },
    },
    put: {
      tags: ['Account'],
      summary: 'Cap nhat ho so mui huong',
      security: auth,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                families: { type: 'array', maxItems: 50, items: { type: 'string' } },
                preferredNotes: { type: 'array', maxItems: 600, items: { type: 'string' } },
                dislikedNotes: { type: 'array', maxItems: 600, items: { type: 'string' } },
              },
            },
          },
        },
      },
      responses: { 200: ok('Da cap nhat', envelope({ type: 'object' })), 400: e400, 401: e401 },
    },
  },

  // ------------------------------------------------------------------ Upload --
  '/upload/review': {
    post: {
      tags: ['Upload'],
      summary: 'Tai anh dinh kem danh gia',
      security: auth,
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
        401: e401,
      },
    },
  },
};
