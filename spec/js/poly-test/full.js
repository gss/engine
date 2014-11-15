var $, $$, DEMOS, assert, expect, remove;

DEMOS = {
  FACE_DETECTION_SECTION: "<section class=\"demo\">\n\n  <h1 class=\"title\" id=\"title\">We've already broken ground on more than 30 layout filters.</h1>\n  <h2 class=\"subtitle\">Before we invest the hard work of making each bullet-proof, we need to know this is wanted & needed, become a founding member & help us help you!</h2>\n  <img class=\"image\" src=\"image.png\">\n\n</section>\n\n<style type=\"text/gss\">\n  [md] == 72 !require;\n  [md-sub] == 8;\n  ::scope[width] == ::scope[intrinsic-width];\n\n\n  .demo {\n    @if ::scope[width] < 500 {\n      .title {\n        margin-top: == [md-sub];\n      }\n    } @else {\n      .title {\n        margin-top: == [md];\n        padding-top: == ([md-sub] * 6) - 8;\n      }\n    }\n\n  }\n\n</style>\n",
  SCOPING: "<div id=\"box1\" class=\"box w-virtual\" onclick=\"\n  this.setAttribute('class', \n    this.className = 'box ' + (this.className.indexOf('wo') > -1 ? 'w-virtual' : 'wo-virtual'))\">\n  <div class=\"innie\" id=\"innie1\" ></div>\n</div>\n<div id=\"box2\" class=\"box wo-virtual\" onclick=\"this.setAttribute('class', \n  this.className = 'box ' + (this.className.indexOf('wo') > -1 && 'w-virtual' || 'wo-virtual'))\">\n  <div class=\"innie\" id=\"innie2\" ></div>\n</div>\n<div id=\"box3\" class=\"box w-virtual\" onclick=\"this.setAttribute('class', \n  this.className = 'box ' + (this.className.indexOf('wo') > -1 && 'w-virtual' || 'wo-virtual'))\">\n  <div class=\"innie\" id=\"innie3\" ></div>\n</div>\n\n<style>\n* {\n  box-sizing: border-box;\n}\n\n.box {\n  background-color: hsl(220,50%,50%);\n}    \n.wo-virtual .innie {\n  background-color: hsl(360,100%,50%);\n}\n.w-virtual .innie {\n  background-color: hsl(180,100%,50%);\n}\n.w-virtual:after {\n  content: 'W/ SCOPED VIRTUAL';\n  font-size: 40px;\n  top: 32px;\n  left: 32px;\n  position:absolute;\n}\n.wo-virtual:after {\n  content: 'W/O VIRTUAL';\n  font-size: 40px;\n  top: 32px;\n  left: 32px;\n  position:absolute;\n}\n\n</style>\n<style type=\"text/gss\">\n\n\n::scope[left] == 0;\n::scope[top] == 0;\n::scope[height] == ::scope[intrinsic-height];\n::scope[width] == ::scope[intrinsic-width];\n\n.box.w-virtual {\n  @h |-(&\"zone\")-| in(&) gap(20);\n  @v |-(&\"zone\")-| in(&) gap(20);\n  @h |(& .innie)| in(&\"zone\");\n  @v |(& .innie)| in(&\"zone\");\n}\n.box.wo-virtual {\n  @h |-(& .innie)-| in(&) gap(20);\n  @v |-(& .innie)-| in(&) gap(20);\n}\n\n@v |-10-(.box)-20-... in(::scope) {\n        \n  @h |~100~(&)~100~| in(::scope);\n  \n  &[x] + 20 == &:next[x];\n  &[right] - 20 == &:next[right];\n  \n  height: == 300;\n  \n}\n\n</style>\n",
  GSS1: "<style scoped>\n  header {\n    background: orange;\n    height: 50px;\n  }\n\n  main {\n    background: yellow;\n    height: 100px;\n    z-index: 10;\n  }\n\n  footer {\n    background: red;\n    width: 10px;\n    height: 20px;\n  }\n\n  aside {\n    background: blue;\n    width: 100px;\n  }\n\n  ul li {\n    list-style: none;\n    background: green;\n    top: 5px;\n  }\n</style>\n<style type=\"text/gss\">\n  // plural selectors can be used as singular, a la jQ\n  [left-margin] == (main)[right];\n\n  // global condition with nested rules\n  @if (main)[top] > 50 {\n    main {\n      background: blue;\n    }\n  }\n  header {\n    ::[left] == 0;\n    // condition inside css rule\n    @if (::scope[intrinsic-width] > ::scope[intrinsic-height]) {\n      ::[width] == ::scope[intrinsic-width] / 4;\n      opacity: 0.5;\n    } @else {\n      ::[width] == ::scope[intrinsic-width] / 2;\n      opacity: 0.75;\n    }\n  }\n  footer {\n    ::[top] == (main)[height]; \n    ::[height] == ::scope[intrinsic-height] * 2;\n  }\n\n  aside {\n    ::[left] == (main)[right];\n    ::[height] == 100;\n    ::[top] == (header)[intrinsic-height] + (header)[intrinsic-y];\n  }\n\n  main {\n    // Bind things to scroll position\n    ::[top] == ::scope[scroll-top];// + (header)[intrinsic-y];\n    ::[width] == (aside)[intrinsic-width];\n    ::[left] == (header)[right];\n\n    // use intrinsic-height to avoid binding. Should be:\n    // height: :window[height] - (header)[height];\n    ::[height] == ::scope[intrinsic-height] - (header)[intrinsic-height];\n  } \n  // Custom combinators\n  ul li !~ li {\n\n    ::[height] == 30;\n    \n    // FIXME: Regular css style is never removed (needs specificity sorting and groupping);\n    background-color: yellowgreen;\n  }\n\n  // Chains\n  ul li {\n    // justify by using variable\n    ::[width] == [li-width];\n\n    (&:previous)[right] == &[left];\n    (&:last)[right] == ::scope[intrinsic-width] - 16;\n    (&:first)[left] == 0;\n  }\n</style>\n\n\n<header id=\"header\"></header>\n<main id=\"main\">\n  <ul>\n    <li id=\"li1\">1</li>\n    <li id=\"li2\">2</li>\n    <li id=\"li3\">3</li>\n  </ul>\n</main>\n<aside id=\"aside\"></aside>\n<footer id=\"footer\"></footer>",
  PROFILE_CARD: "  <style>\n    #profile-card-demo * { \n      box-sizing: border-box;\n      -webkit-box-sizing: border-box;\n      -moz-box-sizing: border-box;\n    }\n\n    #profile-card-demo {\n      background-color: hsl(3, 18%, 43%);\n    }\n\n    #profile-card-demo * {\n      -webkit-backface-visibility: hidden;\n      margin: 0px;\n      padding: 0px;\n      outline: none;\n    }\n\n    #background {\n      background-color: hsl(3, 18%, 43%);\n      position: absolute;\n      top: 0px;\n      bottom: 0px;\n      right: 0px;\n      left: 0px;\n      z-index: -1;\n      background-image: url('assets/cover.jpg');\n      background-size: cover;\n      background-position: 50% 50%;\n      opacity: .7;\n      -webkit-filter: blur(5px) contrast(.7);\n    }\n\n    #cover {\n      background-color: #ccc;\n      background-image: url('assets/cover.jpg');\n      background-size: cover;\n      background-position: 50% 50%;\n    }\n\n    #avatar {\n      background-image: url('assets/avatar.jpg');\n      background-size: cover;\n      background-position: 50% 50%;\n      border: 10px solid hsl(39, 40%, 90%);\n      box-shadow: 0 1px 1px hsla(0,0%,0%,.5);\n    }\n\n    #profile-card-demo h1 {\n      color: white;\n      text-shadow: 0 1px 1px hsla(0,0%,0%,.5);\n      font-size: 40px;\n      line-height: 1.5em;\n      font-family: \"adelle\",georgia,serif;\n      font-style: normal;\n      font-weight: 400;\n    }\n\n    #profile-card-demo button {\n      color: hsl(3, 18%, 43%);\n      background-color: hsl(39, 40%, 90%);\n      text-shadow: 0 1px hsla(3, 18%, 100%, .5);\n      font-family: \"proxima-nova-soft\",sans-serif;\n      font-style: normal;\n      font-weight: 700;\n      font-size: 14px;\n      text-transform:uppercase;\n      letter-spacing:.1em;\n      border: none;  \n    }\n\n    #profile-card-demo button.primary {\n      background-color: #e38f71;\n      color: white;\n      text-shadow: 0 -1px hsla(3, 18%, 43%, .5);\n    }\n\n    #profile-card-demo #profile-card, .card {\n      background-color: hsl(39, 40%, 90%);\n      border: 1px solid hsla(0,0%,100%,.6);\n      box-shadow: 0 5px 8px hsla(0,0%,0%,.3);  \n    }\n  </style>\n  <style type=\"text/gss\">\n    /* vars */\n    [gap] == 20 !required;\n    [flex-gap] >= [gap] * 2 !required;\n    [radius] == 10 !required;\n    [outer-radius] == [radius] * 2 !required;\n\n    /* scope-as-window for tests */\n    ::scope[left] == 0;\n    ::scope[top] == 0;\n    ::scope[width] == ::scope[intrinsic-width] !require;\n    ::scope[height] == ::scope[intrinsic-height] !require;\n\n    /* elements */\n    #profile-card {      \n      width: == ::scope[intrinsic-width] - 480;            \n      height: == ::scope[intrinsic-height] - 350;\n      center-x: == ::scope[center-x];\n      center-y: == ::scope[center-y];        \n      border-radius: == [outer-radius];\n    }\n\n    #avatar {\n      height: == 160 !required;\n      width: == ::[height];\n      border-radius: == ::[height] / 2;        \n    }\n\n    #name {\n      height: == ::[intrinsic-height] !required;\n      width: == ::[intrinsic-width] !required;\n    }\n\n    #cover {\n      border-radius: == [radius];\n    }\n\n    button {\n      width: == ::[intrinsic-width] !required;\n      height: == ::[intrinsic-height] !required;        \n      padding: == [gap];\n      padding-top: == [gap] / 2;\n      padding-bottom: == [gap] / 2;\n      border-radius: == [radius];\n    }\n    \n\n@h |~-~(#name)~-~| in(#cover) gap([gap]*2) !strong;\n\n/* landscape profile-card */\n@if #profile-card[width] >= #profile-card[height] {\n\n@v |\n    -\n    (#avatar)\n    -\n    (#name)\n    -\n   |\n  in(#cover)\n  gap([gap]) outer-gap([flex-gap]) {\n    center-x: == #cover[center-x];\n}\n\n@h |-10-(#cover)-10-|\n  in(#profile-card);\n\n@v |\n    -10-\n    (#cover)\n    -\n    (#follow)\n    -\n   |\n  in(#profile-card)\n  gap([gap]) !strong;\n\n#follow[center-x] == #profile-card[center-x];\n\n@h |-(#message)~-~(#follow)~-~(#following)-(#followers)-|\n  in(#profile-card)\n  gap([gap])\n  !strong {\n    &[top] == &:next[top];\n  }\n}\n\n/* portrait profile-card */\n@else {\n@v |\n    -\n    (#avatar)\n    -\n    (#name)\n    -\n    (#follow)\n    -\n    (#message)\n    -\n    (#following)\n    -\n    (#followers)\n    -\n   |\n  in(#cover)\n  gap([gap])\n  outer-gap([flex-gap]) !strong {\n    center-x: == #profile-card[center-x];\n}\n\n@h |-10-(#cover)-10-| in(#profile-card);\n@v |-10-(#cover)-10-| in(#profile-card);\n}\n\n  </style>\n  <div id=\"background\"></div>\n  <div id=\"profile-card\"></div>\n  <div id=\"cover\"></div>\n  <div id=\"avatar\"></div>\n  <h1 id=\"name\"><span>Dan Daniels</span></h1>\n  <button id=\"follow\" class=\"primary\">Follow</button>\n  <button id=\"following\">Following</button>\n  <button id=\"followers\">Followers</button>\n  <button id=\"message\">Message</button>",
  ADAPTIVE_ASPECT: "<header id=\"header\">header</header>\n\n<article id=\"article\">\n  <p>ISTANBUL — Forty-nine Turkish hostages who had been held for months in Iraq by Islamic State militants were returned to Turkey on Saturday after what Turkey said was a covert operation led by its intelligence agency.</p>\n  <p>The hostages, including diplomats and their families, had been seized in June from the Turkish Consulate in Mosul, in northern Iraq.</p>\n  <p>“The Turkish intelligence agency has followed the situation very sensitively and patiently since the beginning and, as a result, conducted a successful rescue operation,” President Recep Tayyip Erdogan said in a statement Saturday.</p>\n  <p>The details of the hostages’ release were unclear. The semiofficial Turkish news agency Anadolu reported that Turkey had not paid ransom or engaged in a military operation, but said it had used drones to track the hostages, who had been moved at least eight times during their 101 days in captivity.</p>\n  <p>Times Topic: Islamic State in Iraq and Syria (ISIS) Back and Forth, Wearily, Across the ISIS BorderSEPT. 20, 2014 The agency said that Turkish intelligence teams had tried five times to rescue the hostages, but that each attempt had been thwarted by clashes in the area where they were being held.</p>\n  <p>An employee of the Turkish Consulate in Mosul was greeted by family members. Credit Reuters One senior American official, who asked not to be named, said Saturday that Turkey had not notified the United States before securing the return of the hostages, or made a specific request for American military help in connection with their release.</p>\n  <p>“I am sharing joyful news, which as a nation we have been waiting for,” Prime Minister Ahmet Davutoglu said in Baku, Azerbaijan, where he was on an official visit.</p>\n  <p>“After intense efforts that lasted days and weeks, in the early hours, our citizens were handed over to us and we brought them back to our country,” he said.</p>\n  <p>The prime minister left Baku for the Turkish province of Urfa, where the freed hostages, who included Consul General Ozturk Yilmaz, other diplomats, children and consulate guards, had been brought from Raqqa, Syria, the de facto headquarters of the Islamic State militants.</p>\n</article>\n\n<footer id=\"footer\">footer</footer>\n\n<style>\n* {\n  box-sizing: border-box;\n  margin: 0;      \n}\nhtml {\n  background-color: hsl(0,0%,95%);\n}\narticle {\n  background-color: hsl(0,0%,99%);\n  padding: 72px;\n  -webkit-column-width: 400px;\n  overflow-x: auto;\n  font-size: 20px;\n  line-height: 30px;\n}\nheader {\n  background-color: hsl(0,0%,90%);\n  padding: 16px;\n  text-align: center;\n}\nfooter {\n  background-color: hsl(0,0%,85%);\n  padding: 16px;\n  text-align: center;\n}\np {\n  margin-bottom: 1em;\n}\n</style>\n<style type=\"text/gss\">\n// vertical article\n  \n::scope[left] == 0;\n::scope[top] == 0;\n::scope[height] == ::scope[intrinsic-height];\n::scope[width] == ::scope[intrinsic-width];\n\n@if ::scope[intrinsic-width] < ::scope[intrinsic-height] {\n  \n  [article-gap] >= 16; // centers article\n  \n  [article-gap] >= 16; // centers article\n  @h |-(article)-| gap([article-gap]) in(::scope) {\n    height: == &[intrinsic-height];\n    width: <= 800;        \n  }\n  @v |\n    -72-\n    (header)\n    (article)\n    (footer)\n    \n    in(::scope);\n  \n  header, footer {\n    height: == 72;\n    @h |(&)| in(article);\n  }\n}\n\n// horizontal article\n@else {\n  \n  \n  [article-gap] >= 16; // centers article\n  @v |-(article)-| gap([article-gap]) in(::scope) {\n    width: == &[intrinsic-width];\n    height: <= 600;   \n  }\n  \n  @h |\n    -16-\n    (header)\n    (footer)\n    (article)        \n    \n    in(::scope);\n  \n  header, footer {\n    width: == 72;\n    @v |(&)| in(article);\n  }\n}\n\n\n</style>\n"
};

