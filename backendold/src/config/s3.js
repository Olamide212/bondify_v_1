const { S3Client } = require('@aws-sdk/client-s3');

const awsRegion = process.env.AWS_REGION;

if (!awsRegion) {
  throw new Error('Missing AWS_REGION environment variable');
}

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3Config = {
  region: awsRegion,
};

if (accessKeyId && secretAccessKey) {
  s3Config.credentials = {
    accessKeyId,
    secretAccessKey,
  };
}

const s3 = new S3Client(s3Config);

module.exports = s3;