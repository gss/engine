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

	describe('c.SymbolicWeight', function () {
		describe('ctor', function () {
			describe('no args', function () {
				var w = new c.SymbolicWeight();
				it('has the right weight', function () {
					assert.deepEqual(0, w.value);
				});
			});
			describe('var args', function () {
				var w = new c.SymbolicWeight(1, 1);
				it('has the right weight', function () {
					assert.deepEqual(1001, w.value);
				});
			});
		});

		describe('toJSON', function () {
			it('generates deeply equal, sane JSON serialization objects', function () {
				var c1 = new c.SymbolicWeight(1, 1, 1);
				assert.deepEqual(c1.toJSON(), {_t: 'c.SymbolicWeight', value: 1001001});

				var c2 = new c.SymbolicWeight(2, 3, 4);
				assert.deepEqual(c2.toJSON(), {_t: 'c.SymbolicWeight', value: 2003004});
			});
		});

		describe('fromJSON', function () {
			it('rehydrates correctly', function () {
				assert.deepEqual(
					c.parseJSON('{"_t":"c.SymbolicWeight","value":1001001}'),
					(new c.SymbolicWeight(1, 1, 1).toJSON())
					);
			});
		});
	});
});