/**
 * FlashcardReview is a reusable flashcard review component. It handles communication
 * with the server (ajax), caching and prefetching of flashcard data, and the state of
 * the review session (forward, backward (undo), end). Also handles shortcut keys.
 *
 * Presentation logic is handled by the "child" class, through events that are notified
 * by FlashcardReview's event dispatcher.
 *
 *
 * Public methods:
 *
 *   initialize(options)   Constructor, pass an options object:
 *
 *       items            An array of flashcard ids (REQUIRED)
 *       ajax_url         Url of ajax action to get/post flashcard data (REQUIRED)
 *       back_url         Http location to go to when review ends with no reviews
 *
 *       params           Parameters sent with every request (maintains state of review options) (OPTIONAL)
 *
 *       max_undo         Maximum undo/backward level
 *       num_prefetch     How many flashcards to fetch ahead
 *       events           An object with events to register (see notifications below)
 *         scope            Scope to use for the events (property, optional)
 *       put_request      Set to false if not posting any answers to the server. "onEndReview" will be
 *                        notified automatically after forward() has moved past the last item.
 *
 *   connect(sName, fnEvent [,scope])   Add a listener
 *   disconnect(sName)                  Remove a listener
 *   notify(sName[, args...])           Notify listeners
 *
 *   addShortcutKey(sKey, sActionId)
 *                        Add a keyboard shortcut for an action, the action id is passed to 'onAction' notification
 *
 * Methods to control the review session:
 *
 *   beginReview()        Called automatically when FlashcardReview is instanced.
 *   endReview()          Ends review: flushes postCache to server, then notifies "onEndReview".
 *   forward()            Advance to next flashcard
 *   backward()           Go back one card (undo), notifies "onFlashcardUndo" event, with the last flashcard answer.
 *
 * Methods to get/put information:
 *
 *   getOption()          Returns one of the options as passed to initialize(), TODO: DEPRECATED (bad)
 *   getPosition()        Returns current index into the flashcard items array
 *   getFlashcard()       Returns current uiFlashcard, or null
 *   getFlashcardData()   Returns json data for current flashcard
 *   getItems()           Returns array of flashcard ids, length of array = number of flashcards in session
 *   getPostCount()       Returns count of flashcard answers that need to be posted to server
 *   getNumUndos()        Returns number of undo levels currently available
 *   getFlashcardState()  Returns the current state (0 = default), or false if no current card is set
 *   setFlashcardState(n) Sets state for current flashcard, this changes the "uiFcState" class name on the flashcard
 *   answerCard(oData)    Set data to post back to server as answer for current card.
 *                        This is not required if option "put_request" is false.
 *
 * Notifications:
 *
 *   onBeginReview        When review begins, during FlashcardReview initialization
 *   onEndReview          Notified when the last flashcard is answered and the post cache has been successfully handled by server
 *   onFlashcardCreate    Before new flashcard is created and shown. Flashcard data is available and can be changed
 *                        with getFlashcardData()
 *   onFlashcardState(n)  Called just after 'onFlashcardCreate' for default state 0, and then everytime the state
 *                         is set with setFlashcardState(). Argument n is the state number.
 *   onFlashcardDestroy   Before the current flashcard is destroyed
 *   onFlashcardUndo(o)   Called when user undo'es flashcard answer. Argument o is the answer data as it was passed
 *                        to answerCard(). Notified only if "put_request" is true (default).
 *   onAction(id, ev)     Called for clicks on elements with "uiFcAction-XYZ" class; where id is "XYZ"; as well as
 *                        keyboard shortcuts set with addShortcutKey(). This listener must explicitly return false
 *                        to stop event from propagating (ev is the event object).
 *
 * Ajax RESPONSE format (in Json):
 *
 *   get                  Array of flashcard data, one object for each id that came in request.
 *                        Properties that match elements of class "fcData-xxx" where xxx is the property name,
 *                        are automatically loaded into the element (innerHTML, html allowed), other properties
 *                        may be used by the peer class.
 *                        Returned objects must have the property "id" set to the corresponding flashcard id's.
 *
 *   put                  Array of flashcard ids which were succesfully handled.
 *                        The items are cleared from the postCache. If not cleared, these items will
 *                        be posted again during the next prefetchs.
 *
 * Usage:
 *
 *   #uiFcAjaxLoading
 *     => div with "Loading..." message shown during Ajax request.
 *   #uiFcAjaxError
 *     => div that shows for ajax errors, or server errors, span.msg is set to error message.
 *   DIV.uiFcCard
 *     => the flashcard container
 *   .uiFcState-N
 *     => the flashcard state, where N is a number, 0 is the default state, use with css rules to set
 *        visibility of various information on the card depending on state (eg. 0 = question, 1 = answer)
 *
 *   a.uiFcAction-XXXX
 *     Links that trigger an action (answer buttons), calls event "onAction" with "XXXX" as second argument
 *
 */

