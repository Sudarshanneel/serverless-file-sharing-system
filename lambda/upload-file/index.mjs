import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });

const BUCKET_NAME = process.env.FILES_BUCKET;
const TABLE_NAME = process.env.METADATA_TABLE;

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.jwt.claims.sub;

    const body = JSON.parse(event.body);
    const { fileName, fileType, fileSize } = body;

    if (!fileName || !fileType || !fileSize) {
      return response(400, { error: "fileName, fileType, and fileSize are required" });
    }
    if (fileSize > MAX_SIZE_BYTES) {
      return response(400, { error: "File size exceeds the limit (max 5MB)" });
    }

    const fileId = randomUUID();
    const s3Key = `users/${userId}/${fileId}/${fileName}`;

    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: fileType,
    });
    const uploadUrl = await getSignedUrl(s3, putCommand, { expiresIn: 300 });

    const now = new Date().toISOString();
    await ddb.send(new PutItemCommand({
      TableName: TABLE_NAME,
      Item: {
        fileId: { S: fileId },
        userId: { S: userId },
        fileName: { S: fileName },
        s3Key: { S: s3Key },
        fileSize: { N: String(fileSize) },
        fileType: { S: fileType },
        uploadDate: { S: now },
        updatedDate: { S: now },
        downloadCount: { N: "0" },
        status: { S: "active" },
      },
    }));

    return response(200, { fileId, uploadUrl, s3Key });

  } catch (err) {
    console.error("Upload error:", err);
    return response(500, { error: "Internal server error" });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}