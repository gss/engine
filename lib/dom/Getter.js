var Getter, getScrollbarWidth, scrollbarWidth;

getScrollbarWidth = function() {
  var inner, outer, w1, w2;
  inner = document.createElement("p");
  inner.style.width = "100%";
  inner.style.height = "200px";
  outer = document.createElement("div");
  outer.style.position = "absolute";
  outer.style.top = "0px";
  outer.style.left = "0px";
  outer.style.visibility = "hidden";
  outer.style.width = "200px";
  outer.style.height = "150px";
  outer.style.overflow = "hidden";
  outer.style.zoom = "document";
  outer.appendChild(inner);
  document.body.appendChild(outer);
  w1 = inner.offsetWidth;
  outer.style.overflow = "scroll";
  w2 = inner.offsetWidth;
  if (w1 === w2) {
    w2 = outer.clientWidth;
  }
  document.body.removeChild(outer);
  return w1 - w2;
};

scrollbarWidth = null;

Getter = (function() {
  function Getter(scope) {
    this.scope = scope;
    this.styleNodes = null;
    if (!this.scope) {
      this.scope = document;
    }
  }

  Getter.prototype.clean = function() {};

  Getter.prototype.destroy = function() {
    this.scope = null;
    return this.styleNodes = null;
  };

  Getter.prototype.scrollbarWidth = function() {
    if (!scrollbarWidth) {
      scrollbarWidth = getScrollbarWidth();
    }
    return scrollbarWidth;
  };

  Getter.prototype.get = function(selector) {
    var identifier, method;
    method = selector[0];
    identifier = selector[1];
    switch (method) {
      case "$reserved":
        if (identifier === 'this') {
          return this.scope;
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
        return this.scope.getElementsByClassName(identifier);
      case "$tag":
        return this.scope.getElementsByTagName(identifier);
    }
    return this.scope.querySelectorAll(identifier);
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

  Getter.prototype.offsets = function(element) {
    var offsets;
    offsets = {
      x: 0,
      y: 0
    };
    if (!element.offsetParent) {
      return offsets;
    }
    element = element.offsetParent;
    while (true) {
      offsets.x += element.offsetLeft;
      offsets.y += element.offsetTop;
      if (!element.offsetParent) {
        break;
      }
      element = element.offsetParent;
    }
    return offsets;
  };

  Getter.prototype.view = function(node) {
    return GSS.View.byId[GSS.getId(node)];
  };

  Getter.prototype.getAllStyleNodes = function() {
    return this.scope.getElementsByTagName("style");
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

  Getter.prototype.scopeFor = function(node) {
    if (this.isStyleNode(node)) {
      return this.scopeForStyleNode(node);
    } else {
      return this.nearestScope(node);
    }
  };

  Getter.prototype.isStyleNode = function(node) {
    var mime, tagName;
    tagName = node != null ? node.tagName : void 0;
    if (tagName === "STYLE" || tagName === "LINK") {
      mime = typeof node.getAttribute === "function" ? node.getAttribute("type") : void 0;
      if (mime) {
        return mime.indexOf("text/gss") === 0;
      }
    }
    return false;
  };

  Getter.prototype.scopeForStyleNode = function(node) {
    var scoped;
    scoped = node.getAttribute('scoped');
    if ((scoped != null) && scoped !== "false") {
      return node.parentElement;
    } else {
      return Getter.getRootScope();
    }
  };

  Getter.prototype.isScope = function(el) {
    return !!(el != null ? el._gss_is_scope : void 0);
  };

  Getter.prototype.nearestScope = function(el, skipSelf) {
    if (skipSelf == null) {
      skipSelf = false;
    }
    if (skipSelf) {
      el = el.parentElement;
    }
    while (el.parentElement) {
      if (this.isScope(el)) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  };

  Getter.prototype.nearestEngine = function(el, skipSelf) {
    var scope;
    if (skipSelf == null) {
      skipSelf = false;
    }
    scope = this.nearestScope(el, skipSelf);
    if (scope) {
      return this.engine(scope);
    }
    return null;
  };

  Getter.prototype.descdendantNodes = function(el) {
    return el.getElementsByTagName("*");
  };

  Getter.prototype.engine = function(el) {
    return GSS.engines.byId[GSS.getId(el)];
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
    source = node.textContent.trim();
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

Getter.getRootScope = function() {
  if (typeof ShadowDOMPolyfill === "undefined" || ShadowDOMPolyfill === null) {
    return document.body;
  } else {
    return ShadowDOMPolyfill.wrap(document.body);
  }
};

module.exports = Getter;
