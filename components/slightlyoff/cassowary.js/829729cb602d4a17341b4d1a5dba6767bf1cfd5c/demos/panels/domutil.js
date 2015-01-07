/**
 * Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)
 * Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
 */

(function(scope) {
"use strict";

scope.$$ = function(query, opt_contextElement) {
  if (!query)
    return [];

  var contextNode = opt_contextElement || document;
  var isDoc = contextNode.nodeType == Node.DOCUMENT_NODE;
  var doc = isDoc ? contextNode : contextNode.ownerDocument;

  // Rewrite the query to be ID rooted.
  if (!isDoc) {
    if (!contextNode.hasAttribute('id'))
      contextNode.id = 'unique' + query.counter_++;
    query = '#' + contextNode.id + ' ' + query;
  }

  var rv = doc.querySelectorAll(query);
  rv.__proto__ = Array.prototype;
  return rv;
}

scope.$$.counter_ = 0;

scope.$ = function(query, opt_contextElement) {
  return $$(query, opt_contextElement)[0];
}

// requestAnimationFrame shimming.
scope.rAF = window.requestAnimationFrame     ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          window.oRequestAnimationFrame      ||
          window.msRequestAnimationFrame     ||
          function(callback) {
            window.setTimeout(callback, 1000 / 60);
          };

//
// Observe the document and upgrade custom elements that are added.
//
var tagMap = {};

var upTo = function(type) {
  var up = type.prototype.upgrade;
  return function(el) {
    if (!(el instanceof type) && up) {
      up(el);
      if (el.parentNode) { el.attach(); }
    }
  };
};

scope.HTMLElement.register = function(type) {
  var tn = type.tagName || type.prototype.tagName;
  var upgrade = upTo(type);

  tagMap[tn] = type;

  if ((scope.WebKitMutationObserver || scope.MutationObserver) &&
      scope.MutationSummary) {
    var ms = new MutationSummary({
      callback: function(summaries) {
        var s = summaries[0];
        s.added.forEach(upgrade);
      },
      queries: [{ element: tn }]
    });
  }
};

// SUPER hackey. Since we don't seem to be able to locate elements as they're
// created by the initial parse, look for them on startup and run the upgrade
// if we need to.
document.addEventListener("root", function(e) {
  console.time("root");
  Object.keys(tagMap).forEach(function(tn) {
    var elements = document.querySelectorAll(tn);
    Array.prototype.slice.call(elements).forEach(upTo(tagMap[tn]));
  });
  console.timeEnd("root");
}, false);

})(window);
