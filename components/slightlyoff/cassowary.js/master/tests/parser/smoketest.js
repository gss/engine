/* global c */

// Copyright (C) 2013, Alex Russell <slightlyoff@chromium.org>
// Use of this source code is governed by
//    http://www.apache.org/licenses/LICENSE-2.0

define([
	'intern!bdd',
	'intern/chai!assert',
	'intern/chai!expect',
	'dojo/has!host-node?../deps'
], function (bdd, assert, expect) {
	'use strict';

	var describe = bdd.describe,
		it = bdd.it;

	describe('parser smoketests', function () {
		it('should have a meaningful c._api', function () {
			assert.isTrue(typeof c._api === 'function');
		});

		it('can parse an empty string', function () {
			c('');
		});

		it('returns a parse object', function () {
			assert.isTrue(typeof c('') === 'object');
		});
	});

	describe('with a valid expression', function () {
		var exp = null;
		var solver = null;
		it('should return a list of Constraints', function () {
			exp = c('a + b == c');
			expect(exp).to.be.an('array');
			expect(exp[0]).to.be.instanceOf(c.Constraint);
		});
		it('should contain the variables', function () {
			var terms = exp[0].expression.terms;
			var found = 0;
			terms.each(function (variable) {
				found++;
				expect(variable).to.be.instanceOf(c.Variable);
			});
			expect(found).to.equal(3);
		});
		it('should be convertable to a Constraint', function () {
			solver = new c.SimplexSolver();
			solver.addConstraint(exp[0]);
		});
		it('should have initial value of 0', function () {
			exp[0].expression.terms.each(function (variable) {
				if (variable.name === 'b') {
					expect(variable.value).to.equal(0);
				}
			});
		});
		describe('with values provided', function () {
			it('should be solvable', function () {
				var aVal = c('a == 5');
				solver.addConstraint(aVal[0]);
				var cVal = c('c == 7');
				solver.addConstraint(cVal[0]);
				exp[0].expression.terms.each(function (variable) {
					if (variable.name === 'b') {
						expect(variable.value).to.equal(2);
					}
				});
			});
		});
	});
});
