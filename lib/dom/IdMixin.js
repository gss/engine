var IdMixin;

IdMixin = {
  _id_counter: 1,
  _byIdCache: [],
  _ids_killed: function(ids) {
    var id, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = ids.length; _i < _len; _i++) {
      id = ids[_i];
      _results.push(delete this._byIdCache[id]);
    }
    return _results;
  },
  getById: function(id) {
    var el;
    if (this._byIdCache[id]) {
      return this._byIdCache[id];
    }
    el = document.querySelector('[data-gss-id="' + id + '"]');
    if (el) {
      this._byIdCache[id] = el;
    }
    return el;
  },
  setupContainerId: function(el) {
    el._gss_is_container = true;
    return this.setupId(el);
  },
  setupId: function(el) {
    var gid;
    gid = this.getId(el);
    if (gid == null) {
      gid = String(this._id_counter++);
      el.setAttribute('data-gss-id', gid);
      el.style['box-sizing'] = 'border-box';
    }
    this._byIdCache[gid] = el;
    return gid;
  },
  getId: function(el) {
    if ((el != null ? el.getAttribute : void 0) != null) {
      return el.getAttribute('data-gss-id');
    }
    return null;
  }
};

module.exports = IdMixin;
