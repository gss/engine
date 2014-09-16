DEMOS = 
  GSS1: """
    <style scoped>
      header {
        background: orange;
        height: 50px;
      }

      main {
        background: yellow;
        height: 100px;
        z-index: 10;
      }

      footer {
        background: red;
        width: 10px;
        height: 20px;
      }

      aside {
        background: blue;
        width: 100px;
      }

      ul li {
        list-style: none;
        background: green;
        top: 5px;
      }
    </style>
    <style type="text/gss">
      // plural selectors can be used as singular, a la jQ
      [left-margin] == (main)[right];

      // global condition with nested rules
      @if (main)[top] > 50 {
        main {
          background: blue;
        }
      }
      header {
        ::[left] == 0;
        // condition inside css rule
        @if (::scope[intrinsic-width] > ::scope[intrinsic-height]) {
          ::[width] == ::scope[intrinsic-width] / 4;
          opacity: 0.5;
        } @else {
          ::[width] == ::scope[intrinsic-width] / 2;
          opacity: 0.75;
        }
      }
      footer {
        ::[top] == (main)[height]; 
        ::[height] == ::scope[intrinsic-height] * 2;
      }

      aside {
        ::[left] == (main)[right];
        ::[height] == 100;
        ::[top] == (header)[intrinsic-height] + (header)[intrinsic-y];
      }

      main {
        // Bind things to scroll position
        ::[top] == ::scope[scroll-top];// + (header)[intrinsic-y];
        ::[width] == (aside)[intrinsic-width];
        ::[left] == (header)[right];

        // use intrinsic-height to avoid binding. Should be:
        // height: :window[height] - (header)[height];
        ::[height] == ::scope[intrinsic-height] - (header)[intrinsic-height];
      } 
      // Custom combinators
      ul li !~ li {

        ::[height] == 30;
        
        // FIXME: Regular css style is never removed (needs specificity sorting and groupping);
        background-color: yellowgreen;
      }

      // Chains
      ul li {
        // justify by using variable
        ::[width] == [li-width];

        (&:previous)[right] == &[left];
        (&:last)[right] == ::scope[intrinsic-width] - 16;
        (&:first)[left] == 0;
      }
    </style>


    <header id="header"></header>
    <main id="main">
      <ul>
        <li id="li1">1</li>
        <li id="li2">2</li>
        <li id="li3">3</li>
      </ul>
    </main>
    <aside id="aside"></aside>
    <footer id="footer"></footer>
  """
  PROFILE_CARD: """
    <style>
      #profile-card-demo * { 
        box-sizing: border-box;
        -webkit-box-sizing: border-box;
        -moz-box-sizing: border-box;
      }

      #profile-card-demo {
        background-color: hsl(3, 18%, 43%);
      }

      #profile-card-demo * {
        -webkit-backface-visibility: hidden;
        margin: 0px;
        padding: 0px;
        outline: none;
      }

      #background {
        background-color: hsl(3, 18%, 43%);
        position: absolute;
        top: 0px;
        bottom: 0px;
        right: 0px;
        left: 0px;
        z-index: -1;
        background-image: url('assets/cover.jpg');
        background-size: cover;
        background-position: 50% 50%;
        opacity: .7;
        -webkit-filter: blur(5px) contrast(.7);
      }

      #cover {
        background-color: #ccc;
        background-image: url('assets/cover.jpg');
        background-size: cover;
        background-position: 50% 50%;
      }

      #avatar {
        background-image: url('assets/avatar.jpg');
        background-size: cover;
        background-position: 50% 50%;
        border: 10px solid hsl(39, 40%, 90%);
        box-shadow: 0 1px 1px hsla(0,0%,0%,.5);
      }

      #profile-card-demo h1 {
        color: white;
        text-shadow: 0 1px 1px hsla(0,0%,0%,.5);
        font-size: 40px;
        line-height: 1.5em;
        font-family: "adelle",georgia,serif;
        font-style: normal;
        font-weight: 400;
      }

      #profile-card-demo button {
        color: hsl(3, 18%, 43%);
        background-color: hsl(39, 40%, 90%);
        text-shadow: 0 1px hsla(3, 18%, 100%, .5);
        font-family: "proxima-nova-soft",helvetica,sans-serif;
        font-style: normal;
        font-weight: 700;
        font-size: 14px;
        text-transform:uppercase;
        letter-spacing:.1em;
        border: none;  
      }

      #profile-card-demo button.primary {
        background-color: #e38f71;
        color: white;
        text-shadow: 0 -1px hsla(3, 18%, 43%, .5);
      }

      #profile-card-demo #profile-card, .card {
        background-color: hsl(39, 40%, 90%);
        border: 1px solid hsla(0,0%,100%,.6);
        box-shadow: 0 5px 8px hsla(0,0%,0%,.3);  
      }
    </style>
    <style type="text/gss">
      /* vars */
      [gap] == 20 !required;
      [flex-gap] >= [gap] * 2 !required;
      [radius] == 10 !required;
      [outer-radius] == [radius] * 2 !required;

      /* scope-as-window for tests */
      ::scope[left] == 0;
      ::scope[top] == 0;
      ::scope[width] == ::scope[intrinsic-width] !require;
      ::scope[height] == ::scope[intrinsic-height] !require;

      /* elements */
      #profile-card {      
        width: == ::scope[intrinsic-width] - 480;            
        height: == ::scope[intrinsic-height] - 350;
        center-x: == ::scope[center-x];
        center-y: == ::scope[center-y];        
        border-radius: == [outer-radius];
      }

      #avatar {
        height: == 160 !required;
        width: == ::[height];
        border-radius: == ::[height] / 2;        
      }

      #name {
        height: == ::[intrinsic-height] !required;
        width: == ::[intrinsic-width] !required;
      }

      #cover {
        border-radius: == [radius];
      }

      button {
        width: == ::[intrinsic-width] !required;
        height: == ::[intrinsic-height] !required;        
        padding: == [gap];
        padding-top: == [gap] / 2;
        padding-bottom: == [gap] / 2;
        border-radius: == [radius];
      }
      

@h |~-~(#name)~-~| in(#cover) gap([gap]*2) !strong;

/* landscape profile-card */
@if #profile-card[width] >= #profile-card[height] {

  @v |
      -
      (#avatar)
      -
      (#name)
      -
     |
    in(#cover)
    gap([gap]) outer-gap([flex-gap]) {
      center-x: == #cover[center-x];
  }

  @h |-10-(#cover)-10-|
    in(#profile-card);

  @v |
      -10-
      (#cover)
      -
      (#follow)
      -
     |
    in(#profile-card)
    gap([gap]) !strong;

  #follow[center-x] == #profile-card[center-x];

  @h |-(#message)~-~(#follow)~-~(#following)-(#followers)-|
    in(#profile-card)
    gap([gap])
    !strong {
      &[top] == &:next[top];
    }
}

/* portrait profile-card */
@else {
  @v |
      -
      (#avatar)
      -
      (#name)
      -
      (#follow)
      -
      (#message)
      -
      (#following)
      -
      (#followers)
      -
     |
    in(#cover)
    gap([gap])
    outer-gap([flex-gap]) !strong {
      center-x: == #profile-card[center-x];
  }

  @h |-10-(#cover)-10-| in(#profile-card);
  @v |-10-(#cover)-10-| in(#profile-card);
}

    </style>
    <div id="background"></div>
    <div id="profile-card"></div>
    <div id="cover"></div>
    <div id="avatar"></div>
    <h1 id="name">Dan Daniels</h1>
    <button id="follow" class="primary">Follow</button>
    <button id="following">Following</button>
    <button id="followers">Followers</button>
    <button id="message">Message</button>
  """
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


