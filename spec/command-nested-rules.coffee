Engine = GSS.Engine #require 'gss-engine/lib/Engine.js'

assert = chai.assert
expect = chai.expect

stringify = (o) ->
  return JSON.stringify o, 1, 1

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

    describe 'flat', ->
    
      it 'Runs commands from sourceNode', (done) ->
        rules = [
          {
            type:'constraint', 
            cssText:'[target-size] == 100', 
            commands: [
              ["eq", ["get","[target-size]"], ["number",100]]
            ]
          }
        ]
        container.innerHTML =  ""
                              
        listener = (e) ->        
          expect(engine.lastWorkerCommands).to.eql [
              ["eq", ["get","[target-size]"], ["number",100]]
            ]
          container.removeEventListener 'solved', listener
          done()
        container.addEventListener 'solved', listener
        
        engine = GSS(container)

        sheet = new GSS.StyleSheet
          engine: engine
          rules: rules
          
        sheet.install()
    
    describe '1 level w/ ::', ->
    
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

        sheet = new GSS.StyleSheet
          engine: engine
          rules: rules
          
        sheet.install()
    
    describe '1 level w/ ::parent', ->
    
      it 'Runs commands from sourceNode', (done) ->
        rules = [
          {
            type:'ruleset'
            selectors: ['.vessel .box']
            rules: [
              {
                type:'constraint', 
                cssText:'::[width] == ::parent[width]', 
                commands: [
                  ["lte", ["get$","width",["$reserved","::this"]], ["get$","width",["$reserved","::parent"]]]
                ]
              }
            ]
          }
        ]
        container.innerHTML =  """
          <div id="box0" class="box"></div>
          <div id="vessel1" class="vessel">
            <div id="box1" class="box"></div>
            <div id="box2" class="box"></div>
          </div>
          <div id="box3" class="box"></div>
          <div id="box4" class="box"></div>
          """
                              
        listener = (e) ->        

          expect(stringify(engine.lastWorkerCommands)).to.eql stringify [
              ['lte', ['get$','width','$box1', '.vessel .box'], ['get$','width','$vessel1','.vessel .box::parent']]
              ['lte', ['get$','width','$box2', '.vessel .box'], ['get$','width','$vessel1','.vessel .box::parent']]
            ]
          container.removeEventListener 'solved', listener
          done()
        container.addEventListener 'solved', listener
        
        engine = GSS(container)

        sheet = new GSS.StyleSheet
          engine: engine
          rules: rules
          
        sheet.install()
        
    
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

        sheet = new GSS.StyleSheet
          engine: engine
          rules: rules
          
        sheet.install()
  
  describe '@if @else', ->
    
    container = null
    engine = null
  
    beforeEach ->
      container = document.createElement 'div'
      $('#fixtures').appendChild container
  
    afterEach ->
      remove(container)
  
    describe 'basic', ->
    
      it 'step 1', (done) ->
        rules = [
          {
             type: "constraint",
             cssText: "[big] == 500;"
             commands: [
               ['eq',['get','[big]'],['number',500]]
             ]
          }
          {
             type: "constraint",
             cssText: "[med] == 50;"
             commands: [
               ['eq',['get','[med]'],50]
             ]
          }
          {
             type: "constraint",
             cssText: "[small] == 5;"
             commands: [
               ['eq',['get','[small]'],5]
             ]
          }
          {
             type: "constraint",
             cssText: "[target-width] == 900;"
             commands: [
               ['eq',['get','[target-width]'],900]
             ]
          }
          {
            type:'ruleset'
            selectors: ['.vessel .box']
            rules: [
              {
                name: 'if'
                type:'directive'                
                terms: '[target-width] >= 960'
                clause: ["?>=", ["get", "[target-width]"],960]
                rules: [
                  {
                    type:'constraint', 
                    cssText:'::[width] == [big]', 
                    commands: [
                      ["eq", ["get$","width",["$reserved","::this"]], ["get","[big]"]]
                    ]
                  }
                ]
              }
              {
                name: 'elseif'
                type:'directive'                
                terms: '[target-width] >= 500'
                clause: ["?>=",["get","[target-width]"],500]
                rules: [
                  {
                    type:'constraint', 
                    cssText:'::[width] == [med]', 
                    commands: [
                      ["eq", ["get$","width",["$reserved","::this"]],["get","[med]"]]
                    ]
                  }
                ]
              }
              {
                name: 'else'
                type:'directive'                
                terms: ''
                clause: null
                rules: [
                  {
                    type:'constraint', 
                    cssText:'::[width] == [small]', 
                    commands: [
                      ["eq", ["get$","width",["$reserved","::this"]], ["get","[small]"]]
                    ]
                  }
                ]
              }
            ]
          }          
        ]
        container.innerHTML =  """
          <div id="container" >
            <div class="vessel">
              <div id="box1" class="box"></div>
              <div id="box2" class="box"></div>
            </div>
          </div>
          <div id="box3" class="box"></div>
          <div id="box4" class="box"></div>
          """
                              
        listener = (e) ->        
          expect(stringify(engine.vars)).to.eql stringify
            "[big]":500
            "[med]":50
            "[small]":5
            "[target-width]":900
            "$box1[width]":50
            "$box2[width]":50            
          container.removeEventListener 'solved', listener
          done()
        container.addEventListener 'solved', listener
        
        engine = GSS(container)

        sheet = new GSS.StyleSheet
          engine: engine
          rules: rules
          
        sheet.install()

