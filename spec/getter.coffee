Getter = require 'gss-engine/lib/dom/Getter.js'

describe 'DOM Getter', ->
  container = document.querySelector '#fixtures #getter'
  get = new Getter container
  it 'should be bound to the DOM container', ->
    chai.expect(get.container).to.eql container

  describe 'reading DOM', ->
    span = container.querySelector '#span'
    it 'should return elements by ID', ->
      result = get.get ['$id', 'span']
      chai.expect(result).to.eql span
    it 'should return elements by class', ->
      result = get.get ['$class', 'span']
      chai.expect(result[0]).to.eql span
    it 'should return elements by tag', ->
      result = get.get ['$tag', 'span']
      chai.expect(result[0]).to.eql span
    it 'should return elements by selector', ->
      result = get.get ['$', '.span']
      chai.expect(result[0]).to.eql span

  describe 'measuring DOM', ->
    span = container.querySelector '#span'
    it 'should be able to return the correct width', ->
      measured = get.measure span, 'width'
      chai.expect(measured).to.be.at.least 100
      chai.expect(measured).to.equal span.getBoundingClientRect().width
