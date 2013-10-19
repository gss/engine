Engine = require 'gss-engine/lib/Engine.js'

describe 'GSS engine', ->
  container = null
  engine = null
  
  before ->
    fixtures = document.getElementById 'fixtures'
    container = document.createElement 'div'
    fixtures.appendChild container
  
  beforeEach ->
    engine = new Engine 
      workerPath: '../browser/gss-engine/worker/gss-solver.js'
      container: container

  afterEach (done) ->
    engine.stop()
    done()

  describe 'when initialized', ->
    it 'should be bound to the DOM container', ->
      chai.expect(engine.container).to.eql container
    it 'should not hold a worker', ->
      chai.expect(engine.worker).to.be.a 'null'
    it 'should pass the container to its DOM getter', ->
      chai.expect(engine.getter).to.be.an 'object'
      chai.expect(engine.getter.container).to.eql engine.container
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
  
  describe 'Engine.vars', ->
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
      
  
