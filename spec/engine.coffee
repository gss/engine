Engine = GSS.Engine #require 'gss-engine/lib/Engine.js'

describe 'GSS engine', ->
  container = null
  engine = null
  
  before ->
    fixtures = document.getElementById 'fixtures'
    container = document.createElement 'div'
    fixtures.appendChild container
    engine = GSS(container)

  after (done) ->
    container.remove()
    done()

  describe 'when initialized', ->
    it 'should be bound to the DOM scope', ->
      chai.expect(engine.scope).to.eql container
    it 'should not hold a worker', ->
      chai.expect(engine.worker).to.be.a 'null'
    it 'should pass the scope to its DOM getter', ->
      chai.expect(engine.getter).to.be.an 'object'
      chai.expect(engine.getter.scope).to.eql engine.scope
    it 'should pass the scope to its DOM setter', ->
      chai.expect(engine.setter).to.be.an 'object'
      chai.expect(engine.setter.scope).to.eql engine.scope
  
  describe 'with rule #button1[width] == #button2[width]', ->
    
    ast =
      selectors: [
        '#button1'
        '#button2'
      ]
      commands: [
        ['var', '#button1[width]', 'width', ['$id', 'button1']]
        ['var', '#button2[width]', 'width', ['$id', 'button2']]
        ['eq', ['get', '#button1[width]'], ['get', '#button2[width]']]
        ['eq', ['get', '#button1[width]'], ['number', '100']]
      ]
    button1 = null
    button2 = null
    it 'before solving the second button should be wider', ->
      container.innerHTML = """
        <button id="button1">One</button>
        <button id="button2">Second</button>
        <button id="button3">Three</button>
        <button id="button4">4</button>
      """
      button1 = container.querySelector '#button1'
      button2 = container.querySelector '#button2'
      chai.expect(button2.getBoundingClientRect().width).to.be.above button1.getBoundingClientRect().width
    it 'after solving the buttons should be of equal width', (done) ->
      onSolved = (e) ->
        values = e.detail.values
        chai.expect(values).to.be.an 'object'
        chai.expect(Math.round(button1.getBoundingClientRect().width)).to.equal 100
        chai.expect(Math.round(button2.getBoundingClientRect().width)).to.equal 100
        container.removeEventListener 'solved', onSolved
        done()
      container.addEventListener 'solved', onSolved
      engine.onError = (error) ->
        chai.assert("#{event.message} (#{event.filename}:#{event.lineno})").to.equal ''
        engine.onError = null
        done()
      engine.run ast
  
describe 'Engine::vars', ->
  engine = null
  container = null
  
  beforeEach ->
    fixtures = document.getElementById 'fixtures'
    container = document.createElement 'div'
    fixtures.appendChild container
    engine = GSS(container)

  afterEach (done) ->
    container.remove()
    done()
    
  it 'engine.vars are set', (done) ->
    engine.run 
      commands: [
        ['var', '[col-width]']
        ['var', '[row-height]']
        ['eq', ['get', '[col-width]'], ['number',100]]
        ['eq', ['get', '[row-height]'], ['number',50]]
      ]
    container.innerHTML = ""
    onSolved =  (e) ->
      values = e.detail.values
      chai.expect(values).to.eql engine.vars
      chai.expect(values).to.eql 
        '[col-width]': 100
        '[row-height]': 50
      container.removeEventListener 'solved', onSolved
      done()
    container.addEventListener 'solved', onSolved
  it 'engine.vars are updated after many suggests', (done) ->
    engine.run 
      commands: [
        ['var', '[col-width]']
        ['var', '[row-height]']
        ['eq', ['get', '[col-width]'], ['number',100], 'strong']
        ['eq', ['get', '[row-height]'], ['number',50], 'strong']
        ['suggest', ['get', '[col-width]'], 10]
        ['suggest', '[row-height]', 5]
      ]
    container.innerHTML = ""
    count = 0
    onSolved =  (e) ->        
      count++
      if count is 1
        values = e.detail.values
        chai.expect(values).to.eql engine.vars
        colwidth = engine.vars['[col-width]']
        rowheight = engine.vars['[row-height]']
        chai.assert colwidth is 10, "fist step [col-width] == #{colwidth}"
        chai.assert rowheight , "fist step [row-height] == #{rowheight}"
        chai.expect(engine.vars).to.eql 
          '[col-width]': 10
          '[row-height]': 5
        engine.run 
          commands: [
            ['suggest', '[col-width]', 1]
            ['suggest', ['get', '[row-height]'], .5]
          ]
      else if count is 2
        chai.expect(engine.vars).to.eql 
          '[col-width]': 1
          '[row-height]': .5
        engine.run 
          commands: [
            ['suggest', '[col-width]', 333]
            ['suggest', '[row-height]', 222]
          ]
      else if count is 3
        chai.expect(engine.vars).to.eql 
          '[col-width]': 333
          '[row-height]': 222
        container.removeEventListener 'solved', onSolved
        done()
    container.addEventListener 'solved', onSolved
      
  
  
