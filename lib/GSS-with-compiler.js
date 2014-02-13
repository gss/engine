var Compiler;

require("./GSS.js");

Compiler = GSS.Compiler = require("gss-compiler");

GSS.compile = function(rules) {
  var ast, e;
  ast = {};
  if (typeof rules === "string") {
    try {
      ast = Compiler.compile(rules);
    } catch (_error) {
      e = _error;
      console.warn("compiler error", e);
      ast = {};
    }
  } else if (typeof rules === "object") {
    ast = rules;
  } else {
    throw new Error("Unrecognized GSS rule format. Should be string or AST");
  }
  return ast;
};

GSS.Engine.prototype['compile'] = function(source) {
  return this.run(GSS.compile(source));
};

GSS.Getter.prototype['readAST:text/gss'] = function(node) {
  var ast, source;
  source = node.textContent.trim();
  if (source.length === 0) {
    return {};
  }
  ast = GSS.compile(source);
  return ast;
};
