<template>
  <div>
    <div class="form-group mb-8">
      <label for="srs_max_box">Number of boxes</label>
      <span class="help-block">
        How many boxes in total,
        <em>excluding</em> the leftmost box which contains New and Failed cards.
      </span>

      <select
        name="opt_srs_max_box"
        v-model="srs_max_box"
        class="form-control max-w-[10em]"
        id="srs_max_box"
      >
        <option v-for="o in srs_max_box_values" :value="o[0]">{{
          o[1]
        }}</option>
      </select>
    </div>

    <div class="form-group mb-8">
      <label for="srs_mult">Review interval multiplier</label>
      <span class="help-block">
        The multiplier determines the spacing between each successive review.
        The first interval is always 3 days.
      </span>

      <div class="mt-2 mb-4">
        <em class="inline-block mr-4">Intervals (days):</em>
        <span
          v-for="i in intervals"
          class="
            inline-block mr-2 pt-1 px-2 pb-[0.15rem]
            font-mono
            bg-[#d7e0b5] text-[#485f27] border-b border-[#aab38a] rounded-md
          "
          >{{ i.days }}</span
        >
      </div>

      <select
        name="opt_srs_mult"
        v-model="srs_mult"
        class="form-control max-w-[10em]"
        id="srs_mult"
      >
        <option v-for="o in srs_mult_values" :value="o[0]">{{
          o[1] || o[0]
        }}</option>
      </select>
    </div>

    <div class="form-group mb-8" :class="{ 'has-error': !isValidHardBox }">
      <label for="srs_hard_box">Maximum box for cards marked 'Hard'</label>
      <span class="help-block">
        Here, you can chose the maximum interval for a Hard answer by limiting
        the upper box. So for example if you chose to use 10 boxes and a Hard
        answer limit of 5 then a card in box 6,7,8,9 and 10 will always drop
        down to 5.
      </span>

      <div class="mt-2 mb-4">
        <em>Max interval for Hard answer:</em>
        <span>
          {{
            srs_hard_box > 0
              ? nthInterval(srs_hard_box) + " days"
              : "(default : drop card by one box, use the lower box interval)"
          }}
        </span>
      </div>

      <select
        name="opt_srs_hard_box"
        v-model="srs_hard_box"
        class="form-control max-w-[10em]"
        id="srs_hard_box"
      >
        <option v-for="o in srs_hard_box_values" :value="o[0]">{{
          o[1] || o[0]
        }}</option>
      </select>

      <span class="has-error-msg" v-if="!isValidHardBox">
        <strong
          >Max Hard Box must be lower than the number of boxes total.</strong
        >
      </span>
    </div>
  </div>
</template>

<script>
// NOTE : the validation needs to match the backend (account/spacedrepetition)

import { defineComponent } from "vue";

export default defineComponent({
  name: "spaced-repetition-form",

  data() {
    return {
      // form
      srs_max_box: 0,
      srs_mult: 0, // integer (205 means 2.05)
      srs_hard_box: 0,

      // select options
      srs_max_box_values: [
        [5, "5"],
        [6, "6"],
        [7, "7 (default)"],
        [8, "8"],
        [9, "9"],
        [10, "10"],
      ],
      srs_hard_box_values: [
        [0, "(default)"],
        [1],
        [2],
        [3],
        [4],
        [5],
        [6],
        [7],
        [8],
        [9],
      ],
    };
  },

  methods: {
    nthInterval(n) {
      let first = 3;
      let mult = 1.0 * Number(this.srs_mult / 100).toFixed(2); // 205 => 2.05
      return Math.ceil(first * Math.pow(mult, n - 1));
    },
  },

  computed: {
    isValidHardBox() {
      return this.srs_hard_box < this.srs_max_box;
    },

    srs_mult_values() {
      let m = 130;
      let options = [];
      while (m <= 400) {
        let label = m === 205 ? "2.05 (default)" : Number(m / 100).toFixed(2);
        options.push([m, label]);
        m += 5;
      }
      return options;
    },

    intervals() {
      let values = [];

      for (let n = 1; n <= this.srs_max_box; n++) {
        let days = this.nthInterval(n);
        values.push({ days: days });
      }

      return values;
    },
  },

  created() {
    // console.log("created()", this.srs_max_box);

    this.srs_max_box = Koohii.SRS.settings[0];
    this.srs_mult = Koohii.SRS.settings[1];
    this.srs_hard_box = Koohii.SRS.settings[2];
  },
});
</script>
