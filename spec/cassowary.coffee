if typeof process is 'object' and process.title is 'node'
  chai = require 'chai' unless chai

describe 'Cassowary Web Worker', ->
  worker = null
  it 'should be possible to instantiate', ->
    worker = new Worker '../lib/Worker.js'
  it 'should solve a set of simple constraints', (done) ->
    worker.addEventListener 'message', (values) ->
      chai.expect(values.data).to.eql
        a: 7
        b: 5
        c: 2
      done()
    worker.postMessage [
      ['eq', ['minus', ['get', 'a'], ['get', 'b']], ['get', 'c']]
      ['eq', ['get', 'a'], ['number', 7]]
      ['eq', ['get', 'a'], ['number', 6]]
    ]
