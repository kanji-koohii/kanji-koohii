/**
 * RtK Kanji flashcard review.
 *
 * Options:
 *
 *   fcr_options   Options to setup uiFlashcardReview
 *   end_url       Url to redirect to at the end of the review
 *
 */
// dont@ts-check

import $$, { DomJS, domGet, hasClass } from "@lib/dom";
import AjaxDialog from "@old/ajaxdialog";
import DictLookupDialog from "@old/components/DictLookupDialog";
import EditStoryDialog from "@old/components/EditStoryDialog";
import FlashcardReview from "@app/review/FlashcardReview";

export default class KanjiReview {
  /** @type {Dictionary} */
  options = {};

  /** @type {FlashcardReview | null} */
  oReview = null;

  /** @type {DomJS<Element> | null}*/
  $elStats = null;

  /** @type {DictLookupDialog | null} */
  dictDialog = null;

  /** @type {EditStoryDialog | null} */
  editStoryDialog = null;

  /** @type {number[]} */
  deletedCards = [];

  /**
   *
   * @param {Dictionary} options
   */
  constructor(options) {
    this.options = options;

    options.fcr_options.events = {
      onBeginReview: this.onBeginReview,
      onEndReview: this.onEndReview,
      onFlashcardCreate: this.onFlashcardCreate,
      onFlashcardDestroy: this.onFlashcardDestroy,
      onFlashcardState: this.onFlashcardState,
      onFlashcardUndo: this.onFlashcardUndo,
      onAction: this.onAction,
      scope: this,
    };

    this.oReview = new FlashcardReview(options.fcr_options);

    this.oReview.addShortcutKey("f", "flip");
    this.oReview.addShortcutKey(" ", "flip");
    this.oReview.addShortcutKey(96, "flip");

    this.oReview.addShortcutKey("n", "no");
    this.oReview.addShortcutKey("h", "hard");
    this.oReview.addShortcutKey("y", "yes");
    this.oReview.addShortcutKey("e", "easy");

    // added number keys to answer with just left hand
    this.oReview.addShortcutKey("1", "no");
    this.oReview.addShortcutKey("2", "hard");
    this.oReview.addShortcutKey("3", "yes");
    this.oReview.addShortcutKey("4", "easy");

    // same for numpad keys
    this.oReview.addShortcutKey(97, "no");
    this.oReview.addShortcutKey(98, "hard");
    this.oReview.addShortcutKey(99, "yes");
    this.oReview.addShortcutKey(100, "easy");

    this.oReview.addShortcutKey("u", "undo");
    this.oReview.addShortcutKey("s", "story");
    this.oReview.addShortcutKey("d", "dict");

    // skip flashcard (110 = comma)
    this.oReview.addShortcutKey("k", "skip");
    this.oReview.addShortcutKey(110, "skip");

    // Disabled because it's next to (F)lip Card
    //this.oReview.addShortcutKey('d', 'delete');

    // flashcad container
    // this.elFlashcard = $$('.uiFcCard')[0];

    // stats panel
    this.$elStats = $$("#uiFcStats");
    this.elsCount = $$("#uiFcProgressBar .count"); //array
    this.elProgressBar = $$("#review-progress span")[0];

    // answer stats
    this.elAnswerPass = this.$elStats.down(".JsPass")[0];
    this.elAnswerFail = this.$elStats.down(".JsFail")[0];
    this.countYes = 0;
    this.countNo = 0;

    this.countDeleted = 0;
    this.deletedCards = [];

    // end review div
    this.elFinish = this.$elStats.down(".JsFinish")[0];
  }

  /**
   * Returns an option value
   *
   * @param {string} name
   */
  getOption(name) {
    return this.options[name];
  }

  onBeginReview() {
    //console.log('KanjiReview.onBeginReview()');
  }

  /**
   * Update the visible stats to the latest server hit,
   * and setup form data for redirection to the Review Summary page.
   *
   */
  onEndReview() {
    console.log("KanjiReview.onEndReview()");

    this.updateStatsPanel();

    // set form data and redirect to summary with POST
    var elFrm = domGet("uiFcRedirectForm");
    elFrm.method = "post";
    elFrm.action = this.getOption("end_url");
    elFrm.elements["fc_pass"].value = this.countYes;
    elFrm.elements["fc_fail"].value = this.countNo;
    elFrm.elements["fc_deld"].value = this.deletedCards.join(",");
    elFrm.submit();
  }

