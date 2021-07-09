/**
 * A tiny jQuery-style library for DOM manipulation.
 *
 * NAMED IMPORTS
 *
 *   (default)                         ... DomJS factory function
 *
 *   getNode()
 *   getStyle()
 *   insertAfter(newNode, refNode)     ... insert newNode as next sibling of refNode
 *
 *   domContentLoaded(fn)              ... proxy for window.addEventListener(...)
 *   domGet()                          ... same as YUI2 Dom.get()
 *   hasClass(el, token)               ... alias for `el.classList.contains(token)`
 *   stopEvent(ev)                     ... helper for stopPropagation() & preventDefault()
 *
 *   px(value)                         ... format value for css property eg. `45` => `45px`
 *
 *
 * METHODS
 *
 *   constructor(selector, context)    ... query elements, optional root element
 *
 *   el(i = 0)                         ... return the underlying DOM element
 *
 *   closest(selector)                 ... find the first ancestor matching selector
 *
 *   css(prop)                         ... get/set inline styles
 *    css(prop, value)
 *    css({ prop1: value, ...})
 *
 *   down(selector)                    ... similar to jQuery find(), can be chained
 *
 *   each((el, index) => {})           ... iterate over selected elements
 *
 *   offset(el)                        ... returns absolute position on page
 *
 *   on(type, listener)                ... bind one or more listeners to .el(0)
 *    on([type1, type2, ...], fn)
 *
 *   off(type)                         ... unbind events by type(s) or listener
 *    off([type1, type2, ...])
 *    off(listener)
 *
 *   once(type, listener)              ... call handler once, then remove it
 *
 *   remove(node)                      ... same as `node.parentNode.removeChild(node)`
 *
 *   toggle(display)                   ... toggle element rendering via `display` property
 *
 *
 * USAGE
 *
 *   Chaining a method is allowed *once* after the constructor:
 *
 *     $('#help-box').css('display', 'block')
 *
 *   To call more than one method, assign the result to a temporary variable, eg:
 *
 *     const $app = $('#app')
 *     $app.css('background', 'powderblue')
 *     $app.on('click', evt => { console.log('clicked %o', evt.target) })
 *
 *
 * EXAMPLES
 *
 *   Using the constructor with a selector:
 *
 *     import $ from 'dom'
 *     let el = $('.box')
 *     let articles = $('article', '#main-content')  // optional context element
 *
 *   Two ways of obtaining the actual element reference:
 *
 *     let el = $('.box')[0]
 *     let el = $('.box').el()
 *
 *   Form an element or window reference:
 *
 *     $(element).css('display', 'block')
 *     $(window).on('DOMContentLoaded', function() { ... })
 *
 *   Convention: use a `$` prefix to distinguish DomJS instance from the element:
 *
 *     let $box = $('.box')
 *     $box.css('width') = '20px'
 *     $box.on('click', (ev) => { console.log("clicked el %o", ev.target) })
 *
 */

// types
type StringHash = { [key: string]: string };
type StringOrStringArray = string | string[];

// helpers
const inDocument = (el: Node | null) => document.documentElement.contains(el);
const isArray = (o: any): boolean => Array.isArray(o);
const isFunction = (f: any): f is Function => typeof f === "function";
const isNode = (el: any): boolean => el instanceof Node;
const isString = (s: any): s is string => typeof s === "string";
const isWindow = (o: any): o is Window => o === window;

//
type $Event = {
  el: Element;
  type: string;
  fn: EventListener;
};
let $Events: $Event[] = [];

export type DomJSSelector = string | Window | Node;

export class DomJS<EL extends Element> implements ArrayLike<EL> {
  // ArrayLike
  length: number;
  [n: number]: EL;

  constructor(selector: DomJSSelector, context?: Element) {
    let nodes: ArrayLike<EL>;

    console.assert(
      !context || isNode(context),
      "DomJS(): invalid `context` argument"
    );

    if (isString(selector)) {
      nodes = (context || window.document).querySelectorAll(selector);
    }
    // window is not instanceof Node, has "length", but doesn't behave like an array
    else if (isWindow(selector)) {
      nodes = [window as any];
    }
    // assume it's a Node
    else {
      this[0] = selector as EL;
      this.length = 1;
      return this;
    }

    for (let i = 0, l = (this.length = nodes.length); i < l; i++) {
      this[i] = nodes[i];
    }
  }

