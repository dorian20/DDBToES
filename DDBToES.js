/**
 * Author: @nadir93
 * Date 2018.4.2
 */
const dynamoDB = require('./lib/dynamoDB');
const elasticSearch = require('./lib/elasticSearch');
const message = require('./lib/message');
const log = require('./lib/log');
const lambda = require('./lib/lambda');

let cxt;
const remainingTimeInMillis = parseInt(process.env.RemainingTimeInMillis, 10);
log.debug('remainingTimeInMillis: ', remainingTimeInMillis);
log.info('env', JSON.stringify(process.env));

let callback = null;

function success() {
  callback(null, 'success');
}

function fail(e) {
  callback(e);
}

const execute = (event, context, cb) => {
  cxt = context;
  callback = cb;
  log.debug('received event:', JSON.stringify(event, null, 2));

  const proc = async (start) => {
    log.debug('cxt.getRemainingTimeInMillis() : ', cxt.getRemainingTimeInMillis());
    if (cxt.getRemainingTimeInMillis() < remainingTimeInMillis) {
      log.info('proc end& next Lambda call');

      try {
        await lambda.invoke({
          LastEvaluatedKey: start,
        });
        success();
      } catch (e) {
        fail(e);
      }
      return undefined;
    }

    try {
      const data = await dynamoDB.scan(start);

      data.Items.forEach((element) => {
        // log.debug('element: ', JSON.stringify(element, null, 2));
        message.validate(element);
      });

      const result = await elasticSearch.send(data);
      // call proc recursivly
      if (result) {
        proc(result);
      } else {
        success();
      }
    } catch (e) {
      fail(e);
    }

    return undefined;
  };

  proc(event.LastEvaluatedKey);
};

process.on('unhandledRejection', (reason, p) => {
  log.debug('reason: ', reason);
  log.debug('p: ', p);
  throw reason;
});

process.on('uncaughtException', (e) => {
  log.debug('uncaughtException: ', e);
  log.error(e);
});

exports.handler = execute;
