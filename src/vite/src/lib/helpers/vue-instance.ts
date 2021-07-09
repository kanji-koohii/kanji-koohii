import { createApp, DefineComponent, ComponentPublicInstance } from "vue";
import Lang from "@lib/lang";

export type { ComponentPublicInstance };

const fnVueInstance = (
  component: any,
  mount: string | Element,
  props?: TVuePropsData,
  replace = false,
): { vm: ComponentPublicInstance, unmount: Function } => {
  let el = Lang.isString(mount) ? document.querySelectorAll(mount)[0] : mount;
  console.assert(Lang.isNode(el), "VueInstance() : mount is invalid");

  const app = createApp(component, props);
  let vm;

  if (replace) {
    // NOTE! seems to work, but unsure if side effects
    const fragment = document.createDocumentFragment();
    const elParent = el.parentElement;
    vm = app.mount(fragment as Node as Element);
    el.parentNode!.replaceChild(fragment, el);
  }
  else {
    // appends as a child
    vm = app.mount(mount);
  }

  const unmount = () => {
    app.unmount();
  }

  return { vm, unmount };
};

export default fnVueInstance;
