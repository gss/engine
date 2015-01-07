/* global c */

// Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)
//
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0

define([
	'intern!bdd',
	'intern/chai!assert',
	'./deps'
], function (bdd, assert) {
	'use strict';

	var describe = bdd.describe,
		it = bdd.it;

	describe('c', function () {
		describe('_inc', function () {
			it('should increment monotnically', function () {
				var v = c._inc();
				assert.deepEqual(v + 1, c._inc());
			});
		});

		describe('own', function () {
			var p = { thinger: true };
			var C = function () {
				this.ownProp = true;
			};
			C.prototype = Object.create(p);
			var o = new C();
			var count = 0;
			c.own(o, function () { count++; });
			it('should only have the local property we just set', function () {
				assert.deepEqual(1, count);
			});
		});

		describe('extend', function () {
			var o = {};
			var ctr = 0;
			var props = {
				get foo() {
					return 'foo';
				},
				set foo(v) {
					ctr++;
				},
				key: 'value',
				method: function () {
					return 'function';
				}
			};

			it('is sane', function () {
				assert.deepEqual({}, o);
			});

			// Ugg...I hate communicating over (possibly async) code bodies like this
			it('is setup', function () {
				c.extend(o, props);
			});

			it('should correctly assign/use getters & setters', function () {
				assert.deepEqual(0, ctr);
				o.foo = 10;
				assert.deepEqual(1, ctr);
				props.foo = 10;
				assert.deepEqual(2, ctr);
			});

			it('sets property descriptors correctly', function () {
				var keyPd = Object.getOwnPropertyDescriptor(o, 'key');
				assert.deepEqual(true, keyPd.writable);
				assert.deepEqual(true, keyPd.configurable);
				assert.deepEqual(true, keyPd.enumerable);
				assert.deepEqual('string', typeof keyPd.value);
				assert.deepEqual('value', keyPd.value);
			});

			it('sets method descriptors correctly', function () {
				var methodPd = Object.getOwnPropertyDescriptor(o, 'method');
				assert.deepEqual(true, methodPd.writable);
				assert.deepEqual(true, methodPd.configurable);
				assert.deepEqual(false, methodPd.enumerable);
				// print(Object.keys(methodPd));
				assert.deepEqual('function', typeof methodPd.value);
			});

			it('sets getter/setter descriptors correctly', function () {
				var getSetPd = Object.getOwnPropertyDescriptor(o, 'foo');
				assert.deepEqual('function', typeof getSetPd.set);
				assert.deepEqual('function', typeof getSetPd.get);
				assert.deepEqual(true, getSetPd.enumerable);
				assert.deepEqual(true, getSetPd.configurable);
			});
		});

		describe('inherit', function () {
			var Classic = function () {
				this.i = c._inc();
			};
			Classic.prototype = {
				superProtoProp: true,
			};
			var props = {
				_t: 'Whatevs',
				initialize: function () {
					Classic.call(this);
				},
				extends: Classic,

				inc: function () {
					return ++this.i;
				},

				set value(value) {
					this._value = value;
				},

				get value() {
					return this._value;
				},
			};

			var C = c.inherit(props);

			it('is sane', function () {
				assert.deepEqual('function', typeof C);
			});
			it('clobbered initialize', function () {
				assert.deepEqual(undefined, props.initialize);
			});
			it('clobbered extends', function () {
				assert.deepEqual(undefined, props.extends);
			});

			var i = new C();
			var j = new C();
			var v = i.i;
			it('is constructor chaining', function () {
				assert.deepEqual(v + 1, j.i);
			});

			it('is mapping protototypes in', function () {
				assert.isTrue(i.superProtoProp);
				Classic.prototype.superProtoProp = 10;
				assert.deepEqual(10, i.superProtoProp);
			});

			it('sets up class-level methods with a sane "this"', function () {
				assert.deepEqual(v + 1, i.inc());
				assert.deepEqual(v + 2, i.inc());
			});

			it('assigns setters correctly', function () {
				i.value = 'thinger';
				assert.deepEqual('thinger', i.value);
				assert.deepEqual('thinger', i._value);
			});
		});

		describe('basicJSON', function () {
			var symbolicZeroValue = new c.SymbolicWeight(0, 0, 0).value;

			it('serializes c.SymbolicWeight instances correctly', function () {
				assert.deepEqual({ _t: 'c.SymbolicWeight', value: symbolicZeroValue },
					(new c.SymbolicWeight(0, 0, 0)).toJSON());
			});

			var solver = new c.SimplexSolver();

			var x = new c.Variable({ name: 'x', value: 10 });
			var width = new c.Variable({ name: 'width', value: 10 });
			var right = new c.Expression(x).plus(width);
			var ieq = new c.Inequality(100, c.LEQ, right);

			solver.addStay(width)
				.addConstraint(ieq);

			var ir = solver._infeasibleRows;

			it('has sane JSON.stringify() behavior for a c.HashSet', function () {
				assert.deepEqual('{"_t":"c.HashSet","data":[]}', JSON.stringify(ir));
			});

			it('handles 2-deep object/type graphs', function () {
				assert.deepEqual(
					{ _t: 'c.HashSet',
					data: [
						{ _t: 'c.Variable', name: 'width', value: 10 },
						{ _t: 'c.Variable', name: 'x', value: 90 }
					]
				},
				solver._externalRows.toJSON()
				);
			});

			// Smoke test
			it('doesn\'t blow up on rehydration', function () {
				c.parseJSON(JSON.stringify(solver._externalRows));
			});

			// FIXME(slightlyoff):
			//    need to filter out the "hashCode" property for deep equality test
			// assert.deepEqual(rehydratedER, solver._externalRows);
		});

		describe('approx', function () {
			it('is sane across integers', function () {
				assert.isTrue(c.approx(25, 25));
				assert.isFalse(c.approx(25, 26));
			});

			it('handles c.Variables', function () {
				assert.isTrue(c.approx(new c.Variable({ value: 25 }), new c.Variable({ value: 25 })));
				assert.isFalse(c.approx(new c.Variable({ value: 25 }), new c.Variable({ value: 26 })));
			});

			it('is correct for small differences', function () {
				assert.isTrue(c.approx(0, 0.000000001));
				assert.isFalse(c.approx(0, 0.00000001));
				assert.isTrue(c.approx(0.000000001, 0));
				assert.isFalse(c.approx(0.00000001, 0));
				assert.isTrue(c.approx(25, 25.000000001));
				assert.isFalse(c.approx(25, 25.000001));
			});
		});

		// TODO(slightlyoff)
		describe('assert', function () {

		});

		describe('plus', function () {

		});

		describe('minus', function () {

		});

		describe('times', function () {

		});

		describe('divide', function () {

		});
	});
});