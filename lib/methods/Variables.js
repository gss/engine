var Variables;

Variables = (function() {
  function Variables() {}

  Variables.prototype.get = {
    command: function(operation, continuation, scope, meta, object, property, primitive) {
      var getter, id;
      if (property) {
        if (typeof object === 'string') {
          id = object;
        } else if (object.absolute === 'window' || object === document) {
          id = '::window';
        } else if (object.nodeType) {
          id = this.identity.provide(object);
        }
      } else {
        id = '';
        property = object;
        object = void 0;
      }
      /*
      # TODO: Compute statically
      if operation && !primitive
        parent = child = operation
        while parent = parent.parent
          if child.index
            if parent.def.primitive == child.index
              primitive = true
              break
      
          child = parent
      
      # Compute custom property, canonicalize path
      if ((property.indexOf('intrinsic-') > -1) || @properties[id]?[property]?)
        path = @measure(id, property, continuation, true, true, primitive)
        if typeof path == 'string' && (index = path.indexOf('[')) > -1
          id = path.substring(0, index)
          property = path.substring(index + 1, path.length - 1)
      
      # Expand properties like [center-y]
      else
        if id && (prop = @properties[property])
          if typeof prop == 'function' && prop.initial == undefined
            return prop.call(@, id, continuation)
      
      # Do not create solver variable, return value
      if primitive# && path != undefined
        return @values.watch(id, property, operation, continuation, scope)
      */

      getter = ['get', id, property, this.getContinuation(continuation || '')];
      getter.meta = this.getSpaceFor(getter);
      return getter;
    }
  };

  Variables.prototype.getSpaceFor = function(variable) {
    if (this.getIntrinsicProperty(property)) {
      return 'measurements';
    }
    return 'solutions';
  };

  Variables.prototype.set = {
    command: function(operation, continuation, scope, meta, property, value) {
      var prop;
      prop = this.camelize(property);
      if (scope && scope.style[prop] !== void 0) {
        this.setStyle(scope, prop, value);
      }
    }
  };

  Variables.prototype.suggest = {
    command: function(operation, continuation, scope, meta, variable, value, strength, weight, contd) {
      if (continuation) {
        contd || (contd = this.getContinuation(continuation));
      }
      return ['suggest', variable, value, strength != null ? strength : null, weight != null ? weight : null, contd != null ? contd : null];
    }
  };

  Variables.prototype.toPrimitive = function(object, operation, continuation, scope, element, prop) {
    var value;
    if (typeof object === 'string') {
      object = this.parse(object);
    }
    if (typeof object === 'object') {
      if (object[0] === 'get' && this.getIntrinsicProperty(object[2])) {
        value = this.get.command.call(this, operation, continuation, scope, 'return', object[1], object[2], true);
        if (value != null) {
          if (typeof (object = value) !== 'object') {
            return object;
          }
        } else {
          return object;
        }
      }
      if ((continuation == null) && element) {
        continuation = this.getPath(element, prop);
      }
      return this.expressions.solve('toPrimitive(' + continuation + ')', object, continuation, scope, 'return');
    }
    return object;
  };

  Variables.prototype._staticUnit = /^(-?\d+)(px|pt|cm|mm|in)$/i;

  Variables.prototype.parse = function(value) {
    var match, old;
    if ((old = (this.parsed || (this.parsed = {}))[value]) == null) {
      if (typeof value === 'string') {
        if (match = value.match(this._staticUnit)) {
          return this.parsed[value] = this[match[2]](parseFloat(match[1]));
        } else {
          value = 'a: == ' + value + ';';
          return this.parsed[value] = GSS.Parser.parse(value).commands[0][2];
        }
      } else {
        return value;
      }
    }
    return old;
  };

  return Variables;

})();
