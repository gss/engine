/* global c */

// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)

define([
	'intern!bdd',
	'intern/chai!assert',
	'./deps'
], function (bdd, assert) {
	'use strict';

	var describe = bdd.describe,
		it = bdd.it;

	describe('c.SimplexSolver', function () {
		it('should be constructable without args', function () {
			new c.SimplexSolver();
		});

		// FIXME(slightlyoff): MOAR TESTS
		describe('addPointStays', function () {

		});
	});
  describe("addEditVar", function() {
    it("works with required strength", function() {
      var solver = new c.SimplexSolver();
      var a = new c.Variable({
        name: "a"
      });

      solver.addConstraint(new c.StayConstraint(a, c.Strength.strong, 0));
      solver.resolve();

      assert.equal(0, a.value);

      solver.addEditVar(a, c.Strength.required)
        .beginEdit()
        .suggestValue(a, 2)
        .resolve();

      assert.equal(2, a.value);
    });
    it("works with required strength after many suggestions", function() {
      var solver = new c.SimplexSolver();
      var a = new c.Variable({
        name: "a"
      });
      var b = new c.Variable({
        name: "b"
      });

      solver.addConstraint(new c.StayConstraint(a, c.Strength.strong, 0))
        .addConstraint(new c.Equation(a,b,c.Strength.required))
        .resolve();
      assert.equal(0, b.value);
      assert.equal(0, a.value);

      solver.addEditVar(a, c.Strength.required)
        .beginEdit()
        .suggestValue(a, 2)
        .resolve();

      assert.equal(2, a.value);
      assert.equal(2, b.value);
      
      solver.suggestValue(a, 10)
        .resolve();
        
      assert.equal(10, a.value);
      assert.equal(10, b.value);
    });
		it('works with weight', function () {
			var x = new c.Variable({ name: 'x' });
			var y = new c.Variable({ name: 'y' });
			var solver = new c.SimplexSolver();
			solver.addStay(x).addStay(y)
      .addConstraint(new c.Equation(x, y, c.Strength.required))
			.addEditVar(x,c.Strength.medium,1)
			.addEditVar(y,c.Strength.medium,10).beginEdit();
			solver.suggestValue(x, 10)
			.suggestValue(y, 20)
      solver.resolve();
			assert.isTrue(c.approx(x, 20));
			assert.isTrue(c.approx(y, 20));
		});        
  });
});