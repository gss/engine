Engine = require 'gss-engine/lib/Engine.js'

describe 'GSS engine', ->
  container = document.querySelector '#fixtures #engine'
  gss = new Engine '../browser/engine/worker/gss-solver.js', container
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
  describe 'with #button1[width] == #button2[width]', ->
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
    it 'should be able to solve', (done) ->
      gss.onSolved = (values) ->
        chai.expect(values).to.be.an 'object'
        chai.expect(values['#button1[width]']).to.equal values['#button2[width]']
        chai.expect(button1.getBoundingClientRect().width).to.equal values['#button1[width]']
        chai.expect(button2.getBoundingClientRect().width).to.equal values['#button2[width]']
        done()
      gss.run ast
