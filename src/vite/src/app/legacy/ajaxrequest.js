/**
 * AjaxRequest is a wrapper for YUI's Connection manager.
 *
 * Features:
 *
 * - Parameters can be passed as an object (hash) and will be encoded to query string.
 * - The "json" option converts the object to a JSON string and adds the "json" variable
 *   to the post data.
 * - If the form serialization is used, it is added to the parameters, not replacing.
 * - If the content-type of the response is "application/json", sets a "responseJSON"
 *   property on the response object, containing the parsed JSON as a native object.
 * - Custom response filter
 * - Custom TRON filter
 *
 * Sending JSON data:
 *
 *   If the parameters hash contains a "json" property, its contents will be encoded
 *   into a JSON string (eg: parameters: { json: { mydata: "lorem ipsum" } } ).
 *
 * Receiving JSON data:
 *
 *   successHandler(t) {
 *     if (t.isSuccess()) {
 *       console.log("Success!");
 *     }
 *     else if (t.getResponse().responseJSON === null) {
 *       console.log("JSON data could not be parsed");
 *     }
 *   }
 *
 * How to handle timeout:
 *
 *   A status of -1 in the failure callback means the transaction was aborted.
 *   See http://developer.yahoo.com/yui/connection/#failure
 *
 * Methods:
 *   init(url, options)      Constructor, see options below.
 *   isCallInProgress()      Determines if the transaction is still being processed.
 *   getHttpHeader(o, name)  Get a response header, ignoring case of the header name. o is the YUI Connect
 *                           object, name is the header property eg. "Content-Type".
 *
 * Constructor options:
 *
 *   method      The request method ('GET', 'POST', ...), defaults to 'GET'
 *   parameters  Optional request parameters as a query string (String) or hash (Object)
 *   form        If set (HTMLElement form|String id), the form is serialized in addition to the parameters
 *   json        If this property is an object, it is encoded as a JSON string (optional)
 *   nocache     If specified (true), a 'rnd=timestamp' variable is added to the request to prevent caching
 *   argument    Object, string, number, or array that will be passed to your callbacks (optional)
 *               Use o.argument to access this property in the handlers.
 *   timeout     Timeout value in milliseconds (defaults to 3000)
 *
 *   success(o)  HTTP 2xx range response, o is the (augmented) YUI Connect response
 *   failure(o)  HTTP 400 or greater response, o is the (augmented) YUI Connect response
 *   upload(o)   Process file upload response (untested, maps to YUI Connection Manager option)
 *
 *   scope       Scope for "success", "failure", "events" and "customevents" handlers (optional)
 *
 *   customevents  For transaction-level events (onStart, onComplete, ...).
 *                 http://developer.yahoo.com/yui/connection/#customevents
 *
 *
 * The success, failure and upload handlers will receive YUI's Response Object:
 *
 *   tId
 *   status
 *   statusText
 *   getResponseHeader[]
 *   getAllResponseHeaders
 *   responseText
 *   responseXML
 *   argument       => options.argument as passed to AjaxRequest constructor
 *
 * AjaxRequest augments the YUI Connect response object:
 *
 *   responseJSON   => if the content-type is "application/json", contains the parsed JSON.
 *   responseTRON   => an instance of TRON which augments the JSON response with
 *                     a standard structure, and helpers.
 *
 * @see      http://developer.yahoo.com/yui/connection/
 *
 */

import $$ from "@lib/dom";
import Lang from "@lib/lang";
import * as TRON from "@lib/tron";
import { toQueryString } from "@lib/helpers/to-query-string";

// constants
const DEFAULT_TIMEOUT = 5000; // default time out for AjaxRequests