import { getBodyED, kk_globals_get } from "@app/root-bundle";
import AjaxQueue from "@old/ajaxqueue";
import EventDispatcher from "@old/eventdispatcher";
import Keyboard from "@old/keyboard";
import VueInstance from "@lib/helpers/vue-instance";

import KoohiiFlashcard from "@/vue/KoohiiFlashcard.vue";

class FlashcardReview {
  // flashcard selection as an array of flashcard ids
  items = null;

  // review position, from 0 to items.length-1
  position = null;

  // Cache of flashcard data.
  // Associative array using flashcard ids for retrieval.
  // Flashcard data is maintained for prefetched items and max_undo items,
  // other cards are deleted when they are beyond the undo range.
  //
  // cacheStart and cacheEnd indicate the range of valid flashcard data
  // in the cache array.
  cache = null;
  cacheStart = null;
  cacheEnd = null;

  // the next position at which to prefetch new flashcard data
  // is recalculated on server reply, based on number of items server returned
  prefetchPos = null;

  // max items to cache for undo
  max_undo = null;
  // current undo level (number of steps backward)
  undoLevel = null;

  // how many items to preload
  num_prefetch = null;

  // event dispatcher for notifications
  eventDispatcher = null;

  // array of answer data for flashcards that is not posted yet
  // the data is freeform, the property id corresponds to a flashcard id
  postCache = null;

  // uiAjaxQueue instance
  ajaxQueue = null;

  /** @type {TVueInstanceOf<typeof KoohiiFlashcard>} */
  curCard = null;
  /** @type Function */
  curCardUnmount = null;

  /**
   * Initialize the front end Flashcard Review component.
   *
   * @param {Window["KK"]["REVIEW_OPTIONS"]} options
   */
  constructor(options) {
    console.log("FlashcardReview::init(%o)", options);

    // set options and fix defaults
    this.options = options;
    this.options.max_undo = options.max_undo || 3;
    this.options.num_prefetch = options.num_prefetch || 10;
    this.options.put_request = options.put_request === false ? false : true;

    // set options and make proxies
    this.items = this.options.items;
    this.max_undo = this.options.max_undo;
    this.num_prefetch = this.options.num_prefetch;

    //
    if (!this.items || !this.items.length) {
      alert("No flashcard items in this selection.");
      return;
    }

    // register listeners
    this.eventDispatcher = new EventDispatcher();
    var scope = options.events.scope;
    for (var sEvent in options.events) {
      this.eventDispatcher.connect(sEvent, options.events[sEvent], scope);
    }

    // init ajax
    this.ajaxQueue = new AjaxQueue({
      elError: "uiFcAjaxError",
      elLoading: "uiFcAjaxLoading",
      events: {
        onSuccess: this.onAjaxSuccess.bind(this),
      },
    });

    // buttons and other custom actions
    var ed = getBodyED();
    ed.on("uiFcAction", this.onActionEvent, this);

    // initialize shortcuts and keyboard handler
    this.oKeyboard = new Keyboard();

    //
    this.postCache = [];
    this.undoLevel = 0;

    // flashcard as a Vue component (wip)
    this.curCard = null;

    //    this.ofs_prefetch = Math.floor(this.num_prefetch);

    this.beginReview();
  }

