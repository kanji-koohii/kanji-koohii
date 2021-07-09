// this is the legacy desktop navigation with dropdown menus
//  fixed to work with ESM build

import $$ from "@lib/dom";
import EventDelegator from "@old/eventdelegator";

export default {
  dropdown: null,
  elTouched: null,

  panes: [],

  init: function () {
    // console.log("KoohiiNav::init()");

    // desktop nav
    var eventDel = new EventDelegator(document.body, [
      "click",
      "touchend",
      "mouseover",
      "mouseout",
    ]);
    eventDel.on("JsHasDropdown", this.onDropdown, this);
    eventDel.onDefault(this.onClick, this);
  },

  onDropdown: function (ev, el) {
    var data, elDropdown;

    elDropdown = $$("ul", el)[0];

    // toplevel LI which contains a dropdown
    var toplevel = el;

    // console.log('evtype on %o ' + ev.type, el);

    if (ev.type === "touchend") {
      if (this.elTouched && toplevel !== this.elTouched) {
        if (this.dropdown) {
          this.toggleDropdown(false);
        }
      }

      this.elTouched = toplevel;

      // the clicked element in the dropdown descendants
      var elTarget = ev.target; // A tag
      var elTargetLI = elTarget.closest("li");
      // console.log('el1 '+elTarget.tagName+' el2 '+elTargetLI.tagName);
      if (elTargetLI === toplevel) {
        if (this.dropdown) {
          // console.log('LAUNCH LI ... ' + elTarget.href);
          window.location.href = elTarget.href;
          return false;
        } else {
          this.dropdown = elDropdown;
          this.toggleDropdown(true);
          // prevent default ... (below)
          // console.log('should STOP EVENTS HERE');
        }
      } else {
        // console.log('LAUNCH DROP ... ' + elTarget.href);
        window.location.href = elTarget.href;
        // prevent default ... (below)
      }

      /* prevent delay and simulated mouse events */
      ev.preventDefault();
      ev.stopPropagation();
      return false;
    }

    //
    // Desktop events
    //

    if (this.elTouched && this.elTouched === toplevel) {
      // ignore tous les events pour le même dropdown qui a recu un touch event !
      // console.log('On ignore cet event car touch!');
      //ev.preventDefault();
      return false;
    }

    if (this.dropdown && ev.type === "click") {
      // let browser handle the links
      return true;
    }

    if (ev.type === "mouseout" && this.dropdown) {
      this.toggleDropdown(false);
    } else if (ev.type === "mouseover") {
      this.dropdown = elDropdown;
      this.toggleDropdown(true);
    }

    return false;
  },

  // this event handler clears the dropdown if clicking/tapping outside
  onClick: function (ev) {
    if (ev.type !== "click") {
      return true;
    }

    if (this.dropdown) {
      this.toggleDropdown(false);
    }

    return true;
  },

  toggleDropdown: function (bVisible) {
    let $dropdown = $$(this.dropdown);
    $dropdown.css("visibility", bVisible ? "visible" : "hidden");
    if (!bVisible) {
      this.dropdown = null;
    }
  },
};
