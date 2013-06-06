onWorkerError = (event) ->
    throw new Error(event.message + " (" + event.filename + ":" + event.lineno + ")")

expect = chai.expect
log = console.log

describe 'Cassowary Web Worker', ->
  worker = null
  it 'should be possible to instantiate', ->
    worker = new Worker('../browser/engine/worker/gss-solver.js')
    worker.addEventListener 'error', onWorkerError
  it 'should solve a set of simple constraints', (done) ->        
    onMessage = (m) ->
      expect(m.data.values.a).to.eql 7
      expect(m.data.values.b).to.eql 5
      expect(m.data.values.c).to.eql 2
      worker.removeEventListener 'message', onMessage
      done()      
    # [a(7)] - [b(6)] == [c]
    worker.addEventListener 'message', onMessage
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
            ['eq', ['get', 'a'], ['number', 7], 'medium']
            ['eq', ['get', 'b'], ['number', 5]]
            ['eq', ['minus', ['get', 'a'], ['get', 'b']], ['get', 'c'], 'medium']
          ]
  it 'should solve with new constraints added to existing worker', (done) ->
    onMessage = (m) ->    
      expect(m.data.values.x).to.eql 7
      expect(m.data.values.y).to.eql 5
      expect(m.data.values.z).to.eql 2  
      expect(m.data.values.a).to.eql 99
      worker.removeEventListener 'message', onMessage    
      done()
    # [a(7)] - [b(6)] == [c]
    worker.addEventListener 'message', onMessage
    worker.postMessage
      ast:
        vars:
          [
            ['var', 'x']
            ['var', 'y']
            ['var', 'z']
          ]
        constraints:
          [
            ['eq', ['get', 'x'], ['number', 7]]
            ['eq', ['get', 'y'], ['number', 5]]
            ['lte', ['minus', ['get', 'x'], ['get', 'y']], ['get', 'z']]
            ['eq', ['get', 'a'], ['number', 99], 'required']
          ]