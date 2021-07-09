/**
 * Keyboard adds simple keyboard shortcut handling with callbacks.
 *
 * - Only alphanumerical characters.
 * - Control key combos do not trigger the callback so as not to override
 *   the default browser behaviour (eg: Ctrl-N for New Window).
 * - Only one listener for a key at one time.
 *
 * Options:
 *
 *   bDisableInInput      Defaults to true, do not call listener when key is pressed
 *                        while INPUT, TEXTAREA or SELECT is active.
 *
 * Methods:
 *   addListener(key, fnListener)    Key can be a character or a keycode. Only use
 *                                   characters 0-9, a-z, A-Z as string parameter.
 *   removeListener(key)             See addListener()
 *   destroy();
 *
 * Usage:
 *
 *   addListener('s', this.save.bind(this, 'save'));
 *
 */

import { stopEvent } from "@lib/dom";
import EventCache from "@old/eventcache";

export default class Keyboard {
  /** @type {{[key: number]: EventListener} */
  oKeys;

  /**
   * @param {{ bDisableInInput?: boolean}} options
   */
  constructor(options) {
    // set options and defaults
    options = options ? options : {};
    options.bDisableInInput = options.bDisableInInput !== false;
    this.options = options;

    this.oKeys = [];
    this.evtCache = new EventCache();
    this.evtCache.addEvent(document, "keydown", this.evKeydown.bind(this));
  }

  destroy() {
    this.evtCache.destroy();
  }

  /**
   * Always return a keycode.
   *
   * @param  {string|number}  key   The key as a char (0-9, a-z, A-Z only) or the key code
   * @return {number}
   */
  getKeyCode(key) {
    // charCodeAt() returns the correct keyboard event keycode for uppercase letters only
    return typeof key === "number" ? key : key.toUpperCase().charCodeAt(0);
  }

  /**
   *
   * @param {string|number} key
   * @param {EventListener} fnListener
   */
  addListener(key, fnListener) {
    var keycode = this.getKeyCode(key);
    this.oKeys[keycode] = fnListener;
  }

  removeListener(key) {
    var keycode = this.getKeyCode(key);
    delete this.oKeys[keycode];
  }

  evKeydown(ev) {
    var isCtrl, iKeyCode;
    //console.log('Keyboard::evKeydown(%o)', ev.keyCode);

    //  var iKeyCode = window.event ? event.keyCode : ev.keyCode;
    //  var sKeyChar = String.fromCharCode(iKeyCode).toLowerCase();

    // Don't enable shortcut keys in Input, Textarea fields
    if (this.options.bDisableInInput) {
      var element = ev.target;
      if (element.nodeType === 3) {
        element = element.parentNode;
      }
      if (
        element.tagName === "INPUT" ||
        element.tagName === "TEXTAREA" ||
        element.tagName === "SELECT"
      ) {
        return;
      }
    }

    isCtrl = ev.ctrlKey;
    iKeyCode = ev.keyCode;

    if (!isCtrl) {
      var fnListener = this.oKeys[iKeyCode];
      if (fnListener) {
        fnListener.call(null, ev);
        stopEvent(ev);
        return false;
      }
    }

    return true;
  }
}
