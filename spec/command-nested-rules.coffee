Engine = GSS.Engine #require 'gss-engine/lib/Engine.js'

assert = chai.assert
expect = chai.expect

$  = () ->
  return document.querySelector arguments...
  
$$ = () -> 
  return document.querySelectorAll arguments...

remove = (el) ->
  el?.parentNode?.removeChild(el)

fixtures = document.getElementById 'fixtures'

describe 'Nested Rules', ->
 
  describe 'Basic', ->
    container = null
    engine = null
  
    beforeEach ->
      container = document.createElement 'div'
      $('#fixtures').appendChild container
  
    afterEach ->
      remove(container)

    describe '1 level', ->
    
      it 'Runs commands from sourceNode', (done) ->
        rules = [
          {
            type:'ruleset'
            selectors: ['.vessel .box']
            rules: [
              {
                type:'constraint', 
                cssText:'::[x] == 100', 
                commands: [
                  ["eq", ["get$","x",["$reserved","::this"]], ["number",100]]
                ]
              }
            ]
          }
        ]
        container.innerHTML =  """
          <div id="box0" class="box"></div>
          <div class="vessel">
            <div id="box1" class="box"></div>
            <div id="box2" class="box"></div>
          </div>
          <div id="box3" class="box"></div>
          <div id="box4" class="box"></div>
          """
                              
        listener = (e) ->        

          expect(engine.lastWorkerCommands).to.eql [
              ['eq', ['get$','x','$box1', '.vessel .box'], ['number',100]]
              ['eq', ['get$','x','$box2', '.vessel .box'], ['number',100]]
            ]
          container.removeEventListener 'solved', listener
          done()
        container.addEventListener 'solved', listener
        
        engine = GSS(container)
        #engine.run rules
        GSS.styleSheets.add
          engine: engine
          rules: rules
        GSS.styleSheets.update()
    
    describe '2 level', ->
    
      it 'Runs commands from sourceNode', (done) ->
        rules = [
          {
            type:'ruleset'
            selectors: ['.vessel']
            rules: [
              {
                type:'ruleset'
                selectors: ['.box']
                rules: [
                  {
                    type:'constraint', 
                    cssText:'::[x] == 100', 
                    commands: [
                      ["eq", ["get$","x",["$reserved","::this"]], ["number",100]]
                    ]
                  }
                ]
              }
            ]
          }
          
        ]
        container.innerHTML =  """
          <div id="box0" class="box"></div>
          <div class="vessel">
            <div id="box1" class="box"></div>
            <div id="box2" class="box"></div>
          </div>
          <div id="box3" class="box"></div>
          <div id="box4" class="box"></div>
          """
                              
        listener = (e) ->        

          expect(engine.lastWorkerCommands).to.eql [
              ['eq', ['get$','x','$box1', '.vessel .box'], ['number',100]]
              ['eq', ['get$','x','$box2', '.vessel .box'], ['number',100]]
            ]
          container.removeEventListener 'solved', listener
          done()
        container.addEventListener 'solved', listener
        
        engine = GSS(container)
        #engine.run rules
        GSS.styleSheets.add
          engine: engine
          rules: rules
        GSS.styleSheets.update()

