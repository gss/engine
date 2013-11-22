assert = chai.assert
expect = chai.expect

remove = (el) ->
  el?.parentNode?.removeChild(el)

describe "GSS.View", ->
  
  describe 'Display Pass percolates downward through unconstrained views', ->
    
    engine = null
    container = null
    target1 = null
    target2 = null
  
    before ->
      fixtures = document.getElementById 'fixtures'
      container = document.createElement 'div'
      fixtures.appendChild container
      engine = GSS({scope:container})
      container.innerHTML = """
        <div>
          <div>
            <div style="width:10px;" class="target">
              <div>
                <div>
                  <div style="width:10px;" class="target">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>        
      """
      
    after (done) ->
      remove(container)
      # have to manually destroy, otherwise there is some clash!
      engine.destroy()
      done()

    ast =
      selectors: [
        '#text'
      ]
      commands: [
        ['var', '.target[width]', 'width', ['$class', 'target']]
        ['eq', ['get', '.target[width]'], ['number', '88']]
      ]        
    it 'before solving', ->
      q = document.getElementsByClassName('target')
      target1 = q[0]
      target2 = q[1]
      assert target1.style['width'] is "10px"
      assert target2.style['width'] is "10px"
    it 'after solving', (done) ->
      onSolved = (e) ->
        values = e.detail.values
        assert target1.style['width'] is "88px","width should be 88px"
        assert target2.style['width'] is "88px","width should be 88px"
        container.removeEventListener 'solved', onSolved
        done()
      container.addEventListener 'solved', onSolved
      engine.run ast
  
  describe 'Display Pass passes down tranlated offsets', ->
    
    engine = null
    container = null
    target1 = null
    target2 = null
  
    before ->
      fixtures = document.getElementById 'fixtures'
      container = document.createElement 'div'
      fixtures.appendChild container
      engine = GSS({scope:container})
      container.innerHTML = """
              <div id="target1" class="target">
                <div id="target2" class="target">
                </div>
              </div>      
      """
      
    after (done) ->
      remove(container)
      # have to manually destroy, otherwise there is some clash!
      engine.destroy()
      done()

    ast =
      selectors: [
        '#text'
      ]
      commands: [
        ['var', '.target[y]', 'y', ['$class', 'target']]
        ['eq', ['get', '.target[y]'], ['number', '100']]
      ]        
    it 'before solving', ->
      q = document.getElementsByClassName('target')
      target1 = q[0]
      target2 = q[1]
    it 'after solving', (done) ->
      onSolved = (e) ->
        values = e.detail.values
        assert e.detail.values['$target1[y]'] is 100, "solved value is 100. #{}"
        assert e.detail.values['$target2[y]'] is 100, "solved value is 100. #{}"
        assert target1.style[GSS.View.transformPrefix] is "translateY(100px)","target1.style[#{GSS.View.transformPrefix}] should be 100px, not: #{target1.style[GSS.View.transformPrefix]}"        
        assert target2.style[GSS.View.transformPrefix] is "translateY(0px)","target2.style[#{GSS.View.transformPrefix}] should be 0px, not: #{target2.style[GSS.View.transformPrefix]}"        
        container.removeEventListener 'solved', onSolved
        done()
      container.addEventListener 'solved', onSolved
      engine.run ast
  
  describe 'Display Pass takes in account parent offsets when requested', ->
    
    engine = null
    container = null
    target1 = null
  
    before ->
      fixtures = document.getElementById 'fixtures'
      container = document.createElement 'div'
      fixtures.appendChild container
      engine = GSS({scope:container})
      container.innerHTML = """
        <div style="border-top: 1px solid black;top:1px; position:absolute;">
          <div style="border-top: 1px solid black;top:1px; position:absolute;">
            <div style="border-top: 1px solid black;top:1px; position:absolute;">
              <div style="border-top: 1px solid black;top:1px; position:absolute;">
                <div id="target1" class="target" gss-parent-offsets>
                </div>
              </div>
            </div>
          </div>
        </div>        
      """
      
    after (done) ->
      remove(container)
      # have to manually destroy, otherwise there is some clash!
      engine.destroy()
      done()

    ast =
      selectors: [
        '#text'
      ]
      commands: [
        ['var', '.target[y]', 'y', ['$class', 'target']]
        ['eq', ['get', '.target[y]'], ['number', '100']]
      ]        
    it 'before solving', ->
      q = document.getElementsByClassName('target')
      target1 = q[0]
    it 'after solving', (done) ->
      onSolved = (e) ->
        values = e.detail.values
        assert e.detail.values['$target1[y]'] is 100, "solved value is 100. #{}"
        assert target1.style[GSS.View.transformPrefix] is "translateY(92px)","wrong: #{target1.style[GSS.View.transformPrefix]}"        
        container.removeEventListener 'solved', onSolved
        done()
      container.addEventListener 'solved', onSolved
      engine.run ast