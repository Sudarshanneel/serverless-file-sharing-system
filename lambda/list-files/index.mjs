import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });
const TABLE_NAME = process.env.METADATA_TABLE;

export const handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.jwt.claims.sub;

    const result = await ddb.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "userId-index",
      KeyConditionExpression: "userId = :uid",
      FilterExpression: "#st = :activeStatus",
      ExpressionAttributeNames: { "#st": "status" },
      ExpressionAttributeValues: {
        ":uid": { S: userId },
        ":activeStatus": { S: "active" },
      },
    }));

    const files = result.Items.map(item => ({
      fileId: item.fileId?.S,
      fileName: item.fileName?.S,
      fileSize: Number(item.fileSize?.N),
      fileType: item.fileType?.S,
      uploadDate: item.uploadDate?.S,
      downloadCount: Number(item.downloadCount?.N || 0),
      status: item.status?.S,
    }));

    return response(200, { files, count: files.length });

  } catch (err) {
    console.error("List files error:", err);
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