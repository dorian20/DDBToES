/**
 * Author: @nadir93
 * Date 2018.4.4
 */
const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB();

const tableName = process.env.DDB_TABLE_NAME;
const scan = (ExclusiveStartKey) => {
  const params = {
    TableName: tableName,
    // Limit: 10, // testCode
    ExclusiveStartKey,
  };

  return dynamodb.scan(params).promise();
};

module.exports.scan = scan;
