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

	describe('c.Point', function () {

		it('should be constructable', function () {
			new c.Point(4, 7);
			new c.Point(3, 5, '1');
		});

		// FIXME(slightlyoff): MOAR TESTS
	});
});