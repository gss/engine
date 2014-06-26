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
          ['stay', ['get', ['$class','box'], '[x]']]
        ]
      chai.expect(engine.expressions.lastOutput).to.eql [
          ['stay', ['get', '$12322', '[x]', '.box$12322']]
          ['stay', ['get', '$34222', '[x]', '.box$34222']]
        ]
    
    it 'multiple stays', ->
      scope.innerHTML = """
        <div class="box block" id="12322">One</div>
        <div class="box block" id="34222">One</div>
      """
      engine.run [
          ['stay', ['get', ['$class','box']  , '[x]'    , '%1']]
          ['stay', ['get', ['$class','box']  , '[y]'    , '%2']]
          ['stay', ['get', ['$class','block'], '[width]', '%3']]
        ]
      chai.expect( engine.expressions.lastOutput).to.eql [
          # break up stays to allow multiple plural queries
          ['stay', ['get', '$12322','[x]'    ,'.box$12322'  ]]
          ['stay', ['get', '$34222','[x]'    ,'.box$34222'  ]] 
          ['stay', ['get', '$12322','[y]'    ,'.box$12322'  ]]          
          ['stay', ['get', '$34222','[y]'    ,'.box$34222'  ]]
          ['stay', ['get', '$12322','[width]','.block$12322']]          
          ['stay', ['get', '$34222','[width]','.block$34222']]
        ]
    
    it 'eq with class and tracker', ->
      scope.innerHTML = """
        <div class="box" id="12322">One</div>
        <div class="box" id="34222">One</div>
      """
      engine.run [
        ['eq', ['get', ['$class','box'], '[width]'],['get','[grid-col]']]
        ['eq', 100,['get','[grid-col]']]
      ], '%'
      chai.expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
        ['eq', ['get','$12322','[width]','%.box$12322'],['get', "::global", '[grid-col]',"%.box$12322–"]]
        ['eq', ['get','$34222','[width]','%.box$34222'],['get', "::global", '[grid-col]',"%.box$34222–"]]
        ['eq', 100, ['get', "::global", '[grid-col]',"%"]]
      ]
        
    
    it 'eq with class', ->
      scope.innerHTML = """
        <div class="box" id="12322">One</div>
        <div class="box" id="34222">One</div>
      """
      engine.run [
        ['eq', ['get',['$class','box'],'[width]'],['get','[grid-col]']]
        ['eq', 100, ['get','[grid-col]']]
      ]
      expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
        ['eq', ['get','$12322','[width]','.box$12322'],['get', '::global', '[grid-col]',".box$12322–"]]
        ['eq', ['get','$34222','[width]','.box$34222'],['get', '::global', '[grid-col]',".box$34222–"]]
        ['eq', 100,['get', '::global', '[grid-col]', ""]]
      ]

    it 'lte for class & id selectos', ->
      scope.innerHTML = """
        <div id="box1" class="box">One</div>
        <div class="box" id="34222">One</div>
        <div class="box" id="35346">One</div>
      """
      engine.run [
        ['lte', ['get',['$class','box'],'[width]'],['get',['$id','box1'],'[width]']]
      ]
      expect(stringify engine.expressions.lastOutput).to.eql stringify [
        ['lte', ['get', '$box1' , '[width]','.box$box1–#box1'],['get','$box1','[width]','.box$box1–#box1']]
        ['lte', ['get', '$34222', '[width]','.box$34222–#box1'],['get','$box1','[width]','.box$34222–#box1']]
        ['lte', ['get', '$35346', '[width]','.box$35346–#box1'],['get','$box1','[width]','.box$35346–#box1']]
      ]

    it 'intrinsic-width with class', ->
      scope.innerHTML = """
        <div style="width:111px;" class="box" id="12322">One</div>
        <div style="width:222px;" class="box" id="34222">One</div>
        <div style="width:333px;" class="box" id="35346">One</div>
      """

      engine.once 'solved', ->
        chai.expect(stringify engine.expressions.lastOutput).to.eql stringify  [
          ['suggest', '$12322[intrinsic-width]', 111, 'required']
          ['suggest', '$34222[intrinsic-width]', 222, 'required']
          ['suggest', '$35346[intrinsic-width]', 333, 'required']
          ['eq', ['get','$12322','[width]','.box$12322'],['get','$12322','[intrinsic-width]','.box$12322–']]
          ['eq', ['get','$34222','[width]','.box$34222'],['get','$34222','[intrinsic-width]','.box$34222–']]
          ['eq', ['get','$35346','[width]','.box$35346'],['get','$35346','[intrinsic-width]','.box$35346–']]
        ]
        engine.once 'solved', ->
          chai.expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
            [["remove",".box$12322"]]
          ]
        box0 = scope.getElementsByClassName('box')[0]
        box0.parentNode.removeChild(box0)


      engine.run [
        ['eq', ['get', ['$class','box'], '[width]'],['get', ['$class','box'], '[intrinsic-width]']]
      ]


    it '.box[width] == ::window[width]', ->
      scope.innerHTML = """
        <div style="width:111px;" class="box" id="12322">One</div>
      """
      engine.run [
        ['eq', ['get', ['$class','box'], '[width]'],['get', ['$reserved','window'], '[width]']]
      ]
      chai.expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
        ['suggest', ['get','::window', '[width]'], ['number', window.innerWidth - GSS.get.scrollbarWidth()], 'required']
        ['eq', ['get$','width','$12322','.box'],['get','::window[width]']]
      ]

    it '::window props', ->
      scope.innerHTML = """
        
      """
      engine.run [
        ['eq',  ['get','[xxx]'], ['get$','x',     ['$reserved','window']]]
        ['lte', ['get','[yyy]'], ['get$','y',     ['$reserved','window']]]
        ['gte', ['get','[hhh]'], ['get$','height',['$reserved','window']]]
        ['lte', ['get','[www]'], ['get$','width', ['$reserved','window']]]
      ]
      chai.expect(stringify(engine.expressions.lastOutput)).to.eql stringify [
        
        ['eq',  ['get','::window[x]'],['number',0],        'required']
        ['eq',  ['get','[xxx]'],      ['get','::window[x]']          ]
        
        ['eq',  ['get','::window[y]'],['number',0],        'required']
        ['lte', ['get','[yyy]'],      ['get','::window[y]']          ]                
        
        ['suggest', ['get','::window[height]'], ['number', window.innerHeight], 'required']
        ['gte',     ['get','[hhh]'],            ['get','::window[height]']]
        
        ['suggest', ['get','::window[width]'],  ['number', window.innerWidth - GSS.get.scrollbarWidth()], 'required']
        ['lte',     ['get','[www]'],            ['get','::window[width]']]        
        
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
        engine.run [
            ['eq', ['get$','x',['$class','box']], ['number',100]]
          ]
        expect(engine.expressions.lastOutput).to.eql [
            ['eq', ['get$','x','$12322','.box'], ['number',100]]
            ['eq', ['get$','x','$34222','.box'], ['number',100]]
          ]
        count = 0
        listener = (e) ->
          count++
          if count is 1
            scope.insertAdjacentHTML('beforeend', '<div class="box" id="35346">One</div>')            
          else if count is 2
            expect(engine.lastWorkerCommands).to.eql [
                ['eq', ['get$','x','$35346','.box'], ['number',100]]
              ]
            scope.removeEventListener 'solved', listener
            done()
        scope.addEventListener 'solved', listener

      it 'removed from dom', (done) ->
        scope.innerHTML = """
          <div class="box" id="12322">One</div>
          <div class="box" id="34222">One</div>
        """
        engine.run [
            ['eq', ['get$','x',['$class','box']], ['number',100]]
          ]
        chai.expect(engine.expressions.lastOutput).to.eql [
            ['eq', ['get$','x','$12322','.box'], ['number',100]]
            ['eq', ['get$','x','$34222','.box'], ['number',100]]
          ]
        count = 0
        listener = (e) ->
          count++
          if count is 1
            res = scope.querySelector('[data-gss-id="34222"]')
            res.parentNode.removeChild res
          else if count is 2
            chai.expect(engine.lastWorkerCommands).to.eql [
              ['remove', '$34222'] # this should be the only command
            ]
            scope.removeEventListener 'solved', listener
            done()
        scope.addEventListener 'solved', listener

      it 'removed from selector', (done) ->
        scope.innerHTML = """
          <div class="box" id="12322">One</div>
          <div class="box" id="34222">One</div>
        """
        engine.run [
            ['eq', ['get$','x',['$class','box']], ['number',100]]
          ]
        chai.expect(engine.expressions.lastOutput).to.eql [
            ['eq', ['get$','x','$12322','.box'], ['number',100]]
            ['eq', ['get$','x','$34222','.box'], ['number',100]]
          ]
        count = 0
        listener = (e) ->
          count++
          if count is 1
            el = document.getElementById("34222")
            el.className = el.classList.remove('box') #.replace(/\bbox\b/,'')
            # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            # JSMutationObserver on Phantom doesn't trigger mutation
            #engine._handleMutations()
            # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
          else if count is 2
            chai.expect(engine.lastWorkerCommands).to.eql [
                ['remove', '.box$34222']
              ]
            scope.removeEventListener 'solved', listener
            done()
        scope.addEventListener 'solved', listener
    
    #
    #
    describe 'resizing -', ->
      
      it 'element resized by style change', (done) ->
        scope.innerHTML = """
          <div style="width:111px;" id="box1" class="box" >One</div>
          <div style="width:222px;" id="box2" class="box" >One</div>
        """
        engine.run [
          ['eq', ['get$','height',['$class','box']],['get$','intrinsic-width',['$id','box1']]]
        ]
        count = 0
        el = null
        listener = (e) ->
          count++
          if count is 1
            el = document.querySelector('#box1')
            GSS._.setStyle(el, "width", "1110px")

            # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            # JSMutationObserver on Phantom doesn't trigger mutation
            #engine._handleMutations()
            # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
          else if count is 2     
            chai.expect(engine.lastWorkerCommands).to.eql [
                ['suggest', ['get$','intrinsic-width','$box1','#box1'],['number', 1110], 'required']
              ]
            chai.expect(engine.vars['$box1[intrinsic-width]']).to.equal 1110
            chai.expect(engine.vars['$box2[height]']).to.equal 1110
            scope.removeEventListener 'solved', listener
            done()
        scope.addEventListener 'solved', listener
      
      it 'element resized by inserting child', (done) ->
        scope.innerHTML = """
          <div style="display:inline-block;" id="box1" class="box">One</div>
          <div style="width:222px;" id="box2" class="box">One</div>
        """
        engine.run [
          ['eq', ['get$','height',['$class','box']],['get$','intrinsic-width',['$id','box1']]]
        ]
        count = 0
        listener = (e) ->
          count++
          if count is 1
            el = scope.querySelector('#box1')            
            el.innerHTML = "<div style=\"width:111px;\"></div>"
            # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            # JSMutationObserver on Phantom doesn't trigger mutation
            #engine._handleMutations()
            # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
          else if count is 2
            chai.expect(engine.lastWorkerCommands).to.eql [
                ['suggest', ['get$','intrinsic-width','$box1','#box1'],['number', 111], 'required']
              ]
            scope.removeEventListener 'solved', listener
            done()
        scope.addEventListener 'solved', listener
      
      it 'element resized by changing text', (done) ->
        scope.innerHTML = """
          <div style="display:inline-block" id="box1" class="box" >One</div>
          <div style="width:222px;" id="box2" class="box" >One</div>
        """
        engine.run [
          ['eq', ['get$','height',['$class','box']],['get$','intrinsic-width',['$id','box1']]]
        ]
        count = 0
        el = null
        listener = (e) ->
          count++          
          if count is 1
            el = scope.querySelector('#box1')            
            engine.lastWorkerCommands = [] # to ensure it's reset
            el.innerHTML = "<div style=\"width:111px;\"></div>"
            # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            # JSMutationObserver on Phantom doesn't trigger mutation
            #engine._handleMutations()
            # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
          else if count is 2            
            chai.expect(engine.lastWorkerCommands).to.eql [
                ['suggest', ['get$','intrinsic-width','$box1','#box1'],['number', 111], 'required']
              ]
            engine.lastWorkerCommands = [] # to ensure it's reset
            el.innerHTML = ""            
          else if count is 3
            chai.expect(engine.lastWorkerCommands).to.eql [
                ['suggest', ['get$','intrinsic-width','$box1','#box1'],['number', 0], 'required']
              ]
            scope.removeEventListener 'solved', listener
            done()
        scope.addEventListener 'solved', listener
    
    describe "text measuring", ->
      it 'text measuring', (done) ->
        scope.innerHTML = """
          <p id="p-text" style="font-size:16px; line-height:16px; font-family:Helvetica;">Among the sectors most profoundly affected by digitization is the creative sector, which, by the definition of this study, encompasses the industries of book publishing, print publishing, film and television, music, and gaming. The objective of this report is to provide a comprehensive view of the impact digitization has had on the creative sector as a whole, with analyses of its effect on consumers, creators, distributors, and publishers</p>
        """
        engine.run [
          ['eq', ['get$','width',['$id','p-text']],  ['number',100]]
          ['eq', ['get$','height',['$id','p-text']], ['get$','intrinsic-height',['$id','p-text']]]
        ]
        count = 0
        el = null
        listener = (e) ->
          count++      
          if count is 1
            # don't set height b/c intrinsic-height was used
            expect(document.getElementById("p-text").style.height).to.eql ""            
            expect(engine.vars["$p-text[width]"]).to.eql 100
            expect(engine.vars["$p-text[intrinsic-height]"] % 16).to.eql 0          
            # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            # JSMutationObserver on Phantom doesn't trigger mutation
            #engine._handleMutations()
            # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
          else if count is 2            
            expect(document.getElementById("p-text").style.height).to.eql ""
            expect(engine.vars["$p-text[width]"]).to.eql 100
            iHeight = engine.vars["$p-text[intrinsic-height]"] 
            assert( (iHeight % 16 is 0) and (iHeight > 400), "text height is #{iHeight}" )#608
            scope.removeEventListener 'solved', listener
            done()
        scope.addEventListener 'solved', listener
    
    
    describe "Chain", ->
      
      it '@chain .thing width()', (done) ->
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

      
      it '@chain .box width(+[hgap]*2)', (done) ->
        scope.innerHTML = """
          <div id="thing1" class="thing"></div>
          <div id="thing2" class="thing"></div>
        """
        engine.run [  
              ['eq', ['get','[hgap]'], 20]
              ['eq', ['get$','width',['$id','thing1']], 100]
              [
                'chain', 
                ['$class', 'thing'], 
                ['eq-chain',['plus-chain','width',['multiply',['get','[hgap]'],['number',2]]],'width']
              ]
            ]
        el = null
        listener = (e) ->
          chai.expect(engine.vars["$thing1[width]"]).to.eql 100
          chai.expect(engine.vars["$thing2[width]"]).to.eql 140
          scope.removeEventListener 'solved', listener
          done()
        scope.addEventListener 'solved', listener
      
      it '@chain .thing right()left', (done) ->
        scope.innerHTML = """
          <div id="thing1" class="thing"></div>
          <div id="thing2" class="thing"></div>
        """
        engine.run [
          ['eq', ['get$','x',['$id','thing1']], 10]
          ['eq', ['get$','x',['$id','thing2']], 110]
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
    
    
    describe "JS layout hooks", ->
      it 'for-all', (done) ->
        scope.innerHTML = """
          <div id="thing1" class="thing"></div>
          <div id="thing2" class="thing"></div>
        """
        engine.run [
          [
            'for-all', 
            ['$class','thing'], 
            ['js',"""function (query,e) {              
              e.remove('for-eacher-d4');
              query.forEach(function(el){
                e.eq(e.elVar(el,'width',query.selector,'for-eacher-d4'),100);
              });              
            }"""]
          ]
        ]
        el = null
        listener = (e) ->
          chai.expect(engine.vars["$thing1[width]"]).to.eql 100
          chai.expect(engine.vars["$thing2[width]"]).to.eql 100
          scope.removeEventListener 'solved', listener
          done()
        scope.addEventListener 'solved', listener
    
      
      
  

