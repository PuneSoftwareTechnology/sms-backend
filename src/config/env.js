import dotenv from "dotenv";

// On Lambda, env vars are set via function configuration — skip .env file loading
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  dotenv.config();
}

const required = ["DATABASE_URL", "JWT_SECRET"];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 8080),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "30d",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  sesFromEmail: process.env.SES_FROM_EMAIL || "",
  awsRegion: process.env.AWS_REGION || "ap-south-1",
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  s3Bucket: process.env.S3_BUCKET || "",
  s3SignedUrlExpirySeconds: Number(
    process.env.S3_SIGNED_URL_EXPIRY_SECONDS || 300,
  ),
};

export default env;
