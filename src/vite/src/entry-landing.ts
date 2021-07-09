/**
 * LANDING PAGE BUNDLE
 *
 *   Includes:
 *   - root-bundle: Vue, mobile navigation, globals
 *   - the landing page stylesheet
 *
 */

console.log("@entry landing ...");

// stylesheets
import "@css/home.scss";

import rootBundleInit from "@app/root-bundle";
rootBundleInit();

console.log("@entry landing");