DEMOS.ADAPTIVE_ASPECT_LINEAR = DEMOS.ADAPTIVE_ASPECT.replace('::scope[intrinsic-width] < ::scope[intrinsic-height]', '::scope[width] < ::scope[height]');

assert = chai.assert;

expect = chai.expect;

$ = function() {
  return document.querySelector.apply(document, arguments);
};

$$ = function() {
  return document.querySelectorAll.apply(document, arguments);
};

remove = function(el) {
  var _ref;
  return el != null ? (_ref = el.parentNode) != null ? _ref.removeChild(el) : void 0 : void 0;
};

describe('Full page tests', function() {
  var container, engine, index, type, _i, _len, _ref, _results;
  engine = container = null;
  afterEach(function() {
    remove(container);
    return engine.destroy();
  });
  this.timeout(100000);
  _ref = ['With worker', 'Without worker'];
  _results = [];
  for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
    type = _ref[index];
    _results.push((function(type, index) {
      return describe(type, function() {
        var j, _fn, _j, _k, _len1, _len2, _ref1, _ref2, _results1;
        it('scoping', function(done) {
          container = document.createElement('div');
          container.style.height = '1000px';
          container.style.width = '1000px';
          container.style.position = 'absolute';
          container.style.overflow = 'auto';
          container.style.left = 0;
          container.style.top = 0;
          window.$engine = engine = new GSS(container, index === 0);
          $('#fixtures').appendChild(container);
          container.innerHTML = DEMOS.SCOPING;
          return engine.then(function(solution) {
            var expectation, value, _j, _len1;
            expectation = {
              "$1[height]": 1000,
              "$1[intrinsic-height]": 1000,
              "$1[intrinsic-width]": 1000,
              "$1[width]": 1000,
              "$1[x]": 0,
              "$1[y]": 0,
              "$box1'zone'[height]": 260,
              "$box1'zone'[width]": 760,
              "$box1'zone'[x]": 120,
              "$box1'zone'[y]": 30,
              "$box1[height]": 300,
              "$box1[width]": 800,
              "$box1[x]": 100,
              "$box1[y]": 10,
              "$box2[height]": 300,
              "$box2[width]": 760,
              "$box2[x]": 120,
              "$box2[y]": 330,
              '$box3"zone"[height]': 260,
              '$box3"zone"[width]': 680,
              '$box3"zone"[x]': 160,
              '$box3"zone"[y]': 670,
              "$box3[height]": 300,
              "$box3[width]": 720,
              "$box3[x]": 140,
              "$box3[y]": 650,
              "$innie1[height]": 260,
              "$innie1[width]": 760,
              "$innie1[x]": 120,
              "$innie1[y]": 30,
              "$innie2[height]": 260,
              "$innie2[width]": 720,
              "$innie2[x]": 140,
              "$innie2[y]": 350,
              "$innie3[height]": 260,
              "$innie3[width]": 680,
              "$innie3[x]": 160,
              "$innie3[y]": 670
            };
            for (value = _j = 0, _len1 = expectation.length; _j < _len1; value = ++_j) {
              expect = expectation[value];
              assert(engine.values[expect]).to.eql(value);
            }
            engine.id('box1').onclick();
            return engine.then(function(solution) {
              expect(solution['$box1"zone"[height]']).to.eql(null);
              expect(solution['$box1"zone"[width]']).to.eql(null);
              expect(solution['$box1"zone"[x]']).to.eql(null);
              expect(solution['$box1"zone"[y]']).to.eql(null);
              engine.id('box1').onclick();
              return engine.then(function(solution) {
                expect(solution['$box1"zone"[height]']).to.eql(260);
                expect(solution['$box1"zone"[width]']).to.eql(760);
                expect(solution['$box1"zone"[x]']).to.eql(120);
                expect(solution['$box1"zone"[y]']).to.eql(30);
                engine.id('box2').onclick();
                return engine.then(function(solution) {
                  expect(solution['$box2"zone"[height]']).to.eql(260);
                  expect(solution['$box2"zone"[width]']).to.eql(720);
                  expect(solution['$box2"zone"[x]']).to.eql(140);
                  expect(solution['$box2"zone"[y]']).to.eql(350);
                  engine.id('box2').onclick();
                  return engine.then(function(solution) {
                    expect(solution['$box2"zone"[height]']).to.eql(null);
                    expect(solution['$box2"zone"[width]']).to.eql(null);
                    expect(solution['$box2"zone"[x]']).to.eql(null);
                    expect(solution['$box2"zone"[y]']).to.eql(null);
                    engine.id('box3').onclick();
                    return engine.then(function(solution) {
                      expect(solution['$box3"zone"[height]']).to.eql(null);
                      expect(solution['$box3"zone"[width]']).to.eql(null);
                      expect(solution['$box3"zone"[x]']).to.eql(null);
                      expect(solution['$box3"zone"[y]']).to.eql(null);
                      engine.id('box3').onclick();
                      return engine.then(function(solution) {
                        expect(solution['$box3"zone"[height]']).to.eql(260);
                        expect(solution['$box3"zone"[width]']).to.eql(680);
                        expect(solution['$box3"zone"[x]']).to.eql(160);
                        expect(solution['$box3"zone"[y]']).to.eql(670);
                        engine.scope.innerHTML = "";
                        return engine.then(function(solution) {
                          expect(engine.values).to.eql({});
                          return done();
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
        this.timeout(100000);
        it('gss1 demo', function(done) {
          container = document.createElement('div');
          container.style.height = '640px';
          container.style.width = '640px';
          container.style.position = 'absolute';
          container.style.overflow = 'auto';
          container.style.left = 0;
          container.style.top = 0;
          window.$engine = engine = new GSS(container, index === 0);
          $('#fixtures').appendChild(container);
          container.innerHTML = DEMOS.GSS1;
          return engine.then(function(solution) {
            var clone, li;
            expect(solution['li-width']).to.eql((640 - 16) / 3);
            expect(solution['$aside[x]']).to.eql(640 / 2 + 100);
            expect(solution['$header[width]']).to.eql(Math.round(640 / 2));
            li = engine.$first('ul li:last-child');
            clone = li.cloneNode();
            clone.id = 'li4';
            clone.innerHTML = '4';
            li.parentNode.appendChild(clone);
            return engine.then(function(solution) {
              expect(Math.round(solution['li-width'])).to.eql((640 - 16) / 4);
              li = engine.$first('ul li:first-child');
              li.parentNode.removeChild(li);
              return engine.then(function(solution) {
                expect(Math.round(solution['li-width'])).to.eql((640 - 16) / 3);
                expect(solution['$li2[x]']).to.eql(0);
                expect(solution['$li1[x]']).to.eql(null);
                engine.scope.setAttribute('style', 'width: 1024px; height: 640px');
                return engine.then(function(solution) {
                  expect(Math.round(solution['li-width'])).to.eql(Math.round((1024 - 16) / 3));
                  expect(solution['$header[width]']).to.eql(1024 / 4);
                  container.innerHTML = "";
                  return engine.then(function(solution) {
                    return done();
                  });
                });
              });
            });
          });
        });
        _ref1 = ['with intrinsic condition', 'with linear condition'];
        _fn = function(type, j) {
          return describe(type, function(done) {
            return it('should handle face detection section', function(done) {
              var html;
              container = document.createElement('div');
              container.id = 'face-demo';
              window.$engine = engine = new GSS(container, index === 0);
              $('#fixtures').appendChild(container);
              html = DEMOS.FACE_DETECTION_SECTION;
              if (j === 0) {
                html = html.replace('::scope[width] < 500', '::scope[intrinsic-width] < 500');
              }
              container.innerHTML = html;
              container.setAttribute('style', 'height: 640px; width: 640px; position: absolute; overflow: auto; left: 0; top: 0');
              return engine.then(function(solution) {
                expect(solution).to.eql({
                  '$title[margin-top]': 72,
                  '$title[padding-top]': 40,
                  '$face-demo[intrinsic-width]': 640,
                  '$face-demo[width]': 640,
                  'md': 72,
                  'md-sub': 8
                });
                container.setAttribute('style', 'height: 640px; width: 400px; position: absolute; overflow: auto; left: 0; top: 0');
                return engine.then(function(solution) {
                  expect(solution['$title[margin-top]']).to.eql(8);
                  expect(solution['$title[padding-top]']).to.eql(null);
                  expect(solution['$face-demo[intrinsic-width]']).to.eql(400);
                  expect(solution['$face-demo[width]']).to.eql(400);
                  container.innerHTML = "";
                  return engine.then(function(solution) {
                    expect(solution).to.eql({
                      '$title[margin-top]': null,
                      '$face-demo[intrinsic-width]': null,
                      '$face-demo[width]': null,
                      'md': null,
                      'md-sub': null
                    });
                    return done();
                  });
                });
              });
            });
          });
        };
        for (j = _j = 0, _len1 = _ref1.length; _j < _len1; j = ++_j) {
          type = _ref1[j];
          _fn(type, j);
        }
        it('profile card', function(done) {
          container = document.createElement('div');
          container.id = 'profile-card-demo';
          window.$engine = engine = new GSS(container, index === 0);
          $('#fixtures').appendChild(container);
          container.innerHTML = DEMOS.PROFILE_CARD;
          container.setAttribute('style', 'height: 1024px; width: 768px; position: absolute; overflow: auto; left: 0; top: 0');
          return engine.then(function(solution) {
            var roughAssert;
            roughAssert = function(a, b, threshold) {
              if (threshold == null) {
                threshold = 15;
              }
              return expect(Math.abs(a - b) < threshold).to.eql(true);
            };
            GSS.console.log(JSON.stringify(solution));
            roughAssert(solution['$follow[y]'], 540);
            roughAssert(solution['$follow[x]'], 329.5);
            roughAssert(solution['flex-gap'], 95);
            container.setAttribute('style', 'height: 768px; width: 1124px; position: absolute; overflow: auto; left: 0; top: 0');
            return engine.then(function(solution) {
              GSS.console.log(solution);
              roughAssert(solution['$follow[x]'], 435);
              roughAssert(solution['$follow[y]'], 537);
              container.setAttribute('style', 'height: 1024px; width: 768px; position: absolute; overflow: auto; left: 0; top: 0');
              return engine.then(function(solution) {
                GSS.console.log(solution);
                roughAssert(solution['flex-gap'], 95);
                roughAssert(solution['$follow[y]'], 540);
                roughAssert(solution['$follow[x]'], 329.5);
                container.setAttribute('style', 'height: 768px; width: 1124px; position: absolute; overflow: auto; left: 0; top: 0');
                return engine.then(function(solution) {
                  roughAssert(solution['$follow[x]'], 435);
                  roughAssert(solution['$follow[y]'], 537);
                  container.innerHTML = "";
                  return engine.then(function(solution) {
                    return done();
                  });
                });
              });
            });
          });
        });
        _ref2 = ['with intrinsic condition', 'with linear condition'];
        _results1 = [];
        for (j = _k = 0, _len2 = _ref2.length; _k < _len2; j = ++_k) {
          type = _ref2[j];
          _results1.push((function(type, j) {
            return describe(type, function() {
              return it('Adaptive aspect', function(done) {
                container = document.createElement('div');
                container.style.height = '640px';
                container.style.width = '640px';
                container.style.position = 'absolute';
                container.style.overflow = 'auto';
                container.style.left = 0;
                container.style.top = 0;
                window.$engine = engine = new GSS(container, index === 0);
                $('#fixtures').appendChild(container);
                if (j === 0) {
                  container.innerHTML = DEMOS.ADAPTIVE_ASPECT;
                } else {
                  container.innerHTML = DEMOS.ADAPTIVE_ASPECT_LINEAR;
                }
                GSS.console.log(container.innerHTML);
                return engine.then(function(solution) {
                  expect(solution['$article[height]']).to.eql(600);
                  expect(solution['$article[width]']).to.eql(480);
                  expect(solution['$footer[height]']).to.eql(600);
                  expect(solution['$footer[width]']).to.eql(72);
                  expect(solution['$header[height]']).to.eql(600);
                  expect(solution['$header[width]']).to.eql(72);
                  expect(solution['article-gap']).to.eql(20);
                  container.setAttribute('style', 'height: 800px; width: 640px; position: absolute; overflow: auto; left: 0; top: 0');
                  return engine.then(function(solution) {
                    expect(solution['$article[height]'] > 1500).to.eql(true);
                    expect(solution['$article[width]']).to.eql(608);
                    expect(solution['$footer[height]']).to.eql(72);
                    expect(solution['$footer[width]']).to.eql(608);
                    expect(solution['$header[height]']).to.eql(72);
                    expect(solution['$header[width]']).to.eql(608);
                    expect(solution['article-gap']).to.eql(16);
                    container.setAttribute('style', 'height: 640px; width: 640px; position: absolute; overflow: auto; left: 0; top: 0');
                    return engine.then(function(solution) {
                      expect(solution['$article[height]']).to.eql(600);
                      expect(solution['$article[width]']).to.eql(480);
                      expect(solution['$footer[height]']).to.eql(600);
                      expect(solution['$footer[width]']).to.eql(72);
                      expect(solution['$header[height]']).to.eql(600);
                      expect(solution['$header[width]']).to.eql(72);
                      expect(solution['article-gap']).to.eql(20);
                      container.setAttribute('style', 'height: 800px; width: 640px; position: absolute; overflow: auto; left: 0; top: 0');
                      return engine.then(function(solution) {
                        expect(solution['$article[height]'] > 1500).to.eql(true);
                        expect(solution['$article[width]']).to.eql(608);
                        expect(solution['$footer[height]']).to.eql(72);
                        expect(solution['$footer[width]']).to.eql(608);
                        expect(solution['$header[height]']).to.eql(72);
                        expect(solution['$header[width]']).to.eql(608);
                        expect(solution['article-gap']).to.eql(16);
                        container.setAttribute('style', 'height: 800px; width: 600px; position: absolute; overflow: auto; left: 0; top: 0');
                        return engine.then(function(solution) {
                          expect(solution['$article[height]'] > 1500).to.eql(true);
                          expect(solution['$article[width]']).to.eql(568);
                          expect(solution['$footer[width]']).to.eql(568);
                          expect(solution['$header[width]']).to.eql(568);
                          engine.scope.innerHTML = "";
                          return engine.then(function() {
                            expect(engine.values).to.eql({});
                            return done();
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          })(type, j));
        }
        return _results1;
      });
    })(type, index));
  }
  return _results;
});
