<template>
  <span
    :class="[
      'kk-charsleft',
      { 'kk-charsleft--invalid': isTooLong },
      { 'kk-charsleft--warning': isWarning },
    ]"
    >{{ charsLeft }}</span
  >
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "KoohiiCharsLeft",

  props: {
    text: { type: String, required: true },
    maxLength: { type: Number, required: true },
    warningLimit: { type: Number, default: 0 }, // 0 means "no warning"
  },

  data() {
    return {};
  },

  computed: {
    charsLeft(): number {
      return this.maxLength - this.text.length;
    },

    isTooLong(): boolean {
      return this.charsLeft < 0;
    },

    isWarning(): boolean {
      return (
        this.warningLimit !== 0 &&
        this.charsLeft >= 0 &&
        this.charsLeft <= this.warningLimit
      );
    },
  },
});
</script>

<style>
/* KoohiiCharsLeft styles */

.kk-charsleft {
  display: inline-block;
  padding: 1px 4px;
  border-radius: 3px;
  color: #b7b7b7;
}
.kk-charsleft--invalid {
  background-color: #ff7876;
  color: #fff;
  font-weight: bold;
}
.kk-charsleft--warning {
  color: #ff7876;
  font-weight: bold;
}
</style>
