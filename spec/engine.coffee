Engine = require 'gss-engine/lib/Engine.js'

describe 'GSS engine', ->
  container = document.querySelector '#fixtures #engine'
  gss = new Engine '../browser/gss-engine/worker/gss-solver.js', container
  after (done) ->
    gss.stop()
    done()

  describe 'when initialized', ->
    it 'should be bound to the DOM container', ->
      chai.expect(gss.container).to.eql container
    it 'should not hold variables', ->
      chai.expect(gss.variables).to.be.an 'object'
      chai.expect(gss.variables).to.be.empty
    it 'should not hold elements', ->
      chai.expect(gss.elements).to.be.an 'object'
      chai.expect(gss.elements).to.be.empty
    it 'should not hold a worker', ->
      chai.expect(gss.worker).to.be.a 'null'
    it 'should pass the container to its DOM getter', ->
      chai.expect(gss.getter).to.be.an 'object'
      chai.expect(gss.getter.container).to.eql gss.container
    it 'should pass the container to its DOM setter', ->
      chai.expect(gss.setter).to.be.an 'object'
      chai.expect(gss.setter.container).to.eql gss.container
  describe 'with rule #button1[width] == #button2[width]', ->
    ast =
      selectors: [
        '#button1'
        '#button2'
      ]
      vars: [
        ['get', '#button1[width]', 'width', ['$id', '#button1']]
        ['get', '#button2[width]', 'width', ['$id', '#button2']]
      ]
      constraints: [
        ['eq', ['get', '#button1[width]'], ['get', '#button2[width]']]
      ]
    button1 = container.querySelector '#button1'
    button2 = container.querySelector '#button2'
    it 'before solving the second button should be wider', ->
      chai.expect(button2.getBoundingClientRect().width).to.be.above button1.getBoundingClientRect().width
    it 'after solving the buttons should be of equal width', (done) ->
      gss.onSolved = (values) ->
        chai.expect(values).to.be.an 'object'
        chai.expect(values['#button1[width]']).to.equal values['#button2[width]']
        chai.expect(button1.getBoundingClientRect().width).to.equal values['#button1[width]']
        chai.expect(button2.getBoundingClientRect().width).to.equal values['#button2[width]']
        done()
      gss.onError = (error) ->
        chai.assert("#{event.message} (#{event.filename}:#{event.lineno})").to.equal ''
        gss.onError = null
        done()
      gss.run ast
  describe 'with rule #button3[width] == #button4[height]', ->
    ast =
      selectors: [
        '#button3'
        '#button4'
      ]
      vars: [
        ['get', '#button3[width]', 'width', ['$id', '#button3']]
        ['get', '#button4[height]', 'height', ['$id', '#button4']]
      ]
      constraints: [
        ['eq', ['get', '#button3[width]'], ['get', '#button4[height]']]
      ]
    button3 = container.querySelector '#button3'
    button4 = container.querySelector '#button4'
    it 'before solving the buttons should be of equal height', ->
      chai.expect(button3.getBoundingClientRect().height).to.equal button4.getBoundingClientRect().height
    it 'after solving the second button should be taller', (done) ->
      gss.onSolved = (values) ->
        chai.expect(values).to.be.an 'object'
        chai.expect(values['#button3[width]']).to.equal values['#button4[height]']
        chai.expect(button3.getBoundingClientRect().width).to.equal values['#button3[width]']
        chai.expect(button4.getBoundingClientRect().height).to.equal values['#button4[height]']
        chai.expect(button4.getBoundingClientRect().height).to.be.above button3.getBoundingClientRect().height
        done()
      gss.onError = (error) ->
        chai.assert("#{event.message} (#{event.filename}:#{event.lineno})").to.equal ''
        gss.onError = null
        done()
      gss.run ast
