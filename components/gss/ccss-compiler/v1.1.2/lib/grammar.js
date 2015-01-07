var Grammar, cloneCommand;

cloneCommand = function(command) {
  var clone, part, _i, _len;
  clone = [];
  for (_i = 0, _len = command.length; _i < _len; _i++) {
    part = command[_i];
    if (typeof part !== 'object') {
      clone.push(part);
    } else if (part instanceof Array) {
      clone.push(cloneCommand(part));
    }
  }
  return clone;
};

Grammar = (function() {
  /* Private*/

  Grammar._toString = function(input) {
    if (toString.call(input) === '[object String]') {
      return input;
    }
    if (toString.call(input) === '[object Array]') {
      return input.join('');
    }
    return '';
  };

  Grammar._unpack2DExpression = function(expression) {
    var expressions, item, mapping, properties, property, _i, _len;
    mapping = {
      'bottom-left': ['left', 'bottom'],
      'bottom-right': ['right', 'bottom'],
      center: ['center-x', 'center-y'],
      'intrinsic-size': ['intrinsic-width', 'intrinsic-height'],
      position: ['x', 'y'],
      size: ['width', 'height'],
      'top-left': ['left', 'top'],
      'top-right': ['right', 'top']
    };
    expressions = [expression];
    property = expression[2];
    properties = mapping[property];
    if (properties != null) {
      expressions = [];
      for (_i = 0, _len = properties.length; _i < _len; _i++) {
        item = properties[_i];
        expression = expression.slice();
        expression[2] = item;
        expressions.push(expression);
      }
    }
    return expressions;
  };

  Grammar.prototype._Error = null;

  Grammar.prototype._columnNumber = function() {};

  Grammar.prototype._lineNumber = function() {};

  /* Public*/


  Grammar.prototype.reverseFilterNest = function(commands) {
    var i, innie, innieClone, len, outie, outieCommand, results, _i, _len, _ref;
    len = commands.length;
    i = len - 1;
    while (i > 0) {
      outie = commands[i];
      innie = commands[i - 1];
      if (outie[0] === ',') {
        results = [','];
        _ref = outie.slice(1, outie.length);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          outieCommand = _ref[_i];
          innieClone = cloneCommand(innie);
          results.push(this.reverseFilterNest([innieClone, outieCommand]));
        }
        commands[i] = results;
      } else if (outie[0] === '$pseudo' && innie[0] === ',') {
        if (outie[1] === 'first' && innie[1][0] === 'virtual') {
          commands[i] = innie[1];
        } else if (outie[1] === 'last' && innie[innie.length - 1][0] === 'virtual') {
          commands[i] = innie[innie.length - 1];
        }
      } else {
        outie.splice(1, 0, innie);
      }
      i--;
    }
    return commands[len - 1];
  };

  Grammar.prototype.nestedDualTermCommands = function(head, tail) {
    var index, item, result, _i, _len;
    result = head;
    for (index = _i = 0, _len = tail.length; _i < _len; index = ++_i) {
      item = tail[index];
      result = [tail[index][1], result, tail[index][3]];
    }
    return result;
  };

  Grammar.prototype.createSelectorCommaCommand = function(head, tail) {
    var index, item, result, subSel, _i, _len;
    if (head[0] === ',') {
      result = head;
    } else {
      result = [',', head];
    }
    for (index = _i = 0, _len = tail.length; _i < _len; index = ++_i) {
      item = tail[index];
      subSel = tail[index][3];
      if (subSel[0] === ',') {
        subSel.splice(0, 1);
        result = result.concat(subSel);
      } else {
        result.push(subSel);
      }
    }
    return result;
  };

  Grammar.prototype.mergeCommands = function(objs) {
    var commands, o, _i, _len;
    commands = [];
    for (_i = 0, _len = objs.length; _i < _len; _i++) {
      o = objs[_i];
      commands = commands.concat(o.commands);
    }
    return {
      commands: commands
    };
  };

  Grammar.prototype.splatifyIfNeeded = function(commandBase, o) {
    if (o.splats) {
      return this.splatExpander(commandBase, o);
    } else {
      return [commandBase, o];
    }
  };

  Grammar.prototype.splatExpander = function(commandBase, o) {
    var command, cur, currentNames, from, i, name, names, newNames, postfix, prefix, splat, splats, to, _i, _j, _k, _l, _len, _len1, _len2, _len3;
    splats = o.splats, postfix = o.postfix;
    names = null;
    for (_i = 0, _len = splats.length; _i < _len; _i++) {
      splat = splats[_i];
      prefix = splat.prefix, from = splat.from, to = splat.to;
      currentNames = [];
      i = from;
      while (i <= to) {
        currentNames.push(prefix + i);
        i++;
      }
      if (!names) {
        names = currentNames;
      } else {
        newNames = [];
        for (_j = 0, _len1 = names.length; _j < _len1; _j++) {
          name = names[_j];
          for (_k = 0, _len2 = currentNames.length; _k < _len2; _k++) {
            cur = currentNames[_k];
            newNames.push(name + cur);
          }
        }
        names = newNames;
      }
    }
    command = [','];
    for (_l = 0, _len3 = names.length; _l < _len3; _l++) {
      name = names[_l];
      if (postfix) {
        name += postfix;
      }
      command.push([commandBase, name]);
    }
    return command;
  };

  function Grammar(parser, lineNumber, columnNumber, errorType) {
    this.parser = parser;
    this._lineNumber = lineNumber;
    this._columnNumber = columnNumber;
    this._Error = errorType();
  }

  Grammar.prototype.constraint = function(head, tail, strengthAndWeight) {
    var command, commands, firstExpression, headExpression, headExpressions, index, item, operator, secondExpression, tailExpression, tailExpressions, _i, _j, _len, _len1;
    commands = [];
    firstExpression = head;
    if ((strengthAndWeight == null) || strengthAndWeight.length === 0) {
      strengthAndWeight = [];
    }
    for (index = _i = 0, _len = tail.length; _i < _len; index = ++_i) {
      item = tail[index];
      operator = tail[index][1];
      secondExpression = tail[index][3];
      headExpressions = Grammar._unpack2DExpression(firstExpression);
      tailExpressions = Grammar._unpack2DExpression(secondExpression);
      if (headExpressions.length > tailExpressions.length) {
        tailExpressions.push(tailExpressions[0]);
      } else if (headExpressions.length < tailExpressions.length) {
        headExpressions.push(headExpressions[0]);
      }
      for (index = _j = 0, _len1 = tailExpressions.length; _j < _len1; index = ++_j) {
        tailExpression = tailExpressions[index];
        headExpression = headExpressions[index];
        if ((headExpression != null) && (tailExpression != null)) {
          command = [operator, headExpression, tailExpression].concat(strengthAndWeight);
          commands.push(command);
        }
      }
      firstExpression = secondExpression;
    }
    return {
      commands: commands
    };
  };

  Grammar.prototype.inlineConstraint = function(prop, op, rest) {
    var result;
    prop = prop.join('').trim();
    rest = rest.join('').trim();
    result = this.parser.parse("&[" + prop + "] " + op + " " + rest);
    return result;
  };

  Grammar.prototype.inlineSet = function(prop, rest) {
    var commands;
    prop = prop.join('').trim();
    rest = rest.join('').trim();
    commands = [['set', prop, rest]];
    return {
      commands: commands
    };
  };

  Grammar.prototype.directive = function(name, terms, commands) {
    var ast, hook;
    hook = this.parser.hooks.directives[name];
    if (hook) {
      return hook(name, terms, commands);
    }
    ast = ['directive', name, terms];
    if (commands) {
      ast.push(commands);
    }
    return {
      commands: [ast]
    };
  };

  Grammar.prototype.variable = function(negative, selector, variableNameCharacters) {
    var command, variableName;
    variableName = Grammar._toString(variableNameCharacters);
    if ((selector != null) && selector.length !== 0) {
      switch (variableName) {
        case 'left':
          variableName = 'x';
          break;
        case 'top':
          variableName = 'y';
          break;
        case 'cx':
          variableName = 'center-x';
          break;
        case 'cy':
          variableName = 'center-y';
          break;
      }
      if (selector.toString().indexOf('::window') !== -1) {
        switch (variableName) {
          case 'right':
            variableName = 'width';
            break;
          case 'bottom':
            variableName = 'height';
            break;
        }
      }
    }
    if (selector != null) {
      command = ['get', selector, variableName];
    } else {
      command = ['get', variableName];
    }
    if (negative) {
      return ['-', 0, command];
    } else {
      return command;
    }
  };

  Grammar.prototype.integer = function(digits) {
    return parseInt(digits.join(''), 10);
  };

  Grammar.prototype.signedInteger = function(sign, integer) {
    if (integer == null) {
      integer = 0;
    }
    return parseInt("" + sign + integer, 10);
  };

  Grammar.prototype.signedReal = function(sign, real) {
    if (real == null) {
      real = 0;
    }
    return parseFloat("" + sign + real);
  };

  /* Query selectors*/


  Grammar.prototype.selector = function() {
    return {
      id: function(nameCharacters) {
        var selectorName;
        selectorName = Grammar._toString(nameCharacters);
        return ['$id', selectorName];
      },
      virtual: function(nameCharacters) {
        var name;
        name = Grammar._toString(nameCharacters);
        return ['virtual', name];
      },
      "class": function(nameCharacters) {
        var selectorName;
        selectorName = Grammar._toString(nameCharacters);
        return ['$class', selectorName];
      },
      tag: function(nameCharacters) {
        var selectorName;
        selectorName = Grammar._toString(nameCharacters);
        return ['$tag', selectorName];
      },
      all: function(parts) {
        var selector;
        selector = Grammar._toString(parts);
        return ['$all', selector];
      }
    };
  };

  Grammar.prototype.querySelectorAllParts = function() {
    return {
      withoutParens: function(selectorCharacters) {
        return Grammar._toString(selectorCharacters);
      },
      withParens: function(selectorCharacters) {
        var selector;
        selector = Grammar._toString(selectorCharacters);
        return "(" + selector + ")";
      }
    };
  };

  /* Strength and weight directives*/


  Grammar.prototype.strengthAndWeight = function() {
    var _this = this;
    return {
      valid: function(strength, weight) {
        if ((weight == null) || weight.length === 0) {
          return [strength];
        }
        return [strength, weight];
      },
      invalid: function() {
        throw new _this._Error('Invalid Strength or Weight', null, null, null, _this._lineNumber(), _this._columnNumber());
      }
    };
  };

  /* Virtual Elements*/


  Grammar.prototype.virtualElement = function(names) {
    return {
      commands: [['virtual'].concat(names)]
    };
  };

  /* Stays*/


  Grammar.prototype.stay = function(variables) {
    var command, commands, expression, expressions, index, stay, _i, _len;
    stay = ['stay'].concat(variables);
    expressions = Grammar._unpack2DExpression(stay[1]);
    commands = [];
    for (index = _i = 0, _len = expressions.length; _i < _len; index = ++_i) {
      expression = expressions[index];
      command = stay.slice();
      command[1] = expressions[index];
      commands.push(command);
    }
    return {
      commands: commands
    };
  };

  Grammar.prototype.stayVariable = function(variable) {
    return variable;
  };

  /* Conditionals*/


  Grammar.prototype.conditional = function(result) {
    var commands;
    commands = [result];
    return {
      commands: commands
    };
  };

  return Grammar;

})();

module.exports = Grammar;
