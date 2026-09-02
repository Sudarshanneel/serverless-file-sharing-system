import { DynamoDBClient, QueryCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });
const s3 = new S3Client({ region: process.env.AWS_REGION });
const TABLE_NAME = process.env.METADATA_TABLE;
const BUCKET_NAME = process.env.FILES_BUCKET;

export const handler = async (event) => {
  try {
    const shareId = event.pathParameters?.shareId;
    if (!shareId) return response(400, { error: "shareId is required" });

    const queryResult = await ddb.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "shareId-index",
      KeyConditionExpression: "shareId = :sid",
      ExpressionAttributeValues: { ":sid": { S: shareId } },
    }));

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return response(404, { error: "This link is invalid" });
    }

    const item = queryResult.Items[0];

    if (!item.shareId || item.shareId.S !== shareId) {
      return response(404, { error: "This link has been revoked" });
    }

    if (item.status.S !== "active") {
      return response(410, { error: "File is no longer available" });
    }

    const nowEpoch = Math.floor(Date.now() / 1000);
    const shareExpiry = Number(item.shareExpiry?.N || 0);
    if (nowEpoch > shareExpiry) {
      return response(410, { error: "This link has expired" });
    }

    const s3Key = item.s3Key.S;
    const fileId = item.fileId.S;

    const getCommand = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key });
    const downloadUrl = await getSignedUrl(s3, getCommand, { expiresIn: 300 });

    await ddb.send(new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { fileId: { S: fileId } },
      UpdateExpression: "SET downloadCount = downloadCount + :inc",
      ExpressionAttributeValues: { ":inc": { N: "1" } },
    }));

    return response(200, { downloadUrl, fileName: item.fileName.S });

  } catch (err) {
    console.error("Access shared file error:", err);
    return response(500, { error: "Internal server error" });
  }
};

function response(statusCode, body) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}