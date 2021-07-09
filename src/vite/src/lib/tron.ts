/**
 * TRON is a simple wrapper around JSON messages.
 *
 * The main idea is that the UX never needs to deal with HTTP response codes,
 * or any server failure. From the point of view of the UX (ie. Vue components)
 * the operation is either succesful or not, and the response is *always* in
 * a standard format, even if the request or connection failed.
 *
 * Features:
 * - Supports embedded HTML within JSON response.
 * - Status codes to return success/fail/progress states (useful for multi step dialogs).
 * - Error messages for server exceptions that can be shown to the user.
 *
 * Corresponds to backend lib/JsTron.php
 *
 * Methods:
 *
 *   TRON(json)        Factory function, sanitizes & always returns a valid TRON message
 *
 *   isEmpty()         If true this means this instance is not created from a JSON response
 *                     that uses the TRON format.
 *
 *   isSuccess()
 *   getStatus()
 *
 *   getProps()        @return {Object}
 *
 *   getHtml()         Returns embedded html, otherwise an empty string (falsy).
 *
 *   getErrors()       @return {Array}
 *   hasErrors()
 *   setErrors()       @param {...string}   One or more error messages
 *
 */

import Lang from "@lib/lang";

// keep in sync with constants in /lib/JsTRON.php

// TRON message was not found in given source
export enum STATUS {
  EMPTY = -1,
  // a form submission contains errors, or a blocker (do not close ajax dialog)
  FAILED = 0,
  // a form is submitted succesfully, proceed (eg. close ajax dialog)
  SUCCESS = 1,
  // a form submitted succesfully, and continues with another step
  PROGRESS = 2,
}

export type TronProps = Dictionary<unknown>;

export type TronMessage<T = TronProps> = {
  status: STATUS;
  props: T;
  html: string;
  errors: string[];
};

export type TronInst<T = TronProps> = {
  isEmpty(): boolean;
  isSuccess(): boolean;
  isFailed(): boolean;
  getStatus(): STATUS;
  getProps(): T;
  getHtml(): string;
  getErrors(): string[];
  hasErrors(): boolean;
  setErrors(...errors: string[]): void;
};

function Inst<T = TronProps>(message: Partial<TronMessage>): TronInst<T> {
  console.assert(Lang.isObject(message), "TRON() : json is not an object");

  const emptyTronMsg: TronMessage = {
    status: STATUS.EMPTY,
    props: {},
    html: "",
    errors: [],
  };
  const tronObj: TronMessage = { ...emptyTronMsg, ...message };

  // validate TRON message
  console.assert(Lang.isNumber(tronObj.status), "TRON status is not a number");
  console.assert(Lang.isObject(tronObj.props), "TRON props is not an object");
  console.assert(Lang.isArray(tronObj.errors), "TRON errors is not an array");

  const inst = {
    isEmpty: () => tronObj.status === STATUS.EMPTY,
    isSuccess: () => tronObj.status === STATUS.SUCCESS,
    isFailed: () => tronObj.status === STATUS.FAILED,

    getStatus: (): STATUS => tronObj.status,
    getProps: (): T => tronObj.props as unknown as T,
    getHtml: (): string => tronObj.html,

    getErrors: () => tronObj.errors,
    hasErrors: () => tronObj.errors.length > 0,
    setErrors: function (...errors: string[]) {
      tronObj.errors.push(...errors);
    },
  };

  return inst;
}

// constants used by old frontend code
Inst.STATUS_FAILED = STATUS.FAILED;
Inst.STATUS_PROGRESS = STATUS.PROGRESS;
Inst.STATUS_SUCCESS = STATUS.SUCCESS;

export { Inst };
