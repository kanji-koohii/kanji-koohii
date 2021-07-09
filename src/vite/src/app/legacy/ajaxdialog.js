/**
 * AjaxDialog handles dialogs with Ajax (loads markup) or pre existing markup.
 * Dialog interaction is either submit of the form, handled via ajax through AjaxPanel,
 * or front end only through binding of custom button/link events.
 *
 * Create a dialog from an HTTP request
 *   Set requestUri and requestData to load the contents of the dialog from an HTTP request.
 *
 * Create a static dialog from a html template
 *   Set useMarkup to an id of a document element structured as YUI Panel (hd,bd,ft),
 *   it will be cloned for the dialog.
 *
 *   For special cases, initialize your own AjaxPanel as needed.
 *
 * Options:
 *
 *   requestUri                      Load contents from a HTTP request. Query string is allowed. Use this or useMarkup.
 *   requestData                     Parameters to go along requestUri (query string or hash, see AjaxRequest).
 *
 *   useMarkup                       Pass an element id (string) to the constructor. The markup will be cloned for the dialog.
 *
 *   events                          Listeners to register with AjaxDialog's EventDispatcher (onDialogInit, etc)
 *   scope                           Scope for the event listeners (OPTIONAL)
 *
 *   center                          The dialog is always centered on the view (defaults true, will be false if "context" is set).
 *   context                         Align the dialog relative to a context element (defaults none). This option is passed
 *                                   straight to the YUI2 Panel options. See http://developer.yahoo.com/yui/container/panel/
 *                                    [contextId, overlayCorner, contextCorner, ["beforeShow", "windowResize"]]
 *                                    overlayCorner & contextCorner: "tl", "br" etc.
 *   shadow                          Set to false to remove the dialog shadow (defaults true).
 *   modal                           Set to false to use non-modal dialog (defaults true).
 *   zIndex                          Custom zIndex value for the YUI Panel (optional).
 *   invisMask                       Set to true to make the modal mask invisible (defaults false).
 *   skin                            A class name that is applied to the outer YUI Panel element, to skin a custom dialog.
 *   close                           Show a close button in the top right corner (defaults true).
 *   autoclose                       Let user dismiss the dialog by clicking the modal mask (ie. outside the dialog).
 *                                   This will notify onDialogHide() same as the "close" option (defaults true).
 *
 *   width                           Set the width of the "ajax loading" div, shown before content is loading.
 *
 *   mobile                          Indended for mobile/touch devices: disables the draggable support and the "constraintoviewport"
 *                                   option (this stops YUI from adjusting the dimensions), sets "center" to false (typically
 *                                   we want to use all available width). Recommended to use "skin" with a mobile/small device-width
 *                                   skin, eg:
 *                                    .mobile-dlg { left:0; right:0; }
 *
 *
 * Notifications:
 *
 *   onDialogInit(t)                 Called for TRON response with html.
 *   onDialogDestroy()               See AjaxPanel::onContentDestroy()               FIXME  should be onContentDestroy()
 *   onDialogResponse(t)             See AjaxPanel::onResponse() (t is TRON msg)     FIXME  should be onContentResponse()
 *   onDialogSubmit(e)               See AjaxPanel::onSubmitForm()                   FIXME  should be onContentSubmit()
 *   onDialogHide()                  The hide() method is called, or the close button is clicked.
 *
 * Status events:
 *
 *   onDialogSuccess(t)              Dialog response or custom event returned a SUCCESS status (t = TRON msg)
 *   onDialogProgress(t)             Dialog response or custom event returned a PROGRESS status (t = TRON msg)
 *   onDialogFailed(t)               Dialog response or custom event returned a FAILED status (t = TRON msg)
 *
 * Usage:
 *
 *   The response can set some parameters for the dialog. Note that
 *   dialogHeight is used only if dialogWidth is specified. Dialog height is
 *   optional, by default the dialog height adjusts to the content.
 *
 *     dialogWidth   (int)
 *     dialogHeight  (int)
 *     dialogTitle   (string)
 *
 *
 *   If the response TRON status is:
 *     STATUS_FAILED   -> fire "onDialogFailed" event -> close dialog -> END
 *     STATUS_SUCCESS  -> fire "onDialogSuccess" event -> close dialog -> END
 *     STATUS_PROGRESS -> fire "onDialogProgress" event
 *     STATUS_EMPTY (no TRON message) -> doesn't fire the status events
 *
 *
 * Binding events (buttons, links, etc):
 *
 *   Add class name:
 *     "JSDialogSuccess"   => fire onDialogSuccess and close dialog
 *     "JSDialogFail"      => fire onDialogFailed  and close dialog
 *     "JSDialogClose"     => close dialog
 *
 *     "JSDialogSubmit"    => submit the dialog's ajaxpanel (useful for form buttons styled with link tag)
 *
 *     "JSDialogFocus"     => Set on an element to receive focus at the end of the dialog init event.
 *
 *   Custom events:
 *
 *     // on() is a shortcut to the AjaxDialog's eventDelegator method
 *     myAjaxDialog.on("my-action", handler, scope);
 *
 *     handler: function(e, el) {
 *       // OPTIONAL: return a dialog status to trigger the status events
 *       myAjaxDialog.handleDialogStatus(AjaxDialog.STATUS_SUCCESS);
 *
 *       return false;
 *     }
 *
 *
 * Static dialog event chain (option "useMarkup"):
 *
 *   onDialogInit (on instance of AjaxDialog)
 *     -> onDialogFailed  (element of class name "JSDialogFail")
 *       -> onDialogDestroy (dialog closes)
 *     -> onDialogSuccess (element of class name "JSDialogSuccess")
 *       -> onDialogDestroy (dialog closes)
 *     -> (do nothing)    (element of class name "JSDialogClose")
 *       -> onDialogDestroy (dialog closes)
 *
 * Ajax dialog event chain:
 *
 *   onDialogInit (after dialog body is loaded and HTML replaced)
 *
 *     "text/html" response cycle:
 *     -> onDialogResponse (content loaded)
 *     -> onDialogDestroy  (before content replace)  TODO  onDialogReplace  instead
 *     -> onDialogProgress / onDialogSuccess / onDialogFailed (status)
 *        If Success or Failed, dialog closes, END.
 *     -> onDialogInit     (re-init new content)
 *
 *     "application/json" response (after html responses):
 *     -> onDialogResponse (json received with TRON status)
 *     -> onDialogProgress / onDialogSuccess / onDialogFailed (status)
 *        If Success or Failed:
 *        -> onDialogDestroy (dialog closes, END)
 *
 * Dialog destroy() event chain:
 *
 *   onDialogDestroy (cleanup the dialog contents)
 *     -> onDialogHide() (dialog goes invisible before AjaxDialog cleanup)
 *
 * Dialog hide() event chain:
 *
 *   onDialogHide is notified *if* the dialog is visible, otherwise nothing happens.
 *
 *     The dialog is destroyed when the user clicks the close button, *unless* this
 *     listener returns false. When returning false, the show() method can be used
 *     to make the dialog visible again.
 *
 * Public methods and properties:
 *
 *   on()
 *     This is a proxy method for the dialog's EventDelegator on() method,
 *     use it to attach custom events.
 *
 *   getAjaxPanel()
 *     Returns the AjaxPanel instance (if using remote content), otherwise
 *     null.
 *
 *   getBody()
 *     Returns the dialog body element (with is the "bd" div of the YUI Panel).
 *
 *   isVisible()
 *     Returns true if the dialog is currently visible.
 *
 *   show()
 *   hide()
 *     Toggle the YUI Panel visibility.
 *
 *   destroy()
 *     Hides the dialog, fires onDialogDestroy() (cleanup dialog contents), onDialogHide() and then cleanup.
 *
 * TODO
 * - onDialogDestroy
 * - if static dialog (useMarkup) contains a FORM, instance AjaxPanel?
 *
 */

