// =============================================================================
//  OpenAPI - Khoi mo ta dung chung (tags, securitySchemes, schemas, responses)
//  Duoc gop vao spec cuoi cung tai src/config/swagger.ts
// =============================================================================

export const tags = [
  { name: 'Health', description: 'Kiem tra tinh trang dich vu' },
  { name: 'Auth', description: 'Dang ky, dang nhap, token, ho so ca nhan, so dia chi' },
  { name: 'Catalog', description: 'Danh muc, thuong hieu, san pham, bien the (cong khai)' },
  { name: 'Reviews', description: 'Danh gia san pham' },
  { name: 'Cart', description: 'Gio hang cua thanh vien' },
  { name: 'Orders', description: 'Bao gia, dat hang, tra cuu, huy don, thong tin thanh toan' },
  { name: 'Payment Webhooks', description: 'Webhook doi soat chuyen khoan tu SePay' },
  { name: 'Account', description: 'Khu vuc tai khoan: don hang, yeu thich, ho so mui huong' },
  { name: 'Content', description: 'Blog, noi dung trang, the nhom huong, lien he ho tro' },
  { name: 'Upload', description: 'Tai anh len Cloudinary' },
  { name: 'Admin - Dashboard', description: 'Thong ke, tim kiem, thong bao, bao cao, chi phi' },
  {
    name: 'Admin - Promotions',
    description: 'Voucher, discount, flash sale, lich su gia niem yet',
  },
  { name: 'Admin - Catalog', description: 'Quan tri san pham, bien the, thuong hieu, danh muc' },
  { name: 'Admin - Orders', description: 'Quan tri don hang va thanh toan' },
  { name: 'Admin - Users', description: 'Quan tri nguoi dung va danh gia' },
  { name: 'Admin - Content', description: 'Quan tri blog, noi dung trang, the nhom huong' },
  { name: 'Admin - Media', description: 'Quan ly thu vien anh Cloudinary' },
];

const objectId = {
  type: 'string',
  pattern: '^[0-9a-fA-F]{24}$',
  example: '6650f1c2a9b3d41f8c0e7a12',
};

