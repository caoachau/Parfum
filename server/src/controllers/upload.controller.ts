import { Request, Response } from 'express';

// Sau khi multer-storage-cloudinary xu ly xong:
//   req.file.path     -> secure_url cua anh tren Cloudinary
//   req.file.filename -> public_id (dung de xoa/quan ly sau nay)
type UploadedFile = Express.Multer.File & { path: string; filename: string };

export const uploadImage = (req: Request, res: Response) => {
  const file = req.file as UploadedFile | undefined;
  if (!file) {
    return res.status(400).json({ success: false, message: 'Không tìm thấy file ảnh' });
  }
  const data = { url: file.path, publicId: file.filename };
  // Tra ve ca dang phang { url } (tuong thich cu) lan { success, data }
  res.status(200).json({ success: true, url: data.url, publicId: data.publicId, data });
};

export const uploadImages = (req: Request, res: Response) => {
  const files = (req.files as UploadedFile[] | undefined) || [];
  if (!files.length) {
    return res.status(400).json({ success: false, message: 'Không tìm thấy file ảnh' });
  }
  const data = files.map((f) => ({ url: f.path, publicId: f.filename }));
  res.status(200).json({ success: true, data });
};
