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

  describe 'measuring DOM text element width', ->
    span = container.querySelector '#span'
    it 'should be able to return the correct width', ->
      measured = get.measure span, 'width'
      chai.expect(measured).to.be.at.least 100
      chai.expect(measured).to.equal span.getBoundingClientRect().width

  describe 'measuring different dimensions of a box', ->
    span = container.querySelector '#box'
    # We test for the hardcoded style values of the element
    expected =
      top: 20
      left: -400
      width: 300
      height: 200
    it 'should be able to return the correct width', ->
      measured = get.measure span, 'width'
      chai.expect(measured).to.equal expected.width
      # Test the shorthand too
      measured = get.measure span, 'w'
      chai.expect(measured).to.equal expected.width
    it 'should be able to return the correct left', ->
      measured = get.measure span, 'left'
      chai.expect(measured).to.equal expected.left
      # Test the shorthand too
      measured = get.measure span, 'x'
      chai.expect(measured).to.equal expected.left
    it 'should be able to return the correct right', ->
      measured = get.measure span, 'right'
      chai.expect(measured).to.equal expected.left + expected.width
    it 'should be able to return the correct centerX', ->
      measured = get.measure span, 'centerX'
      chai.expect(measured).to.equal expected.left + expected.width / 2
    it 'should be able to return the correct height', ->
      measured = get.measure span, 'height'
      chai.expect(measured).to.equal expected.height
      # Test the shorthand too
      measured = get.measure span, 'h'
      chai.expect(measured).to.equal expected.height
    it 'should be able to return the correct top', ->
      measured = get.measure span, 'top'
      chai.expect(measured).to.equal expected.top
      # Test the shorthand too
      measured = get.measure span, 'y'
      chai.expect(measured).to.equal expected.top
    it 'should be able to return the correct bottom', ->
      measured = get.measure span, 'bottom'
      chai.expect(measured).to.equal expected.top + expected.height
    it 'should be able to return the correct centerY', ->
      measured = get.measure span, 'centerY'
      chai.expect(measured).to.equal expected.top + expected.height / 2

  describe 'getting position from positioned element with inherited offsets', ->
    div = container.querySelector '#childPos'
    expected =
      top: 50
      left: -400
    it 'should be able to return the correct left', ->
      measured = get.measure div, 'left'
      chai.expect(measured).to.equal expected.left
      # Test the shorthand too
      measured = get.measure div, 'x'
      chai.expect(measured).to.equal expected.left
    it 'should be able to return the correct top', ->
      measured = get.measure div, 'top'
      chai.expect(measured).to.equal expected.top
      # Test the shorthand too
      measured = get.measure div, 'y'
      chai.expect(measured).to.equal expected.top
  describe 'getting position from element with inherited offsets', ->
    div = container.querySelector '#childNoPos'
    expected =
      top: 40
      left: -500
    it 'should be able to return the correct left', ->
      measured = get.measure div, 'left'
      chai.expect(measured).to.equal expected.left
      # Test the shorthand too
      measured = get.measure div, 'x'
      chai.expect(measured).to.equal expected.left
    it 'should be able to return the correct top', ->
      measured = get.measure div, 'top'
      chai.expect(measured).to.equal expected.top
      # Test the shorthand too
      measured = get.measure div, 'y'
      chai.expect(measured).to.equal expected.top