describe 'Full page tests', -> 
  engine = container = null

  afterEach ->
    debugger
    remove(container)
    engine.destroy()

  for type, index in ['With worker', 'Without worker']
    do (type, index) ->
      describe type, ->
        it 'gss1 demo', (done) ->
          container = document.createElement('div')
          container.style.height = '640px'
          container.style.width = '640px'
          container.style.position = 'absolute'
          container.style.overflow = 'auto'
          container.style.left = 0
          container.style.top = 0
          window.$engine = engine = new GSS(container, index == 0)
          $('#fixtures').appendChild container

          container.innerHTML = DEMOS.GSS1
          debugger
          engine.then (solution) ->
            expect(solution['li-width']).to.eql((640 - 16) / 3)
            expect(solution['$aside[x]']).to.eql(640 / 2 + 100)
            expect(solution['$header[width]']).to.eql(Math.round(640 / 2))

            li = engine.$first('ul li:last-child')
            clone = li.cloneNode()
            clone.id = 'li4'
            clone.innerHTML = '4'
            
            li.parentNode.appendChild(clone)
            engine.then (solution) ->
              expect(Math.round(solution['li-width'])).to.eql((640 - 16) / 4)
              li = engine.$first('ul li:first-child')
              li.parentNode.removeChild(li)
              console.error('remove')
              engine.then (solution) ->
                expect(Math.round solution['li-width']).to.eql((640 - 16) / 3)
                expect(solution['$li2[x]']).to.eql(0)
                expect(solution['$li1[x]']).to.eql(null)
                engine.scope.style.width = '1024px'
                engine.then (solution) ->
                  expect(Math.round solution['li-width']).to.eql(Math.round((1024 - 16) / 3))
                  expect(solution['$header[width]']).to.eql(1024 / 4)
                  container.innerHTML = ""
                  engine.then (solution) ->
                    done()

        it 'profile card', (done) ->
          container = document.createElement('div')
          container.id = 'profile-card-demo'
          container.style.height = '1024px'
          container.style.width = '768px'
          container.style.position = 'absolute'
          container.style.overflow = 'auto'
          container.style.left = 0
          container.style.top = 0

          window.$engine = engine = new GSS(container, index == 0)
          $('#fixtures').appendChild container

          container.innerHTML = DEMOS.PROFILE_CARD

          engine.then (solution) ->
            expect(solution['$follow[y]']).to.eql 540
            expect(solution['$follow[x]']).to.eql 329.5
            expect(solution['flex-gap']).to.eql 95
            expect(solution['flex-gap']).to.eql 95

            container.style.height = '768px'
            container.style.width = '1124px'

            engine.then (solution) ->
              expect(solution['$follow[x]']).to.eql 435
              expect(solution['$follow[y]']).to.eql 537
              container.style.height = '1024px'
              container.style.width = '768px'


              engine.then (solution) ->
                expect(solution['flex-gap']).to.eql 95
                expect(solution['flex-gap']).to.eql 95
                expect(solution['$follow[x]']).to.eql 329.5
                expect(solution['$follow[y]']).to.eql 540

                container.style.height = '768px'
                container.style.width = '1124px'
                
                engine.then (solution) ->
                  expect(solution['$follow[x]']).to.eql 435
                  expect(solution['$follow[y]']).to.eql 537

                  container.innerHTML = ""
                  engine.then (solution) ->
                    done()
