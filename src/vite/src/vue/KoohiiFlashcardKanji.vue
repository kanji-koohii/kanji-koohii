<template>
  <div
    :class="{
      'fc-kanji': true,
      'with-yomi': hasVocab,
    }"
  >
    <template v-if="!reviewMode.freemode">
      <a
        id="uiFcMenu"
        href="#"
        title="Edit Flashcard"
        class="uiGUI uiFcAction"
        data-action="fcmenu"
        :data-uri="reviewMode.fc_edit_uri"
        :data-param="reviewMode.fc_edit_params"
        ><i class="fa fa-bars"></i
      ></a>
    </template>

    <div class="d-keyword" v-html="cardData.keyword"></div>

    <div class="d-strokec" title="Stroke count">
      <cjk-lang-ja html="&#30011;&#25968;" class-name="kanji"></cjk-lang-ja
      ><span>{{ cardData.strokecount }}</span>
    </div>

    <div class="d-framenr" v-html="cardData.framenum"></div>

    <!-- inner content -->
    <div class="uiFcInner">
      <template v-if="!hasVocab">
        <div class="uiFcHalf d-kanji">
          <!-- do this for now, until we position everything dynamically -->
          <div class="tb">
            <div class="td">
              <cjk-lang-ja :html="cardData.kanji"></cjk-lang-ja>
            </div>
          </div>
        </div>
      </template>
      <template v-if="hasVocab">
        <!-- k-note :: force Vue to refresh -- fixes a flex reflow issue (#149) -->
        <div class="uiFcHalf d-kanji" k-note="fix-reflow">
          <div class="tb">
            <div class="td">
              <cjk-lang-ja :html="cardData.kanji"></cjk-lang-ja>
            </div>
          </div>
        </div>

        <div class="uiFcHalf d-yomi">
          <div class="d-yomi_pad">
            <transition name="uiFcYomi-fadein" appear>
              <div>
                <div
                  v-for="$item in vocab"
                  :key="$item.dictid"
                  class="uiFcYomi"
                  @click.stop="onVocabClick"
                >
                  <div>
                    <cjk-lang-ja
                      class-name="vyc vocab_c"
                      :html="formatCompound($item.compound)"
                    ></cjk-lang-ja>
                    <cjk-lang-ja
                      class-name="vyr vocab_r"
                      :html="formatReading($item.reading)"
                    ></cjk-lang-ja>
                  </div>
                  <div class="vyg">{{ $item.gloss }}</div>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import CjkLangJa from "@/vue/CjkLangJa.vue";
import { kkFormatReading } from "@lib/format";

export default defineComponent({
  name: "KoohiiFlashcardKanji",

  components: {
    CjkLangJa,
  },

  data() {
    return {
      /**
       * Array of VocabPick   (a subset of DictEntry's structure, as used on the flashcard)
       *
       *   compound    "欠如"
       *   reading     "けつ(じょ)"
       *   gloss
       *
       */
      vocab: [],
    };
  },

  computed: {
    reviewMode() {
      // console.log('get reviewMode()')
      return this.$parent.reviewMode;
    },

    cardData() {
      // console.log('get cardData()')
      return this.$parent.cardData;
    },

    hasVocab() {
      return this.vocab.length > 0;
    },
  },

  beforeMount() {
    // console.log('KoohiiFlashcardKanji::beforeMount()')

    let VocabPickArray = this.cardData.vocab || [];

    // VocabPickArray.forEach((o) => { o.r =  })

    // assign the card's DictEntryArray
    this.vocab = VocabPickArray;
  },

  methods: {
    onVocabClick() {
      // console.log('onVocabClick()')
      Koohii.Refs.KanjiReview.toggleDictDialog();
    },

    // @param {object} DictEntry    { compound, reading, gloss }, cf. rtkLabs.php
    setVocab(DictEntry) {
      // console.log('setVocab(%o)', DictEntry)
      const item = DictEntry;

      // do it this way so the "enter" transition plays again when changing an existing item
      this.clearVocab();
      this.$nextTick(() => {
        this.vocab.push(item);
        this.updateSourceCard(this.vocab);
      });
    },

    removeVocab(item) {
      // console.log('removeVocab(%o)', item)
      this.clearVocab();
      this.updateSourceCard(this.vocab);
    },

    clearVocab() {
      this.vocab.splice(0);
    },

    // update the source, so going backward with "Undo" is consistent with any changes
    updateSourceCard(DictEntryArray) {
      this.cardData.vocab = DictEntryArray;
    },

    // format compound depending on card side
    formatCompound(str) {
      const isFront = this.$parent.getState() === 0;
      const kanji = this.cardData.kanji;

      console.log("formatCompound %s %s %o", str, kanji, isFront);

      if (isFront) {
        str = str.replace(
          kanji,
          '<span class="cloze"><u>' + kanji + "</u></span>"
        );
      }

      return str;
    },

    /**
     * @param {string} kana
     * @returns string
     */
    formatReading(kana) {
      return kkFormatReading(kana);
    },
  },
});
</script>
