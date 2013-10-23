Engine = GSS.Engine #require 'gss-engine/lib/Engine.js'

describe 'GSS engine', ->
  container = null
  engine = null
  
  before ->
    fixtures = document.getElementById 'fixtures'
    container = document.createElement 'div'
    fixtures.appendChild container
  
  beforeEach ->
    engine = new Engine 
      container: container

  afterEach (done) ->
    engine.destroy()
    done()

  describe 'when initialized', ->
    it 'should be bound to the DOM container', ->
      chai.expect(engine.container).to.eql container
    it 'should not hold a worker', ->
      chai.expect(engine.worker).to.be.a 'null'
    #it 'should pass the container to its DOM getter', ->
    #  chai.expect(engine.getter).to.be.an 'object'
    #  chai.expect(engine.getter.container).to.eql engine.container
    it 'should pass the container to its DOM setter', ->
      chai.expect(engine.setter).to.be.an 'object'
      chai.expect(engine.setter.container).to.eql engine.container
  
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
        <div id="box1" class="box" data-gss-id="12322"></div>
        <div id="box2" class="box" data-gss-id="34222"></div>
        """
      engine = GSS(container)
      listener = (e) ->        
        chai.expect(engine.lastWorkerCommands).to.eql [
            ['var', '$12322[x]', '$12322']
            ['var', '$34222[x]', '$34222']
            ['eq', ['get','$12322[x]','.box$12322'], ['number',100]]
            ['eq', ['get','$34222[x]','.box$34222'], ['number',100]]
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

  describe 'Asynchronous existentialism (one engine for life of container)', ->
    engine1 = null
    
    it 'without GSS rules style tag', ->
      engine1 = GSS(container)
      chai.expect(engine1.id).to.be.equal GSS.getId(container)
      chai.expect(engine1.container).to.be.equal container
    
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

describe 'CSS Dump /', ->  
  container = null
  
  before ->
    fixtures = document.getElementById 'fixtures'
    container = document.createElement 'div'
    fixtures.appendChild container

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