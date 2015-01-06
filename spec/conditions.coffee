Engine = GSS #require 'gss-engine/lib/Engine.js'

assert = chai.assert
expect = chai.expect

remove = (el) ->
  el?.parentNode?.removeChild(el)

fixtures = document.getElementById 'fixtures'

xdescribe 'Conditions', ->
  describe 'conditions that use', ->
    describe 'single selector', ->
      it 'should initialize condition once', ->
        container = document.createElement('div')
        container.innerHTML = """
          <div id="div1"></div>
          <div id="div2"></div>
        """
        window.engine = engine = new GSS(container, {
          A: 100
        })
        solution = engine.solve [
          ['==', ['get', ['tag', 'div'], 'x'], ['get', 'A']]

          ['if', ['>', ['get', ['tag', 'div'], 'x'], 50],
            ['==', ['get', 'b'], 1]]

          ['unless', ['>', ['get', ['#', 'div1'], 'x'], 50],
            ['==', ['get', 'c'], 2]
            ['==', ['get', 'c'], 3]]

          ['if', ['>', ['get', ['#', 'div1'], 'x'], 50],
            ['==', ['get', 'd'], 2]
            ['==', ['get', 'd'], 3]]
        ]
        expect(solution).to.eql 
          b: 1, 
          c: 3,
          d: 2, 
          '$div1[x]': 100
          '$div2[x]': 100

        solution = engine.solve({A: 50})
        expect(solution).to.eql 
          A: 50
          b: null, 
          c: 2,
          d: 3, 
          '$div1[x]': 50
          '$div2[x]': 50

        solution = engine.solve({A: 100})
        expect(solution).to.eql 
          A: 100
          b: 1, 
          c: 3,
          d: 2, 
          '$div1[x]': 100
          '$div2[x]': 100
        solution = engine.solve({A: null})
        expect(solution).to.eql {A: null, b: null, c: null}

    describe 'multiple selectors', ->

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
      solution = engine.solve({A: null})
      expect(solution).to.eql {A: null, b: null, c: null}

  describe 'Else', ->
    it 'should attach to a condition', ->
      window.engine = engine = new GSS({A: 100})
      solution = engine.solve [
        ['if', ['>', ['get', 'A'], 75],
          ['==', ['get', 'b'], 1]]
        ['elseif', ['>', ['get', 'A'], 50],
          ['==', ['get', 'c'], 2]]
        ['else',
          ['==', ['get', 'd'], 3]]
      ]

      expect(solution).to.eql b: 1