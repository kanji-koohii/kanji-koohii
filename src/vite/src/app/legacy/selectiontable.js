/**
 * Extends an AjaxTable widget with the ability to select rows.
 *
 * - Select rows by clicking the check box, or clicking anywhere inside the row.
 * - Select/deselect all rows with the checkbox in the table head.
 *
 * Methods:
 *   getPostData()     Return serialized input hidden data that the backend can
 *                     use to refresh the selection state.
 *
 * @see       See related backend class uiSelectionState.php
 */

import $$, { stopEvent } from "@lib/dom";
import AjaxTable from "@old/ajaxtable";

export default class SelectionTable {
  /**
   *
   * @param {string|HTMLElement} container   Container element or string id.
   */
  constructor(container) {
    this.oAjaxTable = new AjaxTable(container);
    this.oAjaxTable.evtDel.on("checkbox", this.onCheckBox, this);
    this.oAjaxTable.evtDel.on("chkAll", this.onCheckAll, this);
    this.oAjaxTable.evtDel.onDefault(this.onClick, this);
  }

  destroy() {
    this.oAjaxTable.destroy();
    this.oAjaxTable = null;
  }

  /**
   * Returns serialized form data for the hidden inputs that store
   * the state of selected rows.
   *
   * @see  uiSelectionState.php
   *
   * @returns {Dictionary}
   */
  getPostData() {
    var inputs = $$("input.checkbox", this.getTable().tBodies[0]),
      data = {},
      i;
    for (i = 0; i < inputs.length; i++) {
      var input = inputs[i].parentNode.getElementsByTagName("input")[0];
      console.assert(!!input, "getPostData() invalid markup?");
      data[input.name] = input.value;
    }

    return data;
  }

  getTable() {
    return this.oAjaxTable.container.getElementsByTagName("table")[0];
  }

  onCheckBox(ev, el) {
    var row = $$(el).closest("tr");
    var inputs = el.parentNode.getElementsByTagName("input");

    this.setSelection(row, inputs[0], el.checked);

    // pass through otherwise the checkbox won't check
    return true;
  }

  onCheckAll(ev, el) {
    var i,
      check = el.checked,
      rows = this.getTable().tBodies[0].getElementsByTagName("tr");

    for (i = 0; i < rows.length; i++) {
      var tr = rows[i],
        inputs = tr.getElementsByTagName("input");
      if (inputs[1].checked !== check) {
        inputs[1].checked = check;
        this.setSelection(tr, inputs[0], check);
      }
    }

    return true;
  }

  onClick(ev) {
    var row,
      check,
      el = ev.target;

    // watch for already handled checkbox clicks
    if (el.tagName.toLowerCase() === "input") {
      return true;
    }

    // if clicked in a row, select it
    if ((row = $$(el).closest("tr"))) {
      if ((check = $$(".checkbox", row)[0])) {
        check.click();
        stopEvent(ev);
      }
    }

    return true;
  }

  setSelection(row, input, check) {
    // set value
    input.value = check ? "1" : "0";
    // set highlight
    row.classList.toggle("selected", check);
  }
}

export default SelectionTable;
