<template>
  <div class="min-h-[100px] bg-[#ccc]">
    <form name="EditStory" method="post" action="/study/kanji/1">
      <!-- we still need this for the "Add to learned list" submit which is NOT ajax -->
      <input v-model="kanjiData.ucs_id" type="hidden" name="ucs_code" />

      <div id="my-story" lang="ja">
        <div ref="maskArea" class="padding rtkframe">
          <!-- left -->
          <div class="left">
            <div class="framenum" title="Frame number">{{
              kanjiData.framenum
            }}</div>

            <div :class="{ kanji: true, onhover: isReviewMode }">
              <cjk-lang-ja>{{ kanjiData.kanji }}</cjk-lang-ja>
            </div>

            <div class="strokecount" title="Stroke count"
              >[{{ kanjiData.strokecount }}]<br />
              <span class="text-[120%]"
                ><cjk-lang-ja>{{ kanjiData.onyomi }}</cjk-lang-ja></span
              >
            </div>
          </div>
          <!-- /left -->

          <!-- right -->
          <div class="right">
            <div class="keyword">
              <span
                class="JSEditKeyword"
                title="Click to edit the keyword"
                @click="onKeyword"
                >{{ displayKeyword }}</span
              >
            </div>

            <div id="storybox">
              <!-- view / edit story -->

              <div v-if="isEditing" id="storyedit">
                <div v-if="formHasErrors()" class="formerrormessage">
                  <span v-html="formGetErrors()"></span>
                </div>

                <textarea
                  id="frmStory"
                  v-model="postStoryEdit"
                  name="txtStory"
                ></textarea>

                <div class="flex justify-between items-center">
                  <div class="align-middle">
                    <input
                      id="storyedit_public"
                      v-model="postStoryPublic"
                      type="checkbox"
                      name="chkPublic"
                    />
                    <label for="storyedit_public" class="ml-2"
                      >Share this story</label
                    >
                  </div>
                  <div class="">
                    <koohii-chars-left
                      :text="postStoryEdit"
                      :max-length="512"
                      :warning-limit="20"
                    />
                    <input
                      type="button"
                      value="Save changes"
                      title="Save/Update story"
                      @click.prevent="onSubmit"
                    />
                    <input
                      type="button"
                      value="Cancel"
                      name="cancel"
                      title="Cancel changes"
                      @click="onCancel"
                    />
                  </div>
                </div>
              </div>

              <div v-else id="storyview">
                <div
                  id="sv-textarea"
                  class="bookstyle"
                  title="Click to edit your story"
                  @click="onEditStory"
                >
                  <template v-if="postStoryView.length">
                    <div v-html="postStoryView"></div>

                    <div v-if="isFavoriteStory" class="favstory">
                      <i class="fa fa-star"></i>You starred this story
                    </div>
                  </template>

                  <template v-else>
                    <div class="empty">[ click here to enter your story ]</div>
                  </template>
                </div>

                <template v-if="!isReviewMode">
                  <div
                    v-if="showLearnButton"
                    class="flex justify-end items-center mt-3"
                  >
                    <!-- handle via legacy code / page load -->
                    <input
                      type="submit"
                      name="doLearned"
                      value="Add to learned list"
                      class="btn btn-success"
                    />
                  </div>

                  <div
                    v-if="showLearnedMessage"
                    class="text-right text-[#61932b] pt-3"
                  >
                    This kanji is ready for review in the
                    <strong>learned</strong> list.
                  </div>
                </template>
              </div>
              <!-- /storyview -->
            </div>
            <!-- /storybox -->
          </div>
          <!-- /right -->
          <div class="clear"></div>
        </div>
        <!-- /rtkframe -->

        <div class="bottom"></div>
      </div>
      <!-- /#my-story -->
    </form>
  </div>
</template>

<script lang="ts">
// @xts-nocheck (need to fix "read-only props" shenanigans)
import { defineComponent, nextTick } from "vue";

import $$, { insertAfter, getNode } from "@lib/dom";
import { getApi } from "@app/api/api";
import { KanjiData, PostUserStoryResponse } from "@app/api/models";
import * as TRON from "@lib/tron";

import VueInstance from "@lib/helpers/vue-instance";

// legacy component (js, also used in "Edit Keywords" manage page)
import EditKeywordDialog from "@old/components/EditKeywordDialog";

// comps
import KoohiiCharsLeft from "@/vue/KoohiiCharsLeft.vue";
import CjkLangJa from "@/vue/CjkLangJa.vue";
import KoohiiSharedStory from "@/vue/KoohiiSharedStory.vue";
import KoohiiLoading from "@/vue/KoohiiLoading";

