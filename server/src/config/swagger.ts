import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

import { components, tags } from '../docs/openapi.components';
import { publicPaths } from '../docs/openapi.paths';
import { adminPaths } from '../docs/openapi.admin';

/**
 * Dac ta OpenAPI 3.0.3 cho toan bo REST API cua he thong.
 *
 * Dac ta duoc viet tay theo dung cac tep dinh tuyen trong src/routes thay vi
 * sinh tu chu thich, de tranh tinh trang tai lieu va ma nguon lech nhau ma
 * khong ai phat hien. Moi lan them endpoint moi, bo sung tuong ung trong
 * src/docs/openapi.paths.ts hoac src/docs/openapi.admin.ts.
 */
export const openApiSpec = {
  openapi: '3.0.3',

  info: {
    title: "L'ESSENCE NOIRE API",
    version: '1.0.0',
    description: [
      'REST API cho he thong ban nuoc hoa truc tuyen L\u2019ESSENCE NOIRE.',
      '',
      '### Xac thuc',
      'He thong dung hai token. Access token la JWT han 15 phut, gui qua tieu de',
      'Authorization. Refresh token han 7 ngay, luu trong cookie httpOnly gioi han',
      'duong dan /api/auth nen ma JavaScript khong doc duoc. Hai endpoint',
      'POST /auth/refresh va POST /auth/logout con yeu cau tieu de X-CSRF-Token',
      'trung voi cookie csrfToken theo co che double submit.',
      '',
      'De thu cac endpoint can dang nhap: goi POST /auth/login, sao chep gia tri',
      'accessToken trong phan hoi, bam nut Authorize o goc tren roi dan vao o bearerAuth.',
      '',
      '### Gioi han tan suat',
      'Toan bo API gioi han 300 yeu cau moi 15 phut. Rieng nhom xac thuc va endpoint',
      'tra cuu don cho khach vang lai gioi han 10 yeu cau moi 15 phut.',
      '',
      '### Quy uoc chung',
      'Than yeu cau toi da 100 KB. Dinh danh la chuoi 24 ky tu thap luc phan.',
      'Moi gia tri tien te la so nguyen theo don vi dong Viet Nam.',
      'Gia ban va tong thanh toan cua don moi da bao gom VAT; VAT chi duoc boc nguoc de hien thi, khong cong them.',
      'Don lich su co the khong co snapshot VAT vi he thong khong tu dong backfill du lieu thue.',
      'Gia hien thi luon do may chu tinh; giao dien khong tu tinh lai bat ky con so nao.',
    ].join('\n'),
    contact: {
      name: 'Nhom do an - Khoa Cong nghe thong tin, Truong Dai hoc Tra Vinh',
    },
  },

  servers: [
    { url: '/api', description: 'Duong dan hien hanh' },
    { url: '/api/v1', description: 'Duong dan co gan phien ban, tro toi cung bo dinh tuyen' },
  ],

  tags,

  // Mac dinh moi endpoint deu can access token; cac endpoint cong khai tu ghi de
  // bang security: [] trong phan mo ta cua chinh no.
  security: [{ bearerAuth: [] }],

  components,

  paths: {
    ...publicPaths,
    ...adminPaths,
  },
};

export function setupSwagger(app: Express) {
  // Tra ve dac ta dang JSON de co the nap vao Postman, Insomnia hoac cong cu sinh ma.
  app.get('/api/docs.json', (_req, res) => res.json(openApiSpec));

  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customSiteTitle: "L'ESSENCE NOIRE API",
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        tagsSorter: 'alpha',
      },
    }),
  );
}
