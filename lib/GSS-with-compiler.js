var compiler, link, remoteGSS, runRemotes, _i, _len;

compiler = require("gss-compiler");

require("./GSS.js");

GSS.compile = function(rules) {
  var ast, e;
  ast = {};
  if (typeof rules === "string") {
    try {
      ast = compiler.compile(rules);
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

runRemotes = function(url) {
  var req;
  req = new XMLHttpRequest;
  req.onreadystatechange = function() {
    var engine;
    if (req.readyState !== 4) {
      return;
    }
    if (req.status !== 200) {
      return;
    }
    engine = GSS(document);
    return engine.compile(req.responseText);
  };
  req.open('GET', url, true);
  return req.send(null);
};

remoteGSS = document.querySelectorAll('link[rel="stylesheet"][type="text/gss"]');

if (remoteGSS) {
  for (_i = 0, _len = remoteGSS.length; _i < _len; _i++) {
    link = remoteGSS[_i];
    runRemotes(link.getAttribute('href'));
  }
}