/* OBSOLETE Juicer imports, (= dependencies) */
/* requires !!! from "%YUI2%" */
/* =require "/container/container-min.js" */
/* OPTIONAL: Animation (only required if using ContainerEffect) */
/* =require "/animation/animation-min.js" */
/* OPTIONAL: Drag & Drop (only required if enabling Drag & Drop) */
/* =require "/dragdrop/dragdrop-min.js" */

import $$, { domGet, hasClass } from "@lib/dom";
import * as TRON from "@lib/tron";
import * as Core from "@old/core";
import { getBodyED } from "@app/root-bundle";
import AjaxPanel from "@old/ajaxpanel";
import EventDelegator from "@old/eventdelegator";
import EventDispatcher from "@old/eventdispatcher";

function insertTop(node) {
  var elParent = document.body;
  elParent.insertBefore(node, elParent.firstChild);
}

/**
 * Constructor.
 *
 * @param {String} srcMarkup   Selector for containing element if using srcMarkup, otherwise set null
 * @param {Object} options
 */
let AjaxDialog = Core.make();

const INVISIBLE_MASK = "yui-invis-mask";

// dialog status as returned by custom events (bind())
AjaxDialog.STATUS_FAILED = 0;
AjaxDialog.STATUS_SUCCESS = 1;
AjaxDialog.STATUS_PROGRESS = 2;

