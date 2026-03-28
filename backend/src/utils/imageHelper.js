const { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3 = require('../config/s3');

const mapImagesWithAccessUrls = async (images = []) => {
  const bucket = process.env.AWS_S3_BUCKET;
  const baseUrl = process.env.AWS_S3_PUBLIC_BASE_URL;

  if (!bucket) return images;

  const mapped = await Promise.all(
    images.map(async (image) => {
      if (!image?.publicId) return image;

      if (baseUrl) {
        return {
          ...image,
          url: `${baseUrl.replace(/\/$/, '')}/${image.publicId}`,
        };
      }

      try {
        const signedUrl = await getSignedUrl(
          s3,
          new GetObjectCommand({ Bucket: bucket, Key: image.publicId }),
          { expiresIn: 60 * 60 }
        );

        return {
          ...image,
          url: signedUrl,
        };
      } catch (_) {
        return image;
      }
    })
  );

  return mapped;
};

/**
 * Upload a single file (multer file object) to S3
 * @param {Object} file - multer file object with buffer, originalname, mimetype
 * @param {string} folder - S3 folder prefix e.g. 'verifications/userId'
 * @returns {{ url: string, publicId: string }}
 */
const uploadToS3 = async (file, folder = 'misc') => {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) throw new Error('Missing AWS_S3_BUCKET configuration');

  const ext = (file.originalname || 'file.jpg').split('.').pop().toLowerCase();
  const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : 'jpg';
  const key = `bondify/${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}.${safeExt}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype || 'image/jpeg',
    })
  );

  const baseUrl = process.env.AWS_CLOUDFRONT_DOMAIN ||
    process.env.AWS_S3_PUBLIC_BASE_URL;
  const url = baseUrl
    ? `${baseUrl.replace(/\/$/, '')}/${key}`
    : `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return { url, publicId: key };
};

/**
 * Process a populated user object (or lean doc) so its `images[].url`
 * fields point to accessible URLs (signed or via public base URL).
 * Returns a new object — does NOT mutate the original.
 */
const mapUserImages = async (user) => {
  if (!user || !Array.isArray(user.images) || user.images.length === 0) return user;
  const mappedImages = await mapImagesWithAccessUrls(user.images);
  return { ...user, images: mappedImages };
};

/**
 * Delete an object from S3 by its key/publicId
 * @param {string} publicId - S3 object key
 */
const deleteFromS3 = async (publicId) => {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket || !publicId) return;

  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: publicId }));
};

module.exports = { mapImagesWithAccessUrls, mapUserImages, uploadToS3, deleteFromS3 };

