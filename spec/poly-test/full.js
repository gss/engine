var $, $$, DEMOS, assert, expect, remove, stringify;

DEMOS = {
  GSS1: "<style scoped>\n  header {\n    background: orange;\n    height: 50px;\n  }\n\n  main {\n    background: yellow;\n    height: 100px;\n    z-index: 10;\n  }\n\n  footer {\n    background: red;\n    width: 10px;\n    height: 20px;\n  }\n\n  aside {\n    background: blue;\n    width: 100px;\n  }\n\n  ul li {\n    list-style: none;\n    background: green;\n    top: 5px;\n  }\n</style>\n<style type=\"text/gss\">\n  // plural selectors can be used as singular, a la jQ\n  [left-margin] == (main)[right];\n\n  // global condition with nested rules\n  @if (main)[top] > 50 {\n    main {\n      background: blue;\n    }\n  }\n  header {\n    ::[left] == 0;\n    // condition inside css rule\n    @if (::scope[intrinsic-width] > ::scope[intrinsic-height]) {\n      ::[width] == ::scope[intrinsic-width] / 4;\n      opacity: 0.5;\n    } @else {\n      ::[width] == ::scope[intrinsic-width] / 2;\n      opacity: 0.75;\n    }\n  }\n  footer {\n    ::[top] == (main)[height]; \n    ::[height] == ::scope[intrinsic-height] * 2;\n  }\n\n  aside {\n    ::[left] == (main)[right];\n    ::[height] == 100;\n    ::[top] == (header)[intrinsic-height] + (header)[intrinsic-y];\n  }\n\n  main {\n    // Bind things to scroll position\n    ::[top] == ::scope[scroll-top];// + (header)[intrinsic-y];\n    ::[width] == (aside)[intrinsic-width];\n    ::[left] == (header)[right];\n\n    // use intrinsic-height to avoid binding. Should be:\n    // height: :window[height] - (header)[height];\n    ::[height] == ::scope[intrinsic-height] - (header)[intrinsic-height];\n  } \n  // Custom combinators\n  ul li !~ li {\n\n    ::[height] == 30;\n    \n    // FIXME: Regular css style is never removed (needs specificity sorting and groupping);\n    background-color: yellowgreen;\n  }\n\n  // Chains\n  ul li {\n    // justify by using variable\n    ::[width] == [li-width];\n\n    (&:previous)[right] == &[left];\n    (&:last)[right] == ::scope[intrinsic-width] - 16;\n    (&:first)[left] == 0;\n  }\n</style>\n\n\n<header id=\"header\"></header>\n<main id=\"main\">\n  <ul>\n    <li id=\"li1\">1</li>\n    <li id=\"li2\">2</li>\n    <li id=\"li3\">3</li>\n  </ul>\n</main>\n<aside id=\"aside\"></aside>\n<footer id=\"footer\"></footer>",
  PROFILE_CARD: "  <style>\n    #profile-card-demo * { \n      box-sizing: border-box;\n      -webkit-box-sizing: border-box;\n      -moz-box-sizing: border-box;\n    }\n\n    #profile-card-demo {\n      background-color: hsl(3, 18%, 43%);\n    }\n\n    #profile-card-demo * {\n      -webkit-backface-visibility: hidden;\n      margin: 0px;\n      padding: 0px;\n      outline: none;\n    }\n\n    #background {\n      background-color: hsl(3, 18%, 43%);\n      position: absolute;\n      top: 0px;\n      bottom: 0px;\n      right: 0px;\n      left: 0px;\n      z-index: -1;\n      background-image: url('assets/cover.jpg');\n      background-size: cover;\n      background-position: 50% 50%;\n      opacity: .7;\n      -webkit-filter: blur(5px) contrast(.7);\n    }\n\n    #cover {\n      background-color: #ccc;\n      background-image: url('assets/cover.jpg');\n      background-size: cover;\n      background-position: 50% 50%;\n    }\n\n    #avatar {\n      background-image: url('assets/avatar.jpg');\n      background-size: cover;\n      background-position: 50% 50%;\n      border: 10px solid hsl(39, 40%, 90%);\n      box-shadow: 0 1px 1px hsla(0,0%,0%,.5);\n    }\n\n    #profile-card-demo h1 {\n      color: white;\n      text-shadow: 0 1px 1px hsla(0,0%,0%,.5);\n      font-size: 40px;\n      line-height: 1.5em;\n      font-family: \"adelle\",georgia,serif;\n      font-style: normal;\n      font-weight: 400;\n    }\n\n    #profile-card-demo button {\n      color: hsl(3, 18%, 43%);\n      background-color: hsl(39, 40%, 90%);\n      text-shadow: 0 1px hsla(3, 18%, 100%, .5);\n      font-family: \"proxima-nova-soft\",helvetica,sans-serif;\n      font-style: normal;\n      font-weight: 700;\n      font-size: 14px;\n      text-transform:uppercase;\n      letter-spacing:.1em;\n      border: none;  \n    }\n\n    #profile-card-demo button.primary {\n      background-color: #e38f71;\n      color: white;\n      text-shadow: 0 -1px hsla(3, 18%, 43%, .5);\n    }\n\n    #profile-card-demo #profile-card, .card {\n      background-color: hsl(39, 40%, 90%);\n      border: 1px solid hsla(0,0%,100%,.6);\n      box-shadow: 0 5px 8px hsla(0,0%,0%,.3);  \n    }\n  </style>\n  <style type=\"text/gss\">\n    /* vars */\n    [gap] == 20 !required;\n    [flex-gap] >= [gap] * 2 !required;\n    [radius] == 10 !required;\n    [outer-radius] == [radius] * 2 !required;\n\n    /* scope-as-window for tests */\n    ::scope[left] == 0;\n    ::scope[top] == 0;\n    ::scope[width] == ::scope[intrinsic-width] !require;\n    ::scope[height] == ::scope[intrinsic-height] !require;\n\n    /* elements */\n    #profile-card {      \n      width: == ::scope[intrinsic-width] - 480;            \n      height: == ::scope[intrinsic-height] - 350;\n      center-x: == ::scope[center-x];\n      center-y: == ::scope[center-y];        \n      border-radius: == [outer-radius];\n    }\n\n    #avatar {\n      height: == 160 !required;\n      width: == ::[height];\n      border-radius: == ::[height] / 2;        \n    }\n\n    #name {\n      height: == ::[intrinsic-height] !required;\n      width: == ::[intrinsic-width] !required;\n    }\n\n    #cover {\n      border-radius: == [radius];\n    }\n\n    button {\n      width: == ::[intrinsic-width] !required;\n      height: == ::[intrinsic-height] !required;        \n      padding: == [gap];\n      padding-top: == [gap] / 2;\n      padding-bottom: == [gap] / 2;\n      border-radius: == [radius];\n    }\n    \n\n@h |~-~(#name)~-~| in(#cover) gap([gap]*2) !strong;\n\n/* landscape profile-card */\n@if #profile-card[width] >= #profile-card[height] {\n\n@v |\n    -\n    (#avatar)\n    -\n    (#name)\n    -\n   |\n  in(#cover)\n  gap([gap]) outer-gap([flex-gap]) {\n    center-x: == #cover[center-x];\n}\n\n@h |-10-(#cover)-10-|\n  in(#profile-card);\n\n@v |\n    -10-\n    (#cover)\n    -\n    (#follow)\n    -\n   |\n  in(#profile-card)\n  gap([gap]) !strong;\n\n#follow[center-x] == #profile-card[center-x];\n\n@h |-(#message)~-~(#follow)~-~(#following)-(#followers)-|\n  in(#profile-card)\n  gap([gap])\n  !strong {\n    &[top] == &:next[top];\n  }\n}\n\n/* portrait profile-card */\n@else {\n@v |\n    -\n    (#avatar)\n    -\n    (#name)\n    -\n    (#follow)\n    -\n    (#message)\n    -\n    (#following)\n    -\n    (#followers)\n    -\n   |\n  in(#cover)\n  gap([gap])\n  outer-gap([flex-gap]) !strong {\n    center-x: == #profile-card[center-x];\n}\n\n@h |-10-(#cover)-10-| in(#profile-card);\n@v |-10-(#cover)-10-| in(#profile-card);\n}\n\n  </style>\n  <div id=\"background\"></div>\n  <div id=\"profile-card\"></div>\n  <div id=\"cover\"></div>\n  <div id=\"avatar\"></div>\n  <h1 id=\"name\">Dan Daniels</h1>\n  <button id=\"follow\" class=\"primary\">Follow</button>\n  <button id=\"following\">Following</button>\n  <button id=\"followers\">Followers</button>\n  <button id=\"message\">Message</button>"
};

