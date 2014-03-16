var vfl = require('./vfl-compiler');

exports.parse = function (rules) {
  return vfl.parse(rules);
};