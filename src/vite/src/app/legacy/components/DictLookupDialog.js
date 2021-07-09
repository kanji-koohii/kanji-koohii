/**
 * DictLookupDialog  -- REFACTORING AT SOME POINT TO A VUE-BASED DIALOG
 *
 *  show()
 *  load()   load another result (avoids recreating dialog and maintains drag/drop position)
 *
 */

import VueInstance from "@lib/helpers/vue-instance";
import AjaxDialog from "@old/ajaxdialog";
import KoohiiDictList from "@/vue/KoohiiDictList.vue";

const isMobile = window.innerWidth <= 720;

export default class DictLookupDialog {
  // unique id to find when we need to reload the dialog
  ucsId = 0;

  /** @type {TVueInstanceOf<typeof KoohiiDictList>} */
  vueInst = null;

  constructor() {
    this.ucsId = 0;

    var dlgopts = {
      skin: isMobile ? "rtk-mobl-dlg" : "rtk-skin-dlg",
      mobile: isMobile,
      scope: this,
      events: {
        onDialogDestroy: this.onDialogDestroy,
        onDialogHide: this.onDialogHide,
      },
    };

    if (!isMobile) {
      dlgopts.context = [document.body, "tl", "tl", null, [1, 1]]; // YUI2 container "context" option
    }

    this.dialog = new AjaxDialog(null, dlgopts);
    this.dialog.show();

    // hack-ish (legacy code) -- we need a mount point
    this.dialog.yPanel.setBody(
      '<div class="JsMount" style="min-height:100px;background:#fff;"></div>'
    );
  }

  /**
   *
   * @param {number} ucsId  kanji UCS code
   * @returns
   */
  load(ucsId) {
    // Don't load the same kanji twice in a row
    if (this.ucsId === ucsId) {
      return;
    }

    if (!this.vueInst) {
      // note: mounting the Vue 3 component will replace our "loading" div
      var elMount = this.dialog.getBody();
      let { vm } = VueInstance(KoohiiDictList, elMount);
      this.vueInst = vm;
    }

    this.vueInst.load(ucsId);

    // note: this also prevents spamming load() while ajax is in progress
    this.ucsId = ucsId;
  }

  show() {
    console.log("DictLookupDialog::show()");
    this.dialog.show();
  }

  hide() {
    this.dialog.hide();
  }

  onDialogHide() {
    console.log("DictLookupDialog::hide()");

    // keep the dialog in the page
    return false;
  }

  onDialogDestroy() {}

  /** @return {boolean} */
  isVisible() {
    return this.dialog.isVisible();
  }
}
