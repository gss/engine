var Registry;

module.exports = Registry = (function() {
  function Registry(object) {
    this.object = object;
  }

  Registry.prototype.append = function(path, value) {
    var group;
    group = this[path] || (this[path] = []);
    if (typeof value !== 'string') {
      value = path + this.object.toId(value);
    }
    return group.push(value);
  };

  Registry.prototype.remove = function(path, value) {
    var group, index;
    if (group = this[path]) {
      if ((index = group.indexOf(value)) > -1) {
        return group.splice(index, 0);
      }
    }
  };

  return Registry;

})();
