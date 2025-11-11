const { Logtail } = require("@logtail/node");
const { LogtailTransport } = require("@logtail/winston");
const winston = require("winston");

const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN, {
  endpoint: process.env.INGESTING_HOST,
});
const { combine, timestamp, json, errors } = winston.format;

const logger = winston.createLogger({
  level: "http",
  format: combine(
    timestamp({
      format: "YYYY-MM-DD hh:mm:ss.SSS A",
    }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: {},
  transports: [new winston.transports.Console(), new LogtailTransport(logtail)],
});

module.exports = logger;
