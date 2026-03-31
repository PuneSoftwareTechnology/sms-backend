import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import env from '../config/env.js';

function createS3Client() {
  const config = { region: env.awsRegion };

  if (env.awsAccessKeyId && env.awsSecretAccessKey) {
    config.credentials = {
      accessKeyId: env.awsAccessKeyId,
      secretAccessKey: env.awsSecretAccessKey,
    };
  }

  return new S3Client(config);
}

const s3 = createS3Client();

function ensureBucketConfigured() {
  if (!env.s3Bucket) {
    throw new Error('S3_BUCKET is required for file storage');
  }
}

async function uploadBuffer(buffer, key, contentType = 'application/octet-stream') {
  ensureBucketConfigured();

  await s3.send(new PutObjectCommand({
    Bucket: env.s3Bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  return key;
}

async function getSignedDownloadUrl(key, expiresInSeconds = env.s3SignedUrlExpirySeconds || 300) {
  ensureBucketConfigured();

  const expiry = Math.min(Math.max(Number(expiresInSeconds || 300), 1), 3600);

  const command = new GetObjectCommand({
    Bucket: env.s3Bucket,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn: expiry });
}

async function deleteObject(key) {
  ensureBucketConfigured();
  if (!key) return;

  await s3.send(new DeleteObjectCommand({
    Bucket: env.s3Bucket,
    Key: key,
  }));
}

async function getSignedUploadUrl(key, contentType = 'application/octet-stream', expiresInSeconds = 300) {
  ensureBucketConfigured();

  const expiry = Math.min(Math.max(Number(expiresInSeconds || 300), 1), 3600);

  const command = new PutObjectCommand({
    Bucket: env.s3Bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3, command, { expiresIn: expiry });
}

async function resolvePresignedUrl(key) {
  if (!key) return null;
  return getSignedDownloadUrl(key);
}

async function resolvePresignedUrls(obj, fields) {
  if (!obj) return obj;

  const resolved = { ...obj };
  await Promise.all(
    fields.map(async (field) => {
      if (resolved[field]) {
        resolved[field] = await resolvePresignedUrl(resolved[field]);
      }
    }),
  );
  return resolved;
}

async function resolvePresignedUrlsInArray(items, fields) {
  if (!items?.length) return items;
  return Promise.all(items.map((item) => resolvePresignedUrls(item, fields)));
}

export { uploadBuffer, getSignedUploadUrl, getSignedDownloadUrl, deleteObject, resolvePresignedUrl, resolvePresignedUrls, resolvePresignedUrlsInArray };

export default { uploadBuffer, getSignedUploadUrl, getSignedDownloadUrl, deleteObject, resolvePresignedUrl, resolvePresignedUrls, resolvePresignedUrlsInArray };
