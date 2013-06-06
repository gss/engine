onWorkerError = (event) ->
    throw new Error(event.message + " (" + event.filename + ":" + event.lineno + ")")

expect = chai.expect

describe 'Cassowary Web Worker', ->
  worker = null
  it 'should be possible to instantiate', ->
    worker = new Worker('../browser/engine/worker/gss-solver.js')
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
