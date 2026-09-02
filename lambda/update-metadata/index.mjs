import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });
const TABLE_NAME = process.env.METADATA_TABLE;

export const handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.jwt.claims.sub;
    const fileId = event.pathParameters?.fileId;
    const body = event.body ? JSON.parse(event.body) : {};

    if (!fileId) return response(400, { error: "fileId is required" });

    const { fileName } = body;
    if (!fileName || typeof fileName !== "string" || fileName.trim().length === 0) {
      return response(400, { error: "A valid fileName is required" });
    }
    if (fileName.length > 255) {
      return response(400, { error: "fileName is too long" });
    }

    const getResult = await ddb.send(new GetItemCommand({
      TableName: TABLE_NAME,
      Key: { fileId: { S: fileId } },
    }));

    if (!getResult.Item) return response(404, { error: "File not found" });
    if (getResult.Item.userId.S !== userId) return response(403, { error: "You do not have access to this file" });
    if (getResult.Item.status.S !== "active") return response(410, { error: "File has been deleted" });

    await ddb.send(new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { fileId: { S: fileId } },
      UpdateExpression: "SET fileName = :fname, updatedDate = :now",
      ExpressionAttributeValues: {
        ":fname": { S: fileName.trim() },
        ":now": { S: new Date().toISOString() },
      },
    }));

    return response(200, { message: "Metadata updated successfully", fileId, fileName: fileName.trim() });

  } catch (err) {
    console.error("Update metadata error:", err);
    return response(500, { error: "Internal server error" });
  }
};

function response(statusCode, body) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}