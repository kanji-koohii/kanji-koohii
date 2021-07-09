<template>
  <div>
    <div ref="refLoadingMask" class="dict-panel">
      <template v-if="isLoading">
        <div style="min-height: 100px"></div>
      </template>
      <template v-else-if="items.length">
        <div class="dict-list">
          <template v-for="$item in items" :key="$item.id">
            <div
              :class="['dl_item', { 'dl_item--pick': $item.pick }]"
              @click="onVocabPick($item)"
            >
              <div class="dl_t">
                <div v-if="isKanjiReview" class="dl_t_menu">
                  <i v-if="$item.pick === true" class="fa fa-star"></i>
                  <i v-else class="far fa-star"></i>
                </div>

                <cjk-lang-ja
                  class-name="c vocab_c"
                  :html="$item.c"
                  :class="{ known: $item.known }"
                ></cjk-lang-ja>
                <cjk-lang-ja
                  class-name="r vocab_r"
                  :html="$item.fr"
                ></cjk-lang-ja>
              </div>
              <div class="dl_d">
                {{ $item.g }}
              </div>

              <div if="isMenu"> </div>
            </div>
          </template>
        </div>
      </template>
      <template v-else class="dict-list_info">
        <!-- items.length === 0 -->
        <p>There are no common words using this character.</p>
      </template>
    </div>

    <!-- (legacy code) "Close" button for mobile portait will be handled by KoohiiDialog if/when we implement that -->
    <div v-if="isMobile" class="uiBMenu">
      <div class="uiBMenuItem">
        <a class="uiFcBtnGreen JSDialogHide uiIBtn uiIBtnDefault" href="#"
          ><span>Close</span></a
        >
      </div>
    </div>
  </div>
</template>

<script lang="ts">
/**
 * The dictionary list as seen in Study pages, and dictionary lookup in flashcard reviews.
 *
 * In the future, this list may allow to toggle bookmarking any individual entry, creating
 * a list of vocabulary for the user.
 *
 */
import { defineComponent } from "vue";
import { DictId, DictListEntry, GetDictListForUCS } from "@app/api/models";
import { getApi } from "@app/api/api";
import { kkFormatReading } from "@lib/format";

import CjkLangJa from "@/vue/CjkLangJa.vue";
import KoohiiLoading from "@/vue/KoohiiLoading";

// our simple regexp matching needs this so that vocab with okurigana is considered known
const HIRAGANA =
  "ぁあぃいぅうぇえぉおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろゎわゐゑをんゔゕゖ ゙ ゚゛゜ゝゞゟ";
const KATAKANA =
  "゠ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヰヱヲンヴヵヶヷヸヹヺ・ーヽヾヿ";
const PUNCTUATION =
  "｟｠｡｢｣､･ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝﾞ";

// cf. rtkLabs.php (this will go into an include)
/*
const PRI_ICHI1 = 0X80
const PRI_NEWS1 = 0X40
const PRI_NEWS2 = 0X20
const PRI_ICHI2 = 0X10
const PRI_SPEC1 = 8
const PRI_SPEC2 = 4
const PRI_GAI1  = 2
const PRI_GAI2  = 1
*/

