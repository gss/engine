Engine = require 'gss-engine/lib/Engine.js'

describe 'GSS commands', ->
  container = null
  gss = null

  before ->
    fixtures = document.getElementById 'fixtures'
    container = document.createElement 'div'
    fixtures.appendChild container
    container.innerHTML = """
      <button id="button1">One</button>
      <button id="button2">Second</button>
      <button id="button3">Three</button>
      <button id="button4">4</button>
    """
  beforeEach ->
    gss = new Engine '../browser/gss-engine/worker/gss-solver.js', container

  afterEach (done) ->
    gss.stop()
    done()

  describe 'when initialized', ->
    it 'should be bound to the DOM container', ->
      chai.expect(gss.container).to.eql container

  describe 'command transformations -', ->
    it 'var with class & generate ids', ->
      container.innerHTML = """
        <div class="box">One</div>
        <div class="box">One</div>
        <div class="box">One</div>
      """
      gss.execute [
          ['var', '.box[x]', 'x', ['$class','box']]
        ]
      chai.expect(gss.commandsForWorker).to.eql [
          ['var', '$1[x]', '$1']
          ['var', '$2[x]', '$2']
          ['var', '$3[x]', '$3']
        ]

    it 'var with class & static ids', ->
      container.innerHTML = """
        <div class="box" data-gss-id="12322">One</div>
        <div class="box" data-gss-id="34222">One</div>
        <div class="box" data-gss-id="35346">One</div>
        <div class="box" data-gss-id="89347">One</div>
      """
      gss.execute [
          ['var', '.box[x]', 'x', ['$class','box']]
        ]
      chai.expect(gss.commandsForWorker).to.eql [
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
      gss.execute [
        ['var', '.box[x]', 'x', ['$class','box']]
        ['var', '.box[width]', 'width', ['$class','box']]
        ['varexp', '.box[right]', ['plus',['get','.box[x]'],['get','.box[width]']], ['$class','box']]
      ]
      chai.expect(gss.commandsForWorker).to.eql [
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
      gss.execute [
        ['var', '.box[width]', 'width', ['$class','box']]
        ['var', '[grid-col]']
        ['eq', ['get','.box[width]'],['get','[grid-col]']]
        ['eq', ['number','100'],['get','[grid-col]']]
      ]
      chai.expect(gss.commandsForWorker).to.eql [
        ['var', '$12322[width]', '$12322']
        ['var', '$34222[width]', '$34222']
        ['var', '[grid-col]']
        ['eq', ['get','$12322[width]'],['get','[grid-col]']]
        ['eq', ['get','$34222[width]'],['get','[grid-col]']]
        ['eq', ['number','100'],['get','[grid-col]']]
      ]

    it 'lte for class & id selectos', ->
      container.innerHTML = """
        <div id="box1" class="box" data-gss-id="12322">One</div>
        <div class="box" data-gss-id="34222">One</div>
        <div class="box" data-gss-id="35346">One</div>
      """
      gss.execute [
        ['var', '.box[width]', 'width', ['$class','box']]
        ['var', '#box1[width]', 'width', ['$id','box1']]
        ['lte', ['get','.box[width]'],['get','#box1[width]']]
      ]
      chai.expect(gss.commandsForWorker).to.eql [
        ['var', '$12322[width]', '$12322']
        ['var', '$34222[width]', '$34222']
        ['var', '$35346[width]', '$35346']
        ['var', '$12322[width]', '$12322'] # duplicates resolved by worker?
        ['lte', ['get','$12322[width]'],['get','$12322[width]']]
        ['lte', ['get','$34222[width]'],['get','$12322[width]']]
        ['lte', ['get','$35346[width]'],['get','$12322[width]']]
      ]

    it 'intrinsic-width with class', ->
      container.innerHTML = """
        <div style="width:111px;" class="box" data-gss-id="12322">One</div>
        <div style="width:222px;" class="box" data-gss-id="34222">One</div>
        <div style="width:333px;" class="box" data-gss-id="35346">One</div>
      """
      gss.execute [
        ['var', '.box[width]', 'width', ['$class','box']]
        ['var', '.box[intrinsic-width]', 'intrinsic-width', ['$class','box']]
        ['eq', ['get','.box[width]'],['get','.box[intrinsic-width]']]
      ]
      chai.expect(gss.commandsForWorker).to.eql [
        ['var', '$12322[width]', '$12322']
        ['var', '$34222[width]', '$34222']
        ['var', '$35346[width]', '$35346']
        ['var', '$12322[intrinsic-width]', '$12322']
        ['var', '$34222[intrinsic-width]', '$34222']
        ['var', '$35346[intrinsic-width]', '$35346']
        ['suggestvalue', ['get','$12322[intrinsic-width]'], ['number', 111]]
        ['suggestvalue', ['get','$34222[intrinsic-width]'], ['number', 222]]
        ['suggestvalue', ['get','$35346[intrinsic-width]'], ['number', 333]]
        ['eq', ['get','$12322[width]'],['get','$12322[intrinsic-width]']]
        ['eq', ['get','$34222[width]'],['get','$34222[intrinsic-width]']]
        ['eq', ['get','$35346[width]'],['get','$35346[intrinsic-width]']]
      ]

