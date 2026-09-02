import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

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

    if (!getResult.Item) return response(404, { error: "File not found" });
    if (getResult.Item.userId.S !== userId) return response(403, { error: "You do not have access to this file" });

    const s3Key = getResult.Item.s3Key.S;

    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key }));

    await ddb.send(new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { fileId: { S: fileId } },
      UpdateExpression: "SET #st = :deletedStatus, updatedDate = :now",
      ExpressionAttributeNames: { "#st": "status" },
      ExpressionAttributeValues: {
        ":deletedStatus": { S: "deleted" },
        ":now": { S: new Date().toISOString() },
      },
    }));

    return response(200, { message: "File deleted successfully", fileId });

  } catch (err) {
    console.error("Delete error:", err);
    return response(500, { error: "Internal server error" });
  }
};

function response(statusCode, body) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}