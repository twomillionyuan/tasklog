import { randomUUID } from "node:crypto";

import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";

import { config } from "./config.js";

const s3Client = new S3Client({
  endpoint: config.s3EndpointUrl,
  credentials: {
    accessKeyId: config.s3AccessKeyId,
    secretAccessKey: config.s3SecretAccessKey
  },
  forcePathStyle: true,
  region: config.s3Region
});

function buildImageUrl(key: string) {
  const normalizedEndpoint = config.s3EndpointUrl.replace(/\/$/, "");
  const encodedKey = key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${normalizedEndpoint}/${config.s3BucketName}/${encodedKey}`;
}

function extensionFromMimeType(contentType: string) {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
    case "image/heif":
      return "heic";
    default:
      return "bin";
  }
}

export async function ensureStorageBucket() {
  try {
    await s3Client.send(
      new HeadBucketCommand({
        Bucket: config.s3BucketName
      })
    );
  } catch {
    await s3Client.send(
      new CreateBucketCommand({
        Bucket: config.s3BucketName
      })
    );
  }

  await s3Client.send(
    new PutBucketPolicyCommand({
      Bucket: config.s3BucketName,
      Policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "AllowPublicReadForSpotLog",
            Effect: "Allow",
            Principal: "*",
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${config.s3BucketName}/*`]
          }
        ]
      })
    })
  );
}

export async function uploadImage(input: {
  userId: string;
  buffer: Buffer;
  contentType: string;
}) {
  const key = `${input.userId}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extensionFromMimeType(input.contentType)}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.s3BucketName,
      Key: key,
      Body: input.buffer,
      ContentType: input.contentType
    })
  );

  return {
    key,
    imageUrl: buildImageUrl(key)
  };
}

export async function removeImage(storageKey: string) {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: config.s3BucketName,
      Key: storageKey
    })
  );
}
