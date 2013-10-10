expect = chai.expect

describe 'Cassowary', ->
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
