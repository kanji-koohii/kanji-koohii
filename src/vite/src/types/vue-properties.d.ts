/**
 * Make the API available as `this.$api` in Vue instances.
 *
 * @see  https://vuejs.org/v2/guide/typescript.html#Augmenting-Types-for-Use-with-Plugins
 */

import { KoohiiAPI } from "@lib/core/api";
import Vue from "vue";

declare module "vue/types/vue" {
  interface Vue {
    $api: KoohiiAPI;
  }
}
