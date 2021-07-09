import { nextTick } from "vue";
import VueInstance from "@lib/helpers/vue-instance";
import AsideComponent from "@/vue/Aside.vue";
import KoohiiNavMenu from "@/vue/KoohiiNavMenu.vue";

let instance: any = null;
let navMenu: any = null;

export default {
  // options.navOptionsmenu (cf. apps/koohii/templates/layout.php)
  open(options: Dictionary<any> = {}) {
    console.log("Aside open()");

    if (!instance) {
      // merged with defaults in the component
      let data = { width: 280 };

      // render off-document and append afterwards
      let { vm } = VueInstance(AsideComponent, "#aside-component", data);
      instance = vm;

      // render nav
      let { vm: navMenuVm } = VueInstance(
        KoohiiNavMenu,
        instance.$refs.navContent,
        {
          menu: options.navOptionsMenu,
        }
      );
      navMenu = navMenuVm;
    }

    instance.show = true;

    nextTick(() => {
      navMenu!.initCollapsedItems();
    });
  },

  close() {
    console.log("Aside close()");
    instance.show = false;
  },

  toggle() {
    console.assert(instance, "Aside not instanced before calling toggle()");
    if (!instance.show) {
      instance.show = true;
    } else {
      this.close();
    }
  },
};
