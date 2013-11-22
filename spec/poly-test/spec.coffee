describe "Polymer: poly-test", ->
  
  describe 'Constraining Custom Element Root', ->
    
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
        <poly-test style="width:10px">
          <poly-test style="width:10px"></poly-test>
        </poly-test>        
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
        ['var', 'poly-test[width]', 'width', ['$tag', 'poly-test']]
        ['eq', ['get', 'poly-test[width]'], ['number', 88]]
      ]        
    it 'before solving', ->
      q = document.getElementsByTagName('poly-test')
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
  
  describe 'Constraining Element & its LightDOM ', ->
    
    engine = null
    container = null
    target1 = null
    target2 = null
    target3 = null
    target4 = null
  
    before ->
      fixtures = document.getElementById 'fixtures'
      container = document.createElement 'div'
      fixtures.appendChild container
      engine = GSS({scope:container})
      container.innerHTML = """
        <poly-test>
          <poly-test></poly-test>
        </poly-test>
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
        ['var', '.poly-test-child[width]', 'width', ['$tag', '.poly-test-child']]
        ['eq', ['get', '.poly-test-child[width]'], ['number', 88]]
      ]        
    it 'before solving', (done)->
      tag = document.querySelector('poly-test')
      
      # polymer elements take a long time to actually be ready for constraining
      whenReady = () ->
        setTimeout ->          
            q = document.getElementsByClassName('poly-test-child')
            target1 = q[0]
            target2 = q[1]
            target3 = q[2]
            target4 = q[3]
            assert !!target1, "target1"
            assert !!target2, "target2"
            assert !!target3, "target3"
            assert !!target4, "target4"
            done()
          , 100
        tag.removeEventListener "bangbang", whenReady        
      
      tag.addEventListener "bangbang", whenReady      

    it 'after solving', (done) ->
      onSolved = (e) ->
        values = e.detail.values
        assert target1.style['width'] is "88px","width should be 88px"
        assert target2.style['width'] is "88px","width should be 88px"
        assert target3.style['width'] is "88px","width should be 88px"
        assert target4.style['width'] is "88px","width should be 88px"
        container.removeEventListener 'solved', onSolved
        done()
      container.addEventListener 'solved', onSolved
      engine.run ast