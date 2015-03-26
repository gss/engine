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