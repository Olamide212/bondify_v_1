const multer = require('multer');

const storage = multer.memoryStorage();

const ALLOWED_MIME_PREFIXES = ['image/', 'audio/'];

const fileFilter = (req, file, cb) => {
  const mimeType = file?.mimetype || '';
  const isAllowed = ALLOWED_MIME_PREFIXES.some((prefix) =>
    mimeType.startsWith(prefix)
  );

  if (isAllowed) {
    cb(null, true);
    return;
  }

  cb(new Error('Only image and audio files are allowed'), false);
};

const chatUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
});

module.exports = chatUpload;
