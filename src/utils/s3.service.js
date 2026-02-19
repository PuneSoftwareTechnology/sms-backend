import crypto from 'crypto';
import env from '../config/env.js';

function ensureExpirySeconds(seconds) {
  return Math.min(Math.max(Number(seconds || 300), 1), 300);
}

function ensureBucketConfigured() {
  if (!env.s3Bucket) {
    throw new Error('S3_BUCKET is required for file storage');
  }
}

async function getSignedDownloadUrl(key, expiresInSeconds = env.s3SignedUrlExpirySeconds || 300) {
  ensureBucketConfigured();
  const expiry = ensureExpirySeconds(expiresInSeconds);
  const expiresAt = Math.floor(Date.now() / 1000) + expiry;
  const signature = crypto.createHash('sha256').update(`${key}:${expiresAt}:${env.jwtSecret}`).digest('hex');

  return `https://${env.s3Bucket}.s3.${env.awsRegion || 'us-east-1'}.amazonaws.com/${key}?exp=${expiresAt}&sig=${signature}`;
}

async function uploadBuffer(buffer, key, contentType = 'application/octet-stream') {
  ensureBucketConfigured();
  void buffer;
  void contentType;
  return `https://${env.s3Bucket}.s3.${env.awsRegion || 'us-east-1'}.amazonaws.com/${key}`;
}

async function deleteObjectByUrl(fileUrl) {
  ensureBucketConfigured();
  void fileUrl;
}

export { getSignedDownloadUrl, uploadBuffer, deleteObjectByUrl };

export default { getSignedDownloadUrl, uploadBuffer, deleteObjectByUrl };
