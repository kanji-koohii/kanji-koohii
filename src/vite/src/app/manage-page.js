/**
 * FIXME: legacy code, should use Vue but this requires the entire
 *        Manage Flashcards section to be redone, using API calls,
 * with each sub-page (add cards, remove cards, edit keywords...)
 * redone as separate views + state management...
 *        Which is not worth the trouble unless we redesign/rethink
 * the UI.
 */

import $$, { domGet } from "@lib/dom";
import { getBodyED } from "@app/root-bundle";
import AjaxPanel from "@old/ajaxpanel";
import AjaxTable from "@old/ajaxtable";
import SelectionTable from "@old/selectiontable";

import EditKeywordDialog from "@old/components/EditKeywordDialog";

export default {
  init() {
    console.log("manage-page::init()");
    
    var bodyED = getBodyED();

    this.initView("#manage-view .ajax");

    // Cancel/Reset buttons on ajax forms
    bodyED.on("JSManageCancel", (e, el) => {
      return this.load(el, { cancel: true });
    });
    bodyED.on("JSManageReset", (e, el) => {
      return this.load(el, { reset: true });
    });

    // Manage > Edit Keywords
    var el = domGet("EditKeywordsTableComponent");
    if (el) {
      this.ajaxTable = new AjaxTable(el);
      this.editKeywordUri = el.dataset.uri;
      bodyED.on("JSEditKeyword", this.onEditKeyword.bind(this));
    }
  },

  initView(viewId) {
    this.viewDiv = $$(viewId)[0];

    if (this.viewDiv) {
      this.viewPanel = new AjaxPanel(this.viewDiv, {
        bUseShading: false,
        initContent: true,
        form: ".main-form",
        events: {
          onSubmitForm: this.onSubmitForm.bind(this),
          onContentInit: this.onContentInit.bind(this),
          onContentDestroy: this.onContentDestroy.bind(this),
        },
      });
    }
  },

  onContentInit() {
    var i;

    console.log("onContentInit()");

    var el = (this.elSelectionTable = $$(".selection-table", this.viewDiv)[0]);
    if (el) {
      // clear checkboxes in case of page refresh
      $$(".checkbox", el).each((el, i) => {
        el.checked = false;
      });

      this.selectionTable = new SelectionTable(el);
    }
  },

  onContentDestroy() {
    if (this.selectionTable) {
      this.selectionTable.destroy();
      this.selectionTable = null;
    }
  },

  onSubmitForm(oEvent) {
    var data = this.selectionTable ? this.selectionTable.getPostData() : null;

    this.viewPanel.post(data);

    return false;
  },

  load(element, params) {
    this.viewPanel.post(params);
    return false;
  },

  /**
   * Open the Edit Keyword dialog for keywords in the Manage > Edit Keywords table.
   *
   */
  onEditKeyword(e, el) {
    var options;

    // @param  {String}   keyword
    // @param  {Boolean}  next (optional)
    const callback = (keyword, next) => {
      console.log("EditKeywordDialog callback");

      // get the custkeyword td
      let tr = $$(el).closest("tr");
      let td = $$(".JSCkwTd", tr)[0];
      td.innerHTML = keyword;

      // force reload
      this.oEditKeyword.destroy();
      this.oEditKeyword = null;

      if (next) {
        console.log("Edit next keyword...", tr);
        let nextRow = tr.nextElementSibling;
        if (nextRow) {
          let nextEl = $$(".JSEditKeyword", nextRow)[0];
          window.setTimeout(() => {
            this.onEditKeyword(null, nextEl);
          }, 200);
        }
      }
    };

    // just show dialog if clicking the same keyword twice, otherwise load

    var ucsId = el.dataset.id;
    if (!this.oEditKeyword || ucsId !== this.editKeywordId) {
      var contextEl = $$(el).closest("td");

      options = {
        context: [contextEl, "tr", "tr", null, [0, 0]],
        params: {
          id: ucsId,
          manage: true,
        } /* manage: use the "Save & Next" chain editing */,
      };

      // FIXME ideally should call this.oEditKeyword.destroy() here if it is set

      this.oEditKeyword = new EditKeywordDialog(
        this.editKeywordUri,
        options,
        callback
      );
      this.editKeywordId = ucsId;
    } else {
      this.oEditKeyword.show();
    }

    return false;
  },
};
