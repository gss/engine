var Getter;

Getter = (function() {
  function Getter(container) {
    this.container = container;
    this.styleNodes = null;
    if (!this.container) {
      this.container = document;
    }
  }

  Getter.prototype.clean = function() {};

  Getter.prototype.destroy = function() {
    this.container = null;
    return this.styleNodes = null;
  };

  Getter.prototype.get = function(selector) {
    var identifier, method;
    method = selector[0];
    identifier = selector[1];
    switch (method) {
      case "$reserved":
        if (identifier === 'this') {
          return this.container;
        }
        break;
      case "$id":
        if (identifier[0] === '#') {
          identifier = identifier.substr(1);
        }
        return document.getElementById(identifier);
      case "$class":
        if (identifier[0] === '.') {
          identifier = identifier.substr(1);
        }
        return this.container.getElementsByClassName(identifier);
      case "$tag":
        return this.container.getElementsByTagName(identifier);
    }
    return this.container.querySelectorAll(identifier);
  };

  Getter.prototype.getId = function(el) {
    if (el.getAttribute) {
      return el.getAttribute('data-gss-id');
    }
    return null;
  };

  Getter.prototype.measure = function(node, dimension) {
    var scroll;
    switch (dimension) {
      case 'width':
      case 'w':
        return node.getBoundingClientRect().width;
      case 'height':
      case 'h':
        return node.getBoundingClientRect().height;
      case 'left':
      case 'x':
        scroll = window.scrollX || window.scrollLeft || 0;
        return node.getBoundingClientRect().left + scroll;
      case 'top':
      case 'y':
        scroll = window.scrollY || window.scrollTop || 0;
        return node.getBoundingClientRect().top + scroll;
      case 'bottom':
        return this.measure(node, 'top') + this.measure(node, 'height');
      case 'right':
        return this.measure(node, 'left') + this.measure(node, 'width');
      case 'centerX':
        return this.measure(node, 'left') + this.measure(node, 'width') / 2;
      case 'centerY':
        return this.measure(node, 'top') + this.measure(node, 'height') / 2;
    }
  };

  Getter.prototype.getAllStyleNodes = function() {
    if (!this.styleNodes) {
      this.styleNodes = this.container.getElementsByTagName("style");
    }
    return this.styleNodes;
  };

  Getter.prototype.readAllASTs = function() {
    var AST, ASTs, node, _i, _len, _ref;
    ASTs = [];
    _ref = this.getAllStyleNodes();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      AST = this.readAST(node);
      if (AST) {
        ASTs.push(AST);
      }
    }
    return ASTs;
  };

  Getter.prototype.hasAST = function(node) {
    var mime;
    mime = typeof node.getAttribute === "function" ? node.getAttribute("type") : void 0;
    if (mime) {
      return mime.indexOf("text/gss") === 0;
    }
    return false;
  };

  Getter.prototype.getEngineForStyleNode = function(node) {
    return node.parentElement;
  };

  Getter.prototype.readAST = function(node) {
    var mime, reader;
    mime = node.getAttribute("type");
    reader = this["readAST:" + mime];
    if (reader) {
      return reader.call(this, node);
    }
    return null;
  };

  Getter.prototype['readAST:text/gss-ast'] = function(node) {
    var ast, e, source;
    source = node.innerHTML.trim();
    if (source.length === 0) {
      return {};
    }
    try {
      ast = JSON.parse(source);
    } catch (_error) {
      e = _error;
      console.error("Parsing compiled gss error", console.dir(e));
    }
    return ast;
  };

  Getter.prototype['readAST:text/gss'] = function(node) {
    throw new Error("did not include GSS's compilers");
  };

  return Getter;

})();

module.exports = Getter;