assert = chai.assert;

expect = chai.expect;

stringify = function(o) {
  return JSON.stringify(o, 1, 1);
};

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
  var index, type, _i, _len, _ref, _results;
  _ref = ['With worker', 'Without worker'];
  _results = [];
  for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
    type = _ref[index];
    _results.push((function(type, index) {
      return describe(type, function() {
        it('gss1 demo', function(done) {
          var container, engine;
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
          debugger;
          return engine.then(function(solution) {
            expect(solution['li-width']).to.eql((640 - 16) / 3);
            expect(solution['$aside[x]']).to.eql(640 / 2 + 100);
            return expect(solution['$header[width]']).to.eql(Math.round(640 / 2));
          });
        });
        return it('profile card', function(done) {
          var container, engine;
          container = document.createElement('div');
          container.id = 'profile-card-demo';
          container.style.height = '1024px';
          container.style.width = '768px';
          container.style.position = 'absolute';
          container.style.overflow = 'auto';
          container.style.left = 0;
          container.style.top = 0;
          window.$engine = engine = new GSS(container, index === 0);
          $('#fixtures').appendChild(container);
          container.innerHTML = DEMOS.PROFILE_CARD;
          return engine.then(function(solution) {
            expect(solution['flex-gap']).to.eql(95);
            expect(solution['flex-gap']).to.eql(95);
            expect(solution['$follow[x]']).to.eql(329.5);
            expect(solution['$follow[y]']).to.eql(540);
            container.style.height = '768px';
            container.style.width = '1124px';
            return engine.then(function(solution) {
              expect(solution['$follow[x]']).to.eql(435);
              expect(solution['$follow[y]']).to.eql(537);
              container.style.height = '1024px';
              container.style.width = '768px';
              return engine.then(function(solution) {
                expect(solution['flex-gap']).to.eql(95);
                expect(solution['flex-gap']).to.eql(95);
                expect(solution['$follow[x]']).to.eql(329.5);
                expect(solution['$follow[y]']).to.eql(540);
                container.style.height = '768px';
                container.style.width = '1124px';
                return engine.then(function(solution) {
                  expect(solution['$follow[x]']).to.eql(435);
                  expect(solution['$follow[y]']).to.eql(537);
                  container.innerHTML = "";
                  return engine.then(function(solution) {
                    return done();
                  });
                });
              });
            });
          });
        });
      });
    })(type, index));
  }
  return _results;
});