AjaxDialog.DIALOG_LOADING_CLASS = "JsAjaxDlgLoading";

// markup to use inside YUI Panel body while content is loading, 'style' will be set with width
AjaxDialog.DIALOG_LOADING_HTML =
  '<div class="body ' +
  AjaxDialog.DIALOG_LOADING_CLASS +
  '" style><i class="fa fa-spinner fa-spin"></i></div>';

AjaxDialog.prototype = {
  options: null,

  /** @type {EventDispatcher | null} */
  eventDispatcher: null,

  /** @type EventDelegator */
  eventDel: {},

  /** @type YAHOO.widget.Panel */
  yPanel: null,

  // if loading content
  ajaxPanel: null,

  // div for ajaxpanel content (optional)
  contentDiv: null,

  init: function (srcMarkup, options) {
    var elYuiPanel,
      that = this;

    options = !!options ? options : {};

    console.log("AjaxDialog.init() Options: %o", options);

    /**
     * Disable the first/last focus because of annoying :focus outline,
     * and eventually if we want a user friendly auto-focus of the first form field
     * we want more control than yui's default behaviour.
     *
     * @see http://developer.yahoo.com/yui/docs/YAHOO.widget.Panel.html#property_YAHOO.widget.Panel.FOCUSABLE
     */
    console.assert(window.YAHOO);
    YAHOO.widget.Panel.FOCUSABLE = [];

    // set defaults
    this.options = {
      ...{
        autoclose: true,
        close: true,
        modal: true,
        center: true,
        context: null,
        shadow: true,
        invisMask: false,
        skin: false,
      },
      ...options,
    };

    // don't recenter dialog if using context
    if (this.options.context !== null) {
      this.options.center = false;
    }

    var yOptions = {
      modal: this.options.modal,
      draggable: true,
      fixedcenter: false,
      close: this.options.close,
      underlay: this.options.shadow ? "shadow" : "none",
      monitorresize: false, // disable iframe, no idea what it is for
      constraintoviewport: true,
      visible: false,
      context: this.options.context,
    };

    if (options.useMarkup) {
      console.assert(
        $$(srcMarkup)[0],
        "AjaxDialog.init() srcMarkup is not valid, element not found"
      );

      // we have to clone the markup of YUI uses it as is
      elYuiPanel = $$(srcMarkup)[0].cloneNode(true);
      elYuiPanel.setAttribute("id", null);
      insertTop(elYuiPanel);

      this.container = elYuiPanel;
    } else {
      // dynamically create empty dialog to load content
      elYuiPanel = document.createElement("div");
      insertTop(elYuiPanel);
      this.container = elYuiPanel;
    }

    if (this.options.zIndex) {
      yOptions.zIndex = this.options.zIndex;
    }

    // setup the dialog for mobile device (smaller screen)
    if (this.options.mobile === true) {
      yOptions.constraintoviewport = false;
      yOptions.draggable = false; // this also stops YUI from auto-creating the "hd" div
      this.options.center = yOptions.center = false;
    }

    this.yPanel = new YAHOO.widget.Panel(elYuiPanel, yOptions);

    if (options.useMarkup) {
      // it is not visible yet, but clear "display:none" state from the src markup
      this.container.style.display = "block";
    }

    // set loading style for ajax dialogs, now otherwise positioning issues
    if (options.requestUri) {
      if (!options.width) {
        console.warn(
          !!options.width,
          "AjaxDialog.init()   Ajax dialog should set width!"
        );
      }
      this.setBodyLoading(options.width);
    }

    // apply skin if provided BEFORE we render the dialog, duh
    if (this.options.skin !== false) {
      this.yPanel.element.classList.add(this.options.skin);
    }

    // this positions the dialog with visibility:hidden, so the dialog dimensions can be found
    this.yPanel.render();

    // Note: the YUI Panel close button *hides* the dialog, it doesn't destroy it
    this.yPanel.hideEvent.subscribe(
      function () {
        that.onHideEvent();
      },
      this,
      true
    );
    // YUI Module destroy
    //this.yPanel.destroyEvent.subscribe(function(){ that.onDialogClose(); }, this, true);

    // register events
    this.eventDispatcher = new EventDispatcher();
    if (options.events) {
      var events = options.events,
        eventName;
      for (eventName in events) {
        // if scope is undefined, it will be ignored
        this.eventDispatcher.connect(
          eventName,
          events[eventName],
          options.scope
        );
      }
    }

    // register default actions
    this.eventDel = new EventDelegator(this.container, "click");
    this.eventDel.on("JSDialogSuccess", function () {
      that.handleDialogStatus(AjaxDialog.STATUS_SUCCESS);
      return false;
    });
    this.eventDel.on("JSDialogFail", function () {
      that.handleDialogStatus(AjaxDialog.STATUS_FAILED);
      return false;
    });
    this.eventDel.on("JSDialogClose", function () {
      that.destroy();
      return false;
    });
    this.eventDel.on("JSDialogHide", function () {
      that.hide();
      return false;
    });

    // fire the init event for static dialog content
    if (this.options.useMarkup) {
      this.eventDispatcher.notify("onDialogInit");
    }

    // autoclose option: clicking the modal mask will hide the dialog
    if (this.options.autoclose) {
      getBodyED().onDefault(function (ev) {
        if (hasClass(ev.target, "mask")) {
          this.hide();
        }
      }, this);
    }
  },

  render: function () {
    if (this.options.useMarkup) {
      // show the static markup that was hidden
      $$(this.container).css("display", "block");
    }

    if (this.options.center) {
      this.yPanel.center();
    }

    // enable our custom style that will make the modal mask transparent (see base.css)
    if (this.options.invisMask) {
      document.body.classList.add(INVISIBLE_MASK);
    }

    this.rendered = true;
  },

  show: function () {
    if (!this.rendered) {
      this.render();
    }

    if (this.options.requestUri && !this.ajaxPanel) {
      // let YUI generate the .bd div
      //this.yPanel.setBody();

      // the YUI Panel body (.bd) element is our AjaxPanel container
      this.contentDiv = this.yPanel.body;

      this.ajaxPanel = new AjaxPanel(this.contentDiv, {
        initContent: false, // trigger onPanelInit only after content is loaded
        bUseShading: false,
        timeout: this.options.timeout,
        events: {
          onContentInit: this.onPanelInit.bind(this),
          onContentDestroy: this.onPanelDestroy.bind(this),
          onResponse: this.onPanelResponse.bind(this),
          onSubmitForm: this.onPanelSubmit.bind(this),
        },
      });

      this.ajaxPanel.get(
        this.options.requestData || null,
        this.options.requestUri
      );
    }

    this.yPanel.show();
  },

  /**
   * Hide the dialog without destroying it. Use show() to display
   * it again.
   *
   */
  hide: function () {
    if (this.isVisible()) {
      // this will fire YUI Panel's hideEvent() which in turn will fire our onHideEvent() !
      this.yPanel.hide();
    }
  },

  /**
   * YUI Panel hideEvent for the close button gets called *after*
   * the Panel is hidden.
   */
  onHideEvent: function () {
    console.log("AjaxDialog::onHideEvent()");
    // destroy the dialog, unless the listener returns false
    if (false !== this.eventDispatcher.notify("onDialogHide")) {
      this.destroy();
    }
  },

  /**
   *
   * @return {Boolean}    Returns true if the dialog is visible.
   */
  isVisible: function () {
    return !!this.yPanel.cfg.getProperty("visible");
  },

  /**
   * Returns the content div to work with the dialog contents.
   *
   * The content div is the container which contents can be updated
   * by AjaxPanel. Use from within one of the dialog events.
   *
   * @return {HTMLElement}
   *
   */
  getBody: function () {
    console.assert(
      this.yPanel.body !== null,
      "getBody()  YUI Panel body not available"
    );
    return this.yPanel.body;
  },

  /**
   * Set the underlying YUI Panel's body inner html to the "LOADING" div.
   *
   * In mobile mode, the dialog expands to edges, otherwise use a fixed width.
   *
   * @param {number} iWidth
   */
  setBodyLoading: function (iWidth) {
    var sStyle =
      this.options.mobile || !iWidth ? "" : ' style="width:' + iWidth + 'px"';
    this.yPanel.setBody(
      AjaxDialog.DIALOG_LOADING_HTML.replace(/style/, sStyle)
    );
  },

  /**
   * Returns this dialog's AjaxPanel.
   *
   * @return {Object}   AjaxPanel instance, or null (eg, if using static dialog).
   */
  getAjaxPanel: function () {
    return this.ajaxPanel;
  },

  /**
   * This is a proxy method for the dialog's EventDelegator.
   *
   * Add a custom event to the dialog, and bind to elements of given class name.
   *
   * @see   See EventDelegator for method signature.
   */
  on: function () {
    this.eventDel.on.apply(this.eventDel, arguments);
  },

  onPanelResponse: function (tron) {
    //console.log("onPanelResponse(%o)", tron);

    this.eventDispatcher.notify("onDialogResponse", tron);

    // handle the dialog status events for JSON response
    this.handleTRONStatus(tron);
  },

  onPanelInit: function (tron) {
    //console.log('AjaxDialog::onPanelInit()');

    // handle dialog progress status
    if (this.handleTRONStatus(tron)) {
      return;
    }

    this.eventDispatcher.notify("onDialogInit", tron);

    // resize and recenter the dialog with new content
    var tv = tron.getProps();
    /*
      if (tv.dialogWidth) {
        if (!this.donelala) {
          this.yPanel.cfg.setProperty('width', parseInt(tv.dialogWidth, 10) + DIALOG_PADDING_W + 'px');
          if (tv.dialogHeight) {
            this.yPanel.cfg.setProperty('height', parseInt(tv.dialogHeight, 10) + DIALOG_PADDING_H + 'px');
          }
        } else {
          this.donelala = true;
        }
      }
      else {
        // reset width to auto so that styled content adjusts the dialog width
        this.yPanel.cfg.setProperty('width', 'auto');
      }
      */

    // realign if using context alignment
    if (this.options.context) {
      this.yPanel.cfg.setProperty("context", this.options.context);
    }

    if (tv.dialogTitle) {
      this.yPanel.setHeader(tv.dialogTitle);
    }

    // manually center after panel content is loaded
    if (this.options.center) {
      this.yPanel.center();
      // this one works only if "fixedcenter" option is enabled
      // this.yPanel.doCenterOnDOMEvent();
    }

    // focus element if the class is found
    this.setElementFocus();
  },

  /**
   * Sets focus to an element of the dialog that has the required CSS class.
   *
   */
  setElementFocus: function () {
    var el = $$(".JSDialogFocus", this.yPanel.body)[0];
    el && el.focus();
  },

  /**
   * User's custom handler can use Event.getTarget(e) t get the form
   *
   * @param  {Object}  YUI Event from the form submit
   * @return {Boolean}  Return true to proceed with AjaxPanel default behaviour
   */
  onPanelSubmit: function (e) {
    console.log("AjaxDialog::onPanelSubmit()");

    // if the listener returns true, proceed with default ajax submission,
    // otherwise AjaxPanel will cancel the form submit event!
    return this.eventDispatcher.notify("onDialogSubmit", e);
  },

  /**
   * Handles status from TRON response
   *
   * @param {TRON.TronInst} tron
   * @return {boolean}  True if the dialog is closed
   */
  handleTRONStatus: function (tron) {
    var status = tron.getStatus(),
      dialogStatus;

    switch (status) {
      case TRON.STATUS.FAILED:
        dialogStatus = AjaxDialog.STATUS_FAILED;
        break;
      case TRON.STATUS.PROGRESS:
        dialogStatus = AjaxDialog.STATUS_PROGRESS;
        break;
      case TRON.STATUS.SUCCESS:
        dialogStatus = AjaxDialog.STATUS_SUCCESS;
        break;
      default:
        console.warn("AjaxDialog::handleTRONStatus() invalid status");
        break;
    }
    return this.handleDialogStatus(dialogStatus, tron);
  },

  /**
   * Handles status response (from bound action or the dialog ajax response).
   *
   * Closes the dialog in the success/fail cases, fires the status-related events.
   *
   * @param status
   *
   * @return {boolean}  True if the dialog is closed
   */
  handleDialogStatus: function (dialogStatus, tron) {
    console.log("AjaxDialog.handleDialogStatus(%o)", dialogStatus);

    if (dialogStatus === AjaxDialog.STATUS_SUCCESS) {
      // success : dismiss dialog, notify event
      this.eventDispatcher.notify("onDialogSuccess", tron || false);
      // close and destroy dialog unless the hide listener returns false
      this.destroy();
      return true;
    } else if (dialogStatus === AjaxDialog.STATUS_FAILED) {
      // failed : dismiss dialog, notify event
      this.eventDispatcher.notify("onDialogFailed", tron || false);
      // close and destroy dialog unless the hide listener returns false
      this.destroy();
      return true;
    } else if (dialogStatus === AjaxDialog.STATUS_PROGRESS) {
      // progress : do nothing (form submission cycle or other custom)
      this.eventDispatcher.notify("onDialogProgress", tron || false);
    }

    return false;
  },

  /**
   * Maps to AjaxPanel::onContentDestroy()
   *
   */
  onPanelDestroy: function () {
    this.eventDispatcher.notify("onDialogDestroy");
  },

  destroy: function () {
    console.log("AjaxDialog::destroy()");

    // don't run twice
    if (this.destroyed) {
      return;
    } else {
      this.destroyed = true;
    }

    // note: this will fire onDialogDestroy() (content destroy)
    if (this.ajaxPanel) {
      this.ajaxPanel.destroy();
      this.ajaxPanel = null;
    }

    if (this.isVisible()) {
      this.eventDispatcher.notify("onDialogHide");
      this.yPanel.hide();
    }

    // clean events
    this.eventDel.destroy();

    // this could fire the destroyEvent but we don't use it
    this.yPanel.destroy();

    // remore our custom class
    if (this.options.invisMask) {
      document.body.classList.remove(INVISIBLE_MASK);
    }
  },
};

export default AjaxDialog;
