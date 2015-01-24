expect = chai.expect

describe 'Cassowary', ->
  c = GSS.Engine.prototype.Solver::Engine
  it 'should be available', ->
    expect(c).to.be.a 'function'
  it 'var >= num', ->
    solver = new c.SimplexSolver()
    x = new c.Variable({ value: 10 })
    ieq = new c.Inequality(x, c.GEQ, 100)
    solver.addConstraint(ieq)
    expect(x.value).to.equal 100
  it '[x]==7; [y]==5; [x] - [y] == [z] // z is 2', ->
    solver = new c.SimplexSolver()
    x = new c.Variable()
    y = new c.Variable()
    z = new c.Variable()
    eq1 = new c.Equation(x,7)
    eq2 = new c.Equation(y,5)
    eq3 = new c.Equation(c.minus(x,y),z)
    solver.addConstraint(eq1)
    solver.addConstraint(eq2)
    solver.addConstraint(eq3)
    expect(x.value).to.equal 7
    expect(y.value).to.equal 5
    expect(z.value).to.equal 2
  it 'top left right bottom // z is 2', ->
    solver = new c.SimplexSolver()
    x = new c.Variable()
    y = new c.Variable()
    z = new c.Variable()
    eq1 = new c.Equation(x,7)
    eq2 = new c.Equation(y,5)
    eq3 = new c.Equation(c.minus(x,y),z)
    solver.addConstraint(eq1)
    solver.addConstraint(eq2)
    solver.addConstraint(eq3)
    expect(x.value).to.equal 7
    expect(y.value).to.equal 5
    expect(z.value).to.equal 2
  it 'plus expression', ->
    solver = new c.SimplexSolver()
    solver.autoSolve = false
    aw = new c.Variable()
    tw = new c.Variable()
    pad = new c.Variable()    
    eq1 = new c.Equation(tw,100,c.Strength.required)
    eq2 = new c.Equation(aw,c.plus(tw,pad),c.Strength.required)
    eq3 = new c.Equation(pad,2,c.Strength.required)
    solver.addConstraint(eq1).addConstraint(eq2).addConstraint(eq3)
    solver.solve()
    expect(aw.value).to.equal 102
    expect(tw.value).to.equal 100
    expect(pad.value).to.equal 2
  it 'times expression', ->
    solver = new c.SimplexSolver()
    solver.autoSolve = false
    aw = new c.Variable()
    tw = new c.Variable()
    zoom = new c.Variable()    
    solver.addEditVar(zoom)
    solver.beginEdit()
    solver.suggestValue(zoom,2)
    solver.solve()
    # setting value on zoom so equation can be linear
    eq1 = new c.Equation(tw,100,c.Strength.required)
    eq2 = new c.Equation(aw,c.times(tw,zoom.value),c.Strength.required)
    solver.addConstraint(eq1).addConstraint(eq2)
    solver.solve()
    expect(aw.value).to.equal 200
    expect(tw.value).to.equal 100
    expect(zoom.value).to.equal 2
  it 'hierarchy', ->
    solver = new c.SimplexSolver()
    solver.autoSolve = false
    x = new c.Variable()
    eq1 = new c.Equation(x,100,c.Strength.strong)
    eq2 = new c.Equation(x,10,c.Strength.medium)
    eq3 = new c.Equation(x,1,c.Strength.weak)
    solver.addConstraint(eq1).addConstraint(eq2).addConstraint(eq3)
    solver.solve()
    expect(x.value).to.equal 100
    solver.removeConstraint eq1
    solver.solve()
    expect(x.value).to.equal 10
    solver.removeConstraint eq2
    solver.solve()
    expect(x.value).to.equal 1

  it 'weights', ->
    solver = new c.SimplexSolver()
    solver.autoSolve = false
    x = new c.Variable()
    eq1 = new c.Inequality(x, c.GEQ, 100, c.Strength.medium, 0.5)
    eq2 = new c.Inequality(x, c.GEQ, 10, c.Strength.medium, 0.3)
    solver.addConstraint(eq1).addConstraint(eq2)
    solver.solve()
    expect(x.value).to.equal 100
    solver.removeConstraint eq1
    solver.solve()
    expect(x.value).to.equal 10
    solver.addConstraint eq1
    solver.solve()
    expect(x.value).to.equal 100
    solver.solve()
    solver.removeConstraint eq2
    expect(x.value).to.equal 100
    solver.solve()
    solver.removeConstraint eq1
    solver.solve()
    expect(x.value).to.equal 0
    solver.addConstraint eq2
    solver.solve()
    expect(x.value).to.equal 10
