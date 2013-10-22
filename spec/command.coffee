Engine = GSS.Engine #require 'gss-engine/lib/Engine.js'

describe 'GSS commands', ->
  container = null
  engine = null

  before ->
    fixtures = document.getElementById 'fixtures'
    container = document.createElement 'div'
    fixtures.appendChild container
  beforeEach ->
    engine = new Engine 
      workerPath:'../browser/gss-engine/worker/gss-solver.js'
      container:container

  afterEach (done) ->
    engine.destroy()
    done()

  describe 'when initialized', ->
    it 'should be bound to the DOM container', ->
      chai.expect(engine.container).to.eql container

  describe 'command transformations -', ->
    it 'var with class & generate ids', ->
      container.innerHTML = """
        <div class="box">One</div>
        <div class="box">One</div>
        <div class="box">One</div>
      """
      engine.execute [
          ['var', '.box[x]', 'x', ['$class','box']]
        ]
      chai.expect(engine.workerCommands).to.eql [
          # $1 is engine
          ['var', '$2[x]', '$2']
          ['var', '$3[x]', '$3']
          ['var', '$4[x]', '$4']
        ]

    it 'var with class & static ids', ->
      container.innerHTML = """
        <div class="box" data-gss-id="12322">One</div>
        <div class="box" data-gss-id="34222">One</div>
        <div class="box" data-gss-id="35346">One</div>
        <div class="box" data-gss-id="89347">One</div>
      """
      engine.execute [
          ['var', '.box[x]', 'x', ['$class','box']]
        ]
      chai.expect(engine.workerCommands).to.eql [
          ['var', '$12322[x]', '$12322']
          ['var', '$34222[x]', '$34222']
          ['var', '$35346[x]', '$35346']
          ['var', '$89347[x]', '$89347']
        ]

    it 'varexp with class', ->
      container.innerHTML = """
        <div class="box" data-gss-id="12322">One</div>
        <div class="box" data-gss-id="34222">One</div>
        <div class="box" data-gss-id="35346">One</div>
        <div class="box" data-gss-id="89347">One</div>
      """
      engine.execute [
        ['var', '.box[x]', 'x', ['$class','box']]
        ['var', '.box[width]', 'width', ['$class','box']]
        ['varexp', '.box[right]', ['plus',['get','.box[x]'],['get','.box[width]']], ['$class','box']]
      ]
      chai.expect(engine.workerCommands).to.eql [
        ['var', '$12322[x]', '$12322']
        ['var', '$34222[x]', '$34222']
        ['var', '$35346[x]', '$35346']
        ['var', '$89347[x]', '$89347']
        ['var', '$12322[width]', '$12322']
        ['var', '$34222[width]', '$34222']
        ['var', '$35346[width]', '$35346']
        ['var', '$89347[width]', '$89347']
        ['varexp', '$12322[right]',['plus',['get','$12322[x]'],['get','$12322[width]']]]
        ['varexp', '$34222[right]',['plus',['get','$34222[x]'],['get','$34222[width]']]]
        ['varexp', '$35346[right]',['plus',['get','$35346[x]'],['get','$35346[width]']]]
        ['varexp', '$89347[right]',['plus',['get','$89347[x]'],['get','$89347[width]']]]
      ]

    it 'eq with class', ->
      container.innerHTML = """
        <div class="box" data-gss-id="12322">One</div>
        <div class="box" data-gss-id="34222">One</div>
      """
      engine.execute [
        ['var', '.box[width]', 'width', ['$class','box']]
        ['var', '[grid-col]']
        ['eq', ['get','.box[width]','.box'],['get','[grid-col]']]
        ['eq', ['number','100'],['get','[grid-col]']]
      ]
      chai.expect(engine.workerCommands).to.eql [
        ['var', '$12322[width]', '$12322']
        ['var', '$34222[width]', '$34222']
        ['var', '[grid-col]']
        ['eq', ['get','$12322[width]','.box$12322'],['get','[grid-col]']]
        ['eq', ['get','$34222[width]','.box$34222'],['get','[grid-col]']]
        ['eq', ['number','100'],['get','[grid-col]']]
      ]

    it 'lte for class & id selectos', ->
      container.innerHTML = """
        <div id="box1" class="box" data-gss-id="12322">One</div>
        <div class="box" data-gss-id="34222">One</div>
        <div class="box" data-gss-id="35346">One</div>
      """
      engine.execute [
        ['var', '.box[width]', 'width', ['$class','box']]
        ['var', '#box1[width]', 'width', ['$id','box1']]
        ['lte', ['get','.box[width]','.box'],['get','#box1[width]','#box1']]
      ]
      chai.expect(engine.workerCommands).to.eql [
        ['var', '$12322[width]', '$12322']
        ['var', '$34222[width]', '$34222']
        ['var', '$35346[width]', '$35346']
        ['var', '$12322[width]', '$12322'] # duplicates resolved by worker?
        ['lte', ['get','$12322[width]','.box$12322'],['get','$12322[width]','#box1$12322']]
        ['lte', ['get','$34222[width]','.box$34222'],['get','$12322[width]','#box1$12322']]
        ['lte', ['get','$35346[width]','.box$35346'],['get','$12322[width]','#box1$12322']]
      ]

    it 'intrinsic-width with class', ->
      container.innerHTML = """
        <div style="width:111px;" class="box" data-gss-id="12322">One</div>
        <div style="width:222px;" class="box" data-gss-id="34222">One</div>
        <div style="width:333px;" class="box" data-gss-id="35346">One</div>
      """
      engine.execute [
        ['var', '.box[width]', 'width', ['$class','box']]
        ['var', '.box[intrinsic-width]', 'intrinsic-width', ['$class','box']]
        ['eq', ['get','.box[width]','.box'],['get','.box[intrinsic-width]','.box']]
      ]
      chai.expect(engine.workerCommands).to.eql [
        ['var', '$12322[width]', '$12322']
        ['var', '$34222[width]', '$34222']
        ['var', '$35346[width]', '$35346']
        ['var', '$12322[intrinsic-width]', '$12322']
        ['var', '$34222[intrinsic-width]', '$34222']
        ['var', '$35346[intrinsic-width]', '$35346']
        ['suggest', ['get','$12322[intrinsic-width]'], ['number', 111], 'required']
        ['suggest', ['get','$34222[intrinsic-width]'], ['number', 222], 'required']
        ['suggest', ['get','$35346[intrinsic-width]'], ['number', 333], 'required']
        ['eq', ['get','$12322[width]','.box$12322'],['get','$12322[intrinsic-width]','.box$12322']]
        ['eq', ['get','$34222[width]','.box$34222'],['get','$34222[intrinsic-width]','.box$34222']]
        ['eq', ['get','$35346[width]','.box$35346'],['get','$35346[intrinsic-width]','.box$35346']]
      ]

    it '.box[width] == ::window[width]', ->
      container.innerHTML = """
        <div style="width:111px;" class="box" data-gss-id="12322">One</div>
      """
      engine.execute [
        ['var', '.box[width]', 'width', ['$class','box']]
        ['var', '::window[width]', 'width', ['$reserved','window']]
        ['eq', ['get','.box[width]','.box'],['get','::window[width]']]
      ]
      chai.expect(engine.workerCommands).to.eql [
        ['var', '$12322[width]', '$12322']
        ['var', '::window[width]']
        ['suggest', ['get','::window[width]'], ['number', window.innerWidth], 'required']
        ['eq', ['get','$12322[width]','.box$12322'],['get','::window[width]']]
      ]

    it '::window props', ->
      container.innerHTML = """
        <div style="width:111px;" class="box" data-gss-id="12322">One</div>
      """
      engine.execute [
        ['var', '::window[x]', 'x', ['$reserved','window']]
        ['var', '::window[y]', 'y', ['$reserved','window']]
        ['var', '::window[width]', 'width', ['$reserved','window']]
        ['var', '::window[height]', 'height', ['$reserved','window']]
      ]
      console.log engine.workerCommands
      chai.expect(engine.workerCommands).to.eql [
        ['var', '::window[x]']
        ['eq', ['get','::window[x]'],['number',0], 'required']
        ['var', '::window[y]']
        ['eq', ['get','::window[y]'],['number',0], 'required']
        ['var', '::window[width]']
        ['suggest', ['get','::window[width]'], ['number', window.innerWidth], 'required']
        ['var', '::window[height]']
        ['suggest', ['get','::window[height]'], ['number', window.innerHeight], 'required']
      ]

  #
  #
  #
  describe 'live command spawning -', ->
    
    describe 'adds & removes -', ->
      it 'add to class', (done) ->
        container.innerHTML = """
          <div class="box" data-gss-id="12322">One</div>
          <div class="box" data-gss-id="34222">One</div>
        """
        engine.run commands: [
            ['var', '.box[x]', 'x', ['$class','box']]
            ['eq', ['get','.box[x]','.box'], ['number',100]]
          ]
        chai.expect(engine.lastWorkerCommands).to.eql [
            ['var', '$12322[x]', '$12322']
            ['var', '$34222[x]', '$34222']
            ['eq', ['get','$12322[x]','.box$12322'], ['number',100]]
            ['eq', ['get','$34222[x]','.box$34222'], ['number',100]]
          ]
        count = 0
        listener = (e) ->
          count++
          if count is 1
            container.insertAdjacentHTML('beforeend', '<div class="box" data-gss-id="35346">One</div>')
          else if count is 2
            chai.expect(engine.lastWorkerCommands).to.eql [
                ['var', '$35346[x]', '$35346']
                ['eq', ['get','$35346[x]','.box$35346'], ['number',100]]
              ]
            container.removeEventListener 'solved', listener
            done()
        container.addEventListener 'solved', listener

      it 'removed from dom', (done) ->
        container.innerHTML = """
          <div class="box" data-gss-id="12322">One</div>
          <div class="box" data-gss-id="34222">One</div>
        """
        engine.run commands: [
            ['var', '.box[x]', 'x', ['$class','box']]
            ['eq', ['get','.box[x]','.box'], ['number',100]]
          ]
        chai.expect(engine.lastWorkerCommands).to.eql [
            ['var', '$12322[x]', '$12322']
            ['var', '$34222[x]', '$34222']
            ['eq', ['get','$12322[x]','.box$12322'], ['number',100]]
            ['eq', ['get','$34222[x]','.box$34222'], ['number',100]]
          ]
        count = 0
        listener = (e) ->
          count++
          if count is 1
            res = container.querySelector('[data-gss-id="34222"]')
            res.parentNode.removeChild res
          else if count is 2
            chai.expect(engine.lastWorkerCommands).to.eql [
              ['remove', '$34222'] # this should be the only command
            ]
            container.removeEventListener 'solved', listener
            done()
        container.addEventListener 'solved', listener

      it 'removed from selector', (done) ->
        container.innerHTML = """
          <div class="box" data-gss-id="12322">One</div>
          <div class="box" data-gss-id="34222">One</div>
        """
        engine.run commands: [
            ['var', '.box[x]', 'x', ['$class','box']]
            ['eq', ['get','.box[x]','.box'], ['number',100]]
          ]
        chai.expect(engine.lastWorkerCommands).to.eql [
            ['var', '$12322[x]', '$12322']
            ['var', '$34222[x]', '$34222']
            ['eq', ['get','$12322[x]','.box$12322'], ['number',100]]
            ['eq', ['get','$34222[x]','.box$34222'], ['number',100]]
          ]
        count = 0
        listener = (e) ->
          count++
          if count is 1
            el = container.querySelector('[data-gss-id="34222"]')
            el.className = el.classList.remove('box') #.replace(/\bbox\b/,'')
            # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            # JSMutationObserver on Phantom doesn't trigger mutation
            #engine._handleMutations()
            # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
          else if count is 2
            chai.expect(engine.lastWorkerCommands).to.eql [
                ['remove', '.box$34222']
              ]
            container.removeEventListener 'solved', listener
            done()
        container.addEventListener 'solved', listener
    
    #
    #
    describe 'resizing -', ->

      it 'element resized by style change', (done) ->
        container.innerHTML = """
          <div style="width:111px;" id="box1" class="box" data-gss-id="111">One</div>
          <div style="width:222px;" id="box2" class="box" data-gss-id="222">One</div>
        """
        engine.run commands: [
          ['var', '.box[height]', 'height', ['$class','box']]
          ['var', '#box1[intrinsic-width]', 'intrinsic-width', ['$id','box1']]
          ['eq', ['get','.box[height]','.box'],['get','#box1[intrinsic-width]','#box1']]
        ]
        count = 0
        el = null
        listener = (e) ->
          count++
          if count is 1
            el = container.querySelector('[data-gss-id="111"]')            
            el.style.width = 1110+"px"
            # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            # JSMutationObserver on Phantom doesn't trigger mutation
            #engine._handleMutations()
            # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
          else if count is 2
            chai.expect(engine.lastWorkerCommands).to.eql [
                ['suggest', ['get','$111[intrinsic-width]'], ['number', 1110], 'required']
              ]
            chai.expect(engine.vars['$111[intrinsic-width]']).to.equal 1110
            chai.expect(engine.vars['$222[height]']).to.equal 1110
            container.removeEventListener 'solved', listener
            done()
        container.addEventListener 'solved', listener
      
      it 'element resized by inserting child', (done) ->
        container.innerHTML = """
          <div style="width:111px;" id="box1" class="box" data-gss-id="111">One</div>
          <div style="width:222px;" id="box2" class="box" data-gss-id="222">One</div>
        """
        engine.run commands: [
          ['var', '.box[height]', 'height', ['$class','box']]
          ['var', '#box1[intrinsic-width]', 'intrinsic-width', ['$id','box1']]
          ['eq', ['get','.box[height]','.box'],['get','#box1[intrinsic-width]','#box1']]
        ]
        count = 0
        listener = (e) ->
          count++
          if count is 1
            el = container.querySelector('[data-gss-id="111"]')            
            el.innerHTML = "<div></div>"
            # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            # JSMutationObserver on Phantom doesn't trigger mutation
            #engine._handleMutations()
            # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
          else if count is 2
            chai.expect(engine.lastWorkerCommands).to.eql [
                ['suggest', ['get','$111[intrinsic-width]'], ['number', 111], 'required']
              ]
            container.removeEventListener 'solved', listener
            done()
        container.addEventListener 'solved', listener
      
      it 'element resized by changing text', (done) ->
        container.innerHTML = """
          <div style="width:111px;" id="box1" class="box" data-gss-id="111">One</div>
          <div style="width:222px;" id="box2" class="box" data-gss-id="222">One</div>
        """
        engine.run commands: [
          ['var', '.box[height]', 'height', ['$class','box']]
          ['var', '#box1[intrinsic-width]', 'intrinsic-width', ['$id','box1']]
          ['eq', ['get','.box[height]','.box'],['get','#box1[intrinsic-width]','#box1']]
        ]
        count = 0
        el = null
        listener = (e) ->
          count++          
          if count is 1
            el = container.querySelector('[data-gss-id="111"]')            
            engine.lastWorkerCommands = [] # to ensure it's reset
            el.innerHTML = "aa"
            # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            # JSMutationObserver on Phantom doesn't trigger mutation
            #engine._handleMutations()
            # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
          else if count is 2            
            chai.expect(engine.lastWorkerCommands).to.eql [
                ['suggest', ['get','$111[intrinsic-width]'], ['number', 111], 'required']
              ]
            engine.lastWorkerCommands = [] # to ensure it's reset
            el.innerHTML = "aabbb"            
          else if count is 3
            chai.expect(engine.lastWorkerCommands).to.eql [
                ['suggest', ['get','$111[intrinsic-width]'], ['number', 111], 'required']
              ]
            container.removeEventListener 'solved', listener
            done()
        container.addEventListener 'solved', listener
      
      


  describe 'live command perfs', ->
 
    it '100 at once', (done) ->
      count = 0

      innerHTML = """
          <div class='box' data-gss-id='35346#{count++}'>One</div>     <div class='box' data-gss-id='35346#{count++}'>One</div>    <div class='box' data-gss-id='35346#{count++}'>One</div>    <div class='box' data-gss-id='35346#{count++}'>One</div>    <div class='box' data-gss-id='35346#{count++}'>One</div>    <div class='box' data-gss-id='35346#{count++}'>One</div>    <div class='box' data-gss-id='35346#{count++}'>One</div>    <div class='box' data-gss-id='35346#{count++}'>One</div>    <div class='box' data-gss-id='35346#{count++}'>One</div>   <div class='box' data-gss-id='35346#{count++}'>One</div>
          <div class='box' data-gss-id='21823#{count++}'>One</div>     <div class='box' data-gss-id='21823#{count++}'>One</div>    <div class='box' data-gss-id='21823#{count++}'>One</div>    <div class='box' data-gss-id='21823#{count++}'>One</div>    <div class='box' data-gss-id='21823#{count++}'>One</div>    <div class='box' data-gss-id='21823#{count++}'>One</div>    <div class='box' data-gss-id='21823#{count++}'>One</div>    <div class='box' data-gss-id='21823#{count++}'>One</div>    <div class='box' data-gss-id='21823#{count++}'>One</div>   <div class='box' data-gss-id='21823#{count++}'>One</div>
          <div class='box' data-gss-id='21423#{count++}'>One</div>     <div class='box' data-gss-id='21423#{count++}'>One</div>    <div class='box' data-gss-id='21423#{count++}'>One</div>    <div class='box' data-gss-id='21423#{count++}'>One</div>    <div class='box' data-gss-id='21423#{count++}'>One</div>    <div class='box' data-gss-id='21423#{count++}'>One</div>    <div class='box' data-gss-id='21423#{count++}'>One</div>    <div class='box' data-gss-id='21423#{count++}'>One</div>    <div class='box' data-gss-id='21423#{count++}'>One</div>   <div class='box' data-gss-id='21423#{count++}'>One</div>
          <div class='box' data-gss-id='35246#{count++}'>One</div>     <div class='box' data-gss-id='35246#{count++}'>One</div>    <div class='box' data-gss-id='35246#{count++}'>One</div>    <div class='box' data-gss-id='35246#{count++}'>One</div>    <div class='box' data-gss-id='35246#{count++}'>One</div>    <div class='box' data-gss-id='35246#{count++}'>One</div>    <div class='box' data-gss-id='35246#{count++}'>One</div>    <div class='box' data-gss-id='35246#{count++}'>One</div>    <div class='box' data-gss-id='35246#{count++}'>One</div>   <div class='box' data-gss-id='35246#{count++}'>One</div>
          <div class='box' data-gss-id='24123#{count++}'>One</div>     <div class='box' data-gss-id='24123#{count++}'>One</div>    <div class='box' data-gss-id='24123#{count++}'>One</div>    <div class='box' data-gss-id='24123#{count++}'>One</div>    <div class='box' data-gss-id='24123#{count++}'>One</div>    <div class='box' data-gss-id='24123#{count++}'>One</div>    <div class='box' data-gss-id='24123#{count++}'>One</div>    <div class='box' data-gss-id='24123#{count++}'>One</div>    <div class='box' data-gss-id='24123#{count++}'>One</div>   <div class='box' data-gss-id='24123#{count++}'>One</div>
          <div class='box' data-gss-id='25123#{count++}'>One</div>     <div class='box' data-gss-id='25123#{count++}'>One</div>    <div class='box' data-gss-id='25123#{count++}'>One</div>    <div class='box' data-gss-id='25123#{count++}'>One</div>    <div class='box' data-gss-id='25123#{count++}'>One</div>    <div class='box' data-gss-id='25123#{count++}'>One</div>    <div class='box' data-gss-id='25123#{count++}'>One</div>    <div class='box' data-gss-id='25123#{count++}'>One</div>    <div class='box' data-gss-id='25123#{count++}'>One</div>   <div class='box' data-gss-id='25123#{count++}'>One</div>
          <div class='box' data-gss-id='36346#{count++}'>One</div>     <div class='box' data-gss-id='36346#{count++}'>One</div>    <div class='box' data-gss-id='36346#{count++}'>One</div>    <div class='box' data-gss-id='36346#{count++}'>One</div>    <div class='box' data-gss-id='36346#{count++}'>One</div>    <div class='box' data-gss-id='36346#{count++}'>One</div>    <div class='box' data-gss-id='36346#{count++}'>One</div>    <div class='box' data-gss-id='36346#{count++}'>One</div>    <div class='box' data-gss-id='36346#{count++}'>One</div>   <div class='box' data-gss-id='36346#{count++}'>One</div>
          <div class='box' data-gss-id='27123#{count++}'>One</div>     <div class='box' data-gss-id='27123#{count++}'>One</div>    <div class='box' data-gss-id='27123#{count++}'>One</div>    <div class='box' data-gss-id='27123#{count++}'>One</div>    <div class='box' data-gss-id='27123#{count++}'>One</div>    <div class='box' data-gss-id='27123#{count++}'>One</div>    <div class='box' data-gss-id='27123#{count++}'>One</div>    <div class='box' data-gss-id='27123#{count++}'>One</div>    <div class='box' data-gss-id='27123#{count++}'>One</div>   <div class='box' data-gss-id='27123#{count++}'>One</div>
          <div class='box' data-gss-id='28123#{count++}'>One</div>     <div class='box' data-gss-id='28123#{count++}'>One</div>    <div class='box' data-gss-id='28123#{count++}'>One</div>    <div class='box' data-gss-id='28123#{count++}'>One</div>    <div class='box' data-gss-id='28123#{count++}'>One</div>    <div class='box' data-gss-id='28123#{count++}'>One</div>    <div class='box' data-gss-id='28123#{count++}'>One</div>    <div class='box' data-gss-id='28123#{count++}'>One</div>    <div class='box' data-gss-id='28123#{count++}'>One</div>   <div class='box' data-gss-id='28123#{count++}'>One</div>
          <div class='box' data-gss-id='39346#{count++}'>One</div>     <div class='box' data-gss-id='39346#{count++}'>One</div>    <div class='box' data-gss-id='39346#{count++}'>One</div>    <div class='box' data-gss-id='39346#{count++}'>One</div>    <div class='box' data-gss-id='39346#{count++}'>One</div>    <div class='box' data-gss-id='39346#{count++}'>One</div>    <div class='box' data-gss-id='39346#{count++}'>One</div>    <div class='box' data-gss-id='39346#{count++}'>One</div>    <div class='box' data-gss-id='39346#{count++}'>One</div>   <div class='box' data-gss-id='39346#{count++}'>One</div>
          <div class='box' data-gss-id='20123#{count++}'>One</div>     <div class='box' data-gss-id='20123#{count++}'>One</div>    <div class='box' data-gss-id='20123#{count++}'>One</div>    <div class='box' data-gss-id='20123#{count++}'>One</div>    <div class='box' data-gss-id='20123#{count++}'>One</div>    <div class='box' data-gss-id='20123#{count++}'>One</div>    <div class='box' data-gss-id='20123#{count++}'>One</div>    <div class='box' data-gss-id='20123#{count++}'>One</div>    <div class='box' data-gss-id='20123#{count++}'>One</div>   <div class='box' data-gss-id='20123#{count++}'>One</div>
          <div class='box' data-gss-id='21123#{count++}'>One</div>     <div class='box' data-gss-id='21123#{count++}'>One</div>    <div class='box' data-gss-id='21123#{count++}'>One</div>    <div class='box' data-gss-id='21123#{count++}'>One</div>    <div class='box' data-gss-id='21123#{count++}'>One</div>    <div class='box' data-gss-id='21123#{count++}'>One</div>    <div class='box' data-gss-id='21123#{count++}'>One</div>    <div class='box' data-gss-id='21123#{count++}'>One</div>    <div class='box' data-gss-id='21123#{count++}'>One</div>   <div class='box' data-gss-id='21123#{count++}'>One</div>


      """
      container.innerHTML = innerHTML

      engine.run commands: [
          ['var', '.box[width]', 'width', ['$class','box']]
          ['var', '.box[intrinsic-width]', 'intrinsic-width', ['$class','box']]
          ['eq', ['get','.box[width]','box'],['get','.box[intrinsic-width]','.box']]
        ]
      
      listener = (e) ->
        container.removeEventListener 'solved', listener        
        done()
      container.addEventListener 'solved', listener
    
    it '100 serially', (done) ->
      container.innerHTML = ""
      engine.run commands: [
          ['var', '.box[width]', 'width', ['$class','box']]
          ['var', '.box[intrinsic-width]', 'intrinsic-width', ['$class','box']]
          ['eq', ['get','.box[width]','.box'],['get','.box[intrinsic-width]','.box']]
        ]

      count = 1
      
      # first one here otherwise, nothing to solve
      container.insertAdjacentHTML 'beforeend', """
          <div class='box' data-gss-id='35346#{count}'>One</div>
        """      
      listener = (e) ->        
        count++
        container.insertAdjacentHTML 'beforeend', """
            <div class='box' data-gss-id='35346#{count}'>One</div>
          """
        #console.log count
        if count is 100
          container.removeEventListener 'solved', listener
          done()

      container.addEventListener 'solved', listener

