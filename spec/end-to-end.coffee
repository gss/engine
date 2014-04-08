assert = chai.assert
expect = chai.expect

stringify = (o) ->
  return JSON.stringify o, 1, 1

$  = () ->
  return document.querySelector arguments...
  
$$ = () -> 
  return document.querySelectorAll arguments...

remove = (el) ->
  el?.parentNode?.removeChild(el)



describe 'End - to - End', ->
  
  engine = null
  container = null
  
  beforeEach ->
    engine = GSS.engines.root
    container = document.createElement 'div'
    $('#fixtures').appendChild container
    

  afterEach ->
    remove(container)
    
  
  # Config
  # ===========================================================
  
  describe 'config', ->
  
    describe 'defaultStrength: strong', ->
    
      it 'should compute', (done) ->
        oldDefault = GSS.config.defaultStrength
        GSS.config.defaultStrength = "strong"
      
        listen = (e) ->     
          expect(engine.vars).to.eql 
            "[m]": 2
          GSS.config.defaultStrength = oldDefault
          done()     
                     
        engine.once 'solved', listen
    
        container.innerHTML =  """
            <style type="text/gss">
            [m] == 1;
            [m] == 2;
            [m] == 3;
            </style>
          """
          
    describe 'fractionalPixels: false', ->
    
      it 'should compute', (done) ->
        old = GSS.config.fractionalPixels
        GSS.config.fractionalPixels = false
      
        listen = (e) -> 
          el = document.getElementById("nofractional")
          expect(el.style.height).to.equal "10px"
          GSS.config.fractionalPixels = true
          done()     
                     
        engine.once 'solved', listen
    
        container.innerHTML =  """
            <div id="nofractional"></div>
            <style type="text/gss">
              #nofractional[x] == 99.999999999999;
              #nofractional[height] == 9.999999999999;
            </style>
          """
  
  
  # Vanilla CSS + CCSS
  # ===========================================================
  
  describe 'Vanilla CSS', ->  
    
    describe 'just CSS', ->
      engine = null
    
      it 'should dump', (done) ->
        engine = GSS(container)
        container.innerHTML =  """
          <style type="text/gss" scoped>
            #css-only-dump {
              height: 100px;
            }
          </style>
          """
        listener = (e) ->
          expect(engine.cssDump).to.equal document.getElementById("gss-css-dump-" + engine.id)
          expect(engine.cssDump.innerHTML).to.equal "#css-only-dump{height:100px;}"
          done()
        engine.once 'solved', listener    
    
    describe 'CSS + CCSS', ->
      engine = null
    
      it 'should dump', (done) ->
        engine = GSS(container)
        container.innerHTML =  """
          <div id="css-simple-dump"></div>
          <style type="text/gss" scoped>
            #css-simple-dump {
              width: == 100;
              height: 100px;
            }
          </style>
          """
        listener = (e) ->           
          expect(engine.cssDump).to.equal document.getElementById("gss-css-dump-" + engine.id)
          expect(engine.cssDump.innerHTML).to.equal "#css-simple-dump{height:100px;}"
          done()
        engine.once 'solved', listener
    
    describe 'nested', ->
      engine = null
    
      it 'should dump', (done) ->
        engine = GSS(container)
        container.innerHTML =  """
          <style type="text/gss" scoped>
            .outer, .outie {
              #css-inner-dump-1 {
                width: == 100;
                height: 100px;
              }
              .innie-outie {
                #css-inner-dump-2 {
                  height: 200px;
                }
              }
            }
          </style>
          <style type="text/gss" scoped>
            [x] == 500;
          </style>
          """
        engine.once 'solved', ->           
          expect(engine.cssDump).to.equal document.getElementById("gss-css-dump-" + engine.id)
          expect(engine.cssDump.innerHTML).to.equal ".outer #css-inner-dump-1, .outie #css-inner-dump-1{height:100px;}.outer .innie-outie #css-inner-dump-2, .outie .innie-outie #css-inner-dump-2{height:200px;}"
          done()
  
  
  # CCSS
  # ===========================================================      
  
  describe "CCSS", ->
  
    describe 'expression chain', ->  
      it 'should compute values', (done) ->                                 
        container.innerHTML =  """
            <style type="text/gss">              
              [c] == 10 !require;
              0 <= [x] <= 500;
              500 == [y] == 500;
              
              0 <= [z] == [c] + [y] !strong100;
            </style>
          """
        engine.once 'solved', (e) ->     
          expect(engine.vars).to.eql 
            "[c]": 10
            "[x]": 0
            "[y]": 500
            "[z]": 510
          done()
          
    describe 'expression chain w/ queryBound connector', ->  
      it 'should be ok', (done) ->                                 
        container.innerHTML =  """
            <div id="billy"></div>
            <style type="text/gss">              
              [grid] == 36;
              0 <= #billy[x] == [grid];
            </style>
          """
        engine.once 'solved', (e) ->     
          expect(engine.vars).to.eql 
            "[grid]": 36
            "$billy[x]": 36
          done()
  
  
  
  # Window
  # ===========================================================      
  
  describe "::window", ->
  
    describe 'center values', ->  
      it 'should compute values', (done) ->
        engine.once 'solved', (e) ->     
          w = (window.innerWidth - GSS.get.scrollbarWidth())
          cx = w / 2
          h = (window.innerHeight)
          cy = h / 2
          expect(engine.vars).to.eql 
            "::window[width]": w
            "::window[center-x]": cx
            "[center-x]": cx
            "::window[height]": h
            "::window[center-y]": cy            
            "[center-y]": cy
          done()                             
        container.innerHTML =  """
            <style type="text/gss">              
              [center-x] == ::window[center-x];
              [center-y] == ::window[center-y];
            </style>
          """
    describe 'position values', ->  
      it 'should compute values', (done) ->
        engine.once 'solved', (e) ->     
          w = (window.innerWidth - GSS.get.scrollbarWidth())
          h = (window.innerHeight)
          expect(engine.vars).to.eql 
            "::window[y]": 0
            "[top]": 0
            "::window[width]": w
            "[right]": w
            "::window[height]": h
            "[bottom]": h
            "::window[x]": 0
            "[left]": 0
          done()                             
        container.innerHTML =  """
            <style type="text/gss">
              [top] == ::window[top];
              [right] == ::window[right];
              [bottom] == ::window[bottom];
              [left] == ::window[left];
            </style>
          """
  
  # .gss files
  # ===========================================================
  
  describe 'External .gss files', ->
    
    describe "basics", ->
    
      it 'should compute', (done) ->
        oldDefault = GSS.config.defaultStrength
        GSS.config.defaultStrength = "strong"
      
        listen = (e) ->     
          expect(engine.vars).to.eql 
            "[external-file]": 1000
          GSS.config.defaultStrength = oldDefault
          done()     
                     
        engine.once 'solved', listen
    
        container.innerHTML =  """
            <link rel="stylesheet" type="text/gss" href="./fixtures/external-file.gss"></link>
          """
  
  
  # Virtual Elements
  # ===========================================================
  
  describe 'Virtual Elements', ->  
    
    describe 'basic', ->
      engine = null
    
      it 'vars', (done) ->
        engine = GSS(container)
        container.innerHTML =  """
          <div id="ship"></div>
          <style type="text/gss" scoped>
            #ship {
              @virtual "mast";
              "mast"[top] == 0;
              "mast"[bottom] == 100;
              "mast"[left] == 10;
              "mast"[right] == 20;
            }
          </style>
          """
        engine.once 'solved', (e) ->
          expect(stringify(engine.vars)).to.equal stringify
            '$ship"mast"[y]': 0
            '$ship"mast"[height]': 100
            '$ship"mast"[x]': 10
            '$ship"mast"[width]': 10
          done()
  
  
  # VGL
  # ===========================================================
  
  describe 'VGL', ->  
    
    describe 'grid-template', ->
      engine = null
    
      it 'vars', (done) ->
        engine = GSS(container)
        container.innerHTML =  """
          <div id="layout"></div>
          <style type="text/gss" scoped>
            #layout {
              x: == 0;
              y: == 0;
              width: == 100;
              height: == 10;
              @grid-template a
                "12";
            }
          </style>
          """
        listener = (e) ->        
          target =           
            '$layout[x]': 0
            '$layout[y]': 0
            '$layout[width]': 100
            '$layout[height]': 10
            '$layout[a-md-width]': 50
            '$layout[a-md-height]': 10
            '$layout"a-1"[width]': 50
            '$layout"a-2"[width]': 50
            '$layout"a-1"[height]': 10
            '$layout"a-2"[height]': 10
            '$layout"a-1"[x]': 0
            '$layout"a-2"[x]': 50
            '$layout"a-1"[y]': 0
            '$layout"a-2"[y]': 0
          
          for key, val of target
            assert(engine.vars[key] is val, "#{engine.vars[key]} should be #{val}")
          done()
        engine.once 'solved', listener
    
    describe 'grid-rows & grid cols', ->
      engine = null
      target =
        '$item[x]': 55
        '$item[y]': 5
        '$item[width]': 45
        '$item[height]': 5
        
        '$layout[x]': 0
        '$layout[y]': 0
        '$layout[width]': 100
        '$layout[height]': 10
        
        '$layout"r1"[width]': 100
        '$layout"r1"[height]': 5
        '$layout"r1"[x]': 0
        '$layout"r1"[y]': 0
        
        '$layout"r2"[width]': 100
        '$layout"r2"[height]': 5
        '$layout"r2"[x]': 0
        '$layout"r2"[y]': 5
        
        '$layout"c1"[width]': 45
        '$layout"c1"[height]': 10
        '$layout"c1"[x]': 0
        '$layout"c1"[y]': 0

        '$layout"c2"[width]': 45
        '$layout"c2"[height]': 10
        '$layout"c2"[x]': 55
        '$layout"c2"[y]': 0
      
      describe 'flat', ->
        it ' vars', (done) ->
          engine = GSS(container)
          container.innerHTML =  """
            <div id="layout"></div>
            <div id="item"></div>
            <style type="text/gss" scoped>
              #layout {
                x: == 0;
                y: == 0;
                width: == 100;
                height: == 10;
                @grid-rows "r1 r2";
                @grid-cols "c1-c2" gap(10);
                @h |[#item]| in("c2");
                @v |[#item]| in("r2");
              }
            </style>
            """
          listener = (e) ->        
          
            for key, val of target
              assert engine.vars[key] is val, "#{key} is #{engine.vars[key]}"
            done()
          engine.once 'solved', listener
      
      describe 'cross-sheet', ->
        it ' vars', (done) ->
          engine = GSS(container)
          container.innerHTML =  """
            <div id="layout"></div>
            <div id="item"></div>
            
            <style type="text/gss" scoped>
              #layout {
                @h |[#item]| in("c2");
                @v |[#item]| in("r2");
              }
            </style>
            <style type="text/gss" scoped>
              #layout {
                x: == 0;
                y: == 0;
                width: == 100;
                height: == 10;
                @grid-rows "r1 r2";
                @grid-cols "c1-c2" gap(10);
              }
            </style>
            """
          listener = (e) ->        
          
            for key, val of target
              assert engine.vars[key] is val, "#{key} is #{engine.vars[key]}"
            done()
          engine.once 'solved', listener
      
      ###
      describe 'nested', ->
        it 'vars', (done) ->
          engine = GSS(container)
          container.innerHTML =  """
            <div id="layout"></div>
            <div id="item"></div>
            <style type="text/gss" scoped>
              #layout {
                x: == 0;
                y: == 0;
                width: == 100;
                height: == 10;
                @grid-rows "r1 r2";
                @grid-cols "c1-c2" gap(10);
                #item {
                  @h |[::]| in("c2");
                  @v |[::]| in("r2");
                }
              }
            </style>
            """
          listener = (e) ->        
            console.log engine.vars
            for key, val of target
              assert engine.vars[key] is val, "#{key} is #{engine.vars[key]}"
            done()
          engine.once 'solved', listener
      ###
      
  
  
  # @if @else
  # ===========================================================
  
  describe "@if @else", ->
  
    describe 'flat @if @else w/o queries', ->
  
      it 'should compute values', (done) ->
        listen = (e) ->     
          expect(engine.vars).to.eql 
            "[t]": 500
            "[x]": 1
          done()     
                     
        engine.once 'solved', listen
    
        container.innerHTML =  """
            <style type="text/gss">
            [t] == 500;
        
            @if [t] >= 960 {          
              [x] == 96;
            }

            @else {  
              [x] == 1;  
            }
            </style>
          """
  
    describe 'top level @if @else w/ queries', ->
  
      it 'should compute values', (done) ->
        listen = (e) ->     
          expect(engine.vars).to.eql 
            "[t]": 500
            "$b[width]": 1
          done()          
          engine.off 'solved', listen                    
    
        container.innerHTML =  """
            <div id="b"></div>
            <style type="text/gss">
            [t] == 500;
        
            @if [t] >= 960 {
          
              #b {
                width: == 100;
              }

            }

            @else {
  
              #b {
                width: == 1;
              }
  
            }
            </style>
          """
        engine.once 'solved', listen
  

    describe 'contextual @if @else', ->
  
      it 'should compute values', (done) ->
        listen = (e) ->     
          expect(engine.vars).to.eql 
            "$box1[width]": 9
            "$box2[width]": 19
            "$box1[height]": 10
            "$box2[height]": 20
          done()          
    
        container.innerHTML =  """
            <div id="box1" class="box"></div>
            <div id="box2" class="box"></div>
            <style type="text/gss">
          
            #box1[width] == 9;
            #box2[width] == 19;
          
            .box {
              @if ::[width] < 10 {
                height: == 10;
              }
              @else {
                height: == 20;
              }
            }
          
            </style>
          """
        engine.once 'solved', listen
    
    ###
    describe 'TODO!!!! contextual @if @else with vanilla CSS', ->
  
      it 'should compute values', (done) ->
        listen = (e) ->     
          expect(engine.vars).to.eql 
            "$box1[width]": 9
            "$box2[width]": 19
          expect(engine.cssDump).to.equal document.getElementById("gss-css-dump-" + engine.id)
          # TODO
          expect(engine.cssDump.innerHTML).to.equal ""
          done()          
    
        container.innerHTML =  """
            <div id="box1" class="box"></div>
            <div id="box2" class="box"></div>
            <style type="text/gss">
          
            #box1[width] == 9;
            #box2[width] == 19;
          
            .box {
              @if ::[width] < 10 {
                color: blue;
              }
              @else {
                color: red;
              }
            }
          
            </style>
          """
        engine.once 'solved', listen
    ###
    
    ###
    describe 'TODO!!!! contextual @if @else inner nesting', ->
      
      # This one will require some serious surgery...
      
      it 'should compute values', (done) ->
        listen = (e) ->
          # TODO
          expect(engine.vars).to.eql 
            "$box1[width]": 9
            "$box2[width]": 19
            "$inside2[height]": 20
          done()          
          engine.off 'solved', listen                    
    
        container.innerHTML =  """
            <div id="box1" class="box">
              <div id="inside1" class="inside"></div>
            </div>
            <div id="container">
              <div id="box2" class="box">
                <div id="inside2" class="inside"></div>
              </div>
            </div>
            <style type="text/gss">
            
            #box1[width] == 9;
            #box2[width] == 19;
            
            #container {
              
              .box {
                @if ::[width] < 10 {
                  .inside {
                    height: == 10;
                  }
                }
                @else {
                  .inside {
                    height: == 20;
                  }
                }
              }            
            }
          
            </style>
          """
        engine.once 'solved', listen
    ###
  
    describe 'top level @if @else w/ complex queries', ->
  
      it 'should be ok', (done) ->
        listen = (e) ->     
          expect(engine.vars).to.be.ok
          done()          
      
        container.innerHTML =  """
            <div class="section"></div>
            <div class="section"></div>
            <style type="text/gss">
            [Wwin] == 1000;

            @if [Wwin] > 960 {

              .section {
                height: == ::[intrinsic-height];
                right: == ::window[right] - 100;
                left: == ::window[left] + 100;
                top:>= ::window[top];
              }

            }

            @else {
  
              .section {
                height: == ::[intrinsic-height];
                right: == ::window[right] - 10;
                left: == ::window[left] + 10;
                top:>= ::window[top];
              }
  
            }
            </style>
          """
        engine.once 'solved', listen
    
  
    describe 'top level @if @else w/ nested VFLs', ->
  
      it 'should compute values', (done) ->
        listen = (e) ->             
          expect(engine.vars).to.eql
            "[Wwin]":100
            "$s1[x]":50
            "$s1[width]":1
            "$s2[width]":1
            "$s2[x]":56         
          done()          
    
        container.innerHTML =  """
            <div id="s1"></div>
            <div id="s2"></div>
            <style type="text/gss">
            [Wwin] == 100;          
          
            @if [Wwin] > 960 {
                        
              #s1[x] == 100;
              @horizontal [#s1(==10)]-[#s2(==10)] gap(100);

            }

            @else {
  
              #s1[x] == 50;
              @horizontal [#s1(==1)]-[#s2(==1)] gap(5);
  
            }
            </style>
          """
        engine.once 'solved', listen    
  
  
    describe '@if @else w/ dynamic VFLs', ->
  
      it 'should compute values', (done) ->
        listen = (e) ->     
          expect(engine.vars).to.eql
            "$container[width]": 100,
            "$s1[height]": 100,
            "$s2[height]": 100,
            "$s1[width]": 100,
            "$s2[width]": 100,
            "$s1[x]": 0,
            "$s2[x]": 100,
            "$s1[y]": 0,
            "$s2[y]": 0          
   
          done()          
    
        container.innerHTML =  """
            <div id="s1" class="section"></div>
            <div id="s2" class="section"></div>
            <div id="container"></div>
            <style type="text/gss">

            #container {
              width: == 100;
            }
            .section {
              height: == 100;
              width: == 100;
              x: >= 0;
              y: >= 0;
            }       
          
            @if #container[width] > 960 {
            
              @vertical .section;     

            }
          
            @else {
              @horizontal .section;     
            }


            </style>
          """
        engine.once 'solved', listen  
  
  
  
  # VFL
  # ===========================================================
  
  describe "VFL", ->
  
    describe 'simple VFL', ->
  
      it 'should compute values', (done) ->
        listen = (e) ->     
          expect(engine.vars).to.eql
            "$s1[x]":100
            "$s1[width]":10
            "$s2[width]":10
            "$s2[x]":210
          
          done()          
    
        container.innerHTML =  """
            <div id="s1"></div>
            <div id="s2"></div>
            <style type="text/gss">
          
            #s1[x] == 100;
            @horizontal [#s1(==10)]-[#s2(==10)] gap(100);
          
            </style>
          """
        engine.once 'solved', listen

    describe '[::] VFLs', ->
  
      it 'should compute', (done) ->
        listen = (e) ->     
          expect(engine.vars).to.eql      
            "$s1[x]": 20,
            "$container[x]": 10,
            "$s2[x]": 20,
            "$container[width]": 100,
            "$s1[width]": 80,
            "$s2[width]": 80     
          done()          
    
        container.innerHTML =  """
            <div id="s1" class="section"></div>
            <div id="s2" class="section"></div>
            <div id="container"></div>
            <style type="text/gss">                        
                      
              .section {
                @horizontal |-[::this]-| gap(10) in(#container);
              }
            
              #container {
                x: == 10;
                width: == 100;
              }                        
  
            </style>
          """
        engine.once 'solved', listen    
      

    describe '<points>', ->
  
      it 'should compute', (done) ->
        listen = (e) ->
          console.log engine.vars
          expect(engine.vars).to.eql                  
            "$container[x]": 10,
            "$container[width]": 100,
            "[right-edge]": 200,
            "$s1[x]": 70,
            "$s1[width]": 120
          done()          
    
        container.innerHTML =  """
            <div id="s1"></div>
            <div id="container"></div>
            <style type="text/gss">                        
            
              #container {
                x: == 10;
                width: == 100;
              }
              
              [right-edge] == 200;
              
              @h <#container[center-x]>-[#s1]-<[right-edge]> gap(10);     
  
            </style>
          """
        engine.once 'solved', listen
    
    
    describe '[::] VFLs II', ->
  
      it 'should compute', (done) ->
        listen = (e) ->     
          expect(engine.vars).to.eql      
            "$s1[x]": 20,
            "$container[x]": 10,
            "$s2[x]": 20,
            "$container[width]": 100,
            "$s1[width]": 80,
            "$s2[width]": 80     
          done()          
    
        container.innerHTML =  """
            <div id="s1" class="section"></div>
            <div id="s2" class="section"></div>
            <div id="container"></div>
            <style type="text/gss">                        
            
              #container {
                x: == 10;
                width: == 100;
              } 
                     
              .section {
                @horizontal |-[::this]-| gap(10) in(#container);
              }                                           
  
            </style>
          """
        engine.once 'solved', listen   
    
    describe 'VFLs w/ missing elements', ->
  
      it 'should compute', (done) ->
    
        container.innerHTML =  """
            <div id="here"></div>
            <div id="container"></div>
            <style type="text/gss">                        
              @h |-10-[#here]-[#gone]-[#gone2]-[#gone3]-10-|
                in(#container)
                chain-height([but_height] !strong)
                chain-center-y(#top-nav[center-y]) 
                !require;                                    
            </style>
          """
        engine.once 'solved', (e) ->     
          assert true
          done()    
          
      ###
      .dot[width] == 2 == .dot[height];
      .dot[border-radius] == 1;
      .dot {
        background-color: hsla(190,100%,70%,.4)
      }
      @horizontal .dot-row1 gap([plan-width]-2);
      @horizontal .dot-row2 gap([plan-width]-2);
      @horizontal .dot-row3 gap([plan-width]-2);
      @horizontal .dot-row4 gap([plan-width]-2);
      @horizontal .dot-row5 gap([plan-width]-2);
      @horizontal .dot-row6 gap([plan-width]-2);
      .dot-first[center-x] == #p1[left];
      .dot-row1[center-y] == #p-r1[top];
      .dot-row2[center-y] == #p-r2[top];
      .dot-row3[center-y] == #p-r3[top];
      .dot-row4[center-y] == #p-r4[top];
      .dot-row5[center-y] == #p-r5[top];
      .dot-row6[center-y] == #p-r5[bottom];

      .asterisk {
        color:   hsl(190,100%,50%);
        margin-right: 9px;
      }
      
      ###