  /**
   * Add or remove onbeforeunload event to warn user of loosing
   * flashcard answers.
   *
   */
  updateUnloadEvent() {
    if (this.getPostCount()) {
      window.onbeforeunload = function() {
        return (
          "WAIT! You may lose a few flashcard answers if you leave the page now.\r\n" +
          "Select CANCEL to stay on this page, and then click the END button to\r\n" +
          "complete this review session."
        );
      };
    } else {
      window.onbeforeunload = null;
    }
  }

  /**
   * The event listener bound to html elements that use "uiFcAction-XXX" class names.
   *
   * Makes sure to stop the mouse click event, to prevent page from jumping.
   *
   * @param  {Object}      ev   Event object
   * @param  {HTMLElement} el   Matched element
   */
  onActionEvent(ev, el) {
    var data = el.dataset,
      action = data.action;
    console.assert(
      !!data.action,
      'onActionEvent() bad "action" attribute, element %o',
      el
    );

    return false !== this.notify("onAction", action, ev);
  }

  /**
   * EventDispatcher proxy.
   *
   * @see EventDispatcher, scope is optional.
   */
  connect(sName, fnEvent, scope) {
    this.eventDispatcher.connect(sName, fnEvent, scope);
  }

  disconnect(sName, fnEvent) {
    this.eventDispatcher.disconnect(sName, fnEvent);
  }

  notify() {
    return this.eventDispatcher.notify.apply(this.eventDispatcher, arguments);
  }

  beginReview() {
    this.notify("onBeginReview");

    this.position = -1;
    this.cache = {};
    this.cacheStart = 0;
    this.cacheEnd = -1;
    this.cacheNext = -1;
    this.prefetchPos = 0; // when to prefetch new cards, updated by each ajax response

    this.forward();
  }

  /**
   * Go back to previous page if no cards were answered yet,
   * otherwise flush post cache and notify review end.
   *
   */
  endReview() {
    if (this.position <= 0) {
      // redirect to back_url
      if (this.options.back_url) {
        window.location.href = this.options.back_url;
        return;
      } else {
        return;
      }
    }

    // clear last card from display
    this.destroyCurCard();

    if (this.options.put_request) {
      // flush post cache and will notify end of review on ajax response
      this.sendReceive(true);
    } else {
      // notify end of review here because there is nothing to post
      this.notify("onEndReview");
    }
  }

  forward() {
    this.position++;

    if (this.undoLevel > 0) {
      this.undoLevel--;
    }

    // destroy previous card, so it doesn't show while loading next card (if not prefetched)
    this.destroyCurCard();

    // all cards done?
    if (this.position >= this.items.length) {
      this.endReview();
      return;
    }

    // wait for card data
    this.connect("onWaitCache", this.cardReady, this);

    this.sendReceive();

    // clear backwards cache
    this.cleanCache();

    // if card is already prefetched, handle it!
    if (this.cacheEnd >= this.position) {
      this.cardReady();
    }
  }

  /**
   * Undo (go backwards)
   *
   * To allow undo we always keep a number of answers in the postCache (max_undo).
   * When sendReceive() does a prefetch, only the answers that are before max_undo items
   * backwards are posted. Only at the end of the review are the last answers in the
   * "ungo range" flushed out to the server.
   *
   */
  backward() {
    // assertion
    if (this.undoLevel >= this.max_undo) {
      throw new Error("FlashcardReview::backward() undoLevel >= max_undo");
    }

    if (this.position <= 0) {
      return;
    }

    // assertion
    if (this.cacheStart >= this.position) {
      throw new Error("FlashcardReview::backward() on empty cache");
    }

    this.destroyCurCard();
    this.undoLevel++;

    // go back one step and clear postCache at that position
    this.position--;

    // clear the last flashcard answer from the postCache
    if (this.options.put_request) {
      this.notify("onFlashcardUndo", this.unanswerCard());
    }

    this.cardReady();
  }