describe 'GSS Engine with styleNode', ->
  container = null
  engine = null
  fixtures = null
  
  before ->
    fixtures = document.getElementById 'fixtures'
    container = document.createElement 'div'
    fixtures.appendChild container
  
  after ->
    container.remove()

  describe 'Engine::styleNode', ->
    
    it 'Runs commands from sourceNode', (done) ->
      container.innerHTML =  """
        <style type="text/gss-ast">
        {
          "commands": [
            ["var", ".box[x]", "x", ["$class", "box"]],
            ["eq", ["get",".box[x]",".box"], ["number",100]]
          ]          
        }
        </style>
        <div id="box1" class="box"></div>
        <div id="box2" class="box"></div>
        """
      engine = GSS(container)      
      listener = (e) ->        
        chai.expect(engine.lastWorkerCommands).to.eql [
            ['var', '$box1[x]', '$box1']
            ['var', '$box2[x]', '$box2']
            ['eq', ['get','$box1[x]','.box$box1'], ['number',100]]
            ['eq', ['get','$box2[x]','.box$box2'], ['number',100]]
          ]
        container.removeEventListener 'solved', listener
        done()
      container.addEventListener 'solved', listener

describe 'GSS Engine Life Cycle', ->  
  container = null
  
  before ->
    fixtures = document.getElementById 'fixtures'
    container = document.createElement 'div'
    fixtures.appendChild container
  
  after ->
    container.remove()

  describe 'Asynchronous existentialism (one engine for life of container)', ->
    engine1 = null
    
    it 'without GSS rules style tag', ->
      engine1 = GSS(container)
      chai.expect(engine1.id).to.be.equal GSS.getId(container)
      chai.expect(engine1.scope).to.be.equal container
    
    it 'after receives GSS style tag', (done) ->
      engine2 = GSS(container)
      chai.expect(engine1.id).to.be.equal GSS.getId(container)
      container.innerHTML =  """
        <style id="gssa" type="text/gss-ast">
        {
          "commands": [
            ["var", "[col-width-1]"],
            ["suggest", "[col-width-1]", 111]
          ]          
        }
        </style>
        """
      listener = (e) ->
        engine2 = GSS(container)
        chai.expect(engine1).to.equal engine2
        chai.expect(engine1.vars['[col-width-1]']).to.equal 111
        container.removeEventListener 'solved', listener
        done()
      container.addEventListener 'solved', listener
    
    it 'after modified GSS style tag', (done) ->
      chai.expect(engine1.id).to.be.equal GSS.getId(container)
      styleNode = document.getElementById 'gssa'
      styleNode.innerHTML = """
        {
          "commands": [
            ["var", "[col-width-11]"],
            ["suggest", "[col-width-11]", 1111]
          ]          
        }
      """        
      listener = (e) ->
        engine2 = GSS(container)
        chai.expect(engine1).to.equal engine2
        chai.expect(engine1.vars['[col-width-1]']).to.equal undefined
        chai.expect(engine1.vars['[col-width-11]']).to.equal 1111
        container.removeEventListener 'solved', listener
        done()
      container.addEventListener 'solved', listener
    
    it 'after replaced GSS style tag', (done) ->
      engine2 = GSS(container)
      chai.expect(engine1.id).to.be.equal GSS.getId(container)
      container.innerHTML =  """
        <style id="gssb" type="text/gss-ast">
        {
          "commands": [
            ["var", "[col-width-2]"],
            ["suggest", "[col-width-2]", 222]
          ]          
        }
        </style>
        <div id="box1" class="box" data-gss-id="12322"></div>
        """
      listener = (e) ->
        engine2 = GSS(container)
        chai.expect(engine1).to.equal engine2
        chai.expect(engine1.vars['[col-width-1]']).to.equal undefined
        chai.expect(engine1.vars['[col-width-11]']).to.equal undefined
        chai.expect(engine1.vars['[col-width-2]']).to.equal 222
        container.removeEventListener 'solved', listener
        done()
      container.addEventListener 'solved', listener
    
    it 'Engine after container replaced multiple GSS style tags', (done) ->
      engine2 = GSS(container)
      chai.expect(engine1.id).to.be.equal GSS.getId(container)
      container.innerHTML =  """
        <style id="gssc" type="text/gss-ast">
        {
          "commands": [
            ["var", "[col-width-3]"],
            ["suggest", "[col-width-3]", 333]
          ]          
        }
        </style>
        <style id="gssd" type="text/gss-ast">
        {
          "commands": [
            ["var", "[col-width-4]"],
            ["suggest", "[col-width-4]", 444]
          ]          
        }
        </style>
        <div id="box1" class="box" data-gss-id="12322"></div>
        """
      listener = (e) ->
        engine2 = GSS(container)
        chai.expect(engine1).to.equal engine2
        #chai.expect(engine1.styleNode).to.equal document.getElementById 'gssb'
        chai.expect(engine1.vars['[col-width-1]']).to.equal undefined
        chai.expect(engine1.vars['[col-width-2]']).to.equal undefined
        chai.expect(engine1.vars['[col-width-3]']).to.equal 333
        chai.expect(engine1.vars['[col-width-4]']).to.equal 444
        container.removeEventListener 'solved', listener
        done()
      container.addEventListener 'solved', listener
    
    it 'Engine after container removed', (done) ->
      container.remove()
      wait = ->
        chai.expect(engine1.is_destroyed).to.equal true
        chai.expect(GSS.engines.byId[GSS.getId(container)]?).to.equal false
        done()
      setTimeout wait, 1
    
    it 'new Engine after container readded', () ->
      fixtures.appendChild container
      engine3 = GSS(container)
      chai.expect(engine1).to.not.equal engine3
      # cleanup
      container.remove()

