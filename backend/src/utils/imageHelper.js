const { GetObjectCommand } = require('@aws-sdk/client-s3');
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

module.exports = { mapImagesWithAccessUrls };
