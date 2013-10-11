Engine = require 'gss-engine/lib/Engine.js'

describe 'GSS engine', ->
  container = null
  engine = null

  before ->
    fixtures = document.getElementById 'fixtures'
    container = document.createElement 'div'
    fixtures.appendChild container
    container.innerHTML = """
      <button id="button1">One</button>
      <button id="button2">Second</button>
      <button id="button3">Three</button>
      <button id="button4">4</button>
    """
    engine = new Engine '../browser/gss-engine/worker/gss-solver.js', container

  after (done) ->
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
      button1 = container.querySelector '#button1'
      button2 = container.querySelector '#button2'
      chai.expect(button2.getBoundingClientRect().width).to.be.above button1.getBoundingClientRect().width
    it 'after solving the buttons should be of equal width', (done) ->
      container.addEventListener "solved", (e) ->
        values = e.detail.values
        chai.expect(values).to.be.an 'object'
        chai.expect(Math.round(button1.getBoundingClientRect().width)).to.equal 100
        chai.expect(Math.round(button2.getBoundingClientRect().width)).to.equal 100
        done()
      engine.onError = (error) ->
        chai.assert("#{event.message} (#{event.filename}:#{event.lineno})").to.equal ''
        engine.onError = null
        done()
      engine.run ast
  
