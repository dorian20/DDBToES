/**
 * Author: @nadir93
 * Date 2018.4.4
 */
const AWS = require('aws-sdk');
const moment = require('moment');
const crypto = require('crypto');
const path = require('path');
const log = require('./log');
const message = require('./message');

const {
  ES_ENDPOINT,
  ES_REGION,
  ES_INDEX_PREFIX,
  ES_DOC,
  KEY_FIELD1,
  KEY_FIELD2,
} = process.env;
log.debug('ES_ENDPOINT:', ES_ENDPOINT);
log.debug('ES_REGION:', ES_REGION);

const DATE_FIELD = process.env.DATE_FIELD.split(',');
log.debug('DATE_FIELD:', DATE_FIELD);

// const databases = process.env.DATABASE.split(',');

const timestamp = new Date();
const INDEX = [
  `${ES_INDEX_PREFIX}-${timestamp.getUTCFullYear()}`, // year
  (`0${(timestamp.getUTCMonth() + 1)}`).slice(-2), // month
  // (`0${timestamp.getUTCDate()}`).slice(-2), // day
].join('.');

const esDomain = {
  region: ES_REGION,
  endpoint: ES_ENDPOINT,
  // index: INDEX,
};

const DateStringFixedLength = 14;

const endpoint = new AWS.Endpoint(esDomain.endpoint);

function hash(str, encoding) {
  return crypto.createHash('sha256')
    .update(str, 'utf8')
    .digest(encoding);
}

/*
 * The AWS credentials are picked up from the environment.
 * They belong to the IAM role assigned to the Lambda function.
 * Since the ES requests are signed using these credentials,
 * make sure to apply a policy that allows ES domain operations
 * to the role.
 */
const creds = new AWS.EnvironmentCredentials('AWS');

const send = (docs) => {
  log.debug('sendToES start docs.length: ', docs.Items.length);

  /*
   * Post the given document to Elasticsearch
   */
  function postToES(doc, esIndex, key) {
    log.debug('postToES(doc):', doc);

    log.debug('ES_INDEX_PREFIX-exIndex:', `${ES_INDEX_PREFIX}-${esIndex}`);
    log.debug('ES_DOC:', ES_DOC);
    log.debug('key:', key);

    return new Promise((resolve, reject) => {
      const req = new AWS.HttpRequest(endpoint);

      req.method = 'POST';
      req.path =
        path.join('/', `${ES_INDEX_PREFIX}-${esIndex}`, ES_DOC, key);
      req.region = esDomain.region;
      req.headers['presigned-expires'] = false;
      req.headers.Host = endpoint.host;
      req.headers['Content-Type'] = 'application/json';
      req.body = doc;

      const signer = new AWS.Signers.V4(req, 'es'); // es: service code
      signer.addAuthorization(creds, new Date());

      const nodeHttpClient = new AWS.NodeHttpClient();
      nodeHttpClient.handleRequest(req, null, (httpResp) => {
        let respBody = '';
        httpResp.on('data', (chunk) => {
          respBody += chunk;
        });
        httpResp.on('end', () => {
          log.debug('response:', respBody);
          // context.succeed('Lambda added document ' + doc);
          resolve(respBody);
        });
      }, reject);
    });
  }

  return new Promise((resolve, reject) => {
    log.debug('docs: ', docs);

    async function loop(index) {
      if (index < 0) {
        log.debug('sendToES end');
        return resolve(docs.LastEvaluatedKey);
      }

      let doc = message.unmarshall(docs.Items[index]);
      // modify date-time

      for (let i = 0; i < DATE_FIELD.length; i++) {
        if (doc[DATE_FIELD[i]] && doc[DATE_FIELD[i]].length === DateStringFixedLength) {
          doc[DATE_FIELD[i]] =
            moment(doc[DATE_FIELD[i]], 'YYYYMMDDHHmmss').toISOString();
        } else {
          doc[DATE_FIELD[i]] =
            moment(doc[DATE_FIELD[i]], 'YYYY-MM-DD HH:mm:ss').toISOString();
        }
      }

      try {

        var key1 = '';
        var key2 = '';

        if (KEY_FIELD1 != null && KEY_FIELD1 != '' && KEY_FIELD1 != undefined) {
          key1 = doc[KEY_FIELD1];
        }

        if (KEY_FIELD2 != null && KEY_FIELD2 != '' && KEY_FIELD2 != undefined) {
          key2 = doc[KEY_FIELD2];
        }

        await postToES(JSON.stringify(doc), moment(doc.RGST_DTTM).format('YYYY.MM'), key1 + '' + key2);
      } catch (e) {
        reject(e);
      }

      const localIndex = index - 1;
      loop(localIndex);

      return undefined;
    }

    loop(docs.Items.length - 1);
  });
};

module.exports.send = send;