var Engine;

Engine = (function() {
  Engine.prototype.Expressions = require('./Expressions.js');

  Engine.prototype.References = require('./References.js');

  function Engine(scope) {
    var engine, id;
    if (scope && scope.nodeType) {
      if (!this.References) {
        while (scope) {
          if (id = Document.prototype.References.get(scope)) {
            if (engine = Engine[id]) {
              return engine;
            }
          }
          if (!scope.parentNode) {
            break;
          }
          scope = scope.parentNode;
        }
        return new Document(scope);
      }
      id = this.References.get(scope, true);
      if (engine = Engine[id]) {
        return engine;
      }
      Engine[id] = this;
      this.scope = scope;
    }
    if (this.References) {
      this.expressions = new this.Expressions(this);
      this.references = new this.References(this);
      return;
    } else {
      return new arguments.callee(scope);
    }
  }

  Engine.prototype.evaluate = function() {
    return this.expressions.evaluate.apply(this.expressions, arguments);
  };

  Engine.prototype["return"] = function(command) {
    return this.output.pipe(command);
  };

  return Engine;

})();

module.exports = Engine;
