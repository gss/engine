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

	describe('c.Variable', function () {
		describe('ctor', function () {
			it('names/maps correctly', function () {
				c.Variable._map = [];
				new c.Variable({name: 'x'});
				new c.Variable({name: 'y', value: 2});
				assert.deepEqual((c.Variable._map).x + '', '0');
				assert.deepEqual((c.Variable._map).y + '', '2');
			});

			it('has the correct properties', function () {
				var x = new c.Variable({ name: 'x', value: 25 });

				assert.deepEqual(x.value, 25);
				assert.deepEqual(x + '', '25');
				assert(x.isExternal);
				assert.isFalse(x.isDummy);
				assert.isFalse(x.isPivotable);
				assert.isFalse(x.isRestricted);
			});
		});
	});

	describe('c.DummyVariable', function () {
		describe('ctor', function () {
			it('serializes', function () {
				var d = new c.DummyVariable({ name: 'foo' });
				assert.deepEqual(d + '', 'dummy');
			});
			it('has the correct properties', function () {
				var x = new c.DummyVariable({ name: 'x' });

				assert.deepEqual(x + '', 'dummy');
				assert.isFalse(x.isExternal);
				assert.isTrue(x.isDummy);
				assert.isFalse(x.isPivotable);
				assert.isTrue(x.isRestricted);
			});
		});
	});

	describe('c.ObjectiveVariable', function () {
		describe('ctor', function () {
			it('serializes', function () {
				var o = new c.ObjectiveVariable({ name: 'obj' });
				assert.deepEqual(o + '', 'obj');
			});
			it('has the correct properties', function () {
				var x = new c.ObjectiveVariable({ name: 'x' });

				assert.deepEqual(x + '', 'obj');
				assert.isFalse(x.isExternal);
				assert.isFalse(x.isDummy);
				assert.isFalse(x.isPivotable);
				assert.isFalse(x.isRestricted);
			});
		});
	});

	describe('c.SlackVariable', function () {
		it('has the correct properties', function () {
			var x = new c.SlackVariable({ name: 'x' });

			assert.deepEqual(x + '', 'slack');
			assert.isFalse(x.isExternal);
			assert.isFalse(x.isDummy);
			assert.isTrue(x.isPivotable);
			assert.isTrue(x.isRestricted);
		});
	});
});