const multer = require('multer');

const storage = multer.memoryStorage();

const ALLOWED_MIME_PREFIXES = ['image/', 'video/'];

const fileFilter = (req, file, cb) => {
  const mimeType = file?.mimetype || '';
  const isAllowed = ALLOWED_MIME_PREFIXES.some((prefix) =>
    mimeType.startsWith(prefix)
  );

  if (isAllowed) {
    cb(null, true);
    return;
  }

  cb(new Error('Only image and video files are allowed for posts'), false);
};

const postUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB per file
  },
});

module.exports = postUpload;
