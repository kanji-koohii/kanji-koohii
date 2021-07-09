/**
 * Create an absolutely positioned div that covers an area of the page
 * with a solid color and a level of transparency. Typical use is to show an
 * area as "disabled" while a dialog is on, or while content is loading with ajax.
 *
 * OPTIONS
 *
 *   target      {HTMLElement}  Element which is covered by the mask
 *
 */

import { nextTick } from "vue";
import VueInstance, {
  ComponentPublicInstance,
} from "@lib/helpers/vue-instance";
import KoohiiLoading from "./KoohiiLoading.vue";
import { getStyle } from "@lib/dom";
import Lang from "@lib/lang";

const setMaskStyle = (
  parent: HTMLElement,
  component: TVueInstanceOf<typeof KoohiiLoading>
) => {
  component.originalPosition = getStyle(parent, "position")!;
};

let component: TVueInstanceOf<typeof KoohiiLoading> | null;
let componentUnmount: Function;

export type KoohiiLoadingOptions = { target: HTMLElement; background?: string };

export default {
  /**
   *
   *   target     {HTMLElement}     target to cover with mask
   *   background {String}          background color of the mask
   *
   * @param {} options
   */
  show(options: KoohiiLoadingOptions) {
    console.log("koohiiloading::show()");
    let target = options.target;

    console.assert(Lang.isNode(target), "KoohiiLoading() : target is invalid");

    let { vm, unmount } = VueInstance(KoohiiLoading, document.createElement("div"), options);
    component = vm as TVueInstanceOf<typeof KoohiiLoading>;
    componentUnmount = unmount;

    setMaskStyle(target, component);

    if (
      component.originalPosition !== "absolute" &&
      component.originalPosition !== "fixed"
    ) {
      target.classList.add("kk-loading-target--relative");
    }

    target.appendChild(component.$el);
    nextTick(() => {
      component!.setVisible(true);
    });
  },

  hide() {
    console.log("koohiiloading::hide()");
    if (component) {
      component.close();
      componentUnmount();
      component = null;
    }
  },
};
