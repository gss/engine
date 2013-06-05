var Getter;

Getter = function(container) {
  this.container = (container ? container : document);
  return this.container;
};

Getter.prototype.get = function(selector) {
  var identifier, method;
  method = selector[0];
  identifier = selector[1];
  switch (method) {
    case "$id":
      return this.getById(identifier);
    case "$class":
      return this.getByClass(identifier);
    case "$tag":
      return this.getByTag(identifier);
  }
  return document.querySelectorAll(identifier);
};

module.exports = Getter;
