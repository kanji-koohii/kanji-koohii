/**
 * EventDelegator
 *
 * "Event delegation is a technique whereby you use a single event handler on
 * a parent element to listen for interactions that affect the parent's descendant
 * elements; because events on the descendant elements will bubble up to the
 * parent, this can be a reliable and extremely efficient mitigation strategy for
 * reducing the number of resource-consuming event handlers you have on any
 * given page." -- YUI2
 *
 * See  http://developer.yahoo.com/yui/examples/event/event-delegation.html
 *
 * It makes it easy to work with styled links and other markup where
 * Event.getTarget() would return a child element such as a SPAN. Instead
 * the callbacks will always receive the element that has the class name
 * that was wanted.
 *
 *
 * Methods:
 *   init(elRoot, "click")
 *   init(elRoot, ['click', ...])    Start listening to events of given type(s) on the root element and
 *                                   all children elements. Pass one event type, or an array of event types.
 *
 *   onClass(class, fn[, scope])     Subscribe a callback for elements of class name.
 *   on(class, fn[, scope])          Short for onClass()
 *
 *   onId(id, fn[, scope])           Subscribe a callback for element that matches the id.
 *
 *   onTag(tagname, fn[, scope])     Subscribe a callback for element that matches the tag name.
 *
 *   onDefault(fn[, scope])          Subscribe the default callback for events bubbling up to
 *                                   the root element. Use Event.getTarget(e) in this handler to get the
 *                                   element that started the event chain, "el" will always be the root element.
 *
 *   destroy()                       Cleanup the event listener from the DOM.
 *
 *
 * Callback signature:
 *
 *   myCallback(e, matchedEl)
 *
 *     The callback receives the event object, and the current element in the bubble chain.
 *     Usually matchedEl is the element with the class name that was registered with on().
 *
 *     When using onDefault(), matchedEl is always the root element. To get the element that started
 *     the event chain use YAHOO.util.Event.getTarget(e).
 *
 *     Return "false" explicitly to stop the event and interrupt the event chain.
 *     Otherwise the event will continue bubbling up to the onDefault() handler if set,
 *     or the default element behaviour (links, form submit button, etc).
 *
 * Usage:
 *
 *   var ed = new EventDelegator("myDiv", ["click"]);
 *
 *   // call this.onAdd() when element of class .add is clicked
 *   ed.on("add", this.onAdd, this);
 *
 *   // call this.onDefault for clicks anywhere else in myDiv
 *   ed.onDefault(this.onDefault, this);
 *
 *   // cleanup events (removes listener(s) that were set on the root element)
 *   ed.destroy()
 *
 *
 * Notes:
 * - There is normally no need to stop the event in your handler (eg. yui3 e.halt()),
 *   the callback should return "false" instead.
 * - If using multiple class names and listeners on one element, they will be called
 *   from last to first. If any returns false, then the other won't be called.
 * - If multiple events correspond to one element: tag, id and classes, they are called
 *   in css priority order: id events, class events, and then tag events.
 *
 */

import $$, { domGet, stopEvent } from "@lib/dom";
import Lang from "@lib/lang";

const PREFIX_TAG = "%",
  PREFIX_ID = "#",
  ROOT_EVENT = "@root";

export default class EventDelegator {
  /**
   * Constructor.
   *
   * @param {String|HTMLElement} elRoot   Parent element to watch events
   * @param {Array} type           Event types to watch ("click", ...)
   */
  constructor(elRoot, types) {
    var i;

    this.listeners = {};
    this.eventCache = [];

    this.elRoot = domGet(elRoot);

    console.assert(
      Lang.isNode(this.elRoot),
      "EventDelegator::init() elRoot is not valid"
    );

    if (Lang.isString(types)) {
      types = [types];
    }

    const listenerFn = this._handler.bind(this);

    for (i = 0; i < types.length; i++) {
      const args = [types[i], listenerFn];
      this.eventCache.push(args);
      this.elRoot.addEventListener(...args);
    }
  }

  /**
   * Todo.
   *
   */
  destroy() {
    var i;
    while (this.eventCache.length) {
      this.elRoot.removeEventListener(...this.eventCache.pop());
    }
  }

