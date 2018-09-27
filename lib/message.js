/**
 * Author: @nadir93
 * Date 2018.4.4
 */
const AWS = require('aws-sdk');
const jsonSchema = require('jsonschema');
const log = require('./log');

const jsonValidator = new jsonSchema.Validator();

const unmarshall = record => AWS.DynamoDB.Converter
  .unmarshall(record);

const schema = {
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  properties: {
    // MODI_DTTM: {
    //   type: 'string',
    //   // format: 'date-time',
    // },
    RGST_DTTM: {
      type: 'string',
      // format: 'date-time',
    },
  },
  required: ['RGST_DTTM'],
};

const validate = (data) => {
  const validationResult = jsonValidator.validate(unmarshall(data), schema);
  // log.debug(`Json Schema Validation result =  ${validationResult}`);
  if (validationResult.errors.length === 0) {
    return true;
  }
  return false;
};

module.exports = {
  unmarshall,
  validate,
};