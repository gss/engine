Getter = new GSS.Getter() #require 'gss-engine/lib/dom/Getter.js'

describe 'DOM Getter', ->
  container = null
  get = null

  before ->
    fixtures = document.getElementById 'fixtures'
    container = document.createElement 'div'
    get = new GSS.Getter container
    fixtures.appendChild container
    container.innerHTML = """
      <span class="span" id="span">Hello, world</span>
      <div id="box" style="width: 300px; height: 200px; position: absolute; top: 20px; left: -400px;"></div>
      <div style="position: absolute; top: 40px; left: -500px">
        <div id="childPos" style="position: absolute; top: 10px; left: 100px;"></div>
        <div id="childNoPos"></div>
      </div>
    """
    #get = new Getter container

  describe 'reading DOM', ->
    span = null
    it 'should return elements by ID', ->
      span = container.querySelector '#span'
      result = get.get ['$id', 'span'], container
      chai.expect(result).to.eql span
    it 'should return elements by class', ->
      result = get.get ['$class', 'span'], container
      chai.expect(result[0]).to.eql span
    it 'should return elements by tag', ->
      result = get.get ['$tag', 'span'], container
      chai.expect(result[0]).to.eql span
    it 'should return elements by selector', ->
      result = get.get ['$', '.span'], container
      chai.expect(result[0]).to.eql span

  describe 'measuring DOM text element width', ->
    span = null
    it 'should be able to return the correct width', ->
      span = container.querySelector '#span'
      measured = get.measure span, 'width'
      chai.expect(measured).to.be.at.least 60 # ~80
      chai.expect(measured).to.equal span.getBoundingClientRect().width

  describe 'measuring different dimensions of a box', ->
    span = null
    # We test for the hardcoded style values of the element
    expected =
      top: 20
      left: -400
      width: 300
      height: 200
    it 'should be able to return the correct width', ->
      span = container.querySelector '#box'
      measured = get.measure span, 'width'
      chai.expect(measured).to.equal expected.width
      # Test the shorthand too
      measured = get.measure span, 'w'
      chai.expect(measured).to.equal expected.width
    it 'should be able to return the correct left', ->
      measured = Math.ceil get.measure span, 'left'
      chai.expect(measured).to.equal expected.left
      # Test the shorthand too
      measured = Math.ceil get.measure span, 'x'
      chai.expect(measured).to.equal expected.left
    it 'should be able to return the correct right', ->
      measured = Math.ceil get.measure span, 'right'
      chai.expect(measured).to.equal expected.left + expected.width
    it 'should be able to return the correct centerX', ->
      measured = Math.ceil get.measure span, 'centerX'
      chai.expect(measured).to.equal expected.left + expected.width / 2
    it 'should be able to return the correct height', ->
      measured = Math.floor get.measure span, 'height'
      chai.expect(measured).to.equal expected.height
      # Test the shorthand too
      measured = Math.floor get.measure span, 'h'
      chai.expect(measured).to.equal expected.height
    it 'should be able to return the correct top', ->
      measured = get.measure span, 'top'
      chai.expect(measured).to.equal expected.top
      # Test the shorthand too
      measured = get.measure span, 'y'
      chai.expect(measured).to.equal expected.top
    it 'should be able to return the correct bottom', ->
      measured = Math.floor get.measure span, 'bottom'
      chai.expect(measured).to.equal expected.top + expected.height
    it 'should be able to return the correct centerY', ->
      measured = Math.floor get.measure span, 'centerY'
      chai.expect(measured).to.equal expected.top + expected.height / 2

  describe 'getting position from positioned element with inherited offsets', ->
    div = null
    expected =
      top: 50
      left: -400
    it 'should be able to return the correct left', ->
      div = container.querySelector '#childPos'
      measured = Math.ceil get.measure div, 'left'
      chai.expect(measured).to.equal expected.left
      # Test the shorthand too
      measured = Math.ceil get.measure div, 'x'
      chai.expect(measured).to.equal expected.left
    it 'should be able to return the correct top', ->
      measured = Math.floor get.measure div, 'top'
      chai.expect(measured).to.equal expected.top
      # Test the shorthand too
      measured = Math.floor get.measure div, 'y'
      chai.expect(measured).to.equal expected.top
  describe 'getting position from element with inherited offsets', ->
    div = null
    expected =
      top: 40
      left: -500
    it 'should be able to return the correct left', ->
      div = container.querySelector '#childNoPos'
      measured = Math.ceil get.measure div, 'left'
      chai.expect(measured).to.equal expected.left
      # Test the shorthand too
      measured = Math.ceil get.measure div, 'x'
      chai.expect(measured).to.equal expected.left
    it 'should be able to return the correct top', ->
      measured = Math.floor get.measure div, 'top'
      chai.expect(measured).to.equal expected.top
      # Test the shorthand too
      measured = Math.floor get.measure div, 'y'
      chai.expect(measured).to.equal expected.top
