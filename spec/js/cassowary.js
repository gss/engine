var expect;

expect = chai.expect;

describe('Cassowary', function() {
  it('should be available', function() {
    return expect(c).to.be.a('function');
  });
  it('var >= num', function() {
    var ieq, solver, x;
    solver = new c.SimplexSolver();
    x = new c.Variable({
      value: 10
    });
    ieq = new c.Inequality(x, c.GEQ, 100);
    solver.addConstraint(ieq);
    return expect(x.value).to.equal(100);
  });
  it('[x]==7; [y]==5; [x] - [y] == [z] // z is 2', function() {
    var eq1, eq2, eq3, solver, x, y, z;
    solver = new c.SimplexSolver();
    x = new c.Variable();
    y = new c.Variable();
    z = new c.Variable();
    eq1 = new c.Equation(x, 7);
    eq2 = new c.Equation(y, 5);
    eq3 = new c.Equation(c.minus(x, y), z);
    solver.addConstraint(eq1);
    solver.addConstraint(eq2);
    solver.addConstraint(eq3);
    expect(x.value).to.equal(7);
    expect(y.value).to.equal(5);
    return expect(z.value).to.equal(2);
  });
  it('top left right bottom // z is 2', function() {
    var eq1, eq2, eq3, solver, x, y, z;
    solver = new c.SimplexSolver();
    x = new c.Variable();
    y = new c.Variable();
    z = new c.Variable();
    eq1 = new c.Equation(x, 7);
    eq2 = new c.Equation(y, 5);
    eq3 = new c.Equation(c.minus(x, y), z);
    solver.addConstraint(eq1);
    solver.addConstraint(eq2);
    solver.addConstraint(eq3);
    expect(x.value).to.equal(7);
    expect(y.value).to.equal(5);
    return expect(z.value).to.equal(2);
  });
  it('plus expression', function() {
    var aw, eq1, eq2, eq3, pad, solver, tw;
    solver = new c.SimplexSolver();
    solver.autoSolve = false;
    aw = new c.Variable();
    tw = new c.Variable();
    pad = new c.Variable();
    eq1 = new c.Equation(tw, 100, c.Strength.required);
    eq2 = new c.Equation(aw, c.plus(tw, pad), c.Strength.required);
    eq3 = new c.Equation(pad, 2, c.Strength.required);
    solver.addConstraint(eq1).addConstraint(eq2).addConstraint(eq3);
    solver.solve();
    expect(aw.value).to.equal(102);
    expect(tw.value).to.equal(100);
    return expect(pad.value).to.equal(2);
  });
  it('times expression', function() {
    var aw, eq1, eq2, solver, tw, zoom;
    solver = new c.SimplexSolver();
    solver.autoSolve = false;
    aw = new c.Variable();
    tw = new c.Variable();
    zoom = new c.Variable();
    solver.addEditVar(zoom);
    solver.beginEdit();
    solver.suggestValue(zoom, 2);
    solver.solve();
    eq1 = new c.Equation(tw, 100, c.Strength.required);
    eq2 = new c.Equation(aw, c.times(tw, zoom.value), c.Strength.required);
    solver.addConstraint(eq1).addConstraint(eq2);
    solver.solve();
    expect(aw.value).to.equal(200);
    expect(tw.value).to.equal(100);
    return expect(zoom.value).to.equal(2);
  });
  it('hierarchy', function() {
    var eq1, eq2, eq3, solver, x;
    solver = new c.SimplexSolver();
    solver.autoSolve = false;
    x = new c.Variable();
    eq1 = new c.Equation(x, 100, c.Strength.strong);
    eq2 = new c.Equation(x, 10, c.Strength.medium);
    eq3 = new c.Equation(x, 1, c.Strength.weak);
    solver.addConstraint(eq1).addConstraint(eq2).addConstraint(eq3);
    solver.solve();
    expect(x.value).to.equal(100);
    solver.removeConstraint(eq1);
    solver.solve();
    expect(x.value).to.equal(10);
    solver.removeConstraint(eq2);
    solver.solve();
    return expect(x.value).to.equal(1);
  });
  return it('weights', function() {
    var eq1, eq2, solver, x;
    solver = new c.SimplexSolver();
    solver.autoSolve = false;
    x = new c.Variable();
    eq1 = new c.Inequality(x, c.GEQ, 100, c.Strength.medium, 0.5);
    eq2 = new c.Inequality(x, c.GEQ, 10, c.Strength.medium, 0.3);
    solver.addConstraint(eq1).addConstraint(eq2);
    solver.solve();
    expect(x.value).to.equal(100);
    solver.removeConstraint(eq1);
    solver.solve();
    expect(x.value).to.equal(10);
    solver.addConstraint(eq1);
    solver.solve();
    expect(x.value).to.equal(100);
    solver.solve();
    solver.removeConstraint(eq2);
    expect(x.value).to.equal(100);
    solver.solve();
    solver.removeConstraint(eq1);
    solver.solve();
    expect(x.value).to.equal(0);
    solver.addConstraint(eq2);
    solver.solve();
    return expect(x.value).to.equal(10);
  });
});
