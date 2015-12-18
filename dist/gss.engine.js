(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var GSS;

GSS = require('../src/GSS');

global.GSS = GSS;

module.exports = GSS;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../src/GSS":6}],2:[function(require,module,exports){
/**
 * Parts Copyright (C) 2011-2012, Alex Russell (slightlyoff@chromium.org)
 * Parts Copyright (C) Copyright (C) 1998-2000 Greg J. Badros
 *
 * Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
 *
 * This is a compiled version of Cassowary/JS. For source versions or to
 * contribute, see the github project:
 *
 *  https://github.com/slightlyoff/cassowary-js-refactor
 *
 */

(function() {
!function(a){"use strict";try{!function(){}.bind(a)}catch(b){Object.defineProperty(Function.prototype,"bind",{value:function(a){var b=this;return function(){return b.apply(a,arguments)}},enumerable:!1,configurable:!0,writable:!0})}var c="undefined"!=typeof a.HTMLElement,d=function(a){for(var b=null;a&&a!=Object.prototype;){if(a.tagName){b=a.tagName;break}a=a.prototype}return b||"div"},e=1e-8,f={},g=function(a,b){if(a&&b){if("function"==typeof a[b])return a[b];var c=a.prototype;if(c&&"function"==typeof c[b])return c[b];if(c!==Object.prototype&&c!==Function.prototype)return"function"==typeof a.__super__?g(a.__super__,b):void 0}},h=a.c=function(){return h._api?h._api.apply(this,arguments):void 0};h.debug=!1,h.trace=!1,h.verbose=!1,h.traceAdded=!1,h.GC=!1,h.GEQ=1,h.LEQ=2,h.inherit=function(b){var e=null,g=null;b["extends"]&&(g=b["extends"],delete b["extends"]),b.initialize&&(e=b.initialize,delete b.initialize);var i=e||function(){};Object.defineProperty(i,"__super__",{value:g?g:Object,enumerable:!1,configurable:!0,writable:!1}),b._t&&(f[b._t]=i);var j=i.prototype=Object.create(g?g.prototype:Object.prototype);if(h.extend(j,b),c&&g&&g.prototype instanceof a.HTMLElement){var k=i,l=d(j),m=function(a){return a.__proto__=j,k.apply(a,arguments),j.created&&a.created(),j.decorate&&a.decorate(),a};this.extend(j,{upgrade:m}),i=function(){return m(a.document.createElement(l))},i.prototype=j,this.extend(i,{ctor:k})}return i},h.own=function(b,c,d){return Object.getOwnPropertyNames(b).forEach(c,d||a),b},h.extend=function(a,b){return h.own(b,function(c){var d=Object.getOwnPropertyDescriptor(b,c);try{"function"==typeof d.get||"function"==typeof d.set?Object.defineProperty(a,c,d):"function"==typeof d.value||"_"===c.charAt(0)?(d.writable=!0,d.configurable=!0,d.enumerable=!1,Object.defineProperty(a,c,d)):a[c]=b[c]}catch(e){}}),a},h.traceprint=function(a){h.verbose&&console.log(a)},h.fnenterprint=function(a){console.log("* "+a)},h.fnexitprint=function(a){console.log("- "+a)},h.assert=function(a,b){if(!a)throw new h.InternalError("Assertion failed: "+b)};var i=function(a){return"number"==typeof a?h.Expression.fromConstant(a):a instanceof h.Variable?h.Expression.fromVariable(a):a};h.plus=function(a,b){return a=i(a),b=i(b),a.plus(b)},h.minus=function(a,b){return a=i(a),b=i(b),a.minus(b)},h.times=function(a,b){return a=i(a),b=i(b),a.times(b)},h.divide=function(a,b){return a=i(a),b=i(b),a.divide(b)},h.approx=function(a,b){return a===b?!0:(a=+a,b=+b,0==a?Math.abs(b)<e:0==b?Math.abs(a)<e:Math.abs(a-b)<Math.abs(a)*e)};var j=1;h._inc=function(){return j++},h.parseJSON=function(a){return JSON.parse(a,function(a,b){if("object"!=typeof b||"string"!=typeof b._t)return b;var c=b._t,d=f[c];if(c&&d){var e=g(d,"fromJSON");if(e)return e(b,d)}return b})},"function"==typeof define&&define.amd?define(h):"object"==typeof module&&module.exports?module.exports=h:a.c=h}(this),function(a){"use strict";var b=function(a,b){Object.keys(a).forEach(function(c){b[c]=a[c]})},c={};a.HashTable=a.inherit({initialize:function(){this.size=0,this._store={},this._keyStrMap={},this._deleted=0},set:function(a,b){var c=a.hashCode;"undefined"==typeof this._store[c]&&this.size++,this._store[c]=b,this._keyStrMap[c]=a},get:function(a){if(!this.size)return null;a=a.hashCode;var b=this._store[a];return"undefined"!=typeof b?this._store[a]:null},clear:function(){this.size=0,this._store={},this._keyStrMap={}},_compact:function(){var a={};b(this._store,a),this._store=a},_compactThreshold:100,_perhapsCompact:function(){this._size>30||this._deleted>this._compactThreshold&&(this._compact(),this._deleted=0)},"delete":function(a){a=a.hashCode,this._store.hasOwnProperty(a)&&(this._deleted++,delete this._store[a],this.size>0&&this.size--)},each:function(a,b){if(this.size){this._perhapsCompact();var c=this._store,d=this._keyStrMap;for(var e in this._store)this._store.hasOwnProperty(e)&&a.call(b||null,d[e],c[e])}},escapingEach:function(a,b){if(this.size){this._perhapsCompact();for(var d=this,e=this._store,f=this._keyStrMap,g=c,h=Object.keys(e),i=0;i<h.length;i++)if(function(c){d._store.hasOwnProperty(c)&&(g=a.call(b||null,f[c],e[c]))}(h[i]),g){if(void 0!==g.retval)return g;if(g.brk)break}}},clone:function(){var c=new a.HashTable;return this.size&&(c.size=this.size,b(this._store,c._store),b(this._keyStrMap,c._keyStrMap)),c},equals:function(b){if(b===this)return!0;if(!(b instanceof a.HashTable)||b._size!==this._size)return!1;for(var c=Object.keys(this._store),d=0;d<c.length;d++){var e=c[d];if(this._keyStrMap[e]!==b._keyStrMap[e]||this._store[e]!==b._store[e])return!1}return!0},toString:function(){var b="";return this.each(function(a,c){b+=a+" => "+c+"\n"}),b}})}(this.c||module.parent.exports||{}),function(a){"use strict";a.HashSet=a.inherit({_t:"c.HashSet",initialize:function(){this.storage=[],this.size=0,this.hashCode=a._inc()},add:function(a){var b=this.storage;b.indexOf(a),-1==b.indexOf(a)&&(b[b.length]=a),this.size=this.storage.length},values:function(){return this.storage},has:function(a){var b=this.storage;return-1!=b.indexOf(a)},"delete":function(a){var b=this.storage.indexOf(a);return-1==b?null:(this.storage.splice(b,1)[0],this.size=this.storage.length,void 0)},clear:function(){this.storage.length=0},each:function(a,b){this.size&&this.storage.forEach(a,b)},escapingEach:function(a,b){this.size&&this.storage.forEach(a,b)},toString:function(){var a=this.size+" {",b=!0;return this.each(function(c){b?b=!1:a+=", ",a+=c}),a+="}\n"},toJSON:function(){var a=[];return this.each(function(b){a[a.length]=b.toJSON()}),{_t:"c.HashSet",data:a}},fromJSON:function(b){var c=new a.HashSet;return b.data&&(c.size=b.data.length,c.storage=b.data),c}})}(this.c||module.parent.exports||{}),function(a){"use strict";a.Error=a.inherit({initialize:function(a){a&&(this._description=a)},_name:"c.Error",_description:"An error has occured in Cassowary",set description(a){this._description=a},get description(){return"("+this._name+") "+this._description},get message(){return this.description},toString:function(){return this.description}});var b=function(b,c){return a.inherit({"extends":a.Error,initialize:function(){a.Error.apply(this,arguments)},_name:b||"",_description:c||""})};a.ConstraintNotFound=b("c.ConstraintNotFound","Tried to remove a constraint never added to the tableu"),a.InternalError=b("c.InternalError"),a.NonExpression=b("c.NonExpression","The resulting expression would be non"),a.NotEnoughStays=b("c.NotEnoughStays","There are not enough stays to give specific values to every variable"),a.RequiredFailure=b("c.RequiredFailure","A required constraint cannot be satisfied"),a.TooDifficult=b("c.TooDifficult","The constraints are too difficult to solve")}(this.c||module.parent.exports||{}),function(a){"use strict";var b=1e3;a.SymbolicWeight=a.inherit({_t:"c.SymbolicWeight",initialize:function(){this.value=0;for(var a=1,c=arguments.length-1;c>=0;--c)this.value+=arguments[c]*a,a*=b},toJSON:function(){return{_t:this._t,value:this.value}}})}(this.c||module.parent.exports||{}),function(a){a.Strength=a.inherit({initialize:function(b,c,d,e){this.name=b,this.symbolicWeight=c instanceof a.SymbolicWeight?c:new a.SymbolicWeight(c,d,e)},get required(){return this===a.Strength.required},toString:function(){return this.name+(this.required?"":":"+this.symbolicWeight)}}),a.Strength.required=new a.Strength("<Required>",1e3,1e3,1e3),a.Strength.strong=new a.Strength("strong",1,0,0),a.Strength.medium=new a.Strength("medium",0,1,0),a.Strength.weak=new a.Strength("weak",0,0,1)}(this.c||("undefined"!=typeof module?module.parent.exports.c:{})),function(a){"use strict";a.AbstractVariable=a.inherit({isDummy:!1,isExternal:!1,isPivotable:!1,isRestricted:!1,_init:function(b,c){this.hashCode=a._inc(),this.name=(c||"")+this.hashCode,b&&("undefined"!=typeof b.name&&(this.name=b.name),"undefined"!=typeof b.value&&(this.value=b.value),"undefined"!=typeof b.prefix&&(this._prefix=b.prefix))},_prefix:"",name:"",value:0,valueOf:function(){return this.value},toJSON:function(){var a={};return this._t&&(a._t=this._t),this.name&&(a.name=this.name),"undefined"!=typeof this.value&&(a.value=this.value),this._prefix&&(a._prefix=this._prefix),this._t&&(a._t=this._t),a},fromJSON:function(b,c){var d=new c;return a.extend(d,b),d},toString:function(){return this._prefix+"["+this.name+":"+this.value+"]"}}),a.Variable=a.inherit({_t:"c.Variable","extends":a.AbstractVariable,initialize:function(b){this._init(b,"v");var c=a.Variable._map;c&&(c[this.name]=this)},isExternal:!0}),a.DummyVariable=a.inherit({_t:"c.DummyVariable","extends":a.AbstractVariable,initialize:function(a){this._init(a,"d")},isDummy:!0,isRestricted:!0,value:"dummy"}),a.ObjectiveVariable=a.inherit({_t:"c.ObjectiveVariable","extends":a.AbstractVariable,initialize:function(a){this._init(a,"o")},value:"obj"}),a.SlackVariable=a.inherit({_t:"c.SlackVariable","extends":a.AbstractVariable,initialize:function(a){this._init(a,"s")},isPivotable:!0,isRestricted:!0,value:"slack"})}(this.c||module.parent.exports||{}),function(a){"use strict";a.Point=a.inherit({initialize:function(b,c,d){if(b instanceof a.Variable)this._x=b;else{var e={value:b};d&&(e.name="x"+d),this._x=new a.Variable(e)}if(c instanceof a.Variable)this._y=c;else{var f={value:c};d&&(f.name="y"+d),this._y=new a.Variable(f)}},get x(){return this._x},set x(b){b instanceof a.Variable?this._x=b:this._x.value=b},get y(){return this._y},set y(b){b instanceof a.Variable?this._y=b:this._y.value=b},toString:function(){return"("+this.x+", "+this.y+")"}})}(this.c||module.parent.exports||{}),function(a){"use strict";var b=function(a,b){return"number"==typeof a?a:b};a.Expression=a.inherit({initialize:function(c,d,e){this.constant=b(e,0),this.terms=new a.HashTable,c instanceof a.AbstractVariable?(d=b(d,1),this.setVariable(c,d)):"number"==typeof c&&(isNaN(c)?console.trace():this.constant=c)},initializeFromHash:function(b,c){return a.verbose&&(console.log("*******************************"),console.log("clone c.initializeFromHash"),console.log("*******************************")),a.GC&&console.log("clone c.Expression"),this.constant=b,this.terms=c.clone(),this},multiplyMe:function(a){this.constant*=a;var b=this.terms;return b.each(function(c,d){b.set(c,d*a)}),this},clone:function(){a.verbose&&(console.log("*******************************"),console.log("clone c.Expression"),console.log("*******************************"));var b=a.Expression.empty();return b.initializeFromHash(this.constant,this.terms),b},times:function(b){if("number"==typeof b)return this.clone().multiplyMe(b);if(this.isConstant)return b.times(this.constant);if(b.isConstant)return this.times(b.constant);throw new a.NonExpression},plus:function(b){return b instanceof a.Expression?this.clone().addExpression(b,1):b instanceof a.Variable?this.clone().addVariable(b,1):void 0},minus:function(b){return b instanceof a.Expression?this.clone().addExpression(b,-1):b instanceof a.Variable?this.clone().addVariable(b,-1):void 0},divide:function(b){if("number"==typeof b){if(a.approx(b,0))throw new a.NonExpression;return this.times(1/b)}if(b instanceof a.Expression){if(!b.isConstant)throw new a.NonExpression;return this.times(1/b.constant)}},addExpression:function(c,d,e,f){return c instanceof a.AbstractVariable&&(c=a.Expression.fromVariable(c)),d=b(d,1),this.constant+=d*c.constant,c.terms.each(function(a,b){this.addVariable(a,b*d,e,f)},this),this},addVariable:function(b,c,d,e){null==c&&(c=1);var f=this.terms.get(b);if(f){var g=f+c;0==g||a.approx(g,0)?(e&&e.noteRemovedVariable(b,d),this.terms.delete(b)):this.setVariable(b,g)}else a.approx(c,0)||(this.setVariable(b,c),e&&e.noteAddedVariable(b,d));return this},setVariable:function(a,b){return this.terms.set(a,b),this},anyPivotableVariable:function(){if(this.isConstant)throw new a.InternalError("anyPivotableVariable called on a constant");var b=this.terms.escapingEach(function(a){return a.isPivotable?{retval:a}:void 0});return b&&void 0!==b.retval?b.retval:null},substituteOut:function(b,c,d,e){this.setVariable.bind(this);var g=this.terms,h=g.get(b);g.delete(b),this.constant+=h*c.constant,c.terms.each(function(b,c){var f=g.get(b);if(f){var i=f+h*c;a.approx(i,0)?(e.noteRemovedVariable(b,d),g.delete(b)):g.set(b,i)}else g.set(b,h*c),e&&e.noteAddedVariable(b,d)})},changeSubject:function(a,b){this.setVariable(a,this.newSubject(b))},newSubject:function(a){var b=1/this.terms.get(a);return this.terms.delete(a),this.multiplyMe(-b),b},coefficientFor:function(a){return this.terms.get(a)||0},get isConstant(){return 0==this.terms.size},toString:function(){var b="",c=!1;if(!a.approx(this.constant,0)||this.isConstant){if(b+=this.constant,this.isConstant)return b;c=!0}return this.terms.each(function(a,d){c&&(b+=" + "),b+=d+"*"+a,c=!0}),b},equals:function(b){return b===this?!0:b instanceof a.Expression&&b.constant===this.constant&&b.terms.equals(this.terms)},Plus:function(a,b){return a.plus(b)},Minus:function(a,b){return a.minus(b)},Times:function(a,b){return a.times(b)},Divide:function(a,b){return a.divide(b)}}),a.Expression.empty=function(){return new a.Expression(void 0,1,0)},a.Expression.fromConstant=function(b){return new a.Expression(b)},a.Expression.fromValue=function(b){return b=+b,new a.Expression(void 0,b,0)},a.Expression.fromVariable=function(b){return new a.Expression(b,1,0)}}(this.c||module.parent.exports||{}),function(a){"use strict";a.AbstractConstraint=a.inherit({initialize:function(b,c){this.hashCode=a._inc(),this.strength=b||a.Strength.required,this.weight=c||1},isEditConstraint:!1,isInequality:!1,isStayConstraint:!1,get required(){return this.strength===a.Strength.required},toString:function(){return this.strength+" {"+this.weight+"} ("+this.expression+")"}});var b=a.AbstractConstraint.prototype.toString,c=function(b,c,d){a.AbstractConstraint.call(this,c||a.Strength.strong,d),this.variable=b,this.expression=new a.Expression(b,-1,b.value)};a.EditConstraint=a.inherit({"extends":a.AbstractConstraint,initialize:function(){c.apply(this,arguments)},isEditConstraint:!0,toString:function(){return"edit:"+b.call(this)}}),a.StayConstraint=a.inherit({"extends":a.AbstractConstraint,initialize:function(){c.apply(this,arguments)},isStayConstraint:!0,toString:function(){return"stay:"+b.call(this)}});var d=a.Constraint=a.inherit({"extends":a.AbstractConstraint,initialize:function(b,c,d){a.AbstractConstraint.call(this,c,d),this.expression=b}});a.Inequality=a.inherit({"extends":a.Constraint,_cloneOrNewCle:function(b){return b.clone?b.clone():new a.Expression(b)},initialize:function(b,c,e,f,g){var h=b instanceof a.Expression,i=e instanceof a.Expression,j=b instanceof a.AbstractVariable,k=e instanceof a.AbstractVariable,l="number"==typeof b,m="number"==typeof e;if((h||l)&&k){var n=b,o=c,p=e,q=f,r=g;if(d.call(this,this._cloneOrNewCle(n),q,r),o==a.LEQ)this.expression.multiplyMe(-1),this.expression.addVariable(p);else{if(o!=a.GEQ)throw new a.InternalError("Invalid operator in c.Inequality constructor");this.expression.addVariable(p,-1)}}else if(j&&(i||m)){var n=e,o=c,p=b,q=f,r=g;if(d.call(this,this._cloneOrNewCle(n),q,r),o==a.GEQ)this.expression.multiplyMe(-1),this.expression.addVariable(p);else{if(o!=a.LEQ)throw new a.InternalError("Invalid operator in c.Inequality constructor");this.expression.addVariable(p,-1)}}else{if(h&&m){var s=b,o=c,t=e,q=f,r=g;if(d.call(this,this._cloneOrNewCle(s),q,r),o==a.LEQ)this.expression.multiplyMe(-1),this.expression.addExpression(this._cloneOrNewCle(t));else{if(o!=a.GEQ)throw new a.InternalError("Invalid operator in c.Inequality constructor");this.expression.addExpression(this._cloneOrNewCle(t),-1)}return this}if(l&&i){var s=e,o=c,t=b,q=f,r=g;if(d.call(this,this._cloneOrNewCle(s),q,r),o==a.GEQ)this.expression.multiplyMe(-1),this.expression.addExpression(this._cloneOrNewCle(t));else{if(o!=a.LEQ)throw new a.InternalError("Invalid operator in c.Inequality constructor");this.expression.addExpression(this._cloneOrNewCle(t),-1)}return this}if(h&&i){var s=b,o=c,t=e,q=f,r=g;if(d.call(this,this._cloneOrNewCle(t),q,r),o==a.GEQ)this.expression.multiplyMe(-1),this.expression.addExpression(this._cloneOrNewCle(s));else{if(o!=a.LEQ)throw new a.InternalError("Invalid operator in c.Inequality constructor");this.expression.addExpression(this._cloneOrNewCle(s),-1)}}else{if(h)return d.call(this,b,c,e);if(c==a.GEQ)d.call(this,new a.Expression(e),f,g),this.expression.multiplyMe(-1),this.expression.addVariable(b);else{if(c!=a.LEQ)throw new a.InternalError("Invalid operator in c.Inequality constructor");d.call(this,new a.Expression(e),f,g),this.expression.addVariable(b,-1)}}}},isInequality:!0,toString:function(){return d.prototype.toString.call(this)+" >= 0) id: "+this.hashCode}}),a.Equation=a.inherit({"extends":a.Constraint,initialize:function(b,c,e,f){if(b instanceof a.Expression&&!c||c instanceof a.Strength)d.call(this,b,c,e);else if(b instanceof a.AbstractVariable&&c instanceof a.Expression){var g=b,h=c,i=e,j=f;d.call(this,h.clone(),i,j),this.expression.addVariable(g,-1)}else if(b instanceof a.AbstractVariable&&"number"==typeof c){var g=b,k=c,i=e,j=f;d.call(this,new a.Expression(k),i,j),this.expression.addVariable(g,-1)}else if(b instanceof a.Expression&&c instanceof a.AbstractVariable){var h=b,g=c,i=e,j=f;d.call(this,h.clone(),i,j),this.expression.addVariable(g,-1)}else{if(!(b instanceof a.Expression||b instanceof a.AbstractVariable||"number"==typeof b)||!(c instanceof a.Expression||c instanceof a.AbstractVariable||"number"==typeof c))throw"Bad initializer to c.Equation";b=b instanceof a.Expression?b.clone():new a.Expression(b),c=c instanceof a.Expression?c.clone():new a.Expression(c),d.call(this,b,e,f),this.expression.addExpression(c,-1)}a.assert(this.strength instanceof a.Strength,"_strength not set")},toString:function(){return d.prototype.toString.call(this)+" = 0)"}})}(this.c||module.parent.exports||{}),function(a){"use strict";a.EditInfo=a.inherit({initialize:function(a,b,c,d,e){this.constraint=a,this.editPlus=b,this.editMinus=c,this.prevEditConstant=d,this.index=e},toString:function(){return"<cn="+this.constraint+", ep="+this.editPlus+", em="+this.editMinus+", pec="+this.prevEditConstant+", index="+this.index+">"}})}(this.c||module.parent.exports||{}),function(a){"use strict";a.Tableau=a.inherit({initialize:function(){this.columns=new a.HashTable,this.rows=new a.HashTable,this._infeasibleRows=new a.HashSet,this._externalRows=new a.HashSet,this._externalParametricVars=new a.HashSet},noteRemovedVariable:function(b,c){a.trace&&console.log("c.Tableau::noteRemovedVariable: ",b,c);var d=this.columns.get(b);c&&d&&d.delete(c)},noteAddedVariable:function(a,b){b&&this.insertColVar(a,b)},getInternalInfo:function(){return"Tableau Information:\nRows: "+this.rows.size+" (= "+(this.rows.size-1)+" constraints)"+"\nColumns: "+this.columns.size+"\nInfeasible Rows: "+this._infeasibleRows.size+"\nExternal basic variables: "+this._externalRows.size+"\nExternal parametric variables: "+this._externalParametricVars.size+"\n"},toString:function(){var a="Tableau:\n";return this.rows.each(function(b,c){a+=b+" <==> "+c+"\n"}),a+="\nColumns:\n",a+=this.columns,a+="\nInfeasible rows: ",a+=this._infeasibleRows,a+="External basic variables: ",a+=this._externalRows,a+="External parametric variables: ",a+=this._externalParametricVars},insertColVar:function(b,c){var d=this.columns.get(b);d||(d=new a.HashSet,this.columns.set(b,d)),d.add(c)},addRow:function(b,c){a.trace&&a.fnenterprint("addRow: "+b+", "+c),this.rows.set(b,c),c.terms.each(function(a){this.insertColVar(a,b),a.isExternal&&this._externalParametricVars.add(a)},this),b.isExternal&&this._externalRows.add(b),a.trace&&a.traceprint(this.toString())},removeColumn:function(b){a.trace&&a.fnenterprint("removeColumn:"+b);var c=this.columns.get(b);c?(this.columns.delete(b),c.each(function(a){var c=this.rows.get(a);c.terms.delete(b)},this)):a.trace&&console.log("Could not find var",b,"in columns"),b.isExternal&&(this._externalRows.delete(b),this._externalParametricVars.delete(b))},removeRow:function(b){a.trace&&a.fnenterprint("removeRow:"+b);var c=this.rows.get(b);return a.assert(null!=c),c.terms.each(function(c){var e=this.columns.get(c);null!=e&&(a.trace&&console.log("removing from varset:",b),e.delete(b))},this),this._infeasibleRows.delete(b),b.isExternal&&this._externalRows.delete(b),this.rows.delete(b),a.trace&&a.fnexitprint("returning "+c),c},substituteOut:function(b,c){a.trace&&a.fnenterprint("substituteOut:"+b+", "+c),a.trace&&a.traceprint(this.toString());var d=this.columns.get(b);d.each(function(a){var d=this.rows.get(a);d.substituteOut(b,c,a,this),a.isRestricted&&d.constant<0&&this._infeasibleRows.add(a)},this),b.isExternal&&(this._externalRows.add(b),this._externalParametricVars.delete(b)),this.columns.delete(b)},columnsHasKey:function(a){return!!this.columns.get(a)}})}(this.c||module.parent.exports||{}),function(a){var b=a.Tableau,c=b.prototype,d=1e-8,e=a.Strength.weak,f={eplus:null,eminus:null,prevEConstant:null};a.SimplexSolver=a.inherit({"extends":a.Tableau,initialize:function(){a.Tableau.call(this),this._stayMinusErrorVars=[],this._stayPlusErrorVars=[],this._errorVars=new a.HashTable,this._markerVars=new a.HashTable,this._objective=new a.ObjectiveVariable({name:"Z"}),this._editVarMap=new a.HashTable,this._editVarList=[],this._slackCounter=0,this._artificialCounter=0,this._dummyCounter=0,this.autoSolve=!0,this._needsSolving=!1,this._optimizeCount=0,this.rows.set(this._objective,a.Expression.empty()),this._editVariableStack=[0],a.trace&&a.traceprint("objective expr == "+this.rows.get(this._objective))},add:function(){for(var a=0;a<arguments.length;a++)this.addConstraint(arguments[a]);return this},_addEditConstraint:function(b,c,d,e){var f=this._editVarMap.size,g=new a.EditInfo(b,c,d,e,f);this._editVarMap.set(b.variable,g),this._editVarList[f]={v:b.variable,info:g}},addConstraint:function(b){a.trace&&a.fnenterprint("addConstraint: "+b);var c=f,d=this.newExpression(b);return this.tryAddingDirectly(d)||this.addWithArtificialVariable(d),this._needsSolving=!0,b.isEditConstraint&&this._addEditConstraint(b,c.eplus,c.eminus,c.prevEConstant),this.autoSolve&&(this.optimize(this._objective),this._setExternalVariables()),this},addConstraintNoException:function(b){a.trace&&a.fnenterprint("addConstraintNoException: "+b);try{return this.addConstraint(b),!0}catch(c){return!1}},addEditVar:function(b,c,d){return a.trace&&a.fnenterprint("addEditVar: "+b+" @ "+c+" {"+d+"}"),this.addConstraint(new a.EditConstraint(b,c||a.Strength.strong,d))},beginEdit:function(){return a.assert(this._editVarMap.size>0,"_editVarMap.size > 0"),this._infeasibleRows.clear(),this._resetStayConstants(),this._editVariableStack[this._editVariableStack.length]=this._editVarMap.size,this},endEdit:function(){return a.assert(this._editVarMap.size>0,"_editVarMap.size > 0"),this.resolve(),this._editVariableStack.pop(),this.removeEditVarsTo(this._editVariableStack[this._editVariableStack.length-1]),this},removeAllEditVars:function(){return this.removeEditVarsTo(0)},removeEditVarsTo:function(b){try{for(var c=this._editVarList.length,d=b;c>d;d++)this._editVarList[d]&&this.removeConstraint(this._editVarMap.get(this._editVarList[d].v).constraint);return this._editVarList.length=b,a.assert(this._editVarMap.size==b,"_editVarMap.size == n"),this}catch(e){throw new a.InternalError("Constraint not found in removeEditVarsTo")}},addPointStays:function(b){return a.trace&&console.log("addPointStays",b),b.forEach(function(a,b){this.addStay(a.x,e,Math.pow(2,b)),this.addStay(a.y,e,Math.pow(2,b))},this),this},addStay:function(b,c,d){var f=new a.StayConstraint(b,c||e,d||1);return this.addConstraint(f)},removeConstraint:function(b){a.trace&&a.fnenterprint("removeConstraintInternal: "+b),a.trace&&a.traceprint(this.toString()),this._needsSolving=!0,this._resetStayConstants();var c=this.rows.get(this._objective),d=this._errorVars.get(b);a.trace&&a.traceprint("eVars == "+d),null!=d&&d.each(function(e){var f=this.rows.get(e);null==f?c.addVariable(e,-b.weight*b.strength.symbolicWeight.value,this._objective,this):c.addExpression(f,-b.weight*b.strength.symbolicWeight.value,this._objective,this),a.trace&&a.traceprint("now eVars == "+d)},this);var e=this._markerVars.get(b);if(this._markerVars.delete(b),null==e)throw new a.InternalError("Constraint not found in removeConstraintInternal");if(a.trace&&a.traceprint("Looking to remove var "+e),null==this.rows.get(e)){var f=this.columns.get(e);a.trace&&a.traceprint("Must pivot -- columns are "+f);var g=null,h=0;f.each(function(b){if(b.isRestricted){var c=this.rows.get(b),d=c.coefficientFor(e);if(a.trace&&a.traceprint("Marker "+e+"'s coefficient in "+c+" is "+d),0>d){var f=-c.constant/d;(null==g||h>f||a.approx(f,h)&&b.hashCode<g.hashCode)&&(h=f,g=b)}}},this),null==g&&(a.trace&&a.traceprint("exitVar is still null"),f.each(function(a){if(a.isRestricted){var b=this.rows.get(a),c=b.coefficientFor(e),d=b.constant/c;(null==g||h>d)&&(h=d,g=a)}},this)),null==g&&(0==f.size?this.removeColumn(e):f.escapingEach(function(a){return a!=this._objective?(g=a,{brk:!0}):void 0},this)),null!=g&&this.pivot(e,g)}if(null!=this.rows.get(e)&&this.removeRow(e),null!=d&&d.each(function(a){a!=e&&this.removeColumn(a)},this),b.isStayConstraint){if(null!=d)for(var j=0;j<this._stayPlusErrorVars.length;j++)d.delete(this._stayPlusErrorVars[j]),d.delete(this._stayMinusErrorVars[j])}else if(b.isEditConstraint){var k=this._editVarMap.get(b.variable);this.removeColumn(k.editMinus),this._editVarMap.delete(b.variable)}return null!=d&&this._errorVars.delete(d),this.autoSolve&&(this.optimize(this._objective),this._setExternalVariables()),this},reset:function(){throw a.trace&&a.fnenterprint("reset"),new a.InternalError("reset not implemented")},resolveArray:function(b){a.trace&&a.fnenterprint("resolveArray"+b);var c=b.length;this._editVarMap.each(function(a,d){var e=d.index;c>e&&this.suggestValue(a,b[e])},this),this.resolve()},resolvePair:function(a,b){this.suggestValue(this._editVarList[0].v,a),this.suggestValue(this._editVarList[1].v,b),this.resolve()},resolve:function(){a.trace&&a.fnenterprint("resolve()"),this.dualOptimize(),this._setExternalVariables(),this._infeasibleRows.clear(),this._resetStayConstants()},suggestValue:function(b,c){a.trace&&console.log("suggestValue("+b+", "+c+")");var d=this._editVarMap.get(b);if(!d)throw new a.Error("suggestValue for variable "+b+", but var is not an edit variable");var e=c-d.prevEditConstant;return d.prevEditConstant=c,this.deltaEditConstant(e,d.editPlus,d.editMinus),this},solve:function(){return this._needsSolving&&(this.optimize(this._objective),this._setExternalVariables()),this},setEditedValue:function(b,c){if(!this.columnsHasKey(b)&&null==this.rows.get(b))return b.value=c,this;if(!a.approx(c,b.value)){this.addEditVar(b),this.beginEdit();try{this.suggestValue(b,c)}catch(d){throw new a.InternalError("Error in setEditedValue")}this.endEdit()}return this},addVar:function(b){if(!this.columnsHasKey(b)&&null==this.rows.get(b)){try{this.addStay(b)}catch(c){throw new a.InternalError("Error in addVar -- required failure is impossible")}a.trace&&a.traceprint("added initial stay on "+b)}return this},getInternalInfo:function(){var a=c.getInternalInfo.call(this);return a+="\nSolver info:\n",a+="Stay Error Variables: ",a+=this._stayPlusErrorVars.length+this._stayMinusErrorVars.length,a+=" ("+this._stayPlusErrorVars.length+" +, ",a+=this._stayMinusErrorVars.length+" -)\n",a+="Edit Variables: "+this._editVarMap.size,a+="\n"},getDebugInfo:function(){return this.toString()+this.getInternalInfo()+"\n"},toString:function(){var a=c.getInternalInfo.call(this);return a+="\n_stayPlusErrorVars: ",a+="["+this._stayPlusErrorVars+"]",a+="\n_stayMinusErrorVars: ",a+="["+this._stayMinusErrorVars+"]",a+="\n",a+="_editVarMap:\n"+this._editVarMap,a+="\n"},addWithArtificialVariable:function(b){a.trace&&a.fnenterprint("addWithArtificialVariable: "+b);var c=new a.SlackVariable({value:++this._artificialCounter,prefix:"a"}),d=new a.ObjectiveVariable({name:"az"}),e=b.clone();a.trace&&a.traceprint("before addRows:\n"+this),this.addRow(d,e),this.addRow(c,b),a.trace&&a.traceprint("after addRows:\n"+this),this.optimize(d);var f=this.rows.get(d);if(a.trace&&a.traceprint("azTableauRow.constant == "+f.constant),!a.approx(f.constant,0))throw this.removeRow(d),this.removeColumn(c),new a.RequiredFailure;var g=this.rows.get(c);if(null!=g){if(g.isConstant)return this.removeRow(c),this.removeRow(d),void 0;var h=g.anyPivotableVariable();this.pivot(h,c)}a.assert(null==this.rows.get(c),"rowExpression(av) == null"),this.removeColumn(c),this.removeRow(d)},tryAddingDirectly:function(b){a.trace&&a.fnenterprint("tryAddingDirectly: "+b);var c=this.chooseSubject(b);return null==c?(a.trace&&a.fnexitprint("returning false"),!1):(b.newSubject(c),this.columnsHasKey(c)&&this.substituteOut(c,b),this.addRow(c,b),a.trace&&a.fnexitprint("returning true"),!0)},chooseSubject:function(b){a.trace&&a.fnenterprint("chooseSubject: "+b);var c=null,d=!1,e=!1,f=b.terms,g=f.escapingEach(function(a,b){if(d){if(!a.isRestricted&&!this.columnsHasKey(a))return{retval:a}}else if(a.isRestricted){if(!e&&!a.isDummy&&0>b){var f=this.columns.get(a);(null==f||1==f.size&&this.columnsHasKey(this._objective))&&(c=a,e=!0)}}else c=a,d=!0},this);if(g&&void 0!==g.retval)return g.retval;if(null!=c)return c;var h=0,g=f.escapingEach(function(a,b){return a.isDummy?(this.columnsHasKey(a)||(c=a,h=b),void 0):{retval:null}},this);if(g&&void 0!==g.retval)return g.retval;if(!a.approx(b.constant,0))throw new a.RequiredFailure;return h>0&&b.multiplyMe(-1),c},deltaEditConstant:function(b,c,d){a.trace&&a.fnenterprint("deltaEditConstant :"+b+", "+c+", "+d);var e=this.rows.get(c);if(null!=e)return e.constant+=b,e.constant<0&&this._infeasibleRows.add(c),void 0;var f=this.rows.get(d);if(null!=f)return f.constant+=-b,f.constant<0&&this._infeasibleRows.add(d),void 0;var g=this.columns.get(d);g||console.log("columnVars is null -- tableau is:\n"+this),g.each(function(a){var c=this.rows.get(a),e=c.coefficientFor(d);c.constant+=e*b,a.isRestricted&&c.constant<0&&this._infeasibleRows.add(a)},this)},dualOptimize:function(){a.trace&&a.fnenterprint("dualOptimize:");for(var b=this.rows.get(this._objective);this._infeasibleRows.size;){var c=this._infeasibleRows.values()[0];this._infeasibleRows.delete(c);var d=null,e=this.rows.get(c);if(e&&e.constant<0){var g,f=Number.MAX_VALUE,h=e.terms;if(h.each(function(c,e){if(e>0&&c.isPivotable){var h=b.coefficientFor(c);g=h/e,(f>g||a.approx(g,f)&&c.hashCode<d.hashCode)&&(d=c,f=g)}}),f==Number.MAX_VALUE)throw new a.InternalError("ratio == nil (MAX_VALUE) in dualOptimize");this.pivot(d,c)}}},newExpression:function(b){a.trace&&(a.fnenterprint("newExpression: "+b),a.traceprint("cn.isInequality == "+b.isInequality),a.traceprint("cn.required == "+b.required));var c=f;c.eplus=null,c.eminus=null,c.prevEConstant=null;var d=b.expression,e=a.Expression.fromConstant(d.constant),g=new a.SlackVariable,h=new a.DummyVariable,i=new a.SlackVariable,j=new a.SlackVariable,k=d.terms;if(k.each(function(a,b){var c=this.rows.get(a);c?e.addExpression(c,b):e.addVariable(a,b)},this),b.isInequality){if(a.trace&&a.traceprint("Inequality, adding slack"),++this._slackCounter,g=new a.SlackVariable({value:this._slackCounter,prefix:"s"}),e.setVariable(g,-1),this._markerVars.set(b,g),!b.required){++this._slackCounter,i=new a.SlackVariable({value:this._slackCounter,prefix:"em"}),e.setVariable(i,1);var l=this.rows.get(this._objective);l.setVariable(i,b.strength.symbolicWeight.value*b.weight),this.insertErrorVar(b,i),this.noteAddedVariable(i,this._objective)}}else if(b.required)a.trace&&a.traceprint("Equality, required"),++this._dummyCounter,h=new a.DummyVariable({value:this._dummyCounter,prefix:"d"}),c.eplus=h,c.eminus=h,c.prevEConstant=d.constant,e.setVariable(h,1),this._markerVars.set(b,h),a.trace&&a.traceprint("Adding dummyVar == d"+this._dummyCounter);else{a.trace&&a.traceprint("Equality, not required"),++this._slackCounter,j=new a.SlackVariable({value:this._slackCounter,prefix:"ep"}),i=new a.SlackVariable({value:this._slackCounter,prefix:"em"}),e.setVariable(j,-1),e.setVariable(i,1),this._markerVars.set(b,j);
var l=this.rows.get(this._objective);a.trace&&console.log(l);var m=b.strength.symbolicWeight.value*b.weight;0==m&&(a.trace&&a.traceprint("cn == "+b),a.trace&&a.traceprint("adding "+j+" and "+i+" with swCoeff == "+m)),l.setVariable(j,m),this.noteAddedVariable(j,this._objective),l.setVariable(i,m),this.noteAddedVariable(i,this._objective),this.insertErrorVar(b,i),this.insertErrorVar(b,j),b.isStayConstraint?(this._stayPlusErrorVars[this._stayPlusErrorVars.length]=j,this._stayMinusErrorVars[this._stayMinusErrorVars.length]=i):b.isEditConstraint&&(c.eplus=j,c.eminus=i,c.prevEConstant=d.constant)}return e.constant<0&&e.multiplyMe(-1),a.trace&&a.fnexitprint("returning "+e),e},optimize:function(b){a.trace&&a.fnenterprint("optimize: "+b),a.trace&&a.traceprint(this.toString()),this._optimizeCount++;var c=this.rows.get(b);a.assert(null!=c,"zRow != null");for(var g,h,e=null,f=null;;){if(g=0,h=c.terms,h.escapingEach(function(a,b){return a.isPivotable&&g>b?(g=b,e=a,{brk:1}):void 0},this),g>=-d)return;a.trace&&console.log("entryVar:",e,"objectiveCoeff:",g);var i=Number.MAX_VALUE,j=this.columns.get(e),k=0;if(j.each(function(b){if(a.trace&&a.traceprint("Checking "+b),b.isPivotable){var c=this.rows.get(b),d=c.coefficientFor(e);a.trace&&a.traceprint("pivotable, coeff = "+d),0>d&&(k=-c.constant/d,(i>k||a.approx(k,i)&&b.hashCode<f.hashCode)&&(i=k,f=b))}},this),i==Number.MAX_VALUE)throw new a.InternalError("Objective function is unbounded in optimize");this.pivot(e,f),a.trace&&a.traceprint(this.toString())}},pivot:function(b,c){a.trace&&console.log("pivot: ",b,c);var d=!1;d&&console.time(" SimplexSolver::pivot"),null==b&&console.warn("pivot: entryVar == null"),null==c&&console.warn("pivot: exitVar == null"),d&&console.time("  removeRow");var e=this.removeRow(c);d&&console.timeEnd("  removeRow"),d&&console.time("  changeSubject"),e.changeSubject(c,b),d&&console.timeEnd("  changeSubject"),d&&console.time("  substituteOut"),this.substituteOut(b,e),d&&console.timeEnd("  substituteOut"),d&&console.time("  addRow"),this.addRow(b,e),d&&console.timeEnd("  addRow"),d&&console.timeEnd(" SimplexSolver::pivot")},_resetStayConstants:function(){a.trace&&console.log("_resetStayConstants");for(var b=this._stayPlusErrorVars,c=b.length,d=0;c>d;d++){var e=this.rows.get(b[d]);null===e&&(e=this.rows.get(this._stayMinusErrorVars[d])),null!=e&&(e.constant=0)}},_setExternalVariables:function(){a.trace&&a.fnenterprint("_setExternalVariables:"),a.trace&&a.traceprint(this.toString());var b={};this._externalParametricVars.each(function(c){null!=this.rows.get(c)?a.trace&&console.log("Error: variable"+c+" in _externalParametricVars is basic"):(c.value=0,b[c.name]=0)},this),this._externalRows.each(function(a){var c=this.rows.get(a);a.value!=c.constant&&(a.value=c.constant,b[a.name]=c.constant)},this),this._changed=b,this._needsSolving=!1,this._informCallbacks(),this.onsolved()},onsolved:function(){},_informCallbacks:function(){if(this._callbacks){var a=this._changed;this._callbacks.forEach(function(b){b(a)})}},_addCallback:function(a){var b=this._callbacks||(this._callbacks=[]);b[b.length]=a},insertErrorVar:function(b,c){a.trace&&a.fnenterprint("insertErrorVar:"+b+", "+c);var d=this._errorVars.get(b);d||(d=new a.HashSet,this._errorVars.set(b,d)),d.add(c)}})}(this.c||module.parent.exports||{}),function(a){"use strict";a.Timer=a.inherit({initialize:function(){this.isRunning=!1,this._elapsedMs=0},start:function(){return this.isRunning=!0,this._startReading=new Date,this},stop:function(){return this.isRunning=!1,this._elapsedMs+=new Date-this._startReading,this},reset:function(){return this.isRunning=!1,this._elapsedMs=0,this},elapsedTime:function(){return this.isRunning?(this._elapsedMs+(new Date-this._startReading))/1e3:this._elapsedMs/1e3}})}(this.c||module.parent.exports||{}),this.c.parser=function(){function a(a){return'"'+a.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\x08/g,"\\b").replace(/\t/g,"\\t").replace(/\n/g,"\\n").replace(/\f/g,"\\f").replace(/\r/g,"\\r").replace(/[\x00-\x07\x0B\x0E-\x1F\x80-\uFFFF]/g,escape)+'"'}var b={parse:function(b,c){function k(a){g>e||(e>g&&(g=e,h=[]),h.push(a))}function l(){var a,b,c,d,f;if(d=e,f=e,a=A(),null!==a){for(b=[],c=m();null!==c;)b.push(c),c=m();null!==b?(c=A(),null!==c?a=[a,b,c]:(a=null,e=f)):(a=null,e=f)}else a=null,e=f;return null!==a&&(a=function(a,b){return b}(d,a[1])),null===a&&(e=d),a}function m(){var a,b,c,d;return c=e,d=e,a=Q(),null!==a?(b=t(),null!==b?a=[a,b]:(a=null,e=d)):(a=null,e=d),null!==a&&(a=function(a,b){return b}(c,a[0])),null===a&&(e=c),a}function n(){var a;return b.length>e?(a=b.charAt(e),e++):(a=null,0===f&&k("any character")),a}function o(){var a;return/^[a-zA-Z]/.test(b.charAt(e))?(a=b.charAt(e),e++):(a=null,0===f&&k("[a-zA-Z]")),null===a&&(36===b.charCodeAt(e)?(a="$",e++):(a=null,0===f&&k('"$"')),null===a&&(95===b.charCodeAt(e)?(a="_",e++):(a=null,0===f&&k('"_"')))),a}function p(){var a;return a=o(),null===a&&(/^[0-9]/.test(b.charAt(e))?(a=b.charAt(e),e++):(a=null,0===f&&k("[0-9]"))),a}function q(){var a;return f++,/^[\t\x0B\f \xA0\uFEFF]/.test(b.charAt(e))?(a=b.charAt(e),e++):(a=null,0===f&&k("[\\t\\x0B\\f \\xA0\\uFEFF]")),f--,0===f&&null===a&&k("whitespace"),a}function r(){var a;return/^[\n\r\u2028\u2029]/.test(b.charAt(e))?(a=b.charAt(e),e++):(a=null,0===f&&k("[\\n\\r\\u2028\\u2029]")),a}function s(){var a;return f++,10===b.charCodeAt(e)?(a="\n",e++):(a=null,0===f&&k('"\\n"')),null===a&&("\r\n"===b.substr(e,2)?(a="\r\n",e+=2):(a=null,0===f&&k('"\\r\\n"')),null===a&&(13===b.charCodeAt(e)?(a="\r",e++):(a=null,0===f&&k('"\\r"')),null===a&&(8232===b.charCodeAt(e)?(a="\u2028",e++):(a=null,0===f&&k('"\\u2028"')),null===a&&(8233===b.charCodeAt(e)?(a="\u2029",e++):(a=null,0===f&&k('"\\u2029"')))))),f--,0===f&&null===a&&k("end of line"),a}function t(){var a,c,d;return d=e,a=A(),null!==a?(59===b.charCodeAt(e)?(c=";",e++):(c=null,0===f&&k('";"')),null!==c?a=[a,c]:(a=null,e=d)):(a=null,e=d),null===a&&(d=e,a=z(),null!==a?(c=s(),null!==c?a=[a,c]:(a=null,e=d)):(a=null,e=d),null===a&&(d=e,a=A(),null!==a?(c=u(),null!==c?a=[a,c]:(a=null,e=d)):(a=null,e=d))),a}function u(){var a,c;return c=e,f++,b.length>e?(a=b.charAt(e),e++):(a=null,0===f&&k("any character")),f--,null===a?a="":(a=null,e=c),a}function v(){var a;return f++,a=w(),null===a&&(a=y()),f--,0===f&&null===a&&k("comment"),a}function w(){var a,c,d,g,h,i,j;if(h=e,"/*"===b.substr(e,2)?(a="/*",e+=2):(a=null,0===f&&k('"/*"')),null!==a){for(c=[],i=e,j=e,f++,"*/"===b.substr(e,2)?(d="*/",e+=2):(d=null,0===f&&k('"*/"')),f--,null===d?d="":(d=null,e=j),null!==d?(g=n(),null!==g?d=[d,g]:(d=null,e=i)):(d=null,e=i);null!==d;)c.push(d),i=e,j=e,f++,"*/"===b.substr(e,2)?(d="*/",e+=2):(d=null,0===f&&k('"*/"')),f--,null===d?d="":(d=null,e=j),null!==d?(g=n(),null!==g?d=[d,g]:(d=null,e=i)):(d=null,e=i);null!==c?("*/"===b.substr(e,2)?(d="*/",e+=2):(d=null,0===f&&k('"*/"')),null!==d?a=[a,c,d]:(a=null,e=h)):(a=null,e=h)}else a=null,e=h;return a}function x(){var a,c,d,g,h,i,j;if(h=e,"/*"===b.substr(e,2)?(a="/*",e+=2):(a=null,0===f&&k('"/*"')),null!==a){for(c=[],i=e,j=e,f++,"*/"===b.substr(e,2)?(d="*/",e+=2):(d=null,0===f&&k('"*/"')),null===d&&(d=r()),f--,null===d?d="":(d=null,e=j),null!==d?(g=n(),null!==g?d=[d,g]:(d=null,e=i)):(d=null,e=i);null!==d;)c.push(d),i=e,j=e,f++,"*/"===b.substr(e,2)?(d="*/",e+=2):(d=null,0===f&&k('"*/"')),null===d&&(d=r()),f--,null===d?d="":(d=null,e=j),null!==d?(g=n(),null!==g?d=[d,g]:(d=null,e=i)):(d=null,e=i);null!==c?("*/"===b.substr(e,2)?(d="*/",e+=2):(d=null,0===f&&k('"*/"')),null!==d?a=[a,c,d]:(a=null,e=h)):(a=null,e=h)}else a=null,e=h;return a}function y(){var a,c,d,g,h,i,j;if(h=e,"//"===b.substr(e,2)?(a="//",e+=2):(a=null,0===f&&k('"//"')),null!==a){for(c=[],i=e,j=e,f++,d=r(),f--,null===d?d="":(d=null,e=j),null!==d?(g=n(),null!==g?d=[d,g]:(d=null,e=i)):(d=null,e=i);null!==d;)c.push(d),i=e,j=e,f++,d=r(),f--,null===d?d="":(d=null,e=j),null!==d?(g=n(),null!==g?d=[d,g]:(d=null,e=i)):(d=null,e=i);null!==c?(d=r(),null===d&&(d=u()),null!==d?a=[a,c,d]:(a=null,e=h)):(a=null,e=h)}else a=null,e=h;return a}function z(){var a,b;for(a=[],b=q(),null===b&&(b=x(),null===b&&(b=y()));null!==b;)a.push(b),b=q(),null===b&&(b=x(),null===b&&(b=y()));return a}function A(){var a,b;for(a=[],b=q(),null===b&&(b=s(),null===b&&(b=v()));null!==b;)a.push(b),b=q(),null===b&&(b=s(),null===b&&(b=v()));return a}function B(){var a,b;return b=e,a=D(),null===a&&(a=C()),null!==a&&(a=function(a,b){return{type:"NumericLiteral",value:b}}(b,a)),null===a&&(e=b),a}function C(){var a,c,d;if(d=e,/^[0-9]/.test(b.charAt(e))?(c=b.charAt(e),e++):(c=null,0===f&&k("[0-9]")),null!==c)for(a=[];null!==c;)a.push(c),/^[0-9]/.test(b.charAt(e))?(c=b.charAt(e),e++):(c=null,0===f&&k("[0-9]"));else a=null;return null!==a&&(a=function(a,b){return parseInt(b.join(""))}(d,a)),null===a&&(e=d),a}function D(){var a,c,d,g,h;return g=e,h=e,a=C(),null!==a?(46===b.charCodeAt(e)?(c=".",e++):(c=null,0===f&&k('"."')),null!==c?(d=C(),null!==d?a=[a,c,d]:(a=null,e=h)):(a=null,e=h)):(a=null,e=h),null!==a&&(a=function(a,b){return parseFloat(b.join(""))}(g,a)),null===a&&(e=g),a}function E(){var a,c,d,g;if(g=e,/^[\-+]/.test(b.charAt(e))?(a=b.charAt(e),e++):(a=null,0===f&&k("[\\-+]")),a=null!==a?a:"",null!==a){if(/^[0-9]/.test(b.charAt(e))?(d=b.charAt(e),e++):(d=null,0===f&&k("[0-9]")),null!==d)for(c=[];null!==d;)c.push(d),/^[0-9]/.test(b.charAt(e))?(d=b.charAt(e),e++):(d=null,0===f&&k("[0-9]"));else c=null;null!==c?a=[a,c]:(a=null,e=g)}else a=null,e=g;return a}function F(){var a,b;return f++,b=e,a=G(),null!==a&&(a=function(a,b){return b}(b,a)),null===a&&(e=b),f--,0===f&&null===a&&k("identifier"),a}function G(){var a,b,c,d,g;if(f++,d=e,g=e,a=o(),null!==a){for(b=[],c=p();null!==c;)b.push(c),c=p();null!==b?a=[a,b]:(a=null,e=g)}else a=null,e=g;return null!==a&&(a=function(a,b,c){return b+c.join("")}(d,a[0],a[1])),null===a&&(e=d),f--,0===f&&null===a&&k("identifier"),a}function H(){var a,c,d,g,h,i,j;return i=e,a=F(),null!==a&&(a=function(a,b){return{type:"Variable",name:b}}(i,a)),null===a&&(e=i),null===a&&(a=B(),null===a&&(i=e,j=e,40===b.charCodeAt(e)?(a="(",e++):(a=null,0===f&&k('"("')),null!==a?(c=A(),null!==c?(d=Q(),null!==d?(g=A(),null!==g?(41===b.charCodeAt(e)?(h=")",e++):(h=null,0===f&&k('")"')),null!==h?a=[a,c,d,g,h]:(a=null,e=j)):(a=null,e=j)):(a=null,e=j)):(a=null,e=j)):(a=null,e=j),null!==a&&(a=function(a,b){return b}(i,a[2])),null===a&&(e=i))),a}function I(){var a,b,c,d,f;return a=H(),null===a&&(d=e,f=e,a=J(),null!==a?(b=A(),null!==b?(c=I(),null!==c?a=[a,b,c]:(a=null,e=f)):(a=null,e=f)):(a=null,e=f),null!==a&&(a=function(a,b,c){return{type:"UnaryExpression",operator:b,expression:c}}(d,a[0],a[2])),null===a&&(e=d)),a}function J(){var a;return 43===b.charCodeAt(e)?(a="+",e++):(a=null,0===f&&k('"+"')),null===a&&(45===b.charCodeAt(e)?(a="-",e++):(a=null,0===f&&k('"-"')),null===a&&(33===b.charCodeAt(e)?(a="!",e++):(a=null,0===f&&k('"!"')))),a}function K(){var a,b,c,d,f,g,h,i,j;if(h=e,i=e,a=I(),null!==a){for(b=[],j=e,c=A(),null!==c?(d=L(),null!==d?(f=A(),null!==f?(g=I(),null!==g?c=[c,d,f,g]:(c=null,e=j)):(c=null,e=j)):(c=null,e=j)):(c=null,e=j);null!==c;)b.push(c),j=e,c=A(),null!==c?(d=L(),null!==d?(f=A(),null!==f?(g=I(),null!==g?c=[c,d,f,g]:(c=null,e=j)):(c=null,e=j)):(c=null,e=j)):(c=null,e=j);null!==b?a=[a,b]:(a=null,e=i)}else a=null,e=i;return null!==a&&(a=function(a,b,c){for(var d=b,e=0;e<c.length;e++)d={type:"MultiplicativeExpression",operator:c[e][1],left:d,right:c[e][3]};return d}(h,a[0],a[1])),null===a&&(e=h),a}function L(){var a;return 42===b.charCodeAt(e)?(a="*",e++):(a=null,0===f&&k('"*"')),null===a&&(47===b.charCodeAt(e)?(a="/",e++):(a=null,0===f&&k('"/"'))),a}function M(){var a,b,c,d,f,g,h,i,j;if(h=e,i=e,a=K(),null!==a){for(b=[],j=e,c=A(),null!==c?(d=N(),null!==d?(f=A(),null!==f?(g=K(),null!==g?c=[c,d,f,g]:(c=null,e=j)):(c=null,e=j)):(c=null,e=j)):(c=null,e=j);null!==c;)b.push(c),j=e,c=A(),null!==c?(d=N(),null!==d?(f=A(),null!==f?(g=K(),null!==g?c=[c,d,f,g]:(c=null,e=j)):(c=null,e=j)):(c=null,e=j)):(c=null,e=j);null!==b?a=[a,b]:(a=null,e=i)}else a=null,e=i;return null!==a&&(a=function(a,b,c){for(var d=b,e=0;e<c.length;e++)d={type:"AdditiveExpression",operator:c[e][1],left:d,right:c[e][3]};return d}(h,a[0],a[1])),null===a&&(e=h),a}function N(){var a;return 43===b.charCodeAt(e)?(a="+",e++):(a=null,0===f&&k('"+"')),null===a&&(45===b.charCodeAt(e)?(a="-",e++):(a=null,0===f&&k('"-"'))),a}function O(){var a,b,c,d,f,g,h,i,j;if(h=e,i=e,a=M(),null!==a){for(b=[],j=e,c=A(),null!==c?(d=P(),null!==d?(f=A(),null!==f?(g=M(),null!==g?c=[c,d,f,g]:(c=null,e=j)):(c=null,e=j)):(c=null,e=j)):(c=null,e=j);null!==c;)b.push(c),j=e,c=A(),null!==c?(d=P(),null!==d?(f=A(),null!==f?(g=M(),null!==g?c=[c,d,f,g]:(c=null,e=j)):(c=null,e=j)):(c=null,e=j)):(c=null,e=j);null!==b?a=[a,b]:(a=null,e=i)}else a=null,e=i;return null!==a&&(a=function(a,b,c){for(var d=b,e=0;e<c.length;e++)d={type:"Inequality",operator:c[e][1],left:d,right:c[e][3]};return d}(h,a[0],a[1])),null===a&&(e=h),a}function P(){var a;return"<="===b.substr(e,2)?(a="<=",e+=2):(a=null,0===f&&k('"<="')),null===a&&(">="===b.substr(e,2)?(a=">=",e+=2):(a=null,0===f&&k('">="')),null===a&&(60===b.charCodeAt(e)?(a="<",e++):(a=null,0===f&&k('"<"')),null===a&&(62===b.charCodeAt(e)?(a=">",e++):(a=null,0===f&&k('">"'))))),a}function Q(){var a,c,d,g,h,i,j,l,m;if(j=e,l=e,a=O(),null!==a){for(c=[],m=e,d=A(),null!==d?("=="===b.substr(e,2)?(g="==",e+=2):(g=null,0===f&&k('"=="')),null!==g?(h=A(),null!==h?(i=O(),null!==i?d=[d,g,h,i]:(d=null,e=m)):(d=null,e=m)):(d=null,e=m)):(d=null,e=m);null!==d;)c.push(d),m=e,d=A(),null!==d?("=="===b.substr(e,2)?(g="==",e+=2):(g=null,0===f&&k('"=="')),null!==g?(h=A(),null!==h?(i=O(),null!==i?d=[d,g,h,i]:(d=null,e=m)):(d=null,e=m)):(d=null,e=m)):(d=null,e=m);null!==c?a=[a,c]:(a=null,e=l)}else a=null,e=l;return null!==a&&(a=function(a,b,c){for(var d=b,e=0;e<c.length;e++)d={type:"Equality",operator:c[e][1],left:d,right:c[e][3]};return d}(j,a[0],a[1])),null===a&&(e=j),a}function R(a){a.sort();for(var b=null,c=[],d=0;d<a.length;d++)a[d]!==b&&(c.push(a[d]),b=a[d]);return c}function S(){for(var a=1,c=1,d=!1,f=0;f<Math.max(e,g);f++){var h=b.charAt(f);"\n"===h?(d||a++,c=1,d=!1):"\r"===h||"\u2028"===h||"\u2029"===h?(a++,c=1,d=!0):(c++,d=!1)}return{line:a,column:c}}var d={start:l,Statement:m,SourceCharacter:n,IdentifierStart:o,IdentifierPart:p,WhiteSpace:q,LineTerminator:r,LineTerminatorSequence:s,EOS:t,EOF:u,Comment:v,MultiLineComment:w,MultiLineCommentNoLineTerminator:x,SingleLineComment:y,_:z,__:A,Literal:B,Integer:C,Real:D,SignedInteger:E,Identifier:F,IdentifierName:G,PrimaryExpression:H,UnaryExpression:I,UnaryOperator:J,MultiplicativeExpression:K,MultiplicativeOperator:L,AdditiveExpression:M,AdditiveOperator:N,InequalityExpression:O,InequalityOperator:P,LinearExpression:Q};if(void 0!==c){if(void 0===d[c])throw new Error("Invalid rule name: "+a(c)+".")}else c="start";var e=0,f=0,g=0,h=[],T=d[c]();if(null===T||e!==b.length){var U=Math.max(e,g),V=U<b.length?b.charAt(U):null,W=S();throw new this.SyntaxError(R(h),V,U,W.line,W.column)}return T},toSource:function(){return this._source}};return b.SyntaxError=function(b,c,d,e,f){function g(b,c){var d,e;switch(b.length){case 0:d="end of input";break;case 1:d=b[0];break;default:d=b.slice(0,b.length-1).join(", ")+" or "+b[b.length-1]}return e=c?a(c):"end of input","Expected "+d+" but "+e+" found."}this.name="SyntaxError",this.expected=b,this.found=c,this.message=g(b,c),this.offset=d,this.line=e,this.column=f},b.SyntaxError.prototype=Error.prototype,b}(),function(a){"use strict";var b=new a.SimplexSolver,c={},d={},e=a.Strength.weak;a.Strength.medium,a.Strength.strong,a.Strength.required;var i=function(f){if(d[f])return d[f];switch(f.type){case"Inequality":var g="<="==f.operator?a.LEQ:a.GEQ,h=new a.Inequality(i(f.left),g,i(f.right),e);return b.addConstraint(h),h;case"Equality":var h=new a.Equation(i(f.left),i(f.right),e);return b.addConstraint(h),h;case"MultiplicativeExpression":var h=a.times(i(f.left),i(f.right));return b.addConstraint(h),h;case"AdditiveExpression":return"+"==f.operator?a.plus(i(f.left),i(f.right)):a.minus(i(f.left),i(f.right));case"NumericLiteral":return new a.Expression(f.value);case"Variable":return c[f.name]||(c[f.name]=new a.Variable({name:f.name})),c[f.name];case"UnaryExpression":console.log("UnaryExpression...WTF?")}},j=function(a){return a.map(i)};a._api=function(){var c=Array.prototype.slice.call(arguments);if(1==c.length){if("string"==typeof c[0]){var d=a.parser.parse(c[0]);return j(d)}"function"==typeof c[0]&&b._addCallback(c[0])}}}(this.c||module.parent.exports||{});
}).call(
  (typeof module != "undefined") ?
      (module.compiled = true && module) : this
);

},{}],3:[function(require,module,exports){
var Command,
  slice = [].slice,
  hasProp = {}.hasOwnProperty,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Command = (function() {
  var l, results;

  Command.prototype.type = 'Command';

  function Command(operation, parent, index, context) {
    var command, match;
    if (!(command = operation.command)) {
      match = Command.match(this, operation, parent, index, context);
      command = Command.assign(this, operation, match, context);
      if (!parent) {
        command = Command.descend(command, this, operation);
      }
    }
    return command;
  }

  Command.prototype.solve = function(engine, operation, continuation, scope, ascender, ascending) {
    var args, domain, result;
    domain = operation.domain || engine;
    switch (typeof (result = this.retrieve(domain, operation, continuation, scope, ascender, ascending))) {
      case 'undefined':
        break;
      case 'function':
        if ((continuation = result.call(this, engine, operation, continuation, scope)) == null) {
          return;
        }
        result = void 0;
        break;
      default:
        if (continuation.indexOf(this.PAIR) > -1 || this.reference) {
          return result;
        }
    }
    if (result === void 0) {
      if (this.head) {
        return this.jump(domain, operation, continuation, scope, ascender, ascending);
      }
      args = this.descend(domain, operation, continuation, scope, ascender, ascending);
      if (args === false) {
        return;
      }
      this.log(args, engine, operation, continuation, scope);
      result = this.before(args, domain, operation, continuation, scope, ascender, ascending);
      if (result == null) {
        result = this.execute.apply(this, args);
      }
      if (result = this.after(args, result, domain, operation, continuation, scope, ascender, ascending)) {
        continuation = this["continue"](domain, operation, continuation, scope, ascender, ascending);
      }
      this.unlog(engine, result);
    }
    if (result != null) {
      return this.ascend(engine, operation, continuation, scope, result, ascender, ascending);
    }
  };

  Command.prototype.descend = function(engine, operation, continuation, scope, ascender, ascending) {
    var args, argument, command, contd, extras, i, index, l, length, ref, ref1, shift;
    length = operation.length - 1 + this.padding;
    if (length < 0) {
      console.warn('Empty rule: ', operation.parent[1].command.selector || operation.parent[1].command.path, 'in', scope);
      length = 0;
    }
    args = Array(length);
    index = 0;
    shift = this.contextualize(args, engine, operation, continuation, scope, ascender, ascending);
    while (++index < operation.length) {
      if (ascender === index) {
        argument = ascending;
      } else {
        argument = operation[index];
        if (argument instanceof Array) {
          command = argument.command || engine.Command(argument);
          argument.parent || (argument.parent = operation);
          if (continuation && ascender) {
            contd = this.connect(engine, operation, continuation, scope, args, ascender);
          }
          argument = command.solve(operation.domain || engine, argument, contd || continuation, scope, void 0, ascending);
          if (argument === void 0) {
            return false;
          }
        }
      }
      args[this.permutation[index - 1] + shift] = argument;
    }
    extras = (ref = this.extras) != null ? ref : this.execute.length - length;
    if (extras > 0) {
      for (i = l = 0, ref1 = extras; l < ref1; i = l += 1) {
        args.push(arguments[i]);
      }
    }
    return args;
  };

  Command.prototype.ascend = function(engine, operation, continuation, scope, result, ascender, ascending) {
    var domain, parent, top, wrapper, yielded;
    if ((parent = operation.parent)) {
      if (domain = operation.domain) {
        if ((wrapper = parent.domain) && wrapper !== domain && wrapper !== engine) {
          this.transfer(operation.domain, parent, continuation, scope, ascender, ascending, parent.command);
          return;
        }
      }
      if (top = parent.command) {
        if (yielded = typeof top["yield"] === "function" ? top["yield"](result, engine, operation, continuation, scope, ascender) : void 0) {
          if (yielded === true) {
            return;
          }
          if (yielded.command) {
            return yielded.command.solve(yielded.domain || engine, yielded, continuation, scope, -1, result);
          }
          return yielded;
        }
      }
      if (ascender > -1) {
        return top.solve(parent.domain || engine, parent, continuation, scope, parent.indexOf(operation), result);
      }
    }
    return result;
  };

  Command.prototype.contextualize = function(args, engine, operation, continuation, scope, ascender, ascending) {
    var command, context, node, parent, ref;
    if (ascender === -1 && (ascending != null)) {
      node = ascending;
    } else if (context = operation.context || ((parent = operation.parent) && ((ref = parent.command) != null ? ref.sequence : void 0) && parent.context)) {
      if ((command = context.command).key != null) {
        if (context[0] === '&') {
          node = scope;
        } else {
          node = this.getByPath(engine, this.delimit(continuation));
        }
      } else {
        node = command.solve(context.domain || engine, context, continuation, scope, -2);
      }
    }
    if (node) {
      args.length++;
      args[0] = this.precontextualize(engine, scope, node);
    }
    return operation.context && 1 || 0;
  };

  Command.prototype.precontextualize = function(engine, scope, element) {
    return element || scope;
  };

  Command.match = function(engine, operation, parent, index, context) {
    var Default, argument, command, i, implicit, j, kind, match, signature, type, typed;
    i = -1;
    j = operation.length;
    while (++i < j) {
      argument = operation[i];
      typed = typeof argument;
      if (typed === 'object') {
        if (argument.push) {
          if (!engine.Engine || typeof operation[0] === 'string') {
            if (argument.parent == null) {
              argument.parent = operation;
            }
          }
          command = (argument.domain || engine).Command(argument, operation, i, implicit);
          type = command.type;
          if (i) {
            if (implicit) {
              implicit = argument;
            }
          } else {
            if ((Default = command.Sequence)) {
              implicit = argument;
            } else {
              Default = Command.Sequence;
            }
          }
        } else if (i) {
          type = this.typeOfObject(argument);
        } else {
          kind = this.typeOfObject(argument);
          if (!(signature = engine.signatures[kind.toLowerCase()])) {
            return this.uncallable(kind.toLowerCase(), operation, engine);
          }
          if (!(type = context && context.command.type)) {
            continue;
          }
        }
      } else if (i) {
        type = this.types[typed];
      } else {
        if (typed === 'number') {
          if (!(signature = engine.signatures.number)) {
            return this.uncallable('number', operation, engine);
          }
        } else {
          if (!(signature = engine.signatures[argument])) {
            if (!(Default = engine.Default)) {
              return this.uncallable(argument, operation, engine);
            }
          }
        }
        if (!(type = context != null ? context.command.type : void 0)) {
          continue;
        }
      }
      if (signature) {
        if (match = signature[type] || signature.Any) {
          signature = match;
        } else if (!(Default || (Default = signature.Default || engine.Default))) {
          return this.unexpected(type, operation, signature, engine);
        }
      }
      if (Default != null ? Default.prototype.proxy : void 0) {
        implicit = context;
      }
    }
    if (command = Default || (signature != null ? signature.resolved : void 0) || engine.Default) {
      return command;
    } else {
      return this.unexpected('end of arguments', operation, signature, engine);
    }
  };

  Command.uncallable = function(type, operation, engine) {
    throw new Error("[" + engine.displayName + "] Undefined command: `" + type + "` called as `" + this.prototype.toExpression(operation) + '`');
  };

  Command.unexpected = function(type, operation, signature, engine) {
    var expected, property;
    expected = [];
    for (property in signature) {
      if (property !== 'resolved') {
        expected.push(property);
      }
    }
    if (expected.length) {
      throw new Error("[" + engine.displayName + "] Unexpected argument: `" + type + "` in `" + this.prototype.toExpression(operation) + '` expected ' + expected.join(', '));
    } else {
      throw new Error("[" + engine.displayName + "] Too many arguments: got `" + type + "` in `" + this.prototype.toExpression(operation) + "`");
    }
  };

  Command.assign = function(engine, operation, match, context) {
    var command;
    if (!(command = match.instance)) {
      command = new match(operation, engine);
    }
    if (context) {
      operation.context = context;
    }
    operation.command = command;
    if (command.key != null) {
      command.push(operation, context);
    } else {
      (command.definition || match).instance = command;
    }
    return command;
  };

  Command.descend = function(command, engine, operation) {
    var advices, argument, cmd, l, len, len1, m, proto, result, type;
    if (advices = command.advices) {
      for (l = 0, len = advices.length; l < len; l++) {
        type = advices[l];
        result = (proto = type.prototype).condition ? proto.condition(engine, operation, command) : type(engine, operation, command);
        if (!result) {
          continue;
        }
        if (result !== true) {
          type = result;
        }
        if (!(command = type.instance)) {
          command = new type(operation);
        }
        operation.command = command;
        if (command.key == null) {
          type.instance = command;
        }
        break;
      }
    }
    for (m = 0, len1 = operation.length; m < len1; m++) {
      argument = operation[m];
      if (cmd = argument.command) {
        Command.descend(cmd, engine, argument);
      }
    }
    return command;
  };

  Command.prototype["continue"] = function(engine, operation, continuation) {
    return continuation;
  };

  Command.prototype.before = function() {};

  Command.prototype.after = function(args, result) {
    return result;
  };

  Command.prototype.log = function(args, engine, operation, continuation, scope, name) {
    return engine.console.push(name || operation[0], args, continuation || "");
  };

  Command.prototype.unlog = function(engine, result) {
    return engine.console.pop(result);
  };

  Command.prototype.patch = function(engine, operation, continuation, scope, replacement) {
    var domain, op, ref;
    op = this.sanitize(engine, operation, void 0, replacement);
    if (!((ref = op.parent.command) != null ? ref.boundaries : void 0)) {
      op = op.parent;
    }
    domain = replacement || engine;
    if (op.domain !== domain && op.command) {
      return op.command.transfer(domain, op, continuation, scope, void 0, void 0, op.command, replacement);
    }
  };

  Command.prototype.transfer = function(engine, operation, continuation, scope, ascender, ascending, top, replacement) {
    var domain, meta, parent, path, ref, ref1, ref2, value;
    if ((meta = this.getMeta(operation)) && !engine.finalized) {
      for (path in operation.variables) {
        if ((value = (replacement || engine).values[path]) != null) {
          (meta.values || (meta.values = {}))[path] = value;
        } else if ((ref = meta.values) != null ? ref[path] : void 0) {
          delete meta.values[path];
        }
      }
    }
    if (top) {
      parent = operation;
      while (((ref1 = parent.parent) != null ? ref1.domain : void 0) === parent.domain && !parent.parent.command.boundaries) {
        operation = parent;
        parent = parent.parent;
      }
      if (!(domain = parent.domain)) {
        if (domain = (ref2 = parent.command.domains) != null ? ref2[parent.indexOf(operation)] : void 0) {
          domain = engine[domain];
        }
      }
      return engine.updating.push([parent], domain);
    }
  };

  Command.prototype.getMeta = function(operation) {
    var parent;
    parent = operation;
    while (parent = parent.parent) {
      if (parent[0].key != null) {
        return parent[0];
      }
    }
  };

  Command.prototype.connect = function(engine, operation, continuation, scope, args, ascender) {
    if ((ascender != null) && continuation[continuation.length - 1] !== this.DESCEND) {
      return this.delimit(continuation, this.PAIR);
    }
  };

  Command.prototype.rewind = function(engine, operation, continuation, scope) {
    return this.getPrefixPath(engine, continuation);
  };

  Command.prototype.fork = function(engine, continuation, item) {
    return this.delimit(continuation + engine.identify(item), this.ASCEND);
  };

  Command.prototype.jump = function() {};

  Command.prototype.retrieve = function() {};

  Command.prototype.permutation = (function() {
    results = [];
    for (l = 0; l < 640; l++){ results.push(l); }
    return results;
  }).apply(this);

  Command.prototype.padding = 0;

  Command.prototype.extras = void 0;

  Command.prototype.toExpression = function(operation) {
    var i, m, n, ref, ref1, ref2, ref3, ref4, ref5, str;
    switch (typeof operation) {
      case 'number':
        return operation;
      case 'string':
        return '"' + operation + '"';
    }
    if (typeof (str = operation[0]) === 'string') {
      if (str === 'get') {
        if (operation.length === 2) {
          return operation[1];
        } else {
          return operation[1].command.path + '[' + operation[2] + ']';
        }
      } else if (str.match(/^[a-zA-Z]/)) {
        str += '(';
        for (i = m = 1, ref = operation.length; m < ref; i = m += 1) {
          if (i > 1) {
            str += ', ';
          }
          str += this.toExpression((ref1 = operation[i]) != null ? ref1 : '');
        }
        return str + ')';
      } else {
        return this.toExpression((ref2 = operation[1]) != null ? ref2 : '') + str + this.toExpression((ref3 = operation[2]) != null ? ref3 : '');
      }
    }
    str = '';
    for (i = n = 0, ref4 = operation.length; n < ref4; i = n += 1) {
      if (i) {
        str += ', ';
      }
      str += this.toExpression((ref5 = operation[i]) != null ? ref5 : '');
    }
    return str;
  };

  Command.prototype.sanitize = function(engine, operation, ascend, replacement) {
    var argument, len, m, parent;
    if (ascend !== false) {
      for (m = 0, len = operation.length; m < len; m++) {
        argument = operation[m];
        if (ascend !== argument) {
          if (argument.push && (engine === true || (argument != null ? argument.domain : void 0) === engine)) {
            if (argument[0] === 'get' && engine !== true) {
              return ascend;
            }
            this.sanitize(engine, argument, false, replacement);
          }
        }
      }
    }
    operation.domain = operation.command = void 0;
    if (replacement) {
      operation.domain = replacement;
      replacement.Command(operation);
    }
    if (ascend !== false) {
      if ((parent = operation.parent) && parent.domain === engine && !parent.command.boundaries) {
        return this.sanitize(engine, parent, operation, replacement);
      }
    }
    return operation;
  };

  Command.prototype.ASCEND = String.fromCharCode(8593);

  Command.prototype.PAIR = String.fromCharCode(8594);

  Command.prototype.DESCEND = String.fromCharCode(8595);

  Command.prototype.DELIMITERS = [8593, 8594, 8595];

  Command.prototype.delimit = function(path, delimeter) {
    if (delimeter == null) {
      delimeter = '';
    }
    if (!path) {
      return path;
    }
    if (this.DELIMITERS.indexOf(path.charCodeAt(path.length - 1)) > -1) {
      return path.substring(0, path.length - 1) + delimeter;
    } else {
      return path + delimeter;
    }
  };

  Command.prototype.getRoot = function(operation) {
    while (operation.parent && operation.command.type !== 'Default') {
      operation = operation.parent;
    }
    return operation;
  };

  Command.extend = function(definition, methods) {
    var Constructor, Kommand, Prototype, property, value;
    if ((Constructor = this.prototype.constructor) === Command || Constructor.length === 0) {
      Constructor = void 0;
    }
    Kommand = function() {
      if (Constructor) {
        return Constructor.apply(this, arguments);
      }
    };
    Kommand.__super__ = this;
    Prototype = function() {};
    Prototype.prototype = this.prototype;
    Kommand.prototype = new Prototype;
    Kommand.prototype.definition = Kommand;
    Kommand.extend = Command.extend;
    Kommand.define = Command.define;
    for (property in definition) {
      value = definition[property];
      Kommand.prototype[property] = value;
    }
    if (methods) {
      Kommand.define(methods);
    }
    return Kommand;
  };

  Command.define = function(name, options) {
    var property, value;
    if (!options) {
      for (property in name) {
        value = name[property];
        Command.define.call(this, property, value);
      }
    } else {
      if (typeof options === 'function') {
        options = {
          execute: options
        };
      }
      this[name] = this.extend(options);
    }
  };

  Command.types = {
    'string': 'String',
    'number': 'Number',
    'object': 'Object',
    'boolean': 'Boolean'
  };

  Command.typeOfObject = function(object) {
    if (object.nodeType) {
      return 'Node';
    }
    if (object.push) {
      return 'List';
    }
    return 'Object';
  };

  Command.orphanize = function(operation) {
    var arg, len, m;
    if (operation.domain) {
      operation.domain = void 0;
    }
    if (operation.variables) {
      operation.variables = void 0;
    }
    for (m = 0, len = operation.length; m < len; m++) {
      arg = operation[m];
      if (arg != null ? arg.push : void 0) {
        this.orphanize(arg);
      }
    }
    return operation;
  };

  Command.compile = function(engine, command, force) {
    var Types, aliases, base, len, m, name, property, proto, ref, ref1, value;
    if (!command) {
      if (engine.proto.hasOwnProperty('$signatures') && !force) {
        ref = engine.proto.$signatures;
        for (property in ref) {
          value = ref[property];
          engine.signatures[property] = value;
        }
      } else {
        for (property in engine) {
          value = engine[property];
          if (((proto = value != null ? value.prototype : void 0) != null) && proto instanceof Command) {
            if (property.match(/^[A-Z]/)) {
              this.compile(engine, value);
            }
          }
        }
        engine.proto.$signatures = {};
        ref1 = engine.signatures;
        for (property in ref1) {
          value = ref1[property];
          engine.proto.$signatures[property] = value;
        }
      }
      return;
    }
    if ((engine.compiled || (engine.compiled = [])).indexOf(command) > -1) {
      return;
    }
    engine.compiled.push(command);
    Types = command.types = {};
    for (property in command) {
      value = command[property];
      if (property.match(/^[A-Z]/)) {
        if ((value != null ? value.prototype : void 0) instanceof Command) {
          Types[property] = value;
          this.compile(engine, value);
        }
      }
    }
    for (property in command) {
      value = command[property];
      if (value !== Command[property] && property !== '__super__') {
        if ((value != null ? value.prototype : void 0) instanceof Command) {
          if (!property.match(/^[A-Z]/)) {
            if (value.__super__ === command) {
              this.register(engine.signatures, property, value, Types);
              if (engine.helps) {
                (base = engine.$prototype)[property] || (base[property] = this.Helper(engine, property));
                if (aliases = value.prototype.helpers) {
                  for (m = 0, len = aliases.length; m < len; m++) {
                    name = aliases[m];
                    engine.$prototype[name] = engine.$prototype[property];
                  }
                }
              }
            }
          }
        }
      }
    }
    this.Types = Types;
    return this;
  };

  Command.Helper = function(engine, name) {
    return function() {
      var arg, args, command, extras, index, len, length, m, parent, permutation, permuted, ref, result;
      args = Array.prototype.slice.call(arguments);
      command = Command.match(engine, [name].concat(args)).prototype;
      if (!(parent = command.constructor.__super__)) {
        return this.engine.solve([name].concat(slice.call(arguments)));
      }
      length = command.padding;
      if (command.hasOwnProperty('permutation')) {
        length += (permutation = command.permutation).length;
        permuted = [];
        for (index = m = 0, len = args.length; m < len; index = ++m) {
          arg = args[index];
          permuted[permutation[index]] = arg;
        }
        args = permuted;
      }
      if (length > args.length) {
        args.length = length;
      }
      if (extras = (ref = command.extras) != null ? ref : command.execute.length) {
        args.push(this.input);
        if (extras > 1) {
          args.push(args);
          if (extras > 2) {
            args.push('');
            if (extras > 3) {
              args.push(this.scope);
            }
          }
        }
        if ((result = command.execute.apply(command, args)) != null) {
          if (command.ascend !== parent.ascend) {
            command.ascend(engine.input, args, '', this.scope, result);
          }
          return result;
        }
      }
    };
  };


  /*
  
  Generate lookup structures to match methods by name and argument type signature
  
  Signature for `['==', ['get', 'a'], 10]` would be `engine.signatures['==']['Variable']['Number']`
  
  A matched signature returns customized class for an operation that can further
  pick a sub-class dynamically. Signatures allows special case optimizations and
  composition to be implemented structurally, instead of branching in runtime.
  
  Signatures are shared between commands. Dispatcher support css-style
  typed optional argument groups, but has no support for keywords or repeating groups yet
   */

  Command.sign = function(command, object) {
    var len, m, signature, signatures, signed, storage;
    if (signed = command.signed) {
      return signed;
    }
    command.signed = storage = [];
    if (signature = object.signature) {
      this.get(command, storage, signature);
    } else if (signature === false) {
      storage.push(['default']);
    } else if (signatures = object.signatures) {
      for (m = 0, len = signatures.length; m < len; m++) {
        signature = signatures[m];
        this.get(command, storage, signature);
      }
    }
    return storage;
  };

  Command.permute = function(arg, permutation) {
    var group, i, index, j, keys, len, len1, m, n, o, p, position, ref, ref1, ref2, values;
    keys = Object.keys(arg);
    if (!permutation) {
      return keys;
    }
    values = Object.keys(arg);
    group = [];
    for (index = m = 0, len = permutation.length; m < len; index = ++m) {
      position = permutation[index];
      if (position !== null) {
        group[position] = keys[index];
      }
    }
    for (i = n = ref = permutation.length, ref1 = keys.length; n < ref1; i = n += 1) {
      for (j = o = 0, ref2 = keys.length; o < ref2; j = o += 1) {
        if (group[j] == null) {
          group[j] = keys[i];
          break;
        }
      }
    }
    for (p = 0, len1 = group.length; p < len1; p++) {
      arg = group[p];
      if (arg === void 0) {
        return;
      }
    }
    return group;
  };

  Command.getPermutation = function(args, properties) {
    var arg, index, len, m, n, result;
    result = [];
    for (index = m = 0, len = args.length; m < len; index = ++m) {
      arg = args[index];
      if (arg !== null) {
        result[arg] = properties[index];
      }
    }
    for (index = n = result.length - 1; n >= 0; index = n += -1) {
      arg = result[index];
      if (arg == null) {
        result.splice(index, 1);
      }
    }
    return result;
  };

  Command.getPositions = function(args) {
    var arg, index, len, m, n, result, value;
    result = [];
    for (index = m = 0, len = args.length; m < len; index = ++m) {
      value = args[index];
      if (value != null) {
        result[value] = index;
      }
    }
    for (index = n = result.length - 1; n >= 0; index = n += -1) {
      arg = result[index];
      if (arg == null) {
        result.splice(index, 1);
      }
    }
    return result;
  };

  Command.getProperties = function(signature) {
    var a, arg, definition, len, len1, m, n, properties, property;
    if (properties = signature.properties) {
      return properties;
    }
    signature.properties = properties = [];
    for (m = 0, len = signature.length; m < len; m++) {
      arg = signature[m];
      if (arg.push) {
        for (n = 0, len1 = arg.length; n < len1; n++) {
          a = arg[n];
          for (property in a) {
            definition = a[property];
            properties.push(definition);
          }
        }
      } else {
        for (property in arg) {
          definition = arg[property];
          properties.push(definition);
        }
      }
    }
    return properties;
  };

  Command.generate = function(combinations, positions, properties, combination, length) {
    var i, j, len, m, position, props, ref, type;
    if (combination) {
      i = combination.length;
    } else {
      combination = [];
      combinations.push(combination);
      i = 0;
    }
    while ((props = properties[i]) === void 0 && i < properties.length) {
      i++;
    }
    if (i === properties.length) {
      combination.length = length;
      combination.push(positions);
    } else {
      ref = properties[i];
      for (j = m = 0, len = ref.length; m < len; j = ++m) {
        type = ref[j];
        if (j === 0) {
          combination.push(type);
        } else {
          position = combinations.indexOf(combination);
          combination = combination.slice(0, i);
          combination.push(type);
          combinations.push(combination);
        }
        this.generate(combinations, positions, properties, combination, length);
      }
    }
    return combinations;
  };

  Command.write = function(command, storage, combination) {
    var arg, i, last, m, proto, ref, ref1, ref2, resolved, variant;
    for (i = m = 0, ref = combination.length; 0 <= ref ? m < ref : m > ref; i = 0 <= ref ? ++m : --m) {
      if ((arg = combination[i]) === 'default') {
        storage.Default = command;
      } else {
        last = combination.length - 1;
        if (arg !== void 0 && i < last) {
          storage = storage[arg] || (storage[arg] = {});
        } else {
          variant = command.extend({
            permutation: combination[last],
            padding: last - i,
            definition: command
          });
          if (resolved = storage.resolved) {
            proto = resolved.prototype;
            if (variant.prototype.condition) {
              if (!proto.hasOwnProperty('advices')) {
                proto.advices = ((ref1 = proto.advices) != null ? ref1.slice() : void 0) || [];
                if (proto.condition) {
                  proto.advices.push(resolved);
                }
              }
              proto.advices.push(variant);
            } else {
              if (proto.condition) {
                variant.prototype.advices = ((ref2 = proto.advices) != null ? ref2.slice() : void 0) || [resolved];
                storage.resolved = variant;
              }
            }
          } else {
            storage.resolved = variant;
          }
        }
      }
    }
  };

  Command.register = function(signatures, property, command, types) {
    var Prototype, combination, execute, kind, len, len1, m, n, proto, ref, ref1, storage, subcommand, type, value;
    storage = signatures[property] || (signatures[property] = {});
    for (type in types) {
      subcommand = types[type];
      if (proto = command.prototype) {
        if ((execute = proto[type]) || ((kind = subcommand.prototype.kind) && ((kind === 'auto') || (execute = proto[kind])))) {
          Prototype = subcommand.extend();
          for (property in proto) {
            if (!hasProp.call(proto, property)) continue;
            value = proto[property];
            Prototype.prototype[property] = value;
          }
          if (typeof execute === 'object') {
            for (property in execute) {
              value = execute[property];
              Prototype.prototype[property] = value;
            }
          } else if (execute) {
            Prototype.prototype.execute = execute;
          }
          ref = this.sign(subcommand, Prototype.prototype);
          for (m = 0, len = ref.length; m < len; m++) {
            combination = ref[m];
            this.write(Prototype, storage, combination);
          }
        }
      }
    }
    ref1 = this.sign(command, command.prototype);
    for (n = 0, len1 = ref1.length; n < len1; n++) {
      combination = ref1[n];
      this.write(command, storage, combination);
    }
  };

  Command.get = function(command, storage, signature, args, permutation) {
    var arg, argument, group, i, j, k, keys, len, len1, m, n, o, obj, property, ref;
    args || (args = []);
    i = args.length;
    seeker: {;
    for (m = 0, len = signature.length; m < len; m++) {
      arg = signature[m];
      if (arg.push) {
        for (k = n = 0, len1 = arg.length; n < len1; k = ++n) {
          obj = arg[k];
          j = 0;
          group = arg;
          for (property in obj) {
            if (!i) {
              arg = obj;
              if (!(keys = this.permute(arg, permutation))) {
                return;
              }
              argument = arg[property];
              break seeker;
            }
            i--;
            j++;
          }
        }
      } else {
        j = void 0;
        for (property in arg) {
          if (!i) {
            argument = arg[property];
            break seeker;
          }
          i--;
        }
      }
    }
    };
    if (!argument) {
      this.generate(storage, this.getPositions(args), this.getPermutation(args, this.getProperties(signature)), void 0, args.length);
      return;
    }
    if (keys && (j != null)) {
      permutation || (permutation = []);
      for (i = o = 0, ref = keys.length; o < ref; i = o += 1) {
        if (permutation.indexOf(i) === -1) {
          this.get(command, storage, signature, args.concat(args.length - j + i), permutation.concat(i));
        }
      }
      this.get(command, storage, signature, args.concat(null), permutation.concat(null));
      return;
    }
    return this.get(command, storage, signature, args.concat(args.length));
  };

  return Command;

})();

Command.Sequence = (function(superClass) {
  extend(Sequence, superClass);

  function Sequence() {}

  Sequence.prototype.descend = function(engine, operation, continuation, scope, ascender, ascending) {
    var argument, command, index, l, ref, ref1, result;
    if (ascender > -1) {
      index = ascender + 1;
      result = ascending;
    } else if (ascender === -1 && ascending) {
      result = ascending;
      continuation = this.delimit(continuation, this.ASCEND);
    }
    for (index = l = ref = index || 0, ref1 = operation.length; l < ref1; index = l += 1) {
      argument = operation[index];
      argument.parent || (argument.parent = operation);
      if (command = argument.command || engine.Command(argument)) {
        result = command.solve(engine, argument, continuation, scope, -1, result);
        if (result === void 0) {
          return;
        }
      }
      break;
    }
    return [result, engine, operation, continuation, scope];
  };

  Sequence.prototype.log = function() {};

  Sequence.prototype.unlog = function() {};

  Sequence.prototype.sequence = true;

  Sequence.prototype.execute = function(result) {
    return result;
  };

  Sequence.prototype.release = function(result, engine, operation, continuation, scope) {
    var base, parent;
    parent = operation.parent;
    if (operation === parent[parent.length - 1]) {
      return typeof (base = parent.parent.command).release === "function" ? base.release(result, engine, parent, continuation, scope) : void 0;
    }
  };

  Sequence.prototype["yield"] = function(result, engine, operation, continuation, scope, ascender, ascending) {
    var next, parent;
    if (ascender === -2) {
      return;
    }
    parent = operation.parent;
    if ((next = parent[parent.indexOf(operation) + 1])) {
      return next;
    } else {
      if (parent.parent) {
        this.ascend(engine, parent, continuation, scope, result, parent.parent.indexOf(parent), ascending);
        return true;
      } else {
        return result;
      }
    }
  };

  return Sequence;

})(Command);

Command.List = (function(superClass) {
  extend(List, superClass);

  List.prototype.type = 'List';

  List.prototype.condition = function(engine, operation) {
    var parent, ref;
    if (parent = operation.parent) {
      return ((ref = parent.command.List) != null ? ref[parent.indexOf(operation)] : void 0) || parent[0] === true;
    } else {
      return !operation[0].command.Sequence;
    }
  };

  function List() {}

  List.prototype.extras = 0;

  List.prototype.boundaries = true;

  List.prototype.execute = function() {};

  List.prototype["yield"] = function() {
    return true;
  };

  List.prototype.descend = function(engine, operation, continuation, scope, ascender, ascending) {
    var argument, command, index, l, len;
    for (index = l = 0, len = operation.length; l < len; index = ++l) {
      argument = operation[index];
      if (argument != null ? argument.push : void 0) {
        if (command = argument.command || engine.Command(argument)) {
          command.solve(engine, argument, continuation, scope);
        }
      }
    }
  };

  return List;

})(Command.Sequence);

Command.Sequence.prototype.advices = [Command.List];

Command.Default = (function(superClass) {
  extend(Default, superClass);

  Default.prototype.type = 'Default';

  Default.prototype.extras = 2;

  Default.prototype.execute = function() {
    var args, engine, l, operation;
    args = 3 <= arguments.length ? slice.call(arguments, 0, l = arguments.length - 2) : (l = 0, []), engine = arguments[l++], operation = arguments[l++];
    args.unshift(operation[0]);
    return args;
  };

  function Default() {}

  return Default;

})(Command);

Command.Object = (function(superClass) {
  extend(Object, superClass);

  function Object() {}

  return Object;

})(Command);

Command.Meta = (function(superClass) {
  extend(Meta, superClass);

  function Meta() {
    return Meta.__super__.constructor.apply(this, arguments);
  }

  Meta.prototype.type = 'Meta';

  Meta.prototype.signature = [
    {
      body: ['Any']
    }
  ];

  Meta.prototype.execute = function(data) {
    return data;
  };

  return Meta;

})(Command);

module.exports = Command;


},{}],4:[function(require,module,exports){

/* Domain: Observable object. 

Has 3 use cases:

1) Base  

Interface:

  - (un)watch() - (un)subscribe expression to property updates
  - set()       - dispatches updates to subscribed expressions
  - get()       - retrieve value
  - remove()    - detach observes by continuation


State:
  - @watchers[key] - List of oservers of specific properties
                      as [operation, continuation, scope] triplets

  - @observers[continuation] - List of observers by continuation
                                as [operation, key, scope] triplets
 */
var Domain,
  hasProp = {}.hasOwnProperty;

Domain = (function() {
  Domain.prototype.strategy = void 0;

  function Domain(values) {
    this.signatures = {};
    if (values) {
      this.merge(values);
    }
    if (this.url) {
      this.useWorker(this.url);
    }
    if (this.events !== this.engine.events) {
      this.addListeners(this.events);
    }
    if (this.Properties) {
      this.properties = new this.Properties(this);
      this.Property.compile(this.properties, this);
    } else {
      this.properties = {};
    }
    return this;
  }

  Domain.prototype.setup = function() {
    if (!this.hasOwnProperty('values')) {
      this.values = {};
      return this.construct();
    }
  };

  Domain.prototype.construct = function() {
    this.watchers = {};
    return this.watched = {};
  };

  Domain.prototype.solve = function(operation, continuation, scope, ascender, ascending) {
    var commands, commited, ref, result, transacting;
    transacting = this.transact();
    if (typeof operation === 'object') {
      if (operation instanceof Array) {
        result = this.Command(operation).solve(this, operation, continuation || '', scope || this.scope, ascender, ascending);
      } else {
        result = this.data.merge(operation, continuation);
      }
    }
    if (this.constrained || this.unconstrained) {
      commands = this.Constraint.prototype.split(this);
      this.Constraint.prototype.reset(this);
    }
    if (typeof result !== 'object') {
      if (result = (ref = this.perform) != null ? ref.apply(this, arguments) : void 0) {
        result = this.apply(result);
      }
    }
    if (commands) {
      this.update(commands);
    }
    if (transacting) {
      commited = this.commit();
    }
    return result || commited;
  };

  Domain.prototype.watch = function(object, property, operation, continuation, scope) {
    var base, base1, base2, id, j, obj, observers, path, prop, value, watchers;
    this.setup();
    path = this.getPath(object, property);
    value = this.get(path);
    if (this.indexOfTriplet(this.watchers[path], operation, continuation, scope) === -1) {
      observers = (base = this.watched)[continuation] || (base[continuation] = []);
      observers.push(operation, path, scope);
      watchers = (base1 = this.watchers)[path] || (base1[path] = []);
      watchers.push(operation, continuation, scope);
      if (this.subscribe && watchers.length === 3) {
        if ((j = path.indexOf('[')) > -1) {
          id = path.substring(0, j);
          obj = (base2 = (this.subscribers || (this.subscribers = {})))[id] || (base2[id] = {});
          prop = path.substring(j + 1, path.length - 1);
          obj[prop] = true;
          this.subscribe(id, prop, path);
        }
      }
    }
    return value;
  };

  Domain.prototype.unwatch = function(object, property, operation, continuation, scope) {
    var base, id, index, j, obj, observers, old, path, prop, watchers;
    path = this.getPath(object, property);
    observers = this.watched[continuation];
    index = this.indexOfTriplet(observers, operation, path, scope);
    observers.splice(index, 3);
    if (!observers.length) {
      delete this.watched[continuation];
    }
    watchers = this.watchers[path];
    index = this.indexOfTriplet(watchers, operation, continuation, scope);
    watchers.splice(index, 3);
    if (!watchers.length) {
      delete this.watchers[path];
      if (this.subscribe) {
        if ((j = path.indexOf('[')) > -1) {
          id = path.substring(0, j);
          obj = (base = this.subscribers)[id] || (base[id] = {});
          prop = path.substring(j + 1, path.length - 1);
          old = obj[prop];
          delete obj[prop];
          if (this.updating) {
            this.transact();
            this.changes[path] = null;
            if (!(this.updating.domains.indexOf(this) > this.updating.index)) {
              this.updating.apply(this.changes);
            }
          }
          this.unsubscribe(id, prop, path);
          if (!Object.keys(obj).length) {
            delete this.subscribers[id];
            if (!Object.keys(this.subscribers).length) {
              return this.subscribers = void 0;
            }
          }
        }
      }
    }
  };

  Domain.prototype.get = function(object, property) {
    return this.values[this.getPath(object, property)];
  };

  Domain.prototype.merge = function(object, continuation, operation) {
    if (object && !object.push) {
      if (object instanceof Domain) {
        return;
      }
      if (this.updating) {
        return this.merger(object, void 0, continuation);
      } else {
        return this.engine.solve(this.displayName || 'GSS', this.merger, object, this, continuation, operation);
      }
    }
  };

  Domain.prototype.merger = function(object, domain, continuation, operation) {
    var async, path, transacting, value;
    if (domain == null) {
      domain = this;
    }
    transacting = domain.transact();
    async = false;
    for (path in object) {
      value = object[path];
      domain.set(void 0, path, value, continuation, operation);
    }
    if (transacting) {
      return domain.commit();
    }
  };

  Domain.prototype.set = function(object, property, value, continuation, operation) {
    var base, i, k, len, old, op, path, ref, stack, updated;
    path = this.getPath(object, property);
    old = this.values[path];
    if (continuation != null) {
      ref = stack = (base = (this.stacks || (this.stacks = {})))[path] || (base[path] = []);
      for (i = k = 0, len = ref.length; k < len; i = k += 3) {
        op = ref[i];
        if (op === operation && stack[i + 1] === continuation) {
          if (value != null) {
            stack[i + 2] = value;
            if (stack.length > i + 3) {
              return;
            }
          } else {
            stack.splice(i, 3);
            if (stack.length > i + 3) {
              return;
            }
            value = stack[stack.length - 1];
          }
          updated = true;
          break;
        }
      }
      if (!updated && value !== null) {
        stack.push(operation, continuation, value);
      }
    }
    if (old === value || ((value == null) && (old == null))) {
      return;
    }
    this.transact();
    this.changes[path] = value != null ? value : null;
    if (value != null) {
      this.values[path] = value;
    } else {
      delete this.values[path];
    }
    if (this.updating) {
      this.callback(path, value);
    } else {
      this.engine.solve(this.displayName || 'GSS', function(domain) {
        return domain.callback(path, value);
      }, this);
    }
    return value;
  };

  Domain.prototype.callback = function(path, value) {
    var command, constraint, index, k, l, len, len1, len2, m, op, operation, ref, ref1, ref2, url, values, variable, watcher, watchers, worker, workers;
    if (watchers = (ref = this.watchers) != null ? ref[path] : void 0) {
      for (index = k = 0, len = watchers.length; k < len; index = k += 3) {
        watcher = watchers[index];
        if (!watcher) {
          break;
        }
        if (command = watcher.command) {
          if (command.deferred) {
            this.Query.prototype.defer(this, watcher, watchers[index + 1], watchers[index + 2]);
          } else if (value != null) {
            watcher.command.solve(this, watcher, watchers[index + 1], watchers[index + 2], true);
          } else {
            watcher.command.patch(this, watcher, watchers[index + 1], watchers[index + 2]);
          }
        }
      }
    }
    if (this.immutable) {
      return;
    }
    if (!(this instanceof this.Solver) && (variable = this.variables[path])) {
      ref1 = variable.constraints;
      for (l = 0, len1 = ref1.length; l < len1; l++) {
        constraint = ref1[l];
        ref2 = constraint.operations;
        for (m = 0, len2 = ref2.length; m < len2; m++) {
          operation = ref2[m];
          if (op = operation.variables[path]) {
            if (op.domain && op.domain.displayName !== this.displayName) {
              if (!watchers || watchers.indexOf(op) === -1) {
                op.command.patch(op.domain, op, void 0, void 0, this);
                op.command.solve(this, op);
              }
            }
          }
        }
      }
    }
    if (workers = this.workers) {
      for (url in workers) {
        worker = workers[url];
        if (values = worker.values) {
          if (values.hasOwnProperty(path)) {
            this.updating.push([['value', path, value != null ? value : null]], worker);
          }
        }
      }
    }
  };

  Domain.prototype.toObject = function() {
    var object, property, value;
    object = {};
    for (property in this) {
      if (!hasProp.call(this, property)) continue;
      value = this[property];
      if (property !== 'engine' && property !== 'observers' && property !== 'watchers' && property !== 'values') {
        object[property] = value;
      }
    }
    return object;
  };

  Domain.prototype.compile = function(force) {
    return this.Command.compile(this, void 0, force);
  };

  Domain.prototype.add = function(path, value) {
    var base, group;
    group = (base = (this.paths || (this.paths = {})))[path] || (base[path] = []);
    group.push(value);
  };

  Domain.prototype.transform = function(result) {
    var nullified, path, ref, ref1, ref2, replaced, value, variable;
    if (result == null) {
      result = {};
    }
    nullified = this.nullified;
    replaced = this.replaced;
    if (this.declared) {
      ref = this.declared;
      for (path in ref) {
        variable = ref[path];
        value = (ref1 = variable.value) != null ? ref1 : 0;
        if (this.values[path] !== value) {
          if (path.charAt(0) !== '%') {
            if (result[path] == null) {
              result[path] = value;
            }
            this.values[path] = value;
          }
        }
      }
      this.declared = void 0;
    }
    this.replaced = void 0;
    if (nullified) {
      for (path in nullified) {
        variable = nullified[path];
        if (path.charAt(0) !== '%') {
          result[path] = (ref2 = this.data.values[path]) != null ? ref2 : null;
        }
        this.nullify(variable);
      }
      this.nullified = void 0;
    }
    return result;
  };

  Domain.prototype.apply = function(solution) {
    var nullified, path, replaced, result, value;
    result = {};
    nullified = this.nullified;
    replaced = this.replaced;
    for (path in solution) {
      value = solution[path];
      if (!(nullified != null ? nullified[path] : void 0) && !(replaced != null ? replaced[path] : void 0) && path.charAt(0) !== '%') {
        result[path] = value;
      }
    }
    result = this.transform(result);
    this.merge(result);
    return result;
  };

  Domain.prototype.register = function(constraints) {
    var domains, index;
    if (constraints == null) {
      constraints = this.constraints;
    }
    domains = this.engine.domains;
    if (constraints != null ? constraints.length : void 0) {
      if (domains.indexOf(this) === -1) {
        return domains.push(this);
      }
    } else {
      if ((index = domains.indexOf(this)) > -1) {
        return domains.splice(index, 1);
      }
    }
  };

  Domain.prototype.remove = function() {
    var base, base1, contd, i, k, l, len, len1, m, observer, operation, operations, path, property, ref, ref1, ref2, stack, stacks, unstacked;
    for (k = 0, len = arguments.length; k < len; k++) {
      path = arguments[k];
      if (stacks = this.stacks) {
        ref = this.stacks;
        for (property in ref) {
          stack = ref[property];
          if (this.updating && this === this.data && stack.indexOf(path) > -1) {
            unstacked = (base = ((base1 = this.updating).unstacked || (base1.unstacked = {})))[property] || (base[property] = []);
            if (unstacked.indexOf(path) === -1) {
              unstacked.push(path);
            } else {
              break;
            }
          }
          while ((i = stack.indexOf(path)) > -1) {
            stack.splice(i - 1, 3);
            if (stack.length < i) {
              this.set(null, property, stack[stack.length - 1]);
              if (!stack.length) {
                delete this.stacks[property];
              }
            }
          }
        }
      }
      if (this.watched) {
        ref1 = this.Query.prototype.getVariants(path) || [path];
        for (l = 0, len1 = ref1.length; l < len1; l++) {
          contd = ref1[l];
          if (observer = this.watched[contd]) {
            while (observer[0]) {
              this.unwatch(observer[1], void 0, observer[0], contd, observer[2]);
            }
          }
        }
      }
      if (operations = (ref2 = this.paths) != null ? ref2[path] : void 0) {
        for (i = m = operations.length - 1; m >= 0; i = m += -1) {
          operation = operations[i];
          operation.command.remove(this, operation, path);
        }
      }
    }
  };

  Domain.prototype["export"] = function(constraints) {
    var constraint, k, l, len, len1, operation, operations, ops;
    if (constraints || (constraints = this.constraints)) {
      operations = [];
      for (k = 0, len = constraints.length; k < len; k++) {
        constraint = constraints[k];
        if (ops = constraint.operations) {
          for (l = 0, len1 = ops.length; l < len1; l++) {
            operation = ops[l];
            operations.push(operation.parent);
          }
        }
      }
      return operations;
    }
  };

  Domain.prototype.transfer = function(update, parent) {
    if (parent) {
      parent.perform(this);
    }
    if (update) {
      update.perform(this);
    }
    this.updating.perform(this);
    if (this.unconstrained) {
      this.Constraint.prototype.reset(this);
      this.register();
    }
    if (this.nullified) {
      return this.updating.apply(this.transform());
    }
  };

  Domain.prototype.maybe = function() {
    var Base;
    if (!this.Maybe) {
      Base = function() {};
      Base.prototype = this;
      this.Maybe = function() {};
      this.Maybe.prototype = new Base;
    }
    return new this.Maybe;
  };

  Domain.prototype.transact = function() {
    if (!this.changes) {
      this.setup();
      return this.changes = {};
    }
  };

  Domain.prototype.commit = function() {
    var changes, prop;
    if (changes = this.changes) {
      if (this instanceof this.Solver) {
        this.register();
      }
      this.changes = void 0;
      for (prop in changes) {
        return changes;
      }
    }
  };

  Domain.compile = function(engine) {
    var EngineDomain, EngineDomainWrapper, domain, name, property, ref, value;
    for (name in engine) {
      domain = engine[name];
      if (domain.prototype && domain.prototype instanceof Domain) {
        EngineDomain = engine[name] = function(values) {
          return domain.prototype.constructor.call(this, void 0, void 0, values);
        };
        EngineDomainWrapper = function() {};
        EngineDomainWrapper.prototype = engine;
        EngineDomain.prototype = new EngineDomainWrapper;
        EngineDomain.prototype.proto = domain;
        EngineDomain.prototype.engine = engine;
        EngineDomain.prototype.displayName = name;
        ref = domain.prototype;
        for (property in ref) {
          value = ref[property];
          EngineDomain.prototype[property] = value;
        }
        engine[name.toLowerCase()] = new EngineDomain();
      }
    }
    return this;
  };

  Domain.prototype.Property = function(property, reference, properties) {
    var base, index, key, left, path, right, value;
    if (typeof property === 'object') {
      if (property.push) {
        return properties[reference] = this.Style(property, reference, properties);
      } else {
        for (key in property) {
          value = property[key];
          if ((index = reference.indexOf('[')) > -1) {
            path = reference.replace(']', '-' + key + ']');
            left = reference.substring(0, index);
            right = path.substring(index + 1, path.length - 1);
            (base = properties[left])[right] || (base[right] = this.Property(value, path, properties));
          } else if (reference.match(/^[a-z]/i)) {
            path = reference + '-' + key;
          } else {
            path = reference + '[' + key + ']';
          }
          properties[path] = this.Property(value, path, properties);
        }
      }
    }
    return property;
  };

  Domain.prototype.Property.compile = function(properties, engine) {
    var key, property;
    for (key in properties) {
      property = properties[key];
      if (key === 'engine') {
        continue;
      }
      this.call(engine, property, key, properties);
    }
    return properties;
  };

  return Domain;

})();

module.exports = Domain;


},{}],5:[function(require,module,exports){

/* Base class: Engine

Engine is a base class for scripting environment.
It initializes and orchestrates all moving parts.

It operates over workers and domains. Workers are
separate engines running in web worker thread. 
Domains are either independent constraint graphs or
pseudo-solvers like DOM measurements.
 */
var Engine,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Engine = (function() {
  Engine.prototype.Command = require('./Command');

  Engine.prototype.Domain = require('./Domain');

  Engine.prototype.Update = require('./Update');

  Engine.prototype.Query = require('./Query');

  Engine.prototype.Solver = require('./domains/Linear');

  Engine.prototype.Input = require('./domains/Input');

  Engine.prototype.Data = require('./domains/Data');

  Engine.prototype.Output = require('./domains/Output');

  Engine.prototype.Console = require('./utilities/Console');

  Engine.prototype.Inspector = require('./utilities/Inspector');

  Engine.prototype.Exporter = require('./utilities/Exporter');

  function Engine(data, url) {
    var events, k, len, property, ref, value;
    this.engine = this;
    this.$prototype = Engine.prototype;
    if ((url != null) && (typeof Worker !== "undefined" && Worker !== null)) {
      this.url = this.getWorkerURL(url);
    }
    this.eventHandler = this.handleEvent.bind(this);
    this.listeners = {};
    ref = [this.events, this.$events, this.$$events];
    for (k = 0, len = ref.length; k < len; k++) {
      events = ref[k];
      this.addListeners(events);
    }
    this.observers = {};
    this.queries = {};
    this.lefts = [];
    this.pairs = {};
    this.variables = {};
    this.domains = [];
    this.stylesheets = [];
    this.imported = {};
    this.update = this.Update.compile(this);
    this.Domain.compile(this);
    this.data.setup();
    this.output.setup();
    this.inspector = new this.Inspector(this);
    this.exporter = new this.Exporter(this);
    this.values = this.output.values;
    if (data) {
      for (property in data) {
        value = data[property];
        this.data.values[property] = this.values[property] = value;
      }
    }
    if ((typeof window === "undefined" || window === null) && (typeof self !== "undefined" && self !== null)) {
      this.strategy = 'update';
    }
    if (typeof self !== "undefined" && self !== null) {
      self.addEventListener('error', this.eventHandler);
    }
    return this;
  }

  Engine.prototype.solve = function(a, b, c, d, e, f, g) {
    var args, result, strategy, transacting;
    if (!this.transacting) {
      this.transacting = transacting = true;
    }
    args = this.transact(a, b, c, d, e, f, g);
    if (typeof args[0] === 'function') {
      if (result = args.shift().apply(this, args)) {
        this.updating.apply(result);
      }
    } else if (args[0] != null) {
      strategy = this[this.strategy || 'input'];
      if (strategy.solve) {
        this.data.transact();
        this.console.start(strategy.displayName, args);
        strategy.solve.apply(strategy, args);
        this.console.end(result);
        result = this.data.commit();
      } else {
        result = strategy.apply(this, args);
      }
    }
    if (transacting) {
      this.transacting = void 0;
      return this.commit(result);
    }
  };

  Engine.prototype.propagate = function(values) {
    if (values) {
      this.updating.apply(values);
      this.output.merge(values);
    }
    return values;
  };

  Engine.prototype.transact = function() {
    var arg, args, index, k, len, problematic, reason;
    if (typeof arguments[0] === 'string') {
      reason = arguments[0];
      if (typeof arguments[1] === 'string') {
        arg = arguments[1];
      }
    }
    args = Array.prototype.slice.call(arguments, +(reason != null) + +(arg != null));
    if (!this.updating) {
      this.console.start(reason || (this.updated && 'Update' || 'Initialize'), arg || args);
      this.updating = new this.update;
      this.updating.start();
      this.triggerEvent('transact', this.updating);
    }
    if (!this.running) {
      this.compile();
    }
    problematic = void 0;
    for (index = k = 0, len = args.length; k < len; index = ++k) {
      arg = args[index];
      if (arg && typeof arg !== 'string') {
        if (problematic) {
          if (typeof arg === 'function') {
            this.then(arg);
            args.splice(index, 1);
            break;
          }
        } else {
          problematic = arg;
        }
      }
    }
    return args;
  };

  Engine.prototype.write = function(update) {
    this.output.merge(update.changes);
    return update.changes = void 0;
  };

  Engine.prototype.commit = function(solution, update) {
    var ref;
    if (update == null) {
      update = this.updating;
    }
    if (update.blocking) {
      return;
    }
    if (solution) {
      this.propagate(solution);
    }
    while (!(update.isDone() && !update.isDirty())) {
      this.triggerEvent('commit', update);
      if (update.blocking) {
        update.reset();
        return update;
      }
      this.triggerEvent('assign', update);
      this.triggerEvent('perform', update);
      if ((ref = update.busy) != null ? ref.length : void 0) {
        return update;
      }
      if (this.write(update) || ((update.written || update.reflown) && update.isDone())) {
        update.written = true;
        this.triggerEvent('validate', update);
      }
      update.commit();
    }
    if (update.hadSideEffects()) {
      this.triggerEvent('finish', update);
      this.fireEvent('solve', update.solution, update);
      this.fireEvent('solved', update.solution, update);
      return update.solution;
    } else {
      return this.triggerEvent('finish');
    }
  };

  Engine.prototype.resolve = function(domain, problems, index, update) {
    var k, len, problem, result;
    if (domain && !domain.solve && domain.postMessage) {
      update.postMessage(domain, problems);
      update.await(domain.url);
      return domain;
    }
    for (index = k = 0, len = problems.length; k < len; index = ++k) {
      problem = problems[index];
      if (problem instanceof Array && problem.length === 1 && problem[0] instanceof Array) {
        problem = problems[index] = problem[0];
      }
    }
    if (!domain) {
      return this.broadcast(problems, update);
    }
    this.console.start(domain.displayName, problems);
    result = domain.solve(problems) || void 0;
    if (result && result.postMessage) {
      update.await(result.url);
    } else {
      if ((result != null ? result.length : void 0) === 1) {
        result = result[0];
      }
    }
    this.console.end(result);
    return result;
  };

  Engine.prototype.broadcast = function(problems, update, insert) {
    var broadcasted, i, index, k, l, len, len1, len2, len3, locals, m, n, other, others, path, problem, property, ref, ref1, ref2, ref3, ref4, remove, removes, result, stacks, url, value, worker, working;
    if (update == null) {
      update = this.updating;
    }
    others = [];
    removes = [];
    if (insert) {
      if (update.domains[update.index + 1] !== null) {
        update.domains.splice(update.index, 0, null);
        update.problems.splice(update.index, 0, problems);
      } else {
        broadcasted = update.problems[update.index + 1];
        broadcasted.push.apply(broadcasted, problems);
      }
    }
    if (problems[0] === 'remove') {
      removes.push(problems);
    } else {
      for (k = 0, len = problems.length; k < len; k++) {
        problem = problems[k];
        if (problem[0] === 'remove') {
          removes.push(problem);
        } else {
          others.push(problem);
        }
      }
    }
    ref = [this.data, this.output].concat(this.domains);
    for (i = l = 0, len1 = ref.length; l < len1; i = ++l) {
      other = ref[i];
      locals = [];
      other.changes = void 0;
      stacks = other.stacks;
      for (m = 0, len2 = removes.length; m < len2; m++) {
        remove = removes[m];
        for (index = n = 0, len3 = remove.length; n < len3; index = ++n) {
          path = remove[index];
          if (index === 0) {
            continue;
          }
          if ((ref1 = other.paths) != null ? ref1[path] : void 0) {
            locals.push(path);
          } else if (((ref2 = other.watched) != null ? ref2[path] : void 0) || other.stacks) {
            other.remove(path);
          }
        }
      }
      if (other.changes) {
        ref3 = other.changes;
        for (property in ref3) {
          value = ref3[property];
          (result || (result = {}))[property] = value;
        }
        other.changes = void 0;
      }
      if (locals.length) {
        locals.unshift('remove');
        locals.index = -1;
        update.push([locals], other, true);
      }
      if (others.length) {
        update.push(others, other);
      }
    }
    if (typeof problems[0] === 'string') {
      problems = [problems];
    }
    ref4 = this.workers;
    for (url in ref4) {
      worker = ref4[url];
      working = problems.filter(function(command) {
        var ref5;
        return command[0] !== 'remove' || ((ref5 = worker.paths) != null ? ref5[command[1]] : void 0);
      });
      update.push(working, worker, true);
    }
    if (result) {
      update.apply(result);
    }
  };

  Engine.prototype.compile = function() {
    var domain, name;
    for (name in this) {
      domain = this[name];
      if (domain && domain !== this && domain.engine) {
        if (typeof domain.compile === "function") {
          domain.compile();
        }
      }
    }
    this.running = true;
    return this.triggerEvent('compile', this);
  };

  Engine.prototype.fireEvent = function(name, data, object) {
    this.triggerEvent(name, data, object);
  };

  Engine.prototype.$events = {
    cleanup: function() {
      return this.updated = void 0;
    },
    perform: function(update) {
      var ref;
      if (update.domains.length) {
        if (!((ref = update.busy) != null ? ref.length : void 0)) {
          this.console.start('Solvers', update.problems.slice(update.index + 1));
          update.each(this.resolve, this);
          this.console.end(update.changes);
        }
        this.output.merge(update.solution);
      }
      return this.propagate(this.data.commit());
    },
    finish: function(update) {
      this.console.end(update != null ? update.solution : void 0);
      this.updating = void 0;
      clearTimeout(this.gc);
      this.gc = setTimeout((function(_this) {
        return function() {
          return _this.cleanup();
        };
      })(this), 3000);
      if (update) {
        this.inspector.update();
        return this.updated = update;
      }
    },
    commit: function(update) {
      while (!update.isDocumentDone()) {
        this.Query.prototype.commit(this.input);
        this.Query.prototype.repair(this.input);
        this.Query.prototype.branch(this.input);
        this;
      }
    },
    remove: function(path) {
      var k, len, paths, ranges, ref, ref1, results, subpath;
      this.output.remove(path);
      this.data.remove(path);
      if ((ref = this.updating) != null) {
        ref.remove(path);
      }
      if (this.ranges) {
        paths = this.input.Query.prototype.getVariants(path);
        results = [];
        for (k = 0, len = paths.length; k < len; k++) {
          subpath = paths[k];
          if (ranges = (ref1 = this.ranges) != null ? ref1[subpath] : void 0) {
            delete this.ranges[subpath];
            if (!Object.keys(this.ranges).length) {
              results.push(this.ranges = void 0);
            } else {
              results.push(void 0);
            }
          } else {
            results.push(void 0);
          }
        }
        return results;
      }
    },
    assign: function(update) {
      var assignments, changes, constraints, continuation, index, operation, path, range, ranges, ref, tickers;
      while (!!(assignments = update.assignments) + !!(ranges = update.ranges)) {
        if (assignments) {
          this.console.start('Assignments', assignments);
          index = 0;
          while (path = assignments[index]) {
            this.data.set(path, null, assignments[index + 1], assignments[index + 2], assignments[index + 3]);
            index += 4;
          }
          update.assignments = void 0;
          changes = this.propagate(this.data.commit());
          this.console.end(changes);
        }
        if (ranges) {
          this.console.start('Ranges', this.ranges);
          ref = this.ranges;
          for (continuation in ref) {
            tickers = ref[continuation];
            index = 0;
            while (operation = tickers[index]) {
              range = tickers[index + 2];
              if (range.update !== update) {
                range.update = update;
                if (operation.command.update(range, this, operation, continuation, tickers[index + 1])) {
                  tickers.splice(index, 3);
                  if (!tickers.length) {
                    delete this.ranges[continuation];
                    if (!Object.keys(this.ranges).length) {
                      this.ranges = void 0;
                    }
                  }
                  continue;
                }
              }
              index += 3;
            }
          }
          this.console.end();
          this.updating.ranges = void 0;
        }
      }
      this.propagate(this.data.commit());
      if (constraints = update.constraints) {
        index = 0;
        this.console.start('Constraints', constraints);
        while (operation = constraints[index]) {
          this.update(operation, void 0, void 0, constraints[index + 1]);
          index += 2;
        }
        update.constraints = void 0;
        return this.console.end();
      }
    },
    destroy: function(e) {
      if (this.worker) {
        this.worker.removeEventListener('message', this.eventHandler);
        this.worker.removeEventListener('error', this.eventHandler);
      }
      return typeof self !== "undefined" && self !== null ? self.removeEventListener('error', this.eventHandler) : void 0;
    },
    message: function(e) {
      var base, property, ref, ref1, value, values;
      values = (base = e.target).values || (base.values = {});
      ref = e.data;
      for (property in ref) {
        value = ref[property];
        if (value != null) {
          values[property] = value;
        } else {
          delete values[property];
        }
      }
      if ((ref1 = this.updating) != null ? ref1.busy.length : void 0) {
        this.updating.solutions[this.updating.solutions.indexOf(e.target, this.updating.index)] = e.data;
        this.updating.busy.splice(this.updating.busy.indexOf(e.target.url), 1);
        return this.commit(e.data);
      }
    },
    error: function(e) {
      this.updating = void 0;
      if ((typeof window !== "undefined" && window !== null) && e.target !== window) {
        throw new Error(e.message + " (" + e.filename + ":" + e.lineno + ")");
      }
    }
  };

  Engine.prototype.getWorkerURL = (function() {
    var ref, ref1, scripts, src;
    if (typeof document !== "undefined" && document !== null) {
      scripts = document.getElementsByTagName('script');
      src = scripts[scripts.length - 1].src;
      if (!src.match(/gss/i)) {
        src = (ref = document.querySelectorAll('script[src*=gss]')) != null ? (ref1 = ref[0]) != null ? ref1.src : void 0 : void 0;
      }
    }
    return function(url) {
      if (typeof url !== 'string') {
        url = src;
      }
      if (!url) {
        throw new Error("Can not detect GSS source file to set up worker.\n\n- You can rename the gss file to contain \"gss\" in it:\n  `<script src=\"my-custom-path/my-gss.js\"></script>`\n\n- or provide worker path explicitly: \n  `GSS(<scope>, \"http://absolute.path/to/worker.js\")`");
      }
      return url;
    };
  })();

  Engine.prototype.useWorker = function(url) {
    var base;
    if (typeof url !== 'string') {
      return;
    }
    if (typeof Worker === "undefined" || Worker === null) {
      return;
    }
    if (!url.match(/^http:/i) && (typeof location !== "undefined" && location !== null ? location.protocol.match(/^file:/i) : void 0)) {
      return;
    }
    (base = this.engine).worker || (base.worker = this.engine.getWorker(url));
    this.solve = (function(_this) {
      return function(commands) {
        var base1;
        (base1 = _this.engine).updating || (base1.updating = new _this.update);
        _this.engine.updating.postMessage(_this.worker, commands);
        return _this.worker;
      };
    })(this);
    return this.worker;
  };

  Engine.prototype.getWorker = function(url) {
    var base, base1, base2, worker;
    worker = (base = ((base1 = this.engine).workers || (base1.workers = {})))[url] || (base[url] = (base2 = (Engine.workers || (Engine.workers = {})))[url] || (base2[url] = new Worker(url)));
    worker.url || (worker.url = url);
    worker.addEventListener('message', this.engine.eventHandler);
    worker.addEventListener('error', this.engine.eventHandler);
    return worker;
  };

  Engine.prototype.getVariableDomainByConvention = function(operation, Default) {
    var i, path, property, props;
    if (operation.domain) {
      return operation.domain;
    }
    path = operation[1];
    if ((i = path.indexOf('[')) > -1) {
      property = path.substring(i + 1, path.length - 1);
    }
    if (this.data.values.hasOwnProperty(path)) {
      return this.data;
    } else if (property) {
      if (props = this.data.properties) {
        if ((props[path] != null) || (props[property] && !props[property].matcher)) {
          return this.data;
        }
      }
      if (property.indexOf('computed-') === 0 || property.indexOf('intrinsic-') === 0) {
        return this.data;
      }
    }
  };

  Engine.prototype.getPath = function(id, property) {
    var ref;
    if (!property) {
      property = id;
      id = void 0;
    }
    if (property.indexOf('[') > -1 || !id) {
      return property;
    } else {
      if (typeof id !== 'string') {
        id = this.identify(id);
      }
      if (id === ((ref = this.scope) != null ? ref._gss_id : void 0) && !this.data.check(id, property)) {
        return property;
      }
      if (id.substring(0, 2) === '$"') {
        id = id.substring(1);
      }
      return id + '[' + property + ']';
    }
  };

  Engine.prototype.url = false;

  Engine.prototype.getVariableDomain = function(operation, Default) {
    var domain, op, ref, ref1, ref2, ref3;
    if (domain = this.getVariableDomainByConvention(operation)) {
      return domain;
    }
    if (Default) {
      return Default;
    }
    if (op = (ref = this.variables[operation[1]]) != null ? (ref1 = ref.constraints) != null ? (ref2 = ref1[0]) != null ? (ref3 = ref2.operations[0]) != null ? ref3.domain : void 0 : void 0 : void 0 : void 0) {
      return op;
    }
    if (this.solver.url) {
      return this.solver;
    } else {
      return this.solver.maybe();
    }
  };

  Engine.prototype.getScopeElement = function(node) {
    switch (node.tagName) {
      case 'HTML':
      case 'BODY':
      case 'HEAD':
        return document;
      case 'STYLE':
      case 'LINK':
        if (node.scoped) {
          return this.getScopeElement(node.parentNode);
        }
    }
    return node;
  };

  Engine.prototype.indexOfTriplet = function(array, a, b, c) {
    var index, k, len, op;
    if (array) {
      for (index = k = 0, len = array.length; k < len; index = k += 3) {
        op = array[index];
        if (op === a && array[index + 1] === b && array[index + 2] === c) {
          return index;
        }
      }
    }
    return -1;
  };

  Engine.prototype.cleanup = function() {
    return this.triggerEvent('cleanup');
  };

  Engine.prototype.destroy = function() {
    clearTimeout(this.gc);
    this.cleanup();
    this.triggerEvent('destroy');
    if (this.events) {
      return this.removeListeners(this.events);
    }
  };

  Engine.prototype.addListeners = function(listeners) {
    var callback, name, results;
    results = [];
    for (name in listeners) {
      callback = listeners[name];
      results.push(this.addEventListener(name, callback));
    }
    return results;
  };

  Engine.prototype.removeListeners = function(listeners) {
    var callback, name, results;
    results = [];
    for (name in listeners) {
      callback = listeners[name];
      results.push(this.removeEventListener(name, callback));
    }
    return results;
  };

  Engine.prototype.once = function(type, fn) {
    fn.once = true;
    return this.addEventListener(type, fn);
  };

  Engine.prototype.addEventListener = function(type, fn) {
    var base;
    return ((base = this.listeners)[type] || (base[type] = [])).push(fn);
  };

  Engine.prototype.removeEventListener = function(type, fn) {
    var group, index;
    if (group = this.listeners[type]) {
      if ((index = group.indexOf(fn)) > -1) {
        return group.splice(index, 1);
      }
    }
  };

  Engine.prototype.triggerEvent = function(type, a, b, c) {
    var fn, group, index, j, method, ref;
    if (group = (ref = this.listeners) != null ? ref[type] : void 0) {
      index = 0;
      j = group.length;
      while (index < j) {
        if (fn = group[index]) {
          if (fn.once) {
            group.splice(index--, 1);
            j--;
          }
          fn.call(this, a, b, c);
        }
        index++;
      }
    }
    if (this[method = 'on' + type]) {
      return this[method](a, b, c);
    }
  };

  Engine.prototype.dispatchEvent = function(element, type, data, bubbles, cancelable) {
    var detail, e, event, prop, value;
    if (!this.scope) {
      return;
    }
    detail = {
      engine: this
    };
    for (prop in data) {
      value = data[prop];
      detail[prop] = value;
    }
    try {
      event = new window.CustomEvent(type, {
        detail: detail,
        bubbles: bubbles,
        cancelable: cancelable
      });
    } catch (_error) {
      e = _error;
      window.CustomEvent = function(event, params) {
        var evt;
        params = params || {
          bubbles: false,
          cancelable: false,
          detail: void 0
        };
        evt = document.createEvent("CustomEvent");
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
      };
      window.CustomEvent.prototype = window.Event.prototype;
      event = new window.CustomEvent(type, {
        detail: detail,
        bubbles: bubbles,
        cancelable: cancelable
      });
    }
    return element.dispatchEvent(event);
  };

  Engine.prototype.handleEvent = function(e) {
    return this.triggerEvent(e.type, e);
  };

  Engine.prototype.then = function(callback) {
    return this.once('solve', callback);
  };

  return Engine;

})();

Engine.prototype.Identity = (function() {
  function Identity() {
    this.set = bind(this.set, this);
  }

  Identity.uid = 0;

  Identity.prototype.excludes = ['$'.charCodeAt(0), ':'.charCodeAt(0), '@'.charCodeAt(0)];

  Identity.prototype.set = function(object, generate) {
    var id;
    if (!object) {
      return '';
    }
    if (typeof object === 'string') {
      if (this.excludes.indexOf(object.charCodeAt(0)) === -1) {
        return '$' + object;
      }
      return object;
    }
    if (!(id = object._gss_id)) {
      if (object === document) {
        id = "::document";
      } else if (object === window) {
        id = "::window";
      }
      if (generate !== false) {
        object._gss_id = id || (id = "$" + (object.id || object._gss_uid || ++Identity.uid));
        this[id] = object;
      }
    }
    return id;
  };

  Identity.prototype.get = function(id) {
    return this[id];
  };

  Identity.prototype.solve = function(id) {
    return this[id];
  };

  Identity.prototype.unset = function(element) {
    var id;
    if (id = element._gss_id) {
      delete this[id];
      return element._gss_id = void 0;
    }
  };

  Identity.prototype.find = function(object) {
    return this.set(object, false);
  };

  return Identity;

})();

if ((typeof self !== "undefined" && self !== null) && !self.window && self.onmessage !== void 0) {
  self.addEventListener('message', function(e) {
    var commands, data, engine, property, removes, result, solution, value, values;
    if (!(engine = Engine.messenger)) {
      engine = Engine.messenger = new Engine();
    }
    data = e.data;
    values = void 0;
    commands = [];
    removes = [];
    solution = engine.solve(function() {
      var command, index, k, len, ref;
      if ((values = data[0]) && !values.push) {
        for (index = k = 0, len = data.length; k < len; index = ++k) {
          command = data[index];
          if (index) {
            if (command[0] === 'remove') {
              removes.push(command);
            } else {
              if (((ref = command[0]) != null ? ref.key : void 0) != null) {
                command[1].parent = command;
                command.index = command[0].index;
              }
              commands.push(command);
            }
          }
        }
      }
      if (removes.length) {
        this.solve(removes);
        if (this.updating.domains[0] === null) {
          this.broadcast(this.updating.problems[0]);
          this.updating.index++;
        }
      }
      if (values) {
        this.data.merge(values);
      }
      if (commands.length) {
        return this.solve(commands);
      }
    });
    result = {};
    if (values) {
      for (property in values) {
        value = values[property];
        result[property] = value;
      }
      for (property in solution) {
        value = solution[property];
        result[property] = value;
      }
    }
    if (!engine.domains.length) {
      engine.variables = {};
      engine.solver.operations = void 0;
    }
    return postMessage(result);
  });
}

Engine.prototype.console = new Engine.prototype.Console;

Engine.prototype.identity = new Engine.prototype.Identity;

Engine.prototype.identify = Engine.prototype.identity.set;

Engine.prototype.clone = function(object) {
  if (object && object.map) {
    return object.map(this.clone, this);
  }
  return object;
};

module.exports = Engine;


},{"./Command":3,"./Domain":4,"./Query":7,"./Update":8,"./domains/Data":14,"./domains/Input":15,"./domains/Linear":16,"./domains/Output":17,"./utilities/Console":18,"./utilities/Exporter":19,"./utilities/Inspector":20}],6:[function(require,module,exports){

/* Constructor: GSS
  Dispatches arguments by type
  When element is given, creates Document
  Otherwise creates abstract Engine
 */
var GSS;

GSS = function() {
  var argument, data, engine, i, id, index, len, parent, scope, url;
  for (index = i = 0, len = arguments.length; i < len; index = ++i) {
    argument = arguments[index];
    if (!argument) {
      continue;
    }
    switch (typeof argument) {
      case 'object':
        if (argument.nodeType) {
          scope = argument;
        } else {
          data = argument;
        }
        break;
      case 'string':
      case 'boolean':
        url = argument;
    }
  }
  if (!(this instanceof GSS) && scope) {
    parent = scope;
    while (parent) {
      if (id = GSS.identity.find(parent)) {
        if (engine = GSS.Engine[id]) {
          return engine;
        }
      }
      if (!parent.parentNode) {
        break;
      }
      parent = parent.parentNode;
    }
  }
  if (scope && GSS.Document) {
    return new GSS.Document(data, url, scope);
  } else {
    return new GSS.Engine(data, url, scope);
  }
};

GSS.Engine = require('./Engine');

GSS.identity = GSS.Engine.prototype.identity;

GSS.identify = GSS.Engine.prototype.identify;

GSS.console = GSS.Engine.prototype.console;

module.exports = GSS;


},{"./Engine":5}],7:[function(require,module,exports){
var Command, Query,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Command = require('./Command');

Query = (function(superClass) {
  extend(Query, superClass);

  Query.prototype.type = 'Query';

  function Query(operation) {
    this.key = this.path = this.serialize(operation);
  }

  Query.prototype.ascend = function(engine, operation, continuation, scope, result, ascender, ascending) {
    var base, base1, contd, k, len, node, parent, ref1, ref2, yielded;
    if (parent = operation.parent) {
      if (this.isCollection(result)) {
        for (k = 0, len = result.length; k < len; k++) {
          node = result[k];
          contd = this.fork(engine, continuation, node);
          if (yielded = typeof (base = parent.command)["yield"] === "function" ? base["yield"](node, engine, operation, contd, scope, ascender, ascending) : void 0) {
            if ((ref1 = yielded.command) != null) {
              ref1.solve(yielded.domain || engine, yielded, contd, scope, -1, node);
            }
          } else {
            parent.command.solve(engine, parent, contd, scope, parent.indexOf(operation), node);
          }
        }
      } else {
        if (yielded = typeof (base1 = parent.command)["yield"] === "function" ? base1["yield"](result, engine, operation, continuation, scope, ascender, ascending) : void 0) {
          return (ref2 = yielded.command) != null ? ref2.solve(yielded.domain || engine, yielded, continuation, scope, -1, result) : void 0;
        } else if ((ascender != null) || !this.hidden || !this.reference) {
          return parent.command.solve(engine, parent, continuation, scope, parent.indexOf(operation), result);
        } else {
          return result;
        }
      }
    }
  };

  Query.prototype.serialize = function(operation) {
    var argument, cmd, index, k, length, ref1, ref2, start, string;
    if (this.prefix != null) {
      string = this.prefix;
    } else {
      string = operation[0];
    }
    if (typeof operation[1] === 'object') {
      start = 2;
    }
    length = operation.length;
    for (index = k = ref1 = start || 1, ref2 = length; ref1 <= ref2 ? k < ref2 : k > ref2; index = ref1 <= ref2 ? ++k : --k) {
      if (argument = operation[index]) {
        if (cmd = argument.command) {
          string += cmd.key;
        } else {
          string += argument;
          if (length - 1 > index) {
            string += this.separator;
          }
        }
      }
    }
    if (this.suffix) {
      string += this.suffix;
    }
    return string;
  };

  Query.prototype.push = function(operation, context) {
    var arg, cmd, i, index, inherited, k, l, len, m, match, n, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, tag, tags;
    if (context) {
      if (this.proxy) {
        this.proxied = context.command.path;
      }
      this.inherit(context.command, inherited, context);
    }
    for (index = k = 1, ref1 = operation.length; 1 <= ref1 ? k < ref1 : k > ref1; index = 1 <= ref1 ? ++k : --k) {
      if (cmd = (ref2 = operation[index]) != null ? ref2.command : void 0) {
        inherited = this.inherit(cmd, inherited, context);
      }
    }
    if (tags = this.tags) {
      for (i = l = 0, len = tags.length; l < len; i = ++l) {
        tag = tags[i];
        if (context) {
          if (cmd = context.command) {
            if ((((ref3 = cmd.tags) != null ? ref3.indexOf(tag) : void 0) > -1) && this.checkers[tag](this, cmd, operation, context, inherited)) {
              inherited = this.mergers[tag](this, cmd, operation, context);
            }
          }
        }
        match = true;
        for (index = m = 1, ref4 = operation.length; 1 <= ref4 ? m < ref4 : m > ref4; index = 1 <= ref4 ? ++m : --m) {
          if (cmd = (ref5 = (arg = operation[index])) != null ? ref5.command : void 0) {
            if (!(((ref6 = cmd.tags) != null ? ref6.indexOf(tag) : void 0) > -1) || !this.checkers[tag](this, cmd, operation, arg, inherited)) {
              match = false;
              break;
            }
          }
        }
        if (match) {
          inherited = false;
          for (index = n = 1, ref7 = operation.length; 1 <= ref7 ? n < ref7 : n > ref7; index = 1 <= ref7 ? ++n : --n) {
            if (cmd = (ref8 = (arg = operation[index])) != null ? ref8.command : void 0) {
              inherited = this.mergers[tag](this, cmd, operation, arg, inherited);
            }
          }
        }
      }
    }
    return this;
  };

  Query.prototype.inherit = function(command, inherited, context) {
    var path, proxied;
    if (command.scoped) {
      this.scoped = command.scoped;
    }
    if (path = command.path) {
      if (proxied = (proxied = this.proxied)) {
        path = path.slice(proxied.length);
      }
      if (inherited) {
        this.path += this.separator + path;
      } else {
        this.path = path + this.path;
      }
    }
    return true;
  };

  Query.prototype["continue"] = function(engine, operation, continuation) {
    if (continuation == null) {
      continuation = '';
    }
    return continuation + this.getKey(engine, operation, continuation);
  };

  Query.prototype.jump = function(engine, operation, continuation, scope, ascender, ascending) {
    var ref1, ref2, tail;
    if (tail = this.tail) {
      if ((((ref1 = tail[1]) != null ? (ref2 = ref1.command) != null ? ref2.key : void 0 : void 0) != null) && (ascender == null) && (continuation.lastIndexOf(this.PAIR) === continuation.indexOf(this.PAIR))) {
        return tail[1].command.solve(engine, tail[1], continuation, scope);
      }
    }
    return this.head.command.perform(engine, this.head, continuation, scope, ascender, ascending);
  };

  Query.prototype.prepare = function() {};

  Query.prototype.mergers = {};

  Query.prototype.checkers = {};

  Query.prototype.before = function(args, engine, operation, continuation, scope, ascender, ascending) {
    var alias, node, query, ref1, ref2, ref3, ref4;
    node = ((ref1 = args[0]) != null ? ref1.nodeType : void 0) === 1 ? args[0] : scope;
    query = this.getGlobalPath(engine, operation, continuation, node);
    alias = ((ref2 = engine.updating.aliases) != null ? ref2[query] : void 0) || query;
    if ((ref3 = engine.updating.queries) != null ? ref3.hasOwnProperty(alias) : void 0) {
      return engine.updating.queries[alias];
    }
    return (ref4 = engine.updating.queries) != null ? ref4[query] : void 0;
  };

  Query.prototype.after = function(args, result, engine, operation, continuation, scope) {
    var added, alias, aliases, base, child, index, isCollection, k, l, len, len1, node, old, path, query, ref1, ref2, ref3, removed, updating;
    updating = engine.updating;
    node = this.precontextualize(engine, scope, args[0]);
    path = this.getLocalPath(engine, operation, continuation, node);
    if (!this.relative) {
      query = this.getGlobalPath(engine, operation, continuation, node);
      aliases = updating.aliases || (updating.aliases = {});
      if (!(alias = aliases[query]) || alias.length > path.length || !((ref1 = updating.queries) != null ? ref1.hasOwnProperty(alias) : void 0)) {
        aliases[query] = path;
      }
    }
    old = this.get(engine, path);
    (updating.queries || (updating.queries = {}))[path] = result;
    if ((ref2 = updating.snapshots) != null ? ref2.hasOwnProperty(path) : void 0) {
      old = updating.snapshots[path];
    } else if ((old == null) && (result && result.length === 0) && continuation) {
      old = this.getCanonicalCollection(engine, path);
    }
    isCollection = this.isCollection(result);
    if (old) {
      if (this.isCollection(old)) {
        removed = void 0;
        for (index = k = 0, len = old.length; k < len; index = ++k) {
          child = old[index];
          if (!old.scopes || ((ref3 = old.scopes) != null ? ref3[index] : void 0) === scope) {
            if (!result || Array.prototype.indexOf.call(result, child) === -1) {
              (removed || (removed = [])).push(child);
            }
          }
        }
      } else if (result !== old) {
        if (!result) {
          removed = old;
        }
        this.clean(engine, path, void 0, operation, scope);
      } else if (!this.unexpiring) {
        return;
      }
    }
    if (isCollection) {
      (base = engine.queries)[path] || (base[path] = []);
      added = void 0;
      for (l = 0, len1 = result.length; l < len1; l++) {
        child = result[l];
        if (!old || Array.prototype.indexOf.call(old, child) === -1) {
          (added || (added = [])).push(child);
          added.isCollection = true;
        }
      }
      if (result && result.item) {
        result = Array.prototype.slice.call(result, 0);
      }
    } else {
      added = result;
      removed = old;
    }
    if (this.write(engine, operation, continuation, scope, node, path, result, old, added, removed)) {
      this.set(engine, path, result);
    }
    return added;
  };

  Query.prototype.write = function(engine, operation, continuation, scope, node, path, result, old, added, removed) {
    if (result != null ? result.operations : void 0) {
      this.reduce(engine, operation, path, scope, void 0, void 0, void 0, continuation);
    } else {
      this.reduce(engine, operation, path, scope, added, removed, void 0, continuation);
    }
    this.subscribe(engine, operation, continuation, scope, node);
    this.snapshot(engine, path, old);
    if (result !== old) {
      return !(result != null ? result.push : void 0);
    }
  };

  Query.prototype.subscribe = function(engine, operation, continuation, scope, node) {
    var base, base1, id, observers;
    id = engine.identify(node);
    observers = (base = engine.engine.observers)[id] || (base[id] = []);
    if (engine.indexOfTriplet(observers, operation, continuation, scope) === -1) {
      if (typeof (base1 = operation.command).prepare === "function") {
        base1.prepare(operation);
      }
      return observers.push(operation, continuation, scope);
    }
  };

  Query.prototype.commit = function(engine, solution) {
    var collection, contd, deferred, i, index, item, k, mutations, old, op, ref1, watcher;
    if (mutations = engine.updating.mutations) {
      engine.console.start('Queries', mutations.slice());
      index = 0;
      while (mutations[index]) {
        watcher = mutations.splice(0, 3);
        engine.input.solve(watcher[0], watcher[1], watcher[2]);
      }
      engine.updating.mutations = void 0;
      engine.console.end();
    }
    if (deferred = engine.updating.deferred) {
      index = 0;
      engine.console.start('Deferred', deferred);
      while (deferred[index]) {
        contd = deferred[index + 1];
        collection = this.get(engine, contd);
        op = deferred[index];
        if (!op.command.singular) {
          if (old = (ref1 = engine.updating.snapshots) != null ? ref1[contd] : void 0) {
            collection = collection.slice();
            collection.isCollection = true;
            for (i = k = collection.length - 1; k >= 0; i = k += -1) {
              item = collection[i];
              if (old.indexOf(item) > -1) {
                collection.splice(i, 1);
              }
            }
          }
          if (collection != null ? collection.length : void 0) {
            op.command.ascend(engine.input, op, contd, deferred[index + 2], collection);
          }
        } else {
          op.command.solve(engine.input, op, contd, deferred[index + 2], true);
        }
        index += 3;
      }
      engine.updating.deferred = void 0;
      engine.console.end();
    }
  };

  Query.prototype.add = function(engine, node, continuation, operation, scope, key, contd) {
    var base, base1, collection, continuations, dup, duplicates, el, index, k, l, len, len1, operations, parent, ref1, scopes;
    collection = (base = engine.queries)[continuation] || (base[continuation] = []);
    if (!collection.push) {
      return;
    }
    collection.isCollection = true;
    operations = collection.operations || (collection.operations = []);
    continuations = collection.continuations || (collection.continuations = []);
    scopes = collection.scopes || (collection.scopes = []);
    if (engine.pairs[continuation]) {
      ((base1 = engine.updating).pairs || (base1.pairs = {}))[continuation] = true;
    }
    this.snapshot(engine, continuation, collection);
    if ((index = collection.indexOf(node)) === -1) {
      for (index = k = 0, len = collection.length; k < len; index = ++k) {
        el = collection[index];
        if (!this.comparePosition(el, node, operations[index], key)) {
          break;
        }
      }
      collection.splice(index, 0, node);
      operations.splice(index, 0, key);
      continuations.splice(index, 0, contd);
      scopes.splice(index, 0, scope);
      this.chain(engine, collection[index - 1], node, continuation);
      this.chain(engine, node, collection[index + 1], continuation);
      parent = operation;
      while (parent = parent.parent) {
        if (!(parent.command.sequence && parent[parent.length - 1] === operation)) {
          break;
        }
      }
      if (parent[0] === 'rule') {
        if (continuation === this.getCanonicalPath(continuation)) {
          if ((ref1 = engine.Stylesheet) != null) {
            ref1.match(engine, node, continuation, true);
          }
        }
      }
      return true;
    } else if (!(scopes[index] === scope && continuations[index] === contd)) {
      duplicates = (collection.duplicates || (collection.duplicates = []));
      for (index = l = 0, len1 = duplicates.length; l < len1; index = ++l) {
        dup = duplicates[index];
        if (dup === node) {
          if (scopes[index] === scope && continuations[index] === contd) {
            return;
          }
        }
      }
      duplicates.push(node);
      operations.push(key);
      continuations.push(contd);
      scopes.push(scope);
      return;
    }
    return collection;
  };

  Query.prototype.get = function(engine, continuation) {
    return engine.queries[continuation];
  };

  Query.prototype.unobserve = function(engine, id, path, continuation, scope) {
    var base, index, observers, query, refs, subscope, watcher;
    if (typeof id === 'object') {
      observers = id;
      id = void 0;
    } else {
      if (!(observers = engine.observers[id])) {
        return;
      }
    }
    if (path !== true) {
      refs = this.getVariants(path);
    }
    index = 0;
    while (watcher = observers[index]) {
      query = observers[index + 1];
      if (refs && refs.indexOf(query) === -1) {
        index += 3;
        continue;
      }
      subscope = observers[index + 2];
      observers.splice(index, 3);
      if ((id != null) && (engine.identity[id] != null)) {
        if (typeof (base = watcher.command).onClean === "function") {
          base.onClean(engine, watcher, query, watcher, subscope);
        }
        this.clean(engine, watcher, query, watcher, subscope, continuation);
        if (!observers.length) {
          delete engine.observers[id];
        }
      }
    }
  };

  Query.prototype.snapshot = function(engine, key, collection) {
    var base, c, snapshots;
    if ((snapshots = (base = engine.updating).snapshots || (base.snapshots = {})).hasOwnProperty(key)) {
      return;
    }
    if (collection != null ? collection.push : void 0) {
      c = collection.slice();
      if (collection.isCollection) {
        c.isCollection = true;
      }
      if (collection.duplicates) {
        c.duplicates = collection.duplicates.slice();
      }
      if (collection.scopes) {
        c.scopes = collection.scopes.slice();
      }
      if (collection.operations) {
        c.operations = collection.operations.slice();
      }
      collection = c;
    }
    return snapshots[key] = collection;
  };

  Query.prototype.defer = function(engine, operation, continuation, scope) {
    var base;
    (base = engine.updating).deferred || (base.deferred = []);
    if (engine.indexOfTriplet(engine.updating.deferred, operation, continuation, scope) === -1) {
      return engine.updating.deferred.push(operation, continuation, scope);
    }
  };

  Query.prototype.removeFromCollection = function(engine, node, continuation, operation, scope, needle, contd) {
    var collection, continuations, dup, duplicate, duplicates, index, k, len, length, negative, operations, parent, ref1, refs, scopes;
    collection = this.get(engine, continuation);
    length = collection.length;
    operations = collection.operations;
    continuations = collection.continuations;
    scopes = collection.scopes;
    duplicate = null;
    refs = this.getVariants(contd);
    if ((duplicates = collection.duplicates)) {
      for (index = k = 0, len = duplicates.length; k < len; index = ++k) {
        dup = duplicates[index];
        if (dup === node) {
          if (refs.indexOf(continuations[length + index]) > -1 && scopes[length + index] === scope) {
            this.snapshot(engine, continuation, collection);
            duplicates.splice(index, 1);
            operations.splice(length + index, 1);
            continuations.splice(length + index, 1);
            scopes.splice(length + index, 1);
            return false;
          } else {
            if (duplicate == null) {
              duplicate = index;
            }
          }
        }
      }
    }
    if (operation && length && (needle != null)) {
      this.snapshot(engine, continuation, collection);
      if ((index = collection.indexOf(node)) > -1) {
        if (operations) {
          negative = false;
          if (scopes[index] !== scope) {
            return null;
          }
          if (refs.indexOf(continuations[index]) === -1) {
            return null;
          }
          if (duplicate != null) {
            duplicates.splice(duplicate, 1);
            continuations[index] = continuations[duplicate + length];
            continuations.splice(duplicate + length, 1);
            operations[index] = operations[duplicate + length];
            operations.splice(duplicate + length, 1);
            scopes[index] = scopes[duplicate + length];
            scopes.splice(duplicate + length, 1);
            return false;
          }
        }
        collection.splice(index, 1);
        if (operations) {
          operations.splice(index, 1);
          continuations.splice(index, 1);
          scopes.splice(index, 1);
        }
        this.chain(engine, collection[index - 1], node, continuation);
        this.chain(engine, node, collection[index], continuation);
        parent = operation;
        while (parent = parent.parent) {
          if (!(parent.command.sequence && parent[parent.length - 1] === operation)) {
            break;
          }
        }
        if (parent[0] === 'rule') {
          if ((ref1 = engine.Stylesheet) != null) {
            ref1.match(engine, node, continuation, false);
          }
        }
        return true;
      }
    }
    return false;
  };

  Query.prototype.remove = function(engine, id, continuation, operation, scope, needle, recursion, contd) {
    var base, base1, collection, node, parent, ref, ref1, removed;
    if (needle == null) {
      needle = operation;
    }
    if (contd == null) {
      contd = continuation;
    }
    if (typeof id === 'object') {
      node = id;
      id = engine.identity.find(id);
    } else {
      if (id.indexOf('"') > -1) {
        node = id;
      } else {
        node = engine.identity[id];
      }
    }
    if (engine.pairs[continuation]) {
      ((base = engine.updating).pairs || (base.pairs = {}))[continuation] = true;
    }
    collection = this.get(engine, continuation);
    if (collection && this.isCollection(collection)) {
      this.snapshot(engine, continuation, collection);
      removed = this.removeFromCollection(engine, node, continuation, operation, scope, needle, contd);
    }
    if (removed !== false) {
      if (this.isCollection(collection)) {
        ref = continuation + id;
      } else {
        ref = continuation;
      }
      if (parent = operation != null ? operation.parent : void 0) {
        if (typeof (base1 = parent.command).release === "function") {
          base1.release(node, engine, operation, ref, scope);
        }
        while (parent) {
          if (!(parent.command.sequence && parent[parent.length - 1] === operation)) {
            break;
          }
          parent = parent.parent;
        }
        if (parent[0] === 'rule') {
          if ((ref1 = engine.Stylesheet) != null) {
            ref1.match(engine, node, continuation, false);
          }
        }
      }
      this.unobserve(engine, id, ref, ref);
      if (recursion !== continuation) {
        if (removed !== false) {
          this.reduce(engine, operation, continuation, scope, recursion, node, continuation, contd);
        }
        if (removed) {
          this.clean(engine, continuation + id, void 0, void 0, node.scoped && node.parentNode);
        }
      }
    }
    return removed;
  };

  Query.prototype.getKey = function() {
    return this.key || '';
  };

  Query.prototype.clean = function(engine, path, continuation, operation, scope, contd) {
    var command, key, result;
    if (contd == null) {
      contd = continuation;
    }
    if (command = path.command) {
      if (key = command.getKey(engine, operation, continuation)) {
        path = continuation + key;
      } else {
        path = this.delimit(continuation);
      }
    }
    if ((result = this.get(engine, path)) !== void 0) {
      this.each(this.remove, engine, result, path, operation, scope, operation, false, contd);
    }
    this.set(engine, path, void 0);
    if (engine.updating.mutations) {
      this.unobserve(engine, engine.updating.mutations, path);
    }
    this.unobserve(engine, engine.identify(scope || engine.scope), path);
    if (!result || !this.isCollection(result)) {
      engine.triggerEvent('remove', path);
    }
    return true;
  };

  Query.prototype.chain = function(engine, left, right, continuation) {
    if (left) {
      this.match(engine, left, ':last', '*', void 0, continuation);
      this.match(engine, left, ':next', '*', void 0, continuation);
    }
    if (right) {
      this.match(engine, right, ':previous', '*', void 0, continuation);
      return this.match(engine, right, ':first', '*', void 0, continuation);
    }
  };

  Query.prototype.reduce = function(engine, operation, path, scope, added, removed, recursion, contd) {
    var oppath;
    oppath = this.getCanonicalPath(path);
    if (path !== oppath && recursion !== oppath) {
      this.collect(engine, operation, oppath, scope, added, removed, oppath, path);
    }
    return this.collect(engine, operation, path, scope, added, removed, recursion, contd || '');
  };

  Query.prototype.collect = function(engine, operation, path, scope, added, removed, recursion, contd) {
    var collection, i, index, k, len, node, ref1, results, self, sorted, updated;
    if (removed) {
      this.each(this.remove, engine, removed, path, operation, scope, operation, recursion, contd);
    }
    if (added) {
      this.each(this.add, engine, added, path, operation, scope, operation, contd);
    }
    if ((ref1 = (collection = this.get(engine, path))) != null ? ref1.operations : void 0) {
      self = this;
      sorted = collection.slice().sort(function(a, b) {
        var i, j;
        i = collection.indexOf(a);
        j = collection.indexOf(b);
        return self.comparePosition(a, b, collection.operations[i], collection.operations[j]) && -1 || 1;
      });
      updated = void 0;
      results = [];
      for (index = k = 0, len = sorted.length; k < len; index = ++k) {
        node = sorted[index];
        if (node !== collection[index]) {
          if (!updated) {
            updated = collection.slice();
            this.set(engine, path, updated);
            updated.operations = collection.operations.slice();
            updated.continuations = collection.continuations.slice();
            updated.scopes = collection.scopes.slice();
            updated.duplicates = collection.duplicates;
            updated.isCollection = collection.isCollection;
            updated[index] = node;
          }
          i = collection.indexOf(node);
          updated[index] = node;
          updated.operations[index] = collection.operations[i];
          updated.continuations[index] = collection.continuations[i];
          updated.scopes[index] = collection.scopes[i];
          this.chain(engine, sorted[index - 1], node, path);
          results.push(this.chain(engine, node, sorted[index + 1], path));
        } else {
          results.push(void 0);
        }
      }
      return results;
    }
  };

  Query.prototype.each = function(method, engine, result, continuation, operation, scope, needle, recursion, contd) {
    var child, copy, k, len, returned;
    if (result == null) {
      result = void 0;
    }
    if (this.isCollection(result)) {
      copy = result.slice();
      returned = void 0;
      for (k = 0, len = copy.length; k < len; k++) {
        child = copy[k];
        if (method.call(this, engine, child, continuation, operation, scope, needle, recursion, contd)) {
          returned = true;
        }
      }
      return returned;
    } else if (result && typeof result !== 'number') {
      return method.call(this, engine, result, continuation, operation, scope, needle, recursion, contd);
    }
  };

  Query.prototype.set = function(engine, path, result) {
    var base, left, observers, old, ref1;
    old = engine.queries[path];
    this.snapshot(engine, path, old);
    if (result != null) {
      engine.queries[path] = result;
    } else if (engine.queries.hasOwnProperty(path)) {
      delete engine.queries[path];
      if (engine.updating.branching) {
        engine.updating.branching.push(path);
      }
    }
    path = this.getCanonicalPath(path);
    ref1 = engine.pairs;
    for (left in ref1) {
      observers = ref1[left];
      if (observers.indexOf(path) > -1) {
        ((base = engine.updating).pairs || (base.pairs = {}))[left] = true;
      }
    }
  };

  Query.prototype.onLeft = function(engine, operation, parent, continuation, scope) {
    var left;
    left = this.getCanonicalPath(continuation);
    if (engine.indexOfTriplet(engine.lefts, parent, left, scope) === -1) {
      parent.right = operation;
      engine.lefts.push(parent, left, scope);
      return this.rewind;
    } else {
      (engine.pairing || (engine.pairing = {}))[left] = true;
      return this.nothing;
    }
  };

  Query.prototype.nothing = function() {};

  Query.prototype.onRight = function(engine, operation, parent, continuation, scope, left, right) {
    var base, base1, index, k, len, op, pairs, pushed, ref1;
    right = this.getCanonicalPath(continuation.substring(0, continuation.length - 1));
    ref1 = engine.lefts;
    for (index = k = 0, len = ref1.length; k < len; index = k += 3) {
      op = ref1[index];
      if (op === parent && engine.lefts[index + 2] === scope) {
        left = engine.lefts[index + 1];
        this.listen(engine, operation, continuation, scope, left, right);
      }
    }
    if (!left) {
      return;
    }
    left = this.getCanonicalPath(left);
    pairs = (base = engine.pairs)[left] || (base[left] = []);
    if (pairs.indexOf(right) === -1) {
      pushed = pairs.push(right, operation, scope);
    }
    if (engine.updating.pairs !== false) {
      ((base1 = engine.updating).pairs || (base1.pairs = {}))[left] = true;
    }
    return this.nothing;
  };

  Query.prototype.retrieve = function(engine, operation, continuation, scope, ascender, ascending, single) {
    var contd, index, last, parent, prev, result;
    last = continuation.lastIndexOf(this.PAIR);
    if (last > -1 && !operation.command.reference) {
      prev = -1;
      while ((index = continuation.indexOf(this.PAIR, prev + 1)) > -1) {
        if (result = this.retrieve(engine, operation, continuation.substring(prev + 1, index), scope, ascender, ascending, true)) {
          return result;
        }
        prev = index;
      }
      if (last === continuation.length - 1 && ascending) {
        parent = this.getRoot(operation);
        if (!parent.right || parent.right === operation) {
          return this.onLeft(engine, operation, parent, continuation, scope, ascender, ascending);
        } else {
          return this.onRight(engine, operation, parent, continuation, scope, ascender, ascending);
        }
      }
    } else {
      if (continuation.length === 1) {
        return;
      }
      contd = this.getCanonicalPath(continuation, true);
      if (contd.charAt(0) === this.PAIR) {
        contd = contd.substring(1);
      }
      if (contd === operation.command.path) {
        return this.getByPath(engine, continuation);
      }
    }
  };

  Query.prototype.repair = function(engine, reversed) {
    var dirty, index, k, len, pair, pairs, property, ref1, value;
    if (!(dirty = engine.updating.pairs)) {
      return;
    }
    engine.console.start('Pairs', dirty);
    engine.updating.pairs = false;
    for (property in dirty) {
      value = dirty[property];
      if (pairs = (ref1 = engine.pairs[property]) != null ? ref1.slice() : void 0) {
        for (index = k = 0, len = pairs.length; k < len; index = k += 3) {
          pair = pairs[index];
          this.pair(engine, property, pair, pairs[index + 1], pairs[index + 2], reversed);
        }
      }
    }
    engine.updating.pairs = void 0;
    return engine.console.end();
  };

  Query.prototype.count = function(value) {
    if (value != null ? value.push : void 0) {
      return value.length;
    } else {
      return (value != null) && 1 || 0;
    }
  };

  Query.prototype.pad = function(value, length) {
    var i, k, ref1, result;
    if (value && !value.push) {
      result = [];
      for (i = k = 0, ref1 = length; 0 <= ref1 ? k < ref1 : k > ref1; i = 0 <= ref1 ? ++k : --k) {
        result.push(value);
      }
      result.single = true;
      return result;
    } else if ((value != null ? value.splice : void 0) && value.slice) {
      return value.slice();
    } else {
      return value || [];
    }
  };

  Query.prototype.restore = function(engine, path) {
    var ref1;
    if ((ref1 = engine.updating.snapshots) != null ? ref1.hasOwnProperty(path) : void 0) {
      return engine.updating.snapshots[path];
    } else {
      return this.get(engine, path);
    }
  };

  Query.prototype.fetch = function(engine, path, reversed) {
    if (reversed) {
      return this.restore(engine, path);
    } else {
      return this.get(engine, path);
    }
  };

  Query.prototype.pair = function(engine, left, right, operation, scope, reversed) {
    var I, J, added, cleaned, cleaning, contd, el, index, k, l, leftNew, leftOld, len, len1, len2, len3, len4, m, n, o, object, op, p, pair, ref1, ref2, removed, rightNew, rightOld, root, solved;
    root = this.getRoot(operation);
    right = this.getPrefixPath(engine, left) + root.right.command.path;
    if (reversed) {
      leftOld = engine.updating.queries.hasOwnProperty(left) ? engine.updating.queries[left] : this.restore(engine, left);
      rightOld = engine.updating.queries.hasOwnProperty(right) ? engine.updating.queries[right] : this.restore(engine, right);
    } else {
      leftNew = this.get(engine, left);
      rightNew = this.get(engine, right);
      leftOld = this.restore(engine, left);
      rightOld = this.restore(engine, right);
    }
    if (operation.command.singular) {
      if (leftNew != null ? leftNew.push : void 0) {
        leftNew = leftNew[0];
      }
      if (leftOld != null ? leftOld.push : void 0) {
        leftOld = leftOld[0];
      }
    }
    if (root.right.command.singular) {
      if (rightNew != null ? rightNew.push : void 0) {
        rightNew = rightNew[0];
      }
      if (rightOld != null ? rightOld.push : void 0) {
        rightOld = rightOld[0];
      }
    }
    I = Math.max(this.count(leftNew), this.count(rightNew));
    J = Math.max(this.count(leftOld), this.count(rightOld));
    leftNew = this.pad(leftNew, I);
    leftOld = this.pad(leftOld, J);
    rightNew = this.pad(rightNew, I);
    rightOld = this.pad(rightOld, J);
    removed = [];
    added = [];
    for (index = k = 0, len = leftOld.length; k < len; index = ++k) {
      object = leftOld[index];
      if (leftNew[index] !== object || rightOld[index] !== rightNew[index]) {
        if (rightOld && rightOld[index]) {
          removed.push([object, rightOld[index]]);
        }
        if (leftNew[index] && rightNew[index]) {
          added.push([leftNew[index], rightNew[index]]);
        }
      }
    }
    if (leftOld.length < leftNew.length) {
      for (index = l = ref1 = leftOld.length, ref2 = leftNew.length; l < ref2; index = l += 1) {
        if (rightNew[index]) {
          added.push([leftNew[index], rightNew[index]]);
        }
      }
    }
    cleaned = [];
    for (m = 0, len1 = removed.length; m < len1; m++) {
      pair = removed[m];
      if (!pair[0] || !pair[1]) {
        continue;
      }
      contd = left;
      contd += engine.identify(pair[0]);
      contd += this.PAIR;
      contd += root.right.command.path;
      contd += engine.identify(pair[1]);
      cleaned.push(contd);
    }
    solved = [];
    for (n = 0, len2 = added.length; n < len2; n++) {
      pair = added[n];
      contd = left;
      contd += engine.identify(pair[0]);
      contd += this.PAIR;
      contd += root.right.command.path;
      contd += engine.identify(pair[1]);
      if ((index = cleaned.indexOf(contd)) > -1) {
        cleaned.splice(index, 1);
      } else {
        op = operation.parent;
        engine.input.solve(op, contd + this.PAIR, scope, true);
      }
    }
    for (o = 0, len3 = cleaned.length; o < len3; o++) {
      contd = cleaned[o];
      this.clean(engine, contd);
    }
    cleaning = true;
    for (p = 0, len4 = leftNew.length; p < len4; p++) {
      el = leftNew[p];
      if (el) {
        cleaning = false;
        break;
      }
    }
    if (cleaning) {
      return this.unpair(engine, left, scope, operation);
    }
  };

  Query.prototype.unpair = function(engine, left, scope, operation) {
    var contd, index, pairs, ref1;
    if (pairs = (ref1 = engine.pairs) != null ? ref1[left] : void 0) {
      delete engine.pairs[left];
    }
    index = 0;
    while (contd = engine.lefts[index + 1]) {
      if (contd === left && engine.lefts[index + 2] === scope) {
        engine.lefts.splice(index, 3);
      } else {
        index += 3;
      }
    }
    return this;
  };

  Query.prototype.listen = function(engine, operation, continuation, scope, left, right) {
    var base, observers;
    observers = (base = engine.pairs)[left] || (base[left] = []);
    if (engine.indexOfTriplet(observers, right, operation, scope) === -1) {
      return observers.push(right, operation, scope);
    }
  };

  Query.prototype.unlisten = function(engine, operation, continuation, scope, left, right) {
    var base, index, observers;
    observers = (base = engine.pairs)[left] || (base[left] = []);
    if ((index = engine.indexOfTriplet(observers, right, operation, scope)) !== -1) {
      return observers.splice(index, 3);
    }
  };

  Query.prototype.getScope = function(engine, node, continuation) {
    var index, parent, path, scope;
    if (!node) {
      if ((index = continuation.lastIndexOf('$')) > -1) {
        if (path = this.getScopePath(continuation, 0)) {
          if (scope = this.getByPath(engine, path)) {
            if (scope.scoped) {
              if ((parent = engine.getScopeElement(scope.parentNode)) === engine.scope) {
                return;
              }
              return parent._gss_id;
            }
            return scope._gss_id;
          }
        }
        if (scope = engine.scope) {
          return scope.gss_id;
        }
      }
    } else if (node !== engine.scope) {
      return node._gss_id || node;
    }
  };

  Query.prototype.getScopePath = function(continuation, level, virtualize) {
    var index, last;
    if (level == null) {
      level = 0;
    }
    last = continuation.length - 1;
    if (continuation.charCodeAt(last) === 8594) {
      last = continuation.lastIndexOf(this.DESCEND, last);
    }
    while (true) {
      if ((index = continuation.lastIndexOf(this.DESCEND, last)) === -1) {
        if (level > -1) {
          return '';
        }
      }
      if (continuation.charCodeAt(index + 1) === 64) {
        if (virtualize && level === -1) {
          break;
        } else {
          ++level;
        }
      }
      if (level === -1) {
        break;
      }
      last = index - 1;
      --level;
    }
    return continuation.substring(0, last + 1);
  };

  Query.prototype.getPrefixPath = function(engine, continuation, level) {
    var path;
    if (level == null) {
      level = 0;
    }
    if (path = this.getScopePath(continuation, level, true)) {
      return path + this.DESCEND;
    }
    return '';
  };

  Query.prototype.getParentScope = function(engine, scope, continuation, level) {
    var path, result;
    if (level == null) {
      level = 1;
    }
    if (!continuation) {
      return scope._gss_id;
    }
    if (path = this.getScopePath(continuation, level)) {
      if (result = this.getByPath(engine, path)) {
        if (result.scoped) {
          result = engine.getScopeElement(result);
        }
      }
      return result;
    }
    return engine.scope;
  };

  Query.prototype.getByPath = function(engine, path) {
    var id, j, last;
    if ((j = path.lastIndexOf('$')) > -1 && j > path.lastIndexOf(this.DESCEND)) {
      id = path.substring(j);
      last = id.length - 1;
      if (this.DELIMITERS.indexOf(id.charCodeAt(last)) > -1) {
        id = id.substring(0, last);
      }
      if (id.indexOf('"') > -1) {
        return id;
      }
    }
    return engine.identity[id] || this.get(engine, path);
  };

  Query.prototype.getCanonicalPath = function(continuation, compact) {
    var PopDirectives, RemoveForkMarks, bits, last;
    PopDirectives = Query.PopDirectives || (Query.PopDirectives = new RegExp("(?:" + "@[^@" + this.DESCEND + "]+" + this.DESCEND + ")+$", "g"));
    bits = this.delimit(continuation.replace(PopDirectives, '')).split(this.DESCEND);
    last = bits[bits.length - 1];
    RemoveForkMarks = Query.RemoveForkMarks || (Query.RemoveForkMarks = new RegExp("" + "([^" + this.PAIR + ",@])" + "\\$[^\[" + this.ASCEND + "]+" + "(?:" + this.ASCEND + "|$)", "g"));
    last = bits[bits.length - 1] = last.replace(RemoveForkMarks, '$1');
    if (compact) {
      return last;
    }
    return bits.join(this.DESCEND);
  };

  Query.prototype.getVariants = function(path) {
    return [path, path + this.ASCEND, path + this.PAIR, path + this.DESCEND, path + this.DESCEND + '&'];
  };

  Query.prototype.getCanonicalCollection = function(engine, path) {
    return engine.queries[this.getCanonicalPath(path)];
  };

  Query.prototype.getLocalPath = function(engine, operation, continuation) {
    return this["continue"](engine, operation, continuation);
  };

  Query.prototype.getGlobalPath = function(engine, operation, continuation, node) {
    return engine.identify(node) + ' ' + this.getKey(engine, operation, continuation, node);
  };

  Query.prototype.comparePosition = function(a, b, op1, op2) {
    var i, index, j, left, next, parent, right;
    if (op1 !== op2) {
      parent = op1.parent;
      i = parent.indexOf(op1);
      j = parent.indexOf(op2);
      if (i > j) {
        left = op2;
        right = op1;
      } else {
        left = op1;
        right = op2;
      }
      index = i;
      while (next = parent[++index]) {
        if (next === right) {
          break;
        }
        if (next[0] === 'virtual') {
          return i < j;
        }
      }
      if (!(a.nodeType && b.nodeType)) {
        return i < j;
      }
    }
    if (a.compareDocumentPosition) {
      return a.compareDocumentPosition(b) & 4;
    }
    return a.sourceIndex < b.sourceIndex;
  };

  Query.prototype.match = function(engine, node, group, qualifier, changed, continuation) {
    var change, contd, groupped, id, index, k, l, len, len1, operation, path, scope, watchers;
    if (!(id = engine.identify(node))) {
      return;
    }
    if (!(watchers = engine.observers[id])) {
      return;
    }
    if (continuation) {
      path = this.getCanonicalPath(continuation);
    }
    for (index = k = 0, len = watchers.length; k < len; index = k += 3) {
      operation = watchers[index];
      if (groupped = operation.command[group]) {
        contd = watchers[index + 1];
        if (path && path !== this.getCanonicalPath(contd)) {
          continue;
        }
        scope = watchers[index + 2];
        if (qualifier) {
          this.qualify(engine, operation, contd, scope, groupped, qualifier);
        } else if (changed.nodeType) {
          this.qualify(engine, operation, contd, scope, groupped, changed.tagName, '*');
        } else if (typeof changed === 'string') {
          this.qualify(engine, operation, contd, scope, groupped, changed, '*');
        } else {
          for (l = 0, len1 = changed.length; l < len1; l++) {
            change = changed[l];
            if (typeof change === 'string') {
              this.qualify(engine, operation, contd, scope, groupped, change, '*');
            } else {
              this.qualify(engine, operation, contd, scope, groupped, change.tagName, '*');
            }
          }
        }
      }
    }
  };

  Query.prototype.qualify = function(engine, operation, continuation, scope, groupped, qualifier, fallback) {
    var indexed;
    if ((indexed = groupped[qualifier]) || (fallback && groupped[fallback])) {
      this.schedule(engine, operation, continuation, scope);
    }
  };

  Query.prototype.notify = function(engine, continuation, scope) {
    var index, k, len, watcher, watchers;
    if (watchers = engine.observers[engine.identify(scope)]) {
      for (index = k = 0, len = watchers.length; k < len; index = k += 3) {
        watcher = watchers[index];
        if (watchers[index + 1] + watcher.command.key === continuation) {
          this.schedule(engine, watcher, continuation, scope);
        }
      }
    }
  };

  Query.prototype.continuate = function(engine, scope) {
    var contd, index, k, len, scoped, watcher, watchers;
    if (watchers = engine.observers[engine.identify(scope)]) {
      for (index = k = 0, len = watchers.length; k < len; index = k += 3) {
        watcher = watchers[index];
        scoped = watchers[index + 2];
        contd = watcher.command["continue"](engine, watcher, watchers[index + 1], scoped);
        this.schedule(engine, watcher, contd, scoped);
      }
    }
  };

  Query.prototype.uncontinuate = function(engine, scope) {
    var index, k, len, watcher, watchers;
    if (watchers = engine.observers[engine.identify(scope)]) {
      for (index = k = 0, len = watchers.length; k < len; index = k += 3) {
        watcher = watchers[index];
        this.clean(engine, watcher, this.delimit(watchers[index + 1]), watcher, watchers[index + 2]);
      }
    }
  };

  Query.prototype.schedule = function(engine, operation, continuation, scope) {
    var base, contd, index, k, last, len, length, mutations, other, stylesheet, watcher;
    mutations = (base = engine.updating).mutations || (base.mutations = []);
    length = (continuation || '').length;
    last = null;
    stylesheet = operation.stylesheet;
    for (index = k = 0, len = mutations.length; k < len; index = k += 3) {
      watcher = mutations[index];
      contd = mutations[index + 1] || '';
      if (watcher === operation && continuation === contd && scope === mutations[index + 2]) {
        return;
      }
      if (other = stylesheet) {
        if ((last == null) && !this.comparePosition(other, stylesheet, operation, operation)) {
          last = index + 3;
        }
      } else if (contd.length < length) {
        last = index + 3;
      }
    }
    return mutations.splice(last != null ? last : 0, 0, operation, continuation, scope);
  };

  Query.prototype.branch = function(engine) {
    var base, base1, condition, conditions, index, k, l, len, len1, len2, len3, len4, m, n, next, number, o, op, path, prefix, queries, rebranches, removed, snapshots, unbranches;
    if (conditions = engine.updating.branches) {
      engine.console.start('Branches', conditions.slice());
      engine.updating.branches = void 0;
      removed = engine.updating.branching = [];
      rebranches = [];
      unbranches = [];
      for (index = k = 0, len = conditions.length; k < len; index = k += 3) {
        condition = conditions[index];
        if (condition.command.unbranch(engine, condition, conditions[index + 1], conditions[index + 2])) {
          op = condition;
          while (next = op.command.next) {
            if (prefix = this.getPrefixPath(engine, conditions[index + 1])) {
              prefix += this.DESCEND;
            }
            path = prefix + next.command.key;
            if (engine.indexOfTriplet(conditions, next, path, conditions[index + 2]) === -1) {
              if (next.command.getOldValue(engine, path)) {
                if (next.command.getOldValue(engine, conditions[index + 1])) {
                  rebranches.push(next, path, conditions[index + 2]);
                } else {
                  unbranches.push(next, path, conditions[index + 2]);
                }
                break;
              }
            }
            op = next;
          }
          engine.queries[conditions[index + 1]] = 0;
        }
      }
      for (index = l = 0, len1 = unbranches.length; l < len1; index = l += 3) {
        condition = unbranches[index];
        number = engine.queries[unbranches[index + 1]];
        this.clean(engine, unbranches[index + 1], unbranches[index + 1], unbranches[index], unbranches[index + 2]);
        engine.queries[unbranches[index + 1]] = 0;
      }
      engine.triggerEvent('branch');
      queries = (base = engine.updating).queries || (base.queries = {});
      snapshots = (base1 = engine.updating).snapshots || (base1.snapshots = {});
      this.repair(engine, true);
      engine.updating.branching = void 0;
      for (m = 0, len2 = removed.length; m < len2; m++) {
        path = removed[m];
        if (conditions.indexOf(path) > -1) {
          continue;
        }
        if (snapshots) {
          delete snapshots[path];
        }
        if (queries) {
          delete queries[path];
        }
      }
      for (index = n = 0, len3 = conditions.length; n < len3; index = n += 3) {
        condition = conditions[index];
        condition.command.rebranch(engine, condition, conditions[index + 1], conditions[index + 2]);
      }
      for (index = o = 0, len4 = rebranches.length; o < len4; index = o += 3) {
        condition = rebranches[index];
        condition.command.branch(engine, condition, rebranches[index + 1], rebranches[index + 2]);
      }
      return engine.console.end();
    }
  };

  Query.prototype.isCollection = function(object) {
    if (object && object.length !== void 0 && !object.substring && !object.nodeType) {
      if (object.isCollection) {
        return true;
      }
      switch (typeof object[0]) {
        case "object":
          return object[0].nodeType;
        case "undefined":
          return object.length === 0;
      }
    }
  };

  Query.prototype.Sequence = Command.Sequence;

  return Query;

})(Command);

module.exports = Query;


},{"./Command":3}],8:[function(require,module,exports){
var Update, Updater,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Updater = function(engine) {
  var Update, property, ref, value;
  Update = function(problem, domain, parent, Domain, Auto) {
    var arg, index, k, len, object, result, update, vardomain;
    if (this instanceof Update) {
      this.problems = problem && (domain.push && problem || [problem]) || [];
      this.domains = domain && (domain.push && domain || [domain]) || [];
      return;
    }
    update = void 0;
    if (typeof problem[0] === 'string') {
      if (!this.solver.signatures[problem[0]]) {
        Domain = this.output;
      }
    }
    for (index = k = 0, len = problem.length; k < len; index = ++k) {
      arg = problem[index];
      if (!(arg != null ? arg.push : void 0)) {
        continue;
      }
      if (!(arg[0] instanceof Array)) {
        if (typeof problem[0] === 'string') {
          arg.parent || (arg.parent = problem);
        }
        if (arg[0] === 'get') {
          vardomain = arg.domain || (arg.domain = this.getVariableDomain(arg, Domain));
          (update || (update = new this.update)).push([arg], vardomain);
        } else {
          if (result = this.update(arg, domain, update || false, Domain)) {
            update || (update = result);
          }
        }
        object = true;
      }
    }
    if (!object) {
      if (!(problem instanceof Array)) {
        update.push([problem], null);
      }
    }
    if (!(problem[0] instanceof Array)) {
      if (update) {
        update.wrap(problem, parent, domain || Domain);
      } else if (problem[0] !== 'remove') {
        if (Domain) {
          problem.domain = Domain;
        }
        return;
      } else {
        update = new this.update([problem], [domain || Domain || null]);
      }
    }
    if (parent === false) {
      return update;
    } else if (parent || (parent = this.updating)) {
      return parent.push(update);
    } else {
      return update.each(this.resolve, this);
    }
  };
  if (this.prototype) {
    ref = this.prototype;
    for (property in ref) {
      value = ref[property];
      Update.prototype[property] = value;
    }
  }
  if (engine) {
    Update.prototype.engine = engine;
  }
  return Update;
};

Update = Updater();

Update.compile = Updater;

Update.prototype = {
  push: function(problems, domain, reverse) {
    var error, index, k, len, other, position, ref;
    if (domain === void 0) {
      if (!(problems != null ? problems.domains : void 0)) {
        error = new Error('Can\'t constraint suggested variable: ');
        error.meta = problems;
        throw error;
      }
      ref = problems.domains;
      for (index = k = 0, len = ref.length; k < len; index = ++k) {
        domain = ref[index];
        this.push(problems.problems[index], domain);
      }
      return this;
    }
    if ((position = this.domains.indexOf(domain, this.index + 1)) > -1) {
      return this.append(position, problems, reverse);
    }
    if (!domain) {
      position = this.index + 1;
    } else {
      position = this.domains.length;
      while (position - 1 > this.index && (other = this.domains[position - 1])) {
        if (!(other.priority < domain.priority || (reverse && this.problems[position - 1][0][0] !== 'remove'))) {
          break;
        }
        --position;
      }
    }
    this.insert(position, domain, problems);
    return position;
  },
  append: function(position, problems, reverse) {
    var cmds, domain, k, len, problem;
    cmds = this.problems[position];
    domain = this.domains[position];
    this.mix(cmds, problems);
    for (k = 0, len = problems.length; k < len; k++) {
      problem = problems[k];
      if (domain) {
        this.setVariables(cmds, problem);
        this.reify(problem, domain);
      }
    }
    if (domain) {
      return this.connect(position);
    }
  },
  insert: function(position, domain, problems) {
    var k, len, problem, property, variable, variables;
    for (k = 0, len = problems.length; k < len; k++) {
      problem = problems[k];
      this.setVariables(problems, problem);
    }
    this.domains.splice(position, 0, domain);
    this.problems.splice(position, 0, problems);
    if (variables = this.variables) {
      for (property in variables) {
        variable = variables[property];
        if (variable >= position) {
          variables[property]++;
        }
      }
    }
    this.reify(problems, domain);
    return this.connect(position);
  },
  splice: function(index) {
    var domain, name, ref, variable;
    domain = this.domains[index];
    this.domains.splice(index, 1);
    this.problems.splice(index, 1);
    if (this.variables) {
      ref = this.variables;
      for (name in ref) {
        variable = ref[name];
        if (variable >= index) {
          if (variable === index) {
            this.variables[name] = void 0;
          } else {
            this.variables[name] = variable - 1;
          }
        }
      }
    }
  },
  wrap: function(operation, parent, Domain, Auto) {
    var argument, domain, i, index, j, k, l, len, len1, len2, len3, m, n, o, other, position, positions, problems, ref, signed;
    positions = void 0;
    ref = this.problems;
    for (index = k = 0, len = ref.length; k < len; index = ++k) {
      problems = ref[index];
      if (domain = this.domains[index]) {
        signed = typeof operation[0] !== 'string' || domain.signatures[operation[0]];
        for (l = 0, len1 = operation.length; l < len1; l++) {
          argument = operation[l];
          if (signed && problems.indexOf(argument) > -1) {
            if (!other || (domain.Engine && !other.Engine)) {
              position = index;
              other = domain;
            }
          }
          if (!positions || positions.indexOf(index) === -1) {
            (positions || (positions = [])).push(index);
          }
        }
      }
    }
    if (!other || (Domain && other.displayName !== Domain.displayName)) {
      other = Domain;
      position = this.push([operation], other);
    }
    if (!positions) {
      this.push([operation], null);
      return;
    }
    for (j = m = positions.length - 1; m >= 0; j = m += -1) {
      index = positions[j];
      if ((domain = this.domains[index]).displayName !== other.displayName) {
        positions.splice(j, 1);
      } else {
        problems = this.problems[index];
        for (n = 0, len2 = operation.length; n < len2; n++) {
          argument = operation[n];
          if ((i = problems.indexOf(argument)) > -1) {
            if (argument.push) {
              this.reify(argument, other, domain);
            }
            if (index === position && problems.indexOf(operation) === -1) {
              problems[i] = operation;
              positions.splice(j, 1);
              operation.domain = domain;
            } else {
              problems.splice(i, 1);
              if (problems.length === 0 && !domain.paths) {
                this.splice(index, 1);
                if (index < position) {
                  position--;
                }
                positions.splice(j, 1);
              }
            }
          }
        }
      }
    }
    if (other) {
      operation.domain = other;
      for (o = 0, len3 = operation.length; o < len3; o++) {
        argument = operation[o];
        if (argument.push) {
          operation.variables = argument.variables = this.setVariables(operation, argument, true);
        }
      }
      this.setVariables(this.problems[position], operation);
    }
    if (positions.length) {
      return this.connect(position, positions);
    } else {
      return this.connect(position);
    }
  },
  match: function(target, domain, positions) {
    var Solver, i, index, problems, property, ref, variable, variables;
    problems = this.problems[target];
    variables = this.variables || (this.variables = {});
    if (Solver = domain.Engine) {
      ref = problems.variables;
      for (property in ref) {
        variable = ref[property];
        if (variable.domain.Engine === Solver) {
          if (((i = variables[property]) != null) && (i !== target)) {
            if (indexOf.call((positions || (positions = [])), i) < 0) {
              index = 0;
              while (positions[index] < i) {
                index++;
              }
              positions.splice(index, 0, i);
            }
          } else {
            variables[property] = target;
          }
        }
      }
    }
    return positions;
  },
  connect: function(target, positions) {
    var a, b, condition, domain, from, i, index, j, k, l, ref, ref1, ref2, to;
    if (!(domain = this.domains[target])) {
      return;
    }
    if (positions || (positions = this.match(target, domain, positions))) {
      b = domain.constraints;
      for (index = k = 0, ref = positions.length; k < ref; index = k += 1) {
        i = positions[index];
        a = this.domains[i].constraints;
        condition = a || b ? (a && a.length) < (b && b.length) : target < i;
        if (condition) {
          from = i;
          to = target;
        } else {
          from = target;
          to = i;
        }
        target = this.merge(from, to);
        for (j = l = ref1 = index + 1, ref2 = positions.length; l < ref2; j = l += 1) {
          if (positions[j] >= from) {
            positions[j]--;
          }
        }
      }
    }
    return target;
  },
  merge: function(from, to, parent) {
    var Solver, domain, exported, k, l, len, len1, other, prob, problems, property, ref, result, variable;
    other = this.domains[to];
    problems = this.problems[from];
    result = this.problems[to];
    if (domain = this.domains[from]) {
      if (domain.paths && !domain.consumed) {
        domain.transfer(parent, this, other);
        exported = domain["export"]();
        domain.register(false);
      }
      for (k = 0, len = problems.length; k < len; k++) {
        prob = problems[k];
        if (result.indexOf(prob) === -1) {
          (exported || (exported = [])).push(prob);
        } else {
          this.reify(prob, other, domain);
        }
      }
    }
    this.splice(from, 1);
    if (from < to) {
      to--;
    }
    if (exported) {
      this.mix(result, exported);
      for (l = 0, len1 = exported.length; l < len1; l++) {
        prob = exported[l];
        this.setVariables(result, prob);
      }
      this.reify(exported, other, domain);
      if (Solver = domain.Engine) {
        ref = result.variables;
        for (property in ref) {
          variable = ref[property];
          if (variable.domain.Engine === Solver) {
            (this.variables || (this.variables = {}))[property] = to;
          }
        }
      }
    }
    other.register();
    return to;
  },
  mix: function(result, exported) {
    var index, k, l, len, len1, prob, problem, ref, results;
    results = [];
    for (k = 0, len = exported.length; k < len; k++) {
      prob = exported[k];
      for (index = l = 0, len1 = result.length; l < len1; index = ++l) {
        problem = result[index];
        if (((ref = problem.index) != null ? ref : Infinity) > prob.index) {
          break;
        }
      }
      results.push(result.splice(index, 0, prob));
    }
    return results;
  },
  await: function(url) {
    return (this.busy || (this.busy = [])).push(url);
  },
  postMessage: function(url, message) {
    var base, name1;
    return ((base = (this.posted || (this.posted = {})))[name1 = url.url || url] || (base[name1] = [])).push(this.engine.clone(message));
  },
  terminate: function() {
    var changes, command, commands, constants, first, group, i, k, l, len, len1, m, message, path, paths, property, ref, ref1, removes, url, value, values, worker;
    if (this.posted) {
      ref = this.posted;
      for (url in ref) {
        message = ref[url];
        worker = this.engine.workers[url];
        paths = (worker.paths || (worker.paths = {}));
        values = (worker.values || (worker.values = {}));
        changes = {};
        commands = [changes];
        removes = [];
        for (k = 0, len = message.length; k < len; k++) {
          group = message[k];
          for (l = 0, len1 = group.length; l < len1; l++) {
            command = group[l];
            first = command[0];
            if (first === 'remove') {
              for (i = m = 1, ref1 = command.length; 1 <= ref1 ? m < ref1 : m > ref1; i = 1 <= ref1 ? ++m : --m) {
                delete paths[command[i]];
                removes.push(command[i]);
              }
            } else if (first === 'value') {
              if (command[2] !== values[command[1]]) {
                changes[command[1]] = command[2];
              }
            } else {
              if ((path = first.key) != null) {
                paths[path] = true;
                if (constants = first.values) {
                  for (property in constants) {
                    value = constants[property];
                    if (value !== values[property]) {
                      changes[property] = value;
                    }
                  }
                }
              }
              commands.push(command);
            }
          }
        }
        if (removes.length) {
          removes.unshift('remove');
          commands.splice(1, 0, removes);
        }
        worker.postMessage(commands);
        while ((i = this.busy.indexOf(url)) > -1 && this.busy.lastIndexOf(url) !== i) {
          this.busy.splice(i, 1);
        }
      }
      return this.posted = void 0;
    }
  },
  each: function(callback, bind, solution) {
    var domain, previous, property, ref, ref1, ref2, result, variable;
    if (solution) {
      this.apply(solution);
    }
    if (!this.problems[this.index + 1]) {
      return;
    }
    previous = this.domains[this.index];
    while ((domain = this.domains[++this.index]) !== void 0) {
      previous = domain;
      if (this.variables) {
        ref = this.variables;
        for (property in ref) {
          variable = ref[property];
          if (variable <= this.index) {
            delete this.variables[property];
          }
        }
      }
      result = (this.solutions || (this.solutions = []))[this.index] = callback.call(bind || this, domain, this.problems[this.index], this.index, this);
      this.problems[this.index].variables = void 0;
      if (((ref1 = this.busy) != null ? ref1.length : void 0) && this.busy.indexOf((ref2 = this.domains[this.index + 1]) != null ? ref2.url : void 0) === -1) {
        this.terminate();
        return result;
      }
      if (result && result.onerror === void 0) {
        if (result.push) {
          this.engine.update(result);
        } else {
          this.apply(result);
          solution = this.apply(result, solution || {});
        }
      }
    }
    this.terminate();
    this.index--;
    return solution || this;
  },
  apply: function(result) {
    var base, error, last, length, now, obj, property, ref, ref1, ref2, repeating, solution, timeout, val, value;
    solution = this.solution || (this.solution = {});
    last = this.last || (this.last = {});
    for (property in result) {
      value = result[property];
      now = solution[property];
      if (((ref = this.repeating) != null ? (ref1 = ref[property]) != null ? ref1[value] : void 0 : void 0) >= 3) {
        this.changes = this.repeating = void 0;
        return;
      }
      if (last[property] === value) {
        if (Math.abs(now - value) < 2) {
          (this.changes || (this.changes = {}))[property] = solution[property] = now;
          continue;
        }
      }
      if (now !== value) {
        obj = ((base = (this.repeating || (this.repeating = {})))[property] || (base[property] = {}));
        obj[value] = (obj[value] || 0) + 1;
        if (solution === this.solution && (value != null)) {
          last[property] = now;
        }
        (this.changes || (this.changes = {}))[property] = value;
        solution[property] = value;
      }
    }
    timeout = (typeof window !== "undefined" && window !== null ? window.GSS_TIMEOUT : void 0) || 30000;
    if (this.engine.console.getTime(this.started) > timeout) {
      error = new Error('GSS Update takes more than ' + timeout / 1000 + 's');
      repeating = {};
      ref2 = this.repeating;
      for (property in ref2) {
        value = ref2[property];
        repeating[property] = 0;
        for (val in value) {
          length = value[val];
          repeating[property] += length;
        }
      }
      error.meta = {
        top: Object.keys(repeating).sort((function(_this) {
          return function(a, b) {
            return _this.repeating[b].length - _this.repeating[a].length;
          };
        })(this)).slice(0, 15).reduce(function(object, name) {
          object[name] = repeating[name];
          return object;
        }, {})
      };
      throw error;
    }
    return solution;
  },
  remove: function(continuation, problem) {
    var i, index, k, l, problems, ref;
    this.push([['remove', continuation]], null);
    ref = this.problems;
    for (index = k = ref.length - 1; k >= 0; index = k += -1) {
      problems = ref[index];
      if (index === this.index) {
        break;
      }
      for (i = l = problems.length - 1; l >= 0; i = l += -1) {
        problem = problems[i];
        if (problem && problem[0] && problem[0].key === continuation) {
          problems.splice(i, 1);
          if (problems.length === 0) {
            this.splice(index, 1);
          }
        }
      }
    }
  },
  perform: function(domain) {
    var glob, globals, globs, k, len;
    globals = this.domains.indexOf(null, this.index);
    if (globals > -1) {
      globs = this.problems[globals];
      if (typeof globs[0] === 'string') {
        if (globs[0] === 'remove') {
          domain.remove.apply(domain, globs.slice(1));
        }
      } else {
        for (k = 0, len = globs.length; k < len; k++) {
          glob = globs[k];
          if (glob[0] === 'remove') {
            domain.remove.apply(domain, glob.slice(1));
          }
        }
      }
    }
  },
  setVariables: function(result, operation, share) {
    var property, variable, variables;
    if (variables = operation.variables) {
      if (!result.variables && share) {
        result.variables = variables;
      } else {
        for (property in variables) {
          variable = variables[property];
          (result.variables || (result.variables = {}))[property] = variable;
        }
      }
    } else if (operation[0] === 'get') {
      (result.variables || (result.variables = {}))[operation[1]] = operation;
    }
    return result.variables;
  },
  reify: function(operation, domain, from) {
    var arg, k, len, ref;
    if (operation.domain === from) {
      if (!((ref = operation[0]) != null ? ref.push : void 0)) {
        operation.domain = domain;
      }
    }
    for (k = 0, len = operation.length; k < len; k++) {
      arg = operation[k];
      if (arg && arg.push) {
        this.reify(arg, domain, from);
      }
    }
    return operation;
  },
  cleanup: function(name, continuation) {
    var length, old, prop, results;
    old = this[name];
    if (continuation) {
      if (old) {
        length = continuation.length;
        results = [];
        for (prop in old) {
          if (prop.length > length) {
            if (prop.substring(0, length) === continuation) {
              results.push(delete old[prop]);
            } else {
              results.push(void 0);
            }
          } else {
            results.push(void 0);
          }
        }
        return results;
      }
    } else {
      return this[name] = void 0;
    }
  },
  reset: function(continuation) {
    this.cleanup('queries', continuation);
    this.cleanup('snapshots', continuation);
    return this.cleanup('mutations');
  },
  commit: function() {
    var changes;
    if (this.restyled) {
      this.restyled = void 0;
    }
    if (this.reflown) {
      this.reflown = void 0;
    }
    if (changes = this.changes) {
      this.changes = void 0;
    }
    return changes;
  },
  getProblems: function(callback, bind) {
    return this.engine.clone(this.problems);
  },
  finish: function() {
    this.time = this.engine.console.getTime(this.started);
    return this.started = void 0;
  },
  start: function() {
    return this.started != null ? this.started : this.started = this.engine.console.getTime();
  },
  isDone: function() {
    return (this.domains.length === this.index + 1) && this.isDocumentDone() && this.isDataDone();
  },
  isDocumentDone: function() {
    return !(this.mutations || this.deferred || this.pairs || this.stylesheets || this.branches);
  },
  isDataDone: function() {
    return !(this.constraints || this.assignments || this.ranges);
  },
  isDirty: function() {
    return this.restyled || this.changes || this.reflown || this.engine.data.changes;
  },
  hadSideEffects: function(solution) {
    return this.solution || this.domains.length > 0 || this.hasOwnProperty('restyled');
  },
  block: function() {
    return this.blocking++;
  },
  unblock: function() {
    return --this.blocking === 0;
  },
  blocking: 0,
  index: -1
};

module.exports = Update;


},{}],9:[function(require,module,exports){
var Condition, Query,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Query = require('../Query');

Condition = (function(superClass) {
  extend(Condition, superClass);

  Condition.prototype.type = 'Condition';

  Condition.prototype.Sequence = void 0;

  Condition.prototype.signature = [
    {
      "if": ['Query', 'Selector', 'Variable', 'Constraint', 'Default'],
      then: ['Any']
    }, [
      {
        "else": ['Any']
      }
    ]
  ];

  Condition.prototype.List = {
    2: true,
    3: true
  };

  Condition.prototype.cleaning = true;

  Condition.prototype.conditional = 1;

  Condition.prototype.boundaries = true;

  Condition.prototype.domains = {
    1: 'output'
  };

  function Condition(operation, engine) {
    var command, parent, previous;
    this.path = this.key = this.serialize(operation, engine);
    if (this.linked) {
      if (parent = operation.parent) {
        previous = parent[parent.indexOf(operation) - 1];
        if (command = previous.command) {
          if (command.type === 'Condition') {
            command.next = operation;
            this.previous = command;
            this.key = this.path = this.delimit(this.previous.key, this.ASCEND) + this.key;
          }
        }
      }
    }
  }

  Condition.prototype.descend = function(engine, operation, continuation, scope) {
    var branch, evaluate, path;
    continuation = this.delimit(continuation, this.DESCEND);
    if (this.conditional) {
      path = continuation + this.key;
      if (!engine.queries.hasOwnProperty(path)) {
        engine.queries[path] = 0;
        evaluate = true;
      }
      this.after([], engine.queries[path], engine, operation, continuation, scope);
      if (evaluate) {
        branch = operation[this.conditional];
        branch.command.solve(engine, branch, continuation, scope);
      }
    }
    return false;
  };

  Condition.prototype.execute = function(value) {
    return value;
  };

  Condition.prototype.serialize = function(operation, engine) {
    return '@' + this.toExpression(operation[1]);
  };

  Condition.prototype.getOldValue = function(engine, continuation) {
    var old, ref, ref1;
    old = (ref = (ref1 = engine.updating.snapshots) != null ? ref1[continuation] : void 0) != null ? ref : 0;
    return old > 0 || (old === 0 && 1 / old !== -Infinity);
  };

  Condition.prototype.ascend = function(engine, operation, continuation, scope, result, recursive) {
    var base, condition, conditions, contd, i, index, len, length;
    if (conditions = ((base = engine.updating).branches || (base.branches = []))) {
      if (engine.indexOfTriplet(conditions, operation, continuation, scope) === -1) {
        length = continuation.length;
        for (index = i = 0, len = conditions.length; i < len; index = i += 3) {
          condition = conditions[index];
          contd = conditions[index + 1];
          if (contd.length >= length) {
            break;
          } else if (continuation.charAt(contd.length) === this.DESCEND && continuation.substring(0, contd.length) === contd) {
            return;
          }
        }
        return conditions.splice(index || 0, 0, operation, continuation, scope);
      }
    }
  };

  Condition.prototype.rebranch = function(engine, operation, continuation, scope) {
    var branch, increment, path, prefix;
    increment = this.getOldValue(engine, continuation) ? -1 : 1;
    engine.queries[continuation] = (engine.queries[continuation] || 0) + increment;
    if (branch = this.previous) {
      if (prefix = this.getPrefixPath(engine, continuation)) {
        prefix += this.DESCEND;
      }
      while (branch) {
        path = prefix + branch.key;
        if (engine.queries[path] > 0) {
          return;
        }
        branch = branch.previous;
      }
    }
    return this.branch(engine, operation, continuation, scope, increment === -1);
  };

  Condition.prototype.branch = function(engine, operation, continuation, scope, choice) {
    var branch, index, inverted, result;
    inverted = operation[0] === 'unless';
    index = this.conditional + 1 + (choice ^ inverted);
    if (branch = operation[index]) {
      engine.console.start(index === 2 && 'if' || 'else', operation[index], continuation);
      result = engine.input.Command(branch).solve(engine.input, branch, this.delimit(continuation, this.DESCEND), scope);
      engine.console.end(result);
    }
    return result;
  };

  Condition.prototype.unbranch = function(engine, operation, continuation, scope) {
    var increment, old, ref;
    if (old = (ref = engine.updating.snapshots) != null ? ref[continuation] : void 0) {
      increment = this.getOldValue(engine, continuation) ? -1 : 1;
      if ((engine.queries[continuation] += increment) === 0) {
        this.clean(engine, continuation, continuation, operation, scope);
        return true;
      }
    }
  };

  Condition.prototype["yield"] = function(result, engine, operation, continuation, scope) {
    var base, old, path, ref, scoped, value;
    if (!(operation.parent.indexOf(operation) > 1)) {
      if (operation[0].key != null) {
        continuation = operation[0].key;
        if (scoped = operation[0].scope) {
          scope = engine.identity[scoped];
        }
      }
      if (this.bound) {
        continuation = this.getPrefixPath(engine, continuation);
      }
      path = this.delimit(continuation, this.DESCEND) + this.key;
      if ((result != null ? result.push : void 0) && result.valueOf !== Array.prototype.valueOf) {
        result = result.valueOf();
        if (result === 0) {
          result = true;
        } else {
          result || (result = false);
        }
      }
      value = engine.queries[path];
      if (result && !value) {
        value = -0;
      }
      ((base = engine.updating).snapshots || (base.snapshots = {}))[path] = value;
      if (old = (ref = engine.updating.snapshots) != null ? ref[path] : void 0) {
        if (this.getOldValue(engine, path) === !!result) {
          return true;
        }
      }
      this.notify(engine, path, scope, result);
      return true;
    }
  };

  return Condition;

})(Query);

Condition.Global = Condition.extend({
  condition: function(engine, operation, command) {
    var argument, i, len;
    if (command) {
      operation = operation[1];
    }
    if (operation[0] === 'get' || operation[1] === 'virtual') {
      if (operation.length === 2) {
        return false;
      }
    } else if (operation[0] === '&') {
      return false;
    }
    for (i = 0, len = operation.length; i < len; i++) {
      argument = operation[i];
      if (argument && argument.push && this.condition(engine, argument) === false) {
        return false;
      }
    }
    return true;
  },
  global: true
});

Condition.Selector = Condition.extend({
  condition: function(engine, operation, command) {
    var argument, i, len;
    if (command) {
      operation = operation[1];
    }
    if (operation.command.type === 'Selector' && (operation.length > 1 || (operation.parent.command.type === 'Selector' && operation.parent.command.type === 'Iterator'))) {
      return true;
    }
    for (i = 0, len = operation.length; i < len; i++) {
      argument = operation[i];
      if (argument && argument.push && this.condition(engine, argument)) {
        return true;
      }
    }
    return false;
  },
  bound: true
});

Condition.prototype.advices = [Condition.Selector, Condition.Global];

Condition.define('if', {});

Condition.define('unless', {
  inverted: true
});

Condition.define('else', {
  signature: [
    {
      then: ['Any']
    }
  ],
  linked: true,
  conditional: null,
  domains: {}
});

Condition.define('elseif', {
  linked: true
});

Condition.define('elsif', {});

module.exports = Condition;


},{"../Query":7}],10:[function(require,module,exports){
var Command, Constraint;

Command = require('../Command');

Constraint = Command.extend({
  type: 'Constraint',
  signature: [
    {
      left: ['Variable', 'Number'],
      right: ['Variable', 'Number']
    }, [
      {
        strength: ['String'],
        weight: ['Number']
      }
    ]
  ],
  log: function(args, engine, operation, continuation, scope, name) {
    return engine.console.push(name || operation[0], args, operation.hash || (operation.hash = this.toExpression(operation)));
  },
  toHash: function(meta) {
    var hash, property;
    hash = '';
    if (meta.values) {
      for (property in meta.values) {
        hash += property;
      }
    }
    return hash;
  },
  fetch: function(engine, operation) {
    var constraint, operations, ref, ref1, signature;
    if (operations = (ref = engine.operations) != null ? ref[operation.hash || (operation.hash = this.toExpression(operation))] : void 0) {
      for (signature in operations) {
        constraint = operations[signature];
        if (((ref1 = engine.constraints) != null ? ref1.indexOf(constraint) : void 0) > -1) {
          return constraint;
        }
      }
    }
  },
  declare: function(engine, constraint) {
    var constraints, definition, op, path, ref, ref1, ref2, ref3;
    ref = constraint.variables;
    for (path in ref) {
      op = ref[path];
      if (definition = engine.variables[path]) {
        constraints = definition.constraints || (definition.constraints = []);
        if (((ref1 = constraints[0]) != null ? (ref2 = ref1.operations[0]) != null ? (ref3 = ref2.parent.values) != null ? ref3[path] : void 0 : void 0 : void 0) == null) {
          if (constraints.indexOf(constraint) === -1) {
            constraints.push(constraint);
          }
        }
      }
    }
  },
  undeclare: function(engine, constraint, quick) {
    var i, j, len, matched, object, op, other, path, ref, ref1, ref2, ref3;
    ref = constraint.variables;
    for (path in ref) {
      op = ref[path];
      if (object = engine.variables[path]) {
        if ((i = (ref1 = object.constraints) != null ? ref1.indexOf(constraint) : void 0) > -1) {
          object.constraints.splice(i, 1);
          matched = false;
          ref2 = object.constraints;
          for (j = 0, len = ref2.length; j < len; j++) {
            other = ref2[j];
            if (engine.constraints.indexOf(other) > -1 && (((ref3 = other.operations[0].parent[0].values) != null ? ref3[path] : void 0) == null)) {
              matched = true;
              break;
            }
          }
          if (!matched) {
            op.command.undeclare(engine, object, quick);
          }
        }
      }
    }
  },
  add: function(constraint, engine, operation, continuation) {
    var i, j, op, operations, other;
    other = this.fetch(engine, operation);
    operations = constraint.operations || (constraint.operations = (other != null ? other.operations : void 0) || []);
    constraint.variables = operation.variables;
    if (operations.indexOf(operation) === -1) {
      for (i = j = operations.length - 1; j >= 0; i = j += -1) {
        op = operations[i];
        if (op.hash === operation.hash && op.parent[0].key === continuation) {
          operations.splice(i, 1);
          this.unwatch(engine, op, continuation);
        }
      }
      operations.push(operation);
    }
    this.watch(engine, operation, continuation);
    if (other !== constraint) {
      if (other) {
        this.unset(engine, other, true);
      }
      this.set(engine, constraint);
    }
  },
  reset: function(engine) {
    var constraint, editing, j, k, l, len, len1, len2, len3, len4, m, n, property, ref, ref1, ref2, ref3, ref4;
    if (engine.constrained) {
      ref = engine.constrained;
      for (j = 0, len = ref.length; j < len; j++) {
        constraint = ref[j];
        engine.Constraint.prototype.declare(engine, constraint);
      }
    }
    if (engine.unconstrained) {
      ref1 = engine.unconstrained;
      for (k = 0, len1 = ref1.length; k < len1; k++) {
        constraint = ref1[k];
        engine.Constraint.prototype.undeclare(engine, constraint);
      }
    }
    if (false) {
      engine.instance = void 0;
      engine.construct();
      if (editing = engine.editing) {
        engine.editing = void 0;
        for (property in editing) {
          constraint = editing[property];
          engine.edit(engine.variables[property], engine.variables[property].value);
        }
      }
      if (engine.constraints) {
        ref2 = engine.constraints;
        for (l = 0, len2 = ref2.length; l < len2; l++) {
          constraint = ref2[l];
          engine.Constraint.prototype.inject(engine, constraint);
        }
      }
    } else {
      if (engine.unconstrained) {
        ref3 = engine.unconstrained;
        for (m = 0, len3 = ref3.length; m < len3; m++) {
          constraint = ref3[m];
          engine.Constraint.prototype.eject(engine, constraint);
        }
      }
      if (engine.constrained) {
        ref4 = engine.constrained;
        for (n = 0, len4 = ref4.length; n < len4; n++) {
          constraint = ref4[n];
          engine.Constraint.prototype.inject(engine, constraint);
        }
      }
      engine.constrained || (engine.constrained = []);
    }
    return engine.unconstrained = void 0;
  },
  set: function(engine, constraint) {
    var index, ref, ref1;
    if ((engine.constraints || (engine.constraints = [])).indexOf(constraint) === -1) {
      engine.constraints.push(constraint);
      if ((index = (ref = engine.unconstrained) != null ? ref.indexOf(constraint) : void 0) > -1) {
        return engine.unconstrained.splice(index, 1);
      } else if (!(((ref1 = engine.constrained) != null ? ref1.indexOf(constraint) : void 0) > -1)) {
        return (engine.constrained || (engine.constrained = [])).push(constraint);
      }
    }
  },
  unset: function(engine, constraint, quick) {
    var index, j, operation, path, ref, ref1;
    if ((index = engine.constraints.indexOf(constraint)) > -1) {
      engine.constraints.splice(index, 1);
      if ((index = (ref = engine.constrained) != null ? ref.indexOf(constraint) : void 0) > -1) {
        engine.constrained.splice(index, 1);
      } else if ((engine.unconstrained || (engine.unconstrained = [])).indexOf(constraint) === -1) {
        engine.unconstrained.push(constraint);
      }
    }
    ref1 = constraint.operations;
    for (index = j = ref1.length - 1; j >= 0; index = j += -1) {
      operation = ref1[index];
      if ((path = operation.parent[0].key) != null) {
        this.unwatch(engine, operation, path);
        if (!quick) {
          constraint.operations.splice(index, 1);
        }
      }
    }
  },
  unwatch: function(engine, operation, continuation) {
    var i, paths;
    if (paths = engine.paths[continuation]) {
      if ((i = paths.indexOf(operation)) > -1) {
        paths.splice(i, 1);
        if (paths.length === 0) {
          return delete engine.paths[continuation];
        }
      }
    }
  },
  watch: function(engine, operation, continuation) {
    return engine.add(continuation, operation);
  },
  cleanup: function(engine) {
    var constraint, hash, operations, ref, signature;
    ref = engine.operations;
    for (hash in ref) {
      operations = ref[hash];
      for (signature in operations) {
        constraint = operations[signature];
        if (!constraint.operations.length) {
          delete operations[signature];
          if (!Object.keys(operations).length) {
            delete engine.operations[hash];
          }
        }
      }
    }
  },
  remove: function(engine, operation, continuation) {
    var constraint, index, operations;
    if (constraint = this.fetch(engine, operation)) {
      if (operations = constraint.operations) {
        if ((index = operations.indexOf(operation)) > -1) {
          operations.splice(index, 1);
          if (operations.length === 0) {
            this.unset(engine, constraint);
          }
          return this.unwatch(engine, operation, continuation);
        }
      }
    }
  },
  find: function(engine, variable) {
    var j, len, other, ref;
    ref = variable.constraints;
    for (j = 0, len = ref.length; j < len; j++) {
      other = ref[j];
      if (other.operations[0].variables[variable.name].domain === engine) {
        if (engine.constraints.indexOf(other) > -1) {
          return true;
        }
      }
    }
  },
  group: function(constraints) {
    var constraint, group, groupped, groups, j, k, l, len, len1, other, others, path, vars;
    groups = [];
    for (j = 0, len = constraints.length; j < len; j++) {
      constraint = constraints[j];
      groupped = void 0;
      vars = constraint.variables;
      for (k = groups.length - 1; k >= 0; k += -1) {
        group = groups[k];
        for (l = 0, len1 = group.length; l < len1; l++) {
          other = group[l];
          others = other.variables;
          for (path in vars) {
            if (others[path]) {
              if (groupped && groupped !== group) {
                groupped.push.apply(groupped, group);
                groups.splice(groups.indexOf(group), 1);
              } else {
                groupped = group;
              }
              break;
            }
          }
          if (groups.indexOf(group) === -1) {
            break;
          }
        }
      }
      if (!groupped) {
        groups.push(groupped = []);
      }
      groupped.push(constraint);
    }
    return groups;
  },
  split: function(engine) {
    var arg, args, commands, constraint, equal, group, groups, i, index, j, k, l, len, len1, len2, len3, m, operation, ref, separated, shift;
    groups = this.group(engine.constraints).sort(function(a, b) {
      var al, bl;
      al = a.length;
      bl = b.length;
      return bl - al;
    });
    separated = groups.splice(1);
    commands = [];
    if (separated.length) {
      shift = 0;
      for (index = j = 0, len = separated.length; j < len; index = ++j) {
        group = separated[index];
        for (index = k = 0, len1 = group.length; k < len1; index = ++k) {
          constraint = group[index];
          this.unset(engine, constraint, true);
          ref = constraint.operations;
          for (l = 0, len2 = ref.length; l < len2; l++) {
            operation = ref[l];
            commands.push(operation.parent);
          }
        }
      }
    }
    if (commands != null ? commands.length : void 0) {
      if (commands.length === 1) {
        commands = commands[0];
      }
      args = arguments;
      if (args.length === 1) {
        args = args[0];
      }
      if (commands.length === args.length) {
        equal = true;
        for (i = m = 0, len3 = args.length; m < len3; i = ++m) {
          arg = args[i];
          if (commands.indexOf(arg) === -1) {
            equal = false;
            break;
          }
        }
        if (equal) {
          throw new Error('Trying to separate what was just added. Means loop. ');
        }
      }
      return engine.Command.orphanize(commands);
    }
  }
});

module.exports = Constraint;


},{"../Command":3}],11:[function(require,module,exports){
var Command, Iterator,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Command = require('../Command');

Iterator = (function(superClass) {
  extend(Iterator, superClass);

  function Iterator() {
    return Iterator.__super__.constructor.apply(this, arguments);
  }

  Iterator.prototype.type = 'Iterator';

  Iterator.prototype.signature = [
    {
      collection: ['Query', 'Selector'],
      body: ['Any']
    }
  ];

  Iterator.prototype.List = {
    2: true
  };

  Iterator.prototype["yield"] = function(result, engine, operation, continuation, scope) {
    var contd, op;
    if (operation.parent.indexOf(operation) === 1) {
      contd = this.delimit(continuation, this.DESCEND);
      op = operation.parent[2];
      op.command.solve(engine, op, contd, result);
      return true;
    }
  };

  Iterator.prototype.descend = function(engine, operation, continuation, scope, ascender, ascending) {
    var argument, command;
    argument = operation[1];
    command = argument.command || engine.Command(argument);
    argument.parent || (argument.parent = operation);
    command.solve(operation.domain || engine, argument, continuation, scope);
    return false;
  };

  return Iterator;

})(Command);

Iterator.define({
  "rule": {
    index: 'rules',
    advices: [
      function(engine, operation, command) {
        var parent;
        parent = operation;
        while (parent.parent) {
          parent = parent.parent;
        }
        operation.index = parent.rules = (parent.rules || 0) + 1;
      }
    ]
  },
  "each": {}
});

module.exports = Iterator;


},{"../Command":3}],12:[function(require,module,exports){
var Command, Range,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Command = require('../Command');

Range = (function(superClass) {
  extend(Range, superClass);

  function Range() {
    return Range.__super__.constructor.apply(this, arguments);
  }

  Range.prototype.type = 'Range';

  Range.prototype.signature = [
    {
      from: ['Boolean', 'Number', 'Variable', 'Range']
    }, [
      {
        to: ['Boolean', 'Number', 'Variable', 'Range'],
        now: ['Number']
      }
    ]
  ];

  Range.prototype.extras = 0;

  Range.define({
    '...': function(from, to, progress) {
      var range, size;
      if (to != null) {
        if (to === false) {
          range = [from];
        } else {
          range = [from, to];
        }
      } else {
        range = [false, from];
      }
      if (size = this.size) {
        range.length = size;
      }
      if (progress != null) {
        range[2] = progress;
      }
      this.wrap(range);
      return range;
    }
  });

  Range.prototype.valueOf = function() {
    var end, start;
    start = this[0];
    end = this[1];
    return this[2] * ((end - start) || 1) + start;
  };

  Range.prototype.wrap = function(range) {
    range.valueOf = this.valueOf;
    return range;
  };

  Range.prototype.pause = function(range, engine, operation, continuation, scope) {
    range.operation = operation;
    range.continuation = continuation;
    range.scope = scope;
    return range;
  };

  Range.prototype.resume = function(range, engine) {
    this.start(range, engine, range.operation, range.continuation, range.scope);
    return range.operation.command.update(range, engine, range.operation, range.continuation, range.scope);
  };

  Range.prototype.copy = function(range) {
    var copy;
    copy = range.slice();
    copy.valueOf = range.valueOf;
    if (range.operation) {
      copy.operation = range.operation;
      copy.continuation = range.continuation;
      copy.scope = range.scope;
    }
    return copy;
  };

  Range.prototype.start = function(range, engine, operation, continuation, scope) {
    var base, base1, i, index, other, ranges;
    ranges = (base = ((base1 = engine.engine).ranges || (base1.ranges = {})))[continuation] || (base[continuation] = []);
    if ((index = ranges.indexOf(operation)) === -1) {
      i = 0;
      while ((other = ranges[i]) && other.length < range.length) {
        i += 3;
      }
      ranges.splice(i, 0, operation, scope, range);
    } else {
      ranges[index + 2] = range;
    }
    return range;
  };

  return Range;

})(Command);

Range.Modifier = (function(superClass) {
  extend(Modifier, superClass);

  function Modifier() {
    return Modifier.__super__.constructor.apply(this, arguments);
  }

  Modifier.prototype.signature = [
    [
      {
        from: ['Boolean', 'Number', 'Variable', 'Range'],
        to: ['Boolean', 'Number', 'Variable', 'Range']
      }
    ]
  ];

  Modifier.prototype.before = function(args, domain, operation, continuation, scope, ascender, ascending) {
    if (typeof args[0] !== 'number' || typeof args[1] === 'number') {
      if (operation[0].indexOf('>') === -1) {
        return this.scale(args[0], null, args[1]);
      } else if (typeof args[1] === 'number') {
        return this.scale(args[0], args[1], null);
      }
    } else {
      if (operation[0].indexOf('>') === -1) {
        return this.scale(args[1], args[0], null);
      }
    }
    return this.scale(args[1], null, args[0]);
  };

  Modifier.prototype.valueOf = function() {
    var end, start, value;
    if ((value = this[2]) != null) {
      if ((start = this[0]) === false || value > 0) {
        if ((end = this[1]) === false) {
          if (value !== 1 || start === 0) {
            return value * ((end - start) || 1) + start;
          }
        } else {
          if (value < 1) {
            return value * ((end - start) || 1) + start;
          }
        }
      }
    }
  };

  Modifier.prototype.scale = function(range, start, finish) {
    var from, progress, reversed, to, value;
    if (!range.push) {
      if (start != null) {
        if (start <= range) {
          return this.wrap([start, false, range / (start || 1)]);
        } else {
          return this.wrap([start, false, range / (start || 1) - 1]);
        }
      } else if (finish != null) {
        return this.wrap([false, finish, range / finish]);
      } else {
        return this.wrap([start, false, range / start]);
      }
    }
    reversed = +((range[0] > range[1]) && (range[1] != null));
    from = range[reversed];
    to = range[1 - reversed];
    if (start !== null && !(from > start)) {
      range = this.copy(range);
      if ((value = range[2]) != null) {
        to || (to = 0);
        progress = value * (to - from);
        range[2] = (progress - (start - from)) / (to - start);
      }
      range[+reversed] = from = start;
    }
    if (finish !== null && !(to < finish)) {
      range = this.copy(range);
      if ((value = range[2]) != null) {
        from || (from = 0);
        to || (to = 0);
        progress = value * (to - from);
        range[2] = progress / (finish - from);
      }
      range[1 - reversed] = finish;
    }
    if (range[2] < 0 || range[2] > 1) {
      range.valueOf = this.execute;
    }
    return range;
  };

  Modifier.prototype.after = function(args, result) {
    if (result === false) {
      return;
    }
    return result;
  };

  Modifier.define({
    '-': function(from, to, progress) {
      return progress;
    },
    '~': function(from, to, progress) {
      if (Math.floor(progress % 2)) {
        return 1 - progress % 1;
      } else {
        return progress % 1;
      }
    },
    '|': function(from, to, progress) {
      if (progress > to) {
        return to;
      }
      if (progress < from) {
        return from;
      }
    },
    '<': function(from, to, progress) {},
    '>': function(from, to, progress) {}
  });

  return Modifier;

})(Range);

Range.Modifier.Including = (function(superClass) {
  extend(Including, superClass);

  function Including() {
    return Including.__super__.constructor.apply(this, arguments);
  }

  Including.prototype.valueOf = function() {
    var end, start, value;
    if ((value = this[2]) != null) {
      if ((start = this[0]) === false || value >= 0) {
        if ((end = this[1]) === false || value <= 1) {
          return value * ((end - start) || 1) + start;
        }
      }
    }
  };

  Including.define({
    '<=': function(from, to, progress) {},
    '>=': function(from, to, progress) {}
  });

  return Including;

})(Range.Modifier);

Range.Progress = (function(superClass) {
  extend(Progress, superClass);

  function Progress() {
    return Progress.__super__.constructor.apply(this, arguments);
  }

  Progress.prototype.after = function(args, result, engine, operation, continuation, scope) {
    if (operation.anonymous) {
      this.start(result, engine, operation, continuation, scope);
    } else {
      this.pause(result, engine, operation, continuation, scope);
    }
    return result;
  };

  Progress.prototype.advices = [
    function(engine, operation, command) {
      var op, parent;
      op = operation;
      while (parent = op.parent) {
        if (parent[0] === 'map') {
          operation.anonymous = true;
        }
        op = parent;
      }
    }
  ];

  return Progress;

})(Range);

Range.Easing = (function(superClass) {
  extend(Easing, superClass);

  function Easing(obj) {
    if (typeof obj === 'string') {
      if (obj = this.Type.Timings[obj]) {
        return obj;
      }
    } else if (obj[0] === 'steps' || obj[0] === 'cubic-bezier') {
      return obj;
    }
  }

  Easing.define({
    'ease': ['cubic-bezier', .42, 0, 1, 1],
    'ease-in': ['cubic-bezier', .42, 0, 1, 1],
    'ease-out': ['cubic-bezier', 0, 0, .58, 1],
    'ease-in-out': ['cubic-bezier', .42, 0, .58, 1],
    'linear': ['cubic-bezier', 0, 0, 1, 1],
    'step-start': function(value) {
      return Math.floor(value);
    },
    'step-end': function(value) {
      return Math.ceil(value);
    },
    out: function(value) {
      return 1 - value;
    },
    linear: function(value) {
      return value;
    },
    quad: function(value) {
      return Math.pow(value, 2);
    },
    cubic: function(value) {
      return Math.pow(value, 3);
    },
    quart: function(value) {
      return Math.pow(value, 4);
    },
    expo: function(value) {
      return Math.pow(2, 8 * (value - 1));
    },
    circ: function(value) {
      return 1 - Math.sin(Math.acos(value));
    },
    sine: function(value) {
      return 1 - Math.cos(value * Math.PI / 2);
    },
    back: function(value) {
      return Math.pow(value, 2) * ((1.618 + 1) * value - 1.618);
    },
    elastic: function(value) {
      return Math.pow(2, 10 * --value) * Math.cos(20 * value * Math.PI * 1 / 3);
    }
  });

  return Easing;

})(Range.Progress);

Range.Mapper = (function(superClass) {
  extend(Mapper, superClass);

  function Mapper() {
    return Mapper.__super__.constructor.apply(this, arguments);
  }

  Mapper.prototype.signature = [
    {
      from: ['Number', 'Variable', 'Range'],
      to: ['Number', 'Variable', 'Range']
    }
  ];

  Mapper.prototype.extras = null;

  Mapper.define({
    map: function(left, right, engine, operation, continuation, scope, ascender, ascending) {
      var end, ref, ref1, ref2, start;
      if (ascender === 2) {
        if ((start = (ref = left[2]) != null ? ref : left[0]) != null) {
          if (start !== false && right < start) {
            right = start;
          } else if ((end = left.push ? left[1] : left) < right) {
            right = end;
          }
        } else if ((end = left.push ? left[1] : left) < right) {
          right = end;
        } else if (right < 0) {
          return;
        }
        return right;
      } else {
        engine.updating.ranges = true;
        if (left.length < 4) {
          if ((left[0] != null) && (left[1] != null)) {
            right[2] = left[0] || null;
            right[3] = ((ref1 = (ref2 = left[2]) != null ? ref2 : left[1]) != null ? ref1 : left) || 0;
          }
        } else {
          if (right.length < 4) {
            right[2] = +left;
          } else {
            right[3] = +left || 0;
          }
        }
        if (right.operation) {
          this.resume(right, engine);
        }
        if (!left.push) {
          return this.valueOf.call(right);
        } else {
          return right;
        }
      }
    }
  });

  return Mapper;

})(Range);

module.exports = Range;


},{"../Command":3}],13:[function(require,module,exports){
var Command, Variable,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Command = require('../Command');

Variable = (function(superClass) {
  extend(Variable, superClass);

  Variable.prototype.type = 'Variable';

  Variable.prototype.signature = [
    {
      property: ['String']
    }
  ];

  Variable.prototype.log = function() {};

  Variable.prototype.unlog = function() {};

  function Variable() {}

  Variable.prototype.before = function(args, engine, operation, continuation, scope, ascender, ascending) {
    var ref, value;
    if ((value = ascending != null ? (ref = ascending.values) != null ? ref[args[0]] : void 0 : void 0) != null) {
      return value;
    }
  };

  Variable.prototype.declare = function(engine, name) {
    var variable, variables;
    variables = engine.variables;
    if (!(variable = variables[name])) {
      variable = variables[name] = engine.variable(name);
    }
    (engine.declared || (engine.declared = {}))[name] = variable;
    return variable;
  };

  Variable.prototype.undeclare = function(engine, variable, quick) {
    var ref;
    if (quick) {
      (engine.replaced || (engine.replaced = {}))[variable.name] = variable;
    } else {
      (engine.nullified || (engine.nullified = {}))[variable.name] = variable;
      if ((ref = engine.declared) != null ? ref[variable.name] : void 0) {
        delete engine.declared[variable.name];
      }
    }
    delete engine.values[variable.name];
    engine.nullify(variable);
    return engine.unedit(variable);
  };

  Variable.prototype.cleanup = function(engine) {
    var constraints, name, ref, results, variable;
    ref = engine.variables;
    results = [];
    for (name in ref) {
      variable = ref[name];
      if (constraints = variable.constraints) {
        if (!constraints.length) {
          results.push(delete engine.variables[name]);
        } else {
          results.push(void 0);
        }
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  return Variable;

})(Command);

Variable.Expression = (function(superClass) {
  extend(Expression, superClass);

  function Expression() {
    return Expression.__super__.constructor.apply(this, arguments);
  }

  Expression.prototype.signature = [
    {
      left: ['Variable', 'Number', 'Range'],
      right: ['Variable', 'Number', 'Range']
    }
  ];

  return Expression;

})(Variable);

Variable.Expression.algebra = {
  '+': function(left, right) {
    return left + right;
  },
  '-': function(left, right) {
    return left - right;
  },
  '*': function(left, right) {
    return left * right;
  },
  '/': function(left, right) {
    return left / right;
  },
  '%': function(left, right) {
    return left % right;
  },
  'min': function(left, right) {
    return Math.min(left, right);
  },
  'max': function(left, right) {
    return Math.max(left, right);
  },
  'pow': function(left, right) {
    return Math.pow(left, right);
  }
};

module.exports = Variable;


},{"../Command":3}],14:[function(require,module,exports){

/* Domain: Given values

Provides values that don't need to be solved
 */
var Command, Data, Domain, Variable,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Domain = require('../Domain');

Command = require('../Command');

Variable = require('../commands/Variable');

Data = (function(superClass) {
  extend(Data, superClass);

  function Data() {
    return Data.__super__.constructor.apply(this, arguments);
  }

  Data.prototype.priority = 200;

  Data.prototype["static"] = true;

  Data.prototype.url = null;

  Data.prototype.check = function(id, property) {
    return this.output.properties[property] || (this.properties[property] != null) || property.indexOf('intrinsic-') === 0 || property.indexOf('computed-') === 0 || ((this.properties[id._gss_id || id] && this.properties[(id._gss_id || id) + '[' + property + ']']) != null);
  };

  Data.prototype.verify = function(object, property) {
    var path;
    path = this.getPath(object, property);
    if (this.values.hasOwnProperty(path)) {
      return this.set(null, path, this.fetch(path));
    }
  };

  return Data;

})(Domain);

Data.prototype.Assignment = Command.extend({
  type: 'Assignment',
  signature: [
    {
      variable: ['String', 'Variable'],
      value: ['Variable', 'Number', 'Matrix', 'Command', 'Object', 'Range']
    }
  ]
}, {
  '=': function(variable, value, engine, operation, continuation) {
    var base, name;
    if (typeof variable === 'string') {
      name = variable;
    } else if (variable[0] === 'get' && variable.length === 2) {
      name = variable[1];
    }
    if (value !== value) {
      return;
    }
    if (name) {
      ((base = engine.updating).assignments || (base.assignments = [])).push(name, value, this.delimit(continuation), operation);
    } else {
      throw new Error('[Input] Unexpected expression on left side of `=`: ' + JSON.stringify(variable));
    }
  }
});

Data.prototype.Variable = Variable.extend({}, {
  get: function(path, engine, operation, continuation, scope) {
    var meta, prefix;
    if (meta = this.getMeta(operation)) {
      continuation = meta.key;
      scope = meta.scope && engine.identity[meta.scope] || scope || engine.scope;
    } else {
      if (engine.queries) {
        prefix = engine.Query.prototype.getScope(engine, void 0, continuation);
      }
      if (!prefix && engine.scope && engine.data.check(engine.scope, path)) {
        prefix = engine.scope;
        engine = engine.data;
      }
    }
    return engine.watch(prefix, path, operation, continuation, scope);
  }
});

Data.prototype.Variable.Getter = Data.prototype.Variable.extend({
  signature: [
    {
      object: ['Query', 'Selector', 'String'],
      property: ['String']
    }
  ]
}, {
  'get': function(object, property, engine, operation, continuation, scope) {
    var domain, prefix;
    if (engine.queries) {
      prefix = engine.Query.prototype.getScope(engine, object, continuation);
    }
    if (!prefix && engine.data.check(engine.scope, property)) {
      prefix = engine.scope;
      domain = engine.data;
    }
    return (domain || engine).watch(prefix, property, operation, continuation, scope);
  }
});

Data.prototype.Variable.Expression = Variable.Expression.extend({
  before: function(args, engine) {
    var arg, i, len;
    for (i = 0, len = args.length; i < len; i++) {
      arg = args[i];
      if ((arg == null) || arg !== arg) {
        return NaN;
      }
    }
  }
});

Data.prototype.Variable.Expression.define(Variable.Expression.algebra);

Data.prototype.Meta = Command.Meta.extend({}, {
  'object': {
    execute: function(result) {
      return result;
    },
    descend: function(engine, operation, continuation, scope, ascender, ascending) {
      var meta;
      if (ascender != null) {
        return [ascending];
      }
      meta = operation[0];
      scope = meta.scope && engine.identity[meta.scope] || engine.scope;
      return [operation[1].command.solve(engine, operation[1], meta.key, scope, void 0, operation[0])];
    }
  }
});

module.exports = Data;


},{"../Command":3,"../Domain":4,"../commands/Variable":13}],15:[function(require,module,exports){
var Command, Constraint, Domain, Input, Outputting, Solving, Variable,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  slice = [].slice;

Domain = require('../Domain');

Command = require('../Command');

Variable = require('../commands/Variable');

Constraint = require('../commands/Constraint');

Input = (function(superClass) {
  extend(Input, superClass);

  function Input() {
    return Input.__super__.constructor.apply(this, arguments);
  }

  Input.prototype.displayName = 'Input';

  Input.prototype.url = void 0;

  Input.prototype.helps = true;

  Input.prototype.Iterator = require('../commands/Iterator');

  Input.prototype.Condition = require('../commands/Condition');

  Input.prototype.Properties = (function() {
    function _Class() {}

    _Class.prototype.right = function(scope) {
      var id;
      id = this.identify(scope);
      return ['+', ['get', this.getPath(id, 'x')], ['get', this.getPath(id, 'width')]];
    };

    _Class.prototype.bottom = function(scope, path) {
      var id;
      id = this.identify(scope);
      return ['+', ['get', this.getPath(id, 'y')], ['get', this.getPath(id, 'height')]];
    };

    _Class.prototype.center = {
      x: function(scope, path) {
        var id;
        id = this.identify(scope);
        return ['+', ['get', this.getPath(id, 'x')], ['/', ['get', this.getPath(id, 'width')], 2]];
      },
      y: function(scope, path) {
        var id;
        id = this.identify(scope);
        return ['+', ['get', this.getPath(id, 'y')], ['/', ['get', this.getPath(id, 'height')], 2]];
      }
    };

    _Class.prototype.computed = {
      right: function(scope) {
        var id;
        id = this.identify(scope);
        return ['+', ['get', this.getPath(id, 'computed-x')], ['get', this.getPath(id, 'computed-width')]];
      },
      bottom: function(scope, path) {
        var id;
        id = this.identify(scope);
        return ['+', ['get', this.getPath(id, 'computed-y')], ['get', this.getPath(id, 'computed-height')]];
      }
    };

    return _Class;

  })();

  return Input;

})(Domain);

Input.prototype.Remove = Command.extend({
  signature: false,
  extras: 1
}, {
  remove: function() {
    var args, engine, j, k, len, path;
    args = 2 <= arguments.length ? slice.call(arguments, 0, j = arguments.length - 1) : (j = 0, []), engine = arguments[j++];
    for (k = 0, len = args.length; k < len; k++) {
      path = args[k];
      engine.Query.prototype.unobserve(engine, path);
      engine.Query.prototype.clean(engine, path);
    }
    return true;
  }
});

Input.prototype.Default = Command.Default.extend({
  extras: 2,
  execute: function() {
    var args, engine, j, operation;
    args = 3 <= arguments.length ? slice.call(arguments, 0, j = arguments.length - 2) : (j = 0, []), engine = arguments[j++], operation = arguments[j++];
    args.unshift(operation[0]);
    return args;
  }
});

Solving = Input.prototype.Default.extend({
  condition: function(engine, operation) {
    var parent;
    if (parent = operation.parent) {
      if (parent.command instanceof Input.prototype.Default) {
        return false;
      }
    }
    operation.index || (operation.index = engine.input.index = (engine.input.index || 0) + 1);
    return true;
  },
  extras: 4,
  execute: function() {
    var args, base, continuation, domain, engine, j, meta, operation, scope, wrapper;
    args = 5 <= arguments.length ? slice.call(arguments, 0, j = arguments.length - 4) : (j = 0, []), engine = arguments[j++], operation = arguments[j++], continuation = arguments[j++], scope = arguments[j++];
    meta = {
      key: this.delimit(continuation)
    };
    if (scope !== engine.scope) {
      meta.scope = engine.identify(scope);
    }
    args.unshift(operation[0]);
    wrapper = this.produce(meta, args, operation);
    wrapper.index = operation.index;
    args.parent = wrapper;
    if (domain = typeof this.domain === "function" ? this.domain(engine, operation) : void 0) {
      wrapper.parent = operation.parent;
      wrapper.domain || (wrapper.domain = domain);
    }
    ((base = engine.updating).constraints || (base.constraints = [])).push(wrapper, domain);
  },
  produce: function(meta, args) {
    return [meta, args];
  },
  domain: function(engine, operation) {
    var domain, parent, ref;
    if (parent = operation.parent) {
      if (domain = (ref = parent.command.domains) != null ? ref[parent.indexOf(operation)] : void 0) {
        return engine[domain];
      }
    }
  }
});

Outputting = function(engine, operation, command) {
  var ref;
  if (operation[0] === '=') {
    if (operation[2].push) {
      Outputting.patch(engine.output, operation[2], true);
    }
    return Outputting.patch(engine.output, operation, false);
  } else if (operation.command.type === 'Default' && !engine.solver.signatures[operation[0]] && (!engine.data.signatures[operation[0]]) && engine.output.signatures[operation[0]]) {
    if (((ref = operation.parent) != null ? ref.command.type : void 0) === 'Default') {
      return Outputting.patch(engine.output, operation);
    } else {
      return Outputting.patch(engine.output, operation, true);
    }
  }
};

Outputting.patch = function(engine, operation, rematch) {
  var argument, context, i, j, len, match, parent, ref;
  operation.domain = engine.output;
  parent = operation.parent;
  if ((parent != null ? parent.command.sequence : void 0) && parent.command.type !== 'List') {
    context = parent[parent.indexOf(operation) - 1];
  }
  if (rematch !== false) {
    for (i = j = 0, len = operation.length; j < len; i = ++j) {
      argument = operation[i];
      if (argument.push) {
        if (rematch || argument.command.type === 'Default' || argument.command.type === 'Variable') {
          if (engine.output.signatures[argument[0]]) {
            Outputting.patch(engine, argument, rematch);
          }
        }
      }
    }
  }
  if (rematch || !engine.solver.signatures[operation[0]]) {
    if (operation[0] === true) {
      match = Command.List;
    } else {
      match = engine.Command.match(engine.output, operation, operation.parent, (ref = operation.parent) != null ? ref.indexOf(operation) : void 0, context);
    }
    Command.assign(engine, operation, match, context);
    if (context == null) {
      Command.descend(operation.command, engine, operation);
    }
  }
  return match;
};

Input.prototype.Default.prototype.advices = [Outputting, Solving];

Input.prototype.List = Command.List;

Input.prototype.Variable = Variable.extend({
  signature: [
    {
      property: ['String']
    }
  ]
}, {
  'get': function(property, engine, operation, continuation, scope) {
    var object, variable;
    if (engine.queries) {
      if (scope === engine.scope) {
        scope = void 0;
      }
      object = engine.Query.prototype.getScope(engine, scope, continuation);
    }
    variable = ['get', engine.getPath(object, property)];
    if (operation.domain !== engine.input) {
      variable.domain = operation.domain;
    }
    return variable;
  }
});

Input.prototype.Variable.Getter = Input.prototype.Variable.extend({
  signature: [
    {
      object: ['Query', 'Selector', 'String'],
      property: ['String']
    }
  ]
}, {
  'get': function(object, property, engine, operation, continuation, scope) {
    var prefix, prop, variable;
    if (engine.queries) {
      prefix = engine.Query.prototype.getScope(engine, object, continuation);
    }
    if (prop = engine.properties[property]) {
      if (!prop.matcher) {
        return prop.call(engine, object, continuation);
      }
    }
    if (!prefix && engine.data.check(engine.scope, property)) {
      prefix = engine.scope;
    }
    variable = ['get', engine.getPath(prefix, property)];
    if (operation.domain !== engine.input) {
      variable.domain = operation.domain;
    }
    return variable;
  }
});

Input.prototype.Variable.Expression = Variable.Expression.extend({}, {
  '+': function(left, right) {
    return ['+', left, right];
  },
  '-': function(left, right) {
    return ['-', left, right];
  },
  '/': function(left, right) {
    return ['/', left, right];
  },
  '*': function(left, right) {
    return ['*', left, right];
  }
});

Input.prototype.Assignment = Command.extend({
  type: 'Assignment',
  signature: [
    {
      variable: ['String', 'Variable'],
      value: ['Variable', 'Number', 'Matrix', 'Command', 'Range', 'Default', 'String']
    }
  ]
});

module.exports = Input;


},{"../Command":3,"../Domain":4,"../commands/Condition":9,"../commands/Constraint":10,"../commands/Iterator":11,"../commands/Variable":13}],16:[function(require,module,exports){
var Command, Constraint, Domain, Linear, Variable, c,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  slice = [].slice;

Domain = require('../Domain');

Command = require('../Command');

Variable = require('../commands/Variable');

Constraint = require('../commands/Constraint');

c = require('cassowary');

c.HashTable = require('../../vendor/HashTable');

c.Strength.require = c.Strength.required;

Linear = (function(superClass) {
  extend(Linear, superClass);

  Linear.prototype.displayName = 'Linear';

  Linear.prototype.priority = 0;

  Linear.prototype.Engine = c;

  function Linear() {
    this.operations = {};
    this.addEventListener('cleanup', (function(_this) {
      return function() {
        _this.Constraint.prototype.cleanup(_this);
        return _this.Variable.prototype.cleanup(_this);
      };
    })(this));
    Linear.__super__.constructor.apply(this, arguments);
  }

  Linear.prototype.construct = function() {
    if (this.paths == null) {
      this.paths = {};
    }
    this.instance = new c.SimplexSolver();
    this.instance.autoSolve = false;
    if (this.console.level > 2) {
      c.debug = true;
      return c.trace = true;
    }
  };

  Linear.prototype.perform = function() {
    if (this.constrained) {
      this.constrained = this.suggested = void 0;
      if (this.instance._needsSolving) {
        this.instance.solve();
        return this.instance._changed;
      }
    } else if (this.suggested) {
      this.suggested = void 0;
      this.instance.resolve();
      return this.instance._changed;
    }
  };

  Linear.prototype.unedit = function(variable) {
    var constraint, ref;
    if (constraint = (ref = this.editing) != null ? ref[variable.name] : void 0) {
      this.instance.removeConstraint(constraint);
      if (!--variable.editing) {
        delete this.variables['%' + variable.name];
      }
      return delete this.editing[variable.name];
    }
  };

  Linear.prototype.edit = function(variable, strength, weight, continuation) {
    var constraint, ref;
    if (!((ref = this.editing) != null ? ref[variable.name] : void 0)) {
      constraint = variable.editor || (variable.editor = new c.EditConstraint(variable, this.strength(strength, 'strong'), this.weight(weight)));
      constraint.variable = variable;
      variable.editing = (variable.editing || 0) + 1;
      this.Constraint.prototype.inject(this, constraint);
      (this.editing || (this.editing = {}))[variable.name] = constraint;
    }
    return constraint;
  };

  Linear.prototype.nullify = function(variable, full) {
    this.instance._externalParametricVars["delete"](variable);
    return variable.value = 0;
  };

  Linear.prototype.suggest = function(path, value, strength, weight, continuation) {
    var variable;
    if (typeof path === 'string') {
      if (!(variable = this.variables[path])) {
        variable = this.Variable.prototype.declare(this, path);
      }
    } else {
      variable = path;
    }
    this.edit(variable, strength, weight, continuation);
    this.instance.suggestValue(variable, value);
    variable.value = value;
    this.suggested = true;
    return variable;
  };

  Linear.prototype.variable = function(name) {
    return new c.Variable({
      name: name
    });
  };

  Linear.prototype.strength = function(strength, byDefault) {
    if (byDefault == null) {
      byDefault = 'medium';
    }
    return strength && c.Strength[strength] || c.Strength[byDefault];
  };

  Linear.prototype.weight = function(weight, operation) {
    return weight;
  };

  return Linear;

})(Domain);

Linear.Mixin = {
  "yield": function(result, engine, operation, continuation, scope, ascender) {
    if (typeof result === 'number') {
      return operation.parent.domain.suggest('%' + operation.command.toExpression(operation), result, 'require');
    }
  }
};

Linear.prototype.Constraint = Constraint.extend({
  before: function(args, engine, operation, continuation, scope, ascender, ascending) {
    return this.get(engine, operation, ascending);
  },
  after: function(args, result, engine, operation, continuation, scope, ascender, ascending) {
    var base, base1, name1, name2;
    if (result.hashCode) {
      return (base = ((base1 = (engine.operations || (engine.operations = {})))[name2 = operation.hash || (operation.hash = this.toExpression(operation))] || (base1[name2] = {})))[name1 = this.toHash(ascending)] || (base[name1] = result);
    }
    return result;
  },
  get: function(engine, operation, scope) {
    var ref, ref1;
    return (ref = engine.operations) != null ? (ref1 = ref[operation.hash || (operation.hash = this.toExpression(operation))]) != null ? ref1[this.toHash(scope)] : void 0 : void 0;
  },
  "yield": Linear.Mixin["yield"],
  inject: function(engine, constraint) {
    return engine.instance.addConstraint(constraint);
  },
  eject: function(engine, constraint) {
    return engine.instance.removeConstraint(constraint);
  }
}, {
  '==': function(left, right, strength, weight, engine, operation) {
    return new c.Equation(left, right, engine.strength(strength), engine.weight(weight, operation));
  },
  '<=': function(left, right, strength, weight, engine, operation) {
    return new c.Inequality(left, c.LEQ, right, engine.strength(strength), engine.weight(weight, operation));
  },
  '>=': function(left, right, strength, weight, engine, operation) {
    return new c.Inequality(left, c.GEQ, right, engine.strength(strength), engine.weight(weight, operation));
  },
  '<': function(left, right, strength, weight, engine, operation) {
    return new c.Inequality(left, c.LEQ, engine['+'](right, 1), engine.strength(strength), engine.weight(weight, operation));
  },
  '>': function(left, right, strength, weight, engine, operation) {
    return new c.Inequality(left, c.GEQ, engine['+'](right, 1), engine.strength(strength), engine.weight(weight, operation));
  }
});

Linear.prototype.Variable = Variable.extend(Linear.Mixin, {
  get: function(path, engine, operation) {
    var variable;
    variable = this.declare(engine, path);
    return variable;
  }
});

Linear.prototype.Variable.Expression = Variable.Expression.extend(Linear.Mixin, {
  '+': function(left, right) {
    return c.plus(left, right);
  },
  '-': function(left, right) {
    return c.minus(left, right);
  },
  '*': function(left, right) {
    return c.times(left, right);
  },
  '/': function(left, right) {
    return c.divide(left, right);
  }
});

Linear.prototype.Meta = Command.Meta.extend({}, {
  'object': {
    execute: function(constraint, engine, operation) {
      if ((constraint != null ? constraint.hashCode : void 0) != null) {
        return operation[1].command.add(constraint, engine, operation[1], operation[0].key);
      }
    },
    descend: function(engine, operation) {
      var continuation, meta, scope;
      if (meta = operation[0]) {
        continuation = meta.key;
        scope = meta.scope && engine.identity[meta.scope] || engine.scope;
      }
      operation[1].parent = operation;
      return [operation[1].command.solve(engine, operation[1], continuation, scope, void 0, operation[0]), engine, operation];
    }
  }
});

Linear.prototype.Stay = Command.extend({
  signature: [
    {
      value: ['Variable']
    }
  ]
}, {
  stay: function(value, engine, operation) {
    engine.suggested = true;
    engine.instance.addStay(value);
  }
});

Linear.prototype.Remove = Command.extend({
  extras: 1,
  signature: false
}, {
  remove: function() {
    var args, engine, i;
    args = 2 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 1) : (i = 0, []), engine = arguments[i++];
    return engine.remove.apply(engine, args);
  }
});

module.exports = Linear;


},{"../../vendor/HashTable":21,"../Command":3,"../Domain":4,"../commands/Constraint":10,"../commands/Variable":13,"cassowary":2}],17:[function(require,module,exports){
var Constraint, Data, Output,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Data = require('./Data');

Constraint = require('../commands/Constraint');

Output = (function(superClass) {
  extend(Output, superClass);

  function Output() {
    return Output.__super__.constructor.apply(this, arguments);
  }

  Output.prototype.Range = require('../commands/Range');

  Output.prototype.displayName = 'Output';

  Output.prototype.immutable = true;

  Output.prototype.priority = -200;

  Output.prototype.finalized = true;

  return Output;

})(Data);

Output.prototype.Constraint = Constraint.extend({
  signature: [
    {
      left: ['Variable', 'Number', 'Constraint', 'Range'],
      right: ['Variable', 'Number', 'Constraint', 'Range']
    }
  ]
}, {
  "&&": function(a, b) {
    return a.valueOf() && b.valueOf() || false;
  },
  "||": function(a, b) {
    return a.valueOf() || b.valueOf() || false;
  },
  "!=": function(a, b) {
    return a.valueOf() !== b.valueOf() || false;
  },
  "==": function(a, b) {
    return a === b;
  }
});

module.exports = Output;


},{"../commands/Constraint":10,"../commands/Range":12,"./Data":14}],18:[function(require,module,exports){
var Console, i, len, method, ref,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Console = (function() {
  function Console(level) {
    var ref, ref1, ref2;
    this.level = level;
    this.onError = bind(this.onError, this);
    if (this.level == null) {
      this.level = (ref = typeof self !== "undefined" && self !== null ? self.GSS_LOG : void 0) != null ? ref : parseFloat((typeof self !== "undefined" && self !== null ? (ref1 = self.location) != null ? (ref2 = ref1.search.match(/log=([\d.]+)/)) != null ? ref2[1] : void 0 : void 0 : void 0) || 0);
    }
    if (!Console.bind) {
      this.level = 0;
    }
    this.stack = [];
    this.buffer = [];
    if (typeof self !== "undefined" && self !== null) {
      self.addEventListener('error', this.onError, false);
    }
  }

  Console.prototype.methods = ['log', 'warn', 'info', 'error', 'group', 'groupEnd', 'groupCollapsed', 'time', 'timeEnd', 'profile', 'profileEnd'];

  Console.prototype.groups = 0;

  Console.prototype.onError = function(e) {
    var results;
    results = [];
    while (this.pop(e)) {
      results.push(true);
    }
    return results;
  };

  Console.prototype.push = function(a, b, c, type) {
    var index;
    if (this.level >= 0.5 || type) {
      if (!this.buffer.length) {
        if (this.level > 1) {
          if (typeof console !== "undefined" && console !== null) {
            console.profile();
          }
        }
      }
      index = this.buffer.push(a, b, c, void 0, type || this.row);
      return this.stack.push(index - 5);
    }
  };

  Console.prototype.pop = function(d, type, update) {
    var index;
    if (type == null) {
      type = this.row;
    }
    if ((this.level >= 0.5 || type !== this.row) && this.stack.length) {
      index = this.stack.pop();
      this.buffer[index + 3] = d;
      if (type !== this.row) {
        this.buffer[index + 2] = this.getTime(this.buffer[index + 2]);
      }
      if (!this.stack.length) {
        this.flush();
      }
      return true;
    }
    return false;
  };

  Console.prototype.flush = function() {
    var i, index, item, len, ref;
    if (this.level > 1) {
      if (typeof console !== "undefined" && console !== null) {
        console.profileEnd();
      }
    }
    ref = this.buffer;
    for (index = i = 0, len = ref.length; i < len; index = i += 5) {
      item = ref[index];
      this.buffer[index + 4].call(this, this.buffer[index], this.buffer[index + 1], this.buffer[index + 2], this.buffer[index + 3]);
    }
    return this.buffer = [];
  };

  Console.prototype.pad = function(object, length) {
    if (length == null) {
      length = 17;
    }
    if (object.length > length) {
      return object.substring(0, length - 1) + '…';
    } else {
      return object + Array(length - object.length).join(' ');
    }
  };

  Console.prototype.openGroup = function(name, reason, time, result) {
    var fmt, method;
    if (reason == null) {
      reason = '';
    }
    if (result == null) {
      result = '';
    }
    if (!this.level) {
      return;
    }
    fmt = '%c%s';
    switch (typeof reason) {
      case 'string':
        fmt += '%s';
        reason = this.pad(reason, 16);
        break;
      case 'object':
        fmt += '%O\t';
        if (reason.length == null) {
          fmt += '\t';
        }
    }
    switch (typeof result) {
      case 'string':
        fmt += '%s';
        result = this.pad(result, 17);
        break;
      case 'object':
        fmt += '%O\t';
        if (!(result.length > 9)) {
          fmt += '\t';
        }
    }
    fmt += ' %c%sms';
    name = this.pad(name, 13);
    if (this.level <= 1.5) {
      method = 'groupCollapsed';
    }
    return this[method || 'group'](fmt, 'font-weight: normal', name, reason, result, 'color: #999; font-weight: normal; font-style: italic;', time);
  };

  Console.prototype.closeGroup = function() {
    if (this.level) {
      return this.groupEnd();
    }
  };

  Console.prototype.stringify = function(obj) {
    if (!obj) {
      return '';
    }
    if (obj.push) {
      return obj.map(this.stringify, this);
    } else if (obj.nodeType) {
      return obj._gss_id;
    } else if (obj.toString !== Object.prototype.toString) {
      return obj.toString();
    } else if (obj.displayName) {
      return obj.displayName;
    } else {
      return JSON.stringify(obj);
    }
  };

  Console.prototype.debug = function(exp) {
    return document.location = document.location.toString().replace(/[&?]breakpoint=[^&]+|$/, ((document.location.search.indexOf('?') > -1) && '&' || '?') + 'breakpoint=' + exp.trim().replace(/\r?\n+|\r|\s+/g, ' '));
  };

  Console.prototype.breakpoint = decodeURIComponent(((typeof document !== "undefined" && document !== null ? document.location.search.match(/breakpoint=([^&]+)/, '') : void 0) || ['', ''])[1]);

  Console.prototype.row = function(a, b, c, d) {
    var fmt, index, p1, ref;
    if (b == null) {
      b = '';
    }
    if (c == null) {
      c = '';
    }
    if (d == null) {
      d = '';
    }
    if (this.level < 1) {
      return;
    }
    a = a.name || a;
    if (typeof a !== 'string') {
      return;
    }
    p1 = Array(4 - Math.floor((a.length + 1) / 4)).join('\t');
    if ((index = c.indexOf((ref = self.GSS) != null ? ref.Engine.prototype.Command.prototype.DESCEND : void 0)) > -1) {
      if (c.indexOf('style[type*="gss"]') > -1) {
        c = c.substring(index + 1);
      }
    }
    c = c.replace(/\r?\n|\r|\s+/g, ' ');
    fmt = '%c%s';
    switch (typeof b) {
      case 'string':
        fmt += '%s';
        b = this.pad(b, 14);
        break;
      case 'object':
        fmt += '%O\t';
        if (!b.push) {
          b = [b];
        }
    }
    switch (typeof d) {
      case 'string':
      case 'boolean':
      case 'number':
        fmt += '  %s ';
        d = this.pad(String(d), 17);
        break;
      case 'object':
        fmt += '  %O\t   ';
        if (d.item) {
          d = Array.prototype.slice.call(d);
        } else if (d.length == null) {
          d = [d];
        }
    }
    if (typeof document !== "undefined" && document !== null) {
      return this.log(fmt + '%c%s', 'color: #666', this.pad(a, 11), b, d, 'color: #999', c);
    } else {
      return this.log(a, b, c);
    }
  };

  Console.prototype.start = function(reason, name) {
    if (this.level) {
      return this.push(reason, name, this.getTime(), this.openGroup);
    }
  };

  Console.prototype.end = function(result) {
    if (this.level) {
      this.buffer.push(void 0, void 0, void 0, void 0, this.closeGroup);
      return this.pop(result, this.openGroup, true);
    }
  };

  Console.prototype.getTime = function(other, time) {
    time || (time = (typeof performance !== "undefined" && performance !== null ? typeof performance.now === "function" ? performance.now() : void 0 : void 0) || (typeof Date.now === "function" ? Date.now() : void 0) || +(new Date));
    if (time && !other) {
      return time;
    }
    return Math.floor((time - other) * 100) / 100;
  };

  return Console;

})();

ref = Console.prototype.methods;
for (i = 0, len = ref.length; i < len; i++) {
  method = ref[i];
  Console.prototype[method] = (function(method) {
    return function() {
      if (method === 'group' || method === 'groupCollapsed') {
        Console.prototype.groups++;
      } else if (method === 'groupEnd') {
        if (!Console.prototype.groups) {
          return;
        }
        Console.prototype.groups--;
      }
      if (this.level || method === 'error') {
        if (this.level > 0.5 || method === 'warn') {
          return typeof console !== "undefined" && console !== null ? typeof console[method] === "function" ? console[method].apply(console, arguments) : void 0 : void 0;
        }
      }
    };
  })(method);
}

module.exports = Console;


},{}],19:[function(require,module,exports){
var Exporter;

Exporter = (function() {
  var getIndex, getSelector;

  function Exporter(engine1) {
    var command, e, ref, ref1, ref10, ref11, ref12, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, states;
    this.engine = engine1;
    this.logs = ['init'];
    this.engine["export"] = function(callback) {
      this.exporter.logs.push('export()');
      if (callback) {
        if (this.result) {
          return callback(this.result);
        } else {
          return this.once('export', callback);
        }
      }
    };
    try {
      command = (ref = typeof location !== "undefined" && location !== null ? (ref1 = location.search.match(/export=([a-z0-9,]+)/)) != null ? ref1[1] : void 0 : void 0) != null ? ref : (ref2 = window.parent) != null ? (ref3 = ref2.params) != null ? ref3["export"] : void 0 : void 0;
    } catch (_error) {
      e = _error;
    }
    if (!command) {
      return;
    }
    states = (ref4 = typeof location !== "undefined" && location !== null ? (ref5 = location.search.match(/export-states=([a-z0-9,_-]+)/)) != null ? ref5[1] : void 0 : void 0) != null ? ref4 : (ref6 = window.parent) != null ? (ref7 = ref6.params) != null ? ref7['export-states'] : void 0 : void 0;
    this.deinherit = (ref8 = (ref9 = typeof location !== "undefined" && location !== null ? (ref10 = location.search.match(/export-deinherit=([a-z0-9,_-]+)/)) != null ? ref10[1] : void 0 : void 0) != null ? ref9 : (ref11 = window.parent) != null ? (ref12 = ref11.params) != null ? ref12['export-deinherit'] : void 0 : void 0) != null ? ref8.split(',') : void 0;
    this.schedule(command, states);
  }

  Exporter.prototype.schedule = function(query, states) {
    var base, last, onInteractive, onSolve, onStateChange, overriders, timeout;
    if (states == null) {
      states = 'animations';
    }
    if ((this.sizes = query.split(',')).length) {
      this.states = states.split(',');
      this.sizes = this.sizes.map(function(size) {
        return size.split('x').map(function(v) {
          return parseInt(v);
        });
      });
      last = this.sizes[this.sizes.length - 1];
      overriders = (function(_this) {
        return function() {
          _this.override('::window[width]', last[0]);
          _this.override('::window[height]', last[1]);
          _this.override('::document[height]', -10000);
          return _this.override('::document[scroll-top]', -10000);
        };
      })(this);
      if (this.engine.running) {
        overriders();
      } else {
        ((base = this.engine.listeners)['compile'] || (base['compile'] = [])).unshift(overriders);
      }
    }
    if (document.readyState === 'complete' || document.readyState === 'loaded' || (document.documentElement.classList.contains('wf-active'))) {
      this.logs.push('complete');
      return this.nextSize();
    } else {
      this.logs.push('waiting');
      timeout = 0;
      onStateChange = (function(_this) {
        return function(title) {
          return function() {
            clearTimeout(timeout);
            return timeout = setTimeout(function() {
              return _this.nextSize();
            }, 200);
          };
        };
      })(this);
      onInteractive = onStateChange('ready');
      onSolve = onStateChange('solved');
      this.engine.addEventListener('interactive', onInteractive);
      return this.engine.addEventListener('solve', onSolve);
    }
  };

  Exporter.prototype.text = '';

  Exporter.prototype.states = [];

  Exporter.prototype.overriden = {};

  Exporter.prototype.inheritable = ['font-size', 'font-weight', 'line-height', 'color'];

  Exporter.prototype.handlers = {
    animations: function(height, scroll) {
      var callback;
      this.override('::document[scroll-top]', scroll != null ? scroll : 0);
      this.override('::document[height]', height != null ? height : document.documentElement.scrollHeight);
      callback = (function(_this) {
        return function() {
          var base, base1, frames, j, len, property, ref, value;
          (base = _this.engine).precomputing || (base.precomputing = {});
          if (_this.frequency) {
            (base1 = _this.engine.precomputing).timestamp || (base1.timestamp = 0);
          } else {
            _this.engine.precomputing.timestamp = _this.engine.console.getTime();
          }
          frames = 0;
          _this.record();
          _this.initial = {};
          ref = _this.engine.values;
          for (value = j = 0, len = ref.length; j < len; value = ++j) {
            property = ref[value];
            _this.initial[property] = value;
          }
          while (_this.engine.ranges) {
            if (++frames > 100) {
              break;
            }
            _this.record();
            _this.engine.solve('Transition', function() {
              this.updating.ranges = true;
            });
          }
          return _this.stop();
        };
      })(this);
      this.engine.once('finish', callback);
      return this.engine.solve(function() {
        this.data.verify('::document[height]');
        this.data.verify('::document[scroll-top]');
        return this.data.commit();
      });
    }
  };

  Exporter.prototype.frequency = 64;

  Exporter.prototype.threshold = 0;

  Exporter.prototype.record = function(soft) {
    var old;
    old = this.engine.precomputing;
    this.engine.precomputing = {
      timestamp: 0
    };
    if (this.frequency && ((old != null ? old.timestamp : void 0) != null)) {
      this.engine.precomputing.timestamp = old.timestamp + this.frequency;
    }
    return (this.frames || (this.frames = [])).push(this.engine.precomputing);
  };

  Exporter.prototype.stop = function() {
    if (!this.appeared) {
      this.appeared = true;
      this.animate();
      this.engine.precomputing = void 0;
      this.record();
      this.phase = 'disappearance';
      return setTimeout((function(_this) {
        return function() {
          return _this.handlers.animations.call(_this, -10000, -10000);
        };
      })(this), 10);
    } else {
      this.animate();
      document.documentElement.classList.remove('animations');
      this.phase = this.appeared = void 0;
      return this.engine.once('finish', this.next.bind(this));
    }
  };

  Exporter.prototype.sequence = function(id, frames, prefix) {
    var frame, h, j, last, len, name, other, phase, properties, property, ref, selector, text, value, y;
    if (prefix == null) {
      prefix = '';
    }
    h = document.documentElement.scrollHeight;
    y = Math.floor((1000 * this.engine.values[id + '[absolute-y]'] / h).toFixed(4));
    h = Math.floor((1000 * this.engine.values[id + '[computed-height]'] / h).toFixed(4));
    phase = this.phase || 'appearance';
    name = phase + '-' + id.substring(1) + '-' + h + '-' + y + '-' + this.engine.values['::window[width]'];
    text = '';
    last = null;
    for (j = 0, len = frames.length; j < len; j++) {
      frame = frames[j];
      if ((last == null) || frame.progress - last.progress > this.threshold || frame.progress === 1) {
        last = frame;
        text += parseFloat((frame.progress * 100).toFixed(3)) + '% {';
        properties = {};
        for (property in frame) {
          value = frame[property];
          if (property !== 'timestamp' && property !== 'progress' && property !== 'duration') {
            if (property === 'transform') {
              property = prefix + property;
            }
            text += property + ':' + value + ';';
          }
        }
        text += '}\n';
      }
    }
    text += '}\n';
    if (other = (ref = this.keyframes) != null ? ref[prefix + text] : void 0) {
      text = '';
    } else {
      (this.keyframes || (this.keyframes = {}))[prefix + text] = name;
      text = '@' + prefix + 'keyframes ' + name + ' {' + text;
    }
    selector = getSelector(engine.identity[id]);
    text += '.' + name + ' ' + selector + ' {\n';
    text += prefix + 'animation: ' + (other || name) + ' ' + Math.round(last.duration) + 'ms';
    text += ' forwards';
    text += ';\n';
    text += prefix + 'animation-play-state: paused;\n';
    text += '}\n';
    text += '.' + name + '-running ' + selector + ' {\n';
    text += prefix + 'animation-play-state: running;\n';
    text += '}\n';
    return text;
  };

  Exporter.prototype.animate = function() {
    var animations, duration, final, first, frame, id, index, initial, j, k, keyframe, keyframes, last, len, len1, prev, properties, property, props, ref, ref1, ref2, start, subframe, value;
    animations = {};
    final = {};
    ref = this.frames;
    for (j = 0, len = ref.length; j < len; j++) {
      frame = ref[j];
      for (id in frame) {
        properties = frame[id];
        if (id !== 'timestamp' && id !== 'duration' && id !== 'frequency') {
          (animations[id] || (animations[id] = [])).push(properties);
          for (property in properties) {
            value = properties[property];
            (final[id] || (final[id] = {}))[property] = value;
          }
          properties.timestamp = frame.timestamp;
        }
      }
    }
    this.frames = void 0;
    for (id in animations) {
      keyframes = animations[id];
      if (keyframes.length === 1) {
        continue;
      }
      first = keyframes[0];
      last = keyframes[keyframes.length - 1];
      start = first.timestamp;
      duration = last.timestamp - start;
      if (this.frequency) {
        index = 0;
        while (++index < keyframes.length) {
          if (((ref1 = (prev = keyframes[index - 1])) != null ? ref1.timestamp : void 0) < (keyframes[index].timestamp - this.frequency)) {
            subframe = {};
            for (property in prev) {
              value = prev[property];
              subframe[property] = value;
            }
            subframe.timestamp = prev.timestamp + this.frequency;
            keyframes.splice(index, 0, subframe);
          }
        }
      }
      for (k = 0, len1 = keyframes.length; k < len1; k++) {
        keyframe = keyframes[k];
        keyframe.duration = duration;
        keyframe.progress = (keyframe.timestamp - start) / duration;
      }
      initial = {
        timestamp: start,
        progress: 0,
        duration: duration
      };
      if ((props = (ref2 = this.final) != null ? ref2[id] : void 0) && this.phase !== 'disappearance') {
        for (property in props) {
          value = props[property];
          initial[property] = value;
        }
        keyframes.unshift(initial);
      }
      this.text += this.sequence(id, keyframes);
      this.text += '\n';
      this.text += this.sequence(id, keyframes, '-webkit-');
      this.text += '\n';
    }
    this.final = final;
    return this.keyframes = void 0;
  };

  getSelector = function(_context) {
    var index, localName, node, pathSelector, tag, that;
    index = void 0;
    localName = void 0;
    pathSelector = void 0;
    that = _context;
    node = void 0;
    if (that === 'null') {
      throw new Error('not an dom reference');
    }
    index = getIndex(that);
    while (that.tagName) {
      if (that.id) {
        pathSelector = '#' + that.id + (pathSelector ? '>' + pathSelector : '');
        break;
      } else {
        tag = that.localName;
        if (tag !== 'body' && tag !== 'html') {
          tag += ':nth-of-type(' + getIndex(that) + ')';
        }
        pathSelector = tag + (pathSelector ? '>' + pathSelector : '');
        that = that.parentNode;
      }
    }
    return pathSelector;
  };

  getIndex = function(node) {
    var i, tagName;
    i = 1;
    tagName = node.tagName;
    while (node.previousSibling) {
      node = node.previousSibling;
      if (node.nodeType === 1 && tagName.toLowerCase() === node.tagName.toLowerCase()) {
        i++;
      }
    }
    return i;
  };

  Exporter.prototype.prepareLinebreaks = function(linebreaks, id) {
    var object, property, value;
    if (id) {
      object = {};
      for (property in linebreaks) {
        value = linebreaks[property];
        if (property.substring(0, id.length) === id) {
          object['$' + property.substring(id.length)] = value;
        } else {
          object[property] = value;
        }
      }
      linebreaks = object;
    }
    return JSON.stringify(linebreaks).replace(/"/g, '\\"');
  };

  Exporter.prototype.serialize = function(element, prefix, inherited, unit, baseFontSize, linebreaks) {
    var breaking, broken, char, child, childFontSize, chrs, content, counter, current, exported, fontSize, index, inherits, j, k, l, len, len1, len2, offset, position, prev, property, pstyles, r, range, rect, ref, ref1, ref2, ref3, ref4, ref5, selector, style, styles, text, value;
    if (element == null) {
      element = this.engine.scope;
    }
    if (prefix == null) {
      prefix = '';
    }
    if (inherited == null) {
      inherited = {};
    }
    if (unit == null) {
      unit = 'rem';
    }
    if (baseFontSize == null) {
      baseFontSize = 100;
    }
    if (element.nodeType === 9) {
      element = element.documentElement;
    }
    text = "";
    chrs = 0;
    if ((fontSize = inherited.fontSize) == null) {
      styles = window.getComputedStyle(element, null);
      inherited.fontSize = fontSize = parseFloat(styles['font-size']);
      if (this.deinherit) {
        ref = this.deinherit;
        for (j = 0, len = ref.length; j < len; j++) {
          property = ref[j];
          inherited[property] = styles[property];
        }
      }
    }
    ref1 = element.childNodes;
    for (index = k = 0, len1 = ref1.length; k < len1; index = ++k) {
      child = ref1[index];
      if (child.nodeType === 1) {
        inherits = Object.create(inherited);
        if (child.tagName === 'STYLE') {
          if (child.assignments) {
            if (((ref2 = child.className) != null ? ref2.indexOf('inlinable') : void 0) === -1) {
              if (child.hasOwnProperty('scoping') && !element.id) {
                selector = getSelector(element) + ' ';
              } else {
                selector = '';
              }
              text += Array.prototype.map.call(child.sheet.cssRules, function(rule) {
                text = rule.cssText.replace(/\[matches~="(.*?)"\]/g, function(m, selector) {
                  return prefix + selector.replace(/@[^↓]+/g, '').replace(/↓&/g, '').replace(/↓/g, ' ');
                });
                return selector + text + '\n';
              }).join('\n');
            }
          } else if (child.sheet) {
            if (((ref3 = child.className) != null ? ref3.indexOf('inlinable') : void 0) > -1) {
              text += Array.prototype.map.call(child.sheet.cssRules, function(rule) {
                if (element.id) {
                  selector = '#' + element.id;
                }
                return (selector || '') + rule.cssText + '\n';
              }).join('\n');
            }
          }
        } else if (child.tagName !== 'SCRIPT') {
          if (child.offsetParent || child.offsetWidth || child.offsetHeight || child.tagName === 'svg') {
            styles = window.getComputedStyle(child, null);
            if (linebreaks) {
              if (styles.display === 'inline' || styles.display === 'inline-block') {
                if (prev = child.previousSibling) {
                  pstyles = prev.nodeType === 1 && window.getComputedStyle(prev);
                  if (!pstyles || pstyles.display === 'inline' || pstyles.display === 'inline-block') {
                    if ((prev.offsetTop != null) && (child.offsetTop != null)) {
                      broken = prev.offsetTop < child.offsetTop && prev.offsetLeft > child.offsetLeft;
                    } else {
                      rect = child.getBoundingClientRect();
                      if (prev.nodeType === 1) {
                        r = prev.getBoundingClientRect();
                        broken = Math.abs(r.top - rect.top) > rect.height / 5 && r.left > rect.left;
                      } else if (linebreaks.last === prev) {
                        broken = Math.abs(linebreaks.position - rect.top) > rect.height / 5 && linebreaks.left > rect.left;
                      } else {
                        broken = true;
                      }
                    }
                    if (broken) {
                      offset = -1;
                      if (linebreaks.current.indexOf(linebreaks.counter - 1) === -1) {
                        linebreaks.current.push(linebreaks.counter - 1);
                      }
                    }
                  }
                }
              }
            }
            childFontSize = parseFloat(styles['font-size']);
            if (style = child.getAttribute('style')) {
              style = style.replace(/(\d+|\.\d+|\d+\.\d+)px/g, function(m) {
                if (m === '1px') {
                  m = '1.49px';
                }
                if (unit === 'em') {
                  return parseFloat((parseFloat(m) / childFontSize).toFixed(4)) + unit;
                } else {
                  return parseFloat((parseFloat(m) / baseFontSize).toFixed(4)) + unit;
                }
              });
              if (style.charAt(style.length - 1) !== ';') {
                style += ';';
              }
            } else {
              style = '';
            }
            if (fontSize !== childFontSize && style.indexOf('font-size:') === -1) {
              if (unit === 'em') {
                style += 'font-size: ' + parseFloat((childFontSize / fontSize).toFixed(4)) + unit + ';';
              } else {
                style += 'font-size: ' + parseFloat((childFontSize / baseFontSize).toFixed(4)) + unit + ';';
              }
            }
            if (this.deinherit) {
              ref4 = this.deinherit;
              for (l = 0, len2 = ref4.length; l < len2; l++) {
                property = ref4[l];
                if (child.style[property] === '') {
                  if (inherits[property] !== styles[property]) {
                    value = styles[property];
                    if (value.substring(value.length - 2) === 'px') {
                      value = (parseFloat(value) / baseFontSize).toFixed(4) + unit + ';';
                    }
                    style += property + ': ' + value + ';';
                    inherits[property] = styles[property];
                  }
                }
              }
            }
          }
          if (child.tagName !== 'svg') {
            if (((ref5 = child.className) != null ? ref5.indexOf('export-linebreaks') : void 0) > -1) {
              breaking = true;
              linebreaks = {
                current: [],
                result: {},
                counter: 0,
                position: 0
              };
            }
            inherits.fontSize = childFontSize;
            if ((!child.offsetParent && !child.offsetWidth && !child.offsetHeight) || !linebreaks) {
              exported = this.serialize(child, prefix, inherits, unit, baseFontSize);
            } else {
              if (child.id) {
                current = linebreaks.current, counter = linebreaks.counter, position = linebreaks.position;
                if (!current.length) {
                  linebreaks.counter = 0;
                  linebreaks.position = 0;
                  linebreaks.current = linebreaks.result[child.id] = [];
                }
              }
              exported = this.serialize(child, prefix, inherits, unit, baseFontSize, linebreaks);
              if (child.id) {
                if (!current.length) {
                  if (!linebreaks.current.length) {
                    delete linebreaks.result[child.id];
                  }
                  linebreaks.current = current;
                  linebreaks.counter = counter;
                  linebreaks.position = position;
                }
              }
            }
          }
          if (style) {
            if (child.id) {
              selector = prefix + '#' + child.id + '#' + child.id;
            } else {
              selector = prefix + getSelector(child);
            }
            if (text) {
              text += '\n';
            }
            text += selector + '{' + style.replace(/;;+/g, ';') + '}\n';
          }
          if (breaking) {
            text += selector + ':before{content: "' + this.prepareLinebreaks(linebreaks.result, child.id) + '"; display: none;}\n';
            linebreaks = breaking = void 0;
          }
          text += exported || '';
        }
      } else if (linebreaks && child.nodeType === 3 && child.parentNode.tagName !== 'STYLE' && child.parentNode.tagName !== 'SCRIPT') {
        counter = 0;
        content = child.textContent;
        while (counter < content.length) {
          char = content.charAt(counter);
          range = document.createRange();
          range.setStart(child, counter);
          range.setEnd(child, counter + 1);
          if (rect = range.getBoundingClientRect()) {
            if (rect.width && rect.top && Math.abs(rect.top - linebreaks.position) > rect.height / 5) {
              if (linebreaks.position && chrs) {
                index = linebreaks.counter;
                if (!content.charAt(counter - 1).match(/[\s\n]/) && content.charAt(counter - 2).match(/-|\u2013|\u2014/)) {
                  index--;
                }
                if (linebreaks.current.indexOf(index) === -1) {
                  linebreaks.current.push(index);
                }
              }
            }
            if (rect.top && rect.width) {
              linebreaks.last = child;
              linebreaks.position = rect.top;
              linebreaks.left = rect.left;
              chrs++;
            }
          }
          counter++;
          linebreaks.counter++;
        }
      }
    }
    return text;
  };

  Exporter.prototype.output = function(text) {
    this.result = text;
    return this.engine.triggerEvent('export', text);
  };

  Exporter.prototype.nextSize = function() {
    var callback, height, size, width;
    if (size = this.sizes.pop()) {
      this.logs.push('nextSize');
      width = size[0], height = size[1];
      callback = (function(_this) {
        return function() {
          var ref, ref1, text;
          if (document.documentElement.className.indexOf('wf-') > -1 && document.documentElement.className.indexOf('wf-active') === -1) {
            return;
          }
          if (document.readyState === 'loading') {
            return;
          }
          _this.engine.removeEventListener('finish', callback);
          _this.logs.push('success');
          text = '';
          if (_this.previous) {
            if (_this.sizes.length) {
              text += '\n@media (max-width: ' + width + 'px) and (min-width: ' + (_this.previous + 1) + 'px) {\n';
            } else {
              text += '\n@media (min-width: ' + (_this.previous + 1) + 'px) {\n';
            }
          } else if (_this.sizes.length) {
            text += '\n@media (max-width: ' + width + 'px) {\n';
          } else {
            _this.plain = true;
          }
          if ((ref = window.parent) != null) {
            if ((ref1 = ref.params) != null) {
              if (typeof ref1.onSerialize === "function") {
                ref1.onSerialize(width + 'x' + height);
              }
            }
          }
          _this.base = _this.serialize();
          text += _this.base;
          _this.previous = width;
          _this.text += text;
          if (_this.states.length) {
            _this.uncomputed = _this.states.slice();
          }
          _this.logs.push('serialized');
          return _this.next();
        };
      })(this);
      this.engine.addEventListener('finish', callback);
      this.resize(width, height);
      return true;
    }
  };

  Exporter.prototype.endRule = function(rule, text) {
    var curly, last, semicolon;
    semicolon = text.indexOf(';');
    curly = text.indexOf('}');
    if (semicolon > -1 && curly > -1) {
      rule += text.substring(0, Math.min(semicolon, curly));
    } else if (semicolon > -1) {
      last = text.lastIndexOf(';');
      if (last !== semicolon) {
        rule += text.substring(0, semicolon);
        rule += text.substring(last);
      } else {
        rule += text;
      }
    } else if (curly > -1) {
      rule += text.substring(0, curly);
    } else {
      rule += text;
    }
    if (curly > -1) {
      rule += '}\n';
    }
    return rule;
  };

  Exporter.prototype.next = function() {
    if (!this.nextState()) {
      if (!this.plain) {
        this.text += '\n}';
      }
      if (!this.nextSize()) {
        this.logs.push('done');
        return this.output(this.text);
      }
    }
  };

  Exporter.prototype.nextState = function() {
    var html, ref, script, state;
    if (!this.uncomputed) {
      return;
    }
    if (((ref = this.states) != null ? ref.length : void 0) && (this.states.length > 2 || this.states[0] !== 'animations')) {
      script = document.createElement('script');
      script.onload = (function(_this) {
        return function() {
          _this.differ = new diff_match_patch();
          return _this.nextState();
        };
      })(this);
      script.src = 'http://cdn.rawgit.com/tanaka-de-silva/google-diff-match-patch-js/master/diff_match_patch.js';
      document.body.appendChild(script);
      return true;
    }
    if (state = this.uncomputed.pop()) {
      this.logs.push('nextState');
      html = document.documentElement;
      setTimeout((function(_this) {
        return function() {
          html.classList.add(state);
          _this.logs.push(state);
          _this.record();
          return _this.engine.once('finish', function() {
            var change, diff, end, handler, j, len, match, overlay, prefix, property, rest, result, rule, selector, start, text, value, z;
            _this.logs.push('state:' + state);
            if (handler = _this.handlers[state]) {
              return handler.call(_this);
            }
            result = _this.serialize();
            prefix = 'html.' + state + ' ';
            diff = _this.differ.diff_main(_this.base, result);
            _this.differ.diff_cleanupSemantic(diff);
            selector = void 0;
            property = void 0;
            value = void 0;
            rule = '';
            overlay = '';
            z = 0;
            for (j = 0, len = diff.length; j < len; j++) {
              change = diff[j];
              text = change[1];
              if (change[0] === 0) {
                if (rule) {
                  rule = _this.endRule(rule, text);
                  if (text.indexOf('}') > -1) {
                    overlay += rule;
                    rule = '';
                    z++;
                  }
                }
                if ((end = text.lastIndexOf('{')) > -1) {
                  start = text.lastIndexOf('}');
                  selector = text.substring(start + 1, end).trim();
                  rest = text.substring(end + 1);
                  if (match = rest.match(/(?:;|^)\s*([^;{]+):\s*([^;}]+)$/)) {
                    property = match[1];
                    value = match[2];
                  }
                  start = end = void 0;
                }
              } else if (change[0] === 1) {
                if (selector) {
                  rule = prefix + selector + '{';
                  selector = void 0;
                }
                if (property) {
                  rule += property + ':';
                  property = void 0;
                }
                if (value != null) {
                  rule += value;
                  value = void 0;
                }
                rule += change[1].trim();
                if (rule.charAt(rule.length - 1) === '}') {
                  rule = '';
                }
              }
            }
            _this.text += overlay;
            return setTimeout(function() {
              html.classList.remove(state);
              return _this.engine.once('finish', function() {
                return _this.next();
              });
            }, 100);
          });
        };
      })(this), 10);
      return true;
    }
  };

  Exporter.prototype.override = function(property, value) {
    var base;
    (base = this.overriden)[property] || (base[property] = this.engine.data.properties[property]);
    return this.engine.data.properties[property] = function() {
      return value;
    };
  };

  Exporter.prototype.resize = function(width, height) {
    this.logs.push('resize:' + width + 'x' + height);
    this.override('::window[height]', height);
    this.override('::window[width]', width);
    this.width = width;
    this.height = height;
    return this.engine.triggerEvent('resize');
  };

  return Exporter;

})();

module.exports = Exporter;


},{}],20:[function(require,module,exports){
var Inspector,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  hasProp = {}.hasOwnProperty;

Inspector = (function() {
  function Inspector(engine) {
    this.engine = engine;
    this.draw = bind(this.draw, this);
    this.onMouseMove = bind(this.onMouseMove, this);
    this.onClick = bind(this.onClick, this);
    this.onKeyUp = bind(this.onKeyUp, this);
    this.onKeyDown = bind(this.onKeyDown, this);
  }

  Inspector.prototype.toExpressionString = function(operation) {
    var i, klass, path, prop, ref, ref1, ref2;
    if (operation != null ? operation.push : void 0) {
      if (operation[0] === 'get') {
        path = operation[1];
        i = path.indexOf('[');
        prop = path.substring(i + 1, path.length - 1);
        if ((this.engine.values[path.replace('[', '[intrinsic-')] != null) || prop.indexOf('intrinsic-') > -1) {
          klass = 'intrinsic';
        } else if (path.indexOf('"') > -1) {
          klass = 'virtual';
        } else if (i > -1) {
          if (prop === 'x' || prop === 'y') {
            klass = 'position';
          } else if (!((ref = this.engine.data.properties[prop]) != null ? ref.matcher : void 0)) {
            klass = 'local';
          }
        }
        return '<strong class="' + (klass || 'variable') + '" for="' + path + '" title="' + this.engine.values[path] + '">' + path + '</strong>';
      }
      return this.toExpressionString(operation[1]) + ' <b title=\'' + ((ref1 = operation.parent) != null ? (ref2 = ref1[0]) != null ? ref2.key : void 0 : void 0) + '\'>' + operation[0] + '</b> ' + this.toExpressionString(operation[2]);
    } else {
      return operation != null ? operation : '';
    }
  };

  Inspector.prototype.update = function() {
    if (this.engine.console.level > 0.1) {
      this.domains(this.engine.domains);
    }
    if (this.engine.console.level > 1.5 || this.rulers) {
      return this.refresh();
    }
  };

  Inspector.prototype.stylesheet = function() {
    var sheet;
    this.sheet = sheet = document.createElement('style');
    sheet.textContent = sheet.innerText = "domains {\n  display: block;\n  position: fixed;\n  z-index: 999999;\n  top: 0;\n  left: 0;\n  font-size: 13px;\n  background: rgba(255,255,255,0.76);\n  font-family: Helvetica, Arial;\n}\ndomain {\n  -webkit-user-select: none;  /* Chrome all / Safari all */\n  -moz-user-select: none;     /* Firefox all */\n  -ms-user-select: none;      /* IE 10+ */\n\n  user-select: none;     \n}\npanel {\n  padding: 10px;\n  left: 0;\n  max-height: 800px;\n  overflow: auto;\n  font-size: 13px;\n}\npanel strong, panel b{\n  font-weight: normal;\n}\npanel em {\n  color: red;\n}\npanel strong {\n  color: MidnightBlue;\n}\npanel strong.virtual {\n  color: green;\n}\npanel strong.intrinsic {\n  color: red;\n}\npanel strong.local {\n  color: black;\n}\npanel strong.position {\n  color: olive;\n}\npanel strong[mark] {\n  text-decoration: underline;\n}\ndomains domain{\n  padding: 5px;\n  text-align: center;\n  display: inline-block;\n  cursor: pointer;\n}\ndomain[hidden] {\n  color: #999;\n  background: none;\n}\ndomain.singles:before {\n  content: ' + ';\n  display: 'inline'\n}\ndomain, domain.active {\n  background: #fff;\n  color: #000;\n}\ndomain.active {\n  font-weight: bold;\n}\ndomains:hover domain {\n  background: none;\n}\ndomains:hover domain:hover {\n  background: #fff\n}\ndomain panel {\n  display: block;\n  position: absolute;\n  background: #fff;\n  text-align: left;\n  white-space: pre;\n  line-height: 18px;\n  font-size: 13px;\n  font-family: monospace, serif;\n}\ndomain panel {\n  display: none;\n}\ndomain:hover panel, body[reaching] panel {\n  display: block;\n}\nruler {\n  display: block;\n  position: absolute;\n  z-index: 99999;\n  border-width: 0;\n}\nruler[hidden] {\n  display: none;\n}\nruler.x {\n  border-bottom: 1px dotted orange;\n}\nruler.y {\n  border-right: 1px dotted orange;\n}\nruler.width {\n  border-bottom: 1px dashed blue;\n}\nruler.height {\n  border-right: 1px dashed blue;\n}\nruler.virtual {\n  border-color: green;\n}\nruler.virtual.height {\n  z-index: 99998;\n}\nbody:not([inspecting]) ruler.virtual.height {\n  width: 0px !important;\n}\nbody[inspecting][reaching] ruler.virtual.height:not(:hover) {\n  width: 0px !important;\n}\nruler.virtual.height:hover, body[inspecting]:not([reaching]) ruler.virtual.height {\n  background: rgba(0,255,0,0.15);\n}\nruler.constant {\n  border-style: solid;\n}\nruler.intrinsic {\n  border-color: red;\n}\nruler:before {\n  content: \"\";\n  display: block;\n  position: absolute;\n  right: 0;\n  top: 0;\n  left: 0;\n  bottom: 0;\n  cursor: pointer;\n}\nruler.y:before, ruler.height:before, ruler.intrinsic-height:before {\n  left: -10px;\n  right: -10px;\n}\nruler.x:before, ruler.width:before, ruler.intrinsic-width:before {\n  top: -10px;\n  bottom: -10px;\n}\ndomain panel.filtered {\n  display: block\n}\nbody[reaching] ruler {\n  opacity: 0.2\n}\nbody[reaching] ruler.reached {\n  opacity: 1\n}";
    document.body.appendChild(sheet);
    document.addEventListener('mousedown', this.onClick);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('keydown', this.onKeyDown);
    return document.addEventListener('keyup', this.onKeyUp);
  };

  Inspector.prototype.refresh = function() {
    var bits, id, ids, j, len, property, ref, ref1, results, value, values;
    values = {};
    ref = this.engine.values;
    for (property in ref) {
      value = ref[property];
      values[property] = value;
    }
    if (this.rulers) {
      ref1 = this.rulers;
      for (property in ref1) {
        value = ref1[property];
        if (!values.hasOwnProperty(property)) {
          values[property] = null;
        }
      }
    }
    ids = this.ids = [];
    for (property in values) {
      value = values[property];
      if ((bits = property.split('[')).length > 1) {
        if (ids.indexOf(bits[0]) === -1) {
          ids.push(bits[0]);
        }
      }
    }
    results = [];
    for (j = 0, len = ids.length; j < len; j++) {
      id = ids[j];
      results.push(this.draw(id, values));
    }
    return results;
  };

  Inspector.prototype.onKeyDown = function(e) {
    if (e.altKey) {
      return document.body.setAttribute('inspecting', 'inspecting');
    }
  };

  Inspector.prototype.onKeyUp = function(e) {
    if (document.body.getAttribute('inspecting') != null) {
      return document.body.removeAttribute('inspecting');
    }
  };

  Inspector.prototype.getDomains = function(ids) {
    var domain, domains, id, j, len, property, ref, ref1, value;
    domains = [];
    ref = this.engine.domains;
    for (j = 0, len = ref.length; j < len; j++) {
      domain = ref[j];
      if (domain.displayName !== 'Solved' && domain.constraints.length) {
        ref1 = domain.values;
        for (property in ref1) {
          if (!hasProp.call(ref1, property)) continue;
          value = ref1[property];
          id = property.split('[');
          if (id.length > 1) {
            if (ids.indexOf(id[0]) > -1) {
              if (domains.indexOf(domain) === -1) {
                domains.push(domain);
              }
            }
          }
        }
      }
    }
    return domains;
  };

  Inspector.prototype.onClick = function(e) {
    var distance, domain, domains, ids, inspecting, prop, properties, property, props, ref, ref1, ref2, target;
    if (((ref = e.target.tagName) != null ? ref.toLowerCase() : void 0) === 'domain') {
      if (!this.rulers) {
        this.refresh();
      }
      this.filter([e.target.getAttribute('for')], e.shiftKey || e.ctrlKey, true);
      e.preventDefault();
      return e.stopPropagation();
    } else {
      if (e.metaKey) {
        if (!this.rulers) {
          this.refresh();
        }
      }
      if (e.altKey || e.metaKey) {
        target = e.target;
        ids = [];
        inspecting = [];
        while (target) {
          if (target.nodeType === 1) {
            if (e.altKey && target._gss && target.classList.contains('virtual')) {
              inspecting.push(target.getAttribute('for'));
            } else if (target._gss_id) {
              inspecting.push(target._gss_id);
            }
          }
          target = target.parentNode;
        }
        domains = this.getDomains(inspecting);
        ids = domains.map(function(d) {
          return String(d.uid);
        });
        if (e.altKey) {
          this.visualize(null, inspecting, e.shiftKey);
          this.constraints(ids[0], null, inspecting, e.shiftKey);
        }
        if (e.metaKey) {
          this.filter(ids, e.shiftKey);
        }
      } else if ((property = document.body.getAttribute('reaching')) && ((ref1 = e.target.tagName) != null ? ref1.toLowerCase() : void 0) === 'ruler') {
        domain = this.reaching;
        if (domain && (properties = (ref2 = domain.distances) != null ? ref2[property] : void 0)) {
          props = [];
          for (prop in properties) {
            distance = properties[prop];
            if (!distance) {
              props.push(prop);
            }
          }
          this.constraints(domain.uid, null, props);
        }
      } else {
        return;
      }
      e.preventDefault();
      return e.stopPropagation();
    }
  };

  Inspector.prototype.constraints = function(id, element, props, all) {
    var d, diff, domain, el, j, k, len, len1, ref, ref1, ref2, ref3;
    if (!this.panel) {
      this.panel = document.createElement('panel');
    } else {
      this.panel.classList.remove('filtered');
    }
    if (!element) {
      ref = this.list.childNodes;
      for (j = 0, len = ref.length; j < len; j++) {
        el = ref[j];
        if (el.getAttribute('for') === String(id)) {
          element = el;
          break;
        }
      }
      if (!element) {
        return;
      }
    }
    if (this.panel.parentNode !== element) {
      if ((ref1 = this.panel.parentNode) != null) {
        ref1.classList.remove('active');
      }
      element.appendChild(this.panel);
    }
    if (id === 'singles') {
      domain = this.singles;
    } else {
      ref2 = this.engine.domains;
      for (k = 0, len1 = ref2.length; k < len1; k++) {
        d = ref2[k];
        if (String(d.uid) === String(id)) {
          domain = d;
          break;
        }
      }
    }
    if (domain) {
      this.panel.innerHTML = (ref3 = domain.constraints) != null ? ref3.map((function(_this) {
        return function(constraint) {
          return _this.toExpressionString(constraint.operations[0]);
        };
      })(this)).filter(function(string) {
        var l, len2, prop;
        if (!props) {
          return true;
        }
        for (l = 0, len2 = props.length; l < len2; l++) {
          prop = props[l];
          if (string.indexOf(prop) > -1) {
            if (!all && props.length > 1) {
              props.splice(1);
            }
            return true;
          }
        }
        return false;
      }).map(function(string) {
        var l, len2, prop;
        if (props) {
          for (l = 0, len2 = props.length; l < len2; l++) {
            prop = props[l];
            prop = prop.replace(/([\[\]$])/g, '\\$1');
            string = string.replace(new RegExp('\\>(' + prop + '[\\[\\"])', 'g'), ' mark>$1');
          }
        }
        return string;
      }).join('\n') : void 0;
      if (props) {
        this.panel.classList.add('filtered');
      }
      diff = element.offsetLeft + element.offsetWidth + 10 - this.panel.offsetWidth;
      if (diff > 0) {
        this.panel.style.left = diff + 'px';
      } else {
        this.panel.style.left = '';
      }
      return element.classList.add('active');
    }
  };

  Inspector.prototype.onMouseMove = function(e) {
    var ref, target;
    target = e.target;
    if (target._gss) {
      return this.visualize(e.target.getAttribute('property'));
    }
    while (target) {
      if (target.nodeType === 1) {
        if (target.tagName.toLowerCase() === 'domain') {
          return this.constraints(target.getAttribute('for'), target);
        }
      }
      target = target.parentNode;
    }
    if ((ref = this.panel) != null ? ref.parentNode : void 0) {
      this.panel.parentNode.classList.remove('active');
      this.panel.parentNode.removeChild(this.panel);
    }
    if (this.reaching) {
      return this.visualize();
    }
  };

  Inspector.prototype.visualize = function(property, ids, all) {
    var distance, domain, id, j, k, key, l, len, len1, len2, prop, properties, props, reached, ref, ref1, results, ruler;
    if (!property && !ids) {
      if (this.reaching) {
        this.reaching = void 0;
        document.body.removeAttribute('reaching');
        ref = document.getElementsByTagName('ruler');
        for (j = 0, len = ref.length; j < len; j++) {
          ruler = ref[j];
          ruler.classList.remove('reached');
        }
      }
      return;
    }
    if (!ids && document.body.getAttribute('reaching') === property) {
      return;
    }
    if (ids) {
      props = [];
      for (property in this.rulers) {
        for (k = 0, len1 = ids.length; k < len1; k++) {
          id = ids[k];
          if (property.substring(0, id.length) === id) {
            if (property.substring(id.length, id.length + 1) === '[') {
              props.push(property);
              if (!all && ids.length > 1) {
                ids.splice(1);
                break;
              }
            }
          }
        }
      }
    } else {
      props = [property];
      ids = [property.split('[')[0]];
    }
    domain = this.getDomains(ids)[0];
    reached = false;
    results = [];
    for (l = 0, len2 = props.length; l < len2; l++) {
      prop = props[l];
      if (domain && (properties = (ref1 = domain.distances) != null ? ref1[prop] : void 0)) {
        results.push((function() {
          var ref2, results1;
          results1 = [];
          for (key in properties) {
            distance = properties[key];
            if (!distance) {
              reached = true;
              if ((ref2 = this.rulers[key]) != null) {
                ref2.classList.add('reached');
              }
              this.reaching = domain;
              results1.push(document.body.setAttribute('reaching', prop || id));
            } else {
              results1.push(void 0);
            }
          }
          return results1;
        }).call(this));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  Inspector.prototype.filter = function(ids, all, scroll) {
    var domain, i, id, index, j, k, len, len1, node, offsetTop, property, ref, ref1, ref2, ruler, top;
    this.indexes || (this.indexes = (function() {
      var j, len, ref, results;
      ref = this.list.childNodes;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        node = ref[j];
        if (node.getAttribute('hidden') == null) {
          results.push(node.getAttribute('for'));
        } else {
          results.push(void 0);
        }
      }
      return results;
    }).call(this));
    if (all) {
      ids = (function() {
        var j, len, ref, results;
        ref = this.list.childNodes;
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          node = ref[j];
          results.push(node.getAttribute('for'));
        }
        return results;
      }).call(this);
      if (ids.toString() === this.indexes.toString()) {
        ids = [];
      }
      this.indexes = ids || [];
    } else {
      for (j = 0, len = ids.length; j < len; j++) {
        id = ids[j];
        if ((i = this.indexes.indexOf(id)) === -1) {
          this.indexes.push(id);
        } else {
          this.indexes.splice(i, 1);
        }
      }
    }
    ref = this.list.childNodes;
    for (index = k = 0, len1 = ref.length; k < len1; index = ++k) {
      domain = ref[index];
      if (this.engine.domains[index] != null) {
        if (this.indexes.indexOf(String(this.engine.domains[index].uid)) === -1) {
          domain.setAttribute('hidden', 'hidden');
          if (((ref1 = this.panel) != null ? ref1.parentNode : void 0) === domain) {
            domain.classList.remove('active');
            domain.removeChild(this.panel);
          }
        } else {
          domain.removeAttribute('hidden');
        }
      }
    }
    top = null;
    ref2 = this.rulers;
    for (property in ref2) {
      ruler = ref2[property];
      if (this.indexes.indexOf(ruler.getAttribute('domain')) === -1) {
        ruler.setAttribute('hidden', 'hidden');
      } else {
        if (ruler.getAttribute('hidden') != null) {
          ruler.removeAttribute('hidden');
          offsetTop = 0;
          while (ruler) {
            offsetTop += ruler.offsetTop;
            ruler = ruler.offsetParent;
          }
          if ((top == null) || top > offsetTop) {
            top = offsetTop;
          }
        }
      }
    }
    if ((top != null) && scroll) {
      return window.scrollTo(0, top);
    }
  };

  Inspector.prototype.domains = function(domains) {
    var domain, index, innerHTML, j, multiples, singles, total;
    this.singles = void 0;
    if (!this.sheet) {
      this.stylesheet();
    }
    if (!this.list) {
      this.list = document.createElement('domains');
      this.list._gss = true;
      document.body.appendChild(this.list);
    }
    total = 0;
    multiples = [];
    for (index = j = domains.length - 1; j >= 0; index = j += -1) {
      domain = domains[index];
      if (domain.constraints.length === 1) {
        singles = this.singles || (this.singles = {
          constraints: [],
          uid: 'singles',
          displayName: 'Singles'
        });
        singles.constraints.push(domain.constraints[0]);
      } else {
        multiples.push(domain);
      }
    }
    multiples = multiples.sort(function(a, b) {
      return b.constraints.length - a.constraints.length;
    });
    if (singles) {
      multiples.push(singles);
    }
    Inspector.uid || (Inspector.uid = 0);
    innerHTML = multiples.map((function(_this) {
      return function(d) {
        var length, ref;
        d.uid || (d.uid = ++Inspector.uid);
        length = ((ref = d.constraints) != null ? ref.length : void 0) || 0;
        total += length;
        return "<domain for=\"" + d.uid + "\" count=\"" + length + "\" " + (_this.engine.console.level <= 1 && 'hidden') + " class=\"" + (d.displayName.toLowerCase()) + "\">" + length + "</domain>";
      };
    })(this)).join('');
    innerHTML += '<label> = <strong>' + total + '</strong></label>';
    return this.list.innerHTML = innerHTML;
  };


  /*remap: (domain) ->
    if !(distances = domain.distances)
      distances = domain.distances = {}
      for constraint in domain.constraints
        for a of constraint.operations[0].variables
          if a.match(/width\]|height\]|\[\x]|\[\y\]|/)
            for b of constraint.operations[0].variables
              if b.match(/width\]|height\]|\[\x]|\[\y\]|/)
                @reach distances, a, b
   */

  Inspector.prototype.ruler = function(element, path, value, x, y, width, height, inside) {
    var bits, constraint, domain, id, j, k, konst, len, len1, other, property, ref, ref1, ref2, ref3, ruler;
    bits = path.split('[');
    id = bits[0];
    property = bits[1].split(']')[0];
    if (!(ruler = (this.rulers || (this.rulers = {}))[path])) {
      if (value == null) {
        return;
      }
      ruler = this.rulers[path] = document.createElement('ruler');
      ruler.className = property;
      ruler._gss = true;
      id = path.split('[')[0];
      ruler.setAttribute('for', id);
      ruler.setAttribute('property', path);
      ruler.setAttribute('title', path);
      ruler.removeAttribute('hidden');
    } else if (value == null) {
      if ((ref = ruler.parentNode) != null) {
        ref.removeChild(ruler);
      }
      delete this.rulers[path];
      return;
    }
    domain = void 0;
    ref1 = this.engine.domains;
    for (j = 0, len = ref1.length; j < len; j++) {
      other = ref1[j];
      if (other.values.hasOwnProperty(path) && other.displayName !== 'Solved') {
        domain = other;
        break;
      }
    }
    if (!domain) {
      if ((ref2 = ruler.parentNode) != null) {
        ref2.removeChild(ruler);
      }
      return;
    }
    ruler.setAttribute('domain', domain.uid);
    if (!(konst = typeof this.engine.variables[path] === 'string')) {
      ref3 = domain.constraints;
      for (k = 0, len1 = ref3.length; k < len1; k++) {
        constraint = ref3[k];
        if (constraint.operations[0].variables[path] && Object.keys(constraint.operations[0].variables).length === 1) {
          konst = true;
          break;
        }
      }
    }
    if (konst) {
      ruler.classList.add('constant');
    } else {
      ruler.classList.remove('constant');
    }
    if (this.engine.values[path.replace('[', '[intrinsic-')] != null) {
      ruler.classList.add('intrinsic');
    } else {
      ruler.classList.remove('intrinsic');
    }
    if (inside) {
      ruler.classList.add('virtual');
    } else {
      ruler.classList.remove('virtual');
    }
    ruler.style.top = Math.floor(y) + 'px';
    ruler.style.left = Math.floor(x) + 'px';
    ruler.style.width = width + 'px';
    ruler.style.height = height + 'px';
    if (inside) {
      if (!element.offsetHeight) {
        element = element.parentNode;
      }
      element.appendChild(ruler);
      if (property === 'height' && (this.engine.values[id + '[width]'] != null)) {
        return ruler.style.width = this.engine.values[id + '[width]'] + 'px';
      }
    } else {
      return element.parentNode.appendChild(ruler);
    }
  };

  Inspector.prototype.reach = function(distances, a, b, level) {
    var bc, c, results;
    if (level == null) {
      level = 0;
    }
    (distances[a] || (distances[a] = {}))[b] = level;
    (distances[b] || (distances[b] = {}))[a] = level;
    results = [];
    for (c in distances[a]) {
      bc = distances[b][c];
      if ((bc == null) || bc > level + 1) {
        results.push(this.reach(distances, b, c, level + 1));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  Inspector.prototype.draw = function(id, data) {
    var bits, clientLeft, clientTop, element, left, offsetLeft, offsetTop, parenting, prop, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, scope, top;
    if ((bits = id.split('"')).length > 1) {
      scope = bits[0];
    } else {
      scope = id;
    }
    if (((ref = (element = this.engine.identity[scope])) != null ? ref.nodeType : void 0) === 1) {
      if (scope !== id) {
        if (!element.offsetHeight && !element.offsetTop) {
          element = element.parentNode;
          scope = this.engine.identify(element);
          parenting = true;
        }
        top = (ref1 = data[scope + '[y]']) != null ? ref1 : 0;
        left = (ref2 = data[scope + '[x]']) != null ? ref2 : 0;
        clientTop = (ref3 = data[id + '[y]']) != null ? ref3 : 0;
        clientLeft = (ref4 = data[id + '[x]']) != null ? ref4 : 0;
        offsetTop = top + clientTop;
        offsetLeft = left + clientLeft;
      } else {
        top = element.offsetTop;
        left = element.offsetLeft;
      }
      if (!parenting) {
        if ((ref5 = element.offsetWidth !== data[scope + '[width]']) != null ? ref5 : data[scope + '[intrinsic-width]']) {
          clientLeft = left + element.clientLeft;
        }
        if ((ref6 = element.offsetHeight !== data[scope + '[height]']) != null ? ref6 : data[scope + '[intrinsic-height]']) {
          clientTop = top + element.clientTop;
        }
      }
    } else {
      element = document.body;
      left = (ref7 = data[id + '[x]']) != null ? ref7 : 0;
      top = (ref8 = data[id + '[y]']) != null ? ref8 : 0;
    }
    if (data.hasOwnProperty(prop = id + '[width]')) {
      this.ruler(element, prop, data[prop], clientLeft != null ? clientLeft : left, clientTop != null ? clientTop : top, data[prop], 0, scope !== id);
    }
    if (data.hasOwnProperty(prop = id + '[height]')) {
      this.ruler(element, prop, data[prop], clientLeft != null ? clientLeft : left, clientTop != null ? clientTop : top, 0, data[prop], scope !== id);
    }
    if (data.hasOwnProperty(prop = id + '[x]')) {
      this.ruler(element, prop, data[prop], (offsetLeft != null ? offsetLeft : left) - data[prop], offsetTop != null ? offsetTop : top, data[prop], 0, scope !== id);
    }
    if (data.hasOwnProperty(prop = id + '[y]')) {
      return this.ruler(element, prop, data[prop], offsetLeft != null ? offsetLeft : left, (offsetTop != null ? offsetTop : top) - data[prop], 0, data[prop], scope !== id);
    }
  };

  return Inspector;

})();

module.exports = Inspector;


},{}],21:[function(require,module,exports){
if (self.Map) {
  var HashTable = function() {
    this.size = 0;
    this._store = new Map();
    this._keys = [];
    // this.get = this._store.get.bind(this._store);
  }

  HashTable.prototype = {

    set: function(key, value) {
      this._store.set(key.hashCode, value);
      if (this._keys.indexOf(key) == -1) {
        this.size++;
        for (var i = this._keys.length; i--;)
          if (this._keys[i].hashCode < key.hashCode)
            break
        this._keys.splice(i + 1, 0, key)
      }
    },

    get: function(key) {
      return this._store.get(key.hashCode);
    },

    clear: function() {
      this.size = 0;
      this._store = new Map();
      this._keys = [];
    },

    delete: function(key) {
      if (this._store.delete(key.hashCode) && this.size > 0) {
        this._keys.splice(this._keys.indexOf(key), 1);
        this.size--;
      }
    },


    each: function(callback, scope) {
      if (!this.size) { return; }
      this._keys.forEach(function(k){
        if (typeof k == "undefined") { return; }
        var v = this._store.get(k.hashCode);
        if (typeof v != "undefined") {
          callback.call(scope||null, k, v);
        }
      }, this);
    },

    escapingEach: function(callback, scope) {
      if (!this.size) { return; }

      var that = this;
      var kl = this._keys.length;
      var context;
      for (var x = 0; x < kl; x++) {
        var k = this._keys[x];
        var v = that._store.get(k.hashCode);
        if (typeof v != "undefined") {
          context = callback.call(scope||null, k, v);
        }

        if (context) {
          if (context.retval !== undefined) {
            return context;
          }
          if (context.brk) {
            break;
          }
        }
      }
    },

    clone: function() {
      var n = new HashTable();
      if (this.size) {
        this.each(function(k, v) {
          n.set(k, v);
        });
      }
      return n;
    }
  };
} else {

  var HashTable = function() {
    this.size = 0;
    this._store = {};
    this._keys = [];
    // this.get = this._store.get.bind(this._store);
  }


  HashTable.prototype = {
    set: function(key, value) {
      this._store[key.hashCode] = value
      if (this._keys.indexOf(key) == -1) {
        this.size++;
        // delete this._keys[this._keys.indexOf(key)];
        for (var i = this._keys.length; i--;)
          if (this._keys[i].hashCode < key.hashCode)
            break
        this._keys.splice(i + 1, 0, key)
      } /* else {
        delete this._keys[this._keys.indexOf(key)];
        this._keys.push(key);
      }
      */
    },

    get: function(key) {
      return this._store[key.hashCode];
    },

    clear: function() {
      this.size = 0;
      this._store = {}
      this._keys = [];
    },

    delete: function(key) {
      if (this._store[key.hashCode] != undefined && this.size > 0) {
        this._store[key.hashCode] = undefined
        this._keys.splice(this._keys.indexOf(key), 1);
        this.size--;
      }
    },

    each: function(callback, scope) {
      if (!this.size) { return; }
      this._keys.forEach(function(k){
        var v = this._store[k.hashCode];
        if (typeof v != "undefined") {
          callback.call(scope||null, k, v);
        }
      }, this);
    },

    escapingEach: function(callback, scope) {
      if (!this.size) { return; }

      var that = this;
      var kl = this._keys.length;
      var context;
      for (var x = 0; x < kl; x++) {
          var k = this._keys[x]
          var v = that._store[k.hashCode];
          if (typeof v != "undefined") {
            context = callback.call(scope||null, k, v);
          }

          if (context) {
            if (context.retval !== undefined) {
              return context;
            }
            if (context.brk) {
              break;
            }
          }
      }
    },

    clone: function() {
      var n = new HashTable();
      if (this.size) {
        this.each(function(k, v) {
          n.set(k, v);
        });
      }
      return n;
    }
  };
}

module.exports = HashTable
},{}]},{},[1]);
