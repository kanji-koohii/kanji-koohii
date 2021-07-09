/**
 * Declare globals for legacy components (.js).
 *
 *   Koohii
 *   . API             ... expose axios based API for review & study bundles
 *   . Dom             ... expose DOM utilities
 *
 */

import Vue, {
  DefineComponent,
  ComponentPublicInstance,
  VueConstructor,
} from "vue";
import Lang from "@lib/lang";
import { Inst as TronFactory } from "@lib/tron";
import VueInstance, { VueInstanceFn } from "@lib/helpers/vue-instance";

/**
 * Vue misc.
 */
declare global {
  // generic component definition (as from an .vue import)
  export type TVueDefine = DefineComponent<{}, {}, any>;

  // typing of props passed to createApps(root, props)
  export type TVuePropsData = Record<string, unknown>;

  // a generic Vue component instance
  export type TVueInstance = ComponentPublicInstance;

  // extract component instance (component T's custom properties, methods, etc)
  export type TVueInstanceOf<T> = T extends new () => infer I ? I : never;
}

declare global {
  export interface KoohiiGlobals {
    // misc. references shared between backend/frontend,
    //  also Vue components from Vite build, instanced from php templates
    Refs: {
      [key: string]: any;
    };

    // references to Vue components that can be instanced later
    UX: { [componentName: string]: any };
  }

  interface Window {
    // cf. kk_globals_put() on the php side
    KK: {
      // base URL for API requests (cf. layout.php & koohii_base_url() helper)
      BASE_URL: string;

      STUDY_SEARCH_URL: string;

      EDITSTORY_PROPS: Dictionary;

      REVIEW_OPTIONS: Dictionary;
      REVIEW_MODE: Dictionary;
    };

    // 4th/5th edition keywords and kanji, import cf. _SideColumn.php
    //   web/revtk/study/keywords-rtk-0.js
    //   web/revtk/study/keywords-rtk-1.js
    kklist: string;
    kwlist: string[];

    Koohii: KoohiiGlobals;
  }
}
