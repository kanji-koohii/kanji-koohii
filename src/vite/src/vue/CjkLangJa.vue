<template>
  <span class="cj-k" :class="className" lang="ja" xml:lang="ja">
    <span v-if="html" v-html="html"></span>
    <slot v-else></slot>
  </span>
</template>

<script lang="ts">
/* 
  Refactored cjk_lang_ja() php helper.

  PROPERTIES

    className     (OPTIONAL) One or more css classnames
    html          (OPTIONAL) Use v-html instead of slot content


  USAGE

    <cjk-lang-ja className="css-class" html="<em>foo</em>"></cjk-lang-ja>

    or

    <cjk-lang-ja className="css-class">{{ content }}</cjk-lang-ja> 

*/
import { defineComponent } from "vue";

export default defineComponent({
  name: "CjkLangJa",

  props: {
    className: { type: String, default: "" },
    html: { type: String, default: "" },
  },
});
</script>
