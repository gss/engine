assert = chai.assert
expect = chai.expect

remove = (el) ->
  el?.parentNode?.removeChild(el)

describe "GSS.View", ->
  
  engine = null
  container = null
  
  beforeEach ->
    container = document.createElement 'div'
    engine = new GSS(container)
    document.getElementById('fixtures').appendChild container
    
  afterEach ->
    remove(container)
    engine.destroy()
  
  describe 'Display Pass percolates downward through unconstrained views', ->
                   
    it 'before & after', (done) ->
      onSolved = (e) ->
        values = e.detail.values
        assert target1.style['width'] is "88px","width should be 88px"
        assert target2.style['width'] is "88px","width should be 88px"
        container.removeEventListener 'solved', onSolved
        done()
      container.addEventListener 'solved', onSolved
      engine.solve [
          ['==', ['get',['.', 'target'],   'width'], 88]
        ]

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
      target1 = engine.class('target')[0]
      target2 = engine.class('target')[1]
      assert target1.style['width'] is "10px"
      assert target2.style['width'] is "10px"
  
  describe 'Display passes down translated offsets', ->    
    
    it 'matrix3d & view:attach event', (done) ->
      container.innerHTML = """
        <div id="target1" class="target">
          <div id="target2" class="target">
          </div>
        </div>  
      """          
      ast = [
          ['==', ['get',['.','target'],'y'], 100]
        ]        

      q = document.getElementsByClassName('target')
      target1 = q[0]
      target2 = q[1]
      
      onSolved = (values) ->
        assert values['$target1[y]'] is 100, "solved value is 100. #{}"
        assert values['$target2[y]'] is 100, "solved value is 0. #{}"   
        assert target1.style.top == '100px'             
        assert target2.style.top == '0px'
        done()
      engine.once 'solved', onSolved
      engine.solve ast
  
  describe 'Elements can be positioned relative to', ->
    it 'after solving', (done) ->
      container.style.position = 'relative'

      ast = ['==', 
              ['get',
                ['#', 'floater'],
                'y'], 
              ['+', 
                ['get',
                  ['#', 'anchor'],
                  'intrinsic-y'], 
                3]]        
      
        
      engine.once 'solved', ->
        expect(engine.values['$floater[y]']).to.eql 20
        engine.id('pusher').setAttribute('style', 'padding-top: 11px; height: 17px;') 

        engine.once 'solved', ->  
          expect(engine.values['$floater[y]']).to.eql 31        
          done()
      engine.solve ast
      container.innerHTML = """
        <div id="pusher" style="height: 17px"></div>
        <div id="anchor" style="height: 10px"></div>
        <div id="floater"></div>
      """


  describe 'Display Pass takes in account parent offsets when requested', ->
              
    it 'after solving', (done) ->   
        
      engine.solve [
          ['==', ['get',['.', 'target'],'y'], 100]
        ]
      
      
      container.innerHTML = """
        <div style="border: 1px solid black;top:1px; position:absolute;">
          <div style="border: 1px solid black;top:1px; position:absolute;">
            <div style="border: 1px solid black;top:1px; position:absolute;">
              <div style="border: 1px solid black;top:1px; position:absolute;">
                <div id="target1" class="target">
                </div>
              </div>
            </div>
          </div>
        </div>        
      """  

      q = document.getElementsByClassName('target')
      target1 = q[0]      
      
      onSolved = (e) ->
        assert engine.values['$target1[y]'] is 100, "solved value is 100."
        assert target1.offsetTop == 92, "Top offset should match"        
        assert target1.offsetLeft == 0, "Left offset should match"                
        done()
      
      engine.once 'solved', onSolved



  describe 'Should warn when width or height are negative', ->
              
    it 'after solving', (done) ->   
        
      engine.solve [
          ['==', ['get',['.', 'target'],'height'], -100]
        ]
      
      
      container.innerHTML = """
        <div id="target1" class="target">
        </div>      
      """  

      warn = engine.console.warn
      called = false
      engine.console.warn = ->
        called = true

      onSolved = (e) ->
        engine.console.warn = warn
        expect(called).to.eql(true)
        done()
      
      engine.once 'solved', onSolved
      

      