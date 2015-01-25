assert = chai.assert
expect = chai.expect

stringify = (o) ->
  return o
  return JSON.stringify o, 1, 1

remove = (el) ->
  el?.parentNode?.removeChild(el)



describe 'End - to - End', ->
  
  engine = null
  container = null
  
  beforeEach ->
    container = document.createElement 'div'
    document.getElementById('fixtures').appendChild container
    window.$engine = engine = new GSS(container)
    
  afterEach ->
    remove(container)
  

  describe 'intrinsic properties', ->
    it 'should bind to scrolling', (done) ->
      engine.once 'solve', (e) ->
        expect(stringify engine.values).to.eql stringify
          "$scroller[scroll-top]": 0
          "$floater[x]": 0

        engine.once 'solve', (e) ->
          expect(stringify engine.values).to.eql stringify
            "$scroller[scroll-top]": 20
            "$floater[x]": 20

          engine.once 'solve', (e) ->
            expect(stringify engine.values).to.eql stringify
              "$scroller[scroll-top]": 0
              "$floater[x]": 0

            done()

          engine.id('scroller').scrollTop = 0
        engine.id('scroller').scrollTop = 20
      container.innerHTML =  """
        <style>
          #scroller {
            height: 50px;
            overflow: scroll;
            font-size: 300px;
          }
        </style>
        <style type="text/gss"> 
          #floater[x] == #scroller[scroll-top]
        </style>
        <div class="a" id="scroller">content</div>
        <div class="b" id="floater"></div>
      """
      
    it 'should bind to element visibility', (done) ->
      id = container._gss_id

      container.style.height = '50px'
      container.style.overflow = 'scroll'
      container.style.fontSize = '300px'
      container.style.position = 'relative'
      container.innerHTML =  """
        <style type="text/gss">
          
          #floater {
            y: == 100;
            height: == 25;
            
            :visible-y {
              x: == 200;
            } 
          }
        </style>
        <div class="b" id="floater"></div>
        <div style="width: 10px; height: 200px;"></div>
      """
      
      
      engine.once 'solve', (e) ->
        expect(e["#{id}[scroll-top]"]).to.eql 0
        expect(e["#{id}[computed-height]"]).to.eql 50
        expect(e["$floater[y]"]).to.eql 100
        expect(e["$floater[height]"]).to.eql 25
        expect(e["$floater[computed-y]"]).to.eql 100
        expect(e["$floater[computed-height]"]).to.eql 25

        engine.once 'solve', (e) -> # Still not visible
          expect(e["#{id}[scroll-top]"]).to.eql 50
          engine.once 'solve', (e) -> # Visible
            expect(e["#{id}[scroll-top]"]).to.eql 100
            expect(e["$floater[x]"]).to.eql 200
            engine.once 'solve', (e) -> # still visible
              expect(e["#{id}[scroll-top]"]).to.eql 110
              expect(e["$floater[x]"]).to.eql undefined
              engine.once 'solve', (e) -> # Hidden now
                expect(e["#{id}[scroll-top]"]).to.eql 125
                expect(e["$floater[x]"]).to.eql null
                engine.once 'solve', (e) -> # Still hidden
                  expect(e["#{id}[scroll-top]"]).to.eql 150
                  expect(e["$floater[x]"]).to.eql undefined
                  engine.once 'solve', (e) -> # Unsbubscribed
                    expect(e["$floater[y]"]).to.eql null
                    expect(e["$floater[height]"]).to.eql null
                    expect(e["$floater[computed-y]"]).to.eql null
                    expect(e["$floater[computed-height]"]).to.eql null
                    done()
                  remove engine.id('floater')
                container.scrollTop = 150
              container.scrollTop = 125
            container.scrollTop = 110
          container.scrollTop = 100
        container.scrollTop = 50


  # Virtual Elements
  # ===========================================================
  
  describe 'Virtual Elements', ->  
    
    describe 'basic', ->
      engine = null
  
      it 'in regular stylesheet with global rule ', (done) ->
        engine = GSS(container)
        container.innerHTML =  """
          <div id="ship"></div>
          <style type="text/gss" id="gss">
            "mast" {
              height: == ($ #ship)[height];
            }
            #ship {
              "mast"[top] == 0;
              "mast"[bottom] == 100;
              "mast"[left] == 10;
              "mast"[right] == 20;
              &"mast"[z] == 1;
            }
          </style>
          """
        engine.once 'solve', (e) ->
          expect((engine.values)).to.eql 
            '$gss"mast"[height]': 100
            '$gss"mast"[x]': 10
            '$gss"mast"[width]': 10
            '$gss"mast"[y]': 0
            '$ship[height]': 100
            '$ship"mast"[z]': 1
          done()
        
      it 'in regular stylesheet', (done) ->
        engine = GSS(container)
        container.innerHTML =  """
          <div id="ship"></div>
          <style type="text/gss" id="gss">
            #ship {
              "mast"[top] == 0;
              "mast"[bottom] == 100;
              "mast"[left] == 10;
              "mast"[right] == 20;
              &"mast"[z] == 1;
            }
            #ship[height] == "mast"[height];
          </style>
          """
        engine.once 'solve', (e) ->
          expect((engine.values)).to.eql 
            '$gss"mast"[height]': 100
            '$gss"mast"[x]': 10
            '$gss"mast"[width]': 10
            '$gss"mast"[y]': 0
            '$ship[height]': 100
            '$ship"mast"[z]': 1
          done()

      it 'in scoped stylesheet', (done) ->
        engine = GSS(container)
        container.innerHTML =  """
          <div id="ship"></div>
          <style scoped type="text/gss" id="gss">
            #ship {
              "mast"[top] == 0;
              "mast"[bottom] == 100;
              "mast"[left] == 10;
              "mast"[right] == 20;
              &"mast"[z] == 1;
            }
            #ship[height] == "mast"[height];
          </style>
          """
        engine.once 'solve', (e) ->
          expect((engine.values)).to.eql 
            '"mast"[height]': 100
            '"mast"[x]': 10
            '"mast"[width]': 10
            '"mast"[y]': 0
            '$ship[height]': 100
            '$ship"mast"[z]': 1
          done()

      it 'in mixed stylesheets', (done) ->
        engine = GSS(container)
        container.innerHTML =  """
          <div id="ship"></div>
          <style type="text/gss" id="gss1">
            [b] == 10; // &

            ^ {
              "mast" {
                x: == [b]; // ^^
              }
            }
            ^"mast" {
              d: == 100; // &
              bottom: == [d]; // &
            } 
          </style>
          <style scoped type="text/gss" id="gss2">
            [e] == 1; // $
            #ship {
              [c] == 20; // &
              "mast"[top] == 0; // $
              "mast"[right] == [c]; // $, &
              &"mast"[z] == [e]; // &
            }
            #ship[height] == "mast"[height]; // $
          </style>
          """
        engine.once 'solve', (e) ->
          expect((engine.values)).to.eql 
            '"mast"[height]': 100
            '"mast"[x]': 10
            '"mast"[width]': 10
            '"mast"[y]': 0
            '"mast"[d]': 100
            '$ship[height]': 100
            '$ship"mast"[z]': 1
            '$ship[c]': 20
            '$gss1[b]': 10
            'e': 1
          done()

    it 'in VFL', (done) ->
      engine = window.$engine = GSS(container)
      container.style.width = '400px'
      container.style.height = '100px'
      container.innerHTML = """

        <button id="box" class="box foo" onclick="this.setAttribute('class', this.className.indexOf('bar') > -1 ? 'box foo' : 'box bar')"></button>
    
        <style type="text/gss">
          [col-gap] == 16;
          $[size] == $[intrinsic-size];
          $[left] == 0;
        
          @h |($"col-1...8")-[col-gap]-...| in($) !require {
            width: == $[col-width] !require;
          }
          
          .box {          
            @v |(&)| in(::window);
            &.bar {
              @h |(&)| in($"col-6");
            }
            &.foo {
              @h |(&)| in($"col-3");
            }
          }
        </style>
        
      """
      engine.then (solution) ->
        expect(Math.floor solution["col-width"]).to.eql (400 - 16 * 7) / 8
        expect(Math.floor solution["$box[width]"]).to.eql (400 - 16 * 7) / 8
        expect(Math.floor solution["$box[x]"]).to.eql (((400 - 16 * 7) / 8) + 16) * 2

        engine.id('box').click()

        engine.then (solution) ->
          expect(Math.floor solution["$box[width]"]).to.eql (400 - 16 * 7) / 8
          expect(Math.floor solution["$box[x]"]).to.eql (((400 - 16 * 7) / 8) + 16) * 5
          done()



    it 'in comma', (done) ->
      engine = window.$engine = GSS(container)
      container.style.width = '400px'
      container.style.height = '100px'
      container.innerHTML = """
        <div id="a1" class="a"></div>
        <div id="a2" class="a"></div>
        <div id="b1" class="b"></div>
        <div id="b2" class="b"></div>
        <style type="text/gss" scoped>
          "c", .a, "z", .b {
            &:next[x] == 10;
          }
        </style>
      """
      engine.then (solution) ->
        expect(solution).to.eql
          "$a1[x]": 10
          "$a2[x]": 10
          "\"z\"[x]": 10
          "$b1[x]": 10
          "$b2[x]": 10

        lefts = 
          for item in engine.class('a') by -1
            item.parentNode.removeChild(item)
            item

        engine.then (solution) ->
          expect(solution).to.eql
            '$a1[x]': null
            "$a2[x]": null

          for item in lefts by -1
            engine.scope.insertBefore(item, engine.id('b2'))

          engine.then (solution) ->
            expect(solution).to.eql
              '$a1[x]': 10
              "$a2[x]": 10

            items = 
              for item in engine.tag('div') by -1
                item.parentNode.removeChild(item)
                item

            engine.then (solution) ->
              expect(solution).to.eql
                '$b1[x]': null
                "$b2[x]": null
                '$a1[x]': null
                "$a2[x]": null
                done()

  describe 'Edge cases', ->

    it 'should handle identical constraints', (done) ->
      engine.then ->
        expect(engine.domains.length).to.eql 1
        expect(engine.domains[0].constraints.length).to.eql 1
        expect(engine.domains[0].constraints[0].operations.length).to.eql 3
        done()
      container.innerHTML = """
        <style type="text/gss">
          button {
            $[b] == 1;
          }
        </style>
        <button id="button1"></button>
        <button id="button2"></button>
        <button id="button3"></button>
      """

  

  
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
                     
        engine.once 'solve', listen
    
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
                     
        engine.once 'solve', listen
    
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
    getSource = (style) ->
      Array.prototype.slice.call(style.sheet.cssRules).map (rule) ->
        return rule.cssText.replace(/^\s+|\s+$|\n|\t|\s*({|}|:|;)\s*|(\s+)/g, '$1$2').replace(/\='/g, '="').replace(/'\]/g, '"]')
      .join('\n')
    
    describe 'just CSS', ->
      engine = null
    
      it 'should dump and clean', (done) ->
        container.innerHTML =  """
          <style type="text/gss" scoped>
            #css-only-dump {
              height: 100px;
            }
          </style>
          <div id="css-only-dump"></div>
          """
        engine.once 'solve', (e) ->
          expect(getSource(engine.tag('style')[1])).to.equal "#css-only-dump{height:100px;}"

          dumper = engine.id('css-only-dump')
          dumper.parentNode.removeChild(dumper)
          engine.once 'solve', (e) ->
            expect(getSource(engine.tag('style')[1])).to.equal ""

            done()   
    
    describe 'CSS + CCSS', ->
      engine = null
    
      it 'should dump', (done) ->
        container.innerHTML =  """
          <div class="css-simple-dump"></div>
          <style type="text/gss" scoped>
            .css-simple-dump {
              width: == 100;
              height: 100px;
            }
          </style>
          """
        engine.once 'solve', (e) ->   
          expect(getSource(engine.tag('style')[1])).to.equal ".css-simple-dump{height:100px;}"

          dump = engine.class('css-simple-dump')[0]
          clone = dump.cloneNode()
          dump.parentNode.appendChild(clone)

          engine.once 'solve', (e) ->  
            expect(getSource(engine.tag('style')[1])).to.equal ".css-simple-dump{height:100px;}"
            dump.parentNode.removeChild(dump)

            engine.once 'solve', (e) ->  
              expect(getSource(engine.tag('style')[1])).to.equal ".css-simple-dump{height:100px;}"
              clone.parentNode.removeChild(clone)

              engine.once 'solve', (e) ->  
                expect(getSource(engine.tag('style')[1])).to.equal ""
                done()
    
    describe 'nested', ->
      engine = null
    
      it 'should dump', (done) ->
        container.innerHTML =  """
          <div class="outer">
            <div class="innie-outie">
              <div id="css-inner-dump-1"></div>
            </div>
          </div>
          <div class="outie">
            <div class="innie-outie">
              <div id="css-inner-dump-2"></div>
            </div>
          </div>
          <style type="text/gss" scoped>
            .outer, .outie {
              #css-inner-dump-1 {
                width: == 100;
                height: 100px;
                z-index: 5;
              }
              .innie-outie {
                #css-inner-dump-2 {
                  height: 200px;
                }
              }
            }
          </style>
          """
        engine.once 'solve', ->
          expect(getSource(engine.tag('style')[1])).to.equal """
            .outer #css-inner-dump-1, .outie #css-inner-dump-1{height:100px;z-index:5;}
            .outer .innie-outie #css-inner-dump-2, .outie .innie-outie #css-inner-dump-2{height:200px;}
            """

          el = engine.class("innie-outie")[1]
          el.setAttribute('class', 'innie-outie-zzz')

          engine.once 'solve', ->
            expect(getSource(engine.tag('style')[1])).to.equal """
              .outer #css-inner-dump-1, .outie #css-inner-dump-1{height:100px;z-index:5;}
              """
            el.setAttribute('class', 'innie-outie')

            engine.once 'solve', ->
              expect(getSource(engine.tag('style')[1])).to.equal """
                .outer #css-inner-dump-1, .outie #css-inner-dump-1{height:100px;z-index:5;}
                .outer .innie-outie #css-inner-dump-2, .outie .innie-outie #css-inner-dump-2{height:200px;}
                """

              done()

    describe 'custom selectors', ->
      it 'should dump', (done) ->
        container.innerHTML =  """
          <div class="outer">
            <div class="innie-outie">
              <div id="css-inner-dump-1"></div>
            </div>
          </div>
          <div class="outie">
            <div class="innie-outie">
              <div id="css-inner-dump-2"></div>
            </div>
          </div>
          <style type="text/gss" scoped>
              .innie-outie {
                !> * {
                  height: 200px;

                  #css-inner-dump-2 {
                    z-index: -1;
                  }
                }
              }
          </style>
          """
        engine.once 'solve', ->
          expect(getSource(engine.tag('style')[1])).to.equal """
            [matches~=".innie-outie↓!>*"]{height:200px;}
            [matches~=".innie-outie↓!>*"] #css-inner-dump-2{z-index:-1;}
            """

          A = engine.class("innie-outie")[0]
          B = engine.class("innie-outie")[1]

          B.setAttribute('class', 'innie-outie-zzz')
          engine.once 'solve', ->
            expect(getSource(engine.tag('style')[1])).to.equal """
              [matches~=".innie-outie↓!>*"]{height:200px;}
              """
            B.setAttribute('class', 'innie-outie')

            engine.once 'solve', ->
              expect(getSource(engine.tag('style')[1])).to.equal """
                [matches~=".innie-outie↓!>*"]{height:200px;}
                [matches~=".innie-outie↓!>*"] #css-inner-dump-2{z-index:-1;}
                """
              A.setAttribute('class', 'innie-outie-zzz')

              engine.once 'solve', ->
                expect(getSource(engine.tag('style')[1])).to.equal """
                  [matches~=".innie-outie↓!>*"]{height:200px;}
                  [matches~=".innie-outie↓!>*"] #css-inner-dump-2{z-index:-1;}
                  """
                B.setAttribute('class', 'innie-outie-zzz')

                engine.once 'solve', ->
                  expect(getSource(engine.tag('style')[1])).to.equal ""

                  A.setAttribute('class', 'innie-outie')


                  engine.once 'solve', ->
                    expect(getSource(engine.tag('style')[1])).to.equal """
                      [matches~=".innie-outie↓!>*"]{height:200px;}
                      """
                    B.setAttribute('class', 'innie-outie')

                    engine.once 'solve', ->
                      expect(getSource(engine.tag('style')[1])).to.equal """
                        [matches~=".innie-outie↓!>*"]{height:200px;}
                        [matches~=".innie-outie↓!>*"] #css-inner-dump-2{z-index:-1;}
                        """
                      done()
    describe 'conditional', ->
      it 'should dump', (done) ->
        container.innerHTML =  """
          <div class="outer">
            <div class="innie-outie">
              <div id="css-inner-dump-1"></div>
            </div>
          </div>
          <div class="outie">
            <div class="innie-outie">
              <div id="css-inner-dump-2"></div>
            </div>
          </div>
          <style type="text/gss" scoped>
            .outer, .outie {
              @if $A > 0 {
                .innie-outie {
                  #css-inner-dump-2 {
                    width: 100px;
                  }
                }
              }
              
              #css-inner-dump-1 {
                z-index: 5;

                @if $B > 0 {
                  height: 200px;
                }
              }
            }
          </style>
          """
        zIndexAndHeight = (document.all && !window.atob || document.body.style.msTouchAction?) && 'height:200px;z-index:5;' || 'z-index:5;height:200px;'
        engine.once 'solve', ->
          expect(getSource(engine.tag('style')[1])).to.equal """
            .outer #css-inner-dump-1, .outie #css-inner-dump-1{z-index:5;}
            """
          engine.solve
            A: 1
          , ->
            expect(getSource(engine.tag('style')[1])).to.equal """
              [matches~=".outer,.outie↓@$[A]>0↓.innie-outie↓#css-inner-dump-2"]{width:100px;}
              .outer #css-inner-dump-1, .outie #css-inner-dump-1{z-index:5;}
              """
            engine.solve
              B: 1
            , ->
              expect(getSource(engine.tag('style')[1])).to.equal """
                [matches~=".outer,.outie↓@$[A]>0↓.innie-outie↓#css-inner-dump-2"]{width:100px;}
                .outer #css-inner-dump-1, .outie #css-inner-dump-1{#{zIndexAndHeight}}
                """
              engine.solve
                A: 0
              , ->
                expect(getSource(engine.tag('style')[1])).to.equal """
                  .outer #css-inner-dump-1, .outie #css-inner-dump-1{#{zIndexAndHeight}}
                  """
                engine.solve
                  B: 0
                , ->
                  expect(getSource(engine.tag('style')[1])).to.equal """
                    .outer #css-inner-dump-1, .outie #css-inner-dump-1{z-index:5;}
                    """
                  engine.solve
                    B: 1
                  , ->
                    expect(getSource(engine.tag('style')[1])).to.equal """
                      .outer #css-inner-dump-1, .outie #css-inner-dump-1{#{zIndexAndHeight}}
                      """
                    engine.solve
                      A: 1
                    , ->
                      expect(getSource(engine.tag('style')[1])).to.equal """
                        [matches~=".outer,.outie↓@$[A]>0↓.innie-outie↓#css-inner-dump-2"]{width:100px;}
                        .outer #css-inner-dump-1, .outie #css-inner-dump-1{#{zIndexAndHeight}}
                        """
                      engine.solve
                        B: 0
                      , ->
                        expect(getSource(engine.tag('style')[1])).to.equal """
                          [matches~=".outer,.outie↓@$[A]>0↓.innie-outie↓#css-inner-dump-2"]{width:100px;}
                          .outer #css-inner-dump-1, .outie #css-inner-dump-1{z-index:5;}
                          """
                        done()
              
    describe 'conditional inverted', ->
      it 'should dump', (done) ->
        container.innerHTML =  """
          <div class="outer">
            <div class="innie-outie">
              <div id="css-inner-dump-1"></div>
            </div>
          </div>
          <div class="outie">
            <div class="innie-outie">
              <div id="css-inner-dump-2"></div>
            </div>
          </div>
          <style type="text/gss" scoped>
            .outer, .outie {
              #css-inner-dump-1 {
                @if $B > 0 {
                  height: 200px;
                }
                z-index: 5;
              }
              @if $A > 0 {
                .innie-outie {
                  #css-inner-dump-2 {
                    width: 100px;
                  }
                }
              }
            }
          </style>
          """
        zIndexAndHeight = (document.all && !window.atob || document.body.style.msTouchAction?) && 'height:200px;z-index:5;' || 'z-index:5;height:200px;'
        engine.once 'solve', ->
          expect(getSource(engine.tag('style')[1])).to.equal """
            .outer #css-inner-dump-1, .outie #css-inner-dump-1{z-index:5;}
            """
          engine.solve
            A: 1
          , ->
            expect(getSource(engine.tag('style')[1])).to.equal """
              .outer #css-inner-dump-1, .outie #css-inner-dump-1{z-index:5;}
              [matches~=".outer,.outie↓@$[A]>0↓.innie-outie↓#css-inner-dump-2"]{width:100px;}
              """
            engine.solve
              B: 1
            , ->
              expect(getSource(engine.tag('style')[1])).to.equal """
                .outer #css-inner-dump-1, .outie #css-inner-dump-1{#{zIndexAndHeight}}
                [matches~=".outer,.outie↓@$[A]>0↓.innie-outie↓#css-inner-dump-2"]{width:100px;}
                """
              engine.solve
                A: 0
              , ->
                expect(getSource(engine.tag('style')[1])).to.equal """
                  .outer #css-inner-dump-1, .outie #css-inner-dump-1{#{zIndexAndHeight}}
                  """
                engine.solve
                  B: 0
                , ->
                  expect(getSource(engine.tag('style')[1])).to.equal """
                    .outer #css-inner-dump-1, .outie #css-inner-dump-1{z-index:5;}
                    """
                  engine.solve
                    B: 1
                  , ->
                    expect(getSource(engine.tag('style')[1])).to.equal """
                      .outer #css-inner-dump-1, .outie #css-inner-dump-1{#{zIndexAndHeight}}
                      """
                    engine.solve
                      A: 1
                    , ->
                      expect(getSource(engine.tag('style')[1])).to.equal """
                        .outer #css-inner-dump-1, .outie #css-inner-dump-1{#{zIndexAndHeight}}
                        [matches~=".outer,.outie↓@$[A]>0↓.innie-outie↓#css-inner-dump-2"]{width:100px;}
                        """
                      engine.solve
                        B: 0
                      , ->
                        expect(getSource(engine.tag('style')[1])).to.equal """
                          .outer #css-inner-dump-1, .outie #css-inner-dump-1{z-index:5;}
                          [matches~=".outer,.outie↓@$[A]>0↓.innie-outie↓#css-inner-dump-2"]{width:100px;}
                          """
                        done()

    xdescribe 'imported', ->
      it 'should dump', (done) ->
        container.innerHTML =  """
          <div class="outer">
            <button></button>
            <button></button>
          </div>
          <div class="outie">
            <button></button>
            <button></button>
          </div>
          <style type="text/gss" scoped>
            .outer, .outie {
              @import fixtures/external-file-css1.gss;
            }
          </style>
          """
        engine.once 'solve', ->
          expect(getSource(engine.tag('style')[1])).to.equal """
            .outer button, .outie button{z-index:1;}
            """
          for el in engine.tag('div')
            el.className = ''

          engine.then ->
            expect(getSource(engine.tag('style')[1])).to.equal """
              """
            engine.tag('div')[0].className = 'outer'
            
            engine.then ->
              expect(getSource(engine.tag('style')[1])).to.equal """
                .outer button, .outie button{z-index:1;}
                """
              done()

  
  # CCSS
  # ===========================================================      
  
  describe "CCSS", ->
  
    describe 'expression chain', ->  
      it 'should compute values', (done) ->  
        engine.once 'solve', (e) ->     
          expect(engine.values).to.eql 
            "c": 10
            "x": 0
            "y": 500
            "z": 510
          done()                               
        container.innerHTML =  """
            <style type="text/gss" scoped>              
              [c] == 10 !require;
              0 <= [x] <= 500;
              500 == [y] == 500;
              
              0 <= [z] == [c] + [y] !strong100;
            </style>
          """
          
    describe 'expression chain w/ queryBound connector', ->  
      it 'should be ok', (done) ->                                 
        container.innerHTML =  """
            <div id="billy"></div>
            <style type="text/gss" scoped>              
              [grid] == 36;
              0 <= #billy[x] == [grid];
            </style>
          """
        engine.once 'solve', (e) ->     
          expect(engine.values).to.eql 
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
        engine.once 'solve', (e) ->
          style = document.getElementById('non-pixel').style      
          assert (Number(style['z-index']) is 10) or (Number(style['zIndex']) is 10), 'correct z-index'
          assert Number(style['opacity']) is .5, 'correct opacity'
          done()
          
    describe 'order of operations', ->  
      it 'should compute values', (done) ->                                 
        container.innerHTML =  """
            <style type="text/gss" scoped>              
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
        engine.once 'solve', (e) ->
          expect(engine.values).to.eql 
            "w": 100
            "igap": 3
            "ogap": 10
            "md": 20
            "span3": 66
            "blah": 70
            "blah2": 70
            "md2": 71 / 4
          done()

    describe 'scoped order dependent selectors', ->
      it 'should deliver', (done) ->
        container = document.createElement('div')
        container.style.left = 0
        container.style.top = 0
        container.style.position = 'absolute'
        window.$engine = engine = new GSS(container)
        document.body.appendChild(container)
        container.innerHTML = """
          <article id="article1">
            <section id="section11">
              <p id="p111"></p>
              <p id="p112"></p>
            </section>
            <section id="section12">
              <p id="p121"></p>
              <p id="p122"></p>
            </section>
          </article>
          <article id="article2">
            <section id="section21">
              <p id="p211"></p>
              <p id="p212"></p>
            </section>
            <section id="section22">
              <p id="p221"></p>
              <p id="p222"></p>
            </section>
          </article>

          <style type="text/gss">
            p {
              height: == 50;
              width: == 50;
            }

            article {
              @h |(& section)-...| in(::);

              section {
                @h |(& p)...| in(::);
              }
            }
          </style>
        """
        engine.then ->
          done()

    describe 'simpliest order dependent selectors', ->
      it 'should work in global scope', (done) ->                        
        container.innerHTML =  """
            <style type="text/gss">             
              (.a:first)[left] == 111;              
              (.a:last)[left] == 222;
            </style>
            <div id="a1" class="a"></div>
            <div id="a2" class="a"></div> 
            <div id="a3" class="a"></div> 
        """
        engine.once 'solve', ->
          expect(engine.values).to.eql
            "$a1[x]": 111,
            "$a3[x]": 222,

          container.appendChild(engine.id('a1'))
          engine.once 'solve', ->
          
            expect(engine.values).to.eql
              "$a2[x]": 111,
              "$a1[x]": 222,

            container.innerHTML = ""
            engine.once 'solve', ->
              expect(engine.values).to.eql {}
              done()

      it 'should work in a css rule', (done) ->                        
        container.innerHTML =  """
            <style type="text/gss">                            
              .a {
                (&:next)[left] == 666;
                (&:previous)[left] == 111;
              }       
            </style>
            <div id="a1" class="a"></div>
            <div id="a2" class="a"></div> 
        """
        engine.once 'solve', ->
          expect(engine.values).to.eql
            "$a1[x]": 111,
            "$a2[x]": 666

          container.appendChild(engine.id('a1'))
          engine.once 'solve', ->
          
            expect(engine.values).to.eql
              "$a1[x]": 666,
              "$a2[x]": 111

            container.innerHTML = ""
            engine.once 'solve', ->
              expect(engine.values).to.eql {}
              done()

    describe 'simple order dependent selectors', ->
      it 'should compute values', (done) ->                        
        container.innerHTML =  """
            <style type="text/gss">                            
              .a {
                (&:first)[left] == 0;
                &[width] == 100;
                (&:previous)[right] == &[left];
              }       
            </style>
            <div id="a1" class="a"></div>
            <div id="a2" class="a"></div>
            <div id="a3" class="a"></div> 
        """
        engine
        engine.once 'solve', ->
          expect(engine.values).to.eql
            "$a1[width]": 100,
            "$a2[width]": 100,
            "$a3[width]": 100,
            "$a1[x]": 0,
            "$a2[x]": 100,
            "$a3[x]": 200,
          a3 = engine.id('a3')
          a3.parentNode.removeChild(a3)
          engine.once 'solve', ->
            expect(engine.values).to.eql
              "$a1[width]": 100,
              "$a2[width]": 100,
              "$a1[x]": 0,
              "$a2[x]": 100,
            engine.scope.appendChild(a3)

            engine.once 'solve', ->
              expect(engine.values).to.eql
                "$a1[width]": 100,
                "$a2[width]": 100,
                "$a3[width]": 100,
                "$a1[x]": 0,
                "$a2[x]": 100,
                "$a3[x]": 200,
              a1 = engine.id('a1')
              a1.parentNode.removeChild(a1)

              engine.once 'solve', ->
                expect(engine.values).to.eql
                  "$a2[width]": 100,
                  "$a3[width]": 100,
                  "$a2[x]": 0,
                  "$a3[x]": 100,
                engine.scope.appendChild(a1)

                engine.once 'solve', ->
                  expect(engine.values).to.eql
                    "$a1[width]": 100,
                    "$a2[width]": 100,
                    "$a3[width]": 100,
                    "$a2[x]": 0,
                    "$a3[x]": 100,
                    "$a1[x]": 200,
                  a3 = engine.id('a3')
                  a3.parentNode.removeChild(a3)
                  engine.once 'solve', ->
                    expect(engine.values).to.eql
                      "$a1[width]": 100,
                      "$a2[width]": 100,
                      "$a2[x]": 0,
                      "$a1[x]": 100
                    divs = engine.tag('div')
                    while divs[0]
                      divs[0].parentNode.removeChild(divs[0])
                    engine.once 'solve', ->
                      expect(engine.values).to.eql {}

                      done()
    describe 'css binding', ->
      describe 'simple', ->
        describe 'numerical properties', ->
          it 'should compute value when there is no regular value set', (done) ->                                 
            engine.once 'solve', (e) ->
              expect(stringify engine.values).to.eql stringify
                "$b1[z-index]": 3
                "$a1[intrinsic-z-index]": 2
              done()
            container.innerHTML =  """
                <style>
                  #a1 {
                    position: relative;
                    z-index: 2;
                  }
                </style>
                <style type="text/gss"> 
                  #b1[z-index] == #a1[intrinsic-z-index] + 1;
                </style>
                <div class="a" id="a1"></div>
                <div class="b" id="b1"></div>
              """

          it 'should use inline value', (done) ->                                 
            engine.once 'solve', (e) ->
              expect(stringify engine.values).to.eql stringify
                "$b1[z-index]": 3
                "$a1[intrinsic-z-index]": 2
              done()
            container.innerHTML =  """
                <style type="text/gss"> 
                  #b1[z-index] == #a1[intrinsic-z-index] + 1;
                </style>
                <div class="a" id="a1" style="z-index: 2"></div>
                <div class="b" id="b1"></div>
              """

        describe 'length properties', ->
          it 'should compute linear equasions', (done) ->                                 
            engine.once 'solve', (e) ->
              expect(stringify engine.values).to.eql stringify
                "$b1[border-left-width]": -2
                "$a1[intrinsic-border-top-width]": 2
              done()
            container.innerHTML =  """
                <style>
                  #a1 {
                    border: 2px solid #000;
                  }
                </style>
                <style type="text/gss"> 
                  #b1[border-left-width] == -1 * #a1[intrinsic-border-top-width];
                </style>
                <div class="a" id="a1"></div>
                <div class="b" id="b1"></div>
              """

          xit 'should simplify non-linear equasions to linear', (done) ->                                 
            count = 0
            listener = (e) ->
              if ++count == 1
                expect(stringify engine.values).to.eql stringify
                  "multiplier": 2
                  "$b1[border-left-width]": 4
                engine.solve 
                  multiplier: 3
              else if count == 2
                expect(stringify engine.values).to.eql stringify
                  "multiplier": 3
                  "$b1[border-left-width]": 6
                engine.id('a1').style.border = '3px solid #000'
              else if count == 3
                expect(stringify engine.values).to.eql stringify
                  "multiplier": 3
                  "$b1[border-left-width]": 9
                engine.removeEventListener('solve', listener)
                done()
            engine.addEventListener 'solve', listener


            container.innerHTML =  """
                <style>
                  #a1 {
                    border: 2px solid #000;
                  }
                </style>
                <style type="text/gss"> 
                  [multiplier] == 2;
                  #b1[border-left-width] == [multiplier] * #a1[intrinsic-border-top-width];
                </style>
                <div class="a" id="a1"></div>
                <div class="b" id="b1"></div>
              """

          xit 'should detect non-linearity deep in expression', (done) ->                                 
            count = 0
            listener = (e) ->
              if ++count == 1
                expect(stringify engine.values).to.eql stringify
                  "$a1[intrinsic-border-top-width]": 2
                  "multiplier": 2
                  "$b1[border-left-width]": 6
                engine.values.suggest 'multiplier', 3
              else if count == 2
                expect(stringify engine.values).to.eql stringify
                  "$a1[intrinsic-border-top-width]": 2
                  "multiplier": 3
                  "$b1[border-left-width]": 9
                engine.id('a1').style.border = '3px solid #000'
              else if count == 3
                expect(stringify engine.values).to.eql stringify
                  "$a1[intrinsic-border-top-width]": 3
                  "multiplier": 3
                  "$b1[border-left-width]": 12
                engine.removeEventListener('solve', listener)
                done()
            engine.addEventListener 'solve', listener


            container.innerHTML =  """
                <style>
                  #a1 {
                    border: 2px solid #000;
                  }
                </style>
                <style type="text/gss"> 
                  [multiplier] == 2;
                  #b1[border-left-width] == [multiplier] * (1 + #a1[intrinsic-border-top-width]);
                </style>
                <div class="a" id="a1"></div>
                <div class="b" id="b1"></div>
              """
          
    describe 'temporary bound to intrinsics', ->
      it 'should bind elements with itself', (done) ->                            
        container.innerHTML =  """
            <style type="text/gss">
              .a {
                ::[width] == ::[intrinsic-width];
              } 
            </style>
            <div id="a1" class="a" style=" display: inline-block;"><span style="width: 100px; display: inline-block;">3</span></div>
            <div id="a2" class="a" style=" display: inline-block;"><span style="width: 100px; display: inline-block;">3</span></div>
            <div id="a3" class="a" style=" display: inline-block;"><span style="width: 100px; display: inline-block;">3</span></div>
          """
        engine.once 'solve', (e) ->
          expect(engine.values).to.eql 
            "$a1[intrinsic-width]": 100
            "$a2[intrinsic-width]": 100
            "$a3[intrinsic-width]": 100
            "$a1[width]": 100
            "$a2[width]": 100
            "$a3[width]": 100
          a1 = engine.id('a1')
          a1.parentNode.removeChild(a1)
          engine.once 'solve', (e) ->
            expect(engine.updated.solution).to.eql 
              "$a1[intrinsic-width]": null
              "$a1[width]": null
            done()

    describe 'equal simple selector on the both sides', ->
      it 'should bind elements with itself', (done) ->                            
        container.innerHTML =  """
            <style type="text/gss" scoped>                            
              [x] == 100;
              .a {
                ::[x] == 10;
              } 
              .a[y] == .a[x];
            </style>
            <div id="a1" class="a"></div>
            <div id="a2" class="a"></div>
            <div id="a3" class="a"></div>
          """
        engine.once 'solve', (e) ->
          expect(engine.values).to.eql 
            "x": 100
            "$a1[x]": 10
            "$a2[x]": 10
            "$a3[x]": 10
            "$a1[y]": 10
            "$a2[y]": 10
            "$a3[y]": 10
          b3 = engine.id('b3')
          done()

    describe 'complex plural selectors on the left', -> 
      it 'should compute values', (done) ->                                 
        container.innerHTML =  """
            <style type="text/gss" scoped>                            
              [x] == 100;
              (.a !+ .a)[x] == .b[x] == [x];          
            </style>
            <div id="a1" class="a"></div>
            <div id="a2" class="a"></div>
            <div id="a3" class="a"></div>            
            <div id="b1" class="b"></div>
            <div id="b2" class="b"></div>
            <div id="b3" class="b"></div>
          """
        engine.once 'solve', (e) ->
          expect(engine.values).to.eql 
            "x": 100
            "$a1[x]": 100
            "$a2[x]": 100
            "$b1[x]": 100
            "$b2[x]": 100
            "$b3[x]": 100
          b3 = engine.id('b3')
          b3.parentNode.removeChild(b3)

          engine.once 'solve', (e) ->
            expect(engine.values).to.eql 
              "x": 100
              "$a1[x]": 100
              "$a2[x]": 100
              "$b1[x]": 100
              "$b2[x]": 100

            b2 = engine.id('b2')
            b2.parentNode.removeChild(b2)
            engine.once 'solve', (e) ->
              expect(engine.values).to.eql 
                "x": 100
                "$a1[x]": 100
                "$b1[x]": 100
              engine.scope.appendChild(b2)
              engine.once 'solve', (e) ->
                expect(engine.values).to.eql 
                  "x": 100
                  "$a1[x]": 100
                  "$a2[x]": 100
                  "$b1[x]": 100
                  "$b2[x]": 100
                a1 = engine.id('a1')
                a1.parentNode.removeChild(a1)
                engine.once 'solve', (e) ->
                  expect(engine.values).to.eql 
                    "x": 100
                    "$a2[x]": 100
                    "$b1[x]": 100
                    "$b2[x]": 100
                  b2 = engine.id('b2')
                  b2.parentNode.removeChild(b2)
                  engine.once 'solve', (e) ->
                    expect(engine.values).to.eql 
                      "x": 100
                      "$a2[x]": 100
                      "$b1[x]": 100
                    engine.scope.insertBefore(a1, engine.id('b1'))
                    engine.scope.appendChild(b2)
                    engine.once 'solve', (e) ->
                      expect(engine.values).to.eql 
                        "x": 100
                        "$b1[x]": 100
                        "$b2[x]": 100
                        "$a2[x]": 100
                        "$a3[x]": 100
                        divs = engine.tag('div')
                        while divs[0]
                          divs[0].parentNode.removeChild(divs[0])
                        window.zz = true
                        engine.once 'solve', (e) ->
                          expect(engine.values).to.eql 
                            "x": 100

                          engine.scope.innerHTML = ""

                          engine.once 'solve', (e) ->
                            expect(engine.values).to.eql {}
                            done()

    describe 'order dependent complex selectors', ->
      it 'should compute values', (done) ->                        
        container.innerHTML =  """
            <style type="text/gss" id="style">                            
              #style !> > .a {
                (&:first)[left] == 0;
                &[width] == 100;
                (&:previous)[right] == &[left];
              }       
            </style>
            <div id="a1" class="a"></div>
            <div id="a2" class="a"></div>
            <div id="a3" class="a"></div> 
        """
        engine
        engine.once 'solve', ->
          expect(engine.values).to.eql
            "$a1[width]": 100,
            "$a2[width]": 100,
            "$a3[width]": 100,
            "$a1[x]": 0,
            "$a2[x]": 100,
            "$a3[x]": 200,
          a3 = engine.id('a3')
          a3.parentNode.removeChild(a3)
          engine.once 'solve', ->
            expect(engine.values).to.eql
              "$a1[width]": 100,
              "$a2[width]": 100,
              "$a1[x]": 0,
              "$a2[x]": 100,
            engine.scope.appendChild(a3)
            engine.once 'solve', ->
              expect(engine.values).to.eql
                "$a1[width]": 100,
                "$a2[width]": 100,
                "$a3[width]": 100,
                "$a1[x]": 0,
                "$a2[x]": 100,
                "$a3[x]": 200,
              a1 = engine.id('a1')
              a1.parentNode.removeChild(a1)
              engine.once 'solve', ->
                expect(engine.values).to.eql
                  "$a2[width]": 100,
                  "$a3[width]": 100,
                  "$a2[x]": 0,
                  "$a3[x]": 100,
                engine.scope.appendChild(a1)

                engine.once 'solve', ->
                  expect(engine.values).to.eql
                    "$a1[width]": 100,
                    "$a2[width]": 100,
                    "$a3[width]": 100,
                    "$a2[x]": 0,
                    "$a3[x]": 100,
                    "$a1[x]": 200,
                  a3 = engine.id('a3')
                  a3.parentNode.removeChild(a3)

                  engine.once 'solve', ->
                    expect(engine.values).to.eql
                      "$a1[width]": 100,
                      "$a2[width]": 100,
                      "$a2[x]": 0,
                      "$a1[x]": 100
                    divs = engine.tag('div')
                    while divs[0]
                      divs[0].parentNode.removeChild(divs[0])
                    engine.once 'solve', ->
                      expect(engine.values).to.eql {}

                      done()

    describe 'order dependent selectors with comma', ->
      it 'should compute values', (done) ->                        
        container.innerHTML =  """
            <style type="text/gss" id="style">                            
              #a2 ++ .a, #style ~~ .a {
                (&:first)[left] == 0;
                &[width] == 100;
                (&:previous)[right] == &[left];
              }       
            </style>
            <div id="a1" class="a"></div>
            <div id="a2" class="a"></div>
            <div id="a3" class="a"></div> 
        """
        engine
        engine.once 'solve', ->
          expect(engine.values).to.eql
            "$a1[width]": 100,
            "$a2[width]": 100,
            "$a3[width]": 100,
            "$a1[x]": 0,
            "$a2[x]": 100,
            "$a3[x]": 200,
          a3 = engine.id('a3')
          a3.parentNode.removeChild(a3)

          engine.once 'solve', ->
            expect(engine.values).to.eql
              "$a1[width]": 100,
              "$a2[width]": 100,
              "$a1[x]": 0,
              "$a2[x]": 100,
            engine.scope.appendChild(a3)

            engine.once 'solve', ->
              expect(engine.values).to.eql
                "$a1[width]": 100,
                "$a2[width]": 100,
                "$a3[width]": 100,
                "$a1[x]": 0,
                "$a2[x]": 100,
                "$a3[x]": 200,
              a1 = engine.id('a1')
              a1.parentNode.removeChild(a1)

              engine.once 'solve', ->
                expect(engine.values).to.eql
                  "$a2[width]": 100,
                  "$a3[width]": 100,
                  "$a2[x]": 0,
                  "$a3[x]": 100,
                engine.scope.appendChild(a1)

                engine.once 'solve', ->
                  expect(engine.values).to.eql
                    "$a1[width]": 100,
                    "$a2[width]": 100,
                    "$a3[width]": 100,
                    "$a2[x]": 0,
                    "$a3[x]": 100,
                    "$a1[x]": 200,
                  a3 = engine.id('a3')
                  a3.parentNode.removeChild(a3)

                  engine.once 'solve', ->
                    expect(engine.values).to.eql
                      "$a1[width]": 100,
                      "$a2[width]": 100,
                      "$a2[x]": 0,
                      "$a1[x]": 100
                    divs = engine.tag('div')
                    while divs[0]
                      divs[0].parentNode.removeChild(divs[0])
                    engine.once 'solve', ->
                      expect(engine.values).to.eql {}

                      done()

    describe 'complex plural selectors on the right', -> 
      it 'should compute values', (done) ->                                 
        container.innerHTML =  """
            <style type="text/gss" scoped>                            
              [x] == 100;
              .a[x] == (.b !+ .b)[x] == [x];          
            </style>
            <div id="a1" class="a"></div>
            <div id="a2" class="a"></div>
            <div id="a3" class="a"></div>            
            <div id="b1" class="b"></div>
            <div id="b2" class="b"></div>
            <div id="b3" class="b"></div>
          """
        engine
        engine.once 'solve', (e) ->
          expect(engine.values).to.eql 
            "x": 100
            "$a1[x]": 100
            "$a2[x]": 100
            "$b1[x]": 100
            "$b2[x]": 100
          b3 = engine.id('b3')

          b3.parentNode.removeChild(b3)

          engine.once 'solve', (e) ->
            expect(engine.values).to.eql 
              "x": 100
              "$a1[x]": 100
              "$b1[x]": 100
            engine.scope.appendChild(b3)

            engine.once 'solve', (e) ->
              expect(engine.values).to.eql 
                "x": 100
                "$a1[x]": 100
                "$a2[x]": 100
                "$b1[x]": 100
                "$b2[x]": 100
              divs = engine.tag('div')
              while divs[0]
                divs[0].parentNode.removeChild(divs[0])

              engine.once 'solve', (e) ->
                expect(engine.values).to.eql 
                  "x": 100
                engine.scope.innerHTML = ""

                engine.once 'solve', (e) ->
                  expect(engine.values).to.eql {}
                  done()


    describe 'complex plural selectors on both sides', -> 
      it 'should compute values', (done) ->                                 
        container.innerHTML =  """
            <style type="text/gss" scoped>                            
              [x] == 100;
              (.a !+ .a)[x] == (.b !+ .b)[x] == [x];          
            </style>
            <div id="a1" class="a"></div>
            <div id="a2" class="a"></div>
            <div id="a3" class="a"></div>            
            <div id="b1" class="b"></div>
            <div id="b2" class="b"></div>
            <div id="b3" class="b"></div>
          """
        engine
        engine.once 'solve', (e) ->
          expect(engine.values).to.eql 
            "x": 100
            "$a1[x]": 100
            "$a2[x]": 100
            "$b1[x]": 100
            "$b2[x]": 100
          b3 = engine.id('b3')
          b3.parentNode.removeChild(b3)

          engine.once 'solve', (e) ->
            expect(engine.values).to.eql 
              "x": 100
              "$a1[x]": 100
              "$b1[x]": 100
            engine.scope.appendChild(b3)

            engine.once 'solve', (e) ->
              expect(engine.values).to.eql 
                "x": 100
                "$a1[x]": 100
                "$a2[x]": 100
                "$b1[x]": 100
                "$b2[x]": 100

              a1 = engine.id('a1')
              a1.parentNode.removeChild(a1)
              engine.once 'solve', (e) ->
                expect(engine.values).to.eql 
                  "x": 100
                  "$a2[x]": 100
                  "$b1[x]": 100
                  "$b2[x]": 100

                divs = engine.tag('div')
                while divs[0]
                  divs[0].parentNode.removeChild(divs[0])

                engine.once 'solve', (e) ->
                  expect(engine.values).to.eql 
                    "x": 100
                  engine.scope.innerHTML = ""

                  engine.once 'solve', (e) ->
                    expect(engine.values).to.eql {}
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
            <style type="text/gss" scoped>                            
              [x] == 100;
              .a[x] == .b[x] == [x];              
            </style>
          """
        engine.once 'solve', (e) ->
          expect(engine.values).to.eql 
            "x": 100
            "$a1[x]": 100
            "$a2[x]": 100
            "$a3[x]": 100
            "$b1[x]": 100
            "$b2[x]": 100
            "$b3[x]": 100
          
          a3 = engine.id('a3')
          a3.parentNode.removeChild(a3)

          engine.once 'solve', (e) ->
            expect(engine.values).to.eql 
              "x": 100
              "$a1[x]": 100
              "$a2[x]": 100
              "$b1[x]": 100
              "$b2[x]": 100
              "$b3[x]": 100
          
            b1 = engine.id('b1')
            b1.parentNode.removeChild(b1)
            window.zzzz = true

            engine.once 'solve', (e) ->
              expect(engine.values).to.eql 
                "x": 100
                "$a1[x]": 100
                "$a2[x]": 100
                "$b2[x]": 100
                "$b3[x]": 100
              done()
    
    describe 'WARN: unbalanced plural selectors', ->  
      it 'should compute values', (done) ->                                 
        container.innerHTML =  """
            <div id="a1" class="a"></div>
            <div id="a2" class="a"></div>
            <div id="a3" class="a"></div>            
            <div id="b1" class="b"></div>
            <div id="b2" class="b"></div>
            <div id="b3" class="b"></div>
            <div id="b4" class="b"></div>
            <style type="text/gss" scoped>                            
              [x] == 100;
              .a[x] == .b[x] == [x];              
            </style>
          """        
        engine
        engine.once 'solve', (e) ->
          expect(engine.values).to.eql 
            "x": 100
            "$a1[x]": 100
            "$a2[x]": 100
            "$a3[x]": 100
            "$b1[x]": 100
            "$b2[x]": 100
            "$b3[x]": 100
            "$b4[x]": 100
          a3 = engine.id('a3')
          a4 = a3.cloneNode()
          a4.id = 'a4'
          a3.parentNode.appendChild(a4)

          engine.once 'solve', (e) ->
            expect(engine.values).to.eql 
              "x": 100
              "$a1[x]": 100
              "$a2[x]": 100
              "$a3[x]": 100
              "$a4[x]": 100
              "$b1[x]": 100
              "$b2[x]": 100
              "$b3[x]": 100
              "$b4[x]": 100
            a1 = engine.id('a1')
            a1.parentNode.removeChild(a1)

            engine.once 'solve', (e) ->
              expect(engine.values).to.eql 
                "x": 100
                "$a2[x]": 100
                "$a3[x]": 100
                "$a4[x]": 100
                "$b1[x]": 100
                "$b2[x]": 100
                "$b3[x]": 100
                "$b4[x]": 100
              b4 = engine.id('b4')

              b4.parentNode.removeChild(b4)
              engine.once 'solve', (e) ->
                expect(engine.values).to.eql 
                  "x": 100
                  "$a2[x]": 100
                  "$a3[x]": 100
                  "$a4[x]": 100
                  "$b1[x]": 100
                  "$b2[x]": 100
                  "$b3[x]": 100

                b3 = engine.id('b3')
                b3.parentNode.removeChild(b3)

                engine.once 'solve', (e) ->
                  expect(engine.values).to.eql 
                    "x": 100
                    "$a2[x]": 100
                    "$a3[x]": 100
                    "$b1[x]": 100
                    "$b2[x]": 100
                  a2 = engine.id('a2')
                  a2.parentNode.removeChild(a2)

                  engine.once 'solve', (e) ->
                    expect(engine.values).to.eql 
                      "x": 100
                      "$a3[x]": 100
                      "$a4[x]": 100
                      "$b1[x]": 100
                      "$b2[x]": 100
                    divs = engine.tag('div')
                    while divs[0]
                      divs[0].parentNode.removeChild(divs[0])

                    engine.once 'solve', (e) ->
                      expect(engine.values).to.eql 
                        "x": 100
                      done()
    xdescribe ':not selector', -> 
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
                size: == ($ #sugar1)[intrinsic-size];
              }
              #sugar1[position] == #sugar2[center];              
            </style>
          """
        engine.once 'solve', (e) ->
          expect(engine.values).to.eql 
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
        engine.once 'solve', (e) ->
          expect(engine.values).to.eql 
            "$sync1[height]": 100
            "$sync1[intrinsic-width]": 100   
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
        engine.once 'solve', (e) ->
          expect(engine.values).to.eql 
            "$sync1[height]": 120      
            "$sync1[intrinsic-width]": 120            
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
        engine.once 'solve', (e) ->
          expect(engine.values).to.eql 
            "$sync1[height]": 100     
            "$sync1[intrinsic-width]": 100 
            "$sync1[test]": 0
          # do again
          container.insertAdjacentHTML('beforeend', '<div id="async1" class="sync"></div>')   
          engine.once 'solve', (e) ->
            expect(engine.values).to.eql 
              "$sync1[height]": 100
              "$sync1[test]": 0
              "$sync1[intrinsic-width]": 100 
              "$async1[height]": 100
              "$async1[test]": 0
              "$async1[intrinsic-width]": 100 
            done()
                  

  
  
  
  # Window
  # ===========================================================      
  
  describe "::window", ->
  
    describe 'center values', ->  
      it 'should compute values', (done) ->
        engine.once 'solve', (e) ->     
          w = document.documentElement.clientWidth
          cx = w / 2
          h = Math.min(window.innerHeight, document.documentElement.clientHeight)
          cy = h / 2
          expect(engine.values["center-x"]).to.eql cx
          expect(engine.values["center-y"]).to.eql cy
          done()                             
        container.innerHTML =  """
            <style type="text/gss" scoped>              
              [center-x] == ::window[center-x];
              [center-y] == ::window[center-y];
            </style>
          """
    describe 'position values', ->  
      it 'should compute values', (done) ->
        engine.once 'solve', (e) ->
          w = document.documentElement.clientWidth
          h = Math.min(window.innerHeight, document.documentElement.clientHeight)
          expect(engine.values["top"]).to.eql 0
          expect(engine.values["right"]).to.eql w
          expect(engine.values["bottom"]).to.eql h
          expect(engine.values["left"]).to.eql 0
          done()                             
        container.innerHTML =  """
            <style type="text/gss" scoped>
              [top] == ::window[top];
              [right] == ::window[right];
              [bottom] == ::window[bottom];
              [left] == ::window[left];
            </style>
          """
  
  # .gss files
  # ===========================================================
  
  describe 'External .gss files', ->
    
    @timeout 40000
    describe "single file", ->
    
      it 'should compute', (done) ->
        counter = 0
        listen = (e) ->     
          counter++
          if counter == 1
            expect(engine.values).to.eql 
              "external-file": 1000
            container.innerHTML = ""
          else
            expect(engine.values).to.eql {}
            engine.removeEventListener 'solve', listen
            done()     
                       
        engine.addEventListener 'solve', listen
    
        container.innerHTML =  """
            <link rel="stylesheet" type="text/gss" href="./fixtures/external-file.gss" scoped></link>
          """

    describe "multiple files", ->
    
      it 'should compute', (done) ->
        counter = 0
        listen = (e) ->
          counter++
          if counter == 1
            expect(engine.values).to.eql 
              "external-file": 1000
              "external-file-2": 2000
              "external-file-3": 3000
            container.innerHTML = ""
          else
            expect(engine.values).to.eql {}
            engine.removeEventListener 'solve', listen
            done()     
                     
        engine.addEventListener 'solve', listen
    
        container.innerHTML =  """
            <link rel="stylesheet" type="text/gss" href="./fixtures/external-file.gss" scoped></link>
            <link rel="stylesheet" type="text/gss" href="./fixtures/external-file-2.gss" scoped></link>
            <link rel="stylesheet" type="text/gss" href="./fixtures/external-file-3.gss" scoped></link>
          """

    describe "nested files", ->
    
      it 'should compute', (done) ->
        counter = 0
        inline = null
        external = null
        listen = (e) ->
          counter++
          if counter == 1
            expect(engine.values).to.eql 
              "external-file": 1000
              "external-file-2": 2000
              "external-file-3": 3000
            inline = engine.id('inline')
            inline.parentNode.removeChild(inline)
          else if counter == 2
            expect(engine.values).to.eql 
              "external-file-2": 2000
              "external-file-3": 3000
            engine.scope.appendChild(inline)
          else if counter == 3
            expect(engine.values).to.eql 
              "external-file": 1000
              "external-file-2": 2000
              "external-file-3": 3000
            external = engine.id('external')
            external.parentNode.removeChild(external)
          else if counter == 4
            expect(engine.values).to.eql 
              "external-file": 1000
            engine.scope.appendChild(external)
          else if counter == 5
            expect(engine.values).to.eql 
              "external-file": 1000
              "external-file-2": 2000
              "external-file-3": 3000
            engine.scope.innerHTML = ''
          else 
            expect(engine.values).to.eql {}

            engine.removeEventListener 'solve', listen
            done()    
                     
        engine.addEventListener 'solve', listen
    
        container.innerHTML =  """
            <style type="text/gss" scoped id="inline">
              @import ./fixtures/external-file.gss;
            </style>
            <link rel="stylesheet" id="external" type="text/gss" href="./fixtures/external-file-2-3.gss" scoped></link>
          """

  
  
  # VGL
  # ===========================================================
  
  describe 'VGL', ->  
    
    xdescribe 'grid-template', ->
      engine = null
    
      it 'vars', (done) ->
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
            assert(engine.values[key] is val, "#{engine.vars[key]} should be #{val}")
          done()
        engine.once 'solve', listener
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
    
    xdescribe 'grid-rows & grid cols', ->
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
      
      xdescribe 'flat', ->
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
          engine.once 'solve', listener
      
      xdescribe 'cross-sheet', ->
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
          engine.once 'solve', listener
      
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
            GSS.console.log engine.vars
            for key, val of target
              assert engine.vars[key] is val, "#{key} is #{engine.vars[key]}"
            done()
          engine.once 'solve', listener
      ###
      
  
  
  # @if @else
  # ===========================================================
  
  describe "@if @else", ->
    describe '|| and :: in condition', ->
      it 'should compute values', (done) ->
        
        engine.data.merge '$button1[t]': 500, '$button2[t]': 400

        engine.once 'solve', ->     
          expect(engine.values).to.eql 
            "$button1[x]": 96
            "$button2[x]": 1
            "$button1[t]": 500
            "$button2[t]": 400

          engine.once 'solve', ->
            expect(engine.values).to.eql 
              "$button1[x]": 1
              "$button2[x]": 96
              "$button1[t]": 400
              "$button2[t]": 100

            engine.once 'solve', ->
              expect(engine.values).to.eql 
                "$button1[x]": 1
                "$button2[x]": 1
                "$button1[t]": 400
                "$button2[t]": 400
              done()   

            engine.data.merge '$button2[t]': 400

          engine.data.merge '$button1[t]': 400, '$button2[t]': 100

        container.innerHTML =  """
            <style type="text/gss">
              button {
                @if &[t] >= 450 || &[t] < 250 {          
                  &[x] == 96;
                }

                @else {  
                  &[x] == 1;  
                }
              }
            </style>
            <button id="button1"></button>
            <button id="button2"></button>
          """

    describe '|| over two variables', ->
      it 'should compute values', (done) ->
        
        engine.data.merge A: 200, B: 200

        engine.once 'solve', ->     
          expect(engine.values).to.eql 
            "A": 200
            "B": 200
            "a": 200
            "b": 200
            "x": 1

          engine.once 'solve', ->     
            expect(engine.values).to.eql 
              "A": 500
              "B": 200
              "a": 500
              "b": 200
              "x": 96

            engine.once 'solve', ->     
              expect(engine.values).to.eql 
                "A": 200
                "B": 200
                "a": 200
                "b": 200
                "x": 1

              engine.once 'solve', ->     
                expect(engine.values).to.eql 
                  "A": 200
                  "B": 500
                  "a": 200
                  "b": 500
                  "x": 96

                engine.once 'solve', ->     
                  expect(engine.values).to.eql 
                    "A": 200
                    "B": 200
                    "a": 200
                    "b": 200
                    "x": 1


                  engine.once 'solve', ->     
                    expect(engine.values).to.eql 
                      "A": 500
                      "B": 500
                      "a": 500
                      "b": 500
                      "x": 96

                    engine.once 'solve', ->     
                      expect(engine.values).to.eql 
                        "A": 200
                        "B": 200
                        "a": 200
                        "b": 200
                        "x": 1
                      done()
                      
                    engine.data.merge A: 200, B: 200
                  engine.data.merge A: 500, B: 500
                engine.data.merge B: 200
              engine.data.merge B: 500
            engine.data.merge A: 200

          engine.data.merge A: 500
    
        container.innerHTML =  """
            <style type="text/gss" scoped>
            [a] == [A];
            [b] == [B];
        
            @if [a] >= 400 || [b] >= 400 {          
              [x] == 96;
            }

            @else {  
              [x] == 1;  
            }
            </style>
          """


    describe '&& over two variables', ->
      it 'should compute values', (done) ->
        
        engine.data.merge input: 200

        engine.once 'solve', ->     
          expect(engine.values).to.eql 
            "input": 200
            "t": 500
            "x": 96
            "z": 200

          engine.once 'solve', ->     
            expect(engine.values).to.eql 
              "input": 500
              "t": 500
              "x": 1
              "z": 500

            engine.once 'solve', ->     
              expect(engine.values).to.eql 
                "input": 200
                "t": 500
                "x": 96
                "z": 200

              done()
            engine.data.merge input: 200

          engine.data.merge input: 500
    
        container.innerHTML =  """
            <style type="text/gss" scoped>
            [t] == 500;
            [z] == [input];
        
            @if [t] >= 400 && [z] < 450 {          
              [x] == 96;
            }

            @else {  
              [x] == 1;  
            }
            </style>
          """

    describe 'flat @if @else w/o queries', ->
  
      it 'should compute values', (done) ->
        listen = (e) ->     
          expect(engine.values).to.eql 
            "t": 500
            "x": 1
          done()     
                     
        engine.once 'solve', listen
    
        container.innerHTML =  """
            <style type="text/gss" scoped>
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
          expect(engine.values).to.eql 
            "t": 500
            "$b[width]": 1
          done()     
        container.innerHTML =  """
            <div id="b"></div>
            <style type="text/gss" scoped>
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
        engine.once 'solve', listen
        
  

    describe 'contextual @if @else', ->
  
      it 'should compute values', (done) ->
        listen = (e) ->     
          expect(engine.values).to.eql 
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
        engine.once 'solve', listen
    
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
                state: == 1;
              } @else {
                @if ::[width] > 10 and ::[height] > 10 {
                  state: == 2;
                } @else { 
                  @if ::[width] == 10 or ::[height] == 10 {
                    state: == 3;
                  }
                }
              }
            }
          
            </style>
          """
        engine.once 'solve', (e) ->     
          expect(engine.values).to.eql 
            "$box1[width]": 9
            "$box2[width]": 11
            "$box3[width]": 10
            "$box1[height]": 9
            "$box2[height]": 11
            "$box3[height]": 10
            "$box1[state]": 1
            "$box2[state]": 2
            "$box3[state]": 3
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
                state: == 1;
              } @else {
                @if ::[width] + ::[height] == 22 {
                  state: == 2;
                } @else {
                  @if ::[width] * ::[height] >= 99 {
                    state: == 3;
                  }
                }
              } 
            }
          
            </style>
          """
        engine.once 'solve', (e) ->
          expect(engine.values).to.eql 
            "$box1[width]": 9
            "$box2[width]": 11
            "$box3[width]": 10
            "$box1[height]": 9
            "$box2[height]": 11
            "$box3[height]": 10
            "$box1[state]": 1
            "$box2[state]": 2
            "$box3[state]": 3
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
                state: == 1;
              } @else {
                @if (::[width] + ::[height] == 22) and (::[width] == 11) {
                  state: == 2;
                } @else {
                  @if (::[width] * ::[height] >= 99) and (::[width] == 999999) {
                    state: == 4;
                  } @else {
                    @if (::[width] * ::[height] >= 99) and (::[width] == 10) {
                      state: == 3;
                    }
                  }
                }
              }
            }
          
            </style>
          """
        engine.once 'solve', (e) ->
          expect(engine.values).to.eql 
            "$box1[width]": 9
            "$box2[width]": 11
            "$box3[width]": 10
            "$box1[height]": 9
            "$box2[height]": 11
            "$box3[height]": 10
            "$box1[state]": 1
            "$box2[state]": 2
            "$box3[state]": 3
          done()
    
  
    
    describe 'TODO!!!! contextual @if @else with vanilla CSS', ->
  
      it 'should compute values', (done) ->
        listen = (e) ->
          expect(engine.id('box1').style.width).to.eql '9px'
          expect(engine.id('box2').style.width).to.eql '19px'
          #expect(window.getComputedStyle(engine.id("box1"),null).
          #  getPropertyValue("z-index")).to.equal "auto"
          #expect(window.getComputedStyle(engine.id("box2"),null).
          #  getPropertyValue("z-index")).to.equal "auto"

          expect(window.getComputedStyle(engine.id("box1"),null).
            getPropertyValue("margin-top")).to.equal "0px"
          expect(window.getComputedStyle(engine.id("box2"),null).
            getPropertyValue("margin-top")).to.equal "0px" 
          expect(window.getComputedStyle(engine.id("box1"),null).
            getPropertyValue("padding-top")).to.equal "1px"
          expect(window.getComputedStyle(engine.id("box2"),null).
            getPropertyValue("padding-top")).to.equal "1px"
          expect(engine.id("box1").style.paddingTop).to.eql ''
          expect(engine.id("box2").style.paddingTop).to.eql '' 
          expect(engine.id("box1").style.marginTop).to.eql ''
          expect(engine.id("box2").style.marginTop).to.eql ''   
          expect(String engine.id("box1").style.zIndex).to.eql '1'
          expect(String engine.id("box2").style.zIndex).to.eql '2'     
          done()          
    
        container.innerHTML =  """
            <div id="box1" class="box"></div>
            <div id="box2" class="box"></div>
            <style type="text/gss">
          
              #box1[width] == 9;
              #box2[width] == 19;
          
              .box {
                @if $[intrinsic-width] < 10 {
                  margin-top: 1px;
                }
                @if $[intrinsic-width] > 10 {
                  padding-top: 1px;
                }
                @if ::[width] < 10 {
                  z-index: 1;
                }
                @else {
                  z-index: 2;
                }
              }
          
            </style>
          """
        engine.once 'solve', listen
    
    describe 'contextual @if @else inner nesting', ->
      
      # This one will require some serious surgery...
      
      it 'should compute values', (done) ->
        listen = (e) ->
          # TODO
          expect(engine.values).to.eql 
            "$box1[width]": 9
            "$box2[width]": 19
            "$inside2[height]": 20
          done()          
    
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
        engine.once 'solve', listen
  
    describe 'top level @if @else w/ complex queries', ->
  
      it 'should be ok', (done) ->
        listen = (e) ->     
          expect(engine.values).to.eql {
            '$section1[height]': 20
            '$section1[intrinsic-height]': 20
            '$section1[width]': document.documentElement.clientWidth - 200
            '$section1[x]': 100
            '$section1[y]': 0
            '$section2[height]': 10
            '$section2[intrinsic-height]': 10
            '$section2[width]': document.documentElement.clientWidth - 200
            '$section2[x]': 100
            '$section2[y]': 0
            '::window[width]': document.documentElement.clientWidth
            '::window[x]': 0
            '::window[y]': 0
            'Wwin': 1000
          }
          done()          
      
        container.innerHTML =  """
            <div class="section" id="section1" style="height: 20px"></div>
            <div class="section" id="section2" style="height: 10px"></div>
            <style type="text/gss" scoped>
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
        engine.once 'solve', listen
    
  
    describe 'top level @if @else w/ nested VFLs', ->
  
      it 'should compute values', (done) ->
        listen = (e) ->             
          expect(engine.values).to.eql
            "Wwin":100
            "$s1[x]":50
            "$s1[width]":1
            "$s2[width]":1
            "$s2[x]":56         
          done()          
    
        container.innerHTML =  """
            <div id="s1"></div>
            <div id="s2"></div>
            <style type="text/gss" scoped>
            [Wwin] == 100;          
          
            @if [Wwin] > 960 {
                        
              #s1[x] == 100;
              @h (#s1(==10))-(#s2(==10)) gap(100);

            }

            @else {
  
              #s1[x] == 50;
              @h (#s1(==1))-(#s2(==1)) gap(5);
  
            }
            </style>
          """
        engine.once 'solve', listen    
  
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
                @vertical (.section)...;     
              } @else {
                @horizontal (.section)...;     
              }
            </style>
          """
        engine.once 'solve', (e) ->     
          expect(engine.values).to.eql
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
  
  
  
  # VFL
  # ===========================================================
  
  describe "VFL", ->
  
    describe 'simple VFL', ->
  
      it 'should compute values', (done) ->
        listen = (solution) ->     
          expect(solution).to.eql
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
            @horizontal (#s1(==10))-(#s2(==10)) gap(100);
          
            </style>
          """
        engine.once 'solve', listen

    describe '[::] VFLs', ->
  
      it 'should compute', (done) ->
        listen = (solution) ->     
          expect(solution).to.eql      
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
                @horizontal |-(&)-| gap(10) in($ #container);
              }
            
              #container {
                x: == 10;
                width: == 100;
              }                        
  
            </style>
          """
        engine.once 'solve', listen  

      describe 'with selector', ->
        it 'should compute', (done) ->
          engine.then (solution) ->     
            expect(solution).to.eql      
              "$container[x]": 10,
              "$container[width]": 100
              "$p12[x]": 20
              "$p13[x]": 20
              "$p22[x]": 20
              "$p23[x]": 20
              "$h1[x]":  20
              "$p12[width]": 80
              "$p13[width]": 80
              "$p22[width]": 80
              "$p23[width]": 80
              "$h1[width]":  80

            p12 = engine.id('p12')
            p12.parentNode.removeChild(p12)

            engine.then (solution) ->  
              expect(solution).to.eql  
                "$p12[x]": null
                "$p12[width]": null

              h1 = engine.id('h1')
              h1.parentNode.removeChild(h1)
              engine.then (solution) ->  
                expect(solution).to.eql  
                  "$h1[x]": null
                  "$h1[width]": null



                done()          
      
          container.innerHTML =  """
              <div id="s1" class="section">
                <p id="p11"><p id="p12"><p id="p13">
              </div>
              <div id="s2" class="section">
                <p id="p21"><p id="p22"><p id="p23">
              </div>
              <h1 id="h1"></h1>
              <div id="container"></div>
              <style type="text/gss">                        
                        
                .section {
                  @h |-(p + p, $ #h1)-| gap(10) in($ #container);
                }
              
                #container {
                  x: == 10;
                  width: == 100;
                }
              </style>       
          """                 
    

    
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
              @h |(.a)(.b)| in(.cont) {
                &[width] == &:next[width];
              }            
            </style>
          """
        engine.once 'solve', (solution) ->
          expect(solution).to.eql 
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
                
                @h |($ .a)($ .b)| in(::) {
                  x: >= 0;
                  &[width] == :next[width];
                }
              }                           
            </style>
          """
        engine.once 'solved', (solution) ->
          expect(solution).to.eql 
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
        engine.once 'solve', (solution) ->
          expect(solution).to.eql      
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
              
              @h (.implicit)-10-...;
  
            </style>
          """
    
    describe 'Implicit VFL w/ containment', ->
  
      it 'should compute', (done) ->
        engine.once 'solve', (e) ->
          expect(engine.values).to.eql      
            "$s1[x]": 10,
            "$container[x]": 0,
            "$s2[x]": 50,
            "$container[width]": 90,
            "$s1[width]": 30,
            "$s2[width]": 30     
          done()
        container.innerHTML =  """
            <div id="s1" class="implicit"></div>
            <div id="s2" class="implicit"></div>
            <div id="container"></div>
            <style type="text/gss">                        
                      
              @h |-(.implicit)-10-...-| outer-gap(10) in(#container) {
                &[width] == &:next[width];
              }
            
              #container {
                x: == 0;
                width: == 90;
              }                        
  
            </style>
          """
    describe 'order specific selectors on the left within rules', ->
      it 'should do it', (done) ->
        container.innerHTML = """
          <style type="text/gss">
            article {
              width: == 50;
              height: == 50;
              x: >= 0;
            }
            #p1[width] == 50;
            @h (article)... {
              (:next p)[width] == (p)[width];
            }
          </style>
          <article id="article1">
            <p id="p1"></p>
          </article>
          <article id="article2">
            <p id="p2"></p>
          </article>
        """
        engine.then (solution) ->
          expect(solution['$p1[width]']).to.eql solution['$p2[width]']
          done()

    describe 'order specific selectors on the right within rules', ->
      it 'should do it', (done) ->
        container.innerHTML = """
          <style type="text/gss">
            article {
              width: == 50;
              height: == 50;
              x: >= 0;
            }
            #p1[width] == 50;
            @h (article)... {
              (& p)[width] == (&:next p)[width];
            }
          </style>
          <article id="article1">
            <p id="p1"></p>
          </article>
          <article id="article2">
            <p id="p2"></p>
          </article>
        """
        engine.then (solution) ->
          expect(solution['$p1[width]']).to.eql solution['$p2[width]']
          done()

      
    describe "context-specific VFL", ->
      it 'should work', (done) ->
        container.innerHTML = """
        <style>
          article *{
            padding: 0;
            margin: 0
          }
        </style>
        <article id="article1">
          <div class="media"></div>
          <h2 class="title" id="title1"><span style="display:block; height: 20px; width: 10px"></span></h2>
          <p class="desc" id="desc1"><span style="display:block; height: 40px; width: 10px"></span></p>
        </article>
        <article id="article2">
          <div class="media"></div>
          <h2 class="title" id="title2"><span style="display:block; height: 10px; width: 10px"></span></h2>
          <p class="desc" id="desc2"><span style="display:block; height: 30px; width: 10px"></span></p>
        </article>

        <style type="text/gss">
          $[width] == 300;
          $[left] == 0;
          $[top] == 0;

          @v |(article)... in($) {
            height: >= 0;
          }

          article {
            @v |
                -1-
                (.title)
                -2-
                (.desc)
                -3-
                | 
                in(&) {
                  height: == ::[intrinsic-height];
            }
          }

        </style>
        """

        engine.then (solution) ->
          expectation = 
            "$article1[height]": 66
            "$article1[y]": 0

            "$desc1[height]": 40
            "$title1[height]": 20

            "$title1[y]": 1
            "$desc1[y]": 23

            "$article2[height]": 46
            "$article2[y]": 66
            "$desc2[height]": 30
            "$desc2[y]": 13 + 66
            "$title2[height]": 10
            "$title2[y]": 1 + 66
          for prop, value of expectation
            expect(solution[prop]).to.eql value

          article = engine.id('article1')
          engine.scope.appendChild(article)

          engine.then (solution) ->
            expect(solution).to.eql 
              "$title1[y]": 1 + 46
              "$desc1[y]": 23 + 46
 
              "$article2[y]": 0
              "$article1[y]": 46
              "$desc2[y]": 13
              "$title2[y]": 1

            article = engine.id('article2')
            engine.scope.appendChild(article)

            engine.then (solution) ->
              expect(solution).to.eql 

                "$article1[y]": 0

                "$title1[y]": 1
                "$desc1[y]": 23

                "$article2[y]": 66
                "$desc2[y]": 13 + 66
                "$title2[y]": 1 + 66


              title1 = engine.id('title1')
              title1.parentNode.removeChild(title1)

              engine.then (solution) ->
                expect(solution[''])
                expect(solution).to.eql
                  "$article1[height]": 0
                  "$article2[y]": 0
                  "$desc1[y]": -43
                  "$desc2[y]": 13
                  "$title1[height]": null
                  "$title1[intrinsic-height]": null
                  "$title1[y]": null
                  "$title2[y]": 1
                engine.scope.innerHTML = ""
                engine.then ->
                  expect(engine.values).to.eql {}
                  done()

    describe "new VFL input", ->
      it 'should work', (done) ->
        container.innerHTML = """
        <div id="boxA" class="box"></div>
        <div id="boxB" class="box"></div>
        <div id="box2" class="box"></div>
        <div id="box3"></div>
        <div id="container"></div>

        <style type="text/gss" scoped>
          #container[width] == 300;
          #container[left] == 0;
          [gap] >= 0;

          @h |- (.box)-10-... - (#box2) (#box3)-| gap([gap]) in(#container) {
 
            width: == &:next[width]; // replacement for chain-width()
           
            top: == ::window[top]; // replacement for chain-top(::window[top])
          }
        </style>
        """
        engine.once 'solve', (solution) ->
          expect(solution).to.eql 
            "::window[y]": 0
            "$box2[width]": 70
            "$box2[x]": 160
            "$box2[y]": 0
            "$box3[width]": 70
            "$box3[x]": 230
            "$box3[y]": 0
            "$boxA[width]": 70
            "$boxA[x]": 0
            "$boxA[y]": 0
            "$boxB[width]": 70
            "$boxB[x]": 80
            "$boxB[y]": 0
            "$container[width]": 300
            "$container[x]": 0
            "gap": 0
          done()

    describe "new VFL output", ->
      it 'should work', (done) ->
        container.innerHTML = """
        <div id="boxA" class="box"></div>
        <div id="boxB" class="box"></div>
        <div id="box2" class="box"></div>
        <div id="box3"></div>
        <div id="container"></div>

        <style type="text/gss">
          #container[width] == 300;
          #container[left] == 0;
          $gap >= 0;

          .box, #box2, #box3 {
            width: == :next[width];
            top: == ::window[top];
          }
          
          #container[left] + $gap == (.box:first)[left];
           
          .box {
            &[right] + 10 == :next[left];
          }

          (.box:last)[right] + $gap == (#box2)[left];
           
          #box2[right] == #box3[left];
          #box3[right] + $gap == #container[right];
           
        </style>
        """
        engine.once 'solve', (solution) ->
          expect(solution).to.eql 
            "::window[y]": 0
            "$box2[width]": 70
            "$box2[x]": 160
            "$box2[y]": 0
            "$box3[width]": 70
            "$box3[x]": 230
            "$box3[y]": 0
            "$boxA[width]": 70
            "$boxA[x]": 0
            "$boxA[y]": 0
            "$boxB[width]": 70
            "$boxB[x]": 80
            "$boxB[y]": 0
            "$container[width]": 300
            "$container[x]": 0
            "gap": 0
          done()
        
    describe '[::] VFLs II', ->
  
      it 'should compute', (done) ->
        engine.once 'solve', (solution) ->     
          expect(solution).to.eql      
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
                @horizontal |-(&)-| gap(10) in($ #container);
              }                                           
  
            </style>
          """
          
    describe '<points>', ->
  
      it 'should compute', (done) ->
        engine.once 'solve', (solution) ->
          expect(solution).to.eql                  
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
            <style type="text/gss" scoped>                        
            
              #container {
                x: == 10;
                width: == 100;
              }
              
              [right-edge] == 200;
              
              @h <#container[center-x]>-(#s1)-<[right-edge]> (#s2) < 1000 + 1 > gap(10);     
  
            </style>
          """ 
    
    describe 'VFLs w/ missing elements', ->
  
      it 'should compute', (done) ->
    
        container.innerHTML =  """
            <div id="here"></div>
            <div id="container"></div>
            <style type="text/gss">                        
              @h |-10-(#here)-(#gone)-(#gone2)-(#gone3)-10-|
                in(#container)
                chain-height([but_height] !strong)
                chain-center-y(#top-nav[center-y]) 
                !require;                                    
            </style>
          """
        engine.once 'solve', (e) ->     
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