  /**
   * This function is called only when the current flashcard
   * data is available in the cache.
   */
  cardReady() {
    // clear event
    this.disconnect("onWaitCache");

    // notify BEFORE flashcard is created
    this.notify("onFlashcardCreate");

    // we have a cached item for current position
    var oItem = this.getFlashcardData();

    // (wip, refactor) instance Vue comp
    const propsData = {
      cardData: oItem,
      reviewMode: kk_globals_get("REVIEW_MODE"),
    };

    let { vm, unmount } = VueInstance(KoohiiFlashcard, "#uiFcMain", propsData);
    this.curCard = vm;
    this.curCardUnmount = unmount;

    // notifies 'onFlashcardState'
    this.setFlashcardState(0);

    this.curCard.display(true);
  }

  /**
   * Clears current flashcard, so that it disappears
   * until the next one is ready.
   */
  destroyCurCard() {
    if (this.curCard) {
      this.notify("onFlashcardDestroy");

      this.curCardUnmount();
      this.curCard = null;
    }
  }

  /**
   * Check if there are cards to prefetch, and/or answers to post.
   *
   * @param boolean  bFlushData  At end of review, force flush all remaining items in postCache.
   */
  sendReceive(bFlushData) {
    var oJsonData = {};

    // any cards to fetch ?
    if (
      this.cacheEnd < this.items.length - 1 &&
      this.position >= this.prefetchPos
    ) {
      //
      if (this.cacheNext <= this.cacheEnd) {
        var from = this.cacheEnd + 1;
        var to = Math.min(from + this.num_prefetch, this.items.length) - 1;
        oJsonData.get = this.items.slice(from, to + 1);
        this.cacheNext = from;
      }
    }

    // post answers along with cards prefetching, or do it immediately if flushing
    // the postCache
    if (this.options.put_request && (oJsonData.get || bFlushData)) {
      // if flush, post all, otherwise don't post all, leave some cards behind to allow client ot re-answer (undo)
      var aPostData,
        i,
        numToPost = 0;

      if (bFlushData) {
        aPostData = this.postCache;
      } else {
        numToPost =
          this.getPostCount() > this.max_undo
            ? this.getPostCount() - this.max_undo
            : 0;
        aPostData = [];
        for (i = 0; i < numToPost; i++) {
          aPostData.push(this.postCache[i]);
        }
      }

      if (aPostData.length > 0) {
        //console.log('POSTING %d (%o)', numToPost, aPostData);
        oJsonData.put = aPostData;
      }

      //simulate a timeout
      //if (bFlushData && !this.foo ) { this.foo=true; oJsonData.flush = 1; console.log('doing it'); }
    }

    console.log("FlashcardReview::sendReceive(%o)...", oJsonData);

    if (oJsonData.get || oJsonData.put) {
      if (oJsonData.get && this.options.params) {
        // pass the flashcard options, if provided
        oJsonData.opt = this.options.params;
      }

      this.ajaxQueue.add(this.options.ajax_url, {
        method: "post",
        json: oJsonData,
        argument: bFlushData ? "end" : this.cacheNext,
      });
      this.ajaxQueue.start();

      return true;
    }

    return false;
  }

  /**
   * AjaxQueue success callback (HTTP 200 only).
   *
   * Cache items returned by the server,
   * determine next position to start prefetch based on how many items were received.
   *
   * @param {Object} o    The YUI Connect object (extended by AjaxRequest)
   * @param {Number} argument        Index value if prefetching, 'end' if completing review
   */
  onAjaxSuccess(o, argument) {
    var i,
      oJson = o.responseJSON;

    console.log("FlashcardReview::onAjaxSuccess(%o)", o);

    if (oJson) {
      // cache cards if any
      if (oJson.get && oJson.get.length > 0) {
        // assertion
        console.assert(
          argument === this.cacheNext,
          "onAjaxSuccess(): this.cacheNext inconsistency"
        );

        // add cards to cache
        this.cacheEnd = this.cacheNext + oJson.get.length - 1;

        // next prefetch at based on number of items received
        this.prefetchPos =
          this.cacheNext + Math.floor(oJson.get.length / 2) + 1;

        // cache items
        for (i = 0; i < oJson.get.length; i++) {
          this.cacheItem(oJson.get[i]);
        }

        this.notify("onWaitCache");
      }

      // clear answers from cache, that were handled succesfully by the server
      if (oJson.put && oJson.put.length > 0) {
        // clear items from the postCache that were succesfully handled
        //console.log("RESPONSE PUT, CLEAR %o", oJson.put);

        for (i = 0; i < oJson.put.length; i++) {
          var id = oJson.put[i];
          this.removePostData(id);
        }

        this.updateUnloadEvent();
      }

      // completing review
      if (argument === "end") {
        this.notify("onEndReview");
      }
    }
  }

