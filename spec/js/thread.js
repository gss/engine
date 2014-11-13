var assert, expect;

expect = chai.expect;

assert = chai.assert;

describe('Cassowary Thread', function() {
  it('should instantiate', function() {
    var thread;
    return thread = new GSS;
  });
  it('[x]==7; [y]==5; [x] - [y] == [z] // z is 2', function(done) {
    var thread;
    thread = new GSS;
    thread.solve([['==', ['get', 'z'], ['-', ['get', 'x'], ['get', 'y']]], ['==', ['get', 'x'], 7], ['==', ['get', 'y'], 5]]);
    chai.expect(thread.values).to.eql({
      x: 7,
      y: 5,
      z: 2
    });
    return done();
  });
  it('hierarchy', function(done) {
    var thread;
    thread = new GSS;
    thread.solve([['==', ['get', 'x'], 100, 'strong'], ['==', ['get', 'x'], 10, 'medium'], ['==', ['get', 'x'], 1, 'weak'], ['==', ['get', 'y'], 1, 'weak'], ['==', ['get', 'y'], 10, 'medium'], ['==', ['get', 'y'], 101, 'strong']]);
    chai.expect(thread.values).to.eql({
      "x": 100,
      "y": 101
    });
    return done();
  });
  it('order of operations', function(done) {
    var thread;
    thread = new GSS;
    thread.solve([['==', ['get', 'w'], 100, 'required'], ['==', ['get', 'igap'], 3, 'required'], ['==', ['get', 'ogap'], 20, 'required'], ['==', ['get', 'md'], ['/', ['-', ['get', 'w'], ['*', ['get', 'ogap'], 2]], 4], 'required'], ['==', ['get', 'span3'], ['+', ['*', ['get', 'md'], 3], ['*', ['get', 'igap'], 2]], 'required']]);
    chai.expect(thread.values).to.eql({
      "w": 100,
      "igap": 3,
      "ogap": 20,
      "md": 15,
      "span3": 51
    });
    return done();
  });
  it('$12322[width] == [grid-col]; ...', function(done) {
    var thread;
    thread = new GSS;
    thread.solve([['==', ['get', '$12322[width]'], ['get', 'grid-col']], ['==', ['get', '$34222[width]'], ['get', 'grid-col']], ['==', 100, ['get', 'grid-col']]]);
    chai.expect(thread.values).to.eql({
      "$12322[width]": 100,
      "$34222[width]": 100,
      "grid-col": 100
    });
    return done();
  });
  it('Serial Suggests with plus expression', function(done) {
    var thread;
    thread = new GSS({
      pad: 1
    });
    thread.solve([['==', ['+', ['get', 'target-width'], ['get', 'pad']], ['get', 'actual-width']], ['==', ['get', 'target-width'], 100]]);
    chai.expect(thread.values).to.eql({
      "target-width": 100,
      "actual-width": 101
    });
    thread.solve({
      pad: 2
    });
    chai.expect(thread.updated.solution).to.eql({
      "actual-width": 102
    });
    thread.solve({
      pad: 4
    });
    chai.expect(thread.updated.solution).to.eql({
      "actual-width": 104
    });
    return done();
  });
  it('intrinsic mock', function(done) {
    var thread;
    thread = new GSS({
      'intrinsic-width': 999
    });
    thread.solve([['==', ['get', 'width'], 100, 'weak'], ['==', ['get', 'width'], ['get', 'intrinsic-width'], 'require']]);
    chai.expect(thread.values).to.eql({
      "width": 999
    });
    return done();
  });
  it('intrinsic var is immutable with suggestion', function() {
    var thread;
    thread = new GSS({
      'intrinsic-width': 100
    });
    thread.solve([['==', ['get', 'hgap'], 20, 'required'], ['==', ['get', 'width'], ['+', ['get', 'intrinsic-width'], ['get', 'hgap']], 'required'], ['==', ['get', 'width'], 20, 'strong']]);
    return chai.expect(thread.values).to.eql({
      "width": 120,
      "hgap": 20
    });
  });
  it('tracking & removing by get tracker', function(done) {
    var thread;
    thread = new GSS();
    thread.solve([['==', ['get', 'x', '', 'x-tracker'], 100, 'strong'], ['==', ['get', 'x'], 10, 'weak']]);
    chai.expect(thread.values).to.eql({
      "x": 100
    });
    thread.solve(['remove', 'x-tracker']);
    chai.expect(thread.values).to.eql({
      "x": 10
    });
    return done();
  });
  describe('dom prop helpers', function() {
    it('varexp - right', function() {
      var thread;
      thread = new GSS();
      thread.solve([['==', ['get', '$112', 'x', '.box'], 10], ['==', ['get', '$112', 'right', '.box'], 100]]);
      return expect(thread.values).to.eql({
        "$112[x]": 10,
        "$112[width]": 90
      });
    });
    it('varexp - center-x', function() {
      var thread;
      thread = new GSS();
      thread.solve([['==', ['get', '$112', 'x', '.box'], 10], ['==', ['get', '$112', 'center-x', '.box'], 110]]);
      return expect(thread.values).to.eql({
        "$112[x]": 10,
        "$112[width]": 200
      });
    });
    it('varexp - bottom', function() {
      var thread;
      thread = new GSS();
      thread.solve([['==', ['get', '$112', 'height', '.box'], 10], ['==', ['get', '$112', 'bottom', '.box'], 100]]);
      return expect(thread.values).to.eql({
        "$112[height]": 10,
        "$112[y]": 90
      });
    });
    return it('varexp - center-y', function() {
      var thread;
      thread = new GSS();
      thread.solve([['==', ['get', '$112', 'height', '.box'], 100], ['==', ['get', '$112', 'center-y', '.box'], 51]]);
      return expect(thread.values).to.eql({
        "$112[height]": 100,
        "$112[y]": 1
      });
    });
  });
  return describe('Tracking', function() {
    it('tracking by path', function() {
      var thread;
      thread = new GSS(document.createElement('div'));
      thread.solve([['==', ['get', '$222', 'line-height'], 1.6], ['==', ['get', '$112', 'x', '.box'], 10], ['==', ['get', '$112', 'right', '.box'], 100]]);
      expect(thread.updated.solution).to.eql({
        "$222[line-height]": 1.6,
        "$112[x]": 10,
        "$112[width]": 90
      });
      thread.solve(['remove', '.box']);
      return expect(thread.updated.solution).to.eql({
        "$112[x]": null,
        "$112[width]": null
      });
    });
    return it('tracking by selector', function() {
      var thread;
      thread = new GSS();
      thread.solve([['==', ['get', '$112', 'x', '.big-box'], 1000, 'required'], ['==', ['get', '$112', 'x', '.box'], 50, 'strong']]);
      expect(thread.updated.solution).to.eql({
        "$112[x]": 1000
      });
      thread.solve([['remove', '.big-box']]);
      return expect(thread.updated.solution).to.eql({
        "$112[x]": 50
      });
    });
  });
});