  /**
   * Retrieve one of the elements matched by the selector.
   *
   * For convenience, el() by default returns the first element.
   *
   *   if ($('.box').el()) {
   *     // element is found...
   *   }
   *
   */
  el(i?: number) {
    return this[i || 0] as EL;
  }

  /**
   * Returns first ancestor matching selector, or null.
   *
   * NOTE!  Unlike Element.closest() method, this function does NOT
   *        return the original element.
   *
   *   const ul = $('.TodoList-item').closest('ul') as HTMLUListElement
   */
  closest(selector: string): Element | null {
    console.assert(isString(selector), "closest() : selector is invalid");

    let el = this[0] as Element;
    console.assert(isNode(el), "closest() : el is invalid");

    if (!inDocument(el)) {
      return null;
    }

    const matchesSelector = (el: Element) => el.matches(selector);

    while ((el = el.parentElement || (el.parentNode as Element))) {
      if (matchesSelector(el)) return el;
    }

    return null;
  }

  /**
   * Similar to jQuery find(), can be chained.
   *
   * @param selector string
   */
  down(selector: DomJSSelector): DomJS<EL> {
    let el = this[0] as Element;
    return factory<EL>(selector, this[0]);
  }

  /**
   * Iterate over collection returned by the constructor.
   *
   * Return explicit `false` to end the loop.
   *
   * Example:
   *
   *   $('#todolist li').each( (el, index) => { console.log(el, index) })
   */
  each(callback: { (element: EL, index: number): false | void }): void {
    for (let i = 0, l = this.length; i < l; i++) {
      if (callback(this[i] as EL, i) === false) break;
    }
  }

  /**
   * Helper similar to jQuery offset(), drop-in replacement for YUI2 Dom.getXY().
   */
  offset(el: EL): { left: number; top: number } {
    const { left, top } = el.getBoundingClientRect();

    return {
      top: top + window.pageYOffset - document.documentElement.clientTop,
      left: left + window.pageXOffset - document.documentElement.clientLeft,
    };
  }

  /**
   * Bind one or more event types to a listener, for a SINGLE element
   *
   * @param  events   One or more event types, eg. ['click', 'focus']
   * @param  callback
   */
  on(events: string | string[], callback: EventListener) {
    const el = this[0];
    // console.assert(el === window || isNode(el), "on() el is invalid");

    if (isString(events)) {
      events = [events];
    }

    events.forEach((event) => {
      el.addEventListener(event, callback, false);
      $Events.push({ el, type: event, fn: callback });
    });
  }

  /**
   * Detach event listeners.
   *
   * @param events   One or more event types, OR the listener to detach (one argument)
   * @param callback   (optional) Detach only events matching this callback
   */
  off(events: string | string[] | EventListener | null) {
    let callback: EventListener;
    const el = this[0];
    // console.assert(el === window || isNode(el), "off() : el is invalid");

    // .off('click')
    if (isString(events)) {
      events = [events];
    }
    // .off(callback)
    else if (isFunction(events)) {
      callback = events as EventListener;
      events = null;
    }
    // .off()  (remove all events)

    $Events = $Events.filter((e) => {
      if (
        e.el === el &&
        (!callback || callback === e.fn) &&
        (!events || (events as string[]).includes(e.type))
      ) {
        e.el.removeEventListener(e.type, e.fn);
        return false;
      }
      return true;
    });
  }

  /**
   * Fire an event only once, then remove said event.
   *
   * Example:
   *
   *   Dom(el).once('transitionend', fn)
   *
   */
  once(event: string, fn: EventListener) {
    // console.assert(isFunction(fn), "once() : fn is not a function");
    // console.assert(el === window || isNode(el), "once() : el is invalid");

    const listener = (...args: any[]) => {
      (fn as Function).apply(this, args);
      this.off(listener);
    };

    this.on(event, listener);
  }

