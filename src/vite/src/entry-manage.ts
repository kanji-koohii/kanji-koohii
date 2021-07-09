/**
 * FIXME: legacy code, should use Vue but this requires the entire
 *        Manage Flashcards section to be redone, using API calls,
 * with each sub-page (add cards, remove cards, edit keywords...)
 * redone as separate views + state management...
 *        Which is not worth the trouble unless we redesign/rethink
 * the UI.
 */

// stylesheets
import "@css/manage.build.scss";

import $$, { domGet } from "@lib/dom";
import { getBodyED } from "@app/root-bundle";
import AjaxPanel from "@old/ajaxpanel";
import AjaxTable from "@old/ajaxtable";
import EditKeywordDialog from "@old/components/EditKeywordDialog";
import SelectionTable from "@old/selectiontable";

class ManagePage {
  private viewDiv?: Element;
  private viewPanel?: IAjaxPanel;
  private selectionTable: SelectionTable | null = null;

  private editKeywordUri: string = "";
  private editKeywordId: string = "";
  private oEditKeyword?: EditKeywordDialog | null;

  constructor() {
    console.log("@entry-manage ...");

    const bodyED = getBodyED();

    this.viewDiv = this.initView("#manage-view .ajax");

    // Cancel/Reset buttons on ajax forms
    bodyED.on("JSManageCancel", (e, el) => {
      return this.load(el, { cancel: true });
    });
    bodyED.on("JSManageReset", (e, el) => {
      return this.load(el, { reset: true });
    });

    // Manage > Edit Keywords
    const el = domGet("EditKeywordsTableComponent") as HTMLElement;
    if (el) {
      const ajaxTable = new AjaxTable(el);
      this.editKeywordUri = el.dataset.uri!;
      bodyED.on("JSEditKeyword", this.onEditKeyword.bind(this));
    }
  }

  initView(selector: string): Element | undefined {
    const elView = $$(selector)[0];

    if (elView) {
      this.viewPanel = new (AjaxPanel as IAjaxPanel)(elView, {
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

    return elView;
  }

  onContentInit() {
    console.log("onContentInit()");

    const el = $$(".selection-table", this.viewDiv)[0];
    if (el) {
      // clear checkboxes in case of page refresh
      $$<HTMLFormElement>(".checkbox", el).each((el, i) => {
        el.checked = false;
      });

      this.selectionTable = new SelectionTable(el as HTMLElement);
    }
  }

  onContentDestroy() {
    if (this.selectionTable) {
      this.selectionTable.destroy();
      this.selectionTable = null;
    }
  }

  onSubmitForm(oEvent: Event) {
    const data = this.selectionTable ? this.selectionTable.getPostData() : {};
    this.viewPanel!.post(data);

    return false;
  }

  load(element: Element, params: Dictionary) {
    this.viewPanel!.post(params);
    return false;
  }

  /**
   * Open the Edit Keyword dialog for keywords in the Manage > Edit Keywords table.
   *
   */
  onEditKeyword(e: Event | null, el: HTMLElement): boolean {
    // @param  {String}   keyword
    // @param  {Boolean}  next (optional)
    const callback = (keyword: string, next: boolean) => {
      console.log("EditKeywordDialog callback");

      // get the custkeyword td
      let tr = $$(el).closest("tr")!;
      let td = $$(".JSCkwTd", tr)[0];
      td.innerHTML = keyword;

      // force reload
      this.oEditKeyword!.destroy();
      this.oEditKeyword = null;

      if (next) {
        console.log("Edit next keyword...", tr);
        let nextRow = tr.nextElementSibling;
        if (nextRow) {
          let nextEl = $$(".JSEditKeyword", nextRow)[0] as HTMLElement;
          window.setTimeout(() => {
            this.onEditKeyword(null, nextEl);
          }, 200);
        }
      }
    };

    // just show dialog if clicking the same keyword twice, otherwise load

    const ucsId = el.dataset.id!;
    if (!this.oEditKeyword || ucsId !== this.editKeywordId) {
      const contextEl = $$(el).closest("td");

      const options = {
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
  }
}

new ManagePage();
