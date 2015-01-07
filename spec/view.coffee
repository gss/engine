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
      
  xdescribe 'printCss', ->
    it 'prints css', (done) ->
      container.innerHTML = """
      <style type="text/gss">
        .target[y] == 100;
        .target[margin-right] == 55;
        .target {
          height: 33px;
          height: == ::[intrinsic-height];
        }
      </style>
      <div id="ignore1">
        <div id="target1" class="target">
          <div id="ignore2"> 
            <div id="target2" class="target">
            </div>
          </div>
        </div>  
      </div>
      """                        

      q = document.getElementsByClassName('target')
      target1 = q[0]
      target2 = q[1]
      
      GSS.config.defaultMatrixType = 'mat4'
      didAttach = false
      
      engine.once 'display', (values) ->
        css1 = target1.gssView.printCss()
        css2 = target2.gssView.printCss()
        cssRoot = GSS.printCss()
        m1 = "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 100, 0, 1)"
        m2 = "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)"        
        expectedCss1 = "#target1{position:absolute;margin:0px;top:0px;left:0px;#{GSS._.dasherize(GSS._.transformPrefix)}:#{m1};margin-right:55px;}"
        expectedCss2 = "#target2{position:absolute;margin:0px;top:0px;left:0px;#{GSS._.dasherize(GSS._.transformPrefix)}:#{m2};margin-right:55px;}"
        assert css1 is expectedCss1,"wrong css1 #{css1}"
        assert css2 is expectedCss2,"wrong css2 #{css2}"
        assert( cssRoot is (expectedCss1 + expectedCss2), "wrong cssRoot, #{cssRoot}")
        
        done()
      

      