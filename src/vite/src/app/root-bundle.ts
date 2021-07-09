import Dom, { domContentLoaded } from "@lib/dom";
import AjaxTable from "@old/ajaxtable";
import EventDelegator from "@old/eventdelegator";
import KoohiiAside from "@/vue/Aside";
import KoohiiNav from "@old/components/KoohiiNav";

let bodyED: EventDelegator | null = null;

/**
 * Returns an EventDelegator instance for click events on the page body.
 */
export function getBodyED(): EventDelegator {
  return bodyED
    ? bodyED
    : (bodyED = new EventDelegator(document.body, "click"));
}

/**
 * Focus an element on page load, if the required classes are present:
 *
 *   - if a form with class `JsFocusOnLoadError` has an error, focus that field
 *   - otherwise if an element has class `JsFocusOnLoadInput`, focus that input
 */
function focusOnLoad() {
  const $$ = Dom;
  let elHasError;

  const elForm = $$(".JsFocusOnLoadError")[0];
  if (elForm) {
    elHasError = $$<HTMLElement>(".has-error", elForm)[0];
    elHasError && elHasError.focus();
  }

  let elFocus;
  if (!elHasError && (elFocus = $$<HTMLElement>(".JsFocusOnLoadInput")[0])) {
    elFocus.focus();
  }
}

/**
 * Helper makes it easier to find code where values are shared between php/js.
 *
 * Cf. `kk_globals_put()` on the php side.
 *
 * @param name key (make sure to declare them in globals.d.ts)
 */
// see kk_globals_put() on the php side
export function kk_globals_get(name: keyof Window["KK"]): any {
  console.assert(!!window.KK);
  console.assert(
    (window.KK as Object).hasOwnProperty(name),
    `window.KK[${name}] is not set`
  );
  return window.KK[name];
}

export default function() {
  console.log("... rootBundleInit()");

  window.Koohii = {
    Refs: {},
    UX: {
      // legacy AjaxTable component instanced in pages like Members List
      AjaxTable,
      // site-wide mobile navigation
      KoohiiAside,
    },
  };

  domContentLoaded(() => {
    // init the site-wide desktop navigation
    KoohiiNav.init();

    focusOnLoad();
  });
}