  /**
   * Subscribe event for elements of given class name.
   *
   * Class names are case sensitive and must match exactly to the DOM element class names.
   *
   * @param {String} name    A css class name
   * @param {Function} callback    A function callback
   * @param {Object} scope   A scope for the callback (optional)
   */
  onClass(name, callback, scope) {
    this._debug(arguments);
    this._on(name, callback, scope);
  }

  /**
   * Shortcut.
   *
   * @see  onClass
   */
  on() {
    this.onClass.apply(this, arguments);
  }

  /**
   * Subscribe an event for elements with given tag name.
   *
   * @param {String} name    An HTML element tag name (case does not matter)
   * @param {Function} callback    A function callback
   * @param {Object} scope   A scope for the callback (optional)
   */
  onTag(name, callback, scope) {
    this._debug(arguments);
    this._on(PREFIX_TAG + name.toUpperCase(), callback, scope);
  }

  /**
   * Subscribe an event for element that matches given id.
   *
   * @param {String} name    An id to match with a DOM element id, case sensitive!
   * @param {Function} callback    A function callback
   * @param {Object} scope   A scope for the callback (optional)
   */
  onId(name, callback, scope) {
    this._debug(arguments);

    // a warning to help development
    if (!domGet(name)) {
      console.warn(
        "Warning: EventDelegator()::onId('%s') id is not present in document",
        name
      );
    }

    this._on(PREFIX_ID + name, callback, scope);
  }

  /**
   * Subscribe the default event that fires on the root element.
   *
   * @param {Function} callback    A function callback
   * @param {Object} scope   A scope for the callback (optional)
   */
  onDefault(callback, scope) {
    this._debug(arguments);
    this._on(ROOT_EVENT, callback, scope);
  }

  /**
   * Subscribe an event, registers callback.
   *
   * Name must be prefixed with a special character so that tag names,
   * ids and class names have unique keys in this.listeners (for speed).
   *
   * @param {Object} name
   * @param {Object} callback
   * @param {Object} scope
   */
  _on(name, callback, scope) {
    this.listeners[name] = {
      fn: callback,
      context: scope,
      re: new RegExp("(?:^|\\s)" + name + "(?:$|\\s)"),
    };
  }

  /**
   * Help to find possible bugs, warns if there are any undefined values
   *
   * @param {Array} args  Arguments to check
   */
  _debug(args) {
    var i;
    for (i = args.length - 1; i >= 0; i--) {
      if (typeof args[i] === "undefined") {
        console.warn(
          "EventDelegator: WARNING: one of the supplied arguments is undefined."
        );
      }
    }
  }

  /**
   *
   */
  _handler(e) {
    var elTarget = e.target;

    while (elTarget && elTarget !== this.elRoot) {
      var idEvent, tagEvent, classes, n;

      // do we have a listener for this element id?
      if (elTarget.id && elTarget.id.length) {
        idEvent = PREFIX_ID + elTarget.id;
        if (
          this.listeners[idEvent] &&
          this._fire(idEvent, e, elTarget) === false
        ) {
          stopEvent(e);
          return false;
        }
      }

      // do we have a listener for any of the class names on this element?
      //  (note: SVG elements className does not have split)
      classes = elTarget.className.split ? elTarget.className.split(/\s+/) : [];
      for (n = classes.length - 1; n >= 0; n--) {
        if (
          this.listeners[classes[n]] &&
          this._fire(classes[n], e, elTarget) === false
        ) {
          stopEvent(e);
          return false;
        }
      }

      // do we have a listener for this tag name?
      tagEvent = PREFIX_TAG + elTarget.nodeName.toUpperCase();
      if (
        this.listeners[tagEvent] &&
        this._fire(tagEvent, e, elTarget) === false
      ) {
        stopEvent(e);
        return false;
      }

      elTarget = elTarget.parentNode;
    }

    // root element event
    if (elTarget === this.elRoot && this.listeners[ROOT_EVENT]) {
      if (this._fire(ROOT_EVENT, e, elTarget) === false) {
        stopEvent(e);
        return false;
      }
    }

    // return undefined or true : event continues
  }

  _fire(name, e, matchedEl) {
    var oListener = this.listeners[name];
    var context = Lang.isUndefined(oListener.context)
      ? window
      : oListener.context;
    return oListener.fn.apply(context, [e, matchedEl]);
  }
}
