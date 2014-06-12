class Constraints
  constructor: (@engine) ->
    @solver = new c.SimplexSolver()

  read: ->

  write: ->

  eq: (a, b, s, w) -> 
    return c.Equation(a, b, s, w)

  lte: (a, b, s, w) ->
    return c.Inequality(a, c.LEQ, b, @strength(s), @weight(w))

  gte: (a, b, s, w) ->
    return c.Inequality(a, c.GEQ, b, @strength(s), @weight(w))

  lt: (a, b, s, w) ->
    return c.Inequality(a, c.LEQ, b, @strength(s), @weight(w))

  gt: (a, b, s, w) ->
    return c.Inequality(a, c.GEQ, b, @strength(s), @weight(w))

  plus: (a, b) ->
    return c.plus(a, b)

  minus: (a, b) ->
    return c.minus(a, b)

  multiply: (a, b) ->
    return c.times(a, b)

  divide: (a, b) ->
    return c.divide(a, b)

  edit: (a, s, w) ->
    @solver.addEditVar(a)

  suggest: (a, b, s, w) ->
    @solver.solve()
    @_editvar varr, @strength(s), @strength(w)
    @solver.suggestValue a, b
    @solver.resolve()

  stay: (path, v) ->
    for i in [1..arguments.length]
      @solver.addStay(v)
    return


module.exports = Constraints