
assert = chai.assert
expect = chai.expect

remove = (el) ->
  el?.parentNode?.removeChild(el)


describe 'Standalone page tests', -> 
  engine = container = iframe = null

  afterEach ->
    #remove(iframe)

  beforeEach ->
    iframe = document.createElement('iframe')
    document.body.appendChild(iframe)

  @timeout 100000
    
  describe 'Grid website', ->
    describe 'Virtuals demo', ->

      it 'should reorient', (done) ->
        i = 0
        listener = (e) ->
          if (e.origin == location.origin)
            
            expect()


          window.removeEventListener('message', listener)
          done()

        window.addEventListener('message', listener)

        iframe.width = 1024
        iframe.height = 768
        iframe.src = './pages/virtuals.html?log=0.5'



    describe 'Head cta section', ->

      it 'should reorient', (done) ->
        i = 0

        window.addEventListener('message', (e) ->
          if (e.origin == location.origin)
            
            expect()
        )

        iframe.width = 1024
        iframe.height = 768
        iframe.src = './pages/grid_head_cta.html?log=0.5'


    describe 'Team section', ->

      it 'should reorient', (done) ->
        i = 0

        window.addEventListener('message', (e) ->
          if (e.origin == location.origin)
            i++
            if i == 8
              return done()
            if i % 4 == 1
              expect(Math.floor e.data['$dan_tocchini[y]']).to.eql 228
              expect(Math.floor e.data['$dan_tocchini[x]']).to.eql 368
              expect(Math.floor e.data['$dan_tocchini[width]']).to.eql 288
              expect(Math.floor(e.data['$yaroslaff_fedin[y]'])).to.eql 1632
              expect(Math.floor(e.data['$yaroslaff_fedin[x]'])).to.eql 284
              expect(Math.floor(e.data['$yaroslaff_fedin[width]'])).to.eql 216
              expect(Math.floor e.data['$lost_cosmonaut[y]']).to.eql 2261
              expect(Math.floor e.data['$lost_cosmonaut[x]']).to.eql 642
              expect(Math.floor e.data['$lost_cosmonaut[width]']).to.eql 216
              iframe.width = 768
            else if i % 4 == 2
              expect(Math.floor e.data['$dan_tocchini[y]']).to.eql 0
              expect(Math.floor e.data['$dan_tocchini[x]']).to.eql 768
              expect(Math.floor e.data['$dan_tocchini[width]']).to.eql 768
              expect(Math.floor(e.data['$yaroslaff_fedin[y]'])).to.eql 0
              expect(Math.floor(e.data['$yaroslaff_fedin[x]'])).to.eql 6144
              expect(Math.floor(e.data['$yaroslaff_fedin[width]'])).to.eql 768
              expect(Math.floor e.data['$lost_cosmonaut[y]']).to.eql 0
              expect(Math.floor e.data['$lost_cosmonaut[x]']).to.eql 9983
              expect(Math.floor e.data['$lost_cosmonaut[width]']).to.eql 768
              iframe.width = 1024
            else if i % 4 == 3
              expect(Math.floor e.data['$dan_tocchini[y]']).to.eql 228
              expect(Math.floor e.data['$dan_tocchini[x]']).to.eql 368
              expect(Math.floor e.data['$dan_tocchini[width]']).to.eql 288
              expect(Math.floor(e.data['$yaroslaff_fedin[y]'])).to.eql 1632
              expect(Math.floor(e.data['$yaroslaff_fedin[x]'])).to.eql 284
              expect(Math.floor(e.data['$yaroslaff_fedin[width]'])).to.eql 216
              expect(Math.floor e.data['$lost_cosmonaut[y]']).to.eql 2261
              expect(Math.floor e.data['$lost_cosmonaut[x]']).to.eql 642
              expect(Math.floor e.data['$lost_cosmonaut[width]']).to.eql 216
              iframe.width = 320
            else
              expect(Math.floor e.data['$dan_tocchini[y]']).to.eql 218
              expect(Math.floor e.data['$dan_tocchini[x]']).to.eql 320
              expect(Math.floor e.data['$dan_tocchini[width]']).to.eql 320
              expect(Math.floor(e.data['$yaroslaff_fedin[y]'])).to.eql 218
              expect(Math.floor(e.data['$yaroslaff_fedin[x]'])).to.eql 2560
              expect(Math.floor(e.data['$yaroslaff_fedin[width]'])).to.eql 320
              expect(Math.floor e.data['$lost_cosmonaut[y]']).to.eql 218
              expect(Math.floor e.data['$lost_cosmonaut[x]']).to.eql 4160
              expect(Math.floor e.data['$lost_cosmonaut[width]']).to.eql 320
              iframe.width = 1024
        )

        iframe.width = 1024
        iframe.height = 768
        iframe.src = './pages/grid_team.html?log=0.5'
        