  onFlashcardCreate() {
    console.log("KanjiReview.onFlashcardCreate()");

    // Show panels when first card is loaded
    if (this.oReview.getPosition() === 0) {
      this.$elStats.toggle();
    }

    // Show undo action if available
    $$("#JsBtnUndo").toggle(this.oReview.getNumUndos() > 0);

    this.updateStatsPanel();
  }

  /**
   * Hide buttons until next card shows up.
   *
   */
  onFlashcardDestroy() {
    $$("#uiFcButtons0").toggle(false);
    $$("#uiFcButtons1").toggle(false);
  }

  onFlashcardUndo(oAnswer) {
    //  console.log('onFlashcardUndo(%o)', oAnswer);

    // correct the Yes / No totals
    this.updateAnswerStats(oAnswer, true);
  }

  onFlashcardState(iState) {
    console.log("onFlashcardState(%d)", iState);
    $$("#uiFcButtons0").toggle(iState === 0);
    $$("#uiFcButtons1").toggle(iState !== 0);
  }

  onAction(sActionId, oEvent) {
    /** @type {number | 'h' | false} */
    var cardAnswer = false;

    console.log("KanjiReview.onAction(%o)", arguments);

    // help dialog
    if (sActionId === "help") {
      var dlg = new AjaxDialog("#JsFcHelpDlg", {
        useMarkup: true,
        context: ["JsBtnHelp", "tl", "bl", null, [0, 0]],
        skin: "rtk-skin-dlg",
        mobile: true,
        close: false,
      });
      dlg.show();

      return false;
    }

    // flashcard is loading
    if (!this.oReview.getFlashcard()) {
      return false;
    }

    if (sActionId === "story") {
      this.toggleEditStory();
      return false;
    }

    if (sActionId === "dict") {
      this.toggleDictDialog();
      return false;
    }

    switch (sActionId) {
      case "fcmenu":
        this.flashcardMenu();
        break;
      case "delete":
        this.answerCard(4);
        break;

      case "flip":
        if (
          oEvent.type === "click" &&
          hasClass(oEvent.target, "JsKeywordLink")
        ) {
          // pass through so the link functions
          return true;
        }

        if (this.oReview.getFlashcardState() === 0) {
          this.oReview.setFlashcardState(1);
        }
        break;

      case "undo":
        if (this.oReview.getNumUndos() > 0) {
          this.oReview.backward();
        }
        break;

      case "end":
        this.elFinish.style.display = "none";
        this.oReview.endReview(); // this will notify onEndReview()
        break;

      case "skip":
        this.answerCard(5);
        break;

      case "no":
        cardAnswer = 1;
        break;

      case "hard":
        cardAnswer = "h";
        break;

      case "yes":
        cardAnswer = 2;
        break;

      case "easy":
        cardAnswer = 3;
        break;
    }

    if (cardAnswer) {
      // "No" answer doesn't require flipping the card first (issue #163)
      if (sActionId === "no" || this.oReview.getFlashcardState() > 0) {
        this.answerCard(cardAnswer);
      }
    }

    return false;
  }

  toggleEditStory() {
    if (this.editStoryDialog && this.editStoryDialog.isVisible()) {
      this.editStoryDialog.hide();
    } else {
      const oCardData = this.oReview.getFlashcardData();

      if (!this.editStoryDialog) {
        // initialize Story Window and its position
        //var left = this.elFlashcard.offsetLeft + (this.elFlashcard.offsetWidth /2) - (520/2);
        //var top = this.elFlashcard.offsetTop + 61;
        this.editStoryDialog = new EditStoryDialog(
          this.getOption("editstory_url"),
          oCardData.id
        );
      } else {
        this.editStoryDialog.load(oCardData.id);
        this.editStoryDialog.show();
      }
    }
  }

  toggleDictDialog() {
    if (this.dictDialog && this.dictDialog.isVisible()) {
      this.dictDialog.hide();
    } else {
      const oCardData = this.oReview.getFlashcardData();
      const ucsId = oCardData.id;

      if (!this.dictDialog) {
        this.dictDialog = new DictLookupDialog();
      }

      this.dictDialog.show();
      this.dictDialog.load(ucsId);
    }
  }

