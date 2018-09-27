/**
 * Author: @nadir93
 * Date 2018.4.5
 */
const AWS = require('aws-sdk');

const lambda = new AWS.Lambda();
const lambdaFuncName = process.env.LAMBDA_FUNC_NAME;

const log = require('./log');

const invoke = (message) => {
  log.debug('invoke start');
  const params = {
    FunctionName: lambdaFuncName,
    InvocationType: 'Event', // async call
    Payload: JSON.stringify(message),
  };

  return lambda.invoke(params).promise();
};

module.exports.invoke = invoke;
