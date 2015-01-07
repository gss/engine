// Adapted from
//    http://divergentcoder.com/ToyLang/Grammar.pegjs
//  and:
//    https://github.com/dmajda/pegjs/blob/master/examples/javascript.pegjs

start
  = __ statements:(Statement*) __ { return statements; }

Statement
  = expression:LinearExpression EOS { return expression; }

SourceCharacter
  = .

IdentifierStart
  = [a-zA-Z]
  / "$"
  / "_"

WhiteSpace "whitespace"
  = [\t\v\f \u00A0\uFEFF]

LineTerminator
  = [\n\r\u2028\u2029]

LineTerminatorSequence "end of line"
  = "\n"
  / "\r\n"
  / "\r"
  / "\u2028" // line separator
  / "\u2029" // paragraph separator

EOS
  = __ ";"
  / _ LineTerminatorSequence
  / __ EOF

EOF
  = !.

Comment "comment"
  = MultiLineComment
  / SingleLineComment

MultiLineComment
  = "/*" (!"*/" SourceCharacter)* "*/"

MultiLineCommentNoLineTerminator
  = "/*" (!("*/" / LineTerminator) SourceCharacter)* "*/"

SingleLineComment
  = "//" (!LineTerminator SourceCharacter)* (LineTerminator / EOF)

_
  = (WhiteSpace / MultiLineCommentNoLineTerminator / SingleLineComment)*

__
  = (WhiteSpace / LineTerminatorSequence / Comment)*

Literal
  = val:(Real / Integer) {
    return {
      type: "NumericLiteral",
      value: val
    }
  }

Integer
  = digits:[0-9]+ {
    return parseInt(digits.join(""));
  }

Real
  = digits:(Integer "." Integer) {
    return parseFloat(digits.join(""));
  }

SignedInteger
  = [-+]? [0-9]+

Identifier "identifier"
  = name:IdentifierName { return name; }

IdentifierName "identifier"
  = start:IdentifierStart parts:IdentifierStart* {
      return start + parts.join("");
    }

PrimaryExpression
  = name:Identifier { return { type: "Variable", name: name }; }
  / Literal
  / "(" __ expression:LinearExpression __ ")" { return expression; }

UnaryExpression
  = PrimaryExpression
  / operator:UnaryOperator __ expression:UnaryExpression {
      return {
        type:       "UnaryExpression",
        operator:   operator,
        expression: expression
      };
    }

UnaryOperator
  = "+"
  / "-"
  /  "!"

MultiplicativeExpression
  = head:UnaryExpression
    tail:(__ MultiplicativeOperator __ UnaryExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "MultiplicativeExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

MultiplicativeOperator
  = "*" / "/"

AdditiveExpression
  = head:MultiplicativeExpression
    tail:(__ AdditiveOperator __ MultiplicativeExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "AdditiveExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

AdditiveOperator
  = "+" / "-"

InequalityExpression
  = head:AdditiveExpression
    tail:(__ InequalityOperator __ AdditiveExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "Inequality",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

InequalityOperator
  = "<="
  / ">="
  / "<"
  / ">"

LinearExpression
  = head:InequalityExpression
    tail:(__ "==" __ InequalityExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "Equality",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }
