Engine = GSS.Engine #require 'gss-engine/lib/Engine.js'

remove = (el) ->
  el.parentNode.removeChild(el)

stringify = JSON.stringify
expect = chai.expect
assert = chai.assert

describe 'GSS commands', ->
  scope = null
  engine = null

  beforeEach ->
    fixtures = document.getElementById 'fixtures'
    scope = document.createElement 'div'
    fixtures.appendChild scope
    engine = new GSS(scope)      

  afterEach (done) ->
    remove(scope)
    engine.destroy()
    done()

  describe 'when initialized', ->
    it 'should be bound to the DOM scope', ->
      chai.expect(engine.scope).to.eql scope

  describe 'command transformations -', ->    
    
    it 'stay with class & static ids', ->
      scope.innerHTML = """
        <div class="box" id="12322">One</div>
        <div class="box" id="34222">One</div>
      """
      engine.run [
          ['stay', ['get', ['$class','box'], 'x']]
        ]
      chai.expect(engine.expressions.lastOutput).to.eql [
          ['stay', ['get', '$12322', 'x', '.box$12322']]
          ['stay', ['get', '$34222', 'x', '.box$34222']]
        ]
    
    it 'multiple stays', ->
      scope.innerHTML = """
        <div class="box block" id="12322">One</div>
        <div class="box block" id="34222">One</div>
      """
      engine.run [
          ['stay', ['get', ['$class','box']  , 'x'    , '%1']]
          ['stay', ['get', ['$class','box']  , 'y'    , '%2']]
          ['stay', ['get', ['$class','block'], 'width', '%3']]
        ]
      chai.expect( engine.expressions.lastOutput).to.eql [
          # break up stays to allow multiple plural queries
          ['stay', ['get', '$12322','x'    ,'.box$12322'  ]]
          ['stay', ['get', '$34222','x'    ,'.box$34222'  ]] 
          ['stay', ['get', '$12322','y'    ,'.box$12322'  ]]          
          ['stay', ['get', '$34222','y'    ,'.box$34222'  ]]
          ['stay', ['get', '$12322','width','.block$12322']]          
          ['stay', ['get', '$34222','width','.block$34222']]
        ]
    
    it 'eq with class and tracker', ->
      scope.innerHTML = """
        <div class="box" id="12322">One</div>
        <div class="box" id="34222">One</div>
      """
      engine.run [
        ['==', ['get', ['$class','box'], 'width'],['get','grid-col']]
        ['==', 100,['get','grid-col']]
      ], '%'
      chai.expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
        ['==', ['get','$12322','width','%.box$12322'],['get', "", 'grid-col',"%.box$12322"]]
        ['==', ['get','$34222','width','%.box$34222'],['get', "", 'grid-col',"%.box$34222"]]
        ['==', 100, ['get', "", 'grid-col',"%"]]
      ]
        
    
    it 'eq with class', ->
      scope.innerHTML = """
        <div class="box" id="12322">One</div>
        <div class="box" id="34222">One</div>
      """
      engine.run [
        ['==', ['get',['$class','box'],'width'],['get','grid-col']]
        ['==', 100, ['get','grid-col']]
      ]
      expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
        ['==', ['get','$12322','width','.box$12322'],['get', '', 'grid-col',".box$12322"]]
        ['==', ['get','$34222','width','.box$34222'],['get', '', 'grid-col',".box$34222"]]
        ['==', 100,['get', '', 'grid-col', ""]]
      ]

    it 'lte for class & id selectos', ->
      scope.innerHTML = """
        <div id="box1" class="box">One</div>
        <div class="box" id="34222">One</div>
        <div class="box" id="35346">One</div>
      """
      engine.run [
        ['<=',['get',['$class','box'],'width'],['get',['$id','box1'],'width']]
      ]
      expect(stringify engine.expressions.lastOutput).to.eql stringify [
        ['<=',['get', '$box1' , 'width','.box$box1–#box1'],['get','$box1','width','.box$box1–#box1']]
        ['<=',['get', '$34222', 'width','.box$34222–#box1'],['get','$box1','width','.box$34222–#box1']]
        ['<=',['get', '$35346', 'width','.box$35346–#box1'],['get','$box1','width','.box$35346–#box1']]
      ]

    it 'intrinsic-width with class', (done) ->

      engine.once 'solved', ->
        chai.expect(stringify engine.expressions.lastOutput).to.eql stringify  [
          ['suggest', '$12322[intrinsic-width]', 111, 'required']
          ['suggest', '$34222[intrinsic-width]', 222, 'required']
          ['suggest', '$35346[intrinsic-width]', 333, 'required']
          ['==', ['get','$12322','width','.box$12322'],['get','$12322','intrinsic-width','.box$12322']]
          ['==', ['get','$34222','width','.box$34222'],['get','$34222','intrinsic-width','.box$34222']]
          ['==', ['get','$35346','width','.box$35346'],['get','$35346','intrinsic-width','.box$35346']]
        ]
        engine.once 'solved', ->
          chai.expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
            ["remove",".box$12322"]
          ]
          done()
        box0 = scope.getElementsByClassName('box')[0]
        box0.parentNode.removeChild(box0)

      debugger
      engine.run [
        ['==', ['get', ['$class','box'], 'width'],['get', ['$class','box'], 'intrinsic-width']]
      ]

      scope.innerHTML = """
        <div style="width:111px;" class="box" id="12322">One</div>
        <div style="width:222px;" class="box" id="34222">One</div>
        <div style="width:333px;" class="box" id="35346">One</div>
      """


    it '.box[width] == ::window[width]', ->
      scope.innerHTML = """
        <div style="width:111px;" class="box" id="12322">One</div>
      """
      engine.run [
        ['==', ['get', ['$class','box'], 'width'],['get', ['$reserved','window'], 'width']]
      ]
      chai.expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
        ['suggest', '::window[width]', window.innerWidth, 'required']
        ['==', ['get', '$12322','width','.box$12322'],['get','::window', 'width',".box$12322"]]
      ]


    it '::window props', ->
      scope.innerHTML = """
        
      """
      engine.run [
        ['==',  ['get', 'xxx'], ['get', ['$reserved','window'], 'x'     ]]
        ['<=',['get', 'yyy'], ['get', ['$reserved','window'], 'y'     ]]
        ['<=',['get', 'yay'], ['get', ['$reserved','window'], 'y'     ]]
        ['>=',  ['get', 'hhh'], ['get', ['$reserved','window'], 'height']]
        ['>=',  ['get', 'hah'], ['get', ['$reserved','window'], 'height']]
        ['<=',['get', 'www'], ['get', ['$reserved','window'], 'width' ]]
      ]
      chai.expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
        
        ['suggest', '::window[x]',      0,                  'required']
        ['suggest', '::window[y]',      0,                  'required']
        ['suggest', '::window[height]', window.innerHeight, 'required']
        ['suggest', '::window[width]',  window.innerWidth,  'required']

        ['==',  ['get','', 'xxx', ''], ['get','::window', 'x', '']]
        ['<=',['get','', 'yyy', ''], ['get','::window', 'y', '']]                
        ['<=',['get','', 'yay', ''], ['get','::window', 'y', '']]  
        
        ['>=',      ['get','', 'hhh', ''],    ['get','::window', 'height', '']]
        ['>=',      ['get','', 'hah', ''],    ['get','::window', 'height', '']]
        ['<=',    ['get','', 'www', ''],    ['get','::window', 'width', '']]        
        
      ]

  #
  #
  #
  describe 'live command spawning -', ->
    
    describe 'adds & removes -', ->
      it 'add to class', (done) ->
        scope.innerHTML = """
          <div class="box" id="12322">One</div>
          <div class="box" id="34222">One</div>
        """
        count = 0
        listener = (e) ->
          count++
          if count is 1
            expect(engine.expressions.lastOutput).to.eql [
                ['==', ['get','$12322','x','.box$12322'], 100]
                ['==', ['get','$34222','x','.box$34222'], 100]
              ]
            scope.insertAdjacentHTML('beforeend', '<div class="box" id="35346">One</div>')            
          else if count is 2
            expect(engine.expressions.lastOutput).to.eql [
                ['==', ['get','$35346','x','.box$35346'], 100]
              ]
            engine.removeEventListener 'solved', listener
            done()
        engine.addEventListener 'solved', listener
        engine.run [
            ['==', ['get',['$class','box'],'x'], 100]
          ]

      it 'removed from dom', (done) ->
        scope.innerHTML = """
          <div class="box" id="12322">One</div>
          <div class="box" id="34222">One</div>
        """
        count = 0
        listener = (e) ->
          count++
          if count is 1
            chai.expect(engine.expressions.lastOutput).to.eql [
                ['==', ['get','$12322','x','.box$12322'], 100]
                ['==', ['get','$34222','x','.box$34222'], 100]
              ]
            res = engine.$id('34222')
            res.parentNode.removeChild res
          else if count is 2
            chai.expect(engine.expressions.lastOutput).to.eql [
              ['remove', '.box$34222'] # this should be the only command
            ]
            engine.removeEventListener 'solved', listener
            done()
        engine.addEventListener 'solved', listener
        engine.run [
            ['==', ['get',['$class','box'],'x'], 100]
          ]

      it 'removed from selector', (done) ->
        count = 0
        listener = (e) ->
          count++
          if count is 1
            chai.expect(engine.expressions.lastOutput).to.eql [
                ['==', ['get','$12322','x','.box$12322'], 100]
                ['==', ['get','$34222','x','.box$34222'], 100]
              ]
            el = engine.$id('34222')
            el.classList.remove('box')

          else if count is 2
            chai.expect(engine.expressions.lastOutput).to.eql [
                ['remove', '.box$34222']
              ]
            engine.removeEventListener 'solved', listener
            done()
        engine.addEventListener 'solved', listener
        engine.run [
            ['==', ['get',['$class','box'],'x'], 100]
          ]
        scope.innerHTML = """
          <div class="box" id="12322">One</div>
          <div class="box" id="34222">One</div>
        """
    
    #
    #
    describe 'resizing -', ->
      
      it 'element resized by style change', (done) ->
        count = 0
        el = null
        listener = (e) ->
          count++
          if count is 1
            el = engine.$id('box1')
            GSS.setStyle el, "width", "1110px"
            
          else if count is 2     
            chai.expect(engine.expressions.lastOutput).to.eql [
                ['suggest', '$box1[intrinsic-width]' ,1110, 'required']
              ]
            chai.expect(engine.values['$box1[intrinsic-width]']).to.equal 1110
            chai.expect(engine.values['$box2[height]']).to.equal 1110
            engine.removeEventListener 'solved', listener
            done()

        engine.addEventListener 'solved', listener
        engine.run [
          ['==', ['get',['$class','box'],'height'],['get',['$id','box1'],'intrinsic-width']]
        ]
        scope.innerHTML = """
          <div style="width:111px;" id="box1" class="box" >One</div>
          <div style="width:222px;" id="box2" class="box" >One</div>
        """
      
      it 'element resized by inserting child', (done) ->
        count = 0
        listener = (e) ->
          count++
          if count is 1           
            engine.$id('box1').innerHTML = "<div style=\"width:111px;\"></div>"
          else if count is 2
            chai.expect(engine.expressions.lastOutput).to.eql [
                ['suggest', '$box1[intrinsic-width]', 111, 'required']
              ]
            engine.removeEventListener 'solved', listener
            done()
        engine.addEventListener 'solved', listener
        engine.run [
          ['==', ['get',['$class','box'],'height'],['get',['$id','box1'],'intrinsic-width']]
        ]
        scope.innerHTML = """
          <div style="display:inline-block;" id="box1" class="box">One</div>
          <div style="width:222px;" id="box2" class="box">One</div>
        """
      
      it 'element resized by changing text', (done) ->
        count = 0
        el = null
        listener = (e) ->
          count++          
          if count is 1
            el = engine.$id('box1')            
            el.innerHTML = "<div style=\"width:111px;\"></div>"
          else if count is 2            
            chai.expect(engine.expressions.lastOutput).to.eql [
                ['suggest', '$box1[intrinsic-width]', 111, 'required']
              ]
            el.innerHTML = ""            
          else if count is 3
            chai.expect(engine.expressions.lastOutput).to.eql [
                ['suggest', '$box1[intrinsic-width]', 0, 'required']
              ]
            engine.removeEventListener 'solved', listener
            done()
        engine.addEventListener 'solved', listener
        engine.run [
          ['==', ['get',['$class','box'],'height'],['get',['$id','box1'],'intrinsic-width']]
        ]
        scope.innerHTML = """
          <div style="display:inline-block" id="box1" class="box" >One</div>
          <div style="width:222px;" id="box2" class="box" >One</div>
        """
    describe "text measuring", ->
      it 'text measuring', (done) ->
        count = 0
        el = null
        listener = (e) ->
          count++      
          if count is 1
            # don't set height b/c intrinsic-height was used
            expect(engine.$id("p-text").style.height).to.eql ""            
            expect(engine.values["$p-text[width]"]).to.eql 100
            expect(engine.values["$p-text[intrinsic-height]"] > 400).to.eql true
            expect(engine.values["$p-text[intrinsic-height]"] % 16).to.eql 0
            expect(engine.values["$p-text[x-height]"] % 16).to.eql 0
            engine.$id("p-text").innerHTML = "Booyaka"
          else if count is 2
            expect(engine.values["$p-text[width]"]).to.eql 100
            expect(engine.values["$p-text[intrinsic-height]"]).to.eql(16)
            expect(engine.values["$p-text[x-height]"]).to.eql(16)
            engine.removeEventListener 'solved', listener
            done()
        engine.addEventListener 'solved', listener
        engine.run [
          ['==', ['get',['$id','p-text'],'width'],  100]
          ['==', ['get',['$id','p-text'],'x-height'], ['get',['$id','p-text'],'intrinsic-height']]
        ]
        scope.innerHTML = """
          <p id="p-text" style="font-size:16px; line-height:16px; font-family:Helvetica;">Among the sectors most profoundly affected by digitization is the creative sector, which, by the definition of this study, encompasses the industries of book publishing, print publishing, film and television, music, and gaming. The objective of this report is to provide a comprehensive view of the impact digitization has had on the creative sector as a whole, with analyses of its effect on consumers, creators, distributors, and publishers</p>
        """
    
    
    describe "Chain", ->
      
      xit '@chain .thing width()', (done) ->
        scope.innerHTML = """
          <div id="thing1" class="thing"></div>
          <div id="thing2" class="thing"></div>
        """
        engine.run [
          [
            'chain', 
            ['$class','thing'], 
            ['eq-chain', 'width', 100],
            ['eq-chain', 100, 'width']
          ]
        ]
        el = null
        listener = (e) ->
          chai.expect(engine.vars["$thing1[width]"]).to.eql 100
          chai.expect(engine.vars["$thing2[width]"]).to.eql 100
          scope.removeEventListener 'solved', listener
          done()
        scope.addEventListener 'solved', listener

      
      xit '@chain .box width(+[hgap]*2)', (done) ->
        scope.innerHTML = """
          <div id="thing1" class="thing"></div>
          <div id="thing2" class="thing"></div>
        """
        engine.run [  
              ['==', ['get','hgap'], 20]
              ['==', ['get','width',['$id','thing1']], 100]
              [
                'chain', 
                ['$class', 'thing'], 
                ['eq-chain',['plus-chain','width',['*',['get','hgap'],2]],'width']
              ]
            ]
        el = null
        listener = (e) ->
          chai.expect(engine.vars["$thing1[width]"]).to.eql 100
          chai.expect(engine.vars["$thing2[width]"]).to.eql 140
          scope.removeEventListener 'solved', listener
          done()
        scope.addEventListener 'solved', listener
      
      xit '@chain .thing right()left', (done) ->
        scope.innerHTML = """
          <div id="thing1" class="thing"></div>
          <div id="thing2" class="thing"></div>
        """
        engine.run [
          ['==', ['get','x',['$id','thing1']], 10]
          ['==', ['get','x',['$id','thing2']], 110]
          [
            'chain', 
            ['$class','thing'], 
            ['eq-chain', 'right', 'left'],
          ]
        ]
        el = null
        listener = (e) ->
          chai.expect(engine.vars["$thing1[width]"]).to.eql 100
          scope.removeEventListener 'solved', listener
          done()
        scope.addEventListener 'solved', listener
    
      
  

