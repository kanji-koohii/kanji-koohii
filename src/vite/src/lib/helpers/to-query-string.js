import Lang from "@lib/lang";

/**
 * Turns an object into its URL-encoded query string representation.
 *
 * Note the comment below, adding [] for arrays is only for use with php.
 *
 * @param {Object} obj   Parameters as properties and values
 */
const toQueryString = function(obj, name) {
  var i,
    l,
    s = [];

  if (Lang.isNull(obj) || Lang.isUndefined(obj)) {
    return name ? encodeURIComponent(name) + "=" : "";
  }

  if (Lang.isBoolean(obj)) {
    obj = obj ? 1 : 0;
  }

  if (Lang.isNumber(obj) || Lang.isString(obj)) {
    return encodeURIComponent(name) + "=" + encodeURIComponent(obj);
  }

  if (Lang.isArray(obj)) {
    // add '[]' here for php to receive an array
    name = name + "[]";
    for (i = 0, l = obj.length; i < l; i++) {
      s.push(toQueryString(obj[i], name));
    }
    return s.join("&");
  }

  // now we know it's an object.
  var begin = name ? name + "[" : "",
    end = name ? "]" : "";
  for (i in obj) {
    if (obj.hasOwnProperty(i)) {
      s.push(toQueryString(obj[i], begin + i + end));
    }
  }

  return s.join("&");
}

export { toQueryString };