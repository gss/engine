Engine = GSS.Engine #require 'gss-engine/lib/Engine.js'

assert = chai.assert
expect = chai.expect

remove = (el) ->
  el?.parentNode?.removeChild(el)

fixtures = null

it "fixtures", ->
  fixtures = document.getElementById 'fixtures'
  assert !!fixtures, "fixtures are there"

describe 'GSS engine', ->

  container = null
  engine = null  

  describe 'when initialized', ->
    before ->
      container = document.createElement 'div'
      document.getElementById('fixtures').appendChild container
      engine = new GSS(container)

    after (done) ->
      remove(container)
      done()
    it 'should be bound to the DOM scope', ->
      expect(engine.scope).to.eql container

  describe 'new GSS(url) - scopeless with web worker', ->
    e = null
    it 'should initialize', ->
      e = new GSS(true)
    it 'should run commands', (done)->
      e.once 'solved', ->
        val = e.values['x']
        assert val == 222, "engine has wrong [x] value: #{val}"

        e.once 'solved', ->
          val = e.values['x']
          assert val == undefined, "engine has wrong [x] value: #{val}"

          done()
        
        e.solve ['remove', 'tracker']

      e.solve [
          ['==', ['get','x'], 222]
        ], 'tracker'
    it 'should destroy', (done)->
      e.destroy()
      done()
    
  xdescribe 'GSS() - scopeless & no web workers', ->
    e = null
    it 'should initialize', ->
      e = new GSS()
    it 'should run commands', (done)->
      e.once 'solved', ->
        val = e.values['x']
        assert val == 222, "engine has wrong [x] value: #{val}"

        e.once 'solved', ->
          val = e.values['x']
          assert val == undefined, "engine has wrong [x] value: #{val}"


          done()
        
        e.solve ['remove', 'tracker']

      e.solve [
          ['==', ['get','x'], 222]
        ], 'tracker'
    it 'should destroy', (done)->
      e.destroy()
      done()
  
  describe 'with rule #button1[width] == #button2[width]', ->
    
    test = (useWorker) ->
      engine = null
      container = null
      button1 = null
      button2 = null
      
      describe "useWorker: #{useWorker}", ->
        before ->
          container = document.createElement 'div'
          document.getElementById('fixtures').appendChild container
          container.innerHTML = """
            <button id="button1">One</button>
            <button id="button2">Second</button>
            <button id="button3">Three</button>
            <button id="button4">4</button>
          """
          engine = new GSS(container, useWorker || undefined)
          engine.compile()
    
        ast = [
          ['==', ['get', ['#','button1'], 'width'], ['get', ['#','button2'], 'width']]
          ['==', ['get', ['#','button1'], 'width'], 100]
        ]
        
        it 'before solving the second button should be wider', ->
          button1 = engine.id 'button1'
          button2 = engine.id 'button2'
          expect(button2.getBoundingClientRect().width).to.be.above button1.getBoundingClientRect().width
        
        it 'after solving the buttons should be of equal width', (done) ->
          count = 0
          onSolved = (values) ->
            if ++count == 1
              expect(values).to.be.an 'object'
              expect(values['$button1'])
              expect(Math.round(button1.getBoundingClientRect().width)).to.equal 100
              expect(Math.round(button2.getBoundingClientRect().width)).to.equal 100
              container.innerHTML = ""
            else
              engine.removeEventListener 'solved', onSolved
              done()
          engine.addEventListener 'solved', onSolved
          engine.solve ast
          
    test(true)
    test(false)
  
  describe 'with rule h1[line-height] == h1[font-size] == 42', ->
    
    test = (useWorker) ->
      engine = null
      container = null
      text1 = null
      text2 = null
      
      describe "useWorker: #{useWorker}", ->
        before ->
          container = document.createElement 'div'
          document.getElementById('fixtures').appendChild container
          container.innerHTML = """
            <h1 id="text1" style="line-height:12px;font-size:12px;">One</h1>
            <h1 id="text2" style="line-height:12px;font-size:12px;">Two</h1>
          """
          engine = new GSS(container, useWorker || undefined)
    
        ast = [
            ['==', ['get',['tag','h1'],'line-height'], ['get',['tag','h1'],'font-size']]
            ['==', ['get',['tag','h1'],'line-height'], 42]
          ]
        
            
        it 'before solving', ->
          text1 = container.getElementsByTagName('h1')[0]
          text2 = container.getElementsByTagName('h1')[1]
          assert text1.style['lineHeight'] is "12px"
          assert text2.style['lineHeight'] is "12px"
          assert text1.style['fontSize'] is "12px"
          assert text2.style['fontSize'] is "12px"          
        it 'after solving', (done) ->
          count = 0
          onSolved = (e) ->
            if ++count == 1
              assert text1.style['lineHeight'] is "42px"
              assert text2.style['lineHeight'] is "42px"
              assert text1.style['fontSize'] is "42px"
              assert text2.style['fontSize'] is "42px"
              assert e.detail['$text1[line-height]'] is 42
              assert e.detail['$text2[line-height]'] is 42
              assert e.detail['$text1[font-size]'] is 42
              assert e.detail['$text2[font-size]'] is 42
              container.innerHTML = ""
            else
              engine.removeEventListener 'solved', onSolved
              done()
          container.addEventListener 'solved', onSolved
          engine.solve ast
          
    test(true)              
  
  describe 'Before IDs exist', ->
    engine = null
    container = null
    button1 = null
    button2 = null
    
    before ->
      container = document.createElement 'div'
      document.getElementById('fixtures').appendChild container
      engine = new GSS(container)
      container.innerHTML = """
      """
    
    after (done) ->
      remove(container)
      # have to manually destroy, otherwise there is some clash!
      engine.destroy()
      done()
    
    ast = [
      ['==', ['get',['#','button2'],'width'], 222]
      ['==', ['get',['#','button1'],'width'], 111]        
    ]
    
    it 'before solving buttons dont exist', ->
      engine.solve ast
      button1 = engine.id 'button1'
      button2 = engine.id 'button2'
      assert !button1, "button1 doesn't exist"
      assert !button2, "button2 doesn't exist"
    
    it 'engine remains idle',  ->            
      assert engine.updated == undefined
    
    it 'after solving the buttons should have right', (done) ->
      count = 0
      onSolved = (e) ->
        if ++count == 1
          w = Math.round(button1.getBoundingClientRect().width)
          assert w is 111, "button1 width: #{w}"
          w = Math.round(button2.getBoundingClientRect().width)
          assert w is 222, "button2 width: #{w}"
          remove button1
          remove button2
        else
          engine.removeEventListener 'solved', onSolved
          done()

      container.addEventListener 'solved', onSolved
      container.innerHTML = """
      <div>        
        <button id="button2">Second</button>
        <button id="button1">One</button>        
      </div>
      """
      button1 = engine.id 'button1'
      button2 = engine.id 'button2'
    
  describe 'Before IDs exist - advanced', ->
    engine = null
    container = null
    
    before ->
      container = document.createElement 'div'
      document.getElementById('fixtures').appendChild container
      engine = new GSS(container)
      container.innerHTML = """
        <div id="w">        
        </div>
      """

    ast = [
        ['==', ["get", ["#","b1"], "right"],  ["get",["#","b2"],"x"]]
        ['==', ["get", ["#","w"],  "width"],  200]
        ['==', ["get", ["#","w"],  "x"]  ,    ["get",'target']]
        ['==', ["get", ["#","b2"], "right"] , ["get",["#","w"],"right"]] 
        # b2[right] -> 200
        ['==', ["get", ["#","b1"], "x"   ] ,  ["get","target"]]        
        ['==', ["get", ["#","b1"], "width"] , ["get",["#","b2"],"width"]]
        
        ['==', ["get", "target"], 0]
      ]
    
    it 'after solving should have right size', (done) ->
      count = 0

      onSolved = (e) ->
        if ++count == 1
          w = Math.round(engine.id("w").getBoundingClientRect().width)
          assert w is 200, "w width: #{w}"
          w = Math.round(engine.id('b1').getBoundingClientRect().width)
          assert w is 100, "button1 width: #{w}"
          w = Math.round(engine.id('b2').getBoundingClientRect().width)
          assert w is 100, "button2 width: #{w}"
          container.innerHTML = ""
        else
          container.removeEventListener 'solved', onSolved
          done()
      document.getElementById('w').innerHTML = """
      <div>        
           <div id="b1"></div>
           <div id="b2"></div>
      </div>
      """
      container.addEventListener 'solved', onSolved
      engine.solve ast      
  
  describe 'Math', ->
    before ->
      container = document.createElement 'div'
      document.getElementById('fixtures').appendChild container
      engine = new GSS(container)

    after (done) ->
      remove(container)
      done()
    
    it 'var == var * (num / num)', (done) ->
      onSolved =  (e) ->
        expect(e.detail).to.eql 
          'y': 10
          'x': 5
          engine: engine
        container.removeEventListener 'solved', onSolved
        done()
      container.addEventListener 'solved', onSolved
      engine.solve [
        ['==', ['get', 'y'], 10]
        ['==', ['get', 'x'], 
          ['*',['get','y'], 0.5] ]
      ]
  
  describe 'Engine::vars', ->
    engine = null
    container = null
  
    beforeEach ->
      container = document.createElement 'div'
      document.getElementById('fixtures').appendChild container
      engine = new GSS(container)

    afterEach (done) ->
      remove(container)
      done()
    
    it 'engine.vars are set', (done) ->
      onSolved =  (e) ->
        values = e.detail
        expect(values).to.eql 
          'col-width': 100
          'row-height': 50
          engine: engine
        container.removeEventListener 'solved', onSolved
        done()
      container.addEventListener 'solved', onSolved
      engine.solve [
          ['==', ['get', 'col-width'], 100]
          ['==', ['get', 'row-height'], 50]
        ]
  
      
      
  describe "Display pre-computed constraint values", ->
    engine = null
    container = null
  
    beforeEach ->
      container = document.createElement 'div'
      container.innerHTML = """
        <div id="d1"></div>
        <div id="d2"></div>
        <div id="d3"></div>
      """
      document.getElementById('fixtures').appendChild container
      engine = new GSS(container)

    afterEach (done) ->
      remove(container)
      done()
      
    it "force display on un-queried views", ->
      engine.solve {"$d1[width]":1,"$d2[width]":2,"$d3[width]":3}
      w = Math.round(document.getElementById('d1').getBoundingClientRect().width)
      assert w is 1, "d1 width: #{w}"
      w = Math.round(document.getElementById('d2').getBoundingClientRect().width)
      assert w is 2, "d2 width: #{w}"
      w = Math.round(document.getElementById('d3').getBoundingClientRect().width)
      assert w is 3, "d3 width: #{w}"

      
    

  
  describe 'GSS Engine with styleNode', ->
    container = null
    engine = null
  
    before ->
      container = document.createElement 'div'
      document.getElementById('fixtures').appendChild container
  
    after ->
      remove(container)

    describe 'Engine::styleNode', ->
    
      it 'Runs commands from sourceNode', (done) ->
        listener = (e) ->        
          expect(engine.updated.getProblems()).to.eql [
              [[
                key: 'style[type*="gss"]$style1↓.box$box1'
                ['==', ['get','$box1[x]'], 100]
              ]]
              [[
                key: 'style[type*="gss"]$style1↓.box$box2'
                ['==', ['get','$box2[x]'], 100]
              ]]
            ]
          container.removeEventListener 'solved', listener
          done()
        container.addEventListener 'solved', listener
        engine = new GSS(container)
        container.innerHTML =  """
          <style type="text/gss-ast" scoped id="style1">
            ["==", ["get",[".", "box"],"x"], 100]
          </style>
          <div id="box1" class="box"></div>
          <div id="box2" class="box"></div>
          """

  describe 'GSS Engine Life Cycle', ->  
    container = null
  
    before ->
      container = document.createElement 'div'
      new GSS(container)
      document.getElementById('fixtures').appendChild container
  
    after ->
      remove(container)


    describe 'Asynchronous existentialism (one engine for life of container)', ->
      engine1 = null
    
      it 'without GSS rules style tag', ->
        window.$engine = engine1 = GSS(container)
        expect(engine1.scope).to.be.equal container
    
      it 'after receives GSS style tag', (done) ->
        engine1 = GSS(container)
        container.innerHTML =  """
          <style id="gssa" type="text/gss-ast" scoped>
            [
              ["==", ["get", "col-width-1"], 111]
            ]
          </style>
          """
        engine1.then ->
          expect(engine1.values['col-width-1']).to.equal 111
          done()
    
      it 'after modified GSS style tag', (done) ->
        engine = GSS(container)
        styleNode = engine.id 'gssa'
        styleNode.textContent = """
          [
              ["==", ["get", "col-width-11"], 1111]
          ]  
        """        
        engine.then ->
          engine2 = GSS(container)
          expect(engine1).to.equal engine2
          expect(engine1.values['col-width-1']).to.equal undefined
          expect(engine1.values['col-width-11']).to.equal 1111
          done()
    
      it 'after replaced GSS style tag', (done) ->
        engine2 = GSS(container)
        container.innerHTML =  """
          <style id="gssb" type="text/gss-ast" scoped>
          [
              ["==", ["get", "col-width-2"], 222]
          ]  
          </style>
          <div id="box1" class="box" data-gss-id="12322"></div>
          """

        engine2.then ->
          assert engine1 is engine2, "engine is maintained" 
          assert !engine2.values['col-width-1']?, "engine1.vars['col-width-1'] removed" 
          expect(engine2.values['col-width-11']).to.equal undefined
          expect(engine2.values['col-width-2']).to.equal 222
          done()
    
      it 'Engine after container replaced multiple GSS style tags', (done) ->
        engine2 = GSS(container)
        container.innerHTML =  """
          <style id="gssc" type="text/gss-ast" scoped>
          [
             ["==", ["get", "col-width-3"], 333]
          ]  
          </style>
          <style id="gssd" type="text/gss-ast" scoped>
          [
             ["==", ["get", "col-width-4"], 444]
          ]  
          </style>
          <div id="box1" class="box" data-gss-id="12322"></div>
          """
        engine2.then ->
          engine2 = GSS(container)
          expect(engine1).to.equal engine2
          #expect(engine1.styleNode).to.equal document.getElementById 'gssb'
          expect(engine1.values['col-width-1']).to.equal undefined
          expect(engine1.values['col-width-2']).to.equal undefined
          expect(engine1.values['col-width-3']).to.equal 333
          expect(engine1.values['col-width-4']).to.equal 444
          done()
    
      xit 'Engine after container removed', (done) ->
        remove(container)
        wait = ->
          expect(engine1.is_destroyed).to.equal true
          expect(GSS.engines.byId[GSS.getId(container)]?).to.equal false
          done()
        setTimeout wait, 1
    
      xit 'new Engine after container re-added', () ->      
        document.getElementById('fixtures').appendChild container      
        engine3 = GSS(container)
        expect(engine1).to.not.equal engine3
  

  xdescribe 'Nested Engine', ->  
    container = null
    containerEngine = null
    wrap = null
    wrapEngine = null
  
    before ->
      container = document.createElement 'div'
      document.getElementById('fixtures').appendChild container
      #        
      container.innerHTML =  """
        <section>
          <div id="wrap" style="width:100px;" data-gss-id="999">
            <style type="text/gss-ast" scoped>
            [{
              "type":"constraint",
              "commands": [
                ['==', ["get$","width",["#","boo"]], ["number",100]]
              ]
            }]
            </style>
            <div id="boo" data-gss-id="boo"></div>
          </div>
        </section>
        """
      containerEngine = GSS(container)
      wrap = document.getElementById('wrap')
      wrapEngine = GSS(wrap)
  
    after ->
      remove(container)
  
    it 'engines are attached to correct element', () ->
      expect(wrapEngine).to.not.equal containerEngine
      expect(wrapEngine.scope).to.equal wrap
      expect(containerEngine.scope).to.equal container
  
    it 'correct values', (done) ->
      listener = (e) ->           
        expect(wrapEngine.vars).to.eql 
          "$boo[width]": 100
        wrap.removeEventListener 'solved', listener
        done()
      wrap.addEventListener 'solved', listener




  xdescribe 'Engine Hierarchy', ->  
    body = document.getElementsByTagName('body')[0] # for polymer b/c document.body is "unwrapped"
  
    describe 'root engine', ->
      root = null
      it 'is initialized', ->
        root = GSS.engines.root
        expect(root).to.exist
      it 'is root element', ->
        expect(root.scope).to.equal GSS.Getter.getRootScope()
      it 'gss style tags direct descendants of <body> are run in root engine', () ->
        document.body.insertAdjacentHTML 'afterbegin', """
          <style id="root-styles" type="text/gss-ast" scoped>
          </style>
        """
        style = document.getElementById "root-styles"
        scope = GSS.get.scopeFor style
        expect(scope).to.equal body
        remove(style)
      
    describe 'nesting', ->
      style1  = null
      style2  = null
      style3  = null
      scope1  = null
      scope2  = null
      scope3  = null
      engine1 = null
      engine2 = null
      engine3 = null
      
      before ->    
        document.body.insertAdjacentHTML 'afterbegin', """
          <style id="root-styles-1" type="text/gss-ast" scoped>
          </style>
          <section id="scope2">
            <style id="root-styles-2" type="text/gss-ast" scoped>
            </style>
            <div>
              <div id="scope3">
                <style id="root-styles-3" type="text/gss-ast" scoped>
                </style>
              </div>
            </div>
          </section>
        """
      it 'nested style tags have correct scope', () ->      
        style1 = document.getElementById "root-styles-1"
        scope1 = GSS.get.scopeFor style1
        expect(scope1).to.equal body
        style2 = document.getElementById "root-styles-2"
        scope2 = GSS.get.scopeFor style2
        expect(scope2).to.equal document.getElementById "scope2"
        style3 = document.getElementById "root-styles-3"
        scope3 = GSS.get.scopeFor style3
        expect(scope3).to.equal document.getElementById "scope3"
    
      it 'correct parent-child engine relationships', ->
        engine1 = GSS scope:scope1
        engine2 = GSS scope:scope2
        engine3 = GSS scope:scope3
        expect(GSS.engines.root).to.equal engine1
        expect(engine2.parentEngine).to.equal engine1
        expect(engine3.parentEngine).to.equal engine2      
        expect(engine1.childEngines.indexOf(engine2) > -1).to.be.true
        expect(engine2.childEngines.indexOf(engine3) > -1).to.be.true
    
      it 'parent-child engine relationships update even w/o styles', (done) ->      
        remove(style1)
        remove(style2)
        remove(style3)
        remove(scope3)
        GSS._.defer ->
          expect(engine3.is_destroyed).to.be.true
          expect(engine3.parentEngine).to.not.exist
          expect(engine2.childEngines.indexOf(engine3)).to.equal -1
          remove(scope2)
          GSS._.defer ->
            expect(engine2.is_destroyed).to.be.true
            expect(engine2.parentEngine).to.not.exist
            expect(engine1.childEngines.indexOf(engine2)).to.equal -1
            done()
  
    describe 'nesting round 2', ->
      style2  = null
      style3  = null
      scope1  = null
      scope2  = null
      scope3  = null
      engine1 = null
      engine2 = null
      engine3 = null
      
      before ->    
        document.body.insertAdjacentHTML 'afterbegin', """
          <section id="scope2">
            <style id="root-styles-2" type="text/gss-ast" scoped>
            </style>
            <div>
              <div id="scope3">
                <style id="root-styles-3" type="text/gss-ast" scoped>
                </style>
              </div>
            </div>
          </section>
        """      
        style2 = document.getElementById "root-styles-2"
        scope2 = GSS.get.scopeFor style2
        style3 = document.getElementById "root-styles-3"
        scope3 = GSS.get.scopeFor style3
        engine1 = GSS.engines.root
        engine2 = GSS scope:scope2
        engine3 = GSS scope:scope3
    
      after ->
        remove(scope2)
    
      it 'correct parent-child engine relationships', ->
        expect(GSS.engines.root).to.equal engine1
        expect(engine2.parentEngine).to.equal engine1
        expect(engine3.parentEngine).to.equal engine2      
        expect(engine1.childEngines.indexOf(engine2) > -1).to.be.true
        expect(engine2.childEngines.indexOf(engine3) > -1).to.be.true
    
      it 'engine destruction cascades', (done) ->      
        remove(scope2)
        GSS._.defer ->
          expect(engine3.is_destroyed).to.be.true
          expect(engine3.parentEngine).to.not.exist
          expect(engine2.childEngines.indexOf(engine3)).to.equal -1
          expect(engine2.is_destroyed).to.be.true
          expect(engine2.parentEngine).to.not.exist
          expect(engine1.childEngines.indexOf(engine2)).to.equal -1
          done()
    
    
      #it 'nested engines parent child relationships', () ->
      


  
  xdescribe 'framed scopes', ->
    container = null
    containerEngine = null
    wrap = null
    wrapEngine = null
  
    before ->
      container = document.createElement 'div'
      container.id = "wrap-container"
      document.getElementById('fixtures').appendChild container
      #        
      container.innerHTML =  """
          <style type="text/gss-ast" scoped>
          [{
            "type":"constraint",
            "commands": [
              ['==', ["get$","width",["#","wrap"]], ["number",69]]
            ]
          }]
          </style>
          <div id="wrap" style="width:100px;" data-gss-id="wrap">
            <style type="text/gss-ast" scoped>
            [{
              "type":"constraint",
              "commands": [
                ['==', ["get$","width",["#","boo"]], ["get$","width",["$reserved","scope"]]]
              ]
            }]
            </style>
            <div id="boo" data-gss-id="boo"></div>
          </div>
        """
      containerEngine = GSS(container)
      wrap = document.getElementById('wrap')
      wrapEngine = GSS(wrap)
  
    after ->
      remove(container)

    it 'engines are attached to correct element', () ->
      expect(wrapEngine).to.not.equal containerEngine
      expect(wrapEngine.scope).to.equal wrap
      expect(containerEngine.scope).to.equal container    

    it 'scoped value is bridged downward', (done) ->
      cListener = (e) ->           
        container.removeEventListener 'solved', cListener
      
      container.addEventListener 'solved', cListener
      count = 0
      wListener = (e) ->     
        count++      
        if count is 2
          expect(wrapEngine.vars).to.eql 
            "$boo[width]": 69
            "$wrap[width]": 69
          wrap.removeEventListener 'solved', wListener      
          done()              
      wrap.addEventListener 'solved', wListener

  xdescribe "Engine memory management", ->
    it "engines are destroyed", (done)->
      GSS._.defer ->
        expect(GSS.engines.length).to.equal(1)
        done()
    it "views are recycled *MOSTLY*", (done) ->
      # - margin_of_error should be about 2 for things like document.body
      # - larger b/c views activated via ^ queries will not be cleaned up, need more robust GSS.Query
      # - async intrinsics also seem to matter...
      # - vies are not cleaned up when removed unless selector is updated!
      margin_of_error = 25 + 5
      GSS._.defer ->
        count = 0
        for key of GSS.View.byId          
          count++
        assert count <= document.querySelectorAll("data-gss-id").length + margin_of_error, "views are recycled: #{count}"
        done()
    it "_byIdCache is cleared *MOSTLY*", (done) ->
      margin_of_error = 25 + 5
      GSS._.defer ->
        count = 0
        for key of GSS._byIdCache
          count++
        assert count <= document.querySelectorAll("data-gss-id").length + margin_of_error, "views are recycled: #{count}"
        done()
  
    #it 'updates to scoped value are bridged downward', (done) ->

