/* global c */

// Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)
//
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0

define([
	'intern!bdd',
	'intern/chai!assert',
	'../deps'
], function (bdd, assert) {
	'use strict';

	var describe = bdd.describe,
		it = bdd.it;

	// NOTE: the below change-tracking code doesn't actually work yet!
	return;

	describe('new api', function () {
		it('informs on variable changes', function () {
			var changes = [];
			c('a+b==c');
			c(function (change) {
				changes.push(change);
			});
			c('a==1');
			c('b==0');

			assert.equal(2, changes.length);
			assert.property(changes[0], 'a');
			assert.property(changes[0], 'b');
			assert.property(changes[0], 'c');

			assert.property(changes[1], 'b');
			assert.property(changes[1], 'c');
		});
	});
});