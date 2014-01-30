var ccss = require('ccss-compiler');
var vfl = require('./vfl-compiler');

exports.parse = function (rules) {
  var results = {
    selectors: [],
    commands: []
  };
  var parsed = vfl.parse(rules);
  parsed.forEach(function (rule) {
    if (rule.shift() !== 'ccss') {
      throw new Error('CCSS rules expected');
    }
    var ccssRule = ccss.parse(rule.join(";\n"));
    results.selectors = results.selectors.concat(ccssRule.selectors);
    results.commands = results.commands.concat(ccssRule.commands);
    //results.constraints = results.constraints.concat(ccssRule.constraints);
  });
  return results;
};
