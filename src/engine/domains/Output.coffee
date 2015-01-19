Input      = require('./Input')
Constraint = require('../commands/Constraint')

class Output extends Input
  immutable: true
  priority: -200
  finalized: true

  Gradient:     require('../types/Gradient')
  Matrix:       require('../types/Matrix')
  Easing:       require('../types/Easing')
  Color:        require('../types/Color')
  URL:          require('../types/URL')

  @Primitive:   require('../types/Primitive')
  Number:       @Primitive.Number
  Integer:      @Primitive.Integer
  String:       @Primitive.String
  Strings:      @Primitive.Strings
  Size:         @Primitive.Size
  Position:     @Primitive.Position
  
Output::Constraint = Constraint.extend {
  signature: [
    left:     ['Variable', 'Number', 'Constraint'],
    right:    ['Variable', 'Number', 'Constraint']
  ]
},
  "&&": (a, b) ->
    return a && b

  "||": (a, b) ->
    return a || b
    
  "!=": (a, b) ->
    return a == b

  "==": (a, b) ->
    return a == b

  "<=": (a, b) ->
    return a <= b

  ">=": (a, b) ->
    return a >= b

  "<": (a, b) ->
    return a < b

  ">": (a, b) ->
    return a > b

module.exports = Output