export default class AjaxRequest {
  /**
   * Constructor.
   *
   * @param {String} url      Request url, if it contains a query string, don't set options.parameters
   * @param {Object} options  Constructor options
   */
  constructor(url, options) {
    var that = this,
      callback = {},
      postdata;

    console.assert(window.YAHOO);
    console.log("AjaxRequest.init()", options);

    // set defaults
    options = {
      ...{
        method: "GET",
        url: url,
      },
      ...options,
    };

    options.method = options.method.toUpperCase();

    callback.success = function(o) {
      that.handleSuccess(o, options.success, options.scope);
    };
    callback.failure = function(o) {
      that.handleFailure(o, options.failure, options.scope);
    };

    if (options.upload) {
      callback.upload = options.upload;
    }

    if (options.argument) {
      callback.argument = options.argument;
    }

    if (options.nocache) {
      callback.cache = false;
    }

    // this should only be used internally from now (AjaxPanel)
    if (options.events) {
      if (options.events.onSuccess || options.events.onFailure) {
        console.warn(
          "AjaxRequest() WARNING: options.events is deprecated! (for internal use)"
        );
      }
      callback.events = options.events;
    }

    // set handlers for transation-level events (esp. onStart, onComplete)
    if (options.customevents) {
      callback.customevents = options.customevents;
    }

    if (options.scope) {
      callback.scope = options.scope;
    }

    callback.timeout = Lang.isNumber(options.timeout)
      ? options.timeout
      : DEFAULT_TIMEOUT;
    //console.log("Setting callback.timeout to %o", callback.timeout);

    // serialize form data?
    if (options.form) {
      console.assert(options.form instanceof Node);
      var formObject = $$(options.form)[0];

      console.assert(
        formObject.nodeName && formObject.nodeName.toLowerCase() === "form",
        "AjaxRequest::init() form is not a FORM element"
      );

      YAHOO.util.Connect.setForm(formObject);
    }

    // create the request URL
    var requestUri = options.url,
      params = options.parameters,
      json = null,
      query = [];

    // encode JSON ?
    if (options.json && Lang.isObject(options.json)) {
      json = JSON.stringify(options.json);
    }

    // convert request parameters to url encoded string (damn you, YUI)
    if (params) {
      console.assert(
        Lang.isString(params) || Lang.isObject(params),
        "AjaxRequest() invalid typeof options.parameters"
      );

      if (Lang.isString(params)) {
        var pos = params.indexOf("?");
        if (pos >= 0) {
          params = params.slice(pos + 1);
        }
      } else if (Lang.isObject(params)) {
        // convert hash to query string parameters
        params = toQueryString(params);
      }
    }

    // build the query string
    if (params) {
      query.push(params);
    }
    if (json) {
      query.push("json=" + encodeURIComponent(json));
    }
    query = query.join("&");

    // merge the query string to the request uri for GET, or set postdata for POST
    if (query.length) {
      // add GET request query string
      if (options.method === "GET") {
        // should not query string in url AND and options.parameters at the same time
        console.assert(
          requestUri.indexOf("?") < 0,
          "AjaxRequest::init() Request url already contains parameters"
        );

        requestUri = requestUri + "?" + query;
      } else if (options.method === "POST") {
        // YUI wants a string for the POST body (postdata), but does not mind query string in the requestUri
        postdata = query;
      }
    }

    this.connection = YAHOO.util.Connect.asyncRequest(
      options.method,
      requestUri,
      callback,
      postdata
    );
  }

  /**
   * Determines if the transaction is still being processed.
   *
   * @return {Boolean}
   *
   */
  isCallInProgress() {
    //var b=YAHOO.util.Connect.isCallInProgress(this.connection);;
    //console.log('isCallInProgress says... %o', b);
    return YAHOO.util.Connect.isCallInProgress(this.connection);
  }

  /**
   * Returns a HTTP header from the YUI Connect object, checking also for
   * lowercase headers.
   *
   * This fixes "Content-Type" returned as undefined on the Android browser.
   * @see    https://issues.apache.org/jira/browse/HARMONY-6452
   *
   * @param  {Object}   YUI Connect object.
   * @param  {String}   HTTP header property wanted in CamelCase
   *
   * @return {String|Undefined}   Returns the value or undefined.
   */
  getHttpHeader(o, name) {
    return (
      o.getResponseHeader &&
      (o.getResponseHeader[name] || o.getResponseHeader[name.toLowerCase()])
    );
  }

  /**
   * The success handler is called for HTTP 2xx async responses.
   *
   * Adds a "responseJSON" property to the YUI Connect object, if the content type
   * is "application/json" and the response is parsed succesfully.
   *
   * If there IS an "application/json" response but it did not parse, responseJSON
   * is set to null instead of undefined. This lets you know that the JSON parse failed.
   *
   * @param {Object}   o       YUI Connect object
   * @param {Function} fn      Success handler (optional)
   * @param {Object}   scope   Scope for the event handler (optional)
   */
  handleSuccess(o, fn, scope) {
    //console.log('*** ' + this.getHttpHeader(o, 'Content-Type'));

    if (fn) {
      var contentType = this.getHttpHeader(o, "Content-Type") || "",
        json = null,
        tron;

      // set responseJSON
      if (
        o.responseText.length > 0 &&
        contentType.indexOf("application/json") >= 0
      ) {
        try {
          o.responseJSON = JSON.parse(o.responseText);
        } catch (e) {
          console.warn("AjaxRequest::handleSuccess()  Could not parse JSON.");
          o.responseJSON = null;

          return;
        }
      }

      o.responseTRON = o.responseJSON ? new TRON.Inst(o.responseJSON) : null;
      // console.log("responseTRON ...", o.responseTRON);

      fn.apply(scope || window, [o]);
    }
  }

  /**
   * The failure method is called with HTTP status 400 or greater.
   *
   * @param {Object} o
   * @param {Function=} fn   Failure handler (optional)
   * @param {Object=} scope
   */
  handleFailure(o, fn, scope) {
    fn && fn.apply(scope || window, [o]);
  }
}