  /**
   *
   * @param  int   answer   1-3 (No/Yes/Easy) h (Hard), 4 (Delete), 5 (Skip)
   */
  answerCard(answer) {
    var oCardData = this.oReview.getFlashcardData(),
      oAnswer = { id: oCardData.id, r: answer };

    this.oReview.answerCard(oAnswer);
    this.updateAnswerStats(oAnswer, false);
    this.oReview.forward();
  }

  skipFlashcard() {
    this.answerCard(5);
  }

  /**
   * The little wrench icon that opens the menu contains:
   *
   *  data-param  {"review":1}    JSON data passed on the the menu ajax post (plus ucs id)
   *  data-uri                    Flashcard Edit Dialog ajax url
   *
   */
  flashcardMenu() {
    var el = domGet("uiFcMenu"),
      data = el.dataset,
      oCardData = this.oReview.getFlashcardData();

    function onMenuHide() {
      // clear icon focus state when dialog closes
      el.classList.remove("active");
    }

    function onMenuItem(menuid) {
      if (menuid === "confirm-delete") {
        // set flashcard answer that tells server to delete the card
        this.answerCard(4);
        return true;
      } else if (menuid === "skip") {
        this.skipFlashcard();
        return true;
      }

      // does not close dialog
      return false;
    }

    el.classList.add("active");

    // reload the edit flashcard menu when changed flashcard
    if (oCardData.id !== this.oEditFlashcardId) {
      this.oEditFlashcardId = oCardData.id;

      if (this.oEditFlashcard) {
        this.oEditFlashcard.destroy();
        this.oEditFlashcard = null;
      }
    }

    if (!this.oEditFlashcard) {
      var params = Y.lang.merge(JSON.parse(data.param), { ucs: oCardData.id });
      //console.log("zomg %o", params);return false;

      this.oEditFlashcard = new App.Ui.EditFlashcardDialog(
        data.uri,
        params,
        [el, "tr", "br"],
        {
          events: {
            onMenuHide: onMenuHide,
            onMenuItem: onMenuItem,
          },
          scope: this,
        }
      );
    } else {
      this.oEditFlashcard.show();
    }

    return false;
  }

  updateStatsPanel() {
    //  console.log('KanjiReview.updateStatsPanel()');
    var items = this.oReview.getItems(),
      num_items = items.length,
      position = this.oReview.getPosition();

    // update review count
    this.elsCount[0].innerHTML = Math.min(position + 1, num_items);
    this.elsCount[1].innerHTML = num_items;

    // update progress bar
    var pct = position > 0 ? Math.ceil((position * 100) / num_items) : 0;
    pct = Math.min(pct, 100);
    this.elProgressBar.style.width = (pct > 0 ? pct : 0) + "%";
  }

  /**
   *
   * @param  {Object}  answer  { id: <ucs_id>, r: <answer code> }
   * @param  {Boolean} undo
   */
  updateAnswerStats(answer, undo) {
    // cf. uiFlashcardReview.php const
    var yes = answer.r === 2 || answer.r === 3 ? 1 : 0,
      no = answer.r === 1 || answer.r === "h" ? 1 : 0,
      deld = answer.r === 4 ? 1 : 0;

    if (undo) {
      yes = -yes;
      no = -no;
      deld = -deld;
    }

    this.countYes += yes;
    this.countNo += no;
    this.elAnswerPass.innerHTML = this.countYes;
    this.elAnswerFail.innerHTML = this.countNo;

    if (deld !== 0) {
      this.updateDeletedCards(answer.id, deld);
    }
  }

  updateDeletedCards(ucsId, count) {
    this.countDeleted += count;

    if (count > 0) {
      this.deletedCards.push(ucsId);
    } else if (count < 0) {
      this.deletedCards.pop();
    }

    $$("#uiFcStDeld").toggle(this.countDeleted > 0);

    domGet("uiFcStDeld").getElementsByTagName(
      "em"
    )[0].innerHTML = this.countDeleted;

    domGet("uiFcStDeldK").firstChild.innerHTML = this.getDeletedCards();
  }

  getDeletedCards() {
    return "&#" + this.deletedCards.join(";&#") + ";";
  }

  /**
   * Sets buttons (children of element) to default state, or disabled state
   *
   */
  setButtonState(elParent, bEnabled) {
    $$(".uiIBtn", elParent).each((el) => {
      el.classList.toggle("uiFcBtnDisabled", bEnabled);
    });
  }
}
