<template>
  <div>
    <transition name="slideleft" @enter="slideEnter">
      <div v-show="show" class="aside">
        <div class="aside_close" @click="show = false">
          <i class="aside_close_icon fa fa-bars"></i>
        </div>

        <div ref="navContent" class="aside_nav_content"></div>
      </div>
    </transition>
    <transition
      name="mask"
      @before-enter="maskBeforeEnter"
      @after-leave="maskAfterLeave"
    >
      <div
        v-if="show"
        class="aside-backdrop"
        @touchmove.stop.prevent
        @click="show = false"
      ></div>
    </transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick } from "vue";
import $$ from "@lib/dom";

function getScrollBarWidth() {
  if (document.documentElement.scrollHeight <= document.documentElement.clientHeight) {
    return 0
  }
  let inner = document.createElement('p')
  inner.style.width = '100%'
  inner.style.height = '200px'

  let outer = document.createElement('div')
  outer.style.position = 'absolute'
  outer.style.top = '0px'
  outer.style.left = '0px'
  outer.style.visibility = 'hidden'
  outer.style.width = '200px'
  outer.style.height = '150px'
  outer.style.overflow = 'hidden'
  outer.appendChild(inner)

  document.body.appendChild(outer)
  let w1 = inner.offsetWidth
  outer.style.overflow = 'scroll'
  let w2 = inner.offsetWidth
  if (w1 === w2) w2 = outer.clientWidth

  document.body.removeChild(outer)

  return (w1 - w2)
}

export default defineComponent({
  data() {
    return {
      show: false,
      bodyOverflow: "",
      bodyPaddingRight: "",
    };
  },

  created() {
    console.log("Aside created()");
  },

  mounted() {
    console.log("Aside mounted()");
  },

  methods: {
    slideEnter() {
      // console.log('slideEnter()')
    },

    maskBeforeEnter() {
      // console.log("maskBeforeEnter()")
      const $body = $$(document.body);
      const scrollBarWidth = getScrollBarWidth();

      this.bodyOverflow = $body.css("overflow");
      $body.css("overflow", "hidden");

      this.bodyPaddingRight = $body.css("padding-right");
      if (scrollBarWidth !== 0) {
        $body.css("padding-right", scrollBarWidth + "px");
      }
    },
    maskAfterLeave() {
      // console.log("maskAfterLeave()")

      $$(document.body).css({
        "padding-right": this.bodyPaddingRight,
        overflow: this.bodyOverflow,
      });
    },
  },
});
</script>

<style>
.aside {
  position: fixed;
  top: 0;
  bottom: 0;
  z-index: 1002;
  overflow: auto;
  background: #2b3034;
  width: 280px;

  /* aside__left*/
  left: 0;
  right: auto;
}

/* the close button ismade to overlap exactly the one appearing in the site's top bar */
.aside_close {
  position: absolute;
  left: 0;
  top: 0;
  width: 50px;
  height: 46px;
  font-size: 24px;
  text-align: center;
  vertical-align: middle;
  color: #616161;
  cursor: pointer;
}
.aside_close_icon {
  padding-top: 10px;
}

.aside_nav_content {
  margin: 72px 0 0;
}

.slideleft-enter-from {
  transform: translateX(-100%);
}
.slideleft-enter-active {
  animation: 0.2s ease-out slideleft-in;
}
.slideleft-leave-active {
  animation: 0.2s ease-in slideleft-out;
}

@keyframes slideleft-in {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}
@keyframes slideleft-out {
  0% {
    transform: translateX(0);
    opacity: 1;
  }
  100% {
    transform: translateX(-100%);
    opacity: 0;
  }
}
.aside:focus {
  outline: 0;
}

.aside-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1001;
  background-color: #000;

  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.mask-enter,
.mask-leave-active {
  opacity: 0;
}

@media (max-width: 360px) {
  /* reduce panel size on smaller screens */
  .aside {
    width: 250px;
  }
}
</style>