describe 'CSS Dump /', ->  
  container = null
  
  before ->
    fixtures = document.getElementById 'fixtures'
    container = document.createElement 'div'
    fixtures.appendChild container
  
  after ->
    container.remove()

  describe 'Asynchronous existentialism (one engine for life of container)', ->
    engine = null
    
    it 'CSS in AST', (done) ->
      engine = GSS(container)
      container.innerHTML =  """
        <style type="text/gss-ast">
        {
          "commands": [
            ["var", "[col-width-1]"],
            ["suggest", "[col-width-1]", 111]
          ],
          "css": "#box{width:100px;}#b{height:10px;}"       
        }
        </style>
        """
      listener = (e) ->           
        chai.expect(engine.cssDump).to.equal document.getElementById("gss-css-dump-" + engine.id)
        chai.expect(engine.cssDump.innerHTML).to.equal "#box{width:100px;}#b{height:10px;}"
        container.removeEventListener 'solved', listener
        done()
      container.addEventListener 'solved', listener

describe 'Nested Engine', ->  
  container = null
  containerEngine = null
  wrap = null
  wrapEngine = null
  
  before ->
    fixtures = document.getElementById 'fixtures'
    container = document.createElement 'div'
    fixtures.appendChild container
    #        
    container.innerHTML =  """
      <section>
        <div id="wrap" style="width:100px;" data-gss-id="999">
          <style type="text/gss-ast">
          {
            "commands": [
              ["var", "#boo[width]", "width", ["$id","boo"]],
              ["eq", ["get","#boo[width]","#boo"], ["number",100]]
            ]
          }
          </style>
          <div id="boo" data-gss-id="boo"></div>
        </div>
      </section>
      """
    containerEngine = GSS(container)
    wrap = document.getElementById('wrap')
    wrapEngine = GSS(wrap)
  
  after ->
    container.remove()
  
  it 'engines are attached to correct element', () ->
    chai.expect(wrapEngine).to.not.equal containerEngine
    chai.expect(wrapEngine.scope).to.equal wrap
    chai.expect(containerEngine.scope).to.equal container
  
  it 'correct values', (done) ->
    listener = (e) ->           
      chai.expect(wrapEngine.vars).to.eql 
        "$boo[width]": 100
      wrap.removeEventListener 'solved', listener
      done()
    wrap.addEventListener 'solved', listener




