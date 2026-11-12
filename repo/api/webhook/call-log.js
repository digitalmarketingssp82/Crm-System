const callLogHandler = require('../call-log.js');
module.exports = callLogHandler;
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
