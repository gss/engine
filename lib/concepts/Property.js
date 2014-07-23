var Property;

Property = function(property, reference, properties) {
  var index, key, left, path, right, value, _base;
  if (typeof property === 'object') {
    if (property.push) {
      return properties[path] = this.Style(property, reference, properties);
    } else {
      for (key in property) {
        value = property[key];
        if ((index = reference.indexOf('[')) > -1) {
          path = reference.replace(']', '-' + key + ']');
          left = reference.substring(0, index);
          right = path.substring(index + 1, path.length - 1);
          (_base = properties[left])[right] || (_base[right] = this.Property(value, path, properties));
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

module.exports = Property;
