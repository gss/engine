var assert, expect, remove;

assert = chai.assert;

expect = chai.expect;

remove = function(el) {
  var _ref;
  return el != null ? (_ref = el.parentNode) != null ? _ref.removeChild(el) : void 0 : void 0;
};

describe('Standalone page tests', function() {
  var container, engine, iframe;
  engine = container = iframe = null;
  afterEach(function() {});
  beforeEach(function() {
    iframe = document.createElement('iframe');
    return document.body.appendChild(iframe);
  });
  this.timeout(100000);
  return describe('Grid website', function() {
    describe('Virtuals demo', function() {
      return it('should reorient', function(done) {
        var i, listener;
        i = 0;
        listener = function(e) {
          if (e.origin === location.origin) {
            expect();
          }
          window.removeEventListener('message', listener);
          return done();
        };
        window.addEventListener('message', listener);
        iframe.width = 1024;
        iframe.height = 768;
        return iframe.src = './pages/virtuals.html?log=0.5';
      });
    });
    describe('Head cta section', function() {
      return it('should reorient', function(done) {
        var i;
        i = 0;
        window.addEventListener('message', function(e) {
          if (e.origin === location.origin) {
            return expect();
          }
        });
        iframe.width = 1024;
        iframe.height = 768;
        return iframe.src = './pages/grid_head_cta.html?log=0.5';
      });
    });
    return describe('Team section', function() {
      return it('should reorient', function(done) {
        var i;
        i = 0;
        window.addEventListener('message', function(e) {
          if (e.origin === location.origin) {
            i++;
            if (i === 8) {
              return done();
            }
            if (i % 4 === 1) {
              expect(Math.floor(e.data['$dan_tocchini[y]'])).to.eql(228);
              expect(Math.floor(e.data['$dan_tocchini[x]'])).to.eql(368);
              expect(Math.floor(e.data['$dan_tocchini[width]'])).to.eql(288);
              expect(Math.floor(e.data['$yaroslaff_fedin[y]'])).to.eql(1632);
              expect(Math.floor(e.data['$yaroslaff_fedin[x]'])).to.eql(284);
              expect(Math.floor(e.data['$yaroslaff_fedin[width]'])).to.eql(216);
              expect(Math.floor(e.data['$lost_cosmonaut[y]'])).to.eql(2261);
              expect(Math.floor(e.data['$lost_cosmonaut[x]'])).to.eql(642);
              expect(Math.floor(e.data['$lost_cosmonaut[width]'])).to.eql(216);
              return iframe.width = 768;
            } else if (i % 4 === 2) {
              expect(Math.floor(e.data['$dan_tocchini[y]'])).to.eql(0);
              expect(Math.floor(e.data['$dan_tocchini[x]'])).to.eql(768);
              expect(Math.floor(e.data['$dan_tocchini[width]'])).to.eql(768);
              expect(Math.floor(e.data['$yaroslaff_fedin[y]'])).to.eql(0);
              expect(Math.floor(e.data['$yaroslaff_fedin[x]'])).to.eql(6144);
              expect(Math.floor(e.data['$yaroslaff_fedin[width]'])).to.eql(768);
              expect(Math.floor(e.data['$lost_cosmonaut[y]'])).to.eql(0);
              expect(Math.floor(e.data['$lost_cosmonaut[x]'])).to.eql(9983);
              expect(Math.floor(e.data['$lost_cosmonaut[width]'])).to.eql(768);
              return iframe.width = 1024;
            } else if (i % 4 === 3) {
              expect(Math.floor(e.data['$dan_tocchini[y]'])).to.eql(228);
              expect(Math.floor(e.data['$dan_tocchini[x]'])).to.eql(368);
              expect(Math.floor(e.data['$dan_tocchini[width]'])).to.eql(288);
              expect(Math.floor(e.data['$yaroslaff_fedin[y]'])).to.eql(1632);
              expect(Math.floor(e.data['$yaroslaff_fedin[x]'])).to.eql(284);
              expect(Math.floor(e.data['$yaroslaff_fedin[width]'])).to.eql(216);
              expect(Math.floor(e.data['$lost_cosmonaut[y]'])).to.eql(2261);
              expect(Math.floor(e.data['$lost_cosmonaut[x]'])).to.eql(642);
              expect(Math.floor(e.data['$lost_cosmonaut[width]'])).to.eql(216);
              return iframe.width = 320;
            } else {
              expect(Math.floor(e.data['$dan_tocchini[y]'])).to.eql(218);
              expect(Math.floor(e.data['$dan_tocchini[x]'])).to.eql(320);
              expect(Math.floor(e.data['$dan_tocchini[width]'])).to.eql(320);
              expect(Math.floor(e.data['$yaroslaff_fedin[y]'])).to.eql(218);
              expect(Math.floor(e.data['$yaroslaff_fedin[x]'])).to.eql(2560);
              expect(Math.floor(e.data['$yaroslaff_fedin[width]'])).to.eql(320);
              expect(Math.floor(e.data['$lost_cosmonaut[y]'])).to.eql(218);
              expect(Math.floor(e.data['$lost_cosmonaut[x]'])).to.eql(4160);
              expect(Math.floor(e.data['$lost_cosmonaut[width]'])).to.eql(320);
              return iframe.width = 1024;
            }
          }
        });
        iframe.width = 1024;
        iframe.height = 768;
        return iframe.src = './pages/grid_team.html?log=0.5';
      });
    });
  });
});
