var ErrorReporter, parse;

if (typeof window !== "undefined" && window !== null) {
  parse = require('./parser').parse;
} else {
  parse = require('../lib/parser').parse;
}

ErrorReporter = require('error-reporter');

module.exports = {
  parse: function(source) {
    var columnNumber, error, errorReporter, lineNumber, message, results;
    results = null;
    try {
      results = parse(source);
    } catch (_error) {
      error = _error;
      errorReporter = new ErrorReporter(source);
      message = error.message, lineNumber = error.line, columnNumber = error.column;
      errorReporter.reportError(message, lineNumber, columnNumber);
    }
    return results;
  }
};
