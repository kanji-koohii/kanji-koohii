type Dictionary<T = any> = { [key: string]: T };

// --------------------------------------------------------------------
// legacy component definitions; for .js files imported in .ts
// --------------------------------------------------------------------

// ajaxdialog.js
interface IAjaxDialog {
  new (srcMarkup: string | null, options?: Dictionary): this;
  getAjaxPanel(): any;
  getBody(): Element;
  on(className: string, fn: Function, scope?: any): void;
  destroy(): void;
  show(): void;
}

// ajaxpanel.js
interface IAjaxPanel {
  new (
    container: string | Element,
    options?: {
      bUseLayer?: boolean;
      bUseShading?: boolean;
      form: HTMLFormElement | string;
      [key: string]: any;
    }
  ): this;
  post(data: Dictionary, url?: string): void;
}

interface ISelectionTable {
  new (container: string | Element): this;
  destroy(): void;
  getPostData(): Dictionary;
}

interface AppKanjiReview {
  oReview: any;
  toggleDictDialog: () => void;
}
