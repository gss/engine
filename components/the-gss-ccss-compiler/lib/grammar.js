var Grammar,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Grammar = (function() {
  /* Private*/

  Grammar._createExpressionAST = function(head, tail) {
    var index, item, result, _i, _len;
    result = head;
    for (index = _i = 0, _len = tail.length; _i < _len; index = ++_i) {
      item = tail[index];
      result = [tail[index][1], result, tail[index][3]];
    }
    return result;
  };

  Grammar._reportError = function(message, line, column) {
    if ((line != null) && (column != null)) {
      message = "" + message + " {line:" + line + ", col:" + column + "}";
    }
    console.error(message);
    return message;
  };

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
    property = expression[1];
    properties = mapping[property];
    if (properties != null) {
      expressions = [];
      for (_i = 0, _len = properties.length; _i < _len; _i++) {
        item = properties[_i];
        expression = expression.slice();
        expression[1] = item;
        expressions.push(expression);
      }
    }
    return expressions;
  };

  Grammar.prototype._commands = null;

  Grammar.prototype._selectors = null;

  Grammar.prototype._addCommand = function(command) {
    return this._commands.push(command);
  };

  Grammar.prototype._addSelector = function(selector) {
    if (selector == null) {
      return;
    }
    if (__indexOf.call(this._selectors, selector) < 0) {
      this._selectors.push(selector);
    }
    return selector;
  };

  Grammar.prototype._column = function() {};

  Grammar.prototype._input = function() {};

  Grammar.prototype._line = function() {};

  /* Public*/


  function Grammar(input, line, column) {
    this.chainer = __bind(this.chainer, this);
    this._commands = [];
    this._selectors = [];
    this._input = input;
    this._line = line;
    this._column = column;
  }

  Grammar.prototype.start = function() {
    return {
      commands: JSON.parse(JSON.stringify(this._commands)),
      selectors: this._selectors
    };
  };

  Grammar.prototype.statement = function() {
    return {
      linearConstraint: function(expression) {
        return expression;
      },
      virtual: function(virtual) {
        return virtual;
      },
      conditional: function(conditional) {
        return conditional;
      },
      stay: function(stay) {
        return stay;
      },
      chain: function(chain) {
        return chain;
      },
      forEach: function(javaScript) {
        return javaScript;
      }
    };
  };

  Grammar.prototype.andOrExpression = function(head, tail) {
    return Grammar._createExpressionAST(head, tail);
  };

  Grammar.prototype.andOrOperator = function() {
    return {
      and: function() {
        return '&&';
      },
      or: function() {
        return '||';
      }
    };
  };

  Grammar.prototype.conditionalExpression = function(head, tail) {
    return Grammar._createExpressionAST(head, tail);
  };

  Grammar.prototype.conditionalOperator = function() {
    return {
      equal: function() {
        return '?==';
      },
      gt: function() {
        return '?>';
      },
      gte: function() {
        return '?>=';
      },
      lt: function() {
        return '?<';
      },
      lte: function() {
        return '?<=';
      },
      notEqual: function() {
        return '?!=';
      }
    };
  };

  Grammar.prototype.linearConstraint = function(head, tail, strengthAndWeight) {
    var command, firstExpression, headExpression, headExpressions, index, item, operator, secondExpression, tailExpression, tailExpressions, _i, _j, _len, _len1;
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
      for (index = _j = 0, _len1 = tailExpressions.length; _j < _len1; index = ++_j) {
        tailExpression = tailExpressions[index];
        headExpression = headExpressions[index];
        if ((headExpression != null) && (tailExpression != null)) {
          if (headExpressions.length > tailExpressions.length) {
            headExpression[1] = tailExpression[1];
          } else if (headExpressions.length < tailExpressions.length) {
            tailExpression[1] = headExpression[1];
          }
          command = [operator, headExpression, tailExpression].concat(strengthAndWeight);
          this._addCommand(command);
        }
      }
      firstExpression = secondExpression;
    }
    return "LinaearExpression";
  };

  Grammar.prototype.linearConstraintOperator = function() {
    return {
      equal: function() {
        return 'eq';
      },
      gt: function() {
        return 'gt';
      },
      gte: function() {
        return 'gte';
      },
      lt: function() {
        return 'lt';
      },
      lte: function() {
        return 'lte';
      }
    };
  };

  Grammar.prototype.constraintAdditiveExpression = function(head, tail) {
    return Grammar._createExpressionAST(head, tail);
  };

  Grammar.prototype.additiveExpression = function(head, tail) {
    return Grammar._createExpressionAST(head, tail);
  };

  Grammar.prototype.additiveOperator = function() {
    return {
      plus: function() {
        return 'plus';
      },
      minus: function() {
        return 'minus';
      }
    };
  };

  Grammar.prototype.constraintMultiplicativeExpression = function(head, tail) {
    return Grammar._createExpressionAST(head, tail);
  };

  Grammar.prototype.multiplicativeExpression = function(head, tail) {
    return Grammar._createExpressionAST(head, tail);
  };

  Grammar.prototype.multiplicativeOperator = function() {
    return {
      multiply: function() {
        return 'multiply';
      },
      divide: function() {
        return 'divide';
      }
    };
  };

  Grammar.prototype.constraintPrimaryExpression = function() {
    return {
      constraintAdditiveExpression: function(expression) {
        return expression;
      }
    };
  };

  Grammar.prototype.primaryExpression = function() {
    return {
      andOrExpression: function(expression) {
        return expression;
      }
    };
  };

  Grammar.prototype.variable = function(selector, variableNameCharacters) {
    var selectorName, variableName;
    variableName = variableNameCharacters.join('');
    if ((selector != null) && selector.length !== 0) {
      selectorName = selector.selector;
      this._addSelector(selectorName);
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
      if (selectorName === '::window') {
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
    if ((selector != null) && ((selectorName != null) || (selector.isVirtual != null))) {
      return ['get$', variableName, selector.ast];
    } else {
      return ['get', "[" + variableName + "]"];
    }
  };

  Grammar.prototype.literal = function(value) {
    return ['number', value];
  };

  Grammar.prototype.integer = function(digits) {
    return parseInt(digits.join(''), 10);
  };

  Grammar.prototype.real = function(digits) {
    return parseFloat(digits.join(''));
  };

  /* Query selectors*/


  Grammar.prototype.selector = function() {
    return {
      id: function(nameCharacters) {
        var selectorName;
        selectorName = Grammar._toString(nameCharacters);
        return {
          selector: "#" + selectorName,
          ast: ['$id', selectorName]
        };
      },
      reservedPseudoSelector: function(selectorName) {
        return {
          selector: "::" + selectorName,
          ast: ['$reserved', selectorName]
        };
      },
      virtual: function(nameCharacters) {
        var name;
        name = Grammar._toString(nameCharacters);
        return {
          isVirtual: true,
          ast: ['$virtual', name]
        };
      },
      "class": function(nameCharacters) {
        var selectorName;
        selectorName = Grammar._toString(nameCharacters);
        return {
          selector: "." + selectorName,
          ast: ['$class', selectorName]
        };
      },
      tag: function(nameCharacters) {
        var selectorName;
        selectorName = Grammar._toString(nameCharacters);
        return {
          selector: selectorName,
          ast: ['$tag', selectorName]
        };
      },
      all: function(parts) {
        var selector;
        selector = Grammar._toString(parts);
        return {
          selector: selector,
          ast: ['$all', selector]
        };
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

  Grammar.prototype.reservedPseudoSelector = function() {
    return {
      window: function() {
        return 'window';
      },
      "this": function() {
        return 'this';
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
        return Grammar._reportError('Invalid Strength or Weight', _this._line(), _this._column());
      }
    };
  };

  Grammar.prototype.weight = function(weight) {
    return Number(weight.join(''));
  };

  Grammar.prototype.strength = function(strength) {
    return {
      require: function() {
        return 'require';
      },
      strong: function() {
        return 'strong';
      },
      medium: function() {
        return 'medium';
      },
      weak: function() {
        return 'weak';
      },
      required: function() {
        return 'require';
      }
    };
  };

  /* Virtual Elements*/


  Grammar.prototype.virtualElement = function(names) {
    var command;
    command = ['virtual'].concat(names);
    this._addCommand(command);
    return command;
  };

  Grammar.prototype.virtualElementName = function(nameCharacters) {
    return nameCharacters.join('');
  };

  /* Stays*/


  Grammar.prototype.stay = function(variables) {
    var command, expression, expressions, index, stay, _i, _len;
    stay = ['stay'].concat(variables);
    expressions = Grammar._unpack2DExpression(stay[1]);
    for (index = _i = 0, _len = expressions.length; _i < _len; index = ++_i) {
      expression = expressions[index];
      command = stay.slice();
      command[1] = expressions[index];
      this._addCommand(command);
    }
    return stay;
  };

  Grammar.prototype.stayVariable = function(variable) {
    return variable;
  };

  /* Conditionals*/


  Grammar.prototype.conditional = function(result) {
    this._addCommand(result);
    return result;
  };

  /* JavaScript hooks*/


  Grammar.prototype.forEach = function(type, selector, javaScript) {
    var selectorName;
    selectorName = selector.selector;
    this._addSelector(selectorName);
    return this._addCommand([type, selector.ast, javaScript]);
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
    var ast, chainer, selectorName, _i, _len;
    selectorName = selector.selector;
    this._addSelector(selectorName);
    ast = ['chain', selector.ast];
    for (_i = 0, _len = chainers.length; _i < _len; _i++) {
      chainer = chainers[_i];
      ast = ast.concat(chainer);
    }
    return this._addCommand(ast);
  };

  Grammar.prototype.chainer = function(options) {
    var asts, bridgeValue, createChainAST, head, headAST, headCharacters, headExpression, headOperator, strengthAndWeight, tail, tailAST, tailCharacters, tailOperator;
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
    headAST = createChainAST(headOperator, head, tail);
    if (bridgeValue != null) {
      headAST = createChainAST(headOperator, head, bridgeValue);
    }
    asts.push(headAST);
    if ((bridgeValue != null) && (tailOperator != null)) {
      tailAST = createChainAST(tailOperator, bridgeValue, tail);
      asts.push(tailAST);
    } else {
      Grammar._reportError('Invalid Chain Statement', this._line(), this._column());
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

  Grammar.prototype.chainLinearConstraintOperator = function(operator) {
    if (operator == null) {
      operator = 'eq';
    }
    operator = "" + operator + "-chain";
    return operator;
  };

  return Grammar;

})();

module.exports = Grammar;
