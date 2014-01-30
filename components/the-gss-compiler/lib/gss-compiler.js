var ccss, compile, preparser, runCompiler, vfl;

preparser = require('gss-preparser');

ccss = require('ccss-compiler');

vfl = require('vfl-compiler');

runCompiler = function(chunk) {
  switch (chunk[0]) {
    case 'ccss':
      return ccss.parse(chunk[1]);
    case 'vfl':
      return vfl.parse(chunk[1]);
    case 'gtl':
      return gtl.parse(chunk[1]);
  }
};

compile = function(gss) {
  var chunk, chunks, part, results, rules, _i, _len;
  chunks = preparser.parse(gss);
  results = {
    css: ''
  };
  for (_i = 0, _len = chunks.length; _i < _len; _i++) {
    chunk = chunks[_i];
    if (chunk[0] === 'css') {
      results.css += chunk[1];
    } else {
      rules = runCompiler(chunk);
      for (part in rules) {
        if (!results[part]) {
          results[part] = [];
        }
        results[part] = results[part].concat(rules[part]);
      }
    }
  }
  return results;
};

exports.compile = compile;
