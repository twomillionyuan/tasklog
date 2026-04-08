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

function getStorageConfig() {
  if (
    !config.s3EndpointUrl ||
    !config.s3AccessKeyId ||
    !config.s3SecretAccessKey ||
    !config.s3BucketName
  ) {
    return null;
  }

  return {
    endpoint: config.s3EndpointUrl.replace(/\/$/, ""),
    accessKeyId: config.s3AccessKeyId,
    secretAccessKey: config.s3SecretAccessKey,
    bucketName: config.s3BucketName,
    region: config.s3Region
  };
}

function getS3Client() {
  const storageConfig = getStorageConfig();

  if (!storageConfig) {
    throw new Error("STORAGE_DISABLED");
  }

  return new S3Client({
    endpoint: storageConfig.endpoint,
    credentials: {
      accessKeyId: storageConfig.accessKeyId,
      secretAccessKey: storageConfig.secretAccessKey
    },
    forcePathStyle: true,
    region: storageConfig.region
  });
}

function buildAttachmentUrl(key: string) {
  const storageConfig = getStorageConfig();

  if (!storageConfig) {
    throw new Error("STORAGE_DISABLED");
  }

  const encodedKey = key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${storageConfig.endpoint}/${storageConfig.bucketName}/${encodedKey}`;
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
  const storageConfig = getStorageConfig();

  if (!storageConfig) {
    console.log("TaskSnap startup: storage disabled");
    return;
  }

  const s3Client = getS3Client();

  try {
    await s3Client.send(
      new HeadBucketCommand({
        Bucket: storageConfig.bucketName
      })
    );
  } catch {
    await s3Client.send(
      new CreateBucketCommand({
        Bucket: storageConfig.bucketName
      })
    );
  }

  await s3Client.send(
    new PutBucketPolicyCommand({
      Bucket: storageConfig.bucketName,
      Policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "AllowPublicReadForTaskSnap",
            Effect: "Allow",
            Principal: "*",
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${storageConfig.bucketName}/*`]
          }
        ]
      })
    })
  );
}

export async function uploadTaskPhoto(input: {
  userId: string;
  taskId: string;
  kind: "before" | "after";
  buffer: Buffer;
  contentType: string;
}) {
  const storageConfig = getStorageConfig();

  if (!storageConfig) {
    throw new Error("STORAGE_DISABLED");
  }

  const s3Client = getS3Client();
  const key = `${input.userId}/tasks/${input.taskId}/${input.kind}/${new Date().toISOString().slice(0, 10)}-${randomUUID()}.${extensionFromMimeType(input.contentType)}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: storageConfig.bucketName,
      Key: key,
      Body: input.buffer,
      ContentType: input.contentType
    })
  );

  return {
    key,
    attachmentUrl: buildAttachmentUrl(key)
  };
}

export async function uploadListAttachment(input: {
  userId: string;
  listId: string;
  buffer: Buffer;
  contentType: string;
}) {
  const storageConfig = getStorageConfig();

  if (!storageConfig) {
    throw new Error("STORAGE_DISABLED");
  }

  const s3Client = getS3Client();
  const key = `${input.userId}/lists/${input.listId}/${new Date().toISOString().slice(0, 10)}-${randomUUID()}.${extensionFromMimeType(input.contentType)}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: storageConfig.bucketName,
      Key: key,
      Body: input.buffer,
      ContentType: input.contentType
    })
  );

  return {
    key,
    attachmentUrl: buildAttachmentUrl(key)
  };
}

export async function removeAttachment(storageKey: string) {
  const storageConfig = getStorageConfig();

  if (!storageConfig) {
    return;
  }

  const s3Client = getS3Client();

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: storageConfig.bucketName,
      Key: storageKey
    })
  );
}
