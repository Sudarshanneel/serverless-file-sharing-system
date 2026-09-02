import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });
const s3 = new S3Client({ region: process.env.AWS_REGION });
const TABLE_NAME = process.env.METADATA_TABLE;
const BUCKET_NAME = process.env.FILES_BUCKET;

export const handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.jwt.claims.sub;
    const fileId = event.pathParameters?.fileId;

    if (!fileId) return response(400, { error: "fileId is required" });

    const getResult = await ddb.send(new GetItemCommand({
      TableName: TABLE_NAME,
      Key: { fileId: { S: fileId } },
    }));

    if (!getResult.Item) {
      return response(404, { error: "File not found" });
    }
    if (getResult.Item.userId.S !== userId) {
      return response(403, { error: "You do not have access to this file" });
    }
    if (getResult.Item.status.S !== "active") {
      return response(410, { error: "File has been deleted" });
    }

    const s3Key = getResult.Item.s3Key.S;

    const getCommand = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key });
    const downloadUrl = await getSignedUrl(s3, getCommand, { expiresIn: 300 });

    await ddb.send(new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { fileId: { S: fileId } },
      UpdateExpression: "SET downloadCount = downloadCount + :inc",
      ExpressionAttributeValues: { ":inc": { N: "1" } },
    }));

    return response(200, { downloadUrl, fileName: getResult.Item.fileName.S });

  } catch (err) {
    console.error("Download error:", err);
    return response(500, { error: "Internal server error" });
  }
};

function response(statusCode, body) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}