  cacheItem(oItem) {
    this.cache[oItem.id] = oItem;
  }

  /**
   * Clear flashcard display data for items behind, to free some
   * resources, we only need as much flashcard data behind as needed
   * for undo.
   *
   */
  cleanCache() {
    while (this.cacheStart < this.position - this.max_undo) {
      var id = this.items[this.cacheStart];
      delete this.cache[id];
      this.cacheStart++;
    }
  }

  /**
   * Getters
   */
  getOption(sName) {
    return this.options[sName];
  }

  getPosition() {
    return this.position;
  }

  getFlashcard() {
    return this.curCard;
  }

  /** @return {number | null} */
  getFlashcardData() {
    var id = this.items[this.position];
    return id ? this.cache[id] : null;
  }

  /**
   * Count numner of items in postCache.
   */
  getPostCount() {
    return this.postCache.length;
  }

  getNumUndos() {
    return Math.min(this.position, this.max_undo - this.undoLevel);
  }

  getItems() {
    return this.items;
  }

  setFlashcardState(iState) {
    if (this.curCard) {
      this.curCard.setState(iState);
    }

    this.notify("onFlashcardState", iState);
  }

  getFlashcardState() {
    return this.curCard ? this.curCard.getState() : false;
  }

  /**
   * Register a shortcut key for an action id. Pressing the given key
   * will notify 'onAction' with the given action id. Lowercase letters will match
   * the uppercase letter.
   *
   * @param {String} sKey  Shortcut key, should be lowercase, or ' ' for spacebar
   * @param {String} sActionId  Id passed to the 'onAction' event when key is pressed
   */
  addShortcutKey(sKey, sActionId) {
    if (!this.eventDispatcher.hasListeners("onAction")) {
      console.warn(
        'FlashcardReview::addShortcutKey() Adding shortcut key without "onAction" listener'
      );
    }

    this.oKeyboard.addListener(sKey, (event) => {
      this.notify("onAction", sActionId, event);
    });
  }

  /**
   * Store answer and any other custom data for the current card,
   * to be posted on subsequent ajax requests.
   *
   */
  answerCard(oData) {
    // console.log('FlashcardReview::answerCard(%o)', oData);
    this.postCache.push(oData);

    this.updateUnloadEvent();
  }

  /**
   * Cleans up the answer of current flashcard (when going backwards).
   *
   * Must remove item from postCache otherwise when flushing at end of review,
   * the last undo'ed item(s) would be posted whereas the user did not want to.
   *
   * @return  {Object}   Returns flashcard answer data (cf. answerCard()) that is being cleared
   */
  unanswerCard() {
    // console.log('FlashcardReview::unanswerCard()');
    var id, oData;

    if (this.getPostCount() <= 0) {
      throw new Error();
    }

    // pop data from the postcache, don't assume order
    id = this.items[this.position];
    oData = this.removePostData(id);

    this.updateUnloadEvent();

    return oData;
  }

  /**
   * Remove one element of the postCache array, by id.
   *
   * @return {Object}  Returns the spliced element (flashcard answer data).
   */
  removePostData(id) {
    var i;
    for (i = 0; i < this.postCache.length; i++) {
      // watchout with === because returned json can have strings for numbers
      if (this.postCache[i].id === id) {
        var popped = this.postCache.splice(i, 1);

        // return the 'popped' element
        return popped[0];
      }
    }
  }
}

export default FlashcardReview;
