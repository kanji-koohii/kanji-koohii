<template>

  <div class="fc-vshuffle"> 

    <cjk-lang-ja class-name="ta-c dispword" :html="cardData.dispword"></cjk-lang-ja>
    <cjk-lang-ja class-name="ta-c reading">{{ cardData.reading }}</cjk-lang-ja>
    <div class="ta-c glossary">{{ cardData.glossary }}</div>

  </div>

</template>

<script>
import { defineComponent } from "vue";

import CjkLangJa from './CjkLangJa.vue'

export default defineComponent({

  name: 'KoohiiFlashcardVocabShuffle',

  components: {
    CjkLangJa
  },

  data() {
    return {
    }
  },

  computed: {
    // reviewMode() {
    //   // console.log('get reviewMode()')
    //   return this.$parent.reviewMode;
    // },

    cardData() {
      // console.log('get cardData()')
      return this.$parent.cardData;
    }
  },

  methods: {
    //     
  }
});
</script>

<style>

/* =============================== */
/* refactor of Vocab Shuffle bundle, affects elements rom the php template, put here for now */ 
/* =============================== */

/* side buttons */
.fr-mode-vshuffle .uiFcStats .uiIBtn { text-align:center; font-weight:normal; margin:0 0 0.5em; }
.fr-mode-vshuffle .uiFcStats .uiIBtn span { font-size:14px; font-weight:normal; }

/* "Continue" button */
#uiFcBtnAC { width:100%; background:#6fa300;
  background: -webkit-linear-gradient(top,  #6fa300 0%,#649300 100%);
  background: linear-gradient(to bottom,  #6fa300 0%,#649300 100%); }



/* =============================== */
/* component styles */
/* =============================== */
.fc-vshuffle .ta-c { text-align: center; }

.fc-vshuffle .dispword { display:block; font-size:80px; line-height:1em; padding:50px 0 40px; }
.fc-vshuffle .dispword a { color:#0065b2; text-decoration:none; }
.fc-vshuffle .dispword a:hover { background:#eee; color:#000; }
.fc-vshuffle .reading  { display:block; font-size:27px; color:#0064b2; }
.fc-vshuffle .glossary { font:18px/1.2em Arial, sans-serif; color:#666; padding:40px 1em 0; }

/* states */
.uiFcState-0 .fc-vshuffle .reading   { visibility:hidden; }
.uiFcState-0 .fc-vshuffle .glossary  { visibility:hidden; color:#fff; }

.uiFcState-1 .fc-vshuffle .reading   { visibility:visible; }
.uiFcState-1 .fc-vshuffle .glossary  { visibility:visible; }

/* MOBILE small screens */
@media screen and (max-width:700px) {

  /* reduce font size otherwise gloss overlaps buttons below flashcard */
  .fc-vshuffle .dispword { font-size:50px; padding-bottom:30px; }
  .fc-vshuffle .glossary { font-size:17px; padding-top:30px; }
}

</style>
