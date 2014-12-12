Engine = GSS #require 'gss-engine/lib/Engine.js'

assert = chai.assert
expect = chai.expect

remove = (el) ->
  el?.parentNode?.removeChild(el)

fixtures = document.getElementById 'fixtures'

describe 'Conditions', ->
 
  describe 'Else', ->
    it 'should attach to a condition', ->
      window.engine = engine = new GSS({A: 100})
      debugger
      solution = engine.solve [
        ['if', ['>', ['get', 'A'], 75],
          ['==', ['get', 'b'], 1]]
        ['elseif', ['>', ['get', 'A'], 50],
          ['==', ['get', 'c'], 2]]
        ['else',
          ['==', ['get', 'd'], 3]]
      ]

      expect(solution).to.eql b: 1