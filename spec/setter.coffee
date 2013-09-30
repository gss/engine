Setter = require 'gss-engine/lib/dom/Setter.js'

describe 'DOM Setter', ->
  container = null
  set = null
  before ->
    fixtures = document.getElementById 'fixtures'
    container = document.createElement 'div'
    fixtures.appendChild container
    container.innerHTML = """
      <button id="sizedButton">Button</button>
      <button id="posButton">Button</button>
      <div style="position: absolute; top: 40px; left: -500px">
        <button id="childPosButton">Button</button>
      </div>
    """
    set = new Setter container
  it 'should be bound to the DOM container', ->
    chai.expect(set.container).to.eql container

  describe 'setting a button size', ->
    button = null
    it 'should be able to set the width', ->
      button = container.querySelector '#sizedButton'
      set.set button, 'width', 200
      chai.expect(Math.floor(button.getBoundingClientRect().width)).to.equal 200
      # Test the shorthand too
      set.set button, 'w', 100
      chai.expect(Math.floor(button.getBoundingClientRect().width)).to.equal 100
    it 'should be able to set the height', ->
      set.set button, 'height', 200
      chai.expect(Math.floor(button.getBoundingClientRect().height)).to.equal 200
      # Test the shorthand too
      set.set button, 'h', 50
      chai.expect(Math.floor(button.getBoundingClientRect().height)).to.equal 50

  describe 'positioning a button', ->
    button = null
    it 'should be able to set the left', ->
      button = container.querySelector '#posButton'
      set.set button, 'left', -300
      chai.expect(Math.ceil(button.getBoundingClientRect().left)).to.equal -300
      # Test the shorthand too
      set.set button, 'x', -400
      chai.expect(Math.ceil(button.getBoundingClientRect().left)).to.equal -400
    it 'should be able to set the top', ->
      set.set button, 'top', 50
      chai.expect(Math.floor(button.getBoundingClientRect().top)).to.equal 50
      # Test the shorthand too
      set.set button, 'y', 100
      chai.expect(Math.floor(button.getBoundingClientRect().top)).to.equal 100

  describe 'positioning a button with inherited offsets', ->
    button = null
    it 'should be able to set the left', ->
      button = container.querySelector '#childPosButton'
      set.set button, 'left', -300
      # Offset relative to positioning parent
      chai.expect(button.offsetLeft).to.equal 200
      # Offset relative to document
      chai.expect(Math.floor(button.getBoundingClientRect().left)).to.equal -300
    it 'should be able to set the top', ->
      set.set button, 'top', 50
      # Offset relative to positioning parent
      chai.expect(button.offsetTop).to.equal 10
      # Offset relative to document
      chai.expect(Math.floor(button.getBoundingClientRect().top)).to.equal 50
