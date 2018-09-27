/**
 * Author: @nadir93
 * Date 2018.4.3
 */
const AWS = require('aws-sdk');

const sts = new AWS.STS();

let dynamodb;
const process = (ExclusiveStartKey) => {
  const params = {
    TableName: 'DP_SPDP_EXT',
    Limit: 30, // testCode
    ExclusiveStartKey,
  };

  dynamodb
    .scan(params)
    .promise()
    .then((response) => {
      // console.log('response: ', JSON.stringify(response, null, 2));
      console.log('response: ', response);
      // send ES

      // call process recursivly
      if (response.LastEvaluatedKey) {
        process(response.LastEvaluatedKey);
      }
    })
    .catch(e => console.error(e));
};

const params = {
  RoleArn: 'arn:aws:iam::515303172277:role/B2_IA',
  /* required */
  RoleSessionName: 'AssumeRoleSession1',
  /* required */
};

sts.assumeRole(params)
  .promise()
  .then((response) => {
    // console.log('response: ', response);
    AWS.config.update({
      accessKeyId: response.Credentials.AccessKeyId,
      secretAccessKey: response.Credentials.SecretAccessKey,
      sessionToken: response.Credentials.SessionToken,
      // credentials: data.Credentials,
      region: 'ap-northeast-2',
    });
    dynamodb = new AWS.DynamoDB();
    process();
  })
  .catch(e => console.error(e));
