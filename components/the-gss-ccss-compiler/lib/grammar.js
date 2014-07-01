var Grammar,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

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
    var index, item, result, _i, _len;
    result = [',', head];
    for (index = _i = 0, _len = tail.length; _i < _len; index = ++_i) {
      item = tail[index];
      result.push(tail[index][3]);
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

  function Grammar(parser, lineNumber, columnNumber, errorType) {
    this.chainer = __bind(this.chainer, this);
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

  Grammar.prototype.variable = function(selector, variableNameCharacters) {
    var variableName;
    variableName = variableNameCharacters.join('');
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
      if (selector.toString().indexOf('$reserved,window') !== -1) {
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
      return ['get', selector, variableName];
    } else {
      return ['get', variableName];
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
      reservedPseudoSelector: function(selectorName) {
        return ['$reserved', selectorName];
      },
      virtual: function(nameCharacters) {
        var name;
        name = Grammar._toString(nameCharacters);
        return ['$virtual', name];
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

  /* JavaScript hooks*/


  Grammar.prototype.forEach = function(type, selector, javaScript) {
    return {
      commands: [[type, selector, javaScript]]
    };
  };

  Grammar.prototype.javaScript = function(characters) {
    return ['js', characters.join('').trim()];
  };

  Grammar.prototype.forLoopType = function() {
    return {
      forEach: function() {
        return 'for-each';
      },
      forAll: function() {
        return 'for-all';
      }
    };
  };

  /* Chains*/


  Grammar.prototype.chain = function(selector, chainers) {
    var ast, chainer, _i, _len;
    ast = ['chain', selector];
    for (_i = 0, _len = chainers.length; _i < _len; _i++) {
      chainer = chainers[_i];
      ast = ast.concat(chainer);
    }
    return {
      commands: [ast]
    };
  };

  Grammar.prototype.chainer = function(options) {
    var asts, bridgeValue, createChainAST, head, headCharacters, headExpression, headOperator, strengthAndWeight, tail, tailCharacters, tailOperator,
      _this = this;
    headCharacters = options.headCharacters, headExpression = options.headExpression, headOperator = options.headOperator, bridgeValue = options.bridgeValue, tailOperator = options.tailOperator, strengthAndWeight = options.strengthAndWeight, tailCharacters = options.tailCharacters;
    asts = [];
    head = Grammar._toString(headCharacters);
    tail = Grammar._toString(tailCharacters);
    createChainAST = function(operator, firstExpression, secondExpression) {
      var ast;
      ast = [operator, firstExpression, secondExpression];
      if (strengthAndWeight != null) {
        ast = ast.concat(strengthAndWeight);
      }
      return ast;
    };
    if (tail.length === 0) {
      tail = head;
    }
    if (headExpression != null) {
      headExpression.splice(1, 1, head);
      head = headExpression;
    }
    if (bridgeValue != null) {
      asts.push(createChainAST(headOperator, head, bridgeValue));
      if (tailOperator != null) {
        asts.push(createChainAST(tailOperator, bridgeValue, tail));
      } else {
        throw new this._Error('Invalid Chain Statement', null, null, null, this._lineNumber(), this._columnNumber());
      }
    } else {
      asts.push(createChainAST(headOperator, head, tail));
    }
    return asts;
  };

  Grammar.prototype.headExpression = function(operator, expression) {
    return [operator, '_REPLACE_ME_', expression];
  };

  Grammar.prototype.tailExpression = function(expression, operator) {
    return [operator, expression, '_REPLACE_ME_'];
  };

  Grammar.prototype.chainMathOperator = function() {
    return {
      plus: function() {
        return 'plus-chain';
      },
      minus: function() {
        return 'minus-chain';
      },
      multiply: function() {
        return 'multiply-chain';
      },
      divide: function() {
        return 'divide-chain';
      }
    };
  };

  Grammar.prototype.chainConstraintOperator = function(op) {
    var opMap, operator;
    if (op == null) {
      op = '==';
    }
    opMap = {
      "==": "eq",
      "<=": "lte",
      ">=": "gte",
      "<": "lt",
      ">": "gt"
    };
    operator = "" + opMap[op] + "-chain";
    return operator;
  };

  return Grammar;

})();

module.exports = Grammar;
