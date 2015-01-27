DEMOS = 
  FACE_DETECTION_SECTION: """
    <section class="demo">

      <h1 class="title" id="title">We've already broken ground on more than 30 layout filters.</h1>
      <h2 class="subtitle">Before we invest the hard work of making each bullet-proof, we need to know this is wanted & needed, become a founding member & help us help you!</h2>
      <img class="image" src="image.png">

    </section>

    <style type="text/gss" scoped>
      [md] == 72 !require;
      [md-sub] == 8;
      $[width] == $[intrinsic-width];


      .demo {
        @if $[width] < 500 {
          .title {
            &margin-top == [md-sub];
          }
        } @else {
          .title {
            &margin-top == [md];
            &padding-top == ([md-sub] * 6) - 8;
          }
        }

      }

    </style>

  """
  SCOPING: """
    <button id="box1" class="box w-virtual" onclick="
      this.setAttribute('class', 
        'box ' + (this.className.indexOf('wo') > -1 ? 'w-virtual' : 'wo-virtual'))">
      <div class="innie" id="innie1" ></div>
    </button>
    <button id="box2" class="box wo-virtual" onclick="this.setAttribute('class', 
      'box ' + (this.className.indexOf('wo') > -1 && 'w-virtual' || 'wo-virtual'))">
      <div class="innie" id="innie2" ></div>
    </button>
    <button id="box3" class="box w-virtual" onclick="this.setAttribute('class', 
      'box ' + (this.className.indexOf('wo') > -1 && 'w-virtual' || 'wo-virtual'))">
      <div class="innie" id="innie3" ></div>
    </button>
    
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

    
    $[left] == 0;
    $[top] == 0;
    $[height] == $[intrinsic-height];
    $[width] == $[intrinsic-width];

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

    @v |-10-(.box)-20-... in($) {
            
      @h |~100~(&)~100~| in($);
      
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
    <style type="text/gss" scoped>
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
        @if ($[intrinsic-width] > $[intrinsic-height]) {
          ::[width] == $[intrinsic-width] / 4;
          opacity: 0.5;
        } @else {
          ::[width] == $[intrinsic-width] / 2;
          opacity: 0.75;
        }
      }
      footer {
        ::[top] == ($ main)[height]; 
        ::[height] == $[intrinsic-height] * 2;
      }

      aside {
        ::[left] == ($ main)[right];
        ::[height] == 100;
        ::[top] == ($ header)[intrinsic-height] + ($ header)[intrinsic-y];
      }

      main {
        // Bind things to scroll position
        ::[top] == $[scroll-top];// + (header)[intrinsic-y];
        ::[width] == ($ aside)[intrinsic-width];
        ::[left] == ($ header)[right];

        ::[height] == $[intrinsic-height] - ($ header)[intrinsic-height];
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
        ::[width] == $[li-width];
        :previous[right] == &[left];
        :last[right] == $[intrinsic-width] - 16;
        :first[left] == 0;
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
<style type="text/gss" scoped>
/* vars */
[gap] == 20 !required;
[flex-gap] >= [gap] * 2 !required;
[radius] == 10 !required;
[outer-radius] == [radius] * 2 !required;

/* scope-as-window for tests */
$[left] == 0;
$[top] == 0;
$[width] == $[intrinsic-width] !require;
$[height] == $[intrinsic-height] !require;

/* elements */
#profile-card {      
  &width == $[width] - 480;            
  &height == $[height] - 480;
  &[center-x] == $[center-x];
  &[center-y] == $[center-y];        
  &border-radius == [outer-radius];
}

#avatar {
  &height == 160 !required;
  &width == ::[height];
  &border-radius == ::[height] / 2;        
}

#name {
  &height == ::[intrinsic-height] !required;
  &width == ::[intrinsic-width] !required;
}

#cover {
  &border-radius == [radius];
}

button {
  &width == ::[intrinsic-width] !required;
  &height == ::[intrinsic-height] !required;        
  &padding == [gap];
  &padding-top == [gap] / 2;
  &padding-bottom == [gap] / 2;
  &border-radius == [radius];
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
      &[center-x] == ($ #cover)[center-x];
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
      :next[top] == &top;
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
      &[center-x] == ($ #profile-card)[center-x];
  }

  @h |-10-(#cover)-10-| in(#profile-card) !strong;
  @v |-10-(#cover)-10-| in(#profile-card) !strong;
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

  ADAPTIVE_ASPECT: """
    <header id="header">header</header>
    
    <article id="article">
      <p>ISTANBUL — Forty-nine Turkish hostages who had been held for months in Iraq by Islamic State militants were returned to Turkey on Saturday after what Turkey said was a covert operation led by its intelligence agency.</p>
      <p>The hostages, including diplomats and their families, had been seized in June from the Turkish Consulate in Mosul, in northern Iraq.</p>
      <p>“The Turkish intelligence agency has followed the situation very sensitively and patiently since the beginning and, as a result, conducted a successful rescue operation,” President Recep Tayyip Erdogan said in a statement Saturday.</p>
      <p>The details of the hostages’ release were unclear. The semiofficial Turkish news agency Anadolu reported that Turkey had not paid ransom or engaged in a military operation, but said it had used drones to track the hostages, who had been moved at least eight times during their 101 days in captivity.</p>
      <p>Times Topic: Islamic State in Iraq and Syria (ISIS) Back and Forth, Wearily, Across the ISIS BorderSEPT. 20, 2014 The agency said that Turkish intelligence teams had tried five times to rescue the hostages, but that each attempt had been thwarted by clashes in the area where they were being held.</p>
      <p>An employee of the Turkish Consulate in Mosul was greeted by family members. Credit Reuters One senior American official, who asked not to be named, said Saturday that Turkey had not notified the United States before securing the return of the hostages, or made a specific request for American military help in connection with their release.</p>
      <p>“I am sharing joyful news, which as a nation we have been waiting for,” Prime Minister Ahmet Davutoglu said in Baku, Azerbaijan, where he was on an official visit.</p>
      <p>“After intense efforts that lasted days and weeks, in the early hours, our citizens were handed over to us and we brought them back to our country,” he said.</p>
      <p>The prime minister left Baku for the Turkish province of Urfa, where the freed hostages, who included Consul General Ozturk Yilmaz, other diplomats, children and consulate guards, had been brought from Raqqa, Syria, the de facto headquarters of the Islamic State militants.</p>
    </article>
    
    <footer id="footer">footer</footer>
    
    <style>
    * {
      box-sizing: border-box;
      margin: 0;      
    }
    html {
      background-color: hsl(0,0%,95%);
    }
    article {
      background-color: hsl(0,0%,99%);
      padding: 72px;
      -webkit-column-width: 400px;
      column-width: 400px;
      overflow-x: #{window.atob && 'auto' || 'hidden'};
      font-size: 20px;
      line-height: 30px;
    }
    header {
      background-color: hsl(0,0%,90%);
      padding: 16px;
      text-align: center;
    }
    footer {
      background-color: hsl(0,0%,85%);
      padding: 16px;
      text-align: center;
    }
    p {
      margin-bottom: 1em;
    }
    </style>
    <style type="text/gss">
    // vertical article
      
    $[left] == 0;
    $[top] == 0;
    $[height] == $[intrinsic-height];
    $[width] == $[intrinsic-width];
    $[article-gap] >= 16;

    @if $[intrinsic-width] < $[intrinsic-height] {
      @h |-(article)-| gap($[article-gap]) in($) {
        height: == &[intrinsic-height];
        width: <= 800;        
      }
      @v |
        -72-
        (header)
        (article)
        (footer)
        
        in($);
      
      header, footer {
        height: == 72;
        @h |(&)| in($ article);
      }
    }
    
    // horizontal article
    @else {
      @v |-(article)-| gap($[article-gap]) in($) {
        width: == &[intrinsic-width];
        height: <= 600;   
      }
      
      @h |
        -16-
        (header)
        (footer)
        (article)        
        
        in($);
      
      header, footer {
        width: == 72;
        @v |(&)| in($ article);
      }
    }

    
    </style>

  """

DEMOS.ADAPTIVE_ASPECT_LINEAR = DEMOS.ADAPTIVE_ASPECT.
  replace('$[intrinsic-width] < $[intrinsic-height]', '$[width] < $[height]')

roughAssert = (a, b, threshold = 15) ->
  expect(Math.abs(a - b) < threshold).to.eql true

assert = chai.assert
expect = chai.expect

remove = (el) ->
  el?.parentNode?.removeChild(el)


describe 'Full page tests', -> 
  engine = container = null

  afterEach ->
    remove(container)
    engine.destroy()
  @timeout 100000

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
          document.getElementById('fixtures').appendChild container

          container.innerHTML = DEMOS.SCOPING
          engine.then (solution) ->
            expectation = 
              "$1[height]": 1000
              "$1[intrinsic-height]": 1000
              "$1[intrinsic-width]": 1000
              "$1[width]": 1000
              "$1[x]": 0
              "$1[y]": 0
              "$box1'zone'[height]": 260
              "$box1'zone'[width]": 760
              "$box1'zone'[x]": 120
              "$box1'zone'[y]": 30
              "$box1[height]": 300
              "$box1[width]": 800
              "$box1[x]": 100
              "$box1[y]": 10
              "$box2[height]": 300
              "$box2[width]": 760
              "$box2[x]": 120
              "$box2[y]": 330
              '$box3"zone"[height]': 260
              '$box3"zone"[width]': 680
              '$box3"zone"[x]': 160
              '$box3"zone"[y]': 670
              "$box3[height]": 300
              "$box3[width]": 720
              "$box3[x]": 140
              "$box3[y]": 650
              "$innie1[height]": 260
              "$innie1[width]": 760
              "$innie1[x]": 120
              "$innie1[y]": 30
              "$innie2[height]": 260
              "$innie2[width]": 720
              "$innie2[x]": 140
              "$innie2[y]": 350
              "$innie3[height]": 260
              "$innie3[width]": 680
              "$innie3[x]": 160
              "$innie3[y]": 670
            for expect, value in expectation
              assert(engine.values[expect]).to.eql value

            engine.id('box1').click()
            engine.then (solution) ->
              expect(solution['$box1"zone"[height]']).to.eql null
              expect(solution['$box1"zone"[width]']).to.eql null
              expect(solution['$box1"zone"[x]']).to.eql null
              expect(solution['$box1"zone"[y]']).to.eql null
              engine.id('box1').click()
              engine.then (solution) ->
                expect(solution['$box1"zone"[height]']).to.eql 260
                expect(solution['$box1"zone"[width]']).to.eql 760
                expect(solution['$box1"zone"[x]']).to.eql 120
                expect(solution['$box1"zone"[y]']).to.eql 30
                engine.id('box2').click()
                engine.then (solution) ->
                  expect(solution['$box2"zone"[height]']).to.eql 260
                  expect(solution['$box2"zone"[width]']).to.eql 720
                  expect(solution['$box2"zone"[x]']).to.eql 140
                  expect(solution['$box2"zone"[y]']).to.eql 350
                  engine.id('box2').click()
                  engine.then (solution) ->
                    expect(solution['$box2"zone"[height]']).to.eql null
                    expect(solution['$box2"zone"[width]']).to.eql null
                    expect(solution['$box2"zone"[x]']).to.eql null
                    expect(solution['$box2"zone"[y]']).to.eql null
                    engine.id('box3').click()
                    engine.then (solution) ->
                      expect(solution['$box3"zone"[height]']).to.eql null
                      expect(solution['$box3"zone"[width]']).to.eql null
                      expect(solution['$box3"zone"[x]']).to.eql null
                      expect(solution['$box3"zone"[y]']).to.eql null
                      engine.id('box3').click()
                      engine.then (solution) ->
                        expect(solution['$box3"zone"[height]']).to.eql 260
                        expect(solution['$box3"zone"[width]']).to.eql 680
                        expect(solution['$box3"zone"[x]']).to.eql 160
                        expect(solution['$box3"zone"[y]']).to.eql 670
                        engine.scope.innerHTML = ""
                        engine.then (solution) ->
                          expect(engine.values).to.eql {}
                          done()


        @timeout 100000
        
        it 'gss1 demo', (done) ->
          container = document.createElement('div')
          container.style.height = '640px'
          container.style.width = '640px'
          container.style.position = 'absolute'
          container.style.overflow = 'auto'
          container.style.left = 0
          container.style.top = 0
          window.$engine = engine = new GSS(container, index == 0)
          document.getElementById('fixtures').appendChild container

          container.innerHTML = DEMOS.GSS1
          engine.then (solution) ->
            expect(solution['li-width']).to.eql((640 - 16) / 3)
            expect(solution['$aside[x]']).to.eql(640 / 2 + 100)
            expect(solution['$header[width]']).to.eql(Math.round(640 / 2)) 
            li = engine.scope.querySelector('ul li:last-child')
            clone = li.cloneNode()
            clone.id = 'li4'
            clone.innerHTML = '4'
            
            li.parentNode.appendChild(clone)
            engine.then (solution) ->

              expect(Math.round(solution['li-width'])).to.eql((640 - 16) / 4)
              li = engine.scope.querySelector('ul li:first-child')
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

        for type, j in ['with intrinsic condition', 'with linear condition']
          do (type, j) ->
            describe type, (done) ->
              it 'should handle face detection section', (done) ->
                container = document.createElement('div')
                container.id = 'face-demo'

                window.$engine = engine = new GSS(container, index == 0)
                document.getElementById('fixtures').appendChild container

                html = DEMOS.FACE_DETECTION_SECTION
                if j == 0
                  html = html.replace('$[width] < 500', '$[intrinsic-width] < 500')
                container.innerHTML = html
                container.setAttribute('style', 'height: 640px; width: 640px; position: absolute; overflow: auto; left: 0; top: 0')
        
                engine.then (solution) ->
                  expect(solution).to.eql
                    '$title[margin-top]': 72
                    '$title[padding-top]': 40
                    '$face-demo[intrinsic-width]': 640
                    '$face-demo[width]': 640
                    'md': 72
                    'md-sub': 8
                  
                  container.setAttribute('style', 'height: 640px; width: 400px; position: absolute; overflow: auto; left: 0; top: 0')
                  
                  engine.then (solution) ->
                    expect(solution['$title[margin-top]']).to.eql 8
                    expect(solution['$title[padding-top]']).to.eql null
                    expect(solution['$face-demo[intrinsic-width]']).to.eql 400
                    expect(solution['$face-demo[width]']).to.eql 400


                    container.innerHTML = ""
                    
                    engine.then (solution) ->
                      expect(solution).to.eql
                        '$title[margin-top]': null
                        '$face-demo[intrinsic-width]': null
                        '$face-demo[width]': null
                        'md': null
                        'md-sub': null
                      done()

        it 'profile card', (done) ->
          container = document.createElement('div')
          container.id = 'profile-card-demo'

          window.$engine = engine = new GSS(container, index == 0)
          document.getElementById('fixtures').appendChild container

          container.innerHTML = DEMOS.PROFILE_CARD
          container.setAttribute('style', 'height: 1024px; width: 768px; position: absolute; overflow: auto; left: 0; top: 0')
 
          engine.then (solution) ->
            # phantom gives slightly different measurements

            roughAssert(solution['$follow[y]'], 540)
            roughAssert(solution['$follow[x]'], 329.5)
            roughAssert(solution['flex-gap'], 40)

            container.setAttribute('style', 'height: 768px; width: 1124px; position: absolute; overflow: auto; left: 0; top: 0')
 
            engine.then (solution) ->
              roughAssert(solution['$follow[x]'], 435, 25)
              roughAssert(solution['$follow[y]'], 537)
              container.setAttribute('style', 'height: 1024px; width: 768px; position: absolute; overflow: auto; left: 0; top: 0')
 
 
              engine.then (solution) -> 
                roughAssert(solution['flex-gap'], 109)
                roughAssert(solution['$follow[y]'], 728)
                roughAssert(solution['$follow[x]'], 240)

                container.setAttribute('style', 'height: 1280px; width: 768px; position: absolute; overflow: auto; left: 0; top: 0')
   
                engine.then (solution) ->
   
                  roughAssert(solution['$follow[y]'], 668)
                  roughAssert(solution['$follow[x]'], 329.5)
                  roughAssert(solution['flex-gap'], 158)
       
   
                  container.setAttribute('style', 'height: 1024px; width: 768px; position: absolute; overflow: auto; left: 0; top: 0')
                  
                  engine.then (solution) ->
                    roughAssert(solution['$follow[y]'], 540)
                    roughAssert(solution['flex-gap'], 40)
   
                    container.innerHTML = ""
                    engine.then (solution) ->
                      expect(engine.values).to.eql {}
                      done()

                      
        for type, j in ['with intrinsic condition', 'with linear condition']
          do (type, j) ->
            expectation = window.atob && document.body.style.msTouchAction? && 544 || 480
            describe type, ->
              it 'Adaptive aspect', (done) ->
                container = document.createElement('div')
                container.style.height = '640px'
                container.style.width = '640px'
                container.style.position = 'absolute'
                overflow = window.atob && 'auto' || 'hidden'
                container.style.overflow = overflow
                container.style.left = 0
                container.style.top = 0
                window.$engine = engine = new GSS(container, index == 0)
                document.getElementById('fixtures').appendChild container
                if j == 0
                  container.innerHTML = DEMOS.ADAPTIVE_ASPECT
                else
                  container.innerHTML = DEMOS.ADAPTIVE_ASPECT_LINEAR
                  
                engine.then (solution) ->
                  expect(solution['$article[height]']).to.eql 600
                  expect(solution['$article[width]']).to.eql expectation
                  expect(solution['$footer[height]']).to.eql 600
                  expect(solution['$footer[width]']).to.eql 72
                  expect(solution['$header[height]']).to.eql 600
                  expect(solution['$header[width]']).to.eql 72
                  expect(solution['article-gap']).to.eql 20
                  container.setAttribute('style', "height: 800px; width: 640px; position: absolute; overflow: #{overflow}; left: 0; top: 0")

                  engine.then (solution) ->
                    expect(solution['$article[height]'] > 1400).to.eql true
                    expect(solution['article-gap']).to.eql 16
                    expect(solution['$article[width]']).to.eql 608
                    expect(solution['$footer[height]']).to.eql 72
                    expect(solution['$footer[width]']).to.eql 608
                    expect(solution['$header[height]']).to.eql 72
                    expect(solution['$header[width]']).to.eql 608
                    container.setAttribute('style', "height: 640px; width: 640px; position: absolute; overflow: #{overflow}; left: 0; top: 0")

                    engine.then (solution) ->
                      expect(solution['article-gap']).to.eql 20
                      expect(solution['$article[height]']).to.eql 600
                      expect(solution['$article[width]']).to.eql expectation
                      expect(solution['$footer[height]']).to.eql 600
                      expect(solution['$footer[width]']).to.eql 72
                      expect(solution['$header[height]']).to.eql 600
                      expect(solution['$header[width]']).to.eql 72
                      container.setAttribute('style', "height: 800px; width: 640px; position: absolute; overflow: #{overflow}; left: 0; top: 0")
                      engine.then (solution) ->
                        expect(solution['$article[height]'] > 1400).to.eql true
                        expect(solution['$article[width]']).to.eql 608
                        expect(solution['$footer[height]']).to.eql 72
                        expect(solution['$footer[width]']).to.eql 608
                        expect(solution['$header[height]']).to.eql 72
                        expect(solution['$header[width]']).to.eql 608
                        expect(solution['article-gap']).to.eql 16

                        container.setAttribute('style', "height: 800px; width: 600px; position: absolute; overflow: #{overflow}; left: 0; top: 0")
                        
                        engine.then (solution) ->
                          expect(solution['$article[height]'] > 1400).to.eql true
                          expect(solution['$article[width]']).to.eql 568
                          expect(solution['$footer[width]']).to.eql 568
                          expect(solution['$header[width]']).to.eql 568
                          engine.scope.innerHTML = ""
                          engine.then ->
                            expect(engine.values).to.eql {}
                            done()
 