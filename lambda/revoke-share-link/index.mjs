import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });
const TABLE_NAME = process.env.METADATA_TABLE;

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

    if (!getResult.Item.shareId) {
      return response(400, { error: "This file has no active share link" });
    }

    await ddb.send(new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: { fileId: { S: fileId } },
      UpdateExpression: "REMOVE shareId, shareExpiry SET updatedDate = :now",
      ExpressionAttributeValues: {
        ":now": { S: new Date().toISOString() },
      },
    }));

    return response(200, { message: "Share link revoked successfully", fileId });

  } catch (err) {
    console.error("Revoke share link error:", err);
    return response(500, { error: "Internal server error" });
  }
};

function response(statusCode, body) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}