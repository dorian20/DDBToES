const moment = require('moment');

console.log(moment('20160307133625', 'YYYYMMDDHHmmss').toISOString());

console.log(moment('2016-3-7 13:36:25', 'YYYY-MM-DD HH:mm:ss').toISOString());

console.log('length: ', '20160307133625'.length);


console.log(moment('2016-3-7 13:36:25', 'YYYY-MM-DD HH:mm:ss').format('YYYY.MM.DD'));