export default defineComponent({
  name: "KoohiiEditStory",

  components: {
    CjkLangJa,
    KoohiiCharsLeft,
  },

  props: {
    // See ./apps/koohii/modules/study/templates/editSuccess.php

    kanjiData: { type: Object as () => KanjiData, required: true },

    // user edted keyword, or null
    custKeyword: { type: String as () => string | null, default: null },

    // true if instanced from the Flashcard Review page (the "Edit Story" dialog)
    isReviewMode: { type: Boolean, default: false },

    // show a starred story in reviewmode when user's story is empty
    initFavoriteStory: { type: Boolean, default: false },

    // Study page only, "Add to learned list" functionality
    showLearnButton: { type: Boolean, default: false },
    showLearnedMessage: { type: Boolean, default: false },

    // ajax state
    initStoryView: { type: String, default: "" },
    initStoryEdit: { type: String, default: "" },
    initStoryPublic: { type: Boolean, default: false },
  },

  data() {
    return {
      // Edit Keyword dialog instance
      oEditKeyword: null as EditKeywordDialog | null,

      isEditing: false,

      isFavoriteStory: false,

      // holds instance of a KoohiiSharedStory component (visual feedback for sharing a story)
      vmStoryPublished: null,

      // keep a copy to cancel changes
      uneditedStory: "",

      formErrors: [] as string[],

      //
      postStoryView: "",
      postStoryEdit: "",
      postStoryPublic: false,
    };
  },

  computed: {
    displayKeyword(): string {
      return this.custKeyword || this.kanjiData.keyword;
    },

    editKeywordUrl(): string {
      return "/study/editkeyword/id/" + this.kanjiData.ucs_id;
    },
  },

  beforeUnmount() {
    // (legacy code) free resources/events used by Edit Keyword dialog
    if (this.oEditKeyword) {
      this.oEditKeyword.destroy();
      this.oEditKeyword = null;
    }
  },

  methods: {
    formGetErrors(): string {
      const errors = this.formErrors;
      return errors.length
        ? `<span>${errors.join("</span><span>")}</span>`
        : "";
    },

    formHasErrors() {
      return this.formErrors.length > 0;
    },

    formHandleResponse(tron: TRON.TronInst) {
      this.formErrors = tron.getErrors();
    },

    onEditStory() {
      this.editStory();
    },

    onSubmit() {
      KoohiiLoading.show({ target: this.$refs.maskArea as HTMLElement });

      getApi()
        .legacy.postUserStory(
          this.kanjiData.ucs_id,
          this.postStoryEdit,
          this.postStoryPublic,
          this.isReviewMode
        )
        .then((tron: TRON.TronInst<PostUserStoryResponse>) => {
          KoohiiLoading.hide();
          this.formHandleResponse(tron);
          if (!tron.hasErrors()) {
            this.onSaveStoryResponse(tron.getProps());
          }
        });
    },

    onSaveStoryResponse(props: PostUserStoryResponse) {
      // keep it simple for now, after a POST forget about the "starred story" thing
      this.isFavoriteStory = false;

      this.postStoryView = props.initStoryView;
      this.isEditing = false;

      // destroy previous instance if created
      if (this.vmStoryPublished) {
        this.vmStoryPublished = null;
      }

      //
      // update/add/remove a shared story dynamically
      //
      // delete story from page if already shared
      let $elSharedStory = $$("#" + props.sharedStoryId);
      if ($elSharedStory.el()) {
        let el = $elSharedStory.closest(".rtkframe")!;
        $$(el).remove();
      }

      if (!this.isReviewMode && props.isStoryShared) {
        // add the story in "new & updated"
        const elMount = document.createElement("div");
        insertAfter(elMount, getNode("#sharedstories-new .title")!);

        let propsData = {
          profileLink: props.sharedStoryAuthor,
          story: this.postStoryView.replace(/<br\/>/g, " "), // remove the line breaks
          divId: props.sharedStoryId,
        };

        let { vm } = VueInstance(
          KoohiiSharedStory,
          elMount,
          propsData
        ) as any;
        this.vmStoryPublished = vm;
      }
    },

    // currently called by SharedStoriesComponent.js ajax handler (after user clicked a "copy" button)
    onCopySharedStory(storyText: string) {
      if (this.isEditing) {
        window.alert(
          "Can not copy a story since you are currently editing a story."
        );
        return;
      }

      this.editStory(storyText);

      nextTick(function() {
        // $$('#main_container')[0].scrollIntoView(true)

        // scroll to top of window
        let dx =
          window.pageXOffset ||
          document.documentElement.scrollLeft ||
          document.body.scrollLeft ||
          0;
        window.scrollTo(dx, 0);
      });
    },

    onCancel() {
      this.doCancel();
    },

    doCancel() {
      this.postStoryEdit = this.uneditedStory;
      this.isEditing = false;
    },

    /**
     * Edit Story or Edit a copy of another user's story.
     *
     * @param {string} sCopyStory   The "copy" story feature will set this to the copied story text.
     */
    editStory(sCopyStory?: string) {
      this.uneditedStory = this.postStoryEdit;

      // edit a new story, cancel will restore the previous one
      if (sCopyStory) {
        this.postStoryEdit = sCopyStory;
        this.postStoryPublic = false; // default to private after copying a story
      }

      this.isEditing = true;

      // note:AFTER toggling isEditing,order is important!
      nextTick(() => {
        const elTextArea = $$<HTMLTextAreaElement>("#frmStory")[0];
        // DOM is now updated
        this.setCaretToEnd(elTextArea);
      });
    },

    // (legacy code) instance Edit Keyword dialog, not yet refactored to Vue
    onKeyword(event: Event) {
      const el = event.target as HTMLElement;
      // console.log('onKeyword() %o', el)

      // callback with the modified keyword
      const callback = (keyword: string) => {
        // console.log('onKeyword callback()')
        el.innerHTML = keyword;

        // invalidate cached dialog
        this.oEditKeyword && this.oEditKeyword.destroy();
        this.oEditKeyword = null;
      };

      if (!this.oEditKeyword) {
        const url = this.editKeywordUrl;
        const options = { context: ["my-story", "tr", "tr", null, [-6, 6]] };
        this.oEditKeyword = new EditKeywordDialog(url, options, callback);
      } else {
        this.oEditKeyword.show();
      }

      return false;
    },

    setCaretToEnd(element: HTMLInputElement | HTMLTextAreaElement) {
      element.focus();
      let length = element.value.length;
      element.setSelectionRange(length, length);
    },
  },

  created() {
    console.log("KoohiiEditStory::created()");

    this.isFavoriteStory = !!this.initFavoriteStory;

    this.postStoryView = this.initStoryView;
    this.postStoryEdit = this.initStoryEdit;
    this.postStoryPublic = this.initStoryPublic;
  },
});
</script>