  /**
   * Set a single css property.
   *
   * @param props   The CSS property name (not camelCase!)
   * @param value
   */
  /**
   * Get / set inline style(s).
   *
   * Usage:
   *
   *   css('prop')                     Get inline style
   *   css('prop', value)              Set one inline style
   *   css({ prop1: value, ...})       Set multiple inline styles
   *
   * @return string
   *
   */
  /**
   * Set one or more CSS properties with object notation.
   *
   */
  css(props: string | StringHash, value?: string): any {
    const element = (this[0] as any) as HTMLElement;
    let styles: StringHash;

    if (isString(props)) {
      // css('prop')
      if (arguments.length === 1) {
        // console.assert(props in element.style, "invalid property name");
        return element.style.getPropertyValue(props);
      }

      // css('prop', value)
      styles = { [props]: value as string };
    } else {
      styles = props;
    }

    // set one or more styles
    for (const prop in styles) {
      element.style.setProperty(prop, styles[prop]);
    }
  }

  /**
   * Removes the node from the tree it belongs to.
   *
   * @return    Returns removed node, or null
   */
  remove(): Node | null {
    const node = this[0] as Node;
    return (node.parentNode && node.parentNode.removeChild(node)) || null;
  }

  /**
   * Toggle element visibility via `display` property.
   *
   * @param display   false to hide the element with `display: none`, true to revert
   *                  to its default value
   * @returns void
   */
  toggle(display: boolean): void {
    const element = (this[0] as any) as HTMLElement;
    element.style.display = display ? "" : "none";
  }

  /**
   * Retrieve all the elements in the set, as an array.
   *
   */
  toArray(): EL[] {
    return Array.prototype.slice.call(this);
  }
}

const factory = <EL extends Element>(
  selector: DomJSSelector,
  context?: Element
): DomJS<EL> => {
  return new DomJS<EL>(selector, context);
};

export { factory as default };

// --------------------------------------------------------------------
// misc DOM helpers
// --------------------------------------------------------------------

/**
 * Inserts the new node as the next sibling of the reference node.
 *
 * @returns The added child node
 */
export function insertAfter(
  newNode: Element,
  refNode: Element
): Element | null {
  console.assert(
    isNode(newNode) && isNode(refNode),
    "insertAfter() : newNode and/or refNode is invalid"
  );
  console.assert(!!refNode.parentNode, "refNode needs a parent element");
  return refNode.insertAdjacentElement("afterend", newNode);
}

/**
 * getStyle()
 *
 *   styleName    MUST be camelCase form!
 */
export function getStyle(
  element: HTMLElement,
  styleName: string
): string | null {
  console.assert(!!(element && styleName), "getStyle() : invalid arguments");

  // styleName = camelCase(styleName);
  if (styleName === "float") {
    styleName = "cssFloat";
  }
  try {
    const computed = document.defaultView!.getComputedStyle(element, "");
    return element.style.getPropertyValue(styleName) || computed
      ? computed.getPropertyValue(styleName)
      : null;
  } catch (e) {
    return element.style.getPropertyValue(styleName);
  }
}

/**
 * Always return an Element from either a selector or an Element.
 */
export function getNode<EL extends Element>(sel: EL | string): EL | null {
  const node = isString(sel) ? (document.querySelector(sel) as EL) : sel;
  return node;
}

export const domContentLoaded = (fn: Function) => {
  window.addEventListener("DOMContentLoaded", fn as any);
};

/**
 * Helper that always returns an element, from either a node or a string id.
 * Drop-in replacement for YUI2 Dom.get().
 *
 * @param el  An element reference as an id string (without the "#") or the element itself
 *
 * @returns Element
 */
export const domGet = <EL extends Element>(el: string | EL): EL | null => {
  const node = isString(el) ? (document.querySelector("#" + el) as EL) : el;
  return node;
};

/**
 * Proxy for classList.contains().
 *
 * Drop-in replacement for YUI2 Dom.hasClass().
 *
 * @param el Element
 * @param token A css class name
 */
export const hasClass = (el: Element, token: string): boolean => {
  console.assert(isNode(el));
  return el.classList.contains(token);
};

/**
 * Helper, and drop-in replacement for YUI2 Event.stopEvent().
 */
export const stopEvent = (evt: Event): void => {
  evt.stopPropagation();
  evt.preventDefault();
};

/**
 * Helper to format px unit, for use in element style properties.
 *
 * Example: `px(45)` => `"45px"`
 */
export const px = (n: number): string => {
  return `${n}px`;
};
