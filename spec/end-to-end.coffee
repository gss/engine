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
    container = document.createElement 'div'
    $('#fixtures').appendChild container
    engine = new GSS(container)
    
  afterEach ->
    remove(container)
    
  
  # Config
  # ===========================================================
  
  xdescribe 'config', ->
  
    describe 'defaultStrength: strong', ->
    
      it 'should compute', (done) ->
        oldDefault = GSS.config.defaultStrength
        GSS.config.defaultStrength = "strong"
      
        listen = (e) ->     
          expect(engine.vars).to.eql 
            "m": 2
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
  
  xdescribe 'Vanilla CSS', ->  
    
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
          expect(engine.values.toObject()).to.eql 
            "c": 10
            "x": 0
            "y": 500
            "z": 510
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
          expect(engine.values.toObject()).to.eql 
            "grid": 36
            "$billy[x]": 36
          done()
    
    describe 'non-pixel props', ->  
      it 'should be ok', (done) ->                                 
        container.innerHTML =  """
            <div id="non-pixel"></div>
            <style type="text/gss">              
              #non-pixel {
                z-index: == 10;
                opacity: == .5;
              }
            </style>
          """
        engine.once 'solved', (e) ->
          style = document.getElementById('non-pixel').style      
          assert (Number(style['z-index']) is 10) or (Number(style['zIndex']) is 10), 'correct z-index'
          assert Number(style['opacity']) is .5, 'correct opacity'
          done()
          
    describe 'order of operations', ->  
      it 'should compute values', (done) ->                                 
        container.innerHTML =  """
            <style type="text/gss">              
              [w] == 100 !require;
              [igap] == 3 !require;
              [ogap] == 10 !require;
              
              [md] * 4 == [w] - [ogap] * 2 !require;
              
              [span3] == [md] * 3 + [igap] * 2;
              
              [blah] == [w] - 10 - 10 - 10;
              
              [blah2] == [w] - [ogap] - [ogap] - [ogap];
              
              [md2] == ([w] - [ogap] - [ogap] - [igap] * 3) / 4 !require;
            
            </style>
          """
        engine.once 'solved', (e) ->
          expect(engine.values.toObject()).to.eql 
            "w": 100
            "igap": 3
            "ogap": 10
            "md": 20
            "span3": 66
            "blah": 70
            "blah2": 70
            "md2": 71 / 4
          done()
    
    describe 'balanced plural selectors', -> 
      it 'should compute values', (done) ->                                 
        container.innerHTML =  """
            <div id="a1" class="a"></div>
            <div id="a2" class="a"></div>
            <div id="a3" class="a"></div>            
            <div id="b1" class="b"></div>
            <div id="b2" class="b"></div>
            <div id="b3" class="b"></div>
            <style type="text/gss">                            
              [x] == 100;
              .a[x] == .b[x] == [x];              
            </style>
          """
        engine.once 'solved', (e) ->
          expect(engine.values.toObject()).to.eql 
            "x": 100
            "$a1[x]": 100
            "$a2[x]": 100
            "$a3[x]": 100
            "$b1[x]": 100
            "$b2[x]": 100
            "$b3[x]": 100
          done()
    
    xdescribe 'WARN: unbalanced plural selectors', ->  
      it 'should compute values', (done) ->                                 
        container.innerHTML =  """
            <div id="a1" class="a"></div>
            <div id="a2" class="a"></div>
            <div id="a3" class="a"></div>            
            <div id="b1" class="b"></div>
            <div id="b2" class="b"></div>
            <div id="b3" class="b"></div>
            <div id="b4" class="b"></div>
            <style type="text/gss">                            
              [x] == 100;
              .a[x] == .b[x] == [x];              
            </style>
          """        
        engine.once 'display', (e) ->
          expect(engine.values).to.eql 
            "x": 100
            "$a1[x]": 100
            "$a2[x]": 100
            "$a3[x]": 100
            "$b1[x]": 100
            "$b2[x]": 100
            "$b3[x]": 100
            "$b4[x]": 100
          done()        
    
    xdescribe 'complex selectors', -> 
      xit 'should compute values', (done) ->                                 
        container.innerHTML =  """
            <section class="section">
              <div id="a1" class="a"></div>
              <div id="a2" class="a"></div>
              <div id="a3" class="a"></div>            
              <div id="b1" class="b"></div>
              <div id="b2" class="b"></div>
              <div id="b3" class="b"></div>
            </section>
            <style type="text/gss">                            
              [x] == 100;
              (section.section div:not(.b))[x] == (section.section div:not(.a))[x] == [x];              
            </style>
          """
        engine.once 'display', (e) ->
          expect(engine.vars).to.eql 
            "x": 100
            "$a1[x]": 100
            "$a2[x]": 100
            "$a3[x]": 100
            "$b1[x]": 100
            "$b2[x]": 100
            "$b3[x]": 100
          done()
    
    describe '2D sugar', ->  
      it 'should compute values', (done) ->                                 
        container.innerHTML =  """
            <div id="sugar1"></div>
            <div id="sugar2"></div>
            <style type="text/gss">                            
              #sugar1 {
                width: 10px;
                height: 10px;
                x: == 5;
                y: == 5;
              }
              #sugar2 {
                size: == #sugar1[intrinsic-size];
              }
              #sugar1[position] == #sugar2[center];              
            </style>
          """
        engine.once 'solved', (e) ->
          console.log((JSON.parse JSON.stringify engine.values.toObject()), 44, [engine.$id('sugar1').style.cssText, engine.$id('sugar2').style.cssText])
          expect(engine.values.toObject()).to.eql 
            "$sugar1[x]": 5
            "$sugar1[y]": 5
            "$sugar1[intrinsic-width]": 10
            "$sugar1[intrinsic-height]": 10
            "$sugar2[width]": 10
            "$sugar2[height]": 10
            "$sugar2[x]": 0
            "$sugar2[y]": 0
          done()
    
    describe 'intrinsic & measurable css in same gss block', ->  
      it 'should compute values', (done) ->                                 
        container.innerHTML =  """
            <div id="sync1" class="sync"></div>
            <style type="text/gss">                            
              .sync, .async {
                width: 100px;
                height: == ::[intrinsic-width];
              }
            </style>
          """
        engine.once 'solved', (e) ->
          expect(engine.values.toObject()).to.eql 
            "$sync1[intrinsic-width]": 100
            "$sync1[height]": 100            
          done()
    
    # This test was the same as previous, I added a regular box sizing check
    describe 'intrinsic & measure-impacting css in same gss block', ->  
      it 'should compute values', (done) ->                                 
        container.innerHTML =  """
            <div id="sync1" class="sync"></div>
            <style type="text/gss" id="style999">                            
              .sync, .async {
                width: 100px;
                padding-left: 20px;
                height: == ::[intrinsic-width];
              }
            </style>
          """
        engine.once 'solved', (e) ->
          expect(engine.values.toObject()).to.eql 
            "$sync1[intrinsic-width]": 120
            "$sync1[height]": 120            
          done()
    
    
    describe 'async added elements w/ intrinsics', ->  
          
      it 'should compute values', (done) ->                                 
        container.innerHTML =  """
            <div id="sync1" class="sync"></div>
            <style type="text/gss" id="style555">                            
              .sync, .async {
                width: 100px;
                height: == ::[intrinsic-width];
                test: == 0;
              }
            </style>
          """
        engine.once 'solved', (e) ->
          expect(engine.values.toObject()).to.eql 
            "$sync1[intrinsic-width]": 100
            "$sync1[height]": 100     
            "$sync1[test]": 0
          # do again
          container.insertAdjacentHTML('beforeend', '<div id="async1" class="sync"></div>')   
          engine.once 'solved', (e) ->
            expect(engine.values.toObject()).to.eql 
              "$sync1[intrinsic-width]": 100
              "$sync1[height]": 100
              "$sync1[test]": 0
              "$async1[intrinsic-width]": 100
              "$async1[height]": 100
              "$async1[test]": 0
            done()
                  

  
  
  
  # Window
  # ===========================================================      
  
  describe "::window", ->
  
    describe 'center values', ->  
      it 'should compute values', (done) ->
        engine.once 'solved', (e) ->     
          w = (window.innerWidth)# - GSS.get.scrollbarWidth())
          cx = w / 2
          h = (window.innerHeight)
          cy = h / 2
          expect(engine.values.toObject()).to.eql 
            "::window[height]": h
            "::window[width]": w
            "::window[x]": 0
            "::window[y]": 0
            "center-x": cx
            "center-y": cy
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
          w = (window.innerWidth)# - GSS.get.scrollbarWidth())
          h = (window.innerHeight)
          expect(engine.values.toObject()).to.eql 
            "::window[y]": 0
            "top": 0
            "::window[width]": w
            "right": w
            "::window[height]": h
            "bottom": h
            "::window[x]": 0
            "left": 0
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
    
    describe "single file", ->
    
      it 'should compute', (done) ->
        listen = (e) ->     
          expect(engine.values.toObject()).to.eql 
            "external-file": 1000
          done()     
                     
        engine.once 'solved', listen
    
        container.innerHTML =  """
            <link rel="stylesheet" type="text/gss" href="./fixtures/external-file.gss"></link>
          """

    describe "multiple files", ->
    
      it 'should compute', (done) ->
        counter = 0
        listen = (e) ->
          counter++
          if counter == 3
            expect(engine.values.toObject()).to.eql 
              "external-file": 1000
              "external-file-2": 2000
              "external-file-3": 3000
            engine.removeEventListener 'solved', listen
            done()     
                     
        engine.addEventListener 'solved', listen
    
        container.innerHTML =  """
            <link rel="stylesheet" type="text/gss" href="./fixtures/external-file.gss"></link>
            <link rel="stylesheet" type="text/gss" href="./fixtures/external-file-2.gss"></link>
            <link rel="stylesheet" type="text/gss" href="./fixtures/external-file-3.gss"></link>
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
              "mast"[top] == 0;
              "mast"[bottom] == 100;
              "mast"[left] == 10;
              "mast"[right] == 20;
            }
          </style>
          """
        engine.once 'solved', (e) ->
          expect((engine.values.toObject())).to.eql 
            '$ship"mast"[height]': 100
            '$ship"mast"[x]': 10
            '$ship"mast"[width]': 10
            '$ship"mast"[y]': 0
          done()
  
  
  # VGL
  # ===========================================================
  
  xdescribe 'VGL', ->  
    
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
          expect(engine.values.toObject()).to.eql 
            "t": 500
            "x": 1
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
          expect(engine.values.toObject()).to.eql 
            "t": 500
            "$b[width]": 1
          done()     
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
          expect(engine.values.toObject()).to.eql 
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
    
    describe 'and / or @if @else', ->
  
      it 'should compute values', (done) ->
        container.innerHTML =  """
            <div id="box1" class="box"></div>
            <div id="box2" class="box"></div>
            <div id="box3" class="box"></div>
            <style type="text/gss">
          
            #box1[width] == 9;
            #box2[width] == 11;
            #box3[width] == 10;
            #box1[height] == 9;
            #box2[height] == 11;
            #box3[height] == 10;
          
            .box {
              @if ::[width] < 10 and ::[height] < 10 {
                $state: == 1;
              } @else {
                @if ::[width] > 10 and ::[height] > 10 {
                  $state: == 2;
                } @else { 
                  @if ::[width] == 10 or ::[height] == 10 {
                    $state: == 3;
                  }
                }
              }
            }
          
            </style>
          """
        engine.once 'solved', (e) ->     
          expect(engine.values.toObject()).to.eql 
            "$box1[width]": 9
            "$box2[width]": 11
            "$box3[width]": 10
            "$box1[height]": 9
            "$box2[height]": 11
            "$box3[height]": 10
            "$box1[$state]": 1
            "$box2[$state]": 2
            "$box3[$state]": 3
          done()
    
    describe 'arithmetic @if @else', ->
  
      it 'should compute values', (done) ->
        container.innerHTML =  """
            <div id="box1" class="box"></div>
            <div id="box2" class="box"></div>
            <div id="box3" class="box"></div>
            <style type="text/gss">
          
            #box1[width] == 9;
            #box2[width] == 11;
            #box3[width] == 10;
            #box1[height] == 9;
            #box2[height] == 11;
            #box3[height] == 10;
          
            .box {
              @if ::[width] + ::[height] < 20 {
                $state: == 1;
              } @else {
                @if ::[width] + ::[height] == 22 {
                  $state: == 2;
                } @else {
                  @if ::[width] * ::[height] >= 99 {
                    $state: == 3;
                  }
                }
              } 
            }
          
            </style>
          """
        engine.once 'solved', (e) ->
          expect(engine.values.toObject()).to.eql 
            "$box1[width]": 9
            "$box2[width]": 11
            "$box3[width]": 10
            "$box1[height]": 9
            "$box2[height]": 11
            "$box3[height]": 10
            "$box1[$state]": 1
            "$box2[$state]": 2
            "$box3[$state]": 3
          done()
    
    describe 'parans + arithmetic @if @else', ->
  
      it 'should compute values', (done) ->
        container.innerHTML =  """
            <div id="box1" class="box"></div>
            <div id="box2" class="box"></div>
            <div id="box3" class="box"></div>
            <style type="text/gss">
          
            #box1[width] == 9;
            #box2[width] == 11;
            #box3[width] == 10;
            #box1[height] == 9;
            #box2[height] == 11;
            #box3[height] == 10;
          
            .box {
              @if (::[width] + ::[height] < 20) and (::[width] == 9) {
                $state: == 1;
              } @else {
                @if (::[width] + ::[height] == 22) and (::[width] == 11) {
                  $state: == 2;
                } @else {
                  @if (::[width] * ::[height] >= 99) and (::[width] == 999999) {
                    $state: == 4;
                  } @else {
                    @if (::[width] * ::[height] >= 99) and (::[width] == 10) {
                      $state: == 3;
                    }
                  }
                }
              }
            }
          
            </style>
          """
        engine.once 'solved', (e) ->
          expect(engine.values.toObject()).to.eql 
            "$box1[width]": 9
            "$box2[width]": 11
            "$box3[width]": 10
            "$box1[height]": 9
            "$box2[height]": 11
            "$box3[height]": 10
            "$box1[$state]": 1
            "$box2[$state]": 2
            "$box3[$state]": 3
          done()
    
  
    
    ###
    describe 'TODO!!!! contextual @if @else with vanilla CSS', ->
  
      it 'should compute values', (done) ->
        listen = (e) ->     
          expect(engine.vars).to.eql 
            "$box1[width]": 9
            "$box2[width]": 19
          expect(engine.cssDump).to.equal document.getElementById("gss-css-dump-" + engine.id)
          
          expect(window.getComputedStyle(document.querySelector("#box1"),null).getPropertyValue("color")).to.equal "rgb(20,30,40)"
          expect(window.getComputedStyle(document.querySelector("#box2"),null).getPropertyValue("color")).to.equal "rgb(50,50,50)"          
          done()          
    
        container.innerHTML =  """
            <div id="box1" class="box"></div>
            <div id="box2" class="box"></div>
            <style type="text/gss">
          
              #box1[width] == 9;
              #box2[width] == 19;
          
              .box {
                @if ::[width] < 10 {
                  color: rgb(20,30,40);
                }
                @else {
                  color: rgb(50,50,50);
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
          debugger
          expect(engine.values).to.be.ok
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
            "Wwin":100
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
  
    ###
    describe '@if @else w/ dynamic VFLs', ->
      it 'should compute values', (done) ->     
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
              } @else {
                @horizontal .section;     
              }
            </style>
          """
        engine.once 'solved', (e) ->     
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
    ###
  
  
  
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
    
    describe 'plural selectors I', ->  
      it 'should compute values', (done) ->                                 
        container.innerHTML =  """
            <div id="cont1" class="cont"></div>
            <div id="cont2" class="cont"></div>
            <div id="a1" class="a"></div>
            <div id="a2" class="a"></div>
            <div id="b1" class="b"></div>
            <div id="b2" class="b"></div>            
            <style type="text/gss">                            
              .cont {
                width: == 100;
                x: == 0;
              }
              @h |[.a][.b]| in(.cont) chain-width;             
            </style>
          """
        engine.once 'display', (e) ->
          expect(engine.vars).to.eql 
            "$cont1[width]": 100
            "$cont2[width]": 100
            "$cont1[x]": 0            
            "$cont2[x]": 0
            "$a1[x]": 0
            "$a2[x]": 0
            "$b1[x]": 50            
            "$a1[width]": 50
            "$b2[x]": 50
            "$a2[width]": 50
            "$b1[width]": 50                                    
            "$b2[width]": 50
          done()
    
    describe 'plural selectors & in(::)', ->  
      it 'should compute values', (done) ->                                 
        container.innerHTML =  """
            <div id="cont1" class="cont"></div>
            <div id="a1" class="a"></div>
            <div id="a2" class="a"></div>
            <div id="b1" class="b"></div>
            <div id="b2" class="b"></div>            
            <style type="text/gss">                            
              .cont {
                width: == 100;
                x: == 0;
                @h |[.a][.b]| in(::) chain-width;
              }                           
            </style>
          """
        engine.once 'display', (e) ->
          expect(engine.vars).to.eql 
            "$cont1[width]": 100
            "$cont1[x]": 0            
            "$a1[x]": 0
            "$a2[x]": 0
            "$b1[x]": 50            
            "$a1[width]": 50
            "$b2[x]": 50
            "$a2[width]": 50
            "$b1[width]": 50                                    
            "$b2[width]": 50
          done()
    
    describe 'Implicit VFL', ->
  
      it 'should compute', (done) ->
        engine.once 'solved', (e) ->
          expect(engine.vars).to.eql      
            "$s1[x]": 0,
            "$s2[x]": 60,
            "$s1[width]": 50,
            "$s2[width]": 50     
          done()
        container.innerHTML =  """
            <div id="s1" class="implicit"></div>
            <div id="s2" class="implicit"></div>
            <div id="container"></div>
            <style type="text/gss">                                                          
            
              .implicit {
                x: >= 0;
                width: == 50;
              }                        
              
              @h .implicit gap(10);
  
            </style>
          """
    
    ### TODO
    describe 'Implicit VFL w/ containment', ->
  
      it 'should compute', (done) ->
        engine.once 'solved', (e) ->
          console.log JSON.stringify engine.vars
          expect(engine.vars).to.eql      
            "$s1[x]": 10,
            "$container[x]": 0,
            "$s2[x]": 40,
            "$container[width]": 90,
            "$s1[width]": 30,
            "$s2[width]": 30     
          done()
        container.innerHTML =  """
            <div id="s1" class="implicit"></div>
            <div id="s2" class="implicit"></div>
            <div id="container"></div>
            <style type="text/gss">                        
                      
              @h .implicit gap(10) in(#container);
            
              #container {
                x: == 0;
                width: == 90;
              }                        
  
            </style>
          """
    ###
      
    describe '[::] VFLs II', ->
  
      it 'should compute', (done) ->
        engine.once 'solved', (e) ->     
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
          
    describe '<points>', ->
  
      it 'should compute', (done) ->
        engine.once 'solved', (e) ->
          expect(engine.vars).to.eql                  
            "$container[x]": 10,
            "$container[width]": 100,
            "right-edge": 200,
            "$s1[x]": 70,
            "$s1[width]": 120
            "$s2[x]": 200,
            "$s2[width]": 801
          done()              
        container.innerHTML =  """
            <div id="s1"></div>
            <div id="s2"></div>
            <div id="container"></div>
            <style type="text/gss">                        
            
              #container {
                x: == 10;
                width: == 100;
              }
              
              [right-edge] == 200;
              
              @h <#container[center-x]>-[#s1]-<[right-edge]> [#s2] < 1000 + 1 > gap(10);     
  
            </style>
          """ 
    
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