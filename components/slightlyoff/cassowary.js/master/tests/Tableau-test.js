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

	describe('c.Tableau', function () {
		describe('ctor', function () {
			it('doesn\'t blow up', function () {
				new c.Tableau();
			});

			it('has sane properties', function () {
				var tab = new c.Tableau();
				assert.deepEqual(0, tab.columns.size);
				assert.deepEqual(0, tab.rows.size);
				assert.deepEqual(0, tab._infeasibleRows.size);
				assert.deepEqual(0, tab._externalRows.size);
				assert.deepEqual(0, tab._externalParametricVars.size);
			});
		});
	});
});