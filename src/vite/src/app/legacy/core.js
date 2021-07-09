/**
 * LEGACY helper function that creates a class that calls init() on instanciation.
 *
 * Example:
 *   ```
 *   var Widget = make();
 *   Widget.prototype = { init(), etc. }
 *   var instance = new Widget();
 *   ```
 *
 * @param {Object} px   Optional prototype object containing properties and methods
 * @return {Function}   Class constructor that will call init() method when instanced
 */
function make(px) {
  var fn = function () {
    return this.init.apply(this, arguments);
  };

  // optional: set prototype for the new class
  if (px) {
    fn.prototype = px;
  }

  return fn;
}

export { make };
