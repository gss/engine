DEMOS = 
  SCOPING: """
    <div class="box w-virtual" onclick="this.classList.toggle('wo-virtual');
      this.classList.toggle('w-virtual');">
      <div class="innie"></div>
    </div>
    <div class="box wo-virtual" onclick="this.classList.toggle('wo-virtual');
      this.classList.toggle('w-virtual');">
      <div class="innie"></div>
    </div>
    <div class="box w-virtual" onclick="this.classList.toggle('wo-virtual');
      this.classList.toggle('w-virtual');">
      <div class="innie"></div>
    </div>
    
    <style>
    * {
      box-sizing: border-box;
    }
    
    .box {
      background-color: hsl(220,50%,50%);
    }    
    .wo-virtual .innie {
      background-color: hsl(360,100%,50%);
    }
    .w-virtual .innie {
      background-color: hsl(180,100%,50%);
    }
    .w-virtual:after {
      content: 'W/ SCOPED VIRTUAL';
      font-size: 40px;
      top: 32px;
      left: 32px;
      position:absolute;
    }
    .wo-virtual:after {
      content: 'W/O VIRTUAL';
      font-size: 40px;
      top: 32px;
      left: 32px;
      position:absolute;
    }
    
    </style>
    <style type="text/gss">

    
    ::scope[left] == 0;
    ::scope[top] == 0;
    ::scope[height] == ::scope[intrinsic-height];
    ::scope[width] == ::scope[intrinsic-width];

    .box.w-virtual {
      @h |-(&"zone")-| in(&) gap(20);
      @v |-(&"zone")-| in(&) gap(20);
      @h |(& .innie)| in(&"zone");
      @v |(& .innie)| in(&"zone");
    }
    .box.wo-virtual {
      @h |-(& .innie)-| in(&) gap(20);
      @v |-(& .innie)-| in(&) gap(20);
    }

    @v |-10-(.box)-20-... in(::scope) {
            
      @h |~100~(&)~100~| in(::scope);
      
      &[x] + 20 == &:next[x];
      &[right] - 20 == &:next[right];
      
      height: == 300;
      
    }

    </style>

  """,

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
        font-family: "proxima-nova-soft",sans-serif;
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
    <h1 id="name"><span>Dan Daniels</span></h1>
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
        it 'scoping', (done) ->
          container = document.createElement('div')
          container.style.height = '1000px'
          container.style.width = '1000px'
          container.style.position = 'absolute'
          container.style.overflow = 'auto'
          container.style.left = 0
          container.style.top = 0
          window.$engine = engine = new GSS(container, index == 0)
          $('#fixtures').appendChild container

          container.innerHTML = DEMOS.SCOPING
          engine.then (solution) ->
            expect(solution['li-width']).to.eql((640 - 16) / 3)
            expect(solution['$aside[x]']).to.eql(640 / 2 + 100)
            expect(solution['$header[width]']).to.eql(Math.round(640 / 2))


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

              engine.then (solution) ->
                expect(Math.round solution['li-width']).to.eql((640 - 16) / 3)
                expect(solution['$li2[x]']).to.eql(0)
                expect(solution['$li1[x]']).to.eql(null)

                engine.scope.setAttribute('style', 'width: 1024px; height: 640px')
                engine.then (solution) ->
                  expect(Math.round solution['li-width']).to.eql(Math.round((1024 - 16) / 3))
                  expect(solution['$header[width]']).to.eql(1024 / 4)
                  container.innerHTML = ""
                  engine.then (solution) ->
                    done()

        @timeout 10000
        it 'profile card', (done) ->
          container = document.createElement('div')
          container.id = 'profile-card-demo'

          window.$engine = engine = new GSS(container, index == 0)
          $('#fixtures').appendChild container

          container.innerHTML = DEMOS.PROFILE_CARD
          container.setAttribute('style', 'height: 1024px; width: 768px; position: absolute; overflow: auto; left: 0; top: 0')
 
          engine.then (solution) ->
            # phantom gives slightly different measurements
            roughAssert = (a, b, threshold = 15) ->
              expect(Math.abs(a - b) < threshold).to.eql true

            console.log(JSON.stringify solution)


            roughAssert(solution['$follow[y]'], 540)
            roughAssert(solution['$follow[x]'], 329.5)
            roughAssert(solution['flex-gap'], 95)
 
            container.setAttribute('style', 'height: 768px; width: 1124px; position: absolute; overflow: auto; left: 0; top: 0')
 
            engine.then (solution) ->
              console.log(solution)
              roughAssert(solution['$follow[x]'], 435)
              roughAssert(solution['$follow[y]'], 537)
              container.setAttribute('style', 'height: 1024px; width: 768px; position: absolute; overflow: auto; left: 0; top: 0')
 
 
              engine.then (solution) ->
                console.log(solution)
                roughAssert(solution['flex-gap'], 95)
                roughAssert(solution['$follow[y]'], 540)
                roughAssert(solution['$follow[x]'], 329.5)
 
                container.setAttribute('style', 'height: 768px; width: 1124px; position: absolute; overflow: auto; left: 0; top: 0')
                
                engine.then (solution) ->
                  roughAssert(solution['$follow[x]'], 435)
                  roughAssert(solution['$follow[y]'], 537)
 
                  container.innerHTML = ""
                  engine.then (solution) ->
                    done()
 