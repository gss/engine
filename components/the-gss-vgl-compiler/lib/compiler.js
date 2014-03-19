var vgl = require('./vgl-compiler');

exports.parse = function (rules) {
  return vgl.parse(rules);
};