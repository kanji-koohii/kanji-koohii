<template>
  <div
    v-if="isDisplayed"
    :style="{ height: cardHeight + 'px' }"
    class="uiFcCard uiFcAction"
    :class="{
      'is-reverse': reviewMode.fc_reverse,
      'uiFcState-0': fcState === 0,
      'uiFcState-1': fcState === 1,
    }"
    data-action="flip"
  >
    <component :is="currentView" ref="card">
      <!-- component changes when vm.currentView changes! -->
    </component>
  </div>
</template>

<script>
import { defineComponent } from "vue";

import KoohiiFlashcardKanji from "@/vue/KoohiiFlashcardKanji.vue";
import KoohiiFlashcardVocabShuffle from "@/vue/KoohiiFlashcardVocabShuffle.vue";

export default defineComponent({
  name: "KoohiiFlashcard",

  components: {
    // reviewMode.fc_view => Vue template
    kanji: KoohiiFlashcardKanji,
    vocabshuffle: KoohiiFlashcardVocabShuffle,
  },

  props: {
    //
    cardData: { type: Object, required: true },

    // cf. _ReviewKanji.php
    reviewMode: { type: Object, required: true },
  },

  data() {
    return {
      currentView: KoohiiFlashcardKanji,

      resizedCard: false,

      cardHeight: "auto",

      fcState: 0,

      isDisplayed: { type: Boolean, default: false },
    };
  },

  // life cycle events

  beforeUnmount() {
    // console.log('KoohiiFlashcard::beforeUnmount()');
  },

  beforeMount() {
    // console.log('KoohiiFlashcard::beforeMount(%o)', this.cardData);
  },

  created() {
    // console.log('KoohiiFlashcard::created(%o)', this.cardData);

    // handle flashcard layout & interactivity as a child component according to review mode
    this.currentView = this.reviewMode.fc_view;
  },

  methods: {
    setState(iState) {
      // console.log('setState(%i)', iState);
      this.fcState = iState;
    },

    getState() {
      return this.fcState;
    },

    getChild() {
      return this.$refs.card;
    },

    display(bDisplay) {
      // console.log('KoohiiFlashcard::display(%o)', bDisplay);

      // mobile view support
      if (window.innerWidth <= 700) {
        if (!this.resizedCard) {
          this.resizedCard = 0;
        }

        if (bDisplay) {
          var wh = window.innerHeight; //document.documentElement.
          if (parseInt(wh)) {
            var cardh = wh - (43 + 37 + 67);
            if (cardh > 150) {
              this.resizedCard = cardh;

              this.cardHeight = cardh;
              // console.log("@@@ resized card to "+cardh);
            }
          }
        }
      }

      this.isDisplayed = bDisplay;
    },
  },
});
</script>
