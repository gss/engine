onWorkerError = (event) ->
    throw new Error(event.message + " (" + event.filename + ":" + event.lineno + ")")

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
describe 'Cassowary Thread', ->
  thread = null
  it 'should instantiate', ->
    thread = new Thread()
  it '[x]==7; [y]==5; [x] - [y] == [z] // z is 2', (done) ->
    thread.unparse 
      vars:
        [
          ['var', 'x']
          ['var', 'y']
          ['var', 'z']
        ]
      constraints:
        [
          ['eq',             
            ['get', 'z'],
            ['minus', ['get', 'x'], ['get', 'y'] ]
          ]
          ['eq', ['get', 'x'], ['number', 7]]
          ['eq', ['get', 'y'], ['number', 5]]                              
        ]     
    chai.expect(thread._getValues()).to.eql
      x: 7
      y: 5
      z: 2    
    done()
describe 'Cassowary Web Worker', ->
  worker = null
  it 'should be possible to instantiate', ->
    worker = new Worker('../lib/Worker.js')
  it 'should solve a set of simple constraints', (done) ->
    worker.addEventListener 'error', onWorkerError
    worker.addEventListener 'message', (m) ->

      chai.expect(m.data.values).to.eql
        a: 7
        b: 5
        c: 2
      done()
    # [a(7)] - [b(6)] == [c]
    worker.postMessage 
      ast:
        vars:
          [
            ['var', 'a']
            ['var', 'b']
            ['var', 'c']
          ]
        constraints:
          [
            ['eq', ['get', 'a'], ['number', 7]]
            ['eq', ['get', 'b'], ['number', 5]]
            ['eq', ['minus', ['get', 'a'], ['get', 'b']], ['get', 'c']]                        

          
          ]
