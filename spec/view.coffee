assert = chai.assert
expect = chai.expect


$  = () ->
  return document.querySelector arguments...
  
$$ = () -> 
  return document.querySelectorAll arguments...

remove = (el) ->
  el?.parentNode?.removeChild(el)

describe "GSS.View", ->
  
  engine = null
  container = null
  
  beforeEach ->
    engine = GSS.engines.root
    #engine = GSS({scope:container})
    container = document.createElement 'div'
    $('#fixtures').appendChild container
    
  afterEach ->
    remove(container)
    engine.clean()
  
  describe 'Display Pass percolates downward through unconstrained views', ->
                   
    it 'before & after', ->
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
      q = document.getElementsByClassName('target')
      target1 = q[0]
      target2 = q[1]
      assert target1.style['width'] is "10px"
      assert target2.style['width'] is "10px"
      ast =
        selectors: [
          '#text'
        ]
        commands: [
          ['eq', ['get$','width',['$class', 'target']], ['number',88]]
        ]
      onSolved = (e) ->
        values = e.detail.values
        assert target1.style['width'] is "88px","width should be 88px"
        assert target2.style['width'] is "88px","width should be 88px"
        container.removeEventListener 'solved', onSolved
        done()
      container.addEventListener 'solved', onSolved
      engine.run ast
  
  describe 'Display passes down translated offsets, matrix3d & view:attach event', ->    
    
    it 'matrix3d & view:attach event', (done) ->
      container.innerHTML = """
        <div id="target1" class="target">
          <div id="target2" class="target">
          </div>
        </div>  
      """          
      ast =
        selectors: [
          '#text'
        ]
        commands: [
          ['eq', ['get$','y',['$class','target']], ['number', '100']]
        ]        

      q = document.getElementsByClassName('target')
      target1 = q[0]
      target2 = q[1]
      
      GSS.config.defaultMatrixType = 'mat4'
      didAttach = false
      
      onSolved = (values) ->
        values = engine.vars
        assert values['$target1[y]'] is 100, "solved value is 100. #{}"
        assert values['$target2[y]'] is 100, "solved value is 100. #{}"                
        m1 = "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 100, 0, 1)"
        m2 = "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)"
        assert target1.style[GSS._.transformPrefix] is m1,"target1.style[#{GSS._.transformPrefix}] should be 100px, not: #{target1.style[GSS._.transformPrefix]}"        
        assert target2.style[GSS._.transformPrefix] is m2,"target2.style[#{GSS._.transformPrefix}] should be 0px, not: #{target2.style[GSS._.transformPrefix]}"        
        assert didAttach, "didnt attach"
        done()
      onViewAttached = (v) ->
        assert v.id is 'target1' or v.id is 'target2', 'attach to right views'
        didAttach = true
      GSS.once 'view:attach', onViewAttached      
      engine.once 'solved', onSolved
      engine.run ast
  
  describe 'Display Pass takes in account parent offsets when requested', ->
              
    it 'after solving', (done) ->
      
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

      ast =
        selectors: [
          '#text'
        ]
        commands: [
          ['eq', ['get$','y',['$class', 'target']], ['number', '100']]
        ]        
      
      q = document.getElementsByClassName('target')
      target1 = q[0]      
      
      GSS.config.defaultMatrixType = 'mat2d'
      
      onSolved = (e) ->
        values = engine.vars
        assert values['$target1[y]'] is 100, "solved value is 100. #{}"
        m = "matrix(1, 0, 0, 1, 0, 92)"
        assert target1.style[GSS._.transformPrefix] is m,"wrong: #{target1.style[GSS._.transformPrefix]}"                
        done()
        
      engine.once 'solved', onSolved
      engine.run ast
      
  describe 'printCss', ->
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
      

      