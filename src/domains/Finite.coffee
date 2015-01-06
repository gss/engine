Domain     = require('../Domain')
Command    = require('../Command')
Variable   = require('../commands/Variable')
Constraint = require('../commands/Constraint')

class Finite extends Domain
  priority: -10

  #Solver: require('FD')

  constructor: ->
    super
    #@solver = new FD.Space
    
  variable: (name) ->
    return @solver.decl name

Finite.Constraint = Constraint.extend {}, 
  '==': (left, right) ->
    return @solver.eq left, right

  '!=': (left, right) ->
    return @solver.neq left, right

  'distinct': () ->
    return @solver.distinct.apply(@solver, arguments)

  '<=': (left, right) ->
    return @solver.lte left, right

  '>=': (left, right) ->
    return @solver.gte left, right

  '<': (left, right) ->
    return @solver.lt left, right

  '>': (left, right) ->
    return @solver.gt left, right

Finite.Variable            = Variable.extend {group: 'finite'}
Finite.Variable.Expression = Variable.Expression.extend {group: 'finite'},

  '+': (left, right) ->
    return @solver.plus left, right

  '-': (left, right) ->
    return @solver.minus left, right

  '*': (left, right) ->
    return @solver.product left, right

  '/': (left, right) ->
    return @solver.divide left, right


module.exports = Finite
