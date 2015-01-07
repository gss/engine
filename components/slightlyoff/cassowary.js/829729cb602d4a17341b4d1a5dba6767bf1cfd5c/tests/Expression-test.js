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

	describe('c.Expression', function () {
		it('is constructable with 3 variables as arguments', function () {
			var x = new c.Variable({ name: 'x', value: 167 });
			var e = new c.Expression(x, 2, 3);
			assert.deepEqual(e+'', '3 + 2*167');
		});

		it('is constructable with one parameter', function () {
			assert.deepEqual(new c.Expression(4)+'', '4');
		});

		it('plus', function () {
			var x = new c.Variable({ name: 'x', value: 167 });
			assert.deepEqual(c.plus(4, 2)+'', '6');
			assert.deepEqual(c.plus(x, 2)+'', '2 + 1*167');
			assert.deepEqual(c.plus(3, x)+'', '3 + 1*167');
		});

		it('plus_solve', function () {
			var x = new c.Variable({ name: 'x', value: 167 });
			assert.deepEqual(c.plus(4, 2)+'', '6');
			assert.deepEqual(c.plus(x, 2)+'', '2 + 1*167');
			assert.deepEqual(c.plus(3, x)+'', '3 + 1*167');
		});

		it('times', function () {
			var x = new c.Variable({ name: 'x', value: 167 });
			assert.deepEqual(c.times(x, 3)+'', '3*167');
			assert.deepEqual(c.times(7, x)+'', '7*167');
		});

		it('complex', function () {
			var x = new c.Variable({ name: 'x', value: 167 });
			var y = new c.Variable({ name: 'y', value: 2 });
			var ex = c.plus(4, c.plus(c.times(x, 3), c.times(2, y)));
			assert.deepEqual(ex+'', '4 + 3*167 + 2*2');
		});

		it('zero_args', function () {
			var exp = new c.Expression();
			assert.deepEqual(0, exp.constant);
			assert.deepEqual(0, exp.terms.size);
		});

		it('one_number', function () {
			var exp = new c.Expression(10);
			assert.deepEqual(10, exp.constant);
			assert.deepEqual(0, exp.terms.size);
		});

		it('one_variable', function () {
			var v = new c.Variable({ value: 10 });
			var exp = new c.Expression(v);
			assert.deepEqual(0, exp.constant);
			assert.deepEqual(1, exp.terms.size);
			assert.deepEqual(1, exp.terms.get(v));
		});

		it('variable_number', function () {
			var v = new c.Variable({ value: 10 });
			var exp = new c.Expression(v, 20);
			assert.deepEqual(0, exp.constant);
			assert.deepEqual(1, exp.terms.size);
			assert.deepEqual(20, exp.terms.get(v));
		});

		it('variable_number_number', function () {
			var v = new c.Variable({ value: 10 });
			var exp = new c.Expression(v, 20, 2);
			assert.deepEqual(2, exp.constant);
			assert.deepEqual(1, exp.terms.size);
			assert.deepEqual(20, exp.terms.get(v));
		});

		it('clone', function () {
			var v = new c.Variable({ value: 10 });
			var exp = new c.Expression(v, 20, 2);
			var clone = exp.clone();

			assert.deepEqual(clone.constant, exp.constant);
			assert.deepEqual(clone.terms.size, exp.terms.size);
			assert.deepEqual(20, clone.terms.get(v));
		});

		it('isConstant', function () {
			var e1 = new c.Expression();
			var e2 = new c.Expression(10);
			var e3 = new c.Expression(new c.Variable({ value: 10 }), 20, 2);

			assert.deepEqual(true, e1.isConstant);
			assert.deepEqual(true, e2.isConstant);
			assert.deepEqual(false, e3.isConstant);
		});

		it('multiplyMe', function () {
			var v = new c.Variable({ value: 10 });
			var e = new c.Expression(v, 20, 2).multiplyMe(-1);

			assert.deepEqual(e.constant, -2);
			assert.deepEqual(v.value, 10);
			assert.deepEqual(e.terms.get(v), -20);
		});

		it('times', function () {
			var v = new c.Variable({ value: 10 });
			var a = new c.Expression(v, 20, 2);

			// times a number
			var e = a.times(10);
			assert.deepEqual(e.constant, 20);
			assert.deepEqual(e.terms.get(v), 200);

			// times a constant exression
			e = a.times(new c.Expression(10));
			assert.deepEqual(e.constant, 20);
			assert.deepEqual(e.terms.get(v), 200);

			// constant expression times another expression
			e = new c.Expression(10).times(a);
			assert.deepEqual(e.constant, 20);
			assert.deepEqual(e.terms.get(v), 200);

			// multiplying two non-constant expressions
			// t.e(c.NonExpression, a, 'times', [a]);
			assert.throws(a.times.bind(a, a), c.NonExpression);
		});

		it('addVariable', function () {
			var a = new c.Expression(new c.Variable({ value: 10 }), 20, 2);
			var v = new c.Variable({ value: 20 });

			// implicit coefficient of 1
			a.addVariable(v);
			assert.deepEqual(a.terms.size, 2);
			assert.deepEqual(a.terms.get(v), 1);

			// add again, with different coefficient
			a.addVariable(v, 2);
			assert.deepEqual(a.terms.size, 2);
			assert.deepEqual(a.terms.get(v), 3);

			// add again, with resulting 0 coefficient. should remove the term.
			a.addVariable(v, -3);
			assert.deepEqual(a.terms.size, 1);
			assert.deepEqual(null, a.terms.get(v));

			// try adding the removed term back, with 0 coefficient
			a.addVariable(v, 0);
			assert.deepEqual(a.terms.size, 1);
			assert.deepEqual(null, a.terms.get(v));
		});

		it('addExpression_variable', function () {
			var a = new c.Expression(new c.Variable({ value: 10 }), 20, 2);
			var v = new c.Variable({ value: 20 });

			// should work just like addVariable
			a.addExpression(v, 2);
			assert.deepEqual(a.terms.size, 2);
			assert.deepEqual(a.terms.get(v), 2);
		});

		it('addExpression', function () {
			var va = new c.Variable({ value: 10 });
			var vb = new c.Variable({ value: 20 });
			var vc = new c.Variable({ value: 5 });
			var a = new c.Expression(va, 20, 2);

			// different variable and implicit coefficient of 1, should make new term
			a.addExpression(new c.Expression(vb, 10, 5));
			assert.deepEqual(a.terms.size, 2);
			assert.deepEqual(a.constant, 7);
			assert.deepEqual(a.terms.get(vb), 10);

			// same variable, should reuse existing term
			a.addExpression(new c.Expression(vb, 2, 5));
			assert.deepEqual(a.terms.size, 2);
			assert.deepEqual(a.constant, 12);
			assert.deepEqual(a.terms.get(vb), 12);

			// another variable and a coefficient,
			// should multiply the constant and all terms in the new expression
			a.addExpression(new c.Expression(vc, 1, 2), 2);
			assert.deepEqual(a.terms.size, 3);
			assert.deepEqual(a.constant, 16);
			assert.deepEqual(a.terms.get(vc), 2);
		});

		it('plus', function () {
			var va = new c.Variable({ value: 10 });
			var vb = new c.Variable({ value: 20 });
			var a = new c.Expression(va, 20, 2);
			var b = new c.Expression(vb, 10, 5);

			var p = a.plus(b);
			assert.notDeepEqual(a, p);
			assert.notDeepEqual(a, b);

			assert.deepEqual(p.constant, 7);
			assert.deepEqual(p.terms.size, 2);
			assert.deepEqual(p.terms.get(va), 20);
			assert.deepEqual(p.terms.get(vb), 10);
		});

		it('minus', function () {
			var va = new c.Variable({ value: 10 });
			var vb = new c.Variable({ value: 20 });
			var a = new c.Expression(va, 20, 2);
			var b = new c.Expression(vb, 10, 5);

			var p = a.minus(b);
			assert.notDeepEqual(a, p);
			assert.notDeepEqual(a, b);

			assert.deepEqual(p.constant, -3);
			assert.deepEqual(p.terms.size, 2);
			assert.deepEqual(p.terms.get(va), 20);
			assert.deepEqual(p.terms.get(vb), -10);
		});

		it('divide', function () {
			var va = new c.Variable({ value: 10 });
			var vb = new c.Variable({ value: 20 });
			var a = new c.Expression(va, 20, 2);

			assert.throws(a.divide.bind(a, 0), c.NonExpression);
			// t.e(c.NonExpression, a, 'divide', [0]);

			var p = a.divide(2);
			assert.deepEqual(p.constant, 1);
			assert.deepEqual(p.terms.get(va), 10);

			assert.throws(a.divide.bind(a, new c.Expression(vb, 10, 5)), c.NonExpression);
			// t.e(c.NonExpression, a, 'divide', [new c.Expression(vb, 10, 5)]);
			var ne = new c.Expression(vb, 10, 5);
			assert.throws(ne.divide.bind(ne, a), c.NonExpression);

			p = a.divide(new c.Expression(2));
			assert.deepEqual(p.constant, 1);
			assert.deepEqual(p.terms.get(va), 10);
		});

		it('coefficientFor', function () {
			var va = new c.Variable({ value: 10 });
			var vb = new c.Variable({ value: 20 });
			var a = new c.Expression(va, 20, 2);

			assert.deepEqual(a.coefficientFor(va), 20);
			assert.deepEqual(a.coefficientFor(vb), 0);
		});

		it('setVariable', function () {
			var va = new c.Variable({ value: 10 });
			var vb = new c.Variable({ value: 20 });
			var a = new c.Expression(va, 20, 2);

			// set existing variable
			a.setVariable(va, 2);
			assert.deepEqual(a.terms.size, 1);
			assert.deepEqual(a.coefficientFor(va), 2);

			// set new variable
			a.setVariable(vb, 2);
			assert.deepEqual(a.terms.size, 2);
			assert.deepEqual(a.coefficientFor(vb), 2);
		});

		it('anyPivotableVariable', function () {

			// t.e(c.InternalError, new c.Expression(10), 'anyPivotableVariable');
			var e = new c.Expression(10);
			assert.throws(e.anyPivotableVariable.bind(e), c.InternalError);
			// t.e(c.InternalError, new c.Expression(10), 'anyPivotableVariable');

			var va = new c.Variable({ value: 10 });
			var vb = new c.SlackVariable();
			var a = new c.Expression(va, 20, 2);

			assert.deepEqual(null, a.anyPivotableVariable());

			a.setVariable(vb, 2);
			assert.deepEqual(vb, a.anyPivotableVariable());
		});

		it('substituteOut', function () {
			var v1 = new c.Variable({ value: 20 });
			var v2 = new c.Variable({ value: 2 });
			var a = new c.Expression(v1, 2, 2); // 2*v1 + 2

			// new variable
			a.substituteOut(v1, new c.Expression(v2, 4, 4));
			assert.deepEqual(a.constant, 10);
			assert.deepEqual(null, a.terms.get(v1));
			assert.deepEqual(a.terms.get(v2), 8);

			// existing variable
			a.setVariable(v1, 1);
			a.substituteOut(v2, new c.Expression(v1, 2, 2));

			assert.deepEqual(a.constant, 26);
			assert.deepEqual(null, a.terms.get(v2));
			assert.deepEqual(a.terms.get(v1), 17);
		});

		it('newSubject', function () {
			var v = new c.Variable({ value: 10 });
			var e = new c.Expression(v, 2, 5);

			assert.deepEqual(e.newSubject(v), 1 / 2);
			assert.deepEqual(e.constant, -2.5);
			assert.deepEqual(null, e.terms.get(v));
			assert.deepEqual(true, e.isConstant);
		});

		it('changeSubject', function () {
			var va = new c.Variable({ value: 10 });
			var vb = new c.Variable({ value: 5 });
			var e = new c.Expression(va, 2, 5);

			e.changeSubject(vb, va);
			assert.deepEqual(e.constant, -2.5);
			assert.deepEqual(null, e.terms.get(va));
			assert.deepEqual(e.terms.get(vb), 0.5);
		});

		it('toString', function () {
			var v = new c.Variable({ name: 'v', value: 5 });

			assert.deepEqual(c.Expression.fromConstant(10)+'', '10');
			assert.deepEqual(new c.Expression(v, 0, 10)+'', '10 + 0*5');

			var e = new c.Expression(v, 2, 10);
			assert.deepEqual(e+'', '10 + 2*5');

			e.setVariable(new c.Variable({ name: 'b', value: 2 }), 4);
			assert.deepEqual(e+'', '10 + 2*5 + 4*2');
		});

		it('equals', function () {
			var v = new c.Variable({ name: 'v', value: 5 });

			assert.isTrue(new c.Expression(10).equals(new c.Expression(10)));
			assert.isFalse(new c.Expression(10).equals(new c.Expression(1)));
			assert.isTrue(new c.Expression(v, 2, -1).equals(new c.Expression(v, 2, -1)));
			assert.isFalse(new c.Expression(v, -2, 5).equals(new c.Expression(v, 3, 6)));
		});

		it('plus', function () {
			var x = new c.Variable({ name: 'x', value: 167 });
			var y = new c.Variable({ name: 'y', value: 10 });

			assert.deepEqual(c.plus(2, 3)+'', '5');
			assert.deepEqual(c.plus(x, 2)+'', '2 + 1*167');
			assert.deepEqual(c.plus(3, x)+'', '3 + 1*167');
			assert.deepEqual(c.plus(x, y)+'', '1*167 + 1*10');
		});

		it('minus', function () {
			var x = new c.Variable({ name: 'x', value: 167 });
			var y = new c.Variable({ name: 'y', value: 10 });

			assert.deepEqual(c.minus(2, 3)+'', '-1');
			assert.deepEqual(c.minus(x, 2)+'', '-2 + 1*167');
			assert.deepEqual(c.minus(3, x)+'', '3 + -1*167');
			assert.deepEqual(c.minus(x, y)+'', '1*167 + -1*10');
		});

		it('times', function () {
			var x = new c.Variable({ name: 'x', value: 167 });
			var y = new c.Variable({ name: 'y', value: 10 });

			assert.deepEqual(c.times(2, 3)+'', '6');
			assert.deepEqual(c.times(x, 2)+'', '2*167');
			assert.deepEqual(c.times(3, x)+'', '3*167');
			assert.throws(c.times.bind(c, x, y), c.NonExpression);
		});

		it('divide', function () {
			var x = new c.Variable({ name: 'x', value: 167 });
			var y = new c.Variable({ name: 'y', value: 10 });

			assert.deepEqual(c.divide(4, 2)+'', '2');
			assert.deepEqual(c.divide(x, 2)+'', '0.5*167');
			assert.throws(c.divide.bind(c, 4, x), c.NonExpression);
			assert.throws(c.divide.bind(c, x, y), c.NonExpression);
		});
	});
});