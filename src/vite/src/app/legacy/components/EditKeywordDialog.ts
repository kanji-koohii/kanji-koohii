// FIXME: legacy Edit Keyword dialog, should be a Vue

import $$, { stopEvent } from "@lib/dom";
import * as TRON from "@lib/tron";
import * as Core from "@old/core";
import EventCache from "@old/eventcache";
import AjaxDialog from "@old/ajaxdialog";

type EditKeywordResponse = {
  orig_keyword: string;
  cust_keyword: string | null;
};

type EditKeywordSuccessResponse = {
  keyword: string;
  next?: boolean;
};

export default class EditKeywordDialog {
  private options: any;

  private callback: Function;

  private dialog: IAjaxDialog | null = null;

  private evtCache: EventCache | null = null;

  private props: EditKeywordResponse | null = null;

  /**
   *
   * Options:
   *   context    Sets the context element to align the dialog (see YUI2 Overlay).
   *   params     Request data for AjaxDialog: id => ucs code, manage => enable chain editing
   *
   * @param {string} uri  request uri
   * @param {any} options   params (AjaxDialog requestData), context (YUI2 Panel option)
   * @param {function} callback   Callback to insert the updated keyword back into the page
   */
  constructor(url: string, options: Dictionary, callback: Function) {
    console.log("EditKeywordDialog(%s, %o)", url, options);

    this.options = options;
    this.callback = callback;

    let dlgopts = {
      requestUri: url,
      requestData: options.params,
      skin: "rtk-skin-dlg",
      context: options.context,
      scope: this,
      events: {
        onDialogInit: this.onInit,
        onDialogDestroy: this.onDestroy,
        onDialogSuccess: this.onSuccess,
        onDialogHide: this.onHide,
      },
    };

    this.dialog = new (AjaxDialog as IAjaxDialog)(null, dlgopts);
    this.dialog.on("reset", this.onReset, this);
    this.dialog.show();
  }

  // Show again, after it is closed with the YUI close button.
  show() {
    this.dialog!.show();
    this.focus();
  }

  destroy() {
    this.dialog!.destroy();
    this.dialog = null;
  }

  focus() {
    let el = this.getInput();
    el.focus();
    el.select();
  }

  onInit(t: TRON.TronInst<EditKeywordResponse>) {
    this.props = t.getProps();

    // listener for the TAB key (chain edit on the Manage page)
    this.evtCache = new EventCache();
    this.evtCache.addEvent(
      this.getInput(),
      "keydown",
      this.onKeyDown.bind(this)
    );

    this.focus();
  }

  onDestroy() {
    this.evtCache!.destroy();
    this.evtCache = null;
  }

  onKeyDown(e: KeyboardEvent) {
    // TAB key
    if (e.keyCode === 9) {
      this.dialog!.getAjaxPanel().post({ doNext: true });
      stopEvent(e);
      return false;
    }

    return true;
  }

  onHide() {
    // keep the dialog in the page
    return false;
  }

  // Copy keyword back into the main page
  // If JsTron property "next" is returned, the callback for the Manage page edits the next keyword
  onSuccess(t: TRON.TronInst<EditKeywordSuccessResponse>) {
    let props = t.getProps();
    this.callback(props.keyword, props.next);
  }

  onReset(e: Event, el: Element) {
    let input = this.getInput();
    input.value = this.props!.orig_keyword;
    input.focus();
    return false;
  }

  getInput(): HTMLInputElement {
    return $$(".txt-ckw", this.dialog!.getBody())[0] as HTMLInputElement;
  }
}
