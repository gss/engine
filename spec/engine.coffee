Engine = GSS.Engine #require 'gss-engine/lib/Engine.js'

assert = chai.assert
expect = chai.expect

$  = () ->
  return document.querySelector arguments...
  
$$ = () -> 
  return document.querySelectorAll arguments...

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
      $('#fixtures').appendChild container
      engine = GSS(container)

    after (done) ->
      remove(container)
      done()
    it 'should be bound to the DOM scope', ->
      expect(engine.scope).to.eql container
    it 'should not hold a worker', ->
      expect(engine.worker).to.be.a 'null'
    it 'should pass the scope to its DOM getter', ->
      expect(engine.getter).to.be.an 'object'
      expect(engine.getter.scope).to.eql engine.scope
      
  describe 'scopeless', ->
    e = null
    it 'should initialize', ->
      e = new GSS.Engine()
    it 'engine hierarchy', ->
      assert(e.parentEngine is GSS.engines.root)
      expect(e.childEngines).to.be.eql([])
      assert GSS.engines.root.childEngines.indexOf(e) > -1, "e is not child of root"
    it 'should run commands', (done)->
      e.once 'solved', ->
        val = e.vars['[x]']
        assert val == 222, "engine has wrong [x] value: #{val}"
        done()
      e.run commands: [
          ['eq', ['get','[x]'], ['number',222]]
        ]
    it 'should destroy', (done)->
      e.destroy()
      assert !e.parentEngine, "parentEngine"
      #assert expect(e.childEngines).to.be.eql([])
      assert GSS.engines.root.childEngines.indexOf(e) is -1, "e is still child of root"
      done()
    
  describe 'scopeless & no web workers', ->
    e = null
    it 'should initialize', ->
      e = new GSS.Engine({useWorker:false})
      assert e.useWorker? and !e.useWorker,"set useWorker"
    it 'engine hierarchy', ->
      assert(e.parentEngine is GSS.engines.root)
      expect(e.childEngines).to.be.eql([])
      assert GSS.engines.root.childEngines.indexOf(e) > -1, "e is not child of root"
    it 'should run commands', (done)->
      e.once 'solved', ->
        val = e.vars['[x]']
        assert val == 222, "engine has wrong [x] value: #{val}"
        done()
      e.run commands: [
          ['eq', ['get','[x]'], ['number',222]]
        ]
    it 'should destroy', (done)->
      e.destroy()
      assert !e.parentEngine, "parentEngine"
      #assert expect(e.childEngines).to.be.eql([])
      assert GSS.engines.root.childEngines.indexOf(e) is -1, "e is still child of root"
      done()
  
  describe 'scopeless & no web workers via GSS.config', ->
    e = null
    it 'should initialize', ->
      e = new GSS.Engine({useWorker:false})
      assert e.useWorker? and !e.useWorker,"set useWorker"
    it 'engine hierarchy', ->
      assert(e.parentEngine is GSS.engines.root)
      expect(e.childEngines).to.be.eql([])
      assert GSS.engines.root.childEngines.indexOf(e) > -1, "e is not child of root"
    it 'should run commands', (done)->
      e.once 'solved', ->
        val = e.vars['[x]']
        assert val == 222, "engine has wrong [x] value: #{val}"
        done()
      e.run commands: [
          ['eq', ['get','[x]'], ['number',222]]
        ]
    it 'should destroy', (done)->
      e.destroy()
      assert !e.parentEngine, "parentEngine"
      #assert expect(e.childEngines).to.be.eql([])
      assert GSS.engines.root.childEngines.indexOf(e) is -1, "e is still child of root"
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
          $('#fixtures').appendChild container
          engine = GSS({scope:container, useWorker:useWorker})
          container.innerHTML = """
            <button id="button1">One</button>
            <button id="button2">Second</button>
            <button id="button3">Three</button>
            <button id="button4">4</button>
          """
        after (done) ->
          remove(container)
          # have to manually destroy, otherwise there is some clash!
          engine.destroy()
          done()
    
        ast =
          selectors: [
            '#button1'
            '#button2'
          ]
          commands: [
            ['eq', ['get$', 'width', ['$id','button1']], ['get$', 'width', ['$id','button2']]]
            ['eq', ['get$', 'width', ['$id','button1']], ['number', '100']]
          ]
        
        it 'should useWorker or not', ->
          if GSS.config is useWorker
            assert useWorker is engine.useWorker
            
        it 'before solving the second button should be wider', ->
          button1 = container.querySelector '#button1'
          button2 = container.querySelector '#button2'
          expect(button2.getBoundingClientRect().width).to.be.above button1.getBoundingClientRect().width
        it 'after solving the buttons should be of equal width', (done) ->
          onSolved = (e) ->
            values = e.detail.values
            expect(values).to.be.an 'object'
            expect(Math.round(button1.getBoundingClientRect().width)).to.equal 100
            expect(Math.round(button2.getBoundingClientRect().width)).to.equal 100
            container.removeEventListener 'solved', onSolved
            done()
          container.addEventListener 'solved', onSolved
          engine.run ast
          
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
          $('#fixtures').appendChild container
          engine = GSS({scope:container, useWorker:useWorker})
          container.innerHTML = """
            <h1 style="line-height:12px;font-size:12px;">One</h1>
            <h1 style="line-height:12px;font-size:12px;">Two</h1>
          """
          
        after (done) ->
          remove(container)
          # have to manually destroy, otherwise there is some clash!
          engine.destroy()
          done()
    
        ast =
          selectors: [
            '#text'
          ]
          commands: [
            ['eq', ['get$','line-height',['$tag','h1']], ['get$','font-size',['$tag','h1']]]
            ['eq', ['get$','line-height',['$tag','h1']], ['number', '42']]
          ]
        
        it 'should useWorker or not', ->
          if GSS.config is useWorker
            assert useWorker is engine.useWorker
            
        it 'before solving', ->
          text1 = container.getElementsByTagName('h1')[0]
          text2 = container.getElementsByTagName('h1')[1]
          assert text1.style['lineHeight'] is "12px"
          assert text2.style['lineHeight'] is "12px"
          assert text1.style['fontSize'] is "12px"
          assert text2.style['fontSize'] is "12px"          
        it 'after solving', (done) ->
          onSolved = (e) ->
            values = e.detail.values
            assert text1.style['lineHeight'] is "42px"
            assert text2.style['lineHeight'] is "42px"
            assert text1.style['fontSize'] is "42px"
            assert text2.style['fontSize'] is "42px"
            container.removeEventListener 'solved', onSolved
            done()
          container.addEventListener 'solved', onSolved
          engine.run ast
          
    test(true)              
  
  describe 'Before IDs exist', ->
    engine = null
    container = null
    button1 = null
    button2 = null
    
    before ->
      container = document.createElement 'div'
      $('#fixtures').appendChild container
      engine = GSS({scope:container})
      container.innerHTML = """
      """
    
    after (done) ->
      remove(container)
      # have to manually destroy, otherwise there is some clash!
      engine.destroy()
      done()
    
    ast =
      selectors: [
        '#button1'
        '#button2'
      ]
      commands: [
        ['eq', ['get$','width',['$id','button2']], ['number', '222']]
        ['eq', ['get$','width',['$id','button1']], ['number', '111']]        
      ]
    
    it 'before solving buttons dont exist', ->
      engine.run ast
      button1 = container.querySelector '#button1'
      button2 = container.querySelector '#button2'
      assert !button1, "button1 doesn't exist"
      assert !button2, "button2 doesn't exist"
    
    it 'engine remains idle',  ->            
      assert engine.workerCommands.length is 0, 'engine has no commands for worker'
      assert engine.workerMessageHistory.length is 0, 'engine sent nothing to worker'
    
    it 'after solving the buttons should have right', (done) ->
      onSolved = (e) ->
        values = e.detail.values
        expect(values).to.be.an 'object'
        w = Math.round(button1.getBoundingClientRect().width)
        assert w is 111, "button1 width: #{w}"
        w = Math.round(button2.getBoundingClientRect().width)
        assert w is 222, "button2 width: #{w}"
        container.removeEventListener 'solved', onSolved
        done()
      container.addEventListener 'solved', onSolved
      container.innerHTML = """
      <div>        
        <button id="button2">Second</button>
        <button id="button1">One</button>        
      </div>
      """
      button1 = container.querySelector '#button1'
      button2 = container.querySelector '#button2'
    
  describe 'Before IDs exist - advanced', ->
    engine = null
    container = null
    
    before ->
      container = document.createElement 'div'
      $('#fixtures').appendChild container
      engine = GSS({scope:container})
      container.innerHTML = """
        <div id="w">        
        </div>
      """
    
    after (done) ->
      remove(container)
      # have to manually destroy, otherwise there is some clash!
      engine.destroy()
      done()
    

    ast =
      selectors: ["#b1", "#b2"]
      commands: [
        ["eq", ["get$","right",["$id","b1"]], ["get$","x",["$id","b2"]]]
        
        ["eq", ["get$","width",["$id","w"]]  , ["number",200]]
        ["eq", ["get$","x",    ["$id","w"]]  , ["get",'[target]']]
        ["eq", ["get$","right",["$id","b2"]] , ["get$","right",["$id","w"]]] 
        # b2[right] -> 200
        ["eq", ["get$","x",    ["$id","b1"]] , ["get","[target]"]]        
        ["eq", ["get$","width",["$id","b1"]] , ["get$","width",["$id","b2"]]]
        
        ["eq", ["get", "[target]"], 0]
      ]
    
    it 'after solving should have right size', (done) ->
      onSolved = (e) ->
        w = Math.round($("#w").getBoundingClientRect().width)
        assert w is 200, "w width: #{w}"
        w = Math.round($('#b1').getBoundingClientRect().width)
        assert w is 100, "button1 width: #{w}"
        w = Math.round($('#b2').getBoundingClientRect().width)
        assert w is 100, "button2 width: #{w}"
        container.removeEventListener 'solved', onSolved
        done()
      container.addEventListener 'solved', onSolved
      $('#w').innerHTML = """
      <div>        
           <div id="b1"></div>
           <div id="b2"></div>
      </div>
      """
      engine.run ast      
  
  describe 'Math', ->
    before ->
      container = document.createElement 'div'
      $('#fixtures').appendChild container
      engine = GSS(container)

    after (done) ->
      remove(container)
      done()
    
    it 'var == var * (num / num)', (done) ->
      engine.run 
        commands: [
          ['eq', ['get', '[y]'], ['number',10]]
          ['eq', ['get', '[x]'], ['multiply',['get','[y]'],['divide',['number',1],['number',2]]] ]
        ]
      onSolved =  (e) ->
        values = e.detail.values
        expect(values).to.eql engine.vars
        expect(values).to.eql 
          '[x]': 5
          '[y]': 10
        container.removeEventListener 'solved', onSolved
        done()
      container.addEventListener 'solved', onSolved
  
  describe 'Engine::vars', ->
    engine = null
    container = null
  
    beforeEach ->
      container = document.createElement 'div'
      $('#fixtures').appendChild container
      engine = GSS(container)

    afterEach (done) ->
      remove(container)
      done()
    
    it 'engine.vars are set', (done) ->
      engine.registerCommands [
          ['eq', ['get', '[col-width]'], ['number',100]]
          ['eq', ['get', '[row-height]'], ['number',50]]
        ]
      onSolved =  (e) ->
        values = e.detail.values
        expect(values).to.eql engine.vars
        expect(values).to.eql 
          '[col-width]': 100
          '[row-height]': 50
        container.removeEventListener 'solved', onSolved
        done()
      container.addEventListener 'solved', onSolved
    
    it 'engine.vars are updated after many suggests', (done) ->
      engine.registerCommands [
          ['eq', ['get', '[col-width]'], ['number',100], 'medium']
          ['eq', ['get', '[row-height]'], ['number',50], 'medium']
          ['suggest', ['get', '[col-width]'], 10]
          ['suggest', '[row-height]', 5]
        ]
      count = 0
      onSolved =  (e) ->        
        count++
        if count is 1
          values = e.detail.values
          expect(values).to.eql engine.vars
          colwidth = engine.vars['[col-width]']
          rowheight = engine.vars['[row-height]']
          assert colwidth is 10, "fist step [col-width] == #{colwidth}"
          assert rowheight , "fist step [row-height] == #{rowheight}"
          engine.registerCommands [
              ['suggest', '[col-width]', 1]
              ['suggest', ['get', '[row-height]'], .5]
            ]
        else if count is 2
          expect(engine.vars).to.eql 
            '[col-width]': 1
            '[row-height]': .5
          engine.registerCommands [
              ['suggest', '[col-width]', 333]
              ['suggest', '[row-height]', 222]
            ]
        else if count is 3
          expect(engine.vars).to.eql 
            '[col-width]': 333
            '[row-height]': 222
          container.removeEventListener 'solved', onSolved
          done()
      container.addEventListener 'solved', onSolved
      
      
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
      $('#fixtures').appendChild container
      engine = GSS(container)

    afterEach (done) ->
      remove(container)
      done()
      
    it "force display on un-queried views", (done)->
      onSolved = (e) ->
        w = Math.round($('#d1').getBoundingClientRect().width)
        assert w is 1, "d1 width: #{w}"
        w = Math.round($('#d2').getBoundingClientRect().width)
        assert w is 2, "d2 width: #{w}"
        w = Math.round($('#d3').getBoundingClientRect().width)
        assert w is 3, "d3 width: #{w}"
        container.removeEventListener 'solved', onSolved
        done()
      container.addEventListener 'solved', onSolved
      
      engine.display {values:{"$d1[width]":1,"$d2[width]":2,"$d3[width]":3}}, true
      
    

  
  describe 'GSS Engine with styleNode', ->
    container = null
    engine = null
  
    before ->
      container = document.createElement 'div'
      $('#fixtures').appendChild container
  
    after ->
      remove(container)

    describe 'Engine::styleNode', ->
    
      it 'Runs commands from sourceNode', (done) ->
        container.innerHTML =  """
          <style type="text/gss-ast" scoped>
          [
            { 
              "type":"constraint",
              "commands": [
                ["eq", ["get$","x",["$class", "box"]], ["number",100]]
              ]          
            }
          ]
          </style>
          <div id="box1" class="box"></div>
          <div id="box2" class="box"></div>
          """
        engine = GSS(container)
        listener = (e) ->        
          expect(engine.lastWorkerCommands).to.eql [
              ['eq', ['get$','x','$box1','.box'], ['number',100]]
              ['eq', ['get$','x','$box2','.box'], ['number',100]]
            ]
          container.removeEventListener 'solved', listener
          done()
        container.addEventListener 'solved', listener

  describe 'GSS Engine Life Cycle', ->  
    container = null
  
    before ->
      container = document.createElement 'div'
      $('#fixtures').appendChild container
  
    after ->
      remove(container)

    describe 'Asynchronous existentialism (one engine for life of container)', ->
      engine1 = null
    
      it 'without GSS rules style tag', ->
        engine1 = GSS(container)
        expect(engine1.id).to.be.equal GSS.getId(container)
        expect(engine1.scope).to.be.equal container
    
      it 'after receives GSS style tag', (done) ->
        engine2 = GSS(container)
        expect(engine1.id).to.be.equal GSS.getId(container)
        container.innerHTML =  """
          <style id="gssa" type="text/gss-ast" scoped>
          [{
            "type":"constraint",
            "commands": [
              ["suggest", "[col-width-1]", 111]
            ]          
          }]
          </style>
          """
        listener = (e) ->
          engine2 = GSS(container)
          expect(engine1).to.equal engine2
          expect(engine1.vars['[col-width-1]']).to.equal 111
          container.removeEventListener 'solved', listener
          done()
        container.addEventListener 'solved', listener
    
      it 'after modified GSS style tag', (done) ->
        expect(engine1.id).to.be.equal GSS.getId(container)
        styleNode = document.getElementById 'gssa'
        styleNode.innerHTML = """
          [{
            "type":"constraint",
            "commands": [
              ["suggest", "[col-width-11]", 1111]
            ]          
          }]
        """        
        listener = (e) ->
          engine2 = GSS(container)
          expect(engine1).to.equal engine2
          expect(engine1.vars['[col-width-1]']).to.equal undefined
          expect(engine1.vars['[col-width-11]']).to.equal 1111
          container.removeEventListener 'solved', listener
          done()
        container.addEventListener 'solved', listener
    
      it 'after replaced GSS style tag', (done) ->
        engine2 = GSS(container)
        expect(engine1.id).to.be.equal GSS.getId(container)
        container.innerHTML =  """
          <style id="gssb" type="text/gss-ast" scoped>
          [{
            "type":"constraint",
            "commands": [
              ["suggest", "[col-width-2]", 222]
            ]          
          }]
          </style>
          <div id="box1" class="box" data-gss-id="12322"></div>
          """
        listener = (e) ->
          engine2 = GSS(container)
          assert engine1 is engine2, "engine is maintained" 
          assert !engine1.vars['[col-width-1]']?, "engine1.vars['[col-width-1]'] removed" 
          expect(engine1.vars['[col-width-11]']).to.equal undefined
          expect(engine1.vars['[col-width-2]']).to.equal 222
          container.removeEventListener 'solved', listener
          done()
        container.addEventListener 'solved', listener
    
      it 'Engine after container replaced multiple GSS style tags', (done) ->
        engine2 = GSS(container)
        expect(engine1.id).to.be.equal GSS.getId(container)
        container.innerHTML =  """
          <style id="gssc" type="text/gss-ast" scoped>
          [{
            "type":"constraint",
            "commands": [
              ["suggest", "[col-width-3]", 333]
            ]          
          }]
          </style>
          <style id="gssd" type="text/gss-ast" scoped>
          [{
            "type":"constraint",
            "commands": [
              ["suggest", "[col-width-4]", 444]
            ]          
          }]
          </style>
          <div id="box1" class="box" data-gss-id="12322"></div>
          """
        listener = (e) ->
          engine2 = GSS(container)
          expect(engine1).to.equal engine2
          #expect(engine1.styleNode).to.equal document.getElementById 'gssb'
          expect(engine1.vars['[col-width-1]']).to.equal undefined
          expect(engine1.vars['[col-width-2]']).to.equal undefined
          expect(engine1.vars['[col-width-3]']).to.equal 333
          expect(engine1.vars['[col-width-4]']).to.equal 444
          container.removeEventListener 'solved', listener
          done()
        container.addEventListener 'solved', listener
    
      it 'Engine after container removed', (done) ->
        remove(container)
        wait = ->
          expect(engine1.is_destroyed).to.equal true
          expect(GSS.engines.byId[GSS.getId(container)]?).to.equal false
          done()
        setTimeout wait, 1
    
      it 'new Engine after container re-added', () ->      
        $('#fixtures').appendChild container      
        engine3 = GSS(container)
        expect(engine1).to.not.equal engine3
  

  describe 'Nested Engine', ->  
    container = null
    containerEngine = null
    wrap = null
    wrapEngine = null
  
    before ->
      container = document.createElement 'div'
      $('#fixtures').appendChild container
      #        
      container.innerHTML =  """
        <section>
          <div id="wrap" style="width:100px;" data-gss-id="999">
            <style type="text/gss-ast" scoped>
            [{
              "type":"constraint",
              "commands": [
                ["eq", ["get$","width",["$id","boo"]], ["number",100]]
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




  describe 'Engine Hierarchy', ->  
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
      


  
  describe 'framed scopes', ->
    container = null
    containerEngine = null
    wrap = null
    wrapEngine = null
  
    before ->
      container = document.createElement 'div'
      container.id = "wrap-container"
      $('#fixtures').appendChild container
      #        
      container.innerHTML =  """
          <style type="text/gss-ast" scoped>
          [{
            "type":"constraint",
            "commands": [
              ["eq", ["get$","width",["$id","wrap"]], ["number",69]]
            ]
          }]
          </style>
          <div id="wrap" style="width:100px;" data-gss-id="wrap">
            <style type="text/gss-ast" scoped>
            [{
              "type":"constraint",
              "commands": [
                ["eq", ["get$","width",["$id","boo"]], ["get$","width",["$reserved","scope"]]]
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
      #debugger
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

  describe "Engine memory management", ->
    it "engines are destroyed", (done)->
      GSS._.defer ->
        expect(GSS.engines.length).to.equal(1)
        done()
    it "views are recycled *MOSTLY*", (done) ->
      # - margin_of_error should be about 2 for things like document.body
      # - larger b/c views activated via ::parent queries will not be cleaned up, need more robust GSS.Query
      margin_of_error = 10
      GSS._.defer ->
        count = 0
        for key of GSS.View.byId          
          count++
        assert count <= document.querySelectorAll("[data-gss-id]").length + margin_of_error, "views are recycled: #{count}"
        done()
    it "_byIdCache is cleared *MOSTLY*", (done) ->
      margin_of_error = 10
      GSS._.defer ->
        count = 0
        for key of GSS._byIdCache
          count++
        assert count <= document.querySelectorAll("[data-gss-id]").length + margin_of_error, "views are recycled: #{count}"
        done()
  
    #it 'updates to scoped value are bridged downward', (done) ->