describe 'Engine Hierarchy', ->  
  
  
  describe 'root engine', ->
    root = null
    fixtures = null
    before ->
      fixtures = document.getElementById 'fixtures'
    it 'is initialized', ->
      root = GSS.engines.root
      chai.expect(root).to.exist
    it 'is root element', ->
      chai.expect(root.scope).to.equal GSS.Getter.getRootScope()
    it 'gss style tags direct descendants of <body> are run in root engine', () ->
      document.body.insertAdjacentHTML 'afterbegin', """
        <style id="root-styles" type="text/gss-ast">
        </style>
      """
      style = document.getElementById "root-styles"
      scope = GSS.get.scopeFor style
      chai.expect(scope).to.equal document.body
      style.remove()
      
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
        <style id="root-styles-1" type="text/gss-ast">
        </style>
        <section id="scope2">
          <style id="root-styles-2" type="text/gss-ast">
          </style>
          <div>
            <div id="scope3">
              <style id="root-styles-3" type="text/gss-ast">
              </style>
            </div>
          </div>
        </section>
      """
    it 'nested style tags have correct scope', () ->      
      style1 = document.getElementById "root-styles-1"
      scope1 = GSS.get.scopeFor style1
      chai.expect(scope1).to.equal document.body
      style2 = document.getElementById "root-styles-2"
      scope2 = GSS.get.scopeFor style2
      chai.expect(scope2).to.equal document.getElementById "scope2"
      style3 = document.getElementById "root-styles-3"
      scope3 = GSS.get.scopeFor style3
      chai.expect(scope3).to.equal document.getElementById "scope3"
    
    it 'correct parent-child engine relationships', ->
      engine1 = GSS scope:scope1
      engine2 = GSS scope:scope2
      engine3 = GSS scope:scope3
      chai.expect(GSS.engines.root).to.equal engine1
      chai.expect(engine2.parentEngine).to.equal engine1
      chai.expect(engine3.parentEngine).to.equal engine2      
      chai.expect(engine1.childEngines.indexOf(engine2) > -1).to.be.true
      chai.expect(engine2.childEngines.indexOf(engine3) > -1).to.be.true
    
    it 'parent-child engine relationships update even w/o styles', (done) ->      
      style1.remove()
      style2.remove()
      style3.remove()
      scope3.remove()
      GSS._.defer ->
        chai.expect(engine3.is_destroyed).to.be.true
        chai.expect(engine3.parentEngine).to.not.exist
        chai.expect(engine2.childEngines.indexOf(engine3)).to.equal -1
        scope2.remove()        
        GSS._.defer ->
          chai.expect(engine2.is_destroyed).to.be.true
          chai.expect(engine2.parentEngine).to.not.exist
          chai.expect(engine1.childEngines.indexOf(engine2)).to.equal -1
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
          <style id="root-styles-2" type="text/gss-ast">
          </style>
          <div>
            <div id="scope3">
              <style id="root-styles-3" type="text/gss-ast">
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
      scope2.remove()
    
    it 'correct parent-child engine relationships', ->
      chai.expect(GSS.engines.root).to.equal engine1
      chai.expect(engine2.parentEngine).to.equal engine1
      chai.expect(engine3.parentEngine).to.equal engine2      
      chai.expect(engine1.childEngines.indexOf(engine2) > -1).to.be.true
      chai.expect(engine2.childEngines.indexOf(engine3) > -1).to.be.true
    
    it 'engine destruction cascades', (done) ->      
      scope2.remove()
      GSS._.defer ->
        chai.expect(engine3.is_destroyed).to.be.true
        chai.expect(engine3.parentEngine).to.not.exist
        chai.expect(engine2.childEngines.indexOf(engine3)).to.equal -1
        chai.expect(engine2.is_destroyed).to.be.true
        chai.expect(engine2.parentEngine).to.not.exist
        chai.expect(engine1.childEngines.indexOf(engine2)).to.equal -1
        done()
    
    
    #it 'nested engines parent child relationships', () ->
      


    
  
  
describe 'framed scopes', ->
  container = null
  containerEngine = null
  wrap = null
  wrapEngine = null
  
  before ->
    fixtures = document.getElementById 'fixtures'
    container = document.createElement 'div'
    container.id = "wrap-container"
    fixtures.appendChild container
    #        
    container.innerHTML =  """
        <style type="text/gss-ast">
        {
          "commands": [
            ["var", "#wrap[width]", "width", ["$id","wrap"]],
            ["eq", ["get","#wrap[width]","#wrap"], ["number",69]]
          ]
        }
        </style>
        <div id="wrap" style="width:100px;" data-gss-id="wrap">
          <style type="text/gss-ast">
          {
            "commands": [
              ["var", "#boo[width]", "width", ["$id","boo"]],
              ["var", "::scope[width]", "width", ["$reserved","scope"]],
              ["eq", ["get","#boo[width]","#boo"], ["get","::scope[width]"]]
            ]
          }
          </style>
          <div id="boo" data-gss-id="boo"></div>
        </div>
      """
    containerEngine = GSS(container)
    wrap = document.getElementById('wrap')
    wrapEngine = GSS(wrap)
  
  after ->
    container.remove()

  it 'engines are attached to correct element', () ->
    chai.expect(wrapEngine).to.not.equal containerEngine
    chai.expect(wrapEngine.scope).to.equal wrap
    chai.expect(containerEngine.scope).to.equal container    

  it 'scoped value is bridged downward', (done) ->
    #debugger
    cListener = (e) ->           
      container.removeEventListener 'solved', cListener
      
    container.addEventListener 'solved', cListener
    count = 0
    wListener = (e) ->     
      count++      
      if count is 2
        chai.expect(wrapEngine.vars).to.eql 
          "$boo[width]": 69
          "$wrap[width]": 69
        wrap.removeEventListener 'solved', wListener      
        done()              
    wrap.addEventListener 'solved', wListener

describe "Engine memory management", ->
  it "engines are destroyed", (done)->
    GSS._.defer ->
      chai.expect(GSS.engines.length).to.equal(1)
      done()
  it "views are recycled", (done) ->
    margin_of_error = 2
    GSS._.defer ->
      count = 0
      for key of GSS.View.byId
        count++
      chai.assert count <= document.querySelectorAll("[data-gss-id]").length + margin_of_error, "views are recycled: #{count}"
      done()
  it "_byIdCache is cleared", (done) ->
    margin_of_error = 2
    GSS._.defer ->
      count = 0
      for key of GSS._byIdCache
        count++
      chai.assert count <= document.querySelectorAll("[data-gss-id]").length + margin_of_error, "views are recycled: #{count}"
      done()
  
  #it 'updates to scoped value are bridged downward', (done) ->

###
describe '::This framed view', ->  
  container = null
  containerEngine = null
  wrap = null
  wrapEngine = null
  
  before ->
    fixtures = document.getElementById 'fixtures'
    container = document.createElement 'div'
    fixtures.appendChild container
    #        
    container.innerHTML =  """
        <div id="wrap" style="width:100px;" data-gss-id="wrap">
          <style type="text/gss-ast">
          {
            "commands": [
              ["var", "#boo[width]", "width", ["$id","boo"]],
              ["var", "::scope[width]", "width", ["$reserved","scope"]],
              ["eq", ["get","#boo[width]","#boo"], ["get","::scope[width]"]]
            ]
          }
          </style>
          <div id="boo" data-gss-id="boo"></div>
        </div>
      """
    containerEngine = GSS(container)
    wrap = document.getElementById('wrap')
    wrapEngine = GSS(wrap)
  
  after ->
    container.remove()

  it 'engines are attached to correct element', () ->
    chai.expect(wrapEngine).to.not.equal containerEngine
    chai.expect(wrapEngine.scope).to.equal wrap
    chai.expect(containerEngine.scope).to.equal container
  
  it 'correct values', (done) ->
    listener = (e) ->      
      wrap.removeEventListener 'solved', listener     
      chai.expect(wrapEngine.vars).to.eql 
        "$boo[width]": 100
        "$wrap[width]": 100      
      done()
    wrap.addEventListener 'solved', listener
###