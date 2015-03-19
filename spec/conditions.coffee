Engine = GSS #require 'gss-engine/lib/Engine.js'

assert = chai.assert
expect = chai.expect

remove = (el) ->
  el?.parentNode?.removeChild(el)

fixtures = document.getElementById 'fixtures'

describe 'Conditions', ->

  describe 'multiple conditions that observe the same condition', ->
    it 'should reuse observers', ->

      window.engine = engine = new GSS({A: 100})
      solution = engine.solve [
        ['if', ['>', ['get', 'A'], 50],
          ['==', ['get', 'b'], 1]]
        ['if', ['>', ['get', 'A'], 50],
          ['==', ['get', 'c'], 3]
          ['==', ['get', 'c'], 2]]
      ]
      expect(solution).to.eql b: 1, c: 3
      solution = engine.solve({A: 50})
      expect(solution).to.eql {A: 50, b: null, c: 2}
      solution = engine.solve({A: 100})
      expect(solution).to.eql {A: 100, b: 1, c: 3}
      solution = engine.solve({A: 50})
      expect(solution).to.eql {A: 50, b: null, c: 2}
      solution = engine.solve({A: 100})
      expect(solution).to.eql {A: 100, b: 1, c: 3}
      #solution = engine.solve({A: null})
      #expect(solution).to.eql {A: null, b: null, c: null}

  describe 'Else', ->
    it 'should attach to a condition', ->
      window.engine = engine = new GSS({A: 100})
      solution = engine.solve [
        ['if', ['>', ['get', 'A'], 75],
          ['==', ['get', 'b'], 1]]
        ['elseif', ['>', ['get', 'A'], 50],
          ['==', ['get', 'c'], 2]]
        ['elseif', ['>', ['get', 'A'], 25],
          ['==', ['get', 'd'], 3],
          ['==', ['get', 'e'], 4]]
      ]

      expect(solution).to.eql b: 1

      solution = engine.solve({A: 60})
      expect(solution).to.eql A: 60, b: null, c: 2 
      solution = engine.solve({A: 40})
      expect(solution).to.eql A: 40, c: null, d: 3  
      solution = engine.solve({A: 80})
      expect(solution).to.eql A: 80, b: 1, d: null 
      solution = engine.solve({A: 40})
      expect(solution).to.eql A: 40, b: null, d: 3 
      solution = engine.solve({A: 60})
      expect(solution).to.eql A: 60, d: null, c: 2 
      solution = engine.solve({A: 80})
      expect(solution).to.eql A: 80, b: 1, c: null 
      solution = engine.solve({A: 20})
      expect(solution).to.eql A: 20, e: 4, b: null 
      solution = engine.solve({A: 60})
      expect(solution).to.eql A: 60, e: null, c: 2 
      solution = engine.solve({A: 20})
      expect(solution).to.eql A: 20, e: 4, c: null 
      solution = engine.solve({A: 40})
      expect(solution).to.eql A: 40, e: null, d: 3 
      solution = engine.solve({A: 20})
      expect(solution).to.eql A: 20, e: 4, d: null 
      solution = engine.solve({A: 80})
      expect(solution).to.eql A: 80, b: 1, e: null 
      #solution = engine.solve({A: null})
      #expect(solution).to.eql A: null, b: null, c: null 