export default defineComponent({
  name: "KoohiiDictList",

  components: {
    CjkLangJa,
  },

  data() {
    return {
      isLoading: true,

      /**
       * Array of dict entries as obtained from dict lookup cache.
       *
       *   DictEntry
       *
       *     (...see data/scripts/dict/dict_gen_cache.php ...)
       *
       *     pick:       {boolean}    user selected this item
       *     known       {boolean}    contains only known kanji
       *
       */
      items: [] as DictListEntry[],

      // kanji which corresponds to the last retrieved example words (cf load())
      ucsId: 0,

      // whether we have already requested them from server
      isSetKnownKanji: false,

      // a string containing all kanji known by the user
      knownKanji: "",
    };
  },

  computed: {
    KanjiReview(): AppKanjiReview | undefined {
      return window.Koohii.Refs.KanjiReview;
    },

    isKanjiReview(): boolean {
      return !!this.KanjiReview;
    },

    isMobile(): boolean {
      // (legacy code) cf. lib/front/corejs/ui/mobile.js
      return window.innerWidth <= 720;
    },
  },

  created() {
    console.log("KoohiiDictList::created(%o)", this.items);
    this.items;
    this.isLoading = true;
  },

  beforeUnmount() {
    console.log("KoohiiDictList::beforeUnmount()");
  },

  methods: {
    // ! CAN NOT be computed because the dictionary is instanced *once*, while flashcard comp is recreated
    //
    // @return {object} the KoohiiFlashcardKanji Vue instance, or false if not available (eg. Study page)
    getKanjiCard() {
      if (!this.isKanjiReview) {
        return false;
      }
      let vmFlashcard = this.KanjiReview!.oReview.getFlashcard();
      let inst = vmFlashcard.getChild();
      return inst;
    },

    onVocabPick(item: DictListEntry) {
      // console.log('onVocabPick "%s"', item.c)

      if (!this.isKanjiReview) {
        return;
      }

      // add
      if (item.pick !== true) {
        KoohiiLoading.show({
          target: this.$refs.refLoadingMask as HTMLElement,
        });

        getApi().legacy.setVocabForCard(this.ucsId, item.id).then((tron) => {
          KoohiiLoading.hide();
          // success:  show vocab onto the flashcard, and close the dictionary
          tron.isSuccess() && this.onVocabPickResponse(item);
        });
      }
      // remove
      else {
        KoohiiLoading.show({
          target: this.$refs.refLoadingMask as HTMLElement,
        });

        getApi().legacy.deleteVocabForCard(this.ucsId).then((tron) => {
          KoohiiLoading.hide();
          tron.isSuccess() && this.onVocabDeleteResponse(item);
        });
      }
    },

    onVocabDeleteResponse(item: DictListEntry) {
      item.pick = false;
      this.getKanjiCard().removeVocab(item);
      this.isKanjiReview && this.KanjiReview!.toggleDictDialog();
    },

    /**
     * @param item  One of this.items[] which was clicked
     */
    onVocabPickResponse(item: DictListEntry) {
      // sets highlighted entry
      this.items.forEach((o) => {
        o.pick = false;
      });
      item.pick = true;

      const VocabPick = {
        compound: item.c,
        reading: item.r,
        gloss: item.g,
      };
      this.getKanjiCard().setVocab(VocabPick);

      this.isKanjiReview && this.KanjiReview!.toggleDictDialog();
    },

    load(ucsId: number) {
      this.isLoading = true;

      const doLoad = () => {
        KoohiiLoading.show({
          target: this.$refs.refLoadingMask as HTMLElement,
        });

        // getKnownKanji:
        //
        //   We request these only once for the lifetime of the component. This is more
        //   efficient in the flashcard review page.
        //
        //   The user's known kanji could realistically be 2000 to 3000 utf8 characters. So
        //   even though they are also cached in php session, it's better to avoid returning
        //   several KBs of data with each dictionary lookup request

        getApi().legacy
          .getDictListForUCS(ucsId, true !== this.isSetKnownKanji)
          .then((tron) => {
            KoohiiLoading.hide();
            tron.isSuccess() && this.onDictLoadResponse(ucsId, tron.getProps());
          });
      };

      this.$nextTick(doLoad);
    },

    onDictLoadResponse(ucsId: number, props: GetDictListForUCS) {
      console.log("onDictLoadResponse(%o)", props);

      this.ucsId = ucsId;

      if (props.knownKanji) {
        this.knownKanji = props.knownKanji;
        this.isSetKnownKanji = true;
      }

      let items = this.setKnownItems(props.items, this.knownKanji);

      this.formatDictEntryArray(items);
      this.applyVocabPicks(items, props.picks);

      this.items = items;

      this.isLoading = false;
    },

    setKnownItems(items: DictListEntry[], knownKanji: string): DictListEntry[] {
      // if (this.knownKanji !== '') {
      //   console.log(' knownKanji : ' + this.knownKanji)
      // }
      const KNOWN_KANJI = knownKanji + HIRAGANA + KATAKANA + PUNCTUATION;

      // a basic string search could be faster - it's a very small list though
      const regexp = new RegExp("^[" + KNOWN_KANJI + "]+$");
      items.forEach((item) => {
        item.known = regexp.test(item.c);
      });

      // sort known vocab first
      let knownItems = items.filter((o) => o.known === true);
      let unkownItems = items.filter((o) => o.known === false);
      let sortedItems = knownItems.concat(unkownItems);

      return sortedItems;
    },

    // assign a "formatted reading" for display, keep DictEntry's reading
    formatDictEntryArray(items: DictListEntry[]) {
      items.forEach((o) => {
        o.fr = kkFormatReading(o.r);
      });
    },

    // set selected state, where 'picks' is an array of dictid's
    applyVocabPicks(items: DictListEntry[], picks: DictId[]) {
      items.forEach((o) => {
        o.pick = picks.includes(o.id);
      });
    },

    // sortSelectedItems(items)
    // {
    //   let picks = items.filter(o => o.pick === true)
    //   let other = items.filter(o => o.pick !== true)  // undefined
    //   return picks.concat(other)
    // }
  },
});
</script>

<style>
/* Dictionary Lookup Component */

.dict-panel {
  background: #fff;
  max-height: 80vh;
  overflow-y: auto;
}

.dict-list {
  margin: 0;
  background: #444;
}

.dict-list .dl_item {
  background: #fff;
  border-bottom: 1px solid #eee;
  position: relative;
}
.dict-list .dl_item:hover {
  background: #eee;
  cursor: pointer;
}
.dict-list .dl_item:hover .vocab_c {
  background: #fff;
}

.dict-list .dl_item--pick {
}

.dict-list .dl_item .cj-k {
  line-height: 1em;
}

.dict-list .dl_t {
  padding: 12px 15px;
  font-weight: normal;
  font-size: 26px;
}
.dict-list .dl_t .c {
  font-size: 1em;
  padding: 5px 8px 3px;
}
.dict-list .dl_t .r {
  font-size: 0.8em;
  padding: 0;
  display: inline-block;
  margin: 0 0 0 1em;
  color: #543;
}

.dict-list .dl_t_menu {
  position: absolute;
  right: 10px;
  top: 15px;
  font-size: 20px;
  color: #ccc;
}
.dict-list .dl_item:hover .dl_t_menu {
  color: #888;
}

/* picked item */
.dict-list .dl_item--pick .dl_t_menu,
.dict-list .dl_item--pick:hover .dl_t_menu {
  color: #e2b437;
}

/* "known" word (contains known kanji) */
.dict-list .dl_t .known,
.dict-list .dl_item:hover .known {
  background: #e6f2cd;
  color: #206717;
}

.dict-list .dl_d {
  padding: 0 20px 1em;
  font: 14px/1.3em Arial, sans-serif;
  color: #444;
}

/* message when no words are found */
.dict-list_info {
  padding: 1em 20px 1px;
  color: #838279;
  background: #fff;
}

/* desktop & wider screens */
@media screen and (min-width: 701px) {
  /* Review page only: fix the width inside the dialog from getting too wide */
  .yui-panel .dict-panel {
    width: 400px;
  }
}

/* ===================================================== */
/* Visual formatting shared by DictList & FlashcardKanji */
/* ===================================================== */

/* box-ing the compound for separation */
.vocab_c {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 8px;
  background: #efeeed;
  color: #210;
}

/* the <em> surrounding tags originate in KoohiiFormat mixin, used by DictEntry.r and VocabPick.reading */
.vocab_r em {
  border-bottom: 2px solid #ff4e4e; /*color:#ff4e4e;*/
  font-style: normal;
}
</style>
