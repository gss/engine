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

	describe('End-To-End', function () {

		it('simple1', function () {
			var solver = new c.SimplexSolver();

			var x = new c.Variable({ value: 167 });
			var y = new c.Variable({ value: 2 });
			var eq = new c.Equation(x, new c.Expression(y));

			solver.addConstraint(eq);
			assert.equal(x.value, y.value);
			assert.deepEqual(x.value, 0);
			assert.deepEqual(y.value, 0);
		});

		it('justStay1', function () {
			var x = new c.Variable({ value: 5 });
			var y = new c.Variable({ value: 10 });
			var solver = new c.SimplexSolver();
			solver.addStay(x);
			solver.addStay(y);
			assert.isTrue(c.approx(x, 5));
			assert.isTrue(c.approx(y, 10));
			assert.deepEqual(x.value, 5);
			assert.deepEqual(y.value, 10);
		});

		it('var >= num', function () {
			// x >= 100
			var solver = new c.SimplexSolver();

			var x = new c.Variable({ value: 10 });
			var ieq = new c.Inequality(x, c.GEQ, 100);
			solver.addConstraint(ieq);
			assert.deepEqual(x.value, 100);
		});

		it('num == var', function () {
			// 100 == var
			var solver = new c.SimplexSolver();

			var x = new c.Variable({ value: 10 });
			var eq = new c.Equation(100, x);
			solver.addConstraint(eq);
			assert.deepEqual(x.value, 100);
		});

		it('num <= var', function () {
			// x >= 100
			var solver = new c.SimplexSolver();

			var x = new c.Variable({ value: 10 });
			var ieq = new c.Inequality(100, c.LEQ, x);
			solver.addConstraint(ieq);

			assert.deepEqual(x.value, 100);
		});

		it('exp >= num', function () {
			// stay width
			// right >= 100
			var solver = new c.SimplexSolver();

			// x = 10
			var x = new c.Variable({ value: 10 });
			// width = 10
			var width = new c.Variable({ value: 10 });
			// right = x + width
			var right = new c.Expression(x).plus(width);
			// right >= 100
			var ieq = new c.Inequality(right, c.GEQ, 100);
			solver.addStay(width);
			solver.addConstraint(ieq);

			assert.deepEqual(x.value, 90);
			assert.deepEqual(width.value, 10);
		});

		it('num <= exp', function () {
			// stay width
			// 100 <= right
			var solver = new c.SimplexSolver();

			var x = new c.Variable({ value: 10 });
			var width = new c.Variable({ value: 10 });
			var right = new c.Expression(x).plus(width);
			var ieq = new c.Inequality(100, c.LEQ, right);

			solver.addStay(width)
				.addConstraint(ieq);

			assert.deepEqual(x.value, 90);
			assert.deepEqual(width.value, 10);
		});

		it('exp == var', function () {
			// stay width, rightMin
			// right >= rightMin
			var solver = new c.SimplexSolver();

			var x = new c.Variable({ value: 10 });
			var width = new c.Variable({ value: 10 });
			var rightMin = new c.Variable({ value: 100 });
			var right = new c.Expression(x).plus(width);
			var eq = new c.Equation(right, rightMin);

			solver.addStay(width)
				.addStay(rightMin)
				.addConstraint(eq);

			assert.deepEqual(x.value, 90);
			assert.deepEqual(width.value, 10);
		});

		it('exp >= var', function () {
			// stay width, rightMin
			// right >= rightMin
			var solver = new c.SimplexSolver();

			var x = new c.Variable({ value: 10 });
			var width = new c.Variable({ value: 10 });
			var rightMin = new c.Variable({ value: 100 });
			var right = new c.Expression(x).plus(width);
			var ieq = new c.Inequality(right, c.GEQ, rightMin);

			solver.addStay(width)
				.addStay(rightMin)
				.addConstraint(ieq);

			assert.deepEqual(x.value, 90);
			assert.deepEqual(width.value, 10);
		});

		it('var <= exp', function () {
			// stay width
			// right >= rightMin
			var solver = new c.SimplexSolver();

			var x = new c.Variable({ value: 10 });
			var width = new c.Variable({ value: 10 });
			var rightMin = new c.Variable({ value: 100 });
			var right = new c.Expression(x).plus(width);
			var ieq = new c.Inequality(rightMin, c.LEQ, right);
			solver.addStay(width)
				.addStay(rightMin)
				.addConstraint(ieq);

			assert.deepEqual(x.value, 90);
			assert.deepEqual(width.value, 10);
		});

		it('exp == exp', function () {
			// stay width, rightMin
			// right >= rightMin
			var solver = new c.SimplexSolver();

			var x1 = new c.Variable({ value: 10 });
			var width1 = new c.Variable({ value: 10 });
			var right1 = new c.Expression(x1).plus(width1);
			var x2 = new c.Variable({ value: 100 });
			var width2 = new c.Variable({ value: 10 });
			var right2 = new c.Expression(x2).plus(width2);

			var eq = new c.Equation(right1, right2);

			solver.addStay(width1)
				.addStay(width2)
				.addStay(x2)
				.addConstraint(eq);

			assert.deepEqual(x1.value, 100);
			assert.deepEqual(x2.value, 100);
			assert.deepEqual(width1.value, 10);
			assert.deepEqual(width2.value, 10);
		});

		it('exp >= exp', function () {
			// stay width, rightMin
			// right >= rightMin
			var solver = new c.SimplexSolver();

			var x1 = new c.Variable({ value: 10 });
			var width1 = new c.Variable({ value: 10 });
			var right1 = new c.Expression(x1).plus(width1);
			var x2 = new c.Variable({ value: 100 });
			var width2 = new c.Variable({ value: 10 });
			var right2 = new c.Expression(x2).plus(width2);

			var ieq = new c.Inequality(right1, c.GEQ, right2);

			solver.addStay(width1)
				.addStay(width2)
				.addStay(x2)
				.addConstraint(ieq);

			assert.deepEqual(x1.value, 100);
		});

		it('exp <= exp', function () {
			// stay width, rightMin
			// right >= rightMin
			var solver = new c.SimplexSolver();

			var x1 = new c.Variable({ value: 10 });
			var width1 = new c.Variable({ value: 10 });
			var right1 = new c.Expression(x1).plus(width1);
			var x2 = new c.Variable({ value: 100 });
			var width2 = new c.Variable({ value: 10 });
			var right2 = new c.Expression(x2).plus(width2);
			var ieq = new c.Inequality(right2, c.LEQ, right1);

			solver.addStay(width1)
				.addStay(width2)
				.addStay(x2)
				.addConstraint(ieq);

			assert.deepEqual(x1.value, 100);
		});

		it('addDelete1', function () {
			var solver = new c.SimplexSolver();
			var x = new c.Variable({ name: 'x' });
			var cbl = new c.Equation(x, 100, c.Strength.weak);
			solver.addConstraint(cbl);

			var c10 = new c.Inequality(x, c.LEQ, 10);
			var c20 = new c.Inequality(x, c.LEQ, 20);
			solver.addConstraint(c10)
			.addConstraint(c20);
			assert.isTrue(c.approx(x, 10));

			solver.removeConstraint(c10);
			assert.isTrue(c.approx(x, 20));

			solver.removeConstraint(c20);
			assert.isTrue(c.approx(x, 100));

			var c10again = new c.Inequality(x, c.LEQ, 10);
			solver.addConstraint(c10)
			.addConstraint(c10again);
			assert.isTrue(c.approx(x, 10));

			solver.removeConstraint(c10);
			assert.isTrue(c.approx(x, 10));

			solver.removeConstraint(c10again);
			assert.isTrue(c.approx(x, 100));
		});

		it('addDelete2', function () {
			var solver = new c.SimplexSolver();
			var x = new c.Variable({ name: 'x' });
			var y = new c.Variable({ name: 'y' });

			solver.addConstraint(new c.Equation(x, 100, c.Strength.weak))
			.addConstraint(new c.Equation(y, 120, c.Strength.strong));
			var c10 = new c.Inequality(x, c.LEQ, 10);
			var c20 = new c.Inequality(x, c.LEQ, 20);
			solver.addConstraint(c10)
			.addConstraint(c20);
			assert.isTrue(c.approx(x, 10));
			assert.isTrue(c.approx(y, 120));

			solver.removeConstraint(c10);
			assert.isTrue(c.approx(x, 20));
			assert.isTrue(c.approx(y, 120));

			var cxy = new c.Equation(c.times(2, x), y);
			solver.addConstraint(cxy);
			assert.isTrue(c.approx(x, 20));
			assert.isTrue(c.approx(y, 40));

			solver.removeConstraint(c20);
			assert.isTrue(c.approx(x, 60));
			assert.isTrue(c.approx(y, 120));

			solver.removeConstraint(cxy);
			assert.isTrue(c.approx(x, 100));
			assert.isTrue(c.approx(y, 120));
		});

		it('casso1', function () {
			var solver = new c.SimplexSolver();
			var x = new c.Variable({ name: 'x' });
			var y = new c.Variable({ name: 'y' });

			solver.addConstraint(new c.Inequality(x, c.LEQ, y))
			.addConstraint(new c.Equation(y, c.plus(x, 3)))
			.addConstraint(new c.Equation(x, 10, c.Strength.weak))
			.addConstraint(new c.Equation(y, 10, c.Strength.weak));

			assert.isTrue(
				(c.approx(x, 10) && c.approx(y, 13)) ||
				(c.approx(x,  7) && c.approx(y, 10))
				);
		});

		it('inconsistent1', function () {
			var solver = new c.SimplexSolver();
			var x = new c.Variable({ name: 'x' });
			// x = 10
			solver.addConstraint(new c.Equation(x, 10));
			// x = 5
			assert.throws(solver.addConstraint.bind(solver, new c.Equation(x, 5)), c.RequiredFailure);
		});

		it('inconsistent2', function () {
			var solver = new c.SimplexSolver();
			var x = new c.Variable({ name: 'x' });
			solver.addConstraint(new c.Inequality(x, c.GEQ, 10));
			assert.throws(solver.addConstraint.bind(solver, new c.Inequality(x, c.LEQ, 5)),
				c.RequiredFailure);
		});

		it('inconsistent3', function () {
			var solver = new c.SimplexSolver();
			var w = new c.Variable({ name: 'w' });
			var x = new c.Variable({ name: 'x' });
			var y = new c.Variable({ name: 'y' });
			var z = new c.Variable({ name: 'z' });
			solver.addConstraint(new c.Inequality(w, c.GEQ, 10))
			.addConstraint(new c.Inequality(x, c.GEQ, w))
			.addConstraint(new c.Inequality(y, c.GEQ, x))
			.addConstraint(new c.Inequality(z, c.GEQ, y))
			.addConstraint(new c.Inequality(z, c.GEQ, 8));

			assert.throws(solver.addConstraint.bind(solver, new c.Inequality(z, c.LEQ, 4)),
				c.RequiredFailure);
		});

		it('inconsistent4', function () {
			var solver = new c.SimplexSolver();
			var x = new c.Variable({ name: 'x' });
			var y = new c.Variable({ name: 'y' });
			// x = 10
			solver.addConstraint(new c.Equation(x, 10));
			// x = y
			solver.addConstraint(new c.Equation(x, y));
			// y = 5. Should fail.
			assert.throws(solver.addConstraint.bind(solver, new c.Equation(y, 5)), c.RequiredFailure);
		});

		it('multiedit', function () {
			// This test stresses the edit session stack. beginEdit() starts a new
			// "edit variable group" and "endEdit" closes it, leaving only the
			// previously opened edit variables still active.
			var x = new c.Variable({ name: 'x' });
			var y = new c.Variable({ name: 'y' });
			var w = new c.Variable({ name: 'w' });
			var h = new c.Variable({ name: 'h' });
			var solver = new c.SimplexSolver();
			// Add some stays and start an editing session
			solver.addStay(x)
						.addStay(y)
						.addStay(w)
						.addStay(h)
						.addEditVar(x)
						.addEditVar(y).beginEdit();
			solver.suggestValue(x, 10)
						.suggestValue(y, 20).resolve();
			assert.isTrue(c.approx(x, 10));
			assert.isTrue(c.approx(y, 20));
			assert.isTrue(c.approx(w, 0));
			assert.isTrue(c.approx(h, 0));

			// Open a second set of variables for editing
			solver.addEditVar(w)
						.addEditVar(h).beginEdit();
			solver.suggestValue(w, 30)
						.suggestValue(h, 40).endEdit();
			// Close the second set...
			assert.isTrue(c.approx(x, 10));
			assert.isTrue(c.approx(y, 20));
			assert.isTrue(c.approx(w, 30));
			assert.isTrue(c.approx(h, 40));

			// Now make sure the first set can still be edited
			solver.suggestValue(x, 50)
						.suggestValue(y, 60).endEdit();
			assert.isTrue(c.approx(x, 50));
			assert.isTrue(c.approx(y, 60));
			assert.isTrue(c.approx(w, 30));
			assert.isTrue(c.approx(h, 40));
		});

		it('multiedit2', function () {
			var x = new c.Variable({ name: 'x' });
			var y = new c.Variable({ name: 'y' });
			var w = new c.Variable({ name: 'w' });
			var h = new c.Variable({ name: 'h' });
			var solver = new c.SimplexSolver();
			solver.addStay(x)
			.addStay(y)
			.addStay(w)
			.addStay(h)
			.addEditVar(x)
			.addEditVar(y).beginEdit();
			solver.suggestValue(x, 10)
			.suggestValue(y, 20).resolve();
			solver.endEdit();
			assert.isTrue(c.approx(x, 10));
			assert.isTrue(c.approx(y, 20));
			assert.isTrue(c.approx(w, 0));
			assert.isTrue(c.approx(h, 0));

			solver.addEditVar(w)
			.addEditVar(h).beginEdit();
			solver.suggestValue(w, 30)
			.suggestValue(h, 40).endEdit();
			assert.isTrue(c.approx(x, 10));
			assert.isTrue(c.approx(y, 20));
			assert.isTrue(c.approx(w, 30));
			assert.isTrue(c.approx(h, 40));

			solver.addEditVar(x)
			.addEditVar(y).beginEdit();
			solver.suggestValue(x, 50)
			.suggestValue(y, 60).endEdit();
			assert.isTrue(c.approx(x, 50));
			assert.isTrue(c.approx(y, 60));
			assert.isTrue(c.approx(w, 30));
			assert.isTrue(c.approx(h, 40));
		});

		it('multiedit3', function () {
			var rand = function (max, min) {
				min = (typeof min !== 'undefined') ? min : 0;
				max = max || Math.pow(2, 26);
				return parseInt(Math.random() * (max - min), 10) + min;
			};
			var MAX = 500;
			var MIN = 100;

			var weak = c.Strength.weak;
			var medium = c.Strength.medium;
			var strong = c.Strength.strong;

			var eq  = function (a1, a2, strength, w) {
				return new c.Equation(a1, a2, strength || weak, w || 0);
			};

			var v = {
				width: new c.Variable({ name: 'width' }),
				height: new c.Variable({ name: 'height' }),
				top: new c.Variable({ name: 'top' }),
				bottom: new c.Variable({ name: 'bottom' }),
				left: new c.Variable({ name: 'left' }),
				right: new c.Variable({ name: 'right' }),
			};

			var solver = new c.SimplexSolver();

			var iw = new c.Variable({
				name: 'window_innerWidth',
				value: rand(MAX, MIN)
			});
			var ih = new c.Variable({
				name: 'window_innerHeight',
				value: rand(MAX, MIN)
			});
			var iwStay = new c.StayConstraint(iw);
			var ihStay = new c.StayConstraint(ih);

			var widthEQ = eq(v.width, iw, strong);
			var heightEQ = eq(v.height, ih, strong);

			[
				widthEQ,
				heightEQ,
				eq(v.top, 0, weak),
				eq(v.left, 0, weak),
				eq(v.bottom, c.plus(v.top, v.height), medium),
				// Right is at least left + width
				eq(v.right,  c.plus(v.left, v.width), medium),
				iwStay,
				ihStay
			].forEach(function (c) {
				solver.addConstraint(c);
			});

			// Propigate viewport size changes.
			var reCalc = function () {

				// Measurement should be cheap here.
				var iwv = rand(MAX, MIN);
				var ihv = rand(MAX, MIN);

				solver.addEditVar(iw);
				solver.addEditVar(ih);

				solver.beginEdit();
				solver.suggestValue(iw, iwv)
				.suggestValue(ih, ihv);
				solver.resolve();
				solver.endEdit();

				assert.deepEqual(v.top.value, 0);
				assert.deepEqual(v.left.value, 0);
				assert.isTrue(v.bottom.value <= MAX);
				assert.isTrue(v.bottom.value >= MIN);
				assert.isTrue(v.right.value <= MAX);
				assert.isTrue(v.right.value >= MIN);

			}.bind(this);

			reCalc();
			reCalc();
			reCalc();
		});

		it('errorWeights', function () {
			var solver = new c.SimplexSolver();

			var weak = c.Strength.weak;
			var medium = c.Strength.medium;
			var strong = c.Strength.strong;

			var x = new c.Variable({ name: 'x', value: 100 });
			var y = new c.Variable({ name: 'y', value: 200 });
			var z = new c.Variable({ name: 'z', value: 50 });
			assert.deepEqual(x.value, 100);
			assert.deepEqual(y.value, 200);
			assert.deepEqual(z.value,  50);

			solver.addConstraint(new c.Equation(z,   x,   weak))
			.addConstraint(new c.Equation(x,  20,   weak))
			.addConstraint(new c.Equation(y, 200, strong));

			assert.deepEqual(x.value,  20);
			assert.deepEqual(y.value, 200);
			assert.deepEqual(z.value,  20);

			solver.addConstraint(
				new c.Inequality(c.plus(z, 150), c.LEQ, y, medium)
				);

			assert.deepEqual(x.value,  20);
			assert.deepEqual(y.value, 200);
			assert.deepEqual(z.value,  20);
		});
	});
});