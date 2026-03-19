function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function requireEnv(name: string) {
  const value = readEnv(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const config = {
  port: Number(process.env.PORT) || 8080,
  databaseUrl: requireEnv("DATABASE_URL"),
  jwtSecret: requireEnv("JWT_SECRET"),
  s3EndpointUrl: requireEnv("S3_ENDPOINT_URL"),
  s3AccessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
  s3SecretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
  s3BucketName: requireEnv("S3_BUCKET_NAME"),
  s3Region: readEnv("S3_REGION") ?? "us-east-1",
  appUrl: readEnv("APP_URL")
};
