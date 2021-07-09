/**
 * Labs "alpha" (experimental features) -- Simple random test of vocabulary
 * 
 */

import $$, { domGet } from "@lib/dom";
import FlashcardReview from "@old/components/FlashcardReview";

  var Y = YAHOO,
      Dom = Y.util.Dom;

  App.LabsReview = 
  {
    initialize: function(options)
    {
      // set options
      this.options = options;
      
      options.fcr_options.events =
      {
        'onBeginReview':     this.onBeginReview,
        'onEndReview':       this.onEndReview,
        'onFlashcardCreate': this.onFlashcardCreate,
        'onFlashcardDestroy':this.onFlashcardDestroy,
        'onFlashcardState':  this.onFlashcardState,
        'onAction':          this.onAction,
        'scope':             this
      };

      this.oReview = new FlashcardReview(options.fcr_options);
      
      this.oReview.addShortcutKey('f', 'flip');
      this.oReview.addShortcutKey(' ', 'flip');
      this.oReview.addShortcutKey('b', 'back');

      // stats panel
      this.elStats = domGet('uiFcStats');
      this.elsCount = $$('#uiFcProgressBar .count'); //array
      this.elProgressBar = $$('#review-progress span')[0];
    },
    
    /**
     * Returns an option value
     * 
     * @param  String   Option name
     */
    getOption: function(name)
    {
      return this.options[name];
    },
    
    onBeginReview: function()
    {
      //console.log('labsReview.onBeginReview()');
    },

    /**
     * Update the visible stats to the latest server hit,
     * and setup form data for redirection to the Review Summary page.
     * 
     */
    onEndReview: function()
    {
      //console.log('labsReview.onEndReview()');
      window.location.href = this.options.back_url;
    },

    onFlashcardCreate: function()
    {
      console.log('labsReview.onFlashcardCreate()');

      // Show panels when first card is loaded
      if (this.oReview.getPosition() === 0)
      {
        this.elStats.style.display = 'block';
      }

      // Show undo action if available
      $$('#JsBtnBack').toggle(this.oReview.getPosition() > 0);

      this.updateStatsPanel();

      // set the google search url
      var searchTerm = this.oReview.getFlashcardData().compound;
      var searchUrl = 'http://www.google.co.jp/search?hl=ja&q=' + encodeURIComponent(searchTerm);
      domGet('search-google-jp').href = searchUrl;
    },

    /**
     * Hide buttons until next card shows up.
     * 
     */
    onFlashcardDestroy: function()
    {
      $$('#uiFcButtons0').toggle(false);
      $$('#uiFcButtons1').toggle(false);
    },

    onFlashcardState: function(iState)
    {
      $$('#uiFcButtons0').toggle(iState === 0);
      $$('#uiFcButtons1').toggle(iState !== 0);
    },

    onAction: function(sActionId, oEvent)
    {
      var cardAnswer = false;

      console.log('App.LabsReview.onAction(%o)', arguments);

      // flashcard is loading or something..
      if (!this.oReview.getFlashcard())
      {
        return false;
      }

      switch (sActionId)
      {
        case 'back':
          if (this.oReview.getPosition() > 0)
          {
            this.oReview.backward();
          }
          break;
        
        case 'flip':
          if (this.oReview.getFlashcardState() === 0)
          {
            this.oReview.setFlashcardState(1);
          }
          else
          {
            this.oReview.forward();
          }
          break;

        case 'search-google-jp':
          break;
      }

      return false;
    },

    updateStatsPanel: function()
    {
    //  console.log('labsReview.updateStatsPanel()');
      var items = this.oReview.getItems(),
      num_items = items.length,
      position  = this.oReview.getPosition();
      
      // update review count
      this.elsCount[0].innerHTML = Math.min(position + 1, num_items);
      this.elsCount[1].innerHTML = num_items;
      
      // update progress bar
      var pct = position > 0 ? Math.ceil(position * 100 / num_items) : 0;
      pct = Math.min(pct, 100);
      this.elProgressBar.style.width = (pct > 0 ? pct : 0) + '%';
    },

    /**
     * Sets buttons (children of element) to default state, or disabled state
     * 
     */
    setButtonState: function(elParent, bEnabled)
    {
      $$('.uiIBtn', elParent).each(el => {
        el.classList.toggle('uiFcBtnDisabled', bEnabled);
      })
    }
  };



