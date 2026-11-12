import multer from 'multer';
import { httpError } from '../utils/httpError.js';
import { env } from '../config/env.js';

const allowed = new Map([
  ['.pdf', 'application/pdf'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
]);

const parser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxFileSize, files: 5, fields: 8, fieldSize: 12000 },
  fileFilter(req, file, callback) {
    const extension = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
    if (allowed.get(extension) !== file.mimetype) return callback(httpError(400, 'Only PDF, JPG, JPEG, and PNG files are accepted.'));
    callback(null, true);
  },
});

export function parseGrievanceFiles(req, res, next) {
  parser.array('attachments', 5)(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') return next(httpError(413, `Each attachment must be no larger than ${Math.floor(env.maxFileSize / 1024 / 1024)} MB.`));
      if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') return next(httpError(400, 'You may attach up to five files using the attachments field.'));
      return next(httpError(400, 'The attachment upload is invalid.'));
    }
    next(error);
  });
}

export function verifyFileSignature(file) {
  const bytes = file.buffer;
  const extension = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
  const valid = extension === '.pdf'
    ? bytes.subarray(0, 5).toString('ascii') === '%PDF-'
    : extension === '.jpg' || extension === '.jpeg'
      ? bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : extension === '.png'
        ? bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
        : false;
  if (!valid) throw httpError(400, 'An attachment file signature does not match its declared format.');
}
