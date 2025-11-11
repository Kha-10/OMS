const { Logtail } = require("@logtail/node");
const { LogtailTransport } = require("@logtail/winston");
const winston = require("winston");

const logtail = new Logtail("jJn1WBn95NR8kHW5fx2gRwug", {
  endpoint: "https://s1572473.eu-nbg-2.betterstackdata.com",
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
