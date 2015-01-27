
expect = chai.expect
assert = chai.assert

remove = (el) ->
  el?.parentNode?.removeChild(el)



describe 'Units', ->
  engine = container = null
  beforeEach ->
    container = document.createElement 'div'
    document.getElementById('fixtures').appendChild container
    window.$engine = engine = new GSS(container)
    
  afterEach ->
    remove(container)
    
  describe 'with conflicting constraints', ->
    describe 'without unit', ->
      it 'should solve constraints together and resolve conflict', (done) ->
        container.innerHTML = """
          <style type="text/gss-ast">
            ["rule", ["tag", "button"], [
              [">=", ["get", "width"], 50, "weak"],
              ["<=", ["get", "height"], 120, "strong"],
              [">=", ["get", "height"],["*", ["get", "width"], 3]]
            ]]
          </style>
          <button id="button1"></button>
        """
        engine.then (solution)->
          expect(solution).to.eql
            '$button1[width]': 40,
            '$button1[height]': 120
          done()

    describe 'with unit', ->
      it 'should resolve constraints separately and ignore conflict', (done) ->
        container.innerHTML = """
          <style type="text/gss-ast">
            ["rule", ["tag", "button"], [
              [">=", ["get", "width"], 50, "weak"],
              ["<=", ["get", "height"], 120, "strong"],
              [">=", ["get", "height"],["*", ["px", ["get", "width"]], 3]]
            ]]
          </style>
          <button id="button1"></button>
        """
        engine.then (solution)->
          expect(solution).to.eql
            '$button1[width]': 50,
            '$button1[height]': 120
          done()

  describe 'with non-linear expressions', ->
    describe 'with unit', ->
      it 'should be able to compute ratios', (done) ->
        container.innerHTML = """
          <style type="text/gss-ast">
            ["rule", ["tag", "button"], [
              [">=", ["get", "width"], 50, "weak"],
              ["<=", ["get", "height"], 100, "strong"],

              [">=", ["get", "ratio"], 
                ["/", 
                  ["px", ["get", "width"]], 
                  ["px", ["get", "height"]]]
              ]
            ]]
          </style>
          <button id="button1"></button>
        """
        engine.then (solution)->
          expect(solution).to.eql
            '$button1[width]': 50,
            '$button1[height]': 100,
            '$button1[ratio]': 0.5
          done()

  describe 'with dynamic units', ->
    describe 'bound to window', ->
      it 'should be able to compute width', (done) ->
        container.innerHTML = """
          <style type="text/gss-ast">
            ["rule", ["tag", "button"], [
              ["==", ["get", "a"], 50],
              [">=", ["get", "width"], ["vw", 10]], 
              [">=", ["get", "height"], ["vh", ["get", "a"]]],
              [">=", ["get", "c"], ["vmax", 30]],
              [">=", ["get", "d"], ["vmin", 33]]
            ]]
          </style>
          <button id="button1"></button>
        """
        engine.then (solution)->
          w = document.documentElement.clientWidth
          h = Math.min(window.innerHeight, document.documentElement.clientHeight)
          expect(Math.round solution['$button1[width]']).to.eql(Math.round w / 10)
          expect(Math.round solution['$button1[height]']).to.eql(Math.round h / 2)
          expect(Math.round solution['$button1[c]']).to.eql(Math.round Math.max(w, h) * 0.3)
          expect(Math.round solution['$button1[d]']).to.eql(Math.round Math.min(w, h) * 0.33)
          engine.then (solution) ->
            expect(Math.round solution['$button1[width]']).to.eql(Math.round 1000 / 10)
            if h < 1000
              expect(Math.round solution['$button1[c]']).to.eql(Math.round 1000 * 0.3)
            else
              expect(Math.round solution['$button1[d]']).to.eql(1000 * 0.33)

            engine.then (solution) ->
              expect(Math.round solution['$button1[d]']).to.eql(100 * 0.33)

              remove(engine.id('button1'))
            
              engine.then (solution)->
                expect(solution['$button1[width]']).to.eql null
                expect(solution['$button1[height]']).to.eql null
                expect(solution['$button1[c]']).to.eql null
                expect(Object.keys(engine.data.watchers)).to.eql []
                done()

            engine.data.properties['::window[height]'] = ->
              return 100
            engine.data.set('::window', 'height', 100)

            
          engine.data.properties['::window[width]'] = ->
            return 1000

          engine.data.set('::window', 'width', 1000)

    describe 'bound to font-size', ->
      it 'should be able to compute width', (done) ->
        container.innerHTML = """
          <style type="text/gss-ast">
            ["rule", ["tag", "span"], [
              [">=", ["get", "width"], ["em", 10]], 
              [">=", ["get", "height"], ["em", ["get", "c"]]],
              [">=", ["get", "c"], 2]
            ]]
          </style>
          <div id="wrapper" style="font-size: 20px">
            <span id="button1"></span>
          </div>
        """
        engine.then (solution)->
          expect(Math.round solution['$button1[width]']).to.eql(Math.round 200)
          expect(Math.round solution['$button1[height]']).to.eql(Math.round 40)
          engine.then (solution) ->
            expect(Math.round solution['$button1[width]']).to.eql(Math.round 300)
            expect(Math.round solution['$button1[height]']).to.eql(Math.round 60)

            remove(engine.id('button1'))
          
            engine.then (solution)->
              expect(solution['$button1[width]']).to.eql null
              expect(solution['$button1[height]']).to.eql null
              expect(solution['$button1[c]']).to.eql null
              expect(Object.keys(engine.data.watchers)).to.eql []
              done()

          engine.id('wrapper').style.fontSize = '30px'

            