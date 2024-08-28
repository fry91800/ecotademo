const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize } = format;

let indentLevel = 0;
const indentChar = '  ';

const logFormat = printf(({ level, message, timestamp }) => {
  const indent = indentChar.repeat(indentLevel);
  return `${indent}${level}: ${message}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(
    timestamp(),
    logFormat
  ),
  transports: [
    new transports.Console({
      format: process.env.NODE_ENV === 'development' ? combine(colorize(), logFormat) : logFormat
    })
  ]
});

// Function to increment the indent level
function logEnter(part) {
  //logger.debug(part);
  indentLevel++;
}

// Function to decrement the indent level
function logExit(funcName) {
  indentLevel--;
  //logger.debug(`Exiting ${funcName} function`);
}

module.exports = {
  logger,
  logEnter,
  logExit
};