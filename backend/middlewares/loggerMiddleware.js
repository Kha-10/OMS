const { v4: uuidv4 } = require("uuid");
const logger = require("../helpers/logger");

const loggerMiddleware =
  (moduleName = "app") =>
  (req, res, next) => {
    console.log('hh');
    console.log(moduleName);
    const requestId = uuidv4();
    req.logger = logger.child({ requestId, module: moduleName });
    next();
  };

module.exports = loggerMiddleware;
