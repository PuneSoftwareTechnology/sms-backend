import env from '../config/env.js';
async function getSignedDownloadUrl(key) {
  if (!env.s3Bucket) {
    return `https://example.com/${key}`;
  }

  // Placeholder S3 pre-signed URL integration point.
  return `https://${env.s3Bucket}.s3.${env.awsRegion}.amazonaws.com/${key}`;
}

export {
getSignedDownloadUrl,
};

export default {
getSignedDownloadUrl,
};
