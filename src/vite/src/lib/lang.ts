export default {
  isArray: (o: any): boolean => Array.isArray(o),
  isBoolean: (o: any): o is boolean => typeof o === "boolean",
  isFunction: (f: any): f is Function => typeof f === "function",
  isNumber: (s: any): s is number => typeof s === "number",
  isNull: (o: any): o is null => o === null,
  isObject: (o: any): o is object => typeof o === "object",
  isString: (s: any): s is string => typeof s === "string",
  isUndefined: (o: any): o is undefined => typeof o === "undefined",

  // DOM
  isNode: (el: any): boolean => el instanceof Node,
  isWindow: (o: any): o is Window => o === window,
};
