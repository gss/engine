var assert, expect;

assert = chai.assert;

expect = chai.expect;

describe('Domain', function() {
  var engine;
  engine = null;
  afterEach(function() {
    if (engine) {
      return engine.destroy();
    }
  });
  describe('single solving domain', function() {
    it('should find solutions', function() {
      engine = new GSS.Engine();
      return expect(engine.solve([['==', ['get', 'result'], ['+', ['get', 'a'], 1]]])).to.eql({
        result: 0,
        a: -1
      });
    });
    return it('should find solutions when using nested simple expressions', function() {
      engine = new GSS.Engine();
      return expect(engine.solve([['==', ['get', 'result'], ['+', ['get', 'a'], ['+', ['*', 1, 2], 3]]]])).to.eql({
        result: 0,
        a: -5
      });
    });
  });
  describe('solving and assumed domains together', function() {
    it('should calculate simplified expression', function() {
      window.$engine = engine = new GSS({
        a: 666
      });
      return expect(engine.solve([['==', ['get', 'result'], ['+', ['get', 'a'], 1]]])).to.eql({
        result: 667
      });
    });
    it('should calculate simplified variable', function() {
      engine = new GSS({
        a: 666
      });
      expect(engine.solve([['==', ['get', 'result'], ['get', 'a']]])).to.eql({
        result: 666
      });
      return expect(engine.solve({
        a: null
      })).to.eql({
        a: 0,
        result: 0
      });
    });
    it('should simplify partially', function() {
      window.$engine = engine = new GSS({
        a: 555
      });
      expect(engine.solve([['==', ['get', 'b'], 10], ['==', ['get', 'result'], ['+', ['*', 2, ['get', 'a']], ['get', 'b']]]])).to.eql({
        result: 555 * 2 + 10,
        b: 10
      });
      debugger;
      return expect(engine.solve({
        a: -555
      })).to.eql({
        result: -1100,
        a: -555
      });
    });
    it('should simplify multiple variables partially', function() {
      engine = new GSS({
        a: 555,
        A: 2
      });
      expect(engine.solve([['==', ['get', 'b'], 10], ['==', ['get', 'result'], ['+', ['*', ['get', 'A'], ['get', 'a']], ['get', 'b']]]])).to.eql({
        result: 555 * 2 + 10,
        b: 10
      });
      GSS.console.info('a=-555, was 555');
      expect(engine.solve({
        a: -555
      })).to.eql({
        result: -1100,
        a: -555
      });
      GSS.console.info('A=1, was 2');
      return expect(engine.solve({
        A: 1
      })).to.eql({
        A: 1,
        result: -545
      });
    });
    it('should change variable domain after the fact', function() {
      engine = new GSS;
      expect(engine.solve([['==', ['get', 'result'], ['+', ['get', 'a'], 1]]])).to.eql({
        result: 0,
        a: -1
      });
      GSS.console.error('A=666');
      expect(engine.solve({
        a: 666
      })).to.eql({
        a: 666,
        result: 667
      });
      GSS.console.error('A=null');
      return expect(engine.solve({
        a: null
      })).to.eql({
        result: 1,
        a: 0
      });
    });
    return it('should use intrinsic values as known values', function() {
      var el;
      el = document.createElement('div');
      el.innerHTML = "<div id=\"box0\" style=\"width: 50px\"></div>\n<div id=\"box1\" style=\"width: 50px\"></div>";
      document.body.appendChild(el);
      engine = new GSS(el);
      return engine.solve([['==', ['get', 'a'], ['+', ['get', ['#', 'box0'], 'z'], ['get', ['#', 'box1'], 'intrinsic-width']]]], function(solution) {
        expect(solution).to.eql({
          "a": 0,
          "$box0[z]": -50,
          "$box1[intrinsic-width]": 50
        });
        return document.body.removeChild(el);
      });
    });
  });
  describe('solvers in worker', function() {
    it('should receieve measurements from document to make substitutions', function(done) {
      var problem, root;
      root = document.createElement('div');
      root.innerHTML = "<div id=\"box0\" style=\"width: 20px\"></div>";
      document.body.appendChild(root);
      engine = new GSS(root, true);
      problem = [['==', ['get', 'result'], ['-', ['+', ['get', ['#', 'box0'], 'intrinsic-width'], 1], ['get', 'x']]]];
      return engine.solve(problem, 'my_funny_tracker_path', function(solution) {
        expect(solution).to.eql({
          "$box0[intrinsic-width]": 20,
          result: 0,
          x: 21
        });
        debugger;
        return engine.solve({
          x: 2
        }, function(solution) {
          expect(solution).to.eql({
            result: 19,
            x: 2
          });
          return engine.solve({
            "x": 3
          }, function(solution) {
            expect(solution).to.eql({
              result: 18,
              x: 3
            });
            return engine.solve({
              "x": null
            }, function(solution) {
              GSS.console.info(solution);
              expect(solution).to.eql({
                result: 21,
                x: 0
              });
              root.removeChild(engine.id('box0'));
              return engine.then(function(solution) {
                GSS.console.info(solution);
                expect(solution).to.eql({
                  "$box0[intrinsic-width]": null,
                  "x": null,
                  "result": null
                });
                return done();
              });
            });
          });
        });
      });
    });
    return it('should receive commands from document', function(done) {
      var problem;
      engine = new GSS(true);
      problem = [['==', ['get', 'result'], ['+', ['get', 'a'], 1]], ['==', ['get', 'b'], ['+', 1000, 1]]];
      return engine.solve(problem, function(solution) {
        expect(solution).to.eql({
          a: -1,
          result: 0,
          b: 1001
        });
        return done();
      });
    });
  });
  xdescribe('framed domains', function(done) {
    it('should not merge expressions of a framed domain in worker', function() {
      var problem;
      window.$engine = engine = new GSS(true);
      problem = [['framed', ['>=', ['get', 'a'], 1]], ['==', ['get', 'b'], 2], ['==', ['get', 'b'], ['get', 'a'], 'strong']];
      return engine.solve(problem, function(solution) {
        expect(solution).to.eql({
          a: 1,
          b: 1
        });
        return engine.solve(['>=', ['get', 'a', '', 'something'], 3], function(solution) {
          expect(solution).to.eql({
            a: 3,
            b: 3
          });
          return engine.solve(['>=', ['get', 'b'], 4], function(solution) {
            expect(solution).to.eql({});
            return engine.solve(['>=', ['get', 'c'], ['*', 2, ['get', 'b']]], function(solution) {
              expect(solution).to.eql({
                c: 6
              });
              return engine.solve(['remove', 'something'], function(solution) {
                expect(solution).to.eql({
                  a: 1,
                  b: 1,
                  c: 2
                });
                return done();
              });
            });
          });
        });
      });
    });
    it('should not merge expressions of a framed domain', function() {
      var problem;
      window.$engine = engine = new GSS;
      problem = [['framed', ['>=', ['get', 'a'], 1]], ['==', ['get', 'b'], 2], ['==', ['get', 'b'], ['get', 'a'], 'strong']];
      expect(engine.solve(problem)).to.eql({
        a: 1,
        b: 1
      });
      expect(engine.domains[2].constraints.length).to.eql(1);
      expect(engine.domains[3].constraints.length).to.eql(2);
      expect(engine.solve(['>=', ['get', 'a', '', 'something'], 3])).to.eql({
        a: 3,
        b: 3
      });
      expect(engine.domains[2].constraints.length).to.eql(2);
      expect(engine.domains[3].constraints.length).to.eql(2);
      expect(engine.solve(['>=', ['get', 'b'], 4])).to.eql({});
      expect(engine.domains[2].constraints.length).to.eql(2);
      expect(engine.domains[3].constraints.length).to.eql(3);
      expect(engine.solve(['>=', ['get', 'c'], ['*', 2, ['get', 'b']]])).to.eql({
        c: 6
      });
      expect(engine.domains[2].constraints.length).to.eql(2);
      expect(engine.domains[3].constraints.length).to.eql(4);
      expect(engine.solve(['remove', 'something'])).to.eql({
        a: 1,
        b: 1,
        c: 2
      });
      expect(engine.domains[2].constraints.length).to.eql(1);
      return expect(engine.domains[3].constraints.length).to.eql(4);
    });
    return it('should be able to export multiple framed variables into one domain', function() {
      var A, B, C, problem;
      window.$engine = engine = new GSS;
      problem = [['framed', ['>=', ['get', 'a'], 1]], ['framed', ['>=', ['get', 'b'], 2]], ['==', ['get', 'c'], ['+', ['get', 'a'], ['get', 'b']]]];
      expect(engine.solve(problem)).to.eql({
        a: 1,
        b: 2,
        c: 3
      });
      A = engine.domains[2];
      B = engine.domains[3];
      C = engine.domains[4];
      expect(A.constraints.length).to.eql(1);
      expect(B.constraints.length).to.eql(1);
      expect(C.constraints.length).to.eql(1);
      expect(engine.solve(['==', ['get', 'a', '', 'aa'], -1])).to.eql({
        a: -1,
        c: 1
      });
      expect(A.constraints.length).to.eql(2);
      expect(B.constraints.length).to.eql(1);
      expect(C.constraints.length).to.eql(1);
      expect(engine.solve(['==', ['get', 'b', '', 'bb'], -2])).to.eql({
        b: -2,
        c: -3
      });
      expect(A.constraints.length).to.eql(2);
      expect(B.constraints.length).to.eql(2);
      expect(C.constraints.length).to.eql(1);
      expect(engine.solve(['==', ['get', 'c', '', 'cc'], 10])).to.eql({
        c: 10
      });
      expect(A.constraints.length).to.eql(2);
      expect(B.constraints.length).to.eql(2);
      expect(C.constraints.length).to.eql(2);
      expect(engine.solve(['remove', 'aa'])).to.eql({
        a: 1
      });
      expect(A.constraints.length).to.eql(1);
      expect(B.constraints.length).to.eql(2);
      expect(C.constraints.length).to.eql(2);
      expect(engine.solve(['remove', 'cc'])).to.eql({
        c: -1
      });
      expect(A.constraints.length).to.eql(1);
      expect(B.constraints.length).to.eql(2);
      expect(C.constraints.length).to.eql(1);
      expect(engine.solve(['remove', 'bb'])).to.eql({
        c: 3,
        b: 2
      });
      expect(A.constraints.length).to.eql(1);
      expect(B.constraints.length).to.eql(1);
      return expect(C.constraints.length).to.eql(1);
    });
  });
  return describe('variable graphs', function() {
    it('should unmerge multiple domains', function() {
      var problem;
      engine = new GSS;
      problem = [['==', ['get', 'a'], 1], ['==', ['get', 'b'], ['get', 'c']]];
      expect(engine.solve(problem)).to.eql({
        a: 1,
        b: 0,
        c: 0
      });
      expect(engine.solve([['==', ['get', 'c'], ['*', 2, ['get', 'a']]]], 'my_tracker_path')).to.eql({
        b: 2,
        c: 2
      });
      GSS.console.log(1);
      return expect(engine.solve([['remove', 'my_tracker_path']])).to.eql({
        b: 0,
        c: 0
      });
    });
    return it('should merge multiple domains', function() {
      var problem;
      engine = new GSS;
      problem = [['==', ['get', 'result'], ['+', ['get', 'a'], 1]], ['<=', ['get', 'b'], 4], ['>=', ['get', 'b'], 2]];
      expect(engine.solve(problem)).to.eql({
        result: 0,
        a: -1,
        b: 4
      });
      expect(engine.solve([['>=', ['get', 'a'], 5]])).to.eql({
        result: 6,
        a: 5
      });
      expect(engine.solve([['>=', ['get', 'c'], ['+', ['get', 'b'], 6]]])).to.eql({
        c: 10
      });
      expect(engine.solve([['==', ['get', 'b'], 3]])).to.eql({
        c: 9,
        b: 3
      });
      return expect(engine.solve([['<=', ['get', 'c'], ['get', 'result']]])).to.eql({
        a: 8,
        result: 9
      });
    });
  });
});
