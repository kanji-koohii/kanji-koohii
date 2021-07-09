import VueInstance from "@lib/helpers/vue-instance";
import $$, { domContentLoaded } from "@lib/dom";
import SpacedRepetitionForm from "@/vue/account/SpacedRepetitionForm.vue";

domContentLoaded(() => {
  console.log("@entry-account ...");

  // Account > Spaced Repetition
  const elMount = $$("#srs-form")[0];
  elMount && VueInstance(SpacedRepetitionForm, elMount);
});