export const components = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description:
        'Access token JWT, han dung 15 phut. Nhan duoc tu POST /auth/login hoac POST /auth/refresh. Gui kem theo tieu de: Authorization: Bearer <token>.',
    },
    refreshCookie: {
      type: 'apiKey',
      in: 'cookie',
      name: 'refreshToken',
      description:
        'Refresh token han 7 ngay, luu trong cookie httpOnly gioi han duong dan /api/auth. Trinh duyet tu gui, ma JavaScript khong doc duoc.',
    },
    csrfToken: {
      type: 'apiKey',
      in: 'header',
      name: 'X-CSRF-Token',
      description:
        'Chong CSRF theo co che double submit. Gia tri phai trung voi cookie csrfToken. Bat buoc cho POST /auth/refresh va POST /auth/logout.',
    },
  },

  parameters: {
    ObjectIdPath: {
      name: 'id',
      in: 'path',
      required: true,
      schema: objectId,
      description: 'Dinh danh 24 ky tu thap luc phan',
    },
    PageQuery: {
      name: 'page',
      in: 'query',
      schema: { type: 'integer', minimum: 1, default: 1 },
      description: 'Trang can lay, bat dau tu 1',
    },
    LimitQuery: {
      name: 'limit',
      in: 'query',
      schema: { type: 'integer', minimum: 1, maximum: 100, default: 12 },
      description: 'So ban ghi moi trang',
    },
  },

  schemas: {
    ObjectId: objectId,

    ApiError: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Khong tim thay tai nguyen' },
      },
    },

    ValidationError: {
      type: 'object',
      description: 'Loi do middleware validate tra ve khi du lieu dau vao khong dat luoc do Zod',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Du lieu khong hop le' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string', example: 'email' },
              message: { type: 'string', example: 'Email khong hop le' },
            },
          },
        },
      },
    },

    Pagination: {
      type: 'object',
      properties: {
        page: { type: 'integer', example: 1 },
        limit: { type: 'integer', example: 12 },
        total: { type: 'integer', example: 148 },
        totalPages: { type: 'integer', example: 13 },
      },
    },

    Address: {
      type: 'object',
      required: ['phone', 'ward', 'province'],
      properties: {
        _id: objectId,
        label: { type: 'string', example: 'Nha rieng' },
        fullName: { type: 'string', example: 'Nguyen Van A' },
        phone: {
          type: 'string',
          pattern: '^0\\d{9}$',
          example: '0901234567',
          description: 'Bat dau bang so 0 va gom dung 10 chu so',
        },
        line: { type: 'string', example: '12 Nguyen Thi Minh Khai' },
        ward: { type: 'string', example: 'Phuong 1' },
        district: { type: 'string', example: 'Quan 1' },
        province: { type: 'string', example: 'Thanh pho Ho Chi Minh' },
        isDefault: { type: 'boolean', example: true },
      },
    },

    NotificationPreferences: {
      type: 'object',
      properties: {
        orderNotifications: { type: 'boolean', example: true },
        emailNotifications: { type: 'boolean', example: true },
        promotionNotifications: { type: 'boolean', example: true },
        journalNotifications: { type: 'boolean', example: true },
      },
    },

    User: {
      type: 'object',
      properties: {
        _id: objectId,
        name: { type: 'string', example: 'Nguyen Van A' },
        email: { type: 'string', format: 'email', example: 'khach@example.com' },
        phone: { type: 'string', example: '0901234567' },
        role: { type: 'string', enum: ['customer', 'admin'], example: 'customer' },
        emailVerified: { type: 'boolean', example: false },
        addresses: { type: 'array', items: { $ref: '#/components/schemas/Address' } },
        notificationPreferences: { $ref: '#/components/schemas/NotificationPreferences' },
        profileCompletedAt: { type: 'string', format: 'date-time', nullable: true },
        profileCompletionVoucherCode: { type: 'string', nullable: true, example: 'WELCOME10' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },

    AuthResponse: {
      type: 'object',
      description:
        'Refresh token khong nam trong than phan hoi ma duoc dat vao cookie httpOnly. Cookie csrfToken cung duoc dat kem trong cung phan hoi.',
      properties: {
        success: { type: 'boolean', example: true },
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          description: 'JWT han 15 phut',
        },
        user: { $ref: '#/components/schemas/User' },
      },
    },

    Category: {
      type: 'object',
      properties: {
        _id: objectId,
        name: { type: 'string', example: 'Nuoc hoa nam' },
        slug: { type: 'string', example: 'nuoc-hoa-nam' },
      },
    },

    Brand: {
      type: 'object',
      properties: {
        _id: objectId,
        name: { type: 'string', example: 'Maison Francis Kurkdjian' },
        slug: { type: 'string', example: 'maison-francis-kurkdjian' },
        logo: { type: 'string', format: 'uri', nullable: true },
        description: { type: 'string', nullable: true },
        isActive: { type: 'boolean', example: true },
      },
    },

    Variant: {
      type: 'object',
      description:
        'Bien the theo dung tich. Truong basePrice la gia niem yet goc, price la gia sau khi bo may phan giai gia xu ly.',
      properties: {
        _id: objectId,
        product: objectId,
        sku: { type: 'string', example: 'MFK-BR540-70' },
        size: { type: 'number', example: 70, description: 'Dung tich tinh theo ml' },
        basePrice: { type: 'number', example: 8900000 },
        price: { type: 'number', example: 7565000, description: 'Gia sau uu dai' },
        costPrice: {
          type: 'number',
          example: 6100000,
          description: 'Gia von, chi tra ve cho admin',
        },
        stock: { type: 'integer', example: 12 },
        promotionType: {
          type: 'string',
          nullable: true,
          enum: ['flash_sale', 'product_discount', 'category_discount', null],
          description: 'Nguon uu dai dang ap. Gia tri null nghia la ban theo gia niem yet.',
        },
        flashRemaining: {
          type: 'integer',
          nullable: true,
          example: 8,
          description: 'So suat gia soc con lai, chi co khi promotionType la flash_sale',
        },
        isActive: { type: 'boolean', example: true },
      },
    },

    Product: {
      type: 'object',
      properties: {
        _id: objectId,
        name: { type: 'string', example: 'Baccarat Rouge 540 Extrait' },
        slug: { type: 'string', example: 'baccarat-rouge-540-extrait' },
        description: { type: 'string' },
        brand: { $ref: '#/components/schemas/Brand' },
        category: { $ref: '#/components/schemas/Category' },
        gender: { type: 'string', enum: ['male', 'female', 'unisex'], example: 'unisex' },
        fragranceFamily: { type: 'string', example: 'Amber Woody' },
        topNotes: {
          type: 'array',
          items: { type: 'string' },
          example: ['Saffron', 'Bitter Almond'],
        },
        middleNotes: { type: 'array', items: { type: 'string' } },
        baseNotes: { type: 'array', items: { type: 'string' } },
        images: { type: 'array', items: { type: 'string', format: 'uri' } },
        variants: { type: 'array', items: { $ref: '#/components/schemas/Variant' } },
        ratingAverage: { type: 'number', example: 4.6 },
        ratingCount: { type: 'integer', example: 23 },
        isActive: { type: 'boolean', example: true },
      },
    },

    ProductFilters: {
      type: 'object',
      description:
        'Tap gia tri loc duoc tong hop tu toan bo catalog, dung de dung thanh loc trang Shop',
      properties: {
        brands: { type: 'array', items: { type: 'string' } },
        genders: { type: 'array', items: { type: 'string' } },
        fragranceFamilies: { type: 'array', items: { type: 'string' } },
        notes: { type: 'array', items: { type: 'string' } },
        sizes: { type: 'array', items: { type: 'number' } },
        minPrice: { type: 'number', example: 450000 },
        maxPrice: { type: 'number', example: 12500000 },
        brandCounts: {
          type: 'object',
          additionalProperties: { type: 'integer' },
          example: { Dior: 14, Chanel: 9 },
        },
      },
    },

    Review: {
      type: 'object',
      properties: {
        _id: objectId,
        product: objectId,
        name: { type: 'string', example: 'Minh Anh' },
        rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
        comment: { type: 'string' },
        images: { type: 'array', items: { type: 'string', format: 'uri' } },
        approved: {
          type: 'boolean',
          example: false,
          description: 'Danh gia moi mac dinh chua duyet nen chua hien thi cong khai',
        },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },

    CartItem: {
      type: 'object',
      properties: {
        variant: { $ref: '#/components/schemas/Variant' },
        quantity: { type: 'integer', minimum: 1, example: 2 },
      },
    },

    Cart: {
      type: 'object',
      properties: {
        _id: objectId,
        user: objectId,
        items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },

    PriceQuoteItem: {
      type: 'object',
      required: ['variant', 'quantity'],
      properties: {
        variant: objectId,
        quantity: { type: 'integer', minimum: 1, example: 1 },
      },
    },

    PriceQuote: {
      type: 'object',
      description:
        'Ket qua bo may phan giai gia. Gia san pham da bao gom VAT; finalTotal khong cong them VAT. vatIncluded chi duoc boc nguoc tu subtotal san pham, khong thay doi theo voucher o cap don hang hoac phi van chuyen.',
      required: ['vatRate', 'vatIncluded', 'pricesIncludeVat', 'finalTotal'],
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variant: objectId,
              quantity: { type: 'integer' },
              basePrice: { type: 'number' },
              unitPrice: { type: 'number' },
              promotionType: { type: 'string', nullable: true },
              lineTotal: { type: 'number' },
            },
          },
        },
        subtotal: { type: 'number', example: 7565000 },
        voucherCode: { type: 'string', nullable: true, example: 'SALE10' },
        voucherDiscount: {
          type: 'number',
          example: 500000,
          description: 'Da bi chan tran o muc 50 phan tram tam tinh',
        },
        shippingMethod: { type: 'string', enum: ['standard', 'express'] },
        shippingFee: { type: 'number', example: 35000 },
        vatRate: {
          type: 'number',
          example: 0.1,
          description: 'Thue suat dang thap phan; 0.1 tuong ung 10 phan tram.',
        },
        vatIncluded: {
          type: 'number',
          example: 687727,
          description:
            'Phan VAT da nam trong subtotal san pham; khong bi anh huong boi voucher o cap don hang hoac phi van chuyen va khong cong them vao finalTotal.',
        },
        pricesIncludeVat: { type: 'boolean', example: true },
        finalTotal: {
          type: 'number',
          example: 7100000,
          description: 'So tien thuc tra sau khuyen mai va phi van chuyen; da bao gom VAT.',
        },
        voucherError: {
          type: 'string',
          nullable: true,
          example: 'Ma giam gia khong the dung chung voi uu dai san pham',
        },
      },
    },

    OrderItem: {
      type: 'object',
      description:
        'Anh chup tai thoi diem mua. Cac truong nay khong thay doi khi san pham hoac chuong trinh uu dai duoc sua ve sau.',
      properties: {
        variant: objectId,
        productName: { type: 'string', example: 'Baccarat Rouge 540 Extrait' },
        size: { type: 'number', example: 70 },
        sku: { type: 'string' },
        quantity: { type: 'integer', example: 1 },
        basePrice: { type: 'number', example: 8900000 },
        unitPrice: { type: 'number', example: 7565000 },
        promotionType: { type: 'string', nullable: true },
        costPrice: {
          type: 'number',
          description: 'Gia von tai thoi diem mua, phuc vu bao cao loi nhuan',
        },
        image: { type: 'string', format: 'uri' },
      },
    },

    Order: {
      type: 'object',
      properties: {
        _id: objectId,
        code: {
          type: 'string',
          example: 'A1B2C3',
          description:
            'Sau ky tu cuoi cua dinh danh, viet hoa, dung de tra cuu va ghi trong noi dung chuyen khoan',
        },
        user: { ...objectId, nullable: true, description: 'Rong neu la don cua khach vang lai' },
        items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
        address: { $ref: '#/components/schemas/Address' },
        note: { type: 'string', nullable: true },
        status: {
          type: 'string',
          enum: ['pending', 'shipping', 'done', 'cancelled', 'returned'],
          example: 'pending',
        },
        method: { type: 'string', enum: ['cod', 'bank_qr'] },
        shippingMethod: { type: 'string', enum: ['standard', 'express'] },
        subtotal: { type: 'number' },
        voucherCode: { type: 'string', nullable: true },
        voucherDiscount: { type: 'number' },
        shippingFee: { type: 'number' },
        vatRate: {
          type: 'number',
          nullable: true,
          description: 'Snapshot thue suat cua don moi. Co the vang mat o don lich su.',
        },
        vatIncluded: {
          type: 'number',
          nullable: true,
          description:
            'VAT da nam trong gia san pham tai thoi diem dat hang. Co the vang mat o don lich su.',
        },
        pricesIncludeVat: {
          type: 'boolean',
          nullable: true,
          description: 'Co the vang mat o don lich su khong duoc backfill VAT.',
        },
        total: { type: 'number', description: 'Tong tien thuc tra, da bao gom VAT voi don moi.' },
        cancelReason: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },

    Payment: {
      type: 'object',
      properties: {
        _id: objectId,
        order: objectId,
        method: { type: 'string', enum: ['cod', 'bank_qr'] },
        status: {
          type: 'string',
          enum: ['unpaid', 'partial', 'paid', 'refund_pending', 'refunded'],
          description:
            'Webhook chi day trang thai len awaiting_admin_confirmation; chi quan tri vien moi chuyen sang paid.',
        },
        amount: { type: 'number' },
        receivedAmount: { type: 'number' },
        excessAmount: { type: 'number' },
        reconciliationStatus: {
          type: 'string',
          enum: [
            'awaiting_payment',
            'partial',
            'awaiting_confirmation',
            'overpaid',
            'confirmed',
            'late_payment',
          ],
        },
        refundStatus: { type: 'string', enum: ['none', 'pending', 'refunded'] },
        refundAmount: { type: 'number' },
        providerTransactionId: { type: 'string', nullable: true },
      },
    },

    PaymentInfo: {
      type: 'object',
      properties: {
        method: { type: 'string', enum: ['cod', 'bank_qr'] },
        amount: { type: 'number', example: 7100000 },
        transferContent: {
          type: 'string',
          example: 'HOC6650F1C2A9B3D41F8C0E7A12',
          description: 'Noi dung chuyen khoan bat buoc, gan dinh danh don de doi soat tu dong',
        },
        qrUrl: {
          type: 'string',
          format: 'uri',
          example: 'https://img.vietqr.io/image/...',
          description: 'Anh ma VietQR sinh tu ma ngan hang, so tai khoan va so tien',
        },
        bankName: { type: 'string' },
        accountNo: { type: 'string' },
        accountName: { type: 'string' },
      },
    },

    BlogArticle: {
      type: 'object',
      properties: {
        _id: objectId,
        title: { type: 'string' },
        slug: { type: 'string' },
        excerpt: { type: 'string' },
        content: { type: 'string' },
        coverImage: { type: 'string', format: 'uri' },
        publishedAt: { type: 'string', format: 'date-time' },
        isPublished: { type: 'boolean' },
      },
    },

    ScentFamilyCard: {
      type: 'object',
      properties: {
        _id: objectId,
        name: { type: 'string', example: 'Amber Woody' },
        description: { type: 'string' },
        image: { type: 'string', format: 'uri' },
        order: { type: 'integer' },
        isActive: { type: 'boolean' },
      },
    },

    SiteContentItem: {
      type: 'object',
      description:
        'Anh dong theo khoa slot da khai bao san trong cau hinh, quan tri vien chi thay duoc anh',
      properties: {
        key: {
          type: 'string',
          enum: [
            'home_hero',
            'home_banner',
            'about_hero',
            'about_heritage_lab',
            'about_heritage_hands',
            'about_perfumer',
            'about_sustainable_drop',
          ],
        },
        label: { type: 'string' },
        group: { type: 'string' },
        url: { type: 'string', format: 'uri' },
      },
    },

    Voucher: {
      type: 'object',
      properties: {
        _id: objectId,
        code: { type: 'string', example: 'SALE10' },
        type: { type: 'string', enum: ['percent', 'fixed'] },
        value: { type: 'number', example: 10 },
        maxDiscount: { type: 'number', nullable: true },
        minOrder: { type: 'number', nullable: true },
        stackable: {
          type: 'boolean',
          description: 'Neu bang false thi bi chan khi don da co uu dai o tang san pham',
        },
        appliesToNewMembers: { type: 'boolean' },
        usageLimit: { type: 'integer', nullable: true },
        usedCount: { type: 'integer' },
        startTime: { type: 'string', format: 'date-time' },
        endTime: { type: 'string', format: 'date-time' },
        isActive: { type: 'boolean' },
      },
    },

    Discount: {
      type: 'object',
      properties: {
        _id: objectId,
        name: { type: 'string' },
        scope: { type: 'string', enum: ['product', 'category'] },
        target: objectId,
        type: { type: 'string', enum: ['percent', 'fixed'] },
        value: { type: 'number' },
        priority: { type: 'integer', description: 'So lon hon duoc uu tien truoc' },
        startTime: { type: 'string', format: 'date-time' },
        endTime: { type: 'string', format: 'date-time' },
        isActive: { type: 'boolean' },
      },
    },

    FlashSale: {
      type: 'object',
      properties: {
        _id: objectId,
        name: { type: 'string' },
        variant: objectId,
        flashPrice: { type: 'number' },
        stockAllocated: { type: 'integer', description: 'So suat gia soc duoc cap phat' },
        soldCount: { type: 'integer' },
        maxPerUser: { type: 'integer' },
        startTime: { type: 'string', format: 'date-time' },
        endTime: { type: 'string', format: 'date-time' },
        isActive: { type: 'boolean' },
      },
    },

    PriceHistoryEntry: {
      type: 'object',
      description:
        'Nhat ky thay doi gia niem yet, phuc vu yeu cau chung minh gia goc khi khuyen mai',
      properties: {
        variant: objectId,
        oldPrice: { type: 'number' },
        newPrice: { type: 'number' },
        changedBy: objectId,
        changedAt: { type: 'string', format: 'date-time' },
      },
    },

    UploadResult: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        url: { type: 'string', format: 'uri', example: 'https://res.cloudinary.com/.../abc.jpg' },
        publicId: { type: 'string' },
      },
    },
  },

  responses: {
    BadRequest: {
      description: 'Du lieu dau vao khong hop le',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } },
    },
    Unauthorized: {
      description: 'Thieu token, token het han hoac token khong hop le',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
    },
    Forbidden: {
      description: 'Da dang nhap nhung khong du quyen truy cap',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
    },
    NotFound: {
      description: 'Khong tim thay tai nguyen',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
    },
    Conflict: {
      description: 'Xung dot du lieu, vi du het ton kho hoac ma da ton tai',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
    },
    TooManyRequests: {
      description:
        'Vuot gioi han tan suat. Toan API la 300 yeu cau moi 15 phut; nhom xac thuc va tra cuu don la 10 yeu cau moi 15 phut.',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
    },
  },
};
