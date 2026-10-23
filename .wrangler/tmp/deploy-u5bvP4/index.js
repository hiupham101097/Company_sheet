var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/buffer.js
var bufferToFormData = /* @__PURE__ */ __name((arrayBuffer, contentType) => {
  return new Response(arrayBuffer, { headers: { "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase()) } }).formData();
}, "bufferToFormData");

// node_modules/hono/dist/utils/body.js
var MAX_NESTED_OBJECTS = 1e4;
var isRawRequest = /* @__PURE__ */ __name((request) => "headers" in request, "isRawRequest");
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const mediaType = (isRawRequest(request) ? request.headers : request.raw.headers).get("Content-Type")?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") return parseFormData(request, {
    all,
    dot
  });
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData) return convertFormDataToBodyData(await request.bodyCache.formData, options);
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) request.bodyCache.formData = formDataPromise;
  const formData = await formDataPromise;
  if (formData) return convertFormDataToBodyData(formData, options);
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  const nestingState = { count: 0 };
  formData.forEach((value, key) => {
    if (!(options.all || key.endsWith("[]"))) form[key] = value;
    else handleParsingAllValues(form, key, value);
  });
  if (options.dot) Object.entries(form).forEach(([key, value]) => {
    if (key.includes(".")) {
      handleParsingNestedValues(form, key, value, nestingState);
      delete form[key];
    }
  });
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) form[key].push(value);
    else form[key] = [form[key], value];
  } else if (!key.endsWith("[]")) form[key] = value;
  else form[key] = [value];
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value, state) => {
  if (/(?:^|\.)__proto__\./.test(key)) return;
  let nestedForm = form;
  const keys = key.split(".", 34);
  if (keys.length > 33) throwNestingLimitExceeded();
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) nestedForm[key2] = value;
    else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        if (state.count++ >= MAX_NESTED_OBJECTS) throwNestingLimitExceeded();
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");
var throwNestingLimitExceeded = /* @__PURE__ */ __name(() => {
  throw new Error("Nesting limit exceeded");
}, "throwNestingLimitExceeded");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") paths.shift();
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return {
    groups,
    path
  };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) if (paths[j].includes(mark)) {
      paths[j] = paths[j].replace(mark, groups[i][1]);
      break;
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") return "*";
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [
        cacheKey,
        match2[1],
        new RegExp(`^${match2[2]}(?=/${next})`)
      ] : [
        label,
        match2[1],
        new RegExp(`^${match2[2]}$`)
      ];
      else patternCache[cacheKey] = [
        label,
        match2[1],
        true
      ];
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) break;
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) sub = mergePath(sub, ...rest);
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) return null;
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) basePath += "/" + segment;
    else if (/\:/.test(segment)) {
      if (segment.charCodeAt(segment.length - 1) === 63) {
        if (results.length === 0 && basePath === "") results.push("/");
        else results.push(basePath);
        const optionalSegment = segment.slice(0, -1);
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else basePath += "/" + segment;
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => str.indexOf("%") !== -1 ? tryDecode(str, decodeURIComponent_) : str, "tryDecodeURIComponent");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (value.indexOf("+") !== -1) value = value.replace(/\+/g, " ");
  return tryDecodeURIComponent(value);
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  const hashIndex = url.indexOf("#", 8);
  if (hashIndex !== -1) url = url.slice(0, hashIndex);
  let encoded;
  if (!multiple && key && key.indexOf("%") === -1 && key.indexOf("+") === -1) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) return;
    if (!url.startsWith(key, keyIndex2 + 1)) keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) return "";
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) return;
  }
  const results = /* @__PURE__ */ Object.create(null);
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) valueIndex = -1;
    let name = url.slice(keyIndex + 1, valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex);
    if (encoded) name = _decodeURI(name);
    keyIndex = nextKeyIndex;
    if (name === "") continue;
    let value;
    if (valueIndex === -1) value = "";
    else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) value = _decodeURI(value);
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) results[name] = [];
      results[name].push(value);
    } else results[name] ??= value;
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
  * `.raw` can get the raw Request object.
  *
  * @see {@link https://hono.dev/docs/api/request#raw}
  *
  * @example
  * ```ts
  * // For Cloudflare Workers
  * app.post('/', async (c) => {
  *   const metadata = c.req.raw.cf?.hostMetadata?
  *   ...
  * })
  * ```
  */
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  /**
  * `.path` can get the pathname of the request.
  *
  * @see {@link https://hono.dev/docs/api/request#path}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const pathname = c.req.path // `/about/me`
  * })
  * ```
  */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex]?.[1][key];
    const param = this.#getParamValue(paramKey);
    return param && tryDecodeURIComponent(param);
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex]?.[1] ?? {});
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) decoded[key] = tryDecodeURIComponent(value);
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) return this.raw.headers.get(name) ?? void 0;
    const headerData = /* @__PURE__ */ Object.create(null);
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) return cachedBody;
    for (const anyCachedKey in bodyCache) return bodyCache[anyCachedKey].then((body) => {
      if (anyCachedKey === "json") body = JSON.stringify(body);
      const contentType = anyCachedKey === "formData" ? void 0 : raw2.headers.get("content-type");
      return new Response(body, { headers: contentType ? { "Content-Type": contentType } : void 0 })[key]();
    });
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
  * `.json()` can parse Request body of type `application/json`
  *
  * @see {@link https://hono.dev/docs/api/request#json}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.json()
  * })
  * ```
  */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
  * `.text()` can parse Request body of type `text/plain`
  *
  * @see {@link https://hono.dev/docs/api/request#text}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.text()
  * })
  * ```
  */
  text() {
    return this.#cachedBody("text");
  }
  /**
  * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
  *
  * @see {@link https://hono.dev/docs/api/request#arraybuffer}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.arrayBuffer()
  * })
  * ```
  */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
  * `.bytes()` parses the request body as a `Uint8Array`.
  *
  * @see {@link https://hono.dev/docs/api/request#bytes}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.bytes()
  * })
  * ```
  */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
  * Parses the request body as a `Blob`.
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.blob();
  * });
  * ```
  * @see https://hono.dev/docs/api/request#blob
  */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
  * Parses the request body as `FormData`.
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.formData();
  * });
  * ```
  * @see https://hono.dev/docs/api/request#formdata
  */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
  * Adds validated data to the request.
  *
  * @param target - The target of the validation.
  * @param data - The validated data to add.
  */
  addValidatedData(target, data) {
    (this.#validatedData ??= {})[target] = data;
  }
  valid(target) {
    return this.#validatedData?.[target];
  }
  /**
  * `.url` can get the request url strings.
  *
  * @see {@link https://hono.dev/docs/api/request#url}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const url = c.req.url // `http://localhost:8787/about/me`
  *   ...
  * })
  * ```
  */
  get url() {
    return this.raw.url;
  }
  /**
  * `.method` can get the method name of the request.
  *
  * @see {@link https://hono.dev/docs/api/request#method}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const method = c.req.method // `GET`
  * })
  * ```
  */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
  * `.matchedRoutes` can return a matched route in the handler
  *
  * @deprecated
  *
  * Use matchedRoutes helper defined in "hono/route" instead.
  *
  * @see {@link https://hono.dev/docs/api/request#matchedroutes}
  *
  * @example
  * ```ts
  * app.use('*', async function logger(c, next) {
  *   await next()
  *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
  *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
  *     console.log(
  *       method,
  *       ' ',
  *       path,
  *       ' '.repeat(Math.max(10 - path.length, 0)),
  *       name,
  *       i === c.req.routeIndex ? '<- respond from here' : ''
  *     )
  *   })
  * })
  * ```
  */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
  * `.routePath` can retrieve the path registered within the handler
  *
  * @deprecated
  *
  * Use routePath helper defined in "hono/route" instead.
  *
  * @see {@link https://hono.dev/docs/api/request#routepath}
  *
  * @example
  * ```ts
  * app.get('/posts/:id', (c) => {
  *   return c.json({ path: c.req.routePath })
  * })
  * ```
  */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) str = str.toString();
    if (str instanceof Promise) str = await str;
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) return Promise.resolve(str);
  if (buffer) buffer[0] += str;
  else buffer = [str];
  const resStr = Promise.all(callbacks.map((c) => c({
    phase,
    buffer,
    context
  }))).then((res) => Promise.all(res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))).then(() => buffer[0]));
  if (preserveCallbacks) return raw(await resStr, callbacks);
  else return resStr;
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
  * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
  *
  * @see {@link https://hono.dev/docs/api/context#env}
  *
  * @example
  * ```ts
  * // Environment object for Cloudflare Workers
  * app.get('*', async c => {
  *   const counter = c.env.COUNTER
  * })
  * ```
  */
  env = {};
  #var;
  finalized = false;
  /**
  * `.error` can get the error object from the middleware if the Handler throws an error.
  *
  * @see {@link https://hono.dev/docs/api/context#error}
  *
  * @example
  * ```ts
  * app.use('*', async (c, next) => {
  *   await next()
  *   if (c.error) {
  *     // do something...
  *   }
  * })
  * ```
  */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
  * Creates an instance of the Context class.
  *
  * @param req - The Request object.
  * @param options - Optional configuration options for the context.
  */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
  * `.req` is the instance of {@link HonoRequest}.
  */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#event}
  * The FetchEvent associated with the current request.
  *
  * @throws Will throw an error if the context does not have a FetchEvent.
  */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) return this.#executionCtx;
    else throw Error("This context has no FetchEvent");
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#executionctx}
  * The ExecutionContext associated with the current request.
  *
  * @throws Will throw an error if the context does not have an ExecutionContext.
  */
  get executionCtx() {
    if (this.#executionCtx) return this.#executionCtx;
    else throw Error("This context has no ExecutionContext");
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#res}
  * The Response object for the current request.
  */
  get res() {
    return this.#res ||= createResponseInstance(null, { headers: this.#preparedHeaders ??= new Headers() });
  }
  /**
  * Sets the Response object for the current request.
  *
  * @param _res - The Response object to set.
  */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") continue;
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) _res.headers.append("set-cookie", cookie);
        } else _res.headers.set(k, v);
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
  * `.render()` can create a response within a layout.
  *
  * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
  *
  * @example
  * ```ts
  * app.get('/', (c) => {
  *   return c.render('Hello!')
  * })
  * ```
  */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
  * Sets the layout for the response.
  *
  * @param layout - The layout to set.
  * @returns The layout function.
  */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
  * Gets the current layout for the response.
  *
  * @returns The current layout function.
  */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
  * `.setRenderer()` can set the layout in the custom middleware.
  *
  * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
  *
  * @example
  * ```tsx
  * app.use('*', async (c, next) => {
  *   c.setRenderer((content) => {
  *     return c.html(
  *       <html>
  *         <body>
  *           <p>{content}</p>
  *         </body>
  *       </html>
  *     )
  *   })
  *   await next()
  * })
  * ```
  */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
  * `.header()` can set headers.
  *
  * @see {@link https://hono.dev/docs/api/context#header}
  *
  * @example
  * ```ts
  * app.get('/welcome', (c) => {
  *   // Set headers
  *   c.header('X-Message', 'Hello!')
  *   c.header('Content-Type', 'text/plain')
  *
  *   // Append multiple headers using the append option (e.g. Vary)
  *   c.header('Vary', 'Accept-Encoding', { append: true })
  *   c.header('Vary', 'User-Agent', { append: true })
  *
  *   return c.body('Thank you for coming')
  * })
  * ```
  */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) this.#res = createResponseInstance(this.#res.body, this.#res);
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) headers.delete(name);
    else if (options?.append) headers.append(name, value);
    else headers.set(name, value);
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
  * `.set()` can set the value specified by the key.
  *
  * @see {@link https://hono.dev/docs/api/context#set-get}
  *
  * @example
  * ```ts
  * app.use('*', async (c, next) => {
  *   c.set('message', 'Hono is hot!!')
  *   await next()
  * })
  * ```
  */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
  * `.get()` can use the value specified by the key.
  *
  * @see {@link https://hono.dev/docs/api/context#set-get}
  *
  * @example
  * ```ts
  * app.get('/', (c) => {
  *   const message = c.get('message')
  *   return c.text(`The message is "${message}"`)
  * })
  * ```
  */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
  * `.var` can access the value of a variable.
  *
  * @see {@link https://hono.dev/docs/api/context#var}
  *
  * @example
  * ```ts
  * const result = c.var.client.oneMethod()
  * ```
  */
  get var() {
    if (!this.#var) return {};
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
    if (typeof arg === "object" && arg.headers) {
      responseHeaders ??= new Headers();
      for (const [key, value] of new Headers(arg.headers)) if (key === "set-cookie") responseHeaders.append(key, value);
      else responseHeaders.set(key, value);
    }
    if (headers) {
      if (!responseHeaders) {
        let count = 0;
        for (const k in headers) if (++count > 1 || typeof headers[k] !== "string") {
          responseHeaders = new Headers();
          break;
        }
      }
      if (responseHeaders) for (const k in headers) {
        const v = headers[k];
        if (typeof v === "string") responseHeaders.set(k, v);
        else {
          responseHeaders.delete(k);
          for (const v2 of v) responseHeaders.append(k, v2);
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, {
      status,
      headers: responseHeaders ?? headers
    });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
  * `.body()` can return the HTTP response.
  * You can set headers with `.header()` and set HTTP status code with `.status`.
  * This can also be set in `.text()`, `.json()` and so on.
  *
  * @see {@link https://hono.dev/docs/api/context#body}
  *
  * @example
  * ```ts
  * app.get('/welcome', (c) => {
  *   // Set headers
  *   c.header('X-Message', 'Hello!')
  *   c.header('Content-Type', 'text/plain')
  *   // Set HTTP status code
  *   c.status(201)
  *
  *   // Return the response body
  *   return c.body('Thank you for coming')
  * })
  * ```
  */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
  * `.text()` can render text as `Content-Type:text/plain`.
  *
  * @see {@link https://hono.dev/docs/api/context#text}
  *
  * @example
  * ```ts
  * app.get('/say', (c) => {
  *   return c.text('Hello!')
  * })
  * ```
  */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(text, arg, setDefaultContentType(TEXT_PLAIN, headers));
  }, "text");
  /**
  * `.json()` can render JSON as `Content-Type:application/json`.
  *
  * @see {@link https://hono.dev/docs/api/context#json}
  *
  * @example
  * ```ts
  * app.get('/api', (c) => {
  *   return c.json({ message: 'Hello!' })
  * })
  * ```
  */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(JSON.stringify(object), arg, setDefaultContentType("application/json", headers));
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
  * `.redirect()` can Redirect, default status code is 302.
  *
  * @see {@link https://hono.dev/docs/api/context#redirect}
  *
  * @example
  * ```ts
  * app.get('/redirect', (c) => {
  *   return c.redirect('/')
  * })
  * app.get('/redirect-permanently', (c) => {
  *   return c.redirect('/', 301)
  * })
  * ```
  */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header("Location", !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString));
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
  * `.notFound()` can return the Not Found Response.
  *
  * @see {@link https://hono.dev/docs/api/context#notfound}
  *
  * @example
  * ```ts
  * app.get('/notfound', (c) => {
  *   return c.notFound()
  * })
  * ```
  */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) throw new Error("next() called multiple times");
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else handler = i === middleware.length && next || void 0;
      if (handler) try {
        res = await handler(context, () => dispatch(i + 1));
      } catch (err) {
        if (err instanceof Error && onError) {
          context.error = err;
          res = await onError(err, context);
          isError = true;
        } else throw err;
      }
      else if (context.finalized === false && onNotFound) res = await onNotFound(context);
      if (res && (context.finalized === false || isError)) context.res = res;
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/router.js
var METHODS = [
  "get",
  "post",
  "put",
  "delete",
  "options",
  "patch",
  "query"
];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class Hono2 {
  static {
    __name(this, "Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    [...METHODS, "all"].forEach((method) => {
      this[method] = (args1, ...args) => {
        const methodName = method.toUpperCase();
        if (typeof args1 === "string") this.#path = args1;
        else this.#addRoute(methodName, this.#path, args1);
        args.forEach((handler) => {
          this.#addRoute(methodName, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          const methodName = m.toUpperCase();
          for (const handler of handlers) this.#addRoute(methodName, this.#path, handler);
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") this.#path = arg1;
      else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute("ALL", this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono2({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  /**
  * `.route()` allows grouping other Hono instance in routes.
  *
  * @see {@link https://hono.dev/docs/api/routing#grouping}
  *
  * @param {string} path - base Path
  * @param {Hono} app - other Hono instance
  * @returns {Hono} routed Hono instance
  *
  * @example
  * ```ts
  * const app = new Hono()
  * const app2 = new Hono()
  *
  * app2.get("/user", (c) => c.text("user"))
  * app.route("/api", app2) // GET /api/user
  * ```
  */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) handler = r.handler;
      else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
  * `.basePath()` allows base paths to be specified.
  *
  * @see {@link https://hono.dev/docs/api/routing#base-path}
  *
  * @param {string} path - base Path
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * const api = new Hono().basePath('/api')
  * ```
  */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
  * `.onError()` handles an error and returns a customized Response.
  *
  * @see {@link https://hono.dev/docs/api/hono#error-handling}
  *
  * @param {ErrorHandler} handler - request Handler for error
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * app.onError((err, c) => {
  *   console.error(`${err}`)
  *   return c.text('Custom Error Message', 500)
  * })
  * ```
  */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
  * `.notFound()` allows you to customize a Not Found Response.
  *
  * @see {@link https://hono.dev/docs/api/hono#not-found}
  *
  * @param {NotFoundHandler} handler - request handler for not-found
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * app.notFound((c) => {
  *   return c.text('Custom 404 Message', 404)
  * })
  * ```
  */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
  * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
  *
  * @deprecated Use `mount()` from `hono/mount` instead. `.mount()` will be removed in v5.
  *
  * @see {@link https://hono.dev/docs/api/hono#mount}
  *
  * @param {string} path - base Path
  * @param {Function} applicationHandler - other Request Handler
  * @param {MountOptions} [options] - options of `.mount()`
  * @returns {Hono} mounted Hono instance
  *
  * @example
  * ```ts
  * import { Router as IttyRouter } from 'itty-router'
  * import { Hono } from 'hono'
  * // Create itty-router application
  * const ittyRouter = IttyRouter()
  * // GET /itty-router/hello
  * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
  *
  * const app = new Hono()
  * app.mount('/itty-router', ittyRouter.handle)
  * ```
  *
  * @example
  * ```ts
  * const app = new Hono()
  * // Send the request to another application without modification.
  * app.mount('/app', anotherApp, {
  *   replaceRequest: (req) => req,
  * })
  * ```
  */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") optionHandler = options;
      else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        else replaceRequest = options.replaceRequest;
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) return res;
      await next();
    }, "handler");
    this.#addRoute("ALL", mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) return this.errorHandler(err, c);
    throw err;
  }
  #dispatch(request, executionCtx, env2, method) {
    if (method === "HEAD") return (async () => new Response(null, await this.#dispatch(request, executionCtx, env2, "GET")))();
    const path = this.getPath(request, { env: env2 });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env: env2,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then((resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
  * `.fetch()` will be entry point of your app.
  *
  * @see {@link https://hono.dev/docs/api/hono#fetch}
  *
  * @param {Request} request - request Object of request
  * @param {Env} env - env Object
  * @param {ExecutionContext} executionCtx - context of execution
  * @returns {Response | Promise<Response>} response of request
  *
  */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
  * `.request()` is a useful method for testing.
  * You can pass a URL or pathname to send a GET request.
  * app will return a Response object.
  * ```ts
  * test('GET /hello is ok', async () => {
  *   const res = await app.request('/hello')
  *   expect(res.status).toBe(200)
  * })
  * ```
  * @see https://hono.dev/docs/api/hono#request
  */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    input = input.toString();
    return this.fetch(new Request(/^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`, requestInit), Env, executionCtx);
  }, "request");
  /**
  * `.fire()` automatically adds a global fetch event listener.
  * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
  * @deprecated
  * Use `fire` from `hono/service-worker` instead.
  * ```ts
  * import { Hono } from 'hono'
  * import { fire } from 'hono/service-worker'
  *
  * const app = new Hono()
  * // ...
  * fire(app)
  * ```
  * @see https://hono.dev/docs/api/hono#fire
  * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
  * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
  */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/utils.js
var createNullObject = /* @__PURE__ */ __name(() => /* @__PURE__ */ Object.create(null), "createNullObject");

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers["ALL"];
    const staticMatch = matcher[2][path2];
    if (staticMatch) return staticMatch;
    const match3 = path2.match(matcher[0]);
    if (!match3) return [[], emptyParam];
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = /* @__PURE__ */ new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) return b.length === 1 ? a < b ? -1 : 1 : -1;
  if (b.length === 1) return 1;
  if (a === ".*" || a === "(?:|/.*)") return b === "(?:|/.*)" ? -1 : 1;
  else if (b === ".*" || b === "(?:|/.*)") return -1;
  if (a === "[^/]+") return 1;
  else if (b === "[^/]+") return -1;
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class Node2 {
  static {
    __name(this, "Node");
  }
  #index;
  #varIndex;
  #children = createNullObject();
  insert(tokens, index, paramMap, context, isStatic) {
    let node = this;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const token = tokens[i];
      const pattern = token.length === 1 ? token === "*" ? i === len - 1 ? [
        "",
        "",
        ".*"
      ] : [
        "",
        "",
        LABEL_REG_EXP_STR
      ] : null : token === "/*" ? [
        "",
        "",
        TAIL_WILDCARD_REG_EXP_STR
      ] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name = pattern[1];
        let regexpStr = pattern[2] || "[^/]+";
        if (name && pattern[2]) {
          if (regexpStr === ".*") throw PATH_ERROR;
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr)) throw PATH_ERROR;
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr)) throw PATH_ERROR;
        }
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== ".*" && regexpStr !== "(?:|/.*)") {
            for (const k in node.#children) if ((regexpStr.length > 1 || k.length > 1) && k !== ".*" && k !== "(?:|/.*)") throw PATH_ERROR;
          }
          nextNode = node.#children[regexpStr] = new Node2();
        }
        if (name !== "") {
          nextNode.#varIndex ??= context.varIndex++;
          paramMap.push([name, nextNode.#varIndex]);
        }
      } else {
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children) if (k.length > 1 && k !== ".*" && k !== "(?:|/.*)") throw PATH_ERROR;
          nextNode = node.#children[token] = new Node2();
        }
      }
      node = nextNode;
    }
    if (node.#index !== void 0) throw PATH_ERROR;
    node.#index = isStatic ? -1 : index;
  }
  buildRegExpStr() {
    const strList = Object.keys(this.#children).sort(compareKey).map((k) => {
      const c = this.#children[k];
      const childStr = c.buildRegExpStr();
      return childStr === "" ? "" : (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1) strList.unshift(`#${this.#index}`);
    if (strList.length === 0) return "";
    if (strList.length === 1) return strList[0];
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  #index = 0;
  paths = createNullObject();
  insert(path, isStatic) {
    if (isStatic) {
      this.#root.insert(path.split(""), 0, [], this.#context, true);
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path;
    for (let i = 0; ; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) break;
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) if (tokens[j].indexOf(mark) !== -1) {
        tokens[j] = tokens[j].replace(mark, groups[i][1]);
        break;
      }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, false);
    this.paths[path] = [this.#index++, paramAssoc];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") return [
      /^$/,
      [],
      []
    ];
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [
      new RegExp(`^${regexp}`),
      indexReplacementMap,
      paramReplacementMap
    ];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var wildcardRegExpCache = createNullObject();
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(`^${path.replace(/\/:[^/{}]+(?:\{\[\^\/]\+})?(?=[/{]|$)|\/?\*$|([.\\+*[^\]$()?{}|])/g, (match2, metaChar) => metaChar ? `\\${metaChar}` : match2 === "/*" ? TAIL_WILDCARD_REG_EXP_STR : match2 === "*" ? ".*" : `/:${LABEL_REG_EXP_STR}`)}$`);
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function findMiddleware(middleware, path) {
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) if (buildWildcardRegExp(k).test(path)) return [...middleware[k]];
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  #tries;
  constructor() {
    this.#middleware = { ["ALL"]: createNullObject() };
    this.#routes = { ["ALL"]: createNullObject() };
    this.#tries = { ["ALL"]: new Trie() };
  }
  #insertPath(method, path) {
    try {
      this.#tries[method].insert(path, !/\*|\/:/.test(path));
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware) throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    if (!middleware[method]) {
      this.#tries[method] = new Trie();
      for (const handlerMap of [middleware, routes]) {
        handlerMap[method] = createNullObject();
        for (const p in handlerMap["ALL"]) {
          handlerMap[method][p] = [...handlerMap["ALL"][p]];
          this.#insertPath(method, p);
        }
      }
    }
    if (path === "/*") path = "*";
    const methods = method === "ALL" ? Object.keys(middleware) : [method];
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      for (const m of methods) if (!middleware[m][path]) {
        this.#insertPath(m, path);
        middleware[m][path] = findMiddleware(middleware[m], path) || findMiddleware(middleware["ALL"], path) || [];
      }
      for (const handlerMap of [middleware, routes]) for (const m of methods) for (const p in handlerMap[m]) re.test(p) && handlerMap[m][p].push([handler, path]);
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (const path2 of paths) for (const m of methods) {
      if (!routes[m][path2]) {
        this.#insertPath(m, path2);
        routes[m][path2] = findMiddleware(middleware[m], path2) || findMiddleware(middleware["ALL"], path2) || [];
      }
      routes[m][path2].push([handler, path2]);
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = createNullObject();
    for (const method of Object.keys(this.#routes)) matchers[method] = this.#buildMatcher(method);
    this.#middleware = this.#routes = this.#tries = void 0;
    wildcardRegExpCache = createNullObject();
    return matchers;
  }
  #buildMatcher(method) {
    const middleware = this.#middleware[method];
    const routes = this.#routes[method];
    const trie = this.#tries[method];
    const staticMap = createNullObject();
    const handlerData = [];
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for (const r of [middleware, routes]) for (const path in r) {
      const handlers = r[path];
      const pathData = trie.paths[path];
      if (!pathData) {
        staticMap[path] = [handlers.map(([h]) => [h, createNullObject()]), emptyParam];
        continue;
      }
      handlerData[pathData[0]] = handlers.map(([h, handlerPath]) => [h, trie.paths[handlerPath][1].reduceRight((map, [key], i) => {
        map[key] = paramReplacementMap[pathData[1][i][1]];
        return map;
      }, createNullObject())]);
    }
    return [
      regexp,
      indexReplacementMap.map((i) => handlerData[i]),
      staticMap
    ];
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    this.#routes.push([
      method,
      path,
      handler
    ]);
  }
  match(method, path) {
    if (!this.#routes) throw new Error("Fatal error");
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) router.add(...routes[i2]);
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) continue;
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) throw new Error("Fatal error");
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) throw new Error("No active router has been determined yet.");
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = createNullObject();
var order = 0;
var Node3 = class Node4 {
  static {
    __name(this, "Node");
  }
  #methods = [];
  #children = createNullObject();
  #patterns = [];
  #pattern;
  #params = emptyParams;
  insert(method, path, handler) {
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = /* @__PURE__ */ new Set();
    let i = 0;
    for (const p of parts) {
      const nextP = parts[++i];
      const pattern = getPattern(p, nextP) || (nextP === void 0 && p && p.indexOf("*") === p.length - 1 ? p : null);
      const isParam = Array.isArray(pattern);
      const key = isParam ? pattern[0] : pattern || p;
      const child = curNode.#children[key] ||= new Node4();
      if (pattern && !child.#pattern) {
        child.#pattern = pattern;
        curNode.#patterns.push(child);
      }
      curNode = child;
      if (isParam) possibleKeys.add(pattern[1]);
    }
    curNode.#methods.push({ [method]: {
      handler,
      possibleKeys: [...possibleKeys],
      score: ++order
    } });
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m["ALL"];
      if (handlerSet) {
        handlerSet.params = createNullObject();
        handlerSets.push(handlerSet);
        for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
          const key = handlerSet.possibleKeys[i2];
          handlerSet.params[key] = params?.[key] && !i2 ? params[key] : nodeParams[key] ?? params?.[key];
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    let curNodes = [this];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else tempNodes.push(nextNode);
        }
        for (const child of node.#patterns) {
          const pattern = child.#pattern;
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (typeof pattern === "string") {
            if (pattern === "*" || part.startsWith(pattern.slice(0, -1))) {
              this.#pushHandlerSets(handlerSets, child, method, node.#params);
              if (pattern === "*") {
                child.#params = params;
                tempNodes.push(child);
              }
            }
            continue;
          }
          const [, name, matcher] = pattern;
          if (!part && matcher === true) continue;
          if (matcher !== true) {
            if (!partOffsets) {
              partOffsets = [];
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.slice(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"]) this.#pushHandlerSets(handlerSets, child.#children["*"], method, node.#params, params);
              for (const _ in child.#children) {
                child.#params = params;
                const componentCount = m[0].match(/\//g)?.length ?? 0;
                (curNodesQueue[componentCount] ||= []).push(child);
                break;
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) this.#pushHandlerSets(handlerSets, child.#children["*"], method, params, node.#params);
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets[1]) handlerSets.sort((a, b) => {
      return a.score - b.score;
    });
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node = new Node3();
  add(method, path, handler) {
    for (const result of checkOptionalParameter(path) || [path]) this.#node.insert(method, result, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono3 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
  * Creates an instance of the Hono class.
  *
  * @param options - Optional configuration options for the Hono instance.
  */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({ routers: [new RegExpRouter(), new TrieRouter()] });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const opts = {
    origin: "*",
    allowMethods: [
      "GET",
      "HEAD",
      "PUT",
      "POST",
      "DELETE",
      "PATCH",
      "QUERY"
    ],
    allowHeaders: [],
    exposeHeaders: [],
    ...options
  };
  const exposeHeadersStr = opts.exposeHeaders?.length ? opts.exposeHeaders.join(",") : void 0;
  const allowHeadersStr = opts.allowHeaders?.length ? opts.allowHeaders.join(",") : void 0;
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") return () => optsOrigin;
      else return (origin) => optsOrigin === origin ? origin : null;
    } else if (typeof optsOrigin === "function") return optsOrigin;
    else return (origin) => optsOrigin.includes(origin) ? origin : null;
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") return async (origin, c) => (await optsAllowMethods(origin, c)).join(",");
    else if (Array.isArray(optsAllowMethods)) {
      const methodsStr = optsAllowMethods.join(",");
      return () => methodsStr;
    } else return () => "";
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) set("Access-Control-Allow-Origin", allowOrigin);
    if (opts.credentials) set("Access-Control-Allow-Credentials", "true");
    if (exposeHeadersStr) set("Access-Control-Expose-Headers", exposeHeadersStr);
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") c.res.headers.append("Vary", "Origin");
      if (opts.maxAge != null) set("Access-Control-Max-Age", opts.maxAge.toString());
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods) set("Access-Control-Allow-Methods", allowMethods);
      let headersStr = allowHeadersStr;
      if (!headersStr) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) headersStr = requestHeaders.split(",").map((h) => h.trim()).join(",");
      }
      if (headersStr) {
        set("Access-Control-Allow-Headers", headersStr);
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") c.header("Vary", "Origin", { append: true });
  }, "cors");
}, "cors");

// worker/index.js
var app = new Hono3();
app.use("/api/*", cors({ origin: "*" }));
var ipRateLimit = /* @__PURE__ */ new Map();
var BLOCKED_BOT_AGENTS = [
  "sqlmap",
  "nikto",
  "w3af",
  "acunetix",
  "masscan",
  "nmap",
  "zgrab",
  "python-requests",
  "aiohttp",
  "scrapy",
  "urllib",
  "curl",
  "wget",
  "go-http-client"
];
app.use("/api/*", async (c, next) => {
  const userAgent = (c.req.header("user-agent") || "").toLowerCase();
  const isMaliciousBot = BLOCKED_BOT_AGENTS.some((bot) => userAgent.includes(bot));
  if (isMaliciousBot) {
    return c.json({
      success: false,
      code: "BOT_ACCESS_DENIED",
      message: "Truy c\u1EADp b\u1ECB t\u1EEB ch\u1ED1i: Ph\xE1t hi\u1EC7n y\xEAu c\u1EA7u t\u1EF1 \u0111\u1ED9ng kh\xF4ng h\u1EE3p l\u1EC7."
    }, 403);
  }
  const clientIp = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "127.0.0.1";
  if (clientIp !== "127.0.0.1" && clientIp !== "localhost") {
    const now = Date.now();
    const record = ipRateLimit.get(clientIp) || { count: 0, resetAt: now + 6e4 };
    if (now > record.resetAt) {
      record.count = 1;
      record.resetAt = now + 6e4;
    } else {
      record.count += 1;
    }
    ipRateLimit.set(clientIp, record);
    if (ipRateLimit.size > 2e3) {
      for (const [key, val] of ipRateLimit.entries()) {
        if (now > val.resetAt) ipRateLimit.delete(key);
      }
    }
    if (record.count > 80) {
      return c.json({
        success: false,
        code: "RATE_LIMIT_EXCEEDED",
        message: "T\u1EA7n su\u1EA5t thao t\xE1c qu\xE1 nhanh. Vui l\xF2ng th\u1EED l\u1EA1i sau 1 ph\xFAt \u0111\u1EC3 b\u1EA3o v\u1EC7 h\u1EC7 th\u1ED1ng!"
      }, 429);
    }
  }
  await next();
  c.res.headers.set("X-Content-Type-Options", "nosniff");
  c.res.headers.set("X-Frame-Options", "SAMEORIGIN");
  c.res.headers.set("X-XSS-Protection", "1; mode=block");
  c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  c.res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  c.res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
});
var SEO_SLUG_MAP = {
  "/": {
    title: "OMNI ASSETS - H\u1EC7 Th\u1ED1ng Qu\u1EA3n L\xFD T\xE0i S\u1EA3n & V\u1EADn H\xE0nh Doanh Nghi\u1EC7p",
    description: "N\u1EC1n t\u1EA3ng s\u1ED1 h\xF3a qu\u1EA3n tr\u1ECB t\xE0i s\u1EA3n, trang thi\u1EBFt b\u1ECB, t\xE0i ch\xEDnh doanh thu, h\u1EE3p \u0111\u1ED3ng bi\xEAn b\u1EA3n, ch\u1EA5m c\xF4ng nh\xE2n s\u1EF1 v\xE0 t\u1EF1 \u0111\u1ED9ng nh\u1EAFc h\u1EA1n th\xF4ng minh cho doanh nghi\u1EC7p."
  },
  "/tong-quan": {
    title: "T\u1ED5ng Quan V\u1EADn H\xE0nh & Ch\u1EC9 S\u1ED1 Doanh Nghi\u1EC7p | OMNI ASSETS",
    description: "B\xE1o c\xE1o ch\u1EC9 s\u1ED1 \u0111i\u1EC1u h\xE0nh, bi\u1EC3u \u0111\u1ED3 t\xE0i ch\xEDnh, ki\u1EC3m so\xE1t t\xE0i s\u1EA3n v\xE0 d\xF2ng ti\u1EC1n doanh nghi\u1EC7p th\u1EDDi gian th\u1EF1c."
  },
  "/tai-san": {
    title: "Qu\u1EA3n L\xFD T\xE0i S\u1EA3n & Trang Thi\u1EBFt B\u1ECB Doanh Nghi\u1EC7p | OMNI ASSETS",
    description: "Theo d\xF5i, ph\xE2n b\u1ED5, kh\u1EA5u hao, ki\u1EC3m k\xEA t\xECnh tr\u1EA1ng v\xE0 b\xE0n giao t\xE0i s\u1EA3n thi\u1EBFt b\u1ECB doanh nghi\u1EC7p t\u1EADp trung."
  },
  "/tai-chinh": {
    title: "B\xE1o C\xE1o Doanh Thu & D\xF2ng Ti\u1EC1n Doanh Nghi\u1EC7p | OMNI ASSETS",
    description: "Qu\u1EA3n l\xFD thu chi, h\xF3a \u0111\u01A1n, d\xF2ng ti\u1EC1n v\xE0 ph\xE2n t\xEDch l\u1EE3i nhu\u1EADn doanh nghi\u1EC7p minh b\u1EA1ch v\xE0 tr\u1EF1c quan."
  },
  "/cong-viec": {
    title: "Qu\u1EA3n L\xFD C\xF4ng Vi\u1EC7c & Nh\u1EAFc H\u1EA1n T\u1EF1 \u0110\u1ED9ng 6:00 AM | OMNI ASSETS",
    description: "Giao vi\u1EC7c ph\xF2ng ban, ki\u1EC3m so\xE1t ti\u1EBFn \u0111\u1ED9, h\u1EA1n ch\xF3t v\xE0 c\u01A1 ch\u1EBF t\u1EF1 \u0111\u1ED9ng g\u1EEDi c\u1EA3nh b\xE1o nh\u1EAFc nh\u1EDF m\u1ED7i s\xE1ng."
  },
  "/hop-dong": {
    title: "Qu\u1EA3n L\xFD H\u1EE3p \u0110\u1ED3ng & Bi\xEAn B\u1EA3n B\xE0n Giao Th\xF4ng Minh | OMNI ASSETS",
    description: "L\u01B0u tr\u1EEF, theo d\xF5i ph\u1EE5 l\u1EE5c h\u1EE3p \u0111\u1ED3ng, \u0111i\u1EC1u kho\u1EA3n thanh to\xE1n, bi\xEAn b\u1EA3n nghi\u1EC7m thu v\xE0 AI t\u1EF1 \u0111\u1ED9ng so\u1EA1n th\u1EA3o."
  },
  "/cham-cong": {
    title: "H\u1EC7 Th\u1ED1ng Ch\u1EA5m C\xF4ng & Qu\u1EA3n L\xFD Ca L\xE0m Vi\u1EC7c | OMNI ASSETS",
    description: "Ch\u1EA5m c\xF4ng tr\u1EF1c tuy\u1EBFn 1 l\u1EA7n/ng\xE0y, ch\u1ED1ng gian l\u1EADn, t\xEDnh c\xF4ng t\u1EF1 \u0111\u1ED9ng v\xE0 b\xE1o c\xE1o chuy\xEAn c\u1EA7n nh\xE2n s\u1EF1."
  },
  "/nhan-su": {
    title: "Qu\u1EA3n L\xFD Nh\xE2n S\u1EF1 & Ph\xE2n Quy\u1EC1n Ph\xF2ng Ban | OMNI ASSETS",
    description: "H\u1ED3 s\u01A1 nh\xE2n vi\xEAn, g\u1EAFn k\u1EBFt ph\xF2ng ban, ph\xE2n quy\u1EC1n b\u1EA3o m\u1EADt nhi\u1EC1u c\u1EA5p Admin, Manager, Staff."
  },
  "/danh-muc": {
    title: "Qu\u1EA3n L\xFD Danh M\u1EE5c H\u1EC7 Th\u1ED1ng \u0110\u1ED9ng | OMNI ASSETS",
    description: "T\u1EF1 do thi\u1EBFt l\u1EADp ph\xF2ng ban, nh\xF3m t\xE0i s\u1EA3n, danh m\u1EE5c thu chi v\xE0 c\u1EA5u h\xECnh h\u1EC7 th\u1ED1ng linh ho\u1EA1t."
  },
  "/cai-dat": {
    title: "C\xE0i \u0110\u1EB7t H\u1EC7 Th\u1ED1ng & \u0110\u1ED3ng B\u1ED9 D\u1EEF Li\u1EC7u Cloudflare | OMNI ASSETS",
    description: "C\u1EA5u h\xECnh quy chu\u1EA9n ch\u1EA5m c\xF4ng, ca l\xE0m vi\u1EC7c, th\xF4ng tin ph\xE1p nh\xE2n v\xE0 \u0111\u1ED3ng b\u1ED9 d\u1EEF li\u1EC7u th\u1EDDi gian th\u1EF1c."
  },
  "/quan-tri-tong": {
    title: "C\u1ED5ng Qu\u1EA3n Tr\u1ECB N\u1EC1n T\u1EA3ng T\u1ED1i Cao (Master Admin) | OMNI ASSETS",
    description: "C\u1EA5p quy\u1EC1n b\u1EA3n quy\u1EC1n doanh nghi\u1EC7p, qu\u1EA3n l\xFD c\xE1c g\xF3i c\u01B0\u1EDBc 1 n\u0103m, v\u0129nh vi\u1EC5n, d\xF9ng th\u1EED v\xE0 th\u1ED1ng k\xEA doanh thu."
  }
};
function generateSeoHtml(path, origin) {
  const cleanPath = path.toLowerCase().replace(/\/+$/, "") || "/";
  const meta = SEO_SLUG_MAP[cleanPath] || SEO_SLUG_MAP["/"];
  const canonicalUrl = `${origin}${cleanPath === "/" ? "" : cleanPath}`;
  const logoUrl = `${origin}/logo.png`;
  const bannerUrl = `${origin}/og-image.jpg`;
  return `<!doctype html>
<html lang="vi" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${meta.title}</title>
  <meta name="title" content="${meta.title}" />
  <meta name="description" content="${meta.description}" />
  <meta name="keywords" content="omni assets, qu\u1EA3n l\xFD t\xE0i s\u1EA3n, qu\u1EA3n l\xFD doanh nghi\u1EC7p, ph\u1EA7n m\u1EC1m qu\u1EA3n l\xFD thi\u1EBFt b\u1ECB, qu\u1EA3n l\xFD h\u1EE3p \u0111\u1ED3ng, ch\u1EA5m c\xF4ng nh\xE2n s\u1EF1" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${canonicalUrl}" />

  <!-- Open Graph for Facebook, Zalo, Messenger, Telegram, LinkedIn, Skype -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="OMNI ASSETS" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:title" content="${meta.title}" />
  <meta property="og:description" content="${meta.description}" />
  <meta property="og:locale" content="vi_VN" />

  <!-- Primary Logo for Social Share -->
  <meta property="og:image" content="${logoUrl}" />
  <meta property="og:image:secure_url" content="${logoUrl}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1024" />
  <meta property="og:image:height" content="1024" />
  <meta property="og:image:alt" content="Logo OMNI ASSETS" />

  <!-- High-Res 16:9 Banner -->
  <meta property="og:image" content="${bannerUrl}" />
  <meta property="og:image:secure_url" content="${bannerUrl}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="675" />

  <!-- Twitter / X Cards -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${meta.title}" />
  <meta name="twitter:description" content="${meta.description}" />
  <meta name="twitter:image" content="${bannerUrl}" />
</head>
<body style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; text-align: center;">
  <img src="${logoUrl}" alt="OMNI ASSETS Logo" style="width: 120px; height: 120px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); margin-bottom: 24px;" />
  <h1 style="font-size: 24px; margin-bottom: 12px;">${meta.title}</h1>
  <p style="font-size: 15px; color: #94a3b8; max-width: 600px; margin: 0 auto 24px;">${meta.description}</p>
  <a href="${canonicalUrl}" style="display: inline-block; background: #6366f1; color: #fff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold;">Truy C\u1EADp N\u1EC1n T\u1EA3ng OMNI ASSETS</a>
</body>
</html>`;
}
__name(generateSeoHtml, "generateSeoHtml");
app.use("*", async (c, next) => {
  const url = new URL(c.req.url);
  const path = url.pathname.toLowerCase();
  if (path.startsWith("/api")) {
    return next();
  }
  if (path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|json|xml|txt)$/)) {
    return next();
  }
  const userAgent = (c.req.header("user-agent") || "").toLowerCase();
  const isSocialCrawler = /facebookexternalhit|zalo|twitterbot|linkedinbot|telegrambot|skypeuripreview|whatsapp|slackbot|discordbot|googlebot|bingbot|applebot/i.test(userAgent);
  if (isSocialCrawler) {
    return c.html(generateSeoHtml(path, url.origin));
  }
  if (c.env?.ASSETS) {
    try {
      const indexReq = new Request(new URL("/index.html", c.req.url));
      const indexRes = await c.env.ASSETS.fetch(indexReq);
      if (indexRes && indexRes.status === 200) {
        return indexRes;
      }
    } catch (_) {
    }
  }
  return next();
});
async function getTenantContext(c) {
  let companyId = c.req.header("x-company-id");
  const userId = c.req.header("x-user-id");
  const userRole = c.req.header("x-user-role");
  if (userRole === "SUPER_ADMIN") {
    return {
      companyId: companyId && companyId !== "SYSTEM" && companyId !== "ALL" ? companyId : "ALL",
      isSuperAdmin: true,
      userId
    };
  }
  if (!companyId || companyId === "undefined" || companyId === "null") {
    if (userId) {
      const u = await c.env.DB.prepare("SELECT company_id, role FROM users WHERE id = ?").bind(userId).first().catch(() => null);
      if (u?.role === "SUPER_ADMIN") {
        return { companyId: "ALL", isSuperAdmin: true, userId };
      }
      companyId = u?.company_id;
    }
  }
  if (!companyId || companyId === "undefined" || companyId === "null") {
    companyId = "comp_1";
  }
  return {
    companyId,
    isSuperAdmin: false,
    userId
  };
}
__name(getTenantContext, "getTenantContext");
var SENDER_MAILBOXES = {
  notifications: {
    key: "notifications",
    email: "notifications@omniassets.ryug.id.vn",
    label: "Th\xF4ng b\xE1o chung t\u1EEB h\u1EC7 th\u1ED1ng",
    owner: "SUPER_ADMIN",
    replyTo: "hieupham101097@gmail.com",
    defaultSenderName: "OMNI ASSETS (H\u1EC7 Th\u1ED1ng)"
  },
  support: {
    key: "support",
    email: "support@omniassets.ryug.id.vn",
    label: "Th\u01B0 h\u1ED7 tr\u1EE3 kh\xE1ch h\xE0ng",
    owner: "SUPER_ADMIN",
    replyTo: "hieupham101097@gmail.com",
    defaultSenderName: "OMNI ASSETS Support"
  },
  attendance: {
    key: "attendance",
    email: "attendance@omniassets.ryug.id.vn",
    label: "Ch\u1EA5m c\xF4ng, \u0111i tr\u1EC5, thi\u1EBFu c\xF4ng",
    owner: "TENANT",
    subLabel: "Ch\u1EA5m C\xF4ng"
  },
  tasks: {
    key: "tasks",
    email: "tasks@omniassets.ryug.id.vn",
    label: "Giao vi\u1EC7c, nh\u1EAFc h\u1EA1n, qu\xE1 h\u1EA1n",
    owner: "TENANT",
    subLabel: "Qu\u1EA3n L\xFD C\xF4ng Vi\u1EC7c"
  },
  assets: {
    key: "assets",
    email: "assets@omniassets.ryug.id.vn",
    label: "K\xEA khai, ki\u1EC3m k\xEA v\xE0 b\xE0n giao t\xE0i s\u1EA3n",
    owner: "TENANT",
    subLabel: "Qu\u1EA3n L\xFD T\xE0i S\u1EA3n"
  },
  contracts: {
    key: "contracts",
    email: "contracts@omniassets.ryug.id.vn",
    label: "H\u1EE3p \u0111\u1ED3ng s\u1EAFp h\u1EBFt h\u1EA1n",
    owner: "TENANT",
    subLabel: "Qu\u1EA3n L\xFD H\u1EE3p \u0110\u1ED3ng"
  },
  reports: {
    key: "reports",
    email: "reports@omniassets.ryug.id.vn",
    label: "B\xE1o c\xE1o \u0111\u1ECBnh k\u1EF3",
    owner: "TENANT",
    subLabel: "B\xE1o C\xE1o \u0110\u1ECBnh K\u1EF3"
  }
};
async function getEmailConfig(db, companyId) {
  let mailProvider = "resend";
  let mailApiKey = typeof env !== "undefined" && env?.RESEND_API_KEY || "";
  let mailSenderName = "OMNIASSETS";
  let mailSenderEmail = "support@omniassets.ryug.id.vn";
  let mailReplyTo = "hieupham101097@gmail.com";
  let mailSupportInbox = "hieupham101097@gmail.com";
  let mailReportRecipients = "";
  let mailNotifyNewUser = "true";
  let mailNotifyReminders = "true";
  let mailNotifyTimesheet = "true";
  let compName = "OMNI ASSETS & LOGISTICS";
  let compEmail = "";
  try {
    const sysSettings = await db.prepare("SELECT key, value FROM system_settings WHERE key LIKE 'mail_%'").all().catch(() => ({ results: [] }));
    (sysSettings.results || []).forEach((r) => {
      if (r.key === "mail_provider" && r.value) mailProvider = r.value;
      if (r.key === "mail_api_key" && r.value) mailApiKey = r.value;
      if (r.key === "mail_sender_name" && r.value) mailSenderName = r.value;
      if (r.key === "mail_sender_email" && r.value) mailSenderEmail = r.value;
      if (r.key === "mail_reply_to" && r.value) mailReplyTo = r.value;
      if (r.key === "mail_support_inbox" && r.value) mailSupportInbox = r.value;
      if (r.key === "mail_report_recipients" && r.value) mailReportRecipients = r.value;
      if (r.key === "mail_notify_new_user" && r.value) mailNotifyNewUser = r.value;
      if (r.key === "mail_notify_reminders" && r.value) mailNotifyReminders = r.value;
      if (r.key === "mail_notify_timesheet" && r.value) mailNotifyTimesheet = r.value;
    });
    if (companyId && companyId !== "ALL" && companyId !== "SYSTEM") {
      const compTenant = await db.prepare("SELECT company_name, admin_email FROM company_tenants WHERE id = ?").bind(companyId).first().catch(() => null);
      if (compTenant) {
        if (compTenant.company_name) compName = compTenant.company_name;
        if (compTenant.admin_email) compEmail = compTenant.admin_email;
      }
      const compSettings = await db.prepare("SELECT key, value FROM company_settings WHERE company_id = ? AND (key LIKE 'mail_%' OR key = 'company_email' OR key = 'company_name')").bind(companyId).all().catch(() => ({ results: [] }));
      (compSettings.results || []).forEach((r) => {
        if (r.key === "company_name" && r.value) compName = r.value;
        if (r.key === "company_email" && r.value) compEmail = r.value;
        if (r.key === "mail_provider" && r.value) mailProvider = r.value;
        if (r.key === "mail_api_key" && r.value) mailApiKey = r.value;
        if (r.key === "mail_sender_name" && r.value) mailSenderName = r.value;
        if (r.key === "mail_sender_email" && r.value) mailSenderEmail = r.value;
        if (r.key === "mail_reply_to" && r.value) {
          mailReplyTo = r.value;
          compEmail = r.value;
        }
        if (r.key === "mail_report_recipients" && r.value) mailReportRecipients = r.value;
        if (r.key === "mail_notify_new_user" && r.value) mailNotifyNewUser = r.value;
        if (r.key === "mail_notify_reminders" && r.value) mailNotifyReminders = r.value;
        if (r.key === "mail_notify_timesheet" && r.value) mailNotifyTimesheet = r.value;
      });
    }
  } catch (err) {
    console.error("Error getEmailConfig:", err);
  }
  return {
    provider: (mailProvider || "resend").toLowerCase().trim(),
    apiKey: mailApiKey.trim(),
    senderName: mailSenderName ? mailSenderName.trim() : "OMNIASSETS",
    senderEmail: mailSenderEmail ? mailSenderEmail.trim() : "support@omniassets.ryug.id.vn",
    replyTo: mailReplyTo ? mailReplyTo.trim() : "hieupham101097@gmail.com",
    supportInbox: mailSupportInbox ? mailSupportInbox.trim() : "hieupham101097@gmail.com",
    reportRecipients: mailReportRecipients ? mailReportRecipients.trim() : "",
    notifyNewUser: mailNotifyNewUser !== "false",
    notifyReminders: mailNotifyReminders !== "false",
    notifyTimesheet: mailNotifyTimesheet !== "false",
    companyName: compName,
    companyEmail: compEmail || mailReplyTo
  };
}
__name(getEmailConfig, "getEmailConfig");
async function sendEmail({ db, companyId, to, subject, html, text, replyTo, senderType = "notifications", senderName }) {
  const config = await getEmailConfig(db, companyId);
  const toList = (Array.isArray(to) ? to : [to]).map((e) => typeof e === "string" ? e.trim() : "").filter(Boolean);
  if (toList.length === 0) {
    throw new Error("Ch\u01B0a cung c\u1EA5p \u0111\u1ECBa ch\u1EC9 email ng\u01B0\u1EDDi nh\u1EADn h\u1EE3p l\u1EC7");
  }
  if (!config.apiKey) {
    throw new Error("Ch\u01B0a c\u1EA5u h\xECnh API Key d\u1ECBch v\u1EE5 g\u1EEDi mail");
  }
  const mailbox = SENDER_MAILBOXES[senderType] || SENDER_MAILBOXES.notifications;
  const isPlatform = mailbox.owner === "SUPER_ADMIN" || !companyId || companyId === "SYSTEM";
  let finalSenderEmail = mailbox.email || "support@omniassets.ryug.id.vn";
  let finalSenderName = senderName || "";
  if (!finalSenderName) {
    if (mailbox.owner === "SUPER_ADMIN") {
      finalSenderName = mailbox.defaultSenderName || config.senderName || "OMNI ASSETS";
    } else {
      const prefix = config.companyName || "OMNI ASSETS";
      finalSenderName = `${prefix} (${mailbox.subLabel || "H\u1EC7 Th\u1ED1ng"})`;
    }
  }
  let effectiveReplyTo = replyTo;
  if (!effectiveReplyTo) {
    if (isPlatform || mailbox.key === "notifications" || mailbox.key === "support") {
      effectiveReplyTo = "hieupham101097@gmail.com";
    } else {
      effectiveReplyTo = config.companyEmail || config.replyTo;
      if (!effectiveReplyTo || effectiveReplyTo === "hieupham101097@gmail.com") {
        effectiveReplyTo = `contact@${mailbox.email.split("@")[1]}`;
      }
    }
  }
  if (config.provider === "brevo") {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": config.apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        sender: {
          name: finalSenderName,
          email: finalSenderEmail
        },
        replyTo: { email: effectiveReplyTo },
        to: toList.map((e) => ({ email: e })),
        subject,
        htmlContent: html,
        textContent: text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      })
    });
    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(resData.message || resData.error || `L\u1ED7i Brevo API (${res.status})`);
    }
    return { success: true, provider: "brevo", messageId: resData.messageId, mailbox: mailbox.key, from: finalSenderEmail, replyTo: effectiveReplyTo };
  } else {
    const fromAddress = `${finalSenderName} <${finalSenderEmail}>`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromAddress,
        to: toList,
        reply_to: effectiveReplyTo,
        subject,
        html,
        text: text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      })
    });
    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = resData.message || resData.error?.message || `L\u1ED7i Resend API (${res.status})`;
      throw new Error(errMsg);
    }
    return { success: true, provider: "resend", id: resData.id, mailbox: mailbox.key, from: finalSenderEmail, replyTo: effectiveReplyTo };
  }
}
__name(sendEmail, "sendEmail");
function wrapEmailHtml({ title, preheader = "", contentHtml, ctaText = null, ctaUrl = null, footerNote = "" }) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      line-height: 1.6;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 30px 12px;
      box-sizing: border-box;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 4px 12px -2px rgba(0, 0, 0, 0.02);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #064e3b 0%, #065f46 45%, #047857 100%);
      padding: 36px 28px 30px 28px;
      text-align: center;
      color: #ffffff;
    }
    .logo-badge {
      display: inline-block;
      width: 44px;
      height: 44px;
      line-height: 44px;
      background: rgba(255, 255, 255, 0.16);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 12px;
      color: #ffffff;
      font-weight: 800;
      font-size: 18px;
      letter-spacing: 1px;
      margin-bottom: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header h1 {
      margin: 0 0 4px 0;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #ffffff;
    }
    .header p {
      margin: 0;
      font-size: 13px;
      color: #a7f3d0;
      font-weight: 500;
      letter-spacing: 0.2px;
    }
    .content {
      padding: 32px 28px;
      line-height: 1.7;
      font-size: 14px;
      color: #334155;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 18px 20px;
      margin: 20px 0;
    }
    .badge {
      display: inline-block;
      padding: 5px 14px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }
    .badge-success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .badge-amber { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .badge-blue { background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 13px;
      padding: 12px 28px;
      border-radius: 12px;
      margin-top: 18px;
      text-align: center;
      box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
    }
    .footer {
      background: #f8fafc;
      padding: 24px 28px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
    }
    .footer p { margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    th { background: #f1f5f9; padding: 10px 14px; text-align: left; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; }
    td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #334155; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}
  </div>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-badge">OA</div>
        <h1>OMNI ASSETS</h1>
        <p>${title}</p>
      </div>
      <div class="content">
        ${contentHtml}
        ${ctaText && ctaUrl ? `<div style="text-align: center; margin-top: 24px;"><a href="${ctaUrl}" class="btn">${ctaText} &rarr;</a></div>` : ""}
      </div>
      <div class="footer">
        <p style="font-weight: 700; color: #334155;">H\u1EC7 Th\u1ED1ng Qu\u1EA3n Tr\u1ECB V\u1EADn H\xE0nh Doanh Nghi\u1EC7p OMNI ASSETS</p>
        <p>H\xF2m th\u01B0 th\xF4ng b\xE1o ph\xE1t t\u1EF1 \u0111\u1ED9ng t\u1EEB h\u1EC7 th\u1ED1ng \u0111\xE1m m\xE2y. Vui l\xF2ng kh\xF4ng tr\u1EA3 l\u1EDDi tr\u1EF1c ti\u1EBFp email n\xE0y.</p>
        ${footerNote ? `<p style="color: #94a3b8; margin-top: 8px;">${footerNote}</p>` : ""}
        <p style="color: #94a3b8; font-size: 11px; margin-top: 10px;">
          B\u1EA3o m\u1EADt DKIM/SPF &bull; H\u1ED7 tr\u1EE3: <a href="mailto:support@omniassets.ryug.id.vn" style="color: #059669; text-decoration: none; font-weight: 600;">support@omniassets.ryug.id.vn</a>
        </p>
        <p style="color: #cbd5e1; font-size: 11px; margin-top: 4px;">&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} OMNI ASSETS. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
__name(wrapEmailHtml, "wrapEmailHtml");
function getTestEmailHtml({ companyName, provider, recipientEmail }) {
  const content = `
    <div style="text-align: center; margin-bottom: 18px;">
      <span class="badge badge-success">\u2713 K\u1EBET N\u1ED0I EMAIL TH\xC0NH C\xD4NG</span>
    </div>
    <p>Xin ch\xE0o Qu\u1EA3n tr\u1ECB vi\xEAn,</p>
    <p>\u0110\xE2y l\xE0 email ki\u1EC3m tra x\xE1c nh\u1EADn c\u1ED5ng g\u1EEDi mail c\u1EE7a doanh nghi\u1EC7p <strong>${companyName || "OMNI ASSETS"}</strong> \u0111\xE3 \u0111\u01B0\u1EE3c c\u1EA5u h\xECnh v\xE0 v\u1EADn h\xE0nh th\xE0nh c\xF4ng!</p>
    <div class="card">
      <table style="margin: 0;">
        <tr><td style="width: 40%; font-weight: bold; border:none;">D\u1ECBch v\u1EE5 Email:</td><td style="border:none; text-transform: uppercase; font-weight: bold; color: #059669;">${provider}</td></tr>
        <tr><td style="font-weight: bold; border:none;">Email nh\u1EADn test:</td><td style="border:none; font-family: monospace;">${recipientEmail}</td></tr>
        <tr><td style="font-weight: bold; border:none;">Th\u1EDDi \u0111i\u1EC3m g\u1EEDi:</td><td style="border:none;">${(/* @__PURE__ */ new Date()).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</td></tr>
        <tr><td style="font-weight: bold; border:none;">Tr\u1EA1ng th\xE1i:</td><td style="border:none; color: #16a34a; font-weight: bold;">Ho\u1EA1t \u0111\u1ED9ng ho\xE0n h\u1EA3o</td></tr>
      </table>
    </div>
    <p style="font-size: 13px; color: #64748b;">
      \u{1F4A1} <em>L\u01B0u \xFD: N\u1EBFu s\u1EED d\u1EE5ng \u0111\u1ECBa ch\u1EC9 g\u1EEDi m\u1EB7c \u0111\u1ECBnh <code>onboarding@resend.dev</code>, Resend ch\u1EC9 cho ph\xE9p g\u1EEDi \u0111\u1EBFn email \u0111\xE3 t\u1EA1o t\xE0i kho\u1EA3n Resend. Khi b\u1EA1n th\xEAm v\xE0 x\xE1c th\u1EF1c domain ri\xEAng trong Resend (Domains &rarr; Add Domain), h\u1EC7 th\u1ED1ng c\xF3 th\u1EC3 g\u1EEDi \u0111\u1EBFn m\u1ECDi email nh\xE2n s\u1EF1 kh\xF4ng h\u1EA1n ch\u1EBF!</em>
    </p>
  `;
  return wrapEmailHtml({
    title: "Ki\u1EC3m Tra C\u1EA5u H\xECnh G\u1EEDi Mail",
    preheader: "C\u1EA5u h\xECnh g\u1EEDi email t\u1EF1 \u0111\u1ED9ng c\u1EE7a b\u1EA1n \u0111\xE3 s\u1EB5n s\xE0ng ho\u1EA1t \u0111\u1ED9ng",
    contentHtml: content,
    ctaText: "M\u1EDF Trang Qu\u1EA3n Tr\u1ECB H\u1EC7 Th\u1ED1ng",
    ctaUrl: "https://company-sheet.hieupham101097.workers.dev"
  });
}
__name(getTestEmailHtml, "getTestEmailHtml");
function getWelcomeUserEmailHtml({ companyName, userName, userEmail, password, role, department, loginUrl }) {
  const roleNameMap = {
    "ADMIN": "Qu\u1EA3n Tr\u1ECB Vi\xEAn (Admin)",
    "MANAGER": "Qu\u1EA3n L\xFD (Manager)",
    "STAFF": "Nh\xE2n Vi\xEAn (Staff)",
    "SUPER_ADMIN": "Qu\u1EA3n Tr\u1ECB T\u1ED1i Cao"
  };
  const roleDisplay = roleNameMap[role] || role;
  const content = `
    <p>Xin ch\xE0o <strong>${userName}</strong>,</p>
    <p>Ch\xE0o m\u1EEBng b\u1EA1n gia nh\u1EADp <strong>${companyName || "OMNI ASSETS & LOGISTICS"}</strong>! T\xE0i kho\u1EA3n truy c\u1EADp h\u1EC7 th\u1ED1ng qu\u1EA3n tr\u1ECB c\u1EE7a b\u1EA1n \u0111\xE3 \u0111\u01B0\u1EE3c kh\u1EDFi t\u1EA1o th\xE0nh c\xF4ng:</p>
    
    <div class="card" style="border-left: 4px solid #059669;">
      <table style="margin: 0;">
        <tr><td style="width: 35%; font-weight: bold; border:none;">H\u1ECD v\xE0 t\xEAn:</td><td style="border:none; font-weight: 600;">${userName}</td></tr>
        <tr><td style="font-weight: bold; border:none;">T\xEAn \u0111\u0103ng nh\u1EADp (Email):</td><td style="border:none; font-family: monospace; font-weight: bold; color: #059669;">${userEmail}</td></tr>
        <tr><td style="font-weight: bold; border:none;">M\u1EADt kh\u1EA9u kh\u1EDFi t\u1EA1o:</td><td style="border:none; font-family: monospace; font-weight: bold; color: #dc2626; background: #fef2f2; padding: 4px 8px; border-radius: 6px; display: inline-block;">${password || "123456"}</td></tr>
        <tr><td style="font-weight: bold; border:none;">Ph\xF2ng ban:</td><td style="border:none;">${department || "Ch\u01B0a g\xE1n"}</td></tr>
        <tr><td style="font-weight: bold; border:none;">Vai tr\xF2:</td><td style="border:none;"><span class="badge badge-blue">${roleDisplay}</span></td></tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #475569;">
      \u{1F512} <strong>B\u1EA3o m\u1EADt t\xE0i kho\u1EA3n:</strong> Sau khi \u0111\u0103ng nh\u1EADp l\u1EA7n \u0111\u1EA7u, b\u1EA1n c\xF3 th\u1EC3 \u0111\u1ED5i l\u1EA1i m\u1EADt kh\u1EA9u c\xE1 nh\xE2n t\u1EA1i m\u1EE5c H\u1ED3 S\u01A1 (g\xF3c ph\u1EA3i giao di\u1EC7n).
    </p>
  `;
  return wrapEmailHtml({
    title: "Th\xF4ng Tin T\xE0i Kho\u1EA3n Nh\xE2n S\u1EF1 M\u1EDBi",
    preheader: `T\xE0i kho\u1EA3n \u0111\u0103ng nh\u1EADp h\u1EC7 th\u1ED1ng c\u1EE7a ${userName}`,
    contentHtml: content,
    ctaText: "\u0110\u0103ng Nh\u1EADp Ngay V\xE0o H\u1EC7 Th\u1ED1ng",
    ctaUrl: loginUrl || "https://company-sheet.hieupham101097.workers.dev"
  });
}
__name(getWelcomeUserEmailHtml, "getWelcomeUserEmailHtml");
function getDailyRemindersEmailHtml({ companyName, date, overdueTasks = [], upcomingContracts = [], expiredContracts = [], dashboardUrl }) {
  let sections = "";
  if (overdueTasks.length > 0) {
    sections += `
      <div style="margin-top: 18px;">
        <h3 style="color: #b91c1c; font-size: 14px; margin-bottom: 8px;">\u26A0\uFE0F C\xF4ng Vi\u1EC7c Qu\xE1 H\u1EA1n C\u1EA7n X\u1EED L\xFD (${overdueTasks.length})</h3>
        <table>
          <thead><tr><th>T\xEAn C\xF4ng Vi\u1EC7c</th><th>Ng\u01B0\u1EDDi Ph\u1EE5 Tr\xE1ch</th><th>H\u1EA1n Ch\xF3t</th></tr></thead>
          <tbody>
            ${overdueTasks.slice(0, 8).map((t) => `
              <tr>
                <td style="font-weight: 600;">${t.title}</td>
                <td>${t.assignee || "Ch\u01B0a ph\xE2n c\xF4ng"}</td>
                <td style="color: #b91c1c; font-weight: bold;">${t.due_date}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }
  if (upcomingContracts.length > 0 || expiredContracts.length > 0) {
    sections += `
      <div style="margin-top: 18px;">
        <h3 style="color: #b45309; font-size: 14px; margin-bottom: 8px;">\u{1F4D1} C\u1EA3nh B\xE1o H\u1EA1n H\u1EE3p \u0110\u1ED3ng &amp; Bi\xEAn B\u1EA3n</h3>
        <table>
          <thead><tr><th>S\u1ED1 H\u0110 / \u0110\u1ED1i T\xE1c</th><th>Ng\xE0y H\u1EBFt H\u1EA1n</th><th>Tr\u1EA1ng Th\xE1i</th></tr></thead>
          <tbody>
            ${expiredContracts.slice(0, 5).map((c) => `
              <tr>
                <td style="font-weight: 600;">${c.contract_number} ${c.partner_name ? `- ${c.partner_name}` : ""}</td>
                <td style="color: #dc2626; font-weight: bold;">${c.end_date}</td>
                <td><span class="badge" style="background:#fee2e2;color:#991b1b;">\u0110\xE3 h\u1EBFt h\u1EA1n</span></td>
              </tr>
            `).join("")}
            ${upcomingContracts.slice(0, 5).map((c) => `
              <tr>
                <td style="font-weight: 600;">${c.contract_number} ${c.partner_name ? `- ${c.partner_name}` : ""}</td>
                <td style="color: #d97706; font-weight: bold;">${c.end_date}</td>
                <td><span class="badge badge-amber">S\u1EAFp h\u1EBFt h\u1EA1n</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }
  if (!sections) {
    sections = `
      <div class="card" style="text-align: center; padding: 22px;">
        <p style="color: #15803d; font-weight: bold; margin: 0; font-size: 15px;">\u{1F389} Tuy\u1EC7t v\u1EDDi! Hi\u1EC7n t\u1EA1i kh\xF4ng c\xF3 c\xF4ng vi\u1EC7c ho\u1EB7c h\u1EE3p \u0111\u1ED3ng n\xE0o b\u1ECB qu\xE1 h\u1EA1n.</p>
        <p style="color: #64748b; font-size: 13px; margin: 6px 0 0 0;">M\u1ECDi ho\u1EA1t \u0111\u1ED9ng v\u1EADn h\xE0nh c\u1EE7a doanh nghi\u1EC7p \u0111ang di\u1EC5n ra \u0111\xFAng k\u1EBF ho\u1EA1ch.</p>
      </div>
    `;
  }
  const content = `
    <p>Xin ch\xE0o Ban Qu\u1EA3n Tr\u1ECB <strong>${companyName || "OMNI ASSETS"}</strong>,</p>
    <p>H\u1EC7 th\u1ED1ng t\u1EF1 \u0111\u1ED9ng t\u1ED5ng h\u1EE3p t\xECnh tr\u1EA1ng h\u1EA1n m\u1EE9c v\u1EADn h\xE0nh ng\xE0y <strong>${date}</strong>:</p>
    ${sections}
  `;
  return wrapEmailHtml({
    title: `B\xE1o C\xE1o Nh\u1EAFc H\u1EA1n V\u1EADn H\xE0nh (${date})`,
    preheader: `B\xE1o c\xE1o nh\u1EAFc h\u1EA1n c\xF4ng vi\u1EC7c v\xE0 h\u1EE3p \u0111\u1ED3ng ng\xE0y ${date}`,
    contentHtml: content,
    ctaText: "M\u1EDF B\xE0n \u0110i\u1EC1u Khi\u1EC3n Qu\u1EA3n Tr\u1ECB",
    ctaUrl: dashboardUrl || "https://company-sheet.hieupham101097.workers.dev"
  });
}
__name(getDailyRemindersEmailHtml, "getDailyRemindersEmailHtml");
function getTimesheetEmailHtml({ companyName, userName, month, totalDaysWorked, totalHours, standardWorkDays, onTimeDays, lateDays, lateMinutes = 0, punctualityRate = 100, notes = "" }) {
  const content = `
    <p>Xin ch\xE0o <strong>${userName}</strong>,</p>
    <p>Ph\xF2ng Nh\xE2n S\u1EF1 &amp; K\u1EBF To\xE1n <strong>${companyName || "OMNI ASSETS & LOGISTICS"}</strong> g\u1EEDi \u0111\u1EBFn b\u1EA1n phi\u1EBFu t\u1ED5ng h\u1EE3p ch\u1EA5m c\xF4ng th\xE1ng <strong>${month}</strong>:</p>

    <div class="card" style="border: 2px solid #e0e7ff; background: #fafafa;">
      <h3 style="margin-top: 0; margin-bottom: 12px; color: #4338ca; font-size: 14px;">\u{1F4CA} T\u1ED4NG H\u1EE2P C\xD4NG TH\xC1NG ${month}</h3>
      <table style="margin: 0;">
        <tr>
          <td style="width: 45%; font-weight: bold; border-top:none;">T\u1ED5ng s\u1ED1 ng\xE0y \u0111i l\xE0m:</td>
          <td style="font-weight: bold; color: #059669; font-size: 15px; border-top:none;">${totalDaysWorked} ng\xE0y</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">T\u1ED5ng s\u1ED1 gi\u1EDD l\xE0m vi\u1EC7c:</td>
          <td style="font-family: monospace; font-weight: bold; color: #1e293b;">${totalHours} gi\u1EDD</td>
        </tr>
        <tr style="background: #f0fdf4;">
          <td style="font-weight: bold; color: #166534;">C\xF4ng chu\u1EA9n k\u1EBF to\xE1n quy \u0111\u1ED5i (h/8):</td>
          <td style="font-weight: 800; font-size: 16px; color: #15803d; font-family: monospace;">${standardWorkDays} c\xF4ng</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">S\u1ED1 bu\u1ED5i \u0111\xFAng gi\u1EDD:</td>
          <td style="color: #059669; font-weight: bold;">${onTimeDays} bu\u1ED5i</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">S\u1ED1 l\u1EA7n \u0111i mu\u1ED9n:</td>
          <td style="color: ${lateDays > 0 ? "#dc2626" : "#64748b"}; font-weight: bold;">
            ${lateDays > 0 ? `${lateDays} l\u1EA7n (${lateMinutes} ph\xFAt)` : "0 l\u1EA7n (\u0110\xFAng gi\u1EDD tuy\u1EC7t \u0111\u1ED1i)"}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold;">T\u1EF7 l\u1EC7 chuy\xEAn c\u1EA7n:</td>
          <td style="font-weight: bold; color: ${punctualityRate >= 90 ? "#16a34a" : "#d97706"};">${punctualityRate}%</td>
        </tr>
      </table>
    </div>

    ${notes ? `
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 14px; border-radius: 8px; font-size: 13px; color: #1e40af; margin-top: 14px;">
        <strong>Ghi ch\xFA:</strong> ${notes}
      </div>
    ` : ""}

    <p style="font-size: 12px; color: #64748b; margin-top: 18px;">
      \u2139\uFE0F <em>N\u1EBFu c\u1EA7n \u0111\u1ED1i so\xE1t l\u1EA1i ng\xE0y c\xF4ng, b\u1EA1n vui l\xF2ng ph\u1EA3n h\u1ED3i l\u1EA1i Ph\xF2ng K\u1EBF to\xE1n / Nh\xE2n s\u1EF1 trong v\xF2ng 48 gi\u1EDD.</em>
    </p>
  `;
  return wrapEmailHtml({
    title: `Phi\u1EBFu B\xE1o C\xE1o Ch\u1EA5m C\xF4ng Th\xE1ng ${month}`,
    preheader: `B\u1EA3ng t\u1ED5ng k\u1EBFt c\xF4ng th\xE1ng ${month} c\u1EE7a ${userName}: ${standardWorkDays} ng\xE0y c\xF4ng`,
    contentHtml: content,
    ctaText: "Xem L\u1ECBch S\u1EED \u0110i\u1EC3m Danh",
    ctaUrl: "https://company-sheet.hieupham101097.workers.dev"
  });
}
__name(getTimesheetEmailHtml, "getTimesheetEmailHtml");
function getOtpEmailHtml({ companyName, otp, expiresInMinutes = 5 }) {
  const digits = String(otp || "").trim().split("");
  const digitsHtml = digits.map((d) => `
    <td style="width: 46px; height: 56px; background: #ffffff; border: 2px solid #10b981; border-radius: 12px; text-align: center; vertical-align: middle; font-size: 30px; font-weight: 800; color: #065f46; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.12);">
      ${d}
    </td>
  `).join('<td style="width: 8px;"></td>');
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-amber" style="background: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 6px 18px; font-size: 11px; font-weight: 700; border-radius: 9999px; letter-spacing: 0.8px;">
        M\xC3 X\xC1C TH\u1EF0C B\u1EA2O M\u1EACT (OTP)
      </span>
    </div>

    <p style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">
      K\xEDnh g\u1EEDi Qu\xFD Qu\u1EA3n tr\u1ECB vi\xEAn,
    </p>
    <p style="font-size: 14px; color: #334155; line-height: 1.65; margin: 0 0 12px 0;">
      H\u1EC7 th\u1ED1ng \u0111\xE3 ti\u1EBFp nh\u1EADn y\xEAu c\u1EA7u \u0111\u0103ng k\xFD kh\xF4ng gian l\xE0m vi\u1EC7c s\u1ED1 cho doanh nghi\u1EC7p <strong>${companyName}</strong> tr\xEAn n\u1EC1n t\u1EA3ng <strong>OMNI ASSETS</strong>.
    </p>
    <p style="font-size: 14px; color: #334155; line-height: 1.65; margin: 0 0 24px 0;">
      \u0110\u1EC3 ho\xE0n t\u1EA5t th\u1EE7 t\u1EE5c \u0111\u0103ng k\xFD v\xE0 k\xEDch ho\u1EA1t h\u1EC7 th\u1ED1ng, vui l\xF2ng nh\u1EADp m\xE3 x\xE1c th\u1EF1c OTP 6 ch\u1EEF s\u1ED1 d\u01B0\u1EDBi \u0111\xE2y v\xE0o m\xE0n h\xECnh k\xEDch ho\u1EA1t:
    </p>

    <!-- OTP Digit Cards -->
    <div style="text-align: center; margin: 28px 0;">
      <table align="center" style="margin: 0 auto; border-collapse: separate; border-spacing: 0;">
        <tr>
          ${digitsHtml}
        </tr>
      </table>

      <div style="display: inline-block; margin-top: 14px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 9999px; padding: 5px 16px;">
        <span style="color: #065f46; font-size: 12px; font-weight: 600;">
          \u23F1\uFE0F M\xE3 n\xE0y c\xF3 hi\u1EC7u l\u1EF1c trong v\xF2ng <strong>${expiresInMinutes} ph\xFAt</strong>
        </span>
      </div>
    </div>

    <!-- Security Warning Card -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #059669; border-radius: 12px; padding: 14px 18px; margin-top: 26px;">
      <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #0f172a;">
        \u{1F6E1}\uFE0F Khuy\u1EBFn C\xE1o An To\xE0n &amp; B\u1EA3o M\u1EADt:
      </p>
      <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #64748b; line-height: 1.6;">
        <li>Tuy\u1EC7t \u0111\u1ED1i <strong>kh\xF4ng chia s\u1EBB</strong> m\xE3 OTP n\xE0y cho b\u1EA5t k\u1EF3 ai, bao g\u1ED3m c\u1EA3 nh\xE2n vi\xEAn h\u1ED7 tr\u1EE3 h\u1EC7 th\u1ED1ng.</li>
        <li>Ban Qu\u1EA3n tr\u1ECB OMNI ASSETS <strong>kh\xF4ng bao gi\u1EDD</strong> ch\u1EE7 \u0111\u1ED9ng g\u1ECDi \u0111i\u1EC7n y\xEAu c\u1EA7u cung c\u1EA5p m\xE3 OTP.</li>
        <li>N\u1EBFu b\u1EA1n kh\xF4ng th\u1EF1c hi\u1EC7n y\xEAu c\u1EA7u \u0111\u0103ng k\xFD n\xE0y, vui l\xF2ng b\u1ECF qua th\u01B0 ho\u1EB7c li\xEAn h\u1EC7 b\u1ED9 ph\u1EADn an to\xE0n th\xF4ng tin t\u1EA1i <a href="mailto:support@omniassets.ryug.id.vn" style="color: #059669; font-weight: 600; text-decoration: none;">support@omniassets.ryug.id.vn</a>.</li>
      </ul>
    </div>
  `;
  return wrapEmailHtml({
    title: "M\xE3 X\xE1c Th\u1EF1c \u0110\u0103ng K\xFD T\xE0i Kho\u1EA3n Doanh Nghi\u1EC7p",
    preheader: `M\xE3 OTP x\xE1c nh\u1EADn \u0111\u0103ng k\xFD t\xE0i kho\u1EA3n ${companyName}: ${otp}`,
    contentHtml: content
  });
}
__name(getOtpEmailHtml, "getOtpEmailHtml");
function getBroadcastEmailHtml({ companyName, subject, content, urgency = "NORMAL", dashboardUrl }) {
  const urgencyBadges = {
    "URGENT": '<span class="badge" style="background:#fee2e2;color:#991b1b;">\u{1F6A8} TH\xD4NG B\xC1O KH\u1EA8N C\u1EA4P / QUAN TR\u1ECCNG</span>',
    "ANNOUNCEMENT": '<span class="badge badge-blue">\u{1F4E2} TH\xD4NG B\xC1O CHUNG DOANH NGHI\u1EC6P</span>',
    "NORMAL": '<span class="badge badge-success">\u2709\uFE0F TH\xD4NG \u0110I\u1EC6P N\u1ED8I B\u1ED8</span>'
  };
  const badgeHtml = urgencyBadges[urgency] || urgencyBadges["NORMAL"];
  const formattedContent = content.split("\n").filter((p) => p.trim() !== "").map((p) => `<p style="margin: 8px 0; color: #334155; line-height: 1.65; font-size: 14px;">${p}</p>`).join("");
  const bodyHtml = `
    <div style="margin-bottom: 15px;">
      ${badgeHtml}
    </div>
    <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; letter-spacing: -0.3px;">
      ${subject}
    </h2>
    <div class="card" style="border-left: 4px solid #059669; padding: 20px 22px; background: #fafafa;">
      ${formattedContent}
    </div>
    <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
      Th\xF4ng b\xE1o n\xE0y \u0111\u01B0\u1EE3c g\u1EEDi t\u1EEB Ban \u0110i\u1EC1u H\xE0nh / Qu\u1EA3n Tr\u1ECB c\u1EE7a <strong>${companyName}</strong> qua h\u1EC7 th\u1ED1ng OMNI ASSETS.
    </p>
  `;
  return wrapEmailHtml({
    title: `Th\xF4ng B\xE1o T\u1EEB ${companyName}`,
    preheader: subject,
    contentHtml: bodyHtml,
    ctaText: "\u0110\u0103ng Nh\u1EADp Xem Chi Ti\u1EBFt",
    ctaUrl: dashboardUrl || "https://company-sheet.hieupham101097.workers.dev"
  });
}
__name(getBroadcastEmailHtml, "getBroadcastEmailHtml");
function getManagementNotificationEmailHtml({ companyName, subject, message, senderName, timestamp, managerNames = [], dashboardUrl }) {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span class="badge" style="background:#e0e7ff; color:#3730a3; border: 1px solid #c7d2fe; padding: 6px 14px; font-size: 12px; font-weight: 700; border-radius: 9999px; text-transform: uppercase;">
        \u{1F6E1}\uFE0F TH\xD4NG B\xC1O C\u1EA4P QU\u1EA2N TR\u1ECA &amp; \u0110I\u1EC0U H\xC0NH (ADMIN &amp; MANAGER)
      </span>
    </div>

    <h2 style="font-size: 19px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; text-align: center; letter-spacing: -0.3px;">
      ${subject || "C\u1EADp Nh\u1EADt V\u1EADn H\xE0nh & Ph\xE2n Quy\u1EC1n Doanh Nghi\u1EC7p"}
    </h2>

    <div class="card" style="border-left: 4px solid #4f46e5; background: #f8fafc; padding: 18px 20px;">
      <p style="margin: 0 0 12px 0; color: #1e293b; font-size: 14px; line-height: 1.6; font-weight: 600;">
        K\xEDnh g\u1EEDi Qu\xFD C\xE1n B\u1ED9 Qu\u1EA3n Tr\u1ECB &amp; Qu\u1EA3n L\xFD Doanh Nghi\u1EC7p <strong>${companyName}</strong>,
      </p>
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 12px 0;">
        <p style="margin: 0; color: #334155; line-height: 1.7; font-size: 14px; white-space: pre-wrap;">${message || "Ban Qu\u1EA3n Tr\u1ECB th\xF4ng b\xE1o: C\u1EADp nh\u1EADt ph\xE2n quy\u1EC1n ph\xF2ng ban v\xE0 ch\xEDnh s\xE1ch v\u1EADn h\xE0nh m\u1EDBi \u0111\xE3 \u0111\u01B0\u1EE3c \xE1p d\u1EE5ng v\xE0 \u0111\u1ED3ng b\u1ED9 th\u1EDDi gian th\u1EF1c l\xEAn h\u1EC7 th\u1ED1ng c\u01A1 s\u1EDF d\u1EEF li\u1EC7u."}</p>
      </div>

      <table style="margin-top: 14px; margin-bottom: 0;">
        <tr>
          <td style="width: 35%; font-weight: bold; border:none; color: #64748b; font-size: 12px;">\u0110\u01A1n v\u1ECB / Doanh nghi\u1EC7p:</td>
          <td style="border:none; font-weight: bold; color: #0f172a; font-size: 12px;">${companyName}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; border:none; color: #64748b; font-size: 12px;">Ng\u01B0\u1EDDi g\u1EEDi l\u1EC7nh:</td>
          <td style="border:none; font-weight: bold; color: #4338ca; font-size: 12px;">${senderName || "Ban Qu\u1EA3n Tr\u1ECB Doanh Nghi\u1EC7p"}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; border:none; color: #64748b; font-size: 12px;">Th\u1EDDi \u0111i\u1EC3m ph\xE1t:</td>
          <td style="border:none; color: #334155; font-size: 12px;">${timestamp || (/* @__PURE__ */ new Date()).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; border:none; color: #64748b; font-size: 12px;">H\xF2m th\u01B0 ph\xE1t:</td>
          <td style="border:none; font-family: monospace; color: #0284c7; font-weight: bold; font-size: 12px;">tasks@omniassets.ryug.id.vn</td>
        </tr>
        ${managerNames.length > 0 ? `
        <tr>
          <td style="font-weight: bold; border:none; color: #64748b; font-size: 12px;">Danh s\xE1ch c\xE1n b\u1ED9 nh\u1EADn:</td>
          <td style="border:none; color: #475569; font-size: 12px;">${managerNames.join(", ")}</td>
        </tr>` : ""}
      </table>
    </div>

    <p style="font-size: 12px; color: #64748b; margin-top: 18px; line-height: 1.6;">
      \u{1F4A1} <em>Th\xF4ng b\xE1o n\u1ED9i b\u1ED9 n\xE0y \u0111\u01B0\u1EE3c ph\xE1t \u0111\u1EBFn c\u1EA5p Qu\u1EA3n l\xFD v\xE0 Qu\u1EA3n tr\u1ECB vi\xEAn \u0111\u1EC3 n\u1EAFm b\u1EAFt k\u1ECBp th\u1EDDi t\xECnh h\xECnh \u0111i\u1EC1u h\xE0nh doanh nghi\u1EC7p.</em>
    </p>
  `;
  return wrapEmailHtml({
    title: `[\u0110i\u1EC1u H\xE0nh N\u1ED9i B\u1ED9] ${subject}`,
    preheader: subject,
    contentHtml: content,
    ctaText: "M\u1EDF B\xE0n L\xE0m Vi\u1EC7c Qu\u1EA3n Tr\u1ECB",
    ctaUrl: dashboardUrl || "https://company-sheet.hieupham101097.workers.dev"
  });
}
__name(getManagementNotificationEmailHtml, "getManagementNotificationEmailHtml");
function getSuperAdminPlanAnnouncementEmailHtml({
  subject,
  message,
  plans = [],
  ctaText = "Xem B\u1EA3ng Gi\xE1 & N\xE2ng C\u1EA5p G\xF3i",
  ctaUrl = "https://company-sheet.hieupham101097.workers.dev",
  senderEmail = "notifications@omniassets.ryug.id.vn",
  recipientName = "Qu\xFD Doanh Nghi\u1EC7p"
}) {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge" style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); color: #6d28d9; border: 1px solid #ddd6fe; padding: 7px 18px; font-size: 12px; font-weight: 800; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;">
        \u{1F680} TH\xD4NG B\xC1O T\u1EEA BAN \u0110I\u1EC0U H\xC0NH N\u1EC0N T\u1EA2NG OMNIASSETS
      </span>
    </div>

    <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; text-align: center; letter-spacing: -0.5px;">
      ${subject || "Th\xF4ng B\xE1o G\xF3i D\u1ECBch V\u1EE5 & B\u1EA3n Quy\u1EC1n H\u1EC7 Th\u1ED1ng OmniAssets"}
    </h2>

    <div class="card" style="border-left: 4px solid #7c3aed; background: #ffffff; padding: 22px 24px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <p style="margin: 0 0 14px 0; color: #1e293b; font-size: 15px; line-height: 1.6; font-weight: 600;">
        K\xEDnh g\u1EEDi Qu\xFD C\xE1n B\u1ED9 Qu\u1EA3n Tr\u1ECB &amp; \u0110i\u1EC1u H\xE0nh <strong>${recipientName}</strong>,
      </p>
      
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 14px 0; color: #334155; line-height: 1.7; font-size: 14px; white-space: pre-wrap;">${message}</div>

      ${plans && plans.length > 0 ? `
      <div style="margin-top: 20px;">
        <h4 style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #475569; margin: 0 0 10px 0; letter-spacing: 0.5px;">
          B\u1EA3ng G\xF3i C\u01B0\u1EDBc D\u1ECBch V\u1EE5 Doanh Nghi\u1EC7p (Official Pricing):
        </h4>
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #334155; border: 1px solid #e2e8f0;">G\xF3i D\u1ECBch V\u1EE5</th>
              <th style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #334155; border: 1px solid #e2e8f0;">Th\u1EDDi H\u1EA1n</th>
              <th style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #334155; border: 1px solid #e2e8f0;">Gi\xE1 C\u01B0\u1EDBc</th>
              <th style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #334155; border: 1px solid #e2e8f0;">\u0110\u1EB7c Quy\u1EC1n</th>
            </tr>
          </thead>
          <tbody>
            ${plans.map((p) => `
              <tr>
                <td style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #6d28d9; border: 1px solid #e2e8f0;">
                  ${p.name || p.code}
                </td>
                <td style="padding: 10px 12px; font-size: 12px; color: #475569; border: 1px solid #e2e8f0;">
                  ${p.duration_months === 999 ? "Tr\u1ECDn \u0111\u1EDDi" : `${p.duration_months} th\xE1ng`}
                </td>
                <td style="padding: 10px 12px; font-size: 12px; font-weight: 800; color: #059669; border: 1px solid #e2e8f0;">
                  ${p.price ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p.price) : "Mi\u1EC5n ph\xED"}
                </td>
                <td style="padding: 10px 12px; font-size: 11px; color: #64748b; border: 1px solid #e2e8f0;">
                  ${p.badge || "\u0110\u1EA7y \u0111\u1EE7 module"}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>` : ""}

      <table style="margin-top: 18px; width: 100%; border: none;">
        <tr>
          <td style="width: 35%; font-weight: bold; border:none; color: #64748b; font-size: 12px;">\u0110\u01A1n v\u1ECB ph\xE1t h\xE0nh:</td>
          <td style="border:none; font-weight: bold; color: #7c3aed; font-size: 12px;">OmniAssets Platform (Master Super Admin)</td>
        </tr>
        <tr>
          <td style="font-weight: bold; border:none; color: #64748b; font-size: 12px;">Qu\u1EA3n Tr\u1ECB Vi\xEAn N\u1EC1n T\u1EA3ng:</td>
          <td style="border:none; font-weight: bold; color: #0f172a; font-size: 12px;">adminManager@gmail.com</td>
        </tr>
        <tr>
          <td style="font-weight: bold; border:none; color: #64748b; font-size: 12px;">H\xF2m th\u01B0 ph\xE1t th\xF4ng b\xE1o:</td>
          <td style="border:none; font-family: monospace; color: #7c3aed; font-weight: bold; font-size: 12px;">${senderEmail}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; border:none; color: #64748b; font-size: 12px;">H\u1ED7 tr\u1EE3 &amp; t\u01B0 v\u1EA5n g\xF3i:</td>
          <td style="border:none; font-family: monospace; color: #059669; font-weight: bold; font-size: 12px;">support@omniassets.ryug.id.vn</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 11px; color: #94a3b8; margin-top: 16px; text-align: center; line-height: 1.6;">
      Th\xF4ng b\xE1o \u0111\u01B0\u1EE3c ph\xE1t ch\xEDnh th\u1EE9c t\u1EEB H\u1EC7 Th\u1ED1ng Qu\u1EA3n Tr\u1ECB N\u1EC1n T\u1EA3ng OmniAssets \u0111\u1EBFn Ban Qu\u1EA3n Tr\u1ECB Doanh Nghi\u1EC7p.
    </p>
  `;
  return wrapEmailHtml({
    title: `[OmniAssets Platform] ${subject}`,
    preheader: subject,
    contentHtml: content,
    ctaText,
    ctaUrl
  });
}
__name(getSuperAdminPlanAnnouncementEmailHtml, "getSuperAdminPlanAnnouncementEmailHtml");
app.post("/api/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ success: false, message: "Vui l\xF2ng nh\u1EADp email v\xE0 m\u1EADt kh\u1EA9u" }, 400);
    }
    const cleanAccount = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const user = await c.env.DB.prepare("SELECT id, name, email, role, department, phone, avatar, status, company_id FROM users WHERE (lower(email) = ? OR lower(id) = ?) AND password = ?").bind(cleanAccount, cleanAccount, cleanPassword).first();
    if (!user) {
      return c.json({ success: false, message: "T\xEAn \u0111\u0103ng nh\u1EADp ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng ch\xEDnh x\xE1c" }, 401);
    }
    if (user.status && user.status.toUpperCase() === "LOCKED") {
      return c.json({ success: false, message: "T\xE0i kho\u1EA3n c\u1EE7a b\u1EA1n \u0111\xE3 b\u1ECB kh\xF3a. Vui l\xF2ng li\xEAn h\u1EC7 Qu\u1EA3n tr\u1ECB vi\xEAn h\u1EC7 th\u1ED1ng." }, 403);
    }
    if (cleanAccount === "adminmanager@gmail.com" || user.role === "SUPER_ADMIN") {
      user.role = "SUPER_ADMIN";
      user.company_id = "SYSTEM";
      user.company_name = "H\u1EC7 Th\u1ED1ng Qu\u1EA3n Tr\u1ECB N\u1EC1n T\u1EA3ng (Master)";
      c.env.DB.prepare("UPDATE users SET role = 'SUPER_ADMIN', company_id = 'SYSTEM' WHERE lower(email) = ?").bind(cleanAccount).run().catch(() => {
      });
    } else {
      if (!user.company_id) {
        user.company_id = "comp_1";
      }
      const compTenant = await c.env.DB.prepare("SELECT company_name, plan_code, license_status FROM company_tenants WHERE id = ?").bind(user.company_id).first().catch(() => null);
      user.company_name = compTenant?.company_name || "OMNI ASSETS";
      user.plan_code = compTenant?.plan_code || "TRIAL_2M";
      user.license_status = compTenant?.license_status || "ACTIVE";
    }
    return c.json({
      success: true,
      message: "\u0110\u0103ng nh\u1EADp th\xE0nh c\xF4ng",
      data: {
        user,
        token: `jwt_${user.id}_${Date.now()}`
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.post("/api/auth/send-registration-otp", async (c) => {
  try {
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS email_otps (
        email TEXT PRIMARY KEY,
        otp TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {
    });
    const body = await c.req.json().catch(() => ({}));
    const email = (body.admin_email || body.email || "").trim().toLowerCase();
    const companyName = (body.company_name || "Doanh Nghi\u1EC7p").trim();
    if (!email || !email.includes("@")) {
      return c.json({ success: false, message: "Vui l\xF2ng nh\u1EADp \u0111\u1ECBa ch\u1EC9 email h\u1EE3p l\u1EC7" }, 400);
    }
    const existing = await c.env.DB.prepare("SELECT id FROM users WHERE lower(email) = ?").bind(email).first().catch(() => null);
    if (existing) {
      return c.json({ success: false, message: `Email "${email}" \u0111\xE3 t\u1ED3n t\u1EA1i tr\xEAn h\u1EC7 th\u1ED1ng. Vui l\xF2ng \u0111\u0103ng nh\u1EADp ho\u1EB7c d\xF9ng email kh\xE1c.` }, 400);
    }
    const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
    const expiresAt = Date.now() + 5 * 60 * 1e3;
    await c.env.DB.prepare(`
      INSERT INTO email_otps (email, otp, expires_at)
      VALUES (?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET otp = excluded.otp, expires_at = excluded.expires_at, created_at = CURRENT_TIMESTAMP
    `).bind(email, otp, expiresAt).run();
    const otpHtml = getOtpEmailHtml({
      companyName,
      otp,
      expiresInMinutes: 5
    });
    await sendEmail({
      db: c.env.DB,
      companyId: "SYSTEM",
      senderType: "notifications",
      replyTo: "hieupham101097@gmail.com",
      to: email,
      subject: `[OMNI ASSETS] M\xE3 OTP x\xE1c th\u1EF1c \u0111\u0103ng k\xFD: ${otp}`,
      html: otpHtml
    });
    return c.json({
      success: true,
      message: `\u0110\xE3 g\u1EEDi m\xE3 x\xE1c th\u1EF1c OTP 6 s\u1ED1 \u0111\u1EBFn email ${email}. Vui l\xF2ng ki\u1EC3m tra h\u1ED9p th\u01B0!`,
      data: { email }
    });
  } catch (err) {
    return c.json({ success: false, message: `L\u1ED7i g\u1EEDi m\xE3 OTP: ${err.message}` }, 500);
  }
});
app.post("/api/auth/register-company", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const {
      company_name,
      tax_id,
      industry,
      company_address,
      company_phone,
      company_email,
      admin_name,
      admin_email,
      admin_password,
      admin_phone,
      admin_title,
      otp
    } = body;
    if (!company_name || !company_name.trim()) {
      return c.json({ success: false, message: "Vui l\xF2ng nh\u1EADp t\xEAn doanh nghi\u1EC7p" }, 400);
    }
    if (!admin_name || !admin_name.trim()) {
      return c.json({ success: false, message: "Vui l\xF2ng nh\u1EADp h\u1ECD v\xE0 t\xEAn Qu\u1EA3n tr\u1ECB vi\xEAn" }, 400);
    }
    if (!admin_email || !admin_email.trim()) {
      return c.json({ success: false, message: "Vui l\xF2ng nh\u1EADp email qu\u1EA3n tr\u1ECB" }, 400);
    }
    if (!admin_password || admin_password.trim().length < 6) {
      return c.json({ success: false, message: "M\u1EADt kh\u1EA9u ph\u1EA3i c\xF3 t\u1ED1i thi\u1EC3u 6 k\xFD t\u1EF1" }, 400);
    }
    const cleanEmail = admin_email.trim().toLowerCase();
    const existing = await c.env.DB.prepare("SELECT id FROM users WHERE lower(email) = ?").bind(cleanEmail).first();
    if (existing) {
      return c.json({
        success: false,
        message: `Email "${cleanEmail}" \u0111\xE3 \u0111\u01B0\u1EE3c s\u1EED d\u1EE5ng. Vui l\xF2ng ch\u1ECDn email kh\xE1c ho\u1EB7c \u0111\u0103ng nh\u1EADp.`
      }, 400);
    }
    const otpInput = (otp || "").trim();
    if (!otpInput) {
      return c.json({ success: false, message: "Vui l\xF2ng nh\u1EADp m\xE3 OTP x\xE1c th\u1EF1c \u0111\xE3 \u0111\u01B0\u1EE3c g\u1EEDi v\u1EC1 email c\u1EE7a b\u1EA1n." }, 400);
    }
    const otpRecord = await c.env.DB.prepare("SELECT * FROM email_otps WHERE email = ?").bind(cleanEmail).first().catch(() => null);
    if (!otpRecord) {
      return c.json({ success: false, message: "Ch\u01B0a c\xF3 y\xEAu c\u1EA7u g\u1EEDi m\xE3 OTP cho email n\xE0y ho\u1EB7c m\xE3 \u0111\xE3 h\u1EBFt h\u1EA1n. Vui l\xF2ng b\u1EA5m g\u1EEDi l\u1EA1i m\xE3." }, 400);
    }
    if (Date.now() > otpRecord.expires_at) {
      await c.env.DB.prepare("DELETE FROM email_otps WHERE email = ?").bind(cleanEmail).run().catch(() => {
      });
      return c.json({ success: false, message: "M\xE3 OTP \u0111\xE3 h\u1EBFt h\u1EA1n (qu\xE1 5 ph\xFAt). Vui l\xF2ng y\xEAu c\u1EA7u g\u1EEDi m\xE3 m\u1EDBi." }, 400);
    }
    if (otpRecord.otp !== otpInput) {
      return c.json({ success: false, message: "M\xE3 OTP x\xE1c th\u1EF1c kh\xF4ng ch\xEDnh x\xE1c. Vui l\xF2ng ki\u1EC3m tra l\u1EA1i." }, 400);
    }
    await c.env.DB.prepare("DELETE FROM email_otps WHERE email = ?").bind(cleanEmail).run().catch(() => {
    });
    const companyId = `comp_${Date.now()}`;
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const d = new Date(today);
    d.setMonth(d.getMonth() + 2);
    const expireDate = d.toISOString().slice(0, 10);
    await c.env.DB.prepare(`
      INSERT INTO company_tenants (id, company_name, tax_id, admin_name, admin_email, admin_phone, plan_code, license_status, start_date, expire_date, revenue, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'TRIAL_2M', 'ACTIVE', ?, ?, 0, 'T\u1EF1 \u0111\u0103ng k\xFD doanh nghi\u1EC7p m\u1EDBi', datetime('now'))
    `).bind(
      companyId,
      company_name.trim(),
      tax_id ? tax_id.trim() : null,
      admin_name.trim(),
      cleanEmail,
      admin_phone ? admin_phone.trim() : company_phone ? company_phone.trim() : null,
      today,
      expireDate
    ).run();
    const adminId = `adm_${Date.now()}`;
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(admin_name.trim())}`;
    const departmentName = admin_title?.trim() || "Ban Gi\xE1m \u0110\u1ED1c";
    await c.env.DB.prepare(`
      INSERT INTO users (id, name, email, password, role, department, phone, avatar, status, company_id)
      VALUES (?, ?, ?, ?, 'ADMIN', ?, ?, ?, 'ACTIVE', ?)
    `).bind(
      adminId,
      admin_name.trim(),
      cleanEmail,
      admin_password.trim(),
      departmentName,
      admin_phone ? admin_phone.trim() : company_phone ? company_phone.trim() : "",
      avatar,
      companyId
    ).run();
    const newUser = {
      id: adminId,
      name: admin_name.trim(),
      email: cleanEmail,
      role: "ADMIN",
      department: departmentName,
      phone: admin_phone || "",
      avatar,
      status: "ACTIVE",
      company_id: companyId,
      company_name: company_name.trim(),
      plan_code: "TRIAL_2M",
      license_status: "ACTIVE"
    };
    return c.json({
      success: true,
      message: `\u0110\u0103ng k\xFD th\xE0nh c\xF4ng doanh nghi\u1EC7p ${company_name.trim()} v\xE0 Qu\u1EA3n tr\u1ECB vi\xEAn ${admin_name.trim()}!`,
      data: {
        user: newUser,
        token: `jwt_${adminId}_${Date.now()}`
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message || "L\u1ED7i khi \u0111\u0103ng k\xFD doanh nghi\u1EC7p" }, 500);
  }
});
app.put("/api/auth/profile", async (c) => {
  try {
    const body = await c.req.json();
    const userId = body.id || c.req.header("x-user-id");
    if (!userId) {
      return c.json({ success: false, message: "Thi\u1EBFu \u0111\u1ECBnh danh t\xE0i kho\u1EA3n ng\u01B0\u1EDDi d\xF9ng" }, 400);
    }
    const existingUser = await c.env.DB.prepare("SELECT id, name, email, password, role, department, phone, avatar, status FROM users WHERE id = ?").bind(userId).first();
    if (!existingUser) {
      return c.json({ success: false, message: "Kh\xF4ng t\xECm th\u1EA5y th\xF4ng tin t\xE0i kho\u1EA3n ng\u01B0\u1EDDi d\xF9ng" }, 404);
    }
    const {
      name,
      phone,
      avatar,
      department,
      current_password,
      new_password
    } = body;
    let updatedPassword = existingUser.password;
    if (new_password && new_password.trim()) {
      if (!current_password) {
        return c.json({ success: false, message: "Vui l\xF2ng nh\u1EADp m\u1EADt kh\u1EA9u hi\u1EC7n t\u1EA1i \u0111\u1EC3 x\xE1c th\u1EF1c \u0111\u1ED5i m\u1EADt kh\u1EA9u" }, 400);
      }
      if (current_password.trim() !== existingUser.password) {
        return c.json({ success: false, message: "M\u1EADt kh\u1EA9u hi\u1EC7n t\u1EA1i kh\xF4ng ch\xEDnh x\xE1c. Vui l\xF2ng ki\u1EC3m tra l\u1EA1i!" }, 400);
      }
      if (new_password.trim().length < 6) {
        return c.json({ success: false, message: "M\u1EADt kh\u1EA9u m\u1EDBi ph\u1EA3i c\xF3 t\u1ED1i thi\u1EC3u 6 k\xFD t\u1EF1" }, 400);
      }
      updatedPassword = new_password.trim();
    }
    const newName = name !== void 0 ? name.trim() : existingUser.name;
    const newPhone = phone !== void 0 ? phone.trim() : existingUser.phone;
    const newAvatar = avatar !== void 0 ? avatar.trim() : existingUser.avatar;
    const newDept = department !== void 0 && department.trim() ? department.trim() : existingUser.department;
    await c.env.DB.prepare(`
      UPDATE users
      SET name = ?,
          phone = ?,
          avatar = ?,
          department = ?,
          password = ?
      WHERE id = ?
    `).bind(
      newName,
      newPhone,
      newAvatar,
      newDept,
      updatedPassword,
      userId
    ).run();
    const updatedUser = {
      id: existingUser.id,
      name: newName,
      email: existingUser.email,
      role: existingUser.role,
      department: newDept,
      phone: newPhone,
      avatar: newAvatar,
      status: existingUser.status
    };
    return c.json({
      success: true,
      message: "C\u1EADp nh\u1EADt th\xF4ng tin c\xE1 nh\xE2n th\xE0nh c\xF4ng!",
      data: { user: updatedUser }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.get("/api/auth/profile", async (c) => {
  try {
    const userId = c.req.query("id") || c.req.header("x-user-id");
    if (!userId) {
      return c.json({ success: false, message: "Thi\u1EBFu \u0111\u1ECBnh danh t\xE0i kho\u1EA3n" }, 400);
    }
    const user = await c.env.DB.prepare("SELECT id, name, email, role, department, phone, avatar, status FROM users WHERE id = ?").bind(userId).first();
    if (!user) {
      return c.json({ success: false, message: "Kh\xF4ng t\xECm th\u1EA5y ng\u01B0\u1EDDi d\xF9ng" }, 404);
    }
    const totalAttendance = await c.env.DB.prepare("SELECT count(*) as count FROM attendance WHERE user_id = ?").bind(userId).first("count") || 0;
    const assignedTasks = await c.env.DB.prepare("SELECT count(*) as count FROM tasks WHERE assigned_to_user_id = ?").bind(userId).first("count") || 0;
    const completedTasks = await c.env.DB.prepare("SELECT count(*) as count FROM tasks WHERE assigned_to_user_id = ? AND status = 'COMPLETED'").bind(userId).first("count") || 0;
    return c.json({
      success: true,
      data: {
        user,
        stats: {
          totalAttendance: Number(totalAttendance),
          assignedTasks: Number(assignedTasks),
          completedTasks: Number(completedTasks)
        }
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.get("/api/reports/dashboard-summary", async (c) => {
  try {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let assetsQuery = "SELECT status, price FROM assets WHERE company_id = ?";
    let finQuery = "SELECT type, amount FROM finance WHERE company_id = ?";
    let tasksQuery = "SELECT id, title, due_date, status, priority FROM tasks WHERE company_id = ?";
    let contractsQuery = "SELECT id, title, end_date, status FROM contracts WHERE company_id = ?";
    let usersCountQuery = "SELECT count(*) as count FROM users WHERE company_id = ?";
    let params = [companyId];
    if (isSuperAdmin && companyId === "ALL") {
      assetsQuery = "SELECT status, price FROM assets";
      finQuery = "SELECT type, amount FROM finance";
      tasksQuery = "SELECT id, title, due_date, status, priority FROM tasks";
      contractsQuery = "SELECT id, title, end_date, status FROM contracts";
      usersCountQuery = "SELECT count(*) as count FROM users";
      params = [];
    }
    const assetsRes = await c.env.DB.prepare(assetsQuery).bind(...params).all();
    const assets = assetsRes.results || [];
    const totalAssets = assets.length;
    const inUseAssets = assets.filter((a) => a.status === "IN_USE").length;
    const maintenanceAssets = assets.filter((a) => a.status === "MAINTENANCE").length;
    const totalAssetValue = assets.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
    const finRes = await c.env.DB.prepare(finQuery).bind(...params).all();
    const finance = finRes.results || [];
    const totalRevenue = finance.filter((f) => f.type === "REVENUE").reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const totalExpense = finance.filter((f) => f.type === "EXPENSE").reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const netProfit = totalRevenue - totalExpense;
    const tasksRes = await c.env.DB.prepare(tasksQuery).bind(...params).all();
    const tasks = tasksRes.results || [];
    const pendingTasks = tasks.filter((t) => t.status !== "COMPLETED");
    const overdueTasks = pendingTasks.filter((t) => t.due_date < today);
    const upcomingTasks = pendingTasks.filter((t) => {
      const diff = Math.ceil((new Date(t.due_date) - new Date(today)) / (1e3 * 60 * 60 * 24));
      return diff >= 0 && diff <= 3;
    });
    const contractsRes = await c.env.DB.prepare(contractsQuery).bind(...params).all();
    const contracts = contractsRes.results || [];
    const activeContracts = contracts.filter((ct) => ct.status === "ACTIVE");
    const expiringContracts = activeContracts.filter((ct) => {
      if (!ct.end_date) return false;
      const diff = Math.ceil((new Date(ct.end_date) - new Date(today)) / (1e3 * 60 * 60 * 24));
      return diff >= 0 && diff <= 30;
    });
    const usersCount = (await c.env.DB.prepare(usersCountQuery).bind(...params).first())?.count || 0;
    const urgentReminders = [];
    if (companyId && companyId !== "ALL" && companyId !== "SYSTEM") {
      try {
        const pendingKeys = await c.env.DB.prepare("SELECT * FROM license_keys WHERE company_id = ? AND status = 'ACTIVE'").bind(companyId).all();
        for (const pk of pendingKeys?.results || []) {
          urgentReminders.push({
            id: `lic_${pk.id}`,
            title: `\u{1F511} B\u1EA3n quy\u1EC1n m\u1EDBi: B\u1EA1n \u0111\u01B0\u1EE3c c\u1EA5p m\xE3 "${pk.license_key}" (${pk.plan_name || pk.plan_code}). Nh\u1EA5n \u0111\u1EC3 k\xEDch ho\u1EA1t ngay!`,
            date: pk.created_at ? pk.created_at.slice(0, 10) : today,
            level: "warning",
            key: pk.license_key
          });
        }
      } catch (err) {
        console.error("L\u1ED7i truy v\u1EA5n pending license keys:", err);
      }
    }
    urgentReminders.push(
      ...overdueTasks.map((t) => ({
        id: `ovd_${t.id}`,
        title: `C\xF4ng vi\u1EC7c qu\xE1 h\u1EA1n: "${t.title}"`,
        date: t.due_date,
        level: "danger"
      })),
      ...upcomingTasks.map((t) => ({
        id: `upc_${t.id}`,
        title: `C\xF4ng vi\u1EC7c s\u1EAFp \u0111\u1EBFn h\u1EA1n: "${t.title}"`,
        date: t.due_date,
        level: "warning"
      })),
      ...expiringContracts.map((ct) => ({
        id: `ctr_${ct.id}`,
        title: `H\u1EE3p \u0111\u1ED3ng "${ct.title}" s\u1EAFp h\u1EBFt h\u1EA1n v\xE0o ${ct.end_date}`,
        date: ct.end_date,
        level: "info"
      }))
    );
    let currentCompanyName = "OMNI ASSETS";
    if (companyId && companyId !== "ALL" && companyId !== "SYSTEM") {
      const compTenant = await c.env.DB.prepare("SELECT company_name FROM company_tenants WHERE id = ?").bind(companyId).first().catch(() => null);
      if (compTenant?.company_name) {
        currentCompanyName = compTenant.company_name;
      }
    }
    return c.json({
      success: true,
      data: {
        stats: {
          totalAssets,
          inUseAssets,
          maintenanceAssets,
          totalAssetValue,
          pendingTasksCount: pendingTasks.length,
          overdueTasksCount: overdueTasks.length,
          upcomingTasksCount: upcomingTasks.length,
          totalRevenue,
          totalExpense,
          netProfit,
          activeContractsCount: activeContracts.length,
          totalUsersCount: usersCount
        },
        urgentReminders,
        isCloudflare: true,
        company_name: currentCompanyName,
        companyName: currentCompanyName
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.get("/api/assets", async (c) => {
  try {
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let query = `
      SELECT a.*, 
             u.name as assigned_user_name, 
             u.department as assigned_user_department
      FROM assets a
      LEFT JOIN users u ON a.assigned_to_user_id = u.id
      WHERE a.company_id = ?
      ORDER BY a.created_at DESC
    `;
    let params = [companyId];
    if (isSuperAdmin && companyId === "ALL") {
      query = `
        SELECT a.*, 
               u.name as assigned_user_name, 
               u.department as assigned_user_department
        FROM assets a
        LEFT JOIN users u ON a.assigned_to_user_id = u.id
        ORDER BY a.created_at DESC
      `;
      params = [];
    }
    const res = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ success: true, data: res.results || [] });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.post("/api/assets", async (c) => {
  try {
    const { companyId } = await getTenantContext(c);
    const license = await getLicenseStatus(c.env.DB, companyId);
    if (!license.isPaid) {
      const maxAllowed = license.limits?.maxAssets || 20;
      const count = (await c.env.DB.prepare("SELECT count(*) as count FROM assets WHERE company_id = ?").bind(companyId).first())?.count || 0;
      if (count >= maxAllowed) {
        return c.json({
          success: false,
          code: "LICENSE_LIMIT_REACHED",
          message: license.isTrial ? `B\u1EA3n D\xF9ng Th\u1EED 2 Th\xE1ng (0\u0111) gi\u1EDBi h\u1EA1n t\u1ED1i \u0111a ${maxAllowed} t\xE0i s\u1EA3n. B\u1EA1n \u0111\xE3 d\xF9ng h\u1EBFt ${count}/${maxAllowed} t\xE0i s\u1EA3n. Vui l\xF2ng n\xE2ng c\u1EA5p l\xEAn G\xF3i B\u1EA3n Quy\u1EC1n Ch\xEDnh Th\u1EE9c \u0111\u1EC3 qu\u1EA3n l\xFD t\xE0i s\u1EA3n kh\xF4ng gi\u1EDBi h\u1EA1n!` : `G\xF3i d\xF9ng th\u1EED \u0111\xE3 h\u1EBFt h\u1EA1n (gi\u1EDBi h\u1EA1n t\u1ED1i \u0111a ${maxAllowed} t\xE0i s\u1EA3n). Vui l\xF2ng thanh to\xE1n k\xEDch ho\u1EA1t b\u1EA3n quy\u1EC1n \u0111\u1EC3 ti\u1EBFp t\u1EE5c th\xEAm t\xE0i s\u1EA3n!`
        }, 403);
      }
    }
    const body = await c.req.json();
    const id = `ast_${Date.now()}`;
    const code = body.code || `TS-${(/* @__PURE__ */ new Date()).getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    await c.env.DB.prepare(`
      INSERT INTO assets (id, code, name, category, serial_number, purchase_date, price, status, location, assigned_to_user_id, notes, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      code,
      body.name,
      body.category,
      body.serial_number || "",
      body.purchase_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      Number(body.price) || 0,
      body.status || "AVAILABLE",
      body.location || "Kho c\xF4ng ty",
      body.assigned_to_user_id || null,
      body.notes || "",
      companyId
    ).run();
    return c.json({ success: true, data: { id, code, ...body } });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.put("/api/assets/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    const body = await c.req.json();
    let sql = `
      UPDATE assets
      SET name = COALESCE(?, name),
          category = COALESCE(?, category),
          serial_number = COALESCE(?, serial_number),
          price = COALESCE(?, price),
          status = COALESCE(?, status),
          location = COALESCE(?, location),
          assigned_to_user_id = COALESCE(?, assigned_to_user_id),
          notes = COALESCE(?, notes)
      WHERE id = ?
    `;
    let params = [
      body.name !== void 0 ? body.name : null,
      body.category !== void 0 ? body.category : null,
      body.serial_number !== void 0 ? body.serial_number : null,
      body.price !== void 0 ? body.price : null,
      body.status !== void 0 ? body.status : null,
      body.location !== void 0 ? body.location : null,
      body.assigned_to_user_id !== void 0 ? body.assigned_to_user_id : null,
      body.notes !== void 0 ? body.notes : null,
      id
    ];
    if (!isSuperAdmin || companyId !== "ALL") {
      sql += " AND (company_id = ? OR company_id IS NULL)";
      params.push(companyId);
    }
    await c.env.DB.prepare(sql).bind(...params).run();
    return c.json({ success: true, message: "\u0110\xE3 c\u1EADp nh\u1EADt t\xE0i s\u1EA3n" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.delete("/api/assets/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let sql = "DELETE FROM assets WHERE id = ?";
    let params = [id];
    if (!isSuperAdmin || companyId !== "ALL") {
      sql += " AND (company_id = ? OR company_id IS NULL)";
      params.push(companyId);
    }
    await c.env.DB.prepare(sql).bind(...params).run();
    return c.json({ success: true, message: "\u0110\xE3 x\xF3a t\xE0i s\u1EA3n" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.get("/api/finance", async (c) => {
  try {
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let sql = "SELECT * FROM finance WHERE company_id = ? ORDER BY date DESC, created_at DESC";
    let params = [companyId];
    if (isSuperAdmin && companyId === "ALL") {
      sql = "SELECT * FROM finance ORDER BY date DESC, created_at DESC";
      params = [];
    }
    const res = await c.env.DB.prepare(sql).bind(...params).all();
    return c.json({ success: true, data: res.results || [] });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.get("/api/finance/monthly-summary", async (c) => {
  try {
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let sql = "SELECT * FROM finance WHERE company_id = ?";
    let params = [companyId];
    if (isSuperAdmin && companyId === "ALL") {
      sql = "SELECT * FROM finance";
      params = [];
    }
    const res = await c.env.DB.prepare(sql).bind(...params).all();
    const list = res.results || [];
    const summaryMap = {};
    for (let i = 1; i <= 12; i++) {
      const monthKey = `2024-${String(i).padStart(2, "0")}`;
      summaryMap[monthKey] = { month: `T${i}`, revenue: 0, expense: 0, profit: 0 };
    }
    if (companyId === "comp_1") {
      const sampleTrend = [
        { m: "2024-01", rev: 95e6, exp: 4e7 },
        { m: "2024-02", rev: 11e7, exp: 45e6 },
        { m: "2024-03", rev: 135e6, exp: 52e6 },
        { m: "2024-04", rev: 16e7, exp: 58e6 },
        { m: "2024-05", rev: 145e6, exp: 62e6 },
        { m: "2024-06", rev: 17e7, exp: 465e5 }
      ];
      sampleTrend.forEach((s) => {
        if (summaryMap[s.m]) {
          summaryMap[s.m].revenue = s.rev;
          summaryMap[s.m].expense = s.exp;
          summaryMap[s.m].profit = s.rev - s.exp;
        }
      });
    }
    list.forEach((item) => {
      const ym = item.date ? item.date.slice(0, 7) : "2024-06";
      if (!summaryMap[ym]) {
        const monthNum = ym.split("-")[1] || "06";
        summaryMap[ym] = { month: `T${parseInt(monthNum, 10)}`, revenue: 0, expense: 0, profit: 0 };
      }
      if (item.type === "REVENUE") summaryMap[ym].revenue += Number(item.amount);
      if (item.type === "EXPENSE") summaryMap[ym].expense += Number(item.amount);
      summaryMap[ym].profit = summaryMap[ym].revenue - summaryMap[ym].expense;
    });
    const monthlyData = Object.values(summaryMap);
    const totalRevenue = monthlyData.reduce((acc, cur) => acc + cur.revenue, 0);
    const totalExpense = monthlyData.reduce((acc, cur) => acc + cur.expense, 0);
    return c.json({
      success: true,
      data: {
        monthlyData,
        totalRevenue,
        totalExpense,
        netProfit: totalRevenue - totalExpense,
        growthRate: totalRevenue > 0 ? "+18.4%" : "0%"
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.post("/api/finance", async (c) => {
  try {
    const { companyId } = await getTenantContext(c);
    const license = await getLicenseStatus(c.env.DB);
    if (license.isDemo) {
      const count = (await c.env.DB.prepare("SELECT count(*) as count FROM finance WHERE company_id = ?").bind(companyId).first())?.count || 0;
      if (count >= 5) {
        return c.json({
          success: false,
          code: "LICENSE_LIMIT_REACHED",
          message: "B\u1EA3n D\xF9ng Th\u1EED (Demo) gi\u1EDBi h\u1EA1n t\u1ED1i \u0111a 5 giao d\u1ECBch thu chi. Vui l\xF2ng k\xEDch ho\u1EA1t B\u1EA3n Quy\u1EC1n Doanh Nghi\u1EC7p \u0111\u1EC3 ghi nh\u1EADn kh\xF4ng gi\u1EDBi h\u1EA1n!"
        }, 403);
      }
    }
    const body = await c.req.json();
    const id = `fin_${Date.now()}`;
    const invoice = body.invoice_number || `HD-${Date.now().toString().slice(-6)}`;
    await c.env.DB.prepare(`
      INSERT INTO finance (id, type, category, amount, date, description, invoice_number, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.type,
      body.category,
      Number(body.amount),
      body.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      body.description || "",
      invoice,
      companyId
    ).run();
    return c.json({ success: true, message: "\u0110\xE3 th\xEAm giao d\u1ECBch" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.delete("/api/finance/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let sql = "DELETE FROM finance WHERE id = ?";
    let params = [id];
    if (!isSuperAdmin || companyId !== "ALL") {
      sql += " AND (company_id = ? OR company_id IS NULL)";
      params.push(companyId);
    }
    await c.env.DB.prepare(sql).bind(...params).run();
    return c.json({ success: true, message: "\u0110\xE3 x\xF3a giao d\u1ECBch" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.get("/api/tasks", async (c) => {
  try {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let query = `
      SELECT t.*, u.name as assigned_user_name, u.avatar as assigned_user_avatar, u.department as assigned_user_department
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to_user_id = u.id
      WHERE t.company_id = ?
      ORDER BY t.due_date ASC
    `;
    let params = [companyId];
    if (isSuperAdmin && companyId === "ALL") {
      query = `
        SELECT t.*, u.name as assigned_user_name, u.avatar as assigned_user_avatar, u.department as assigned_user_department
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to_user_id = u.id
        ORDER BY t.due_date ASC
      `;
      params = [];
    }
    const res = await c.env.DB.prepare(query).bind(...params).all();
    const list = (res.results || []).map((t) => {
      let urgency = "NORMAL";
      if (t.status !== "COMPLETED") {
        if (t.due_date < today) {
          urgency = "OVERDUE";
        } else if (t.due_date === today) {
          urgency = "TODAY";
        } else {
          const diff = Math.ceil((new Date(t.due_date) - new Date(today)) / (1e3 * 60 * 60 * 24));
          if (diff <= 3) urgency = "UPCOMING";
        }
      }
      return { ...t, urgency };
    });
    return c.json({ success: true, data: list });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.post("/api/tasks", async (c) => {
  try {
    const { companyId } = await getTenantContext(c);
    const body = await c.req.json();
    const id = `tsk_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO tasks (id, title, description, assigned_to_user_id, due_date, priority, status, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.title,
      body.description || "",
      body.assigned_to_user_id || null,
      body.due_date,
      body.priority || "MEDIUM",
      "PENDING",
      companyId
    ).run();
    return c.json({ success: true, message: "\u0110\xE3 t\u1EA1o c\xF4ng vi\u1EC7c" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.put("/api/tasks/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    const body = await c.req.json();
    let sql = `
      UPDATE tasks
      SET status = COALESCE(?, status),
          title = COALESCE(?, title),
          priority = COALESCE(?, priority)
      WHERE id = ?
    `;
    let params = [
      body.status !== void 0 ? body.status : null,
      body.title !== void 0 ? body.title : null,
      body.priority !== void 0 ? body.priority : null,
      id
    ];
    if (!isSuperAdmin || companyId !== "ALL") {
      sql += " AND (company_id = ? OR company_id IS NULL)";
      params.push(companyId);
    }
    await c.env.DB.prepare(sql).bind(...params).run();
    return c.json({ success: true, message: "\u0110\xE3 c\u1EADp nh\u1EADt c\xF4ng vi\u1EC7c" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.delete("/api/tasks/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let sql = "DELETE FROM tasks WHERE id = ?";
    let params = [id];
    if (!isSuperAdmin || companyId !== "ALL") {
      sql += " AND (company_id = ? OR company_id IS NULL)";
      params.push(companyId);
    }
    await c.env.DB.prepare(sql).bind(...params).run();
    return c.json({ success: true, message: "\u0110\xE3 x\xF3a c\xF4ng vi\u1EC7c" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
async function initContractColumns(db) {
  try {
    await db.prepare("ALTER TABLE contracts ADD COLUMN terms TEXT").run();
  } catch (_) {
  }
  try {
    await db.prepare("ALTER TABLE contracts ADD COLUMN appendices TEXT").run();
  } catch (_) {
  }
}
__name(initContractColumns, "initContractColumns");
app.get("/api/contracts", async (c) => {
  try {
    await initContractColumns(c.env.DB);
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let sql = "SELECT * FROM contracts WHERE company_id = ? ORDER BY start_date DESC";
    let params = [companyId];
    if (isSuperAdmin && companyId === "ALL") {
      sql = "SELECT * FROM contracts ORDER BY start_date DESC";
      params = [];
    }
    const res = await c.env.DB.prepare(sql).bind(...params).all();
    return c.json({ success: true, data: res.results || [] });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.post("/api/contracts", async (c) => {
  try {
    await initContractColumns(c.env.DB);
    const { companyId } = await getTenantContext(c);
    const license = await getLicenseStatus(c.env.DB, companyId);
    if (!license.isPaid) {
      const maxAllowed = license.limits?.maxContracts || 5;
      const count = (await c.env.DB.prepare("SELECT count(*) as count FROM contracts WHERE company_id = ?").bind(companyId).first())?.count || 0;
      if (count >= maxAllowed) {
        return c.json({
          success: false,
          code: "LICENSE_LIMIT_REACHED",
          message: license.isTrial ? `B\u1EA3n D\xF9ng Th\u1EED 2 Th\xE1ng (0\u0111) gi\u1EDBi h\u1EA1n t\u1ED1i \u0111a ${maxAllowed} h\u1EE3p \u0111\u1ED3ng. B\u1EA1n \u0111\xE3 t\u1EA1o \u0111\u1EE7 ${count}/${maxAllowed} h\u1EE3p \u0111\u1ED3ng. Vui l\xF2ng n\xE2ng c\u1EA5p l\xEAn G\xF3i B\u1EA3n Quy\u1EC1n Ch\xEDnh Th\u1EE9c \u0111\u1EC3 qu\u1EA3n l\xFD h\u1EE3p \u0111\u1ED3ng kh\xF4ng gi\u1EDBi h\u1EA1n!` : `G\xF3i d\xF9ng th\u1EED \u0111\xE3 h\u1EBFt h\u1EA1n (gi\u1EDBi h\u1EA1n t\u1ED1i \u0111a ${maxAllowed} h\u1EE3p \u0111\u1ED3ng). Vui l\xF2ng thanh to\xE1n n\xE2ng c\u1EA5p b\u1EA3n quy\u1EC1n \u0111\u1EC3 ti\u1EBFp t\u1EE5c l\u01B0u tr\u1EEF h\u1EE3p \u0111\u1ED3ng!`
        }, 403);
      }
    }
    const body = await c.req.json();
    const id = `ctr_${Date.now()}`;
    const code = body.code || `H\u0110-${(/* @__PURE__ */ new Date()).getFullYear()}/${Math.floor(10 + Math.random() * 90)}`;
    const terms = typeof body.terms === "string" ? body.terms : body.terms ? JSON.stringify(body.terms) : "";
    const appendices = typeof body.appendices === "string" ? body.appendices : body.appendices ? JSON.stringify(body.appendices) : "[]";
    await c.env.DB.prepare(`
      INSERT INTO contracts (id, code, title, type, partner_name, value, start_date, end_date, status, notes, terms, appendices, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      code,
      body.title,
      body.type || "PARTNER",
      body.partner_name,
      Number(body.value) || 0,
      body.start_date,
      body.end_date,
      body.status || "ACTIVE",
      body.notes || "",
      terms,
      appendices,
      companyId
    ).run();
    return c.json({ success: true, message: "\u0110\xE3 th\xEAm h\u1EE3p \u0111\u1ED3ng", data: { id, code } });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.put("/api/contracts/:id", async (c) => {
  try {
    await initContractColumns(c.env.DB);
    const id = c.req.param("id");
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    const body = await c.req.json();
    let checkSql = "SELECT * FROM contracts WHERE id = ?";
    let checkParams = [id];
    if (!isSuperAdmin || companyId !== "ALL") {
      checkSql += " AND (company_id = ? OR company_id IS NULL)";
      checkParams.push(companyId);
    }
    const existing = await c.env.DB.prepare(checkSql).bind(...checkParams).first();
    if (!existing) {
      return c.json({ success: false, message: "H\u1EE3p \u0111\u1ED3ng kh\xF4ng t\u1ED3n t\u1EA1i" }, 404);
    }
    const terms = body.terms !== void 0 ? typeof body.terms === "string" ? body.terms : JSON.stringify(body.terms) : existing.terms;
    const appendices = body.appendices !== void 0 ? typeof body.appendices === "string" ? body.appendices : JSON.stringify(body.appendices) : existing.appendices;
    await c.env.DB.prepare(`
      UPDATE contracts
      SET title = ?, type = ?, partner_name = ?, value = ?, start_date = ?, end_date = ?, status = ?, notes = ?, terms = ?, appendices = ?
      WHERE id = ?
    `).bind(
      body.title ?? existing.title,
      body.type ?? existing.type,
      body.partner_name ?? existing.partner_name,
      Number(body.value ?? existing.value) || 0,
      body.start_date ?? existing.start_date,
      body.end_date ?? existing.end_date,
      body.status ?? existing.status,
      body.notes ?? existing.notes,
      terms,
      appendices,
      id
    ).run();
    return c.json({ success: true, message: "C\u1EADp nh\u1EADt h\u1EE3p \u0111\u1ED3ng th\xE0nh c\xF4ng" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.post("/api/contracts/:id/appendices", async (c) => {
  try {
    await initContractColumns(c.env.DB);
    const id = c.req.param("id");
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    const body = await c.req.json();
    let checkSql = "SELECT * FROM contracts WHERE id = ?";
    let checkParams = [id];
    if (!isSuperAdmin || companyId !== "ALL") {
      checkSql += " AND (company_id = ? OR company_id IS NULL)";
      checkParams.push(companyId);
    }
    const contract = await c.env.DB.prepare(checkSql).bind(...checkParams).first();
    if (!contract) {
      return c.json({ success: false, message: "Kh\xF4ng t\xECm th\u1EA5y h\u1EE3p \u0111\u1ED3ng" }, 404);
    }
    let appendicesList = [];
    try {
      if (contract.appendices) appendicesList = JSON.parse(contract.appendices);
    } catch (_) {
    }
    if (!Array.isArray(appendicesList)) appendicesList = [];
    const newAppendix = {
      id: `pl_${Date.now()}`,
      code: body.code || `PL-${String(appendicesList.length + 1).padStart(2, "0")}/${contract.code}`,
      title: body.title || `Ph\u1EE5 l\u1EE5c s\u1ED1 ${appendicesList.length + 1}`,
      date: body.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      adjustment_value: Number(body.adjustment_value) || 0,
      content: body.content || "",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    appendicesList.push(newAppendix);
    await c.env.DB.prepare("UPDATE contracts SET appendices = ? WHERE id = ?").bind(JSON.stringify(appendicesList), id).run();
    return c.json({
      success: true,
      message: `\u0110\xE3 th\xEAm ${newAppendix.title} th\xE0nh c\xF4ng!`,
      data: newAppendix
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.get("/api/contracts/handover/list", async (c) => {
  try {
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let query = `
      SELECT h.*, 
             a.name as asset_name, a.code as asset_code,
             u.name as user_name, u.department as user_department
      FROM handover_protocols h
      LEFT JOIN assets a ON h.asset_id = a.id
      LEFT JOIN users u ON h.user_id = u.id
      WHERE h.company_id = ?
      ORDER BY h.handover_date DESC
    `;
    let params = [companyId];
    if (isSuperAdmin && companyId === "ALL") {
      query = `
        SELECT h.*, 
               a.name as asset_name, a.code as asset_code,
               u.name as user_name, u.department as user_department
        FROM handover_protocols h
        LEFT JOIN assets a ON h.asset_id = a.id
        LEFT JOIN users u ON h.user_id = u.id
        ORDER BY h.handover_date DESC
      `;
      params = [];
    }
    const res = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ success: true, data: res.results || [] });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.post("/api/contracts/handover/create", async (c) => {
  try {
    const { companyId } = await getTenantContext(c);
    const license = await getLicenseStatus(c.env.DB, companyId);
    if (!license.isPaid) {
      const maxAllowed = license.limits?.maxHandovers || 5;
      const count = (await c.env.DB.prepare("SELECT count(*) as count FROM handover_protocols WHERE company_id = ?").bind(companyId).first())?.count || 0;
      if (count >= maxAllowed) {
        return c.json({
          success: false,
          code: "LICENSE_LIMIT_REACHED",
          message: license.isTrial ? `B\u1EA3n D\xF9ng Th\u1EED 2 Th\xE1ng (0\u0111) gi\u1EDBi h\u1EA1n t\u1ED1i \u0111a ${maxAllowed} bi\xEAn b\u1EA3n b\xE0n giao. B\u1EA1n \u0111\xE3 t\u1EA1o \u0111\u1EE7 ${count}/${maxAllowed} bi\xEAn b\u1EA3n. Vui l\xF2ng n\xE2ng c\u1EA5p l\xEAn G\xF3i B\u1EA3n Quy\u1EC1n Ch\xEDnh Th\u1EE9c \u0111\u1EC3 qu\u1EA3n l\xFD bi\xEAn b\u1EA3n kh\xF4ng gi\u1EDBi h\u1EA1n!` : `G\xF3i d\xF9ng th\u1EED \u0111\xE3 h\u1EBFt h\u1EA1n (gi\u1EDBi h\u1EA1n t\u1ED1i \u0111a ${maxAllowed} bi\xEAn b\u1EA3n). Vui l\xF2ng thanh to\xE1n b\u1EA3n quy\u1EC1n \u0111\u1EC3 ti\u1EBFp t\u1EE5c t\u1EA1o bi\xEAn b\u1EA3n b\xE0n giao!`
        }, 403);
      }
    }
    const body = await c.req.json();
    const id = `bb_${Date.now()}`;
    const code = body.code || `BBBG-${(/* @__PURE__ */ new Date()).getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    await c.env.DB.prepare(`
      INSERT INTO handover_protocols (id, code, asset_id, user_id, type, handover_date, condition, status, notes, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      code,
      body.asset_id,
      body.user_id,
      body.type || "HANDOVER",
      body.handover_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      body.condition || "Ho\u1EA1t \u0111\u1ED9ng t\u1ED1t",
      "COMPLETED",
      body.notes || "",
      companyId
    ).run();
    if (body.type === "RETURN") {
      await c.env.DB.prepare('UPDATE assets SET assigned_to_user_id = NULL, status = "AVAILABLE" WHERE id = ?').bind(body.asset_id).run();
    } else {
      await c.env.DB.prepare('UPDATE assets SET assigned_to_user_id = ?, status = "IN_USE" WHERE id = ?').bind(body.user_id, body.asset_id).run();
    }
    return c.json({ success: true, message: "\u0110\xE3 l\u1EADp bi\xEAn b\u1EA3n" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
async function initAiTemplateTable(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS ai_contract_templates (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        category_name TEXT,
        summary TEXT,
        structure_schema TEXT,
        sample_content TEXT,
        company_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  } catch (_) {
  }
}
__name(initAiTemplateTable, "initAiTemplateTable");
app.get("/api/contracts/ai/templates", async (c) => {
  try {
    await initAiTemplateTable(c.env.DB);
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let sql = "SELECT * FROM ai_contract_templates WHERE company_id = ? OR company_id IS NULL ORDER BY created_at DESC";
    let params = [companyId];
    if (isSuperAdmin && companyId === "ALL") {
      sql = "SELECT * FROM ai_contract_templates ORDER BY created_at DESC";
      params = [];
    }
    let res = await c.env.DB.prepare(sql).bind(...params).all();
    let templates = res.results || [];
    if (templates.length === 0) {
      const initialSeed = [
        {
          id: "tpl_service_it",
          title: "H\u1EE3p \u0110\u1ED3ng Cung C\u1EA5p D\u1ECBch V\u1EE5 V\u1EADn H\xE0nh IT & Ph\u1EA7n M\u1EC1m",
          type: "SERVICE",
          category_name: "H\u1EE3p \u0110\u1ED3ng D\u1ECBch V\u1EE5",
          summary: "Cung \u1EE9ng d\u1ECBch v\u1EE5 tri\u1EC3n khai h\u1EC7 th\u1ED1ng, ph\u1EA7n m\u1EC1m v\xE0 b\u1EA3o tr\xEC v\u1EADn h\xE0nh \u0111\u1ECBnh k\u1EF3 cho \u0111\u1ED1i t\xE1c.",
          structure_schema: JSON.stringify({
            requiredFields: ["B\xEAn A (Kh\xE1ch h\xE0ng)", "B\xEAn B (\u0110\u01A1n v\u1ECB cung c\u1EA5p)", "Ph\u1EA1m vi c\xF4ng vi\u1EC7c", "Gi\xE1 tr\u1ECB h\u1EE3p \u0111\u1ED3ng", "Th\u1EDDi h\u1EA1n thanh to\xE1n", "Ti\xEAu chu\u1EA9n nghi\u1EC7m thu SLA"],
            articles: ["\u0110i\u1EC1u 1: N\u1ED9i dung v\xE0 ph\u1EA1m vi d\u1ECBch v\u1EE5", "\u0110i\u1EC1u 2: Gi\xE1 tr\u1ECB h\u1EE3p \u0111\u1ED3ng & Ti\u1EBFn \u0111\u1ED9 thanh to\xE1n", "\u0110i\u1EC1u 3: Cam k\u1EBFt ch\u1EA5t l\u01B0\u1EE3ng & B\u1EA3o h\xE0nh", "\u0110i\u1EC1u 4: Quy\u1EC1n v\xE0 ngh\u0129a v\u1EE5 hai b\xEAn", "\u0110i\u1EC1u 5: B\u1EA3o m\u1EADt th\xF4ng tin & Gi\u1EA3i quy\u1EBFt tranh ch\u1EA5p"]
          }),
          sample_content: `\u0110I\u1EC0U 1: PH\u1EA0M VI D\u1ECACH V\u1EE4 V\xC0 N\u1ED8I DUNG TH\u1EF0C HI\u1EC6N
1.1. B\xEAn B cung c\u1EA5p d\u1ECBch v\u1EE5 qu\u1EA3n tr\u1ECB, v\u1EADn h\xE0nh v\xE0 t\u1ED1i \u01B0u h\xF3a h\u1EC7 th\u1ED1ng m\xE1y ch\u1EE7, ph\u1EA7n m\u1EC1m qu\u1EA3n l\xFD cho B\xEAn A.
1.2. B\xEAn B cam k\u1EBFt duy tr\xEC h\u1EC7 th\u1ED1ng ho\u1EA1t \u0111\u1ED9ng \u1ED5n \u0111\u1ECBnh 99.9%, h\u1ED7 tr\u1EE3 k\u1EF9 thu\u1EADt 24/7 khi ph\xE1t sinh s\u1EF1 c\u1ED1 kh\u1EA9n c\u1EA5p.

\u0110I\u1EC0U 2: GI\xC1 TR\u1ECA V\xC0 PH\u01AF\u01A0NG TH\u1EE8C THANH TO\xC1N
2.1. Chi ph\xED d\u1ECBch v\u1EE5 \u0111\u01B0\u1EE3c quy \u0111\u1ECBnh chi ti\u1EBFt theo t\u1EEBng giai \u0111o\u1EA1n nghi\u1EC7m thu th\u1EF1c t\u1EBF.
2.2. H\xECnh th\u1EE9c thanh to\xE1n: Chuy\u1EC3n kho\u1EA3n ng\xE2n h\xE0ng trong v\xF2ng 07 ng\xE0y l\xE0m vi\u1EC7c k\u1EC3 t\u1EEB ng\xE0y nh\u1EADn \u0111\u1EE7 h\xF3a \u0111\u01A1n t\xE0i ch\xEDnh h\u1EE3p l\u1EC7.

\u0110I\u1EC0U 3: B\u1EA2O H\xC0NH V\xC0 B\u1EA2O TR\xCC \u0110\u1ECANH K\u1EF2
3.1. B\xEAn B th\u1EF1c hi\u1EC7n b\u1EA3o tr\xEC, ki\u1EC3m tra an ninh v\xE0 sao l\u01B0u d\u1EEF li\u1EC7u h\u1EC7 th\u1ED1ng \u0111\u1ECBnh k\u1EF3 h\xE0ng th\xE1ng.
3.2. Khi ph\xE1t sinh s\u1EF1 c\u1ED1, th\u1EDDi gian ph\u1EA3n h\u1ED3i k\u1EF9 thu\u1EADt vi\xEAn kh\xF4ng qu\xE1 30 ph\xFAt v\xE0 kh\u1EAFc ph\u1EE5c trong v\xF2ng 04 gi\u1EDD.

\u0110I\u1EC0U 4: B\u1EA2O M\u1EACT V\xC0 \u0110I\u1EC0U KHO\u1EA2N CHUNG
4.1. Hai b\xEAn cam k\u1EBFt b\u1EA3o m\u1EADt tuy\u1EC7t \u0111\u1ED1i d\u1EEF li\u1EC7u n\u1ED9i b\u1ED9 v\xE0 b\xED m\u1EADt kinh doanh c\u1EE7a nhau.
4.2. M\u1ECDi s\u1EEDa \u0111\u1ED5i, b\u1ED5 sung h\u1EE3p \u0111\u1ED3ng ph\u1EA3i \u0111\u01B0\u1EE3c l\u1EADp th\xE0nh Ph\u1EE5 l\u1EE5c v\u0103n b\u1EA3n c\xF3 ch\u1EEF k\xFD c\u1EE7a \u0111\u1EA1i di\u1EC7n hai b\xEAn.`
        },
        {
          id: "tpl_rental_hardware",
          title: "H\u1EE3p \u0110\u1ED3ng Cho Thu\xEA Thi\u1EBFt B\u1ECB Tin H\u1ECDc & M\xE1y M\xF3c V\u0103n Ph\xF2ng",
          type: "RENTAL",
          category_name: "H\u1EE3p \u0110\u1ED3ng Thu\xEA T\xE0i S\u1EA3n",
          summary: "H\u1EE3p \u0111\u1ED3ng cho thu\xEA laptop, m\xE1y t\xEDnh \u0111\u1EC3 b\xE0n, m\xE1y in k\xE8m \u0111i\u1EC1u kho\u1EA3n \u0111\u1ED5i m\u1EDBi thi\u1EBFt b\u1ECB khi x\u1EA3y ra h\u1ECFng h\xF3c k\u1EF9 thu\u1EADt.",
          structure_schema: JSON.stringify({
            requiredFields: ["Danh m\u1EE5c m\xE1y m\xF3c thu\xEA", "Ti\u1EC1n \u0111\u1EB7t c\u1ECDc", "\u0110\u01A1n gi\xE1 thu\xEA theo th\xE1ng", "\u0110\u1ECBa \u0111i\u1EC3m l\u1EAFp \u0111\u1EB7t", "Quy \u0111\u1ECBnh b\u1EA3o h\xE0nh \u0111\u1ED5i m\xE1y trong 4h"],
            articles: ["\u0110i\u1EC1u 1: \u0110\u1ED1i t\u01B0\u1EE3ng t\xE0i s\u1EA3n cho thu\xEA", "\u0110i\u1EC1u 2: Th\u1EDDi h\u1EA1n thu\xEA v\xE0 ph\xED d\u1ECBch v\u1EE5", "\u0110i\u1EC1u 3: Ti\u1EC1n \u0111\u1EB7t c\u1ECDc v\xE0 ph\u01B0\u01A1ng th\u1EE9c ho\xE0n c\u1ECDc", "\u0110i\u1EC1u 4: Tr\xE1ch nhi\u1EC7m s\u1EED d\u1EE5ng v\xE0 b\u1EA3o d\u01B0\u1EE1ng", "\u0110i\u1EC1u 5: B\xE0n giao v\xE0 thu h\u1ED3i thi\u1EBFt b\u1ECB"]
          }),
          sample_content: `\u0110I\u1EC0U 1: \u0110\u1ED0I T\u01AF\u1EE2NG V\xC0 T\xCCNH TR\u1EA0NG THI\u1EBET B\u1ECA CHO THU\xCA
1.1. B\xEAn A \u0111\u1ED3ng \xFD cho B\xEAn B thu\xEA danh m\u1EE5c thi\u1EBFt b\u1ECB tin h\u1ECDc (laptop/m\xE1y t\xEDnh/m\xE1y in) theo chi ti\u1EBFt trong Ph\u1EE5 l\u1EE5c \u0111\xEDnh k\xE8m.
1.2. To\xE0n b\u1ED9 thi\u1EBFt b\u1ECB b\xE0n giao \u0111\u1EC1u nguy\xEAn tem ni\xEAm phong, ho\u1EA1t \u0111\u1ED9ng \u1ED5n \u0111\u1ECBnh v\xE0 c\xF3 \u0111\u1EA7y \u0111\u1EE7 ph\u1EE5 ki\u1EC7n ch\xEDnh h\xE3ng.

\u0110I\u1EC0U 2: GI\xC1 THU\xCA V\xC0 TI\u1EC0N \u0110\u1EB6T C\u1ECCC
2.1. \u0110\u01A1n gi\xE1 thu\xEA \u0111\u01B0\u1EE3c t\xEDnh tr\u1ECDn g\xF3i theo th\xE1ng, \u0111\xE3 bao g\u1ED3m chi ph\xED b\u1EA3o d\u01B0\u1EE1ng \u0111\u1ECBnh k\u1EF3 v\xE0 thay th\u1EBF linh ki\u1EC7n hao m\xF2n.
2.2. Ti\u1EC1n \u0111\u1EB7t c\u1ECDc \u0111\u01B0\u1EE3c B\xEAn A ho\xE0n tr\u1EA3 nguy\xEAn v\u1EB9n cho B\xEAn B trong v\xF2ng 03 ng\xE0y l\xE0m vi\u1EC7c sau khi k\u1EBFt th\xFAc h\u1EE3p \u0111\u1ED3ng v\xE0 thanh l\xFD t\xE0i s\u1EA3n.

\u0110I\u1EC0U 3: B\u1EA2O H\xC0NH V\xC0 \u0110\u1ED4I M\xC1Y THAY TH\u1EBE
3.1. N\u1EBFu thi\u1EBFt b\u1ECB g\u1EB7p l\u1ED7i ph\u1EA7n c\u1EE9ng do nh\xE0 s\u1EA3n xu\u1EA5t, B\xEAn A cam k\u1EBFt cung c\u1EA5p thi\u1EBFt b\u1ECB t\u01B0\u01A1ng \u0111\u01B0\u01A1ng thay th\u1EBF trong v\xF2ng 04 gi\u1EDD l\xE0m vi\u1EC7c.
3.2. B\xEAn B ch\u1ECBu tr\xE1ch nhi\u1EC7m b\u1EA3o qu\u1EA3n t\xE0i s\u1EA3n t\u1EA1i \u0111\u1ECBa ch\u1EC9 \u0111\xE3 \u0111\u0103ng k\xFD, kh\xF4ng t\u1EF1 \xFD th\xE1o m\u1EDF ho\u1EB7c s\u1EEDa ch\u1EEFa khi ch\u01B0a c\xF3 s\u1EF1 \u0111\u1ED3ng \xFD c\u1EE7a B\xEAn A.`
        },
        {
          id: "tpl_handover_asset",
          title: "Bi\xEAn B\u1EA3n B\xE0n Giao Thi\u1EBFt B\u1ECB & Ph\u01B0\u01A1ng Ti\u1EC7n L\xE0m Vi\u1EC7c Chu\u1EA9n A4",
          type: "HANDOVER",
          category_name: "Bi\xEAn B\u1EA3n B\xE0n Giao",
          summary: "M\u1EABu bi\xEAn b\u1EA3n b\xE0n giao m\xE1y m\xF3c, c\xF4ng c\u1EE5 l\xE0m vi\u1EC7c cho nh\xE2n vi\xEAn m\u1EDBi c\xF3 x\xE1c nh\u1EADn ph\u1EE5 ki\u1EC7n v\xE0 quy \u0111\u1ECBnh b\u1EA3o qu\u1EA3n.",
          structure_schema: JSON.stringify({
            requiredFields: ["\u0110\u1EA1i di\u1EC7n B\xEAn giao", "Nh\xE2n vi\xEAn B\xEAn nh\u1EADn", "M\xE3 t\xE0i s\u1EA3n & Serial m\xE1y", "T\xECnh tr\u1EA1ng ngo\u1EA1i quan & ph\u1EE5 ki\u1EC7n", "Cam k\u1EBFt ho\xE0n tr\u1EA3 khi ngh\u1EC9 vi\u1EC7c"],
            articles: ["\u0110i\u1EC1u 1: Th\xF4ng tin t\xE0i s\u1EA3n b\xE0n giao", "\u0110i\u1EC1u 2: T\xECnh tr\u1EA1ng ph\u1EE5 ki\u1EC7n v\xE0 ph\u1EA7n m\u1EC1m", "\u0110i\u1EC1u 3: Tr\xE1ch nhi\u1EC7m s\u1EED d\u1EE5ng v\xE0 cam k\u1EBFt b\u1ED3i th\u01B0\u1EDDng n\u1EBFu l\xE0m m\u1EA5t"]
          }),
          sample_content: `C\u1ED8NG H\xD2A X\xC3 H\u1ED8I CH\u1EE6 NGH\u0128A VI\u1EC6T NAM
\u0110\u1ED9c l\u1EADp - T\u1EF1 do - H\u1EA1nh ph\xFAc
-------------------------
BI\xCAN B\u1EA2N B\xC0N GIAO T\xC0I S\u1EA2N & THI\u1EBET B\u1ECA L\xC0M VI\u1EC6C

H\xF4m nay, ng\xE0y b\xE0n giao th\u1EF1c t\u1EBF t\u1EA1i v\u0103n ph\xF2ng C\xF4ng ty, ch\xFAng t\xF4i g\u1ED3m c\xF3:
- B\xCAN GIAO (\u0110\u1EA1i di\u1EC7n B\u1ED9 ph\u1EADn Qu\u1EA3n tr\u1ECB Thi\u1EBFt b\u1ECB / IT)
- B\xCAN NH\u1EACN (C\xE1n b\u1ED9 nh\xE2n vi\xEAn ti\u1EBFp nh\u1EADn s\u1EED d\u1EE5ng)

N\u1ED8I DUNG B\xC0N GIAO:
1. Thi\u1EBFt b\u1ECB \u0111\u01B0\u1EE3c c\u1EA5p ph\xE1t theo \u0111\xFAng ch\u1EE9c danh c\xF4ng vi\u1EC7c, g\u1ED3m m\xE1y ch\xEDnh, s\u1EA1c ngu\u1ED3n zin, chu\u1ED9t, t\xFAi ch\u1ED1ng s\u1ED1c v\xE0 ph\u1EE5 ki\u1EC7n k\xE8m theo.
2. Thi\u1EBFt b\u1ECB ho\u1EA1t \u0111\u1ED9ng \u1ED5n \u0111\u1ECBnh, m\xE0n h\xECnh s\xE1ng r\xF5, kh\xF4ng tr\u1EA7y x\u01B0\u1EDBc hay m\xF3p m\xE9o v\u1ECF m\xE1y, tem ni\xEAm phong c\xF2n nguy\xEAn v\u1EB9n.
3. B\xEAn nh\u1EADn cam k\u1EBFt s\u1EED d\u1EE5ng \u0111\xFAng m\u1EE5c \u0111\xEDch c\xF4ng vi\u1EC7c, ch\u1ECBu tr\xE1ch nhi\u1EC7m b\u1EA3o qu\u1EA3n c\u1EA9n th\u1EADn v\xE0 c\xF3 ngh\u0129a v\u1EE5 ho\xE0n tr\u1EA3 nguy\xEAn tr\u1EA1ng cho c\xF4ng ty khi th\xF4i vi\u1EC7c ho\u1EB7c chuy\u1EC3n v\u1ECB tr\xED.`
        }
      ];
      for (const item of initialSeed) {
        await c.env.DB.prepare(`
          INSERT OR REPLACE INTO ai_contract_templates (id, title, type, category_name, summary, structure_schema, sample_content, company_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
        `).bind(item.id, item.title, item.type, item.category_name, item.summary, item.structure_schema, item.sample_content).run();
      }
      res = await c.env.DB.prepare(sql).bind(...params).all();
      templates = res.results || [];
    }
    return c.json({ success: true, data: templates });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.post("/api/contracts/ai/templates", async (c) => {
  try {
    await initAiTemplateTable(c.env.DB);
    const { companyId } = await getTenantContext(c);
    const body = await c.req.json();
    const id = body.id || `tpl_${Date.now()}`;
    const schemaStr = typeof body.structure_schema === "object" ? JSON.stringify(body.structure_schema) : body.structure_schema || "{}";
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO ai_contract_templates (id, title, type, category_name, summary, structure_schema, sample_content, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.title || "M\u1EABu H\u1EE3p \u0110\u1ED3ng T\xF9y Bi\u1EBFn",
      body.type || "CONTRACT",
      body.category_name || "H\u1EE3p \u0110\u1ED3ng Th\u01B0\u01A1ng M\u1EA1i",
      body.summary || "",
      schemaStr,
      body.sample_content || "",
      companyId
    ).run();
    return c.json({ success: true, message: "\u0110\xE3 l\u01B0u m\u1EABu h\u1EE3p \u0111\u1ED3ng th\xE0nh c\xF4ng", data: { id } });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.delete("/api/contracts/ai/templates/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let sql = "DELETE FROM ai_contract_templates WHERE id = ?";
    let params = [id];
    if (!isSuperAdmin || companyId !== "ALL") {
      sql += " AND company_id = ?";
      params.push(companyId);
    }
    await c.env.DB.prepare(sql).bind(...params).run();
    return c.json({ success: true, message: "\u0110\xE3 x\xF3a m\u1EABu h\u1EE3p \u0111\u1ED3ng" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.post("/api/contracts/ai/learn", async (c) => {
  try {
    await initAiTemplateTable(c.env.DB);
    const body = await c.req.json();
    const { rawContent, titleHint, categoryHint, typeHint } = body;
    if (!rawContent || !rawContent.trim()) {
      return c.json({ success: false, message: "Vui l\xF2ng cung c\u1EA5p n\u1ED9i dung v\u0103n b\u1EA3n h\u1EE3p \u0111\u1ED3ng ho\u1EB7c bi\xEAn b\u1EA3n \u0111\u1EC3 AI ph\xE2n t\xEDch" }, 400);
    }
    let geminiApiKey = c.env?.GEMINI_API_KEY || "";
    let geminiModel = c.env?.GEMINI_MODEL || "gemini-flash-latest";
    try {
      const sKey = await c.env.DB.prepare("SELECT value FROM system_settings WHERE key = 'gemini_api_key'").first();
      if (sKey?.value) geminiApiKey = sKey.value.trim();
    } catch (_) {
    }
    const prompt = `B\u1EA1n l\xE0 m\u1ED9t chuy\xEAn gia ph\xE1p ch\u1EBF doanh nghi\u1EC7p v\xE0 ki\u1EBFn tr\xFAc s\u01B0 tri th\u1EE9c h\u1EE3p \u0111\u1ED3ng cao c\u1EA5p.
Nhi\u1EC7m v\u1EE5 c\u1EE7a b\u1EA1n l\xE0 \u0111\u1ECDc hi\u1EC3u, ph\xE2n t\xEDch s\xE2u v\xE0 tr\xEDch xu\u1EA5t c\u1EA5u tr\xFAc v\u0103n b\u1EA3n h\u1EE3p \u0111\u1ED3ng / bi\xEAn b\u1EA3n d\u01B0\u1EDBi \u0111\xE2y \u0111\u1EC3 h\u1ECDc th\xE0nh m\u1ED9t "M\u1EAAU H\u1EE2P \u0110\u1ED2NG / BI\xCAN B\u1EA2N CHU\u1EA8N":

--- V\u0102N B\u1EA2N IMPORT ---
${rawContent.slice(0, 12e3)}
--- H\u1EBET V\u0102N B\u1EA2N ---

H\xE3y tr\u1EA3 v\u1EC1 DUY NH\u1EA4T m\u1ED9t chu\u1ED7i JSON h\u1EE3p l\u1EC7 (kh\xF4ng k\xE8m markdown \`\`\`json \u1EDF ngo\xE0i), c\xF3 c\u1EA5u tr\xFAc ch\xEDnh x\xE1c nh\u01B0 sau:
{
  "title": "T\xEAn chu\u1EA9n h\xF3a c\u1EE7a m\u1EABu v\u0103n b\u1EA3n (V\xED d\u1EE5: H\u1EE3p \u0110\u1ED3ng Thu\xEA M\xE1y M\xF3c, H\u1EE3p \u0110\u1ED3ng D\u1ECBch V\u1EE5...)",
  "type": "M\u1ED9t trong c\xE1c m\xE3: SERVICE | RENTAL | LABOR | PURCHASE | HANDOVER | APPENDIX | PARTNER",
  "category_name": "T\xEAn ph\xE2n lo\u1EA1i (V\xED d\u1EE5: H\u1EE3p \u0110\u1ED3ng D\u1ECBch V\u1EE5, H\u1EE3p \u0110\u1ED3ng Thu\xEA T\xE0i S\u1EA3n, Bi\xEAn B\u1EA3n B\xE0n Giao...)",
  "summary": "T\xF3m t\u1EAFt ng\u1EAFn g\u1ECDn 2-3 c\xE2u v\u1EC1 m\u1EE5c \u0111\xEDch, \u0111\u1ED1i t\u01B0\u1EE3ng \xE1p d\u1EE5ng v\xE0 \u0111i\u1EC3m then ch\u1ED1t c\u1EE7a v\u0103n b\u1EA3n n\xE0y",
  "structure_schema": {
    "requiredFields": ["C\xE1c tr\u01B0\u1EDDng th\xF4ng tin b\u1EAFt bu\u1ED9c c\u1EA7n kh\xE1ch h\xE0ng cung c\u1EA5p khi k\xFD k\u1EBFt (V\xED d\u1EE5: T\xEAn kh\xE1ch h\xE0ng, M\xE3 s\u1ED1 thu\u1EBF, Gi\xE1 tr\u1ECB, Th\u1EDDi h\u1EA1n, \u0110\u1EA1i di\u1EC7n...)"],
    "articles": ["Danh s\xE1ch c\xE1c \u0111i\u1EC1u kho\u1EA3n tr\u1ECDng t\xE2m c\u1EE7a m\u1EABu (V\xED d\u1EE5: \u0110i\u1EC1u 1: Ph\u1EA1m vi..., \u0110i\u1EC1u 2: Gi\xE1 tr\u1ECB..., \u0110i\u1EC1u 3: Nghi\u1EC7m thu...)"]
  },
  "sample_content": "N\u1ED9i dung \u0111i\u1EC1u kho\u1EA3n chu\u1EA9n h\xF3a (c\xE1c \u0110I\u1EC0U 1, \u0110I\u1EC0U 2, \u0110I\u1EC0U 3...) v\u1EDBi c\xE1c bi\u1EBFn s\u1ED1 d\u1EA1ng {{TEN_DOI_TAC}}, {{GIA_TRI_HOP_DONG}}, {{THOI_HAN}} \u0111\u1EC3 sau n\xE0y d\u1EC5 \xE1p d\u1EE5ng."
}`;
    let learnedData = null;
    let needClientGemini = true;
    if (geminiApiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": geminiApiKey
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 3072,
              thinkingConfig: { thinkingBudget: 0 }
            }
          })
        });
        if (res.ok) {
          const json = await res.json();
          const parts = json?.candidates?.[0]?.content?.parts || [];
          const textParts = parts.filter((p) => typeof p.text === "string" && !p.thought).map((p) => p.text);
          const rawText = textParts.join("\n\n") || parts.map((p) => p.text).filter(Boolean).join("\n\n");
          const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          try {
            learnedData = JSON.parse(cleanedText);
            needClientGemini = false;
          } catch (_) {
            console.warn("Cannot parse server Gemini JSON, fallback to client");
          }
        }
      } catch (err) {
        console.error("Server gemini learn error:", err);
      }
    }
    if (learnedData) {
      const { companyId } = await getTenantContext(c);
      const id = `tpl_${Date.now()}`;
      await c.env.DB.prepare(`
        INSERT INTO ai_contract_templates (id, title, type, category_name, summary, structure_schema, sample_content, company_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        learnedData.title || titleHint || "M\u1EABu H\u1EE3p \u0110\u1ED3ng \u0110\xE3 H\u1ECDc",
        learnedData.type || typeHint || "CONTRACT",
        learnedData.category_name || categoryHint || "H\u1EE3p \u0110\u1ED3ng Doanh Nghi\u1EC7p",
        learnedData.summary || "",
        JSON.stringify(learnedData.structure_schema || {}),
        learnedData.sample_content || rawContent,
        companyId
      ).run();
      return c.json({
        success: true,
        message: "AI \u0111\xE3 h\u1ECDc v\xE0 m\xF4 h\xECnh h\xF3a v\u0103n b\u1EA3n h\u1EE3p \u0111\u1ED3ng th\xE0nh c\xF4ng!",
        data: {
          id,
          ...learnedData,
          needClientGemini: false
        }
      });
    }
    return c.json({
      success: true,
      message: "Chu\u1EA9n b\u1ECB d\u1EEF li\u1EC7u \u0111\u1EC3 AI ph\xE2n t\xEDch t\u1EA1i tr\xECnh duy\u1EC7t",
      data: {
        needClientGemini: true,
        prompt,
        geminiApiKey,
        geminiModel,
        rawContent,
        titleHint: titleHint || "M\u1EABu H\u1EE3p \u0110\u1ED3ng \u0110\xE3 H\u1ECDc"
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.post("/api/contracts/ai/generate", async (c) => {
  try {
    const { companyId } = await getTenantContext(c);
    const body = await c.req.json();
    const {
      templateId,
      contractType = "SERVICE",
      partner_name = "",
      representative = "",
      value = "0",
      start_date = "",
      end_date = "",
      custom_requirements = ""
    } = body;
    let template = null;
    if (templateId) {
      template = await c.env.DB.prepare("SELECT * FROM ai_contract_templates WHERE id = ? AND (company_id = ? OR company_id IS NULL)").bind(templateId, companyId).first();
    }
    if (!template) {
      template = await c.env.DB.prepare("SELECT * FROM ai_contract_templates WHERE (company_id = ? OR company_id IS NULL) ORDER BY created_at DESC LIMIT 1").bind(companyId).first();
    }
    let geminiApiKey = c.env?.GEMINI_API_KEY || "";
    let geminiModel = c.env?.GEMINI_MODEL || "gemini-flash-latest";
    try {
      const sKey = await c.env.DB.prepare("SELECT value FROM system_settings WHERE key = 'gemini_api_key'").first();
      if (sKey?.value) geminiApiKey = sKey.value.trim();
    } catch (_) {
    }
    const prompt = `B\u1EA1n l\xE0 chuy\xEAn gia ph\xE1p ch\u1EBF v\xE0 so\u1EA1n th\u1EA3o h\u1EE3p \u0111\u1ED3ng th\u01B0\u01A1ng m\u1EA1i xu\u1EA5t s\u1EAFc.
Nhi\u1EC7m v\u1EE5 c\u1EE7a b\u1EA1n: D\u1EF1a tr\xEAn M\u1EAAU H\u1EE2P \u0110\u1ED2NG \u0110\xC3 H\u1ECCC b\xEAn d\u01B0\u1EDBi, h\xE3y x\xE2y d\u1EF1ng m\u1ED9t b\u1EA3n h\u1EE3p \u0111\u1ED3ng HO\xC0N CH\u1EC8NH, CHUY\xCAN NGHI\u1EC6P, CHU\u1EA8N M\u1EF0C PH\xC1P L\xDD cho kh\xE1ch h\xE0ng theo \u0111\xFAng c\xE1c th\xF4ng tin th\u1EF1c t\u1EBF \u0111\u01B0\u1EE3c cung c\u1EA5p.

--- TH\xD4NG TIN M\u1EAAU H\u1EE2P \u0110\u1ED2NG \u0110\xC3 H\u1ECCC ---
T\xEAn m\u1EABu: ${template?.title || "H\u1EE3p \u0110\u1ED3ng D\u1ECBch V\u1EE5"}
Ph\xE2n lo\u1EA1i: ${template?.category_name || "H\u1EE3p \u0110\u1ED3ng Doanh Nghi\u1EC7p"}
C\u1EA5u tr\xFAc m\u1EABu:
${template?.sample_content || ""}
--- H\u1EBET TH\xD4NG TIN M\u1EAAU ---

--- TH\xD4NG TIN KH\xC1CH H\xC0NG & TH\u1ECEA THU\u1EACN M\u1EDAI ---
\u2022 T\xEAn \u0111\u1ED1i t\xE1c / Kh\xE1ch h\xE0ng (B\xEAn B): ${partner_name || "\u0110\u1ED1i t\xE1c / Kh\xE1ch h\xE0ng"}
\u2022 Ng\u01B0\u1EDDi \u0111\u1EA1i di\u1EC7n ph\xE1p lu\u1EADt: ${representative || "\u0110\u1EA1i di\u1EC7n theo ph\xE1p lu\u1EADt"}
\u2022 T\u1ED5ng gi\xE1 tr\u1ECB h\u1EE3p \u0111\u1ED3ng: ${value} VN\u0110
\u2022 Th\u1EDDi h\u1EA1n th\u1EF1c hi\u1EC7n: T\u1EEB ng\xE0y ${start_date || "ng\xE0y k\xFD"} \u0111\u1EBFn ng\xE0y ${end_date || "ng\xE0y k\u1EBFt th\xFAc"}
\u2022 C\xE1c \u0111i\u1EC1u kho\u1EA3n / y\xEAu c\u1EA7u \u0111\u1EB7c th\xF9 c\u1EE7a kh\xE1ch h\xE0ng: ${custom_requirements || "Th\u1EF1c hi\u1EC7n theo ti\xEAu chu\u1EA9n nghi\u1EC7p v\u1EE5 chu\u1EA9n m\u1EF1c, b\u1EA3o h\xE0nh \u0111\u1EA7y \u0111\u1EE7, h\xF3a \u0111\u01A1n t\xE0i ch\xEDnh h\u1EE3p l\u1EC7."}
--- H\u1EBET TH\xD4NG TIN M\u1EDAI ---

Y\xCAU C\u1EA6U \u0110\u1EA6U RA:
H\xE3y tr\u1EA3 v\u1EC1 DUY NH\u1EA4T m\u1ED9t chu\u1ED7i JSON h\u1EE3p l\u1EC7 (kh\xF4ng k\xE8m markdown \`\`\`json \u1EDF ngo\xE0i) v\u1EDBi c\u1EA5u tr\xFAc:
{
  "title": "Ti\xEAu \u0111\u1EC1 h\u1EE3p \u0111\u1ED3ng (V\xED d\u1EE5: H\u1EE2P \u0110\u1ED2NG CUNG C\u1EA4P D\u1ECACH V\u1EE4 C\xD4NG NGH\u1EC6 V\xC0 V\u1EACN H\xC0NH)",
  "partner_name": "${partner_name}",
  "value": "${value}",
  "start_date": "${start_date}",
  "end_date": "${end_date}",
  "terms": "To\xE0n b\u1ED9 c\xE1c \u0111i\u1EC1u kho\u1EA3n chi ti\u1EBFt (\u0110I\u1EC0U 1: \u0110\u1ED0I T\u01AF\u1EE2NG..., \u0110I\u1EC0U 2: GI\xC1 TR\u1ECA V\xC0 PH\u01AF\u01A0NG TH\u1EE8C THANH TO\xC1N..., \u0110I\u1EC0U 3: TI\u1EBEN \u0110\u1ED8 V\xC0 NGHI\u1EC6M THU..., \u0110I\u1EC0U 4: B\u1EA2O H\xC0NH V\xC0 CAM K\u1EBET \u0110\u1EB6C TH\xD9..., \u0110I\u1EC0U 5: B\u1EA2O M\u1EACT V\xC0 PH\u1EA0T VI PH\u1EA0M..., \u0110I\u1EC0U 6: HI\u1EC6U L\u1EF0C H\u1EE2P \u0110\u1ED2NG) \u0111\xE3 \u0111\u01B0\u1EE3c t\xEDch h\u1EE3p nhu\u1EA7n nhuy\u1EC5n y\xEAu c\u1EA7u \u0111\u1EB7c th\xF9 c\u1EE7a kh\xE1ch h\xE0ng.",
  "notes": "Ghi ch\xFA t\xF3m t\u1EAFt \u0111i\u1EC3m n\u1ED5i b\u1EADt v\xE0 cam k\u1EBFt quan tr\u1ECDng trong h\u1EE3p \u0111\u1ED3ng n\xE0y."
}`;
    let generatedContract = null;
    let needClientGemini = true;
    if (geminiApiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": geminiApiKey
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 3072,
              thinkingConfig: { thinkingBudget: 0 }
            }
          })
        });
        if (res.ok) {
          const json = await res.json();
          const parts = json?.candidates?.[0]?.content?.parts || [];
          const textParts = parts.filter((p) => typeof p.text === "string" && !p.thought).map((p) => p.text);
          const rawText = textParts.join("\n\n") || parts.map((p) => p.text).filter(Boolean).join("\n\n");
          const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          try {
            generatedContract = JSON.parse(cleanedText);
            needClientGemini = false;
          } catch (_) {
            console.warn("Cannot parse server Gemini JSON, fallback to client");
          }
        }
      } catch (err) {
        console.error("Server gemini generate error:", err);
      }
    }
    if (generatedContract) {
      return c.json({
        success: true,
        message: "\u0110\xE3 x\xE2y d\u1EF1ng h\u1EE3p \u0111\u1ED3ng b\u1EB1ng AI th\xE0nh c\xF4ng!",
        data: {
          ...generatedContract,
          needClientGemini: false
        }
      });
    }
    return c.json({
      success: true,
      message: "Chu\u1EA9n b\u1ECB d\u1EEF li\u1EC7u so\u1EA1n th\u1EA3o h\u1EE3p \u0111\u1ED3ng b\u1EB1ng AI",
      data: {
        needClientGemini: true,
        prompt,
        geminiApiKey,
        geminiModel,
        partner_name,
        value,
        start_date,
        end_date
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.get("/api/attendance", async (c) => {
  try {
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let query = `
      SELECT att.*, u.name as user_name, u.role as user_role, u.department as user_department
      FROM attendance att
      LEFT JOIN users u ON att.user_id = u.id
      WHERE att.company_id = ?
      ORDER BY att.date DESC, att.check_in DESC
    `;
    let params = [companyId];
    if (isSuperAdmin && companyId === "ALL") {
      query = `
        SELECT att.*, u.name as user_name, u.role as user_role, u.department as user_department
        FROM attendance att
        LEFT JOIN users u ON att.user_id = u.id
        ORDER BY att.date DESC, att.check_in DESC
      `;
      params = [];
    }
    const res = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ success: true, data: res.results || [] });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.post("/api/attendance/check", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { user_id, action, notes } = body;
    if (!user_id) {
      return c.json({ success: false, message: "M\xE3 nh\xE2n vi\xEAn l\xE0 b\u1EAFt bu\u1ED9c" }, 400);
    }
    const targetUser = await c.env.DB.prepare("SELECT id, name, company_id FROM users WHERE id = ?").bind(user_id).first();
    if (!targetUser) {
      return c.json({
        success: false,
        message: `M\xE3 nh\xE2n s\u1EF1 "${user_id}" kh\xF4ng t\u1ED3n t\u1EA1i tr\xEAn h\u1EC7 th\u1ED1ng. Vui l\xF2ng \u0111\u0103ng nh\u1EADp l\u1EA1i.`
      }, 400);
    }
    const companyId = targetUser.company_id || "comp_1";
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(/* @__PURE__ */ new Date());
    const timeStr = new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(/* @__PURE__ */ new Date());
    const [curHour, curMin] = timeStr.includes(":") ? timeStr.split(":").map(Number) : [(/* @__PURE__ */ new Date()).getHours(), (/* @__PURE__ */ new Date()).getMinutes()];
    let workStart = "08:30";
    let graceMin = 15;
    try {
      const sStart = await c.env.DB.prepare("SELECT value FROM company_settings WHERE company_id = ? AND key = 'work_start_time'").bind(companyId).first() || await c.env.DB.prepare("SELECT value FROM system_settings WHERE key = 'work_start_time'").first();
      if (sStart?.value) workStart = sStart.value;
      const sGrace = await c.env.DB.prepare("SELECT value FROM company_settings WHERE company_id = ? AND key = 'late_grace_minutes'").bind(companyId).first() || await c.env.DB.prepare("SELECT value FROM system_settings WHERE key = 'late_grace_minutes'").first();
      if (sGrace?.value) graceMin = Number(sGrace.value) || 0;
    } catch (_) {
    }
    const [stdH, stdM] = workStart.includes(":") ? workStart.split(":").map(Number) : [8, 30];
    const allowedTotalMin = stdH * 60 + stdM + graceMin;
    const currentTotalMin = curHour * 60 + curMin;
    const isLate = currentTotalMin > allowedTotalMin;
    const existing = await c.env.DB.prepare("SELECT * FROM attendance WHERE user_id = ? AND date = ?").bind(user_id, today).first();
    if (action === "CHECK_IN") {
      if (existing) {
        if (existing.check_out) {
          return c.json({
            success: false,
            message: `Nh\xE2n vi\xEAn ${targetUser.name} \u0111\xE3 ho\xE0n t\u1EA5t ca h\xF4m nay (\u0111\xE3 Check-out l\xFAc ${existing.check_out}). Vui l\xF2ng ch\u1EDD \u0111\u1EBFn ng\xE0y mai \u0111\u1EC3 b\u1EAFt \u0111\u1EA7u ca m\u1EDBi!`
          }, 400);
        }
        return c.json({
          success: false,
          message: `Nh\xE2n vi\xEAn ${targetUser.name} \u0111\xE3 \u0111i\u1EC3m danh v\xE0o ca h\xF4m nay l\xFAc ${existing.check_in || "tr\u01B0\u1EDBc \u0111\xF3"}. M\u1ED9t ng\xE0y ch\u1EC9 \u0111\u01B0\u1EE3c \u0111i\u1EC3m danh v\xE0o ca 1 l\u1EA7n!`
        }, 400);
      }
      const id = `att_${Date.now()}`;
      const noteText = notes && String(notes).trim() ? String(notes).trim() : isLate ? `\u0110i mu\u1ED9n (quy \u0111\u1ECBnh ${workStart} + ${graceMin}p \xE2n h\u1EA1n)` : "\u0110\xFAng gi\u1EDD";
      await c.env.DB.prepare(`
        INSERT INTO attendance (id, user_id, date, check_in, check_out, total_hours, status, notes, company_id)
        VALUES (?, ?, ?, ?, NULL, 0, ?, ?, ?)
      `).bind(
        id,
        user_id,
        today,
        timeStr,
        isLate ? "LATE" : "ON_TIME",
        noteText,
        companyId
      ).run();
      return c.json({
        success: true,
        message: `\u0110i\u1EC3m danh v\xE0o (Check-in) th\xE0nh c\xF4ng l\xFAc ${timeStr}! (${isLate ? "\u0110i mu\u1ED9n" : "\u0110\xFAng gi\u1EDD"})`
      });
    }
    if (action === "CHECK_OUT") {
      if (!existing) {
        return c.json({
          success: false,
          message: `Nh\xE2n vi\xEAn ${targetUser.name} ch\u01B0a \u0111i\u1EC3m danh v\xE0o ca (Check-in) trong ng\xE0y ${today} n\xEAn ch\u01B0a th\u1EC3 tan ca!`
        }, 400);
      }
      if (existing.check_out) {
        return c.json({
          success: false,
          message: `Nh\xE2n vi\xEAn ${targetUser.name} \u0111\xE3 \u0111i\u1EC3m danh tan ca h\xF4m nay l\xFAc ${existing.check_out} r\u1ED3i (T\u1ED5ng gi\u1EDD: ${existing.total_hours || 0}h). Kh\xF4ng th\u1EC3 Check-out l\u1EA7n n\u1EEFa!`
        }, 400);
      }
      const checkInTime = existing.check_in || "08:30";
      const [inH, inM] = checkInTime.includes(":") ? checkInTime.split(":").map(Number) : [8, 30];
      const totalMinutes = Math.max(0, curHour * 60 + curMin - (inH * 60 + inM));
      const hours = Number((totalMinutes / 60).toFixed(1));
      const extraNote = notes && String(notes).trim() ? String(notes).trim() : null;
      const checkoutNote = extraNote ? `${existing.notes ? existing.notes + " - " : ""}${extraNote}` : existing.notes || "Tan ca b\xECnh th\u01B0\u1EDDng";
      await c.env.DB.prepare(`
        UPDATE attendance
        SET check_out = ?, total_hours = ?, notes = ?
        WHERE id = ?
      `).bind(timeStr, hours, checkoutNote, existing.id).run();
      return c.json({
        success: true,
        message: `\u0110i\u1EC3m danh ra (Check-out) th\xE0nh c\xF4ng l\xFAc ${timeStr}! T\u1ED5ng gi\u1EDD l\xE0m: ${hours}h`
      });
    }
    return c.json({ success: false, message: "H\xE0nh \u0111\u1ED9ng kh\xF4ng h\u1EE3p l\u1EC7" }, 400);
  } catch (err) {
    return c.json({ success: false, message: err.message || "L\u1ED7i x\u1EED l\xFD \u0111i\u1EC3m danh" }, 500);
  }
});
app.get("/api/attendance/summary", async (c) => {
  try {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let usersQuery = "SELECT count(*) as count FROM users WHERE company_id = ?";
    let attQuery = "SELECT * FROM attendance WHERE date = ? AND company_id = ?";
    let userParams = [companyId];
    let attParams = [today, companyId];
    if (isSuperAdmin && companyId === "ALL") {
      usersQuery = "SELECT count(*) as count FROM users";
      attQuery = "SELECT * FROM attendance WHERE date = ?";
      userParams = [];
      attParams = [today];
    }
    const usersCount = (await c.env.DB.prepare(usersQuery).bind(...userParams).first())?.count || 0;
    const todayRecords = (await c.env.DB.prepare(attQuery).bind(...attParams).all())?.results || [];
    const checkedInCount = todayRecords.length;
    const onTimeCount = todayRecords.filter((a) => a.status === "ON_TIME").length;
    const lateCount = todayRecords.filter((a) => a.status === "LATE").length;
    return c.json({
      success: true,
      data: {
        totalStaff: usersCount,
        checkedInCount,
        onTimeCount,
        lateCount,
        absentCount: Math.max(0, usersCount - checkedInCount),
        attendanceRate: usersCount > 0 ? `${Math.round(checkedInCount / usersCount * 100)}%` : "0%"
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.get("/api/users", async (c) => {
  try {
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let res;
    if (isSuperAdmin && companyId === "ALL") {
      res = await c.env.DB.prepare("SELECT id, name, email, role, department, phone, avatar, status, company_id, created_at FROM users ORDER BY created_at DESC").all();
    } else {
      res = await c.env.DB.prepare("SELECT id, name, email, role, department, phone, avatar, status, company_id, created_at FROM users WHERE company_id = ? ORDER BY created_at DESC").bind(companyId).all();
    }
    return c.json({ success: true, data: res.results || [] });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.post("/api/users", async (c) => {
  try {
    const role = c.req.header("x-user-role") || "STAFF";
    if (role !== "ADMIN") {
      return c.json({ success: false, message: "Ch\u1EC9 Qu\u1EA3n tr\u1ECB vi\xEAn (ADMIN) m\u1EDBi c\xF3 quy\u1EC1n th\xEAm nh\xE2n s\u1EF1" }, 403);
    }
    const { companyId } = await getTenantContext(c);
    const license = await getLicenseStatus(c.env.DB, companyId);
    if (!license.isPaid) {
      const maxAllowed = license.limits?.maxUsers || 3;
      const count = (await c.env.DB.prepare("SELECT count(*) as count FROM users WHERE company_id = ?").bind(companyId).first())?.count || 0;
      if (count >= maxAllowed) {
        return c.json({
          success: false,
          code: "LICENSE_LIMIT_REACHED",
          message: license.isTrial ? `B\u1EA3n D\xF9ng Th\u1EED 2 Th\xE1ng (0\u0111) gi\u1EDBi h\u1EA1n t\u1ED1i \u0111a ${maxAllowed} t\xE0i kho\u1EA3n nh\xE2n s\u1EF1. B\u1EA1n \u0111\xE3 t\u1EA1o \u0111\u1EE7 ${count}/${maxAllowed} t\xE0i kho\u1EA3n. Vui l\xF2ng n\xE2ng c\u1EA5p l\xEAn G\xF3i B\u1EA3n Quy\u1EC1n Ch\xEDnh Th\u1EE9c \u0111\u1EC3 t\u1EA1o nh\xE2n s\u1EF1 kh\xF4ng gi\u1EDBi h\u1EA1n!` : `G\xF3i c\u01B0\u1EDBc d\xF9ng th\u1EED \u0111\xE3 h\u1EBFt h\u1EA1n (gi\u1EDBi h\u1EA1n t\u1ED1i \u0111a ${maxAllowed} nh\xE2n s\u1EF1). Vui l\xF2ng thanh to\xE1n n\xE2ng c\u1EA5p g\xF3i \u0111\u1EC3 ti\u1EBFp t\u1EE5c th\xEAm nh\xE2n vi\xEAn!`
        }, 403);
      }
    }
    const body = await c.req.json();
    const id = `usr_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO users (id, name, email, password, role, department, phone, avatar, status, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
    `).bind(
      id,
      body.name,
      body.email,
      body.password || "123456",
      body.role || "STAFF",
      body.department || "Ph\xF2ng K\u1EBF Ho\u1EA1ch",
      body.phone || "",
      body.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(body.name)}`,
      companyId
    ).run();
    if (body.email && body.email.includes("@")) {
      try {
        const mailConfig = await getEmailConfig(c.env.DB, companyId);
        if (mailConfig.notifyNewUser) {
          const comp = await c.env.DB.prepare("SELECT company_name FROM company_tenants WHERE id = ?").bind(companyId).first().catch(() => null);
          const companyName = comp?.company_name || mailConfig.companyName || "OMNI ASSETS & LOGISTICS";
          const welcomeHtml = getWelcomeUserEmailHtml({
            companyName,
            userName: body.name || "Nh\xE2n s\u1EF1 m\u1EDBi",
            userEmail: body.email,
            password: body.password || "123456",
            role: body.role || "STAFF",
            department: body.department || "Ph\xF2ng K\u1EBF Ho\u1EA1ch",
            loginUrl: "https://company-sheet.hieupham101097.workers.dev"
          });
          const mailPromise = sendEmail({
            db: c.env.DB,
            companyId,
            senderType: "tasks",
            to: body.email,
            subject: `[${companyName}] Th\xF4ng tin t\xE0i kho\u1EA3n \u0111\u0103ng nh\u1EADp c\u1EE7a b\u1EA1n`,
            html: welcomeHtml
          }).catch((e) => console.error("[Welcome Email Error]", e.message));
          if (c.executionCtx?.waitUntil) {
            c.executionCtx.waitUntil(mailPromise);
          }
        }
      } catch (mErr) {
        console.error("[Welcome Mail Trigger Error]", mErr.message);
      }
    }
    return c.json({ success: true, message: "\u0110\xE3 th\xEAm nh\xE2n s\u1EF1" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.put("/api/users/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const role = c.req.header("x-user-role") || "STAFF";
    if (role !== "ADMIN") {
      return c.json({ success: false, message: "Ch\u1EC9 Qu\u1EA3n tr\u1ECB vi\xEAn (ADMIN) m\u1EDBi c\xF3 quy\u1EC1n ch\u1EC9nh s\u1EEDa nh\xE2n s\u1EF1" }, 403);
    }
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    const body = await c.req.json();
    let sql = `
      UPDATE users
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          department = COALESCE(?, department),
          role = COALESCE(?, role),
          phone = COALESCE(?, phone),
          status = COALESCE(?, status)
      WHERE id = ?
    `;
    let params = [
      body.name !== void 0 ? body.name : null,
      body.email !== void 0 ? body.email : null,
      body.department !== void 0 ? body.department : null,
      body.role !== void 0 ? body.role : null,
      body.phone !== void 0 ? body.phone : null,
      body.status !== void 0 ? body.status : null,
      id
    ];
    if (!isSuperAdmin || companyId !== "ALL") {
      sql += " AND (company_id = ? OR company_id IS NULL)";
      params.push(companyId);
    }
    await c.env.DB.prepare(sql).bind(...params).run();
    return c.json({ success: true, message: "\u0110\xE3 c\u1EADp nh\u1EADt th\xF4ng tin nh\xE2n s\u1EF1 v\xE0 ph\xF2ng ban" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.delete("/api/users/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const role = c.req.header("x-user-role") || "STAFF";
    if (role !== "ADMIN") {
      return c.json({ success: false, message: "Ch\u1EC9 Qu\u1EA3n tr\u1ECB vi\xEAn (ADMIN) m\u1EDBi c\xF3 quy\u1EC1n x\xF3a nh\xE2n s\u1EF1" }, 403);
    }
    if (id === "usr_admin" || id === "usr_1" || id === "super_admin_master") {
      return c.json({ success: false, message: "Kh\xF4ng th\u1EC3 x\xF3a t\xE0i kho\u1EA3n Qu\u1EA3n tr\u1ECB vi\xEAn kh\u1EDFi t\u1EA1o" }, 400);
    }
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let sql = "DELETE FROM users WHERE id = ?";
    let params = [id];
    if (!isSuperAdmin || companyId !== "ALL") {
      sql += " AND (company_id = ? OR company_id IS NULL)";
      params.push(companyId);
    }
    await c.env.DB.prepare(sql).bind(...params).run();
    return c.json({ success: true, message: "\u0110\xE3 x\xF3a nh\xE2n s\u1EF1 kh\u1ECFi h\u1EC7 th\u1ED1ng" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
async function ensureCategories(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        code TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    const count = (await db.prepare("SELECT count(*) as count FROM categories").first())?.count || 0;
    if (count === 0) {
      const initialCats = [
        // Loại tài sản
        { id: "cat_ast_1", type: "ASSET_CATEGORY", name: "M\xE1y t\xEDnh x\xE1ch tay", code: "LAPTOP", description: "M\xE1y t\xEDnh laptop Dell, MacBook, ThinkPad" },
        { id: "cat_ast_2", type: "ASSET_CATEGORY", name: "M\xE0n h\xECnh hi\u1EC3n th\u1ECB", code: "MONITOR", description: "M\xE0n h\xECnh v\u0103n ph\xF2ng, \u0111\u1ED3 h\u1ECDa 4K" },
        { id: "cat_ast_3", type: "ASSET_CATEGORY", name: "Thi\u1EBFt b\u1ECB v\u0103n ph\xF2ng", code: "OFFICE_EQUIP", description: "M\xE1y in, m\xE1y scan, m\xE1y chi\u1EBFu" },
        { id: "cat_ast_4", type: "ASSET_CATEGORY", name: "Thi\u1EBFt b\u1ECB m\u1EA1ng", code: "NETWORK", description: "Router, Switch, Wifi access point" },
        { id: "cat_ast_5", type: "ASSET_CATEGORY", name: "B\xE0n gh\u1EBF v\u0103n ph\xF2ng", code: "FURNITURE", description: "Gh\u1EBF c\xF4ng th\xE1i h\u1ECDc, b\xE0n l\xE0m vi\u1EC7c" },
        { id: "cat_ast_6", type: "ASSET_CATEGORY", name: "Thi\u1EBFt b\u1ECB ngo\u1EA1i vi", code: "PERIPHERAL", description: "B\xE0n ph\xEDm, chu\u1ED9t, tai nghe call center" },
        // Loại thu chi
        { id: "cat_fin_1", type: "FINANCE_CATEGORY", name: "H\u1EE3p \u0111\u1ED3ng d\u1ECBch v\u1EE5 ph\u1EA7n m\u1EC1m", code: "REV_SOFTWARE", description: "Ngu\u1ED3n thu t\u1EEB gia c\xF4ng & b\u1EA3o tr\xEC ph\u1EA7n m\u1EC1m" },
        { id: "cat_fin_2", type: "FINANCE_CATEGORY", name: "T\u01B0 v\u1EA5n ki\u1EBFn tr\xFAc Cloud", code: "REV_CLOUD", description: "Ngu\u1ED3n thu d\u1ECBch v\u1EE5 t\u01B0 v\u1EA5n Cloud & DevOps" },
        { id: "cat_fin_3", type: "FINANCE_CATEGORY", name: "B\u1EA3o tr\xEC & V\u1EADn h\xE0nh h\u1EC7 th\u1ED1ng", code: "REV_MAINTAIN", description: "Ph\xED b\u1EA3o d\u01B0\u1EE1ng h\u1EC7 th\u1ED1ng \u0111\u1ECBnh k\u1EF3" },
        { id: "cat_fin_4", type: "FINANCE_CATEGORY", name: "Mua s\u1EAFm thi\u1EBFt b\u1ECB & T\xE0i s\u1EA3n", code: "EXP_EQUIP", description: "Chi ph\xED mua s\u1EAFm laptop, b\xE0n gh\u1EBF, thi\u1EBFt b\u1ECB m\u1EDBi" },
        { id: "cat_fin_5", type: "FINANCE_CATEGORY", name: "Chi ph\xED \u0111i\u1EC7n n\u01B0\u1EDBc & Thu\xEA v\u0103n ph\xF2ng", code: "EXP_OFFICE", description: "Ti\u1EC1n thu\xEA s\u1EA3nh, internet, \u0111i\u1EC7n n\u01B0\u1EDBc" },
        { id: "cat_fin_6", type: "FINANCE_CATEGORY", name: "Chi ph\xED v\u0103n ph\xF2ng ph\u1EA9m & Ti\u1EBFp kh\xE1ch", code: "EXP_OPERATION", description: "V\u0103n ph\xF2ng ph\u1EA9m, cafe, ti\u1EBFp \u0111\u1ED1i t\xE1c" },
        // Phòng ban doanh nghiệp
        { id: "cat_dep_1", type: "DEPARTMENT", name: "Ban Gi\xE1m \u0110\u1ED1c", code: "BOD", description: "L\xE3nh \u0111\u1EA1o & \u0110i\u1EC1u h\xE0nh chi\u1EBFn l\u01B0\u1EE3c" },
        { id: "cat_dep_2", type: "DEPARTMENT", name: "Ph\xF2ng K\u1EBF To\xE1n & T\xE0i Ch\xEDnh", code: "ACC", description: "Qu\u1EA3n tr\u1ECB d\xF2ng ti\u1EC1n, h\xF3a \u0111\u01A1n, l\u01B0\u01A1ng b\u1ED5ng" },
        { id: "cat_dep_3", type: "DEPARTMENT", name: "Ph\xF2ng K\u1EF9 Thu\u1EADt & IT", code: "IT", description: "L\u1EADp tr\xECnh, h\u1EA1 t\u1EA7ng Cloud, qu\u1EA3n l\xFD thi\u1EBFt b\u1ECB" },
        { id: "cat_dep_4", type: "DEPARTMENT", name: "Ph\xF2ng H\xE0nh Ch\xEDnh Nh\xE2n S\u1EF1", code: "HR", description: "Tuy\u1EC3n d\u1EE5ng, ch\u1EA5m c\xF4ng, ph\xFAc l\u1EE3i" },
        { id: "cat_dep_5", type: "DEPARTMENT", name: "Ph\xF2ng Kinh Doanh & Marketing", code: "SALES", description: "Ph\xE1t tri\u1EC3n kh\xE1ch h\xE0ng, h\u1EE3p \u0111\u1ED3ng" }
      ];
      for (const item of initialCats) {
        await db.prepare(`
          INSERT INTO categories (id, type, name, code, description)
          VALUES (?, ?, ?, ?, ?)
        `).bind(item.id, item.type, item.name, item.code, item.description).run();
      }
    }
  } catch (err) {
    console.error("ensureCategories error:", err.message);
  }
}
__name(ensureCategories, "ensureCategories");
app.get("/api/categories", async (c) => {
  try {
    await ensureCategories(c.env.DB);
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    const type = c.req.query("type");
    let query = "SELECT * FROM categories";
    let params = [];
    if (isSuperAdmin && companyId === "ALL") {
      if (type) {
        query += " WHERE type = ?";
        params.push(type);
      }
    } else {
      query += " WHERE (company_id = ? OR company_id IS NULL)";
      params.push(companyId);
      if (type) {
        query += " AND type = ?";
        params.push(type);
      }
    }
    query += " ORDER BY type ASC, created_at ASC";
    const res = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ success: true, data: res.results || [] });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.post("/api/categories", async (c) => {
  try {
    const role = c.req.header("x-user-role") || "STAFF";
    if (role !== "ADMIN") {
      return c.json({ success: false, message: "Ch\u1EC9 Qu\u1EA3n tr\u1ECB vi\xEAn (ADMIN) m\u1EDBi c\xF3 quy\u1EC1n qu\u1EA3n l\xFD danh m\u1EE5c" }, 403);
    }
    const { companyId } = await getTenantContext(c);
    const { type, name, code, description } = await c.req.json();
    if (!type || !name) {
      return c.json({ success: false, message: "Ph\xE2n lo\u1EA1i v\xE0 t\xEAn danh m\u1EE5c l\xE0 b\u1EAFt bu\u1ED9c" }, 400);
    }
    const id = `cat_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO categories (id, type, name, code, description, company_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, type, name, code || "", description || "", companyId).run();
    return c.json({ success: true, message: "\u0110\xE3 th\xEAm danh m\u1EE5c th\xE0nh c\xF4ng", data: { id, type, name, code, description } });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.put("/api/categories/:id", async (c) => {
  try {
    const role = c.req.header("x-user-role") || "STAFF";
    if (role !== "ADMIN") {
      return c.json({ success: false, message: "Ch\u1EC9 Qu\u1EA3n tr\u1ECB vi\xEAn (ADMIN) m\u1EDBi c\xF3 quy\u1EC1n s\u1EEDa danh m\u1EE5c" }, 403);
    }
    const id = c.req.param("id");
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    const { name, code, description } = await c.req.json();
    let sql = `
      UPDATE categories
      SET name = COALESCE(?, name),
          code = COALESCE(?, code),
          description = COALESCE(?, description)
      WHERE id = ?
    `;
    let params = [
      name !== void 0 ? name : null,
      code !== void 0 ? code : null,
      description !== void 0 ? description : null,
      id
    ];
    if (!isSuperAdmin || companyId !== "ALL") {
      sql += " AND (company_id = ? OR company_id IS NULL)";
      params.push(companyId);
    }
    await c.env.DB.prepare(sql).bind(...params).run();
    return c.json({ success: true, message: "\u0110\xE3 c\u1EADp nh\u1EADt danh m\u1EE5c" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.delete("/api/categories/:id", async (c) => {
  try {
    const role = c.req.header("x-user-role") || "STAFF";
    if (role !== "ADMIN") {
      return c.json({ success: false, message: "Ch\u1EC9 Qu\u1EA3n tr\u1ECB vi\xEAn (ADMIN) m\u1EDBi c\xF3 quy\u1EC1n x\xF3a danh m\u1EE5c" }, 403);
    }
    const id = c.req.param("id");
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let sql = "DELETE FROM categories WHERE id = ?";
    let params = [id];
    if (!isSuperAdmin || companyId !== "ALL") {
      sql += " AND company_id = ?";
      params.push(companyId);
    }
    await c.env.DB.prepare(sql).bind(...params).run();
    return c.json({ success: true, message: "\u0110\xE3 x\xF3a danh m\u1EE5c" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
async function initSettingsTable(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        category TEXT,
        description TEXT,
        updated_at TEXT
      )
    `).run();
    const defaults = [
      // ATTENDANCE
      ["work_start_time", "08:30", "ATTENDANCE", "Gi\u1EDD v\xE0o ca bu\u1ED5i s\xE1ng", (/* @__PURE__ */ new Date()).toISOString()],
      ["work_end_time", "17:30", "ATTENDANCE", "Gi\u1EDD tan ca bu\u1ED5i chi\u1EC1u", (/* @__PURE__ */ new Date()).toISOString()],
      ["late_grace_minutes", "15", "ATTENDANCE", "S\u1ED1 ph\xFAt cho ph\xE9p \u0111i mu\u1ED9n (\xE2n h\u1EA1n)", (/* @__PURE__ */ new Date()).toISOString()],
      ["overtime_start_time", "18:00", "ATTENDANCE", "Gi\u1EDD b\u1EAFt \u0111\u1EA7u t\xEDnh l\xE0m th\xEAm gi\u1EDD (OT)", (/* @__PURE__ */ new Date()).toISOString()],
      ["work_days", "Th\u1EE9 2 - Th\u1EE9 6", "ATTENDANCE", "C\xE1c ng\xE0y l\xE0m vi\u1EC7c ti\xEAu chu\u1EA9n trong tu\u1EA7n", (/* @__PURE__ */ new Date()).toISOString()],
      ["require_late_reason", "true", "ATTENDANCE", "Y\xEAu c\u1EA7u nh\xE2n vi\xEAn ghi ch\xFA l\xFD do khi \u0111i mu\u1ED9n", (/* @__PURE__ */ new Date()).toISOString()],
      ["lunch_break_start", "12:00", "ATTENDANCE", "Gi\u1EDD b\u1EAFt \u0111\u1EA7u ngh\u1EC9 tr\u01B0a", (/* @__PURE__ */ new Date()).toISOString()],
      ["lunch_break_end", "13:30", "ATTENDANCE", "Gi\u1EDD k\u1EBFt th\xFAc ngh\u1EC9 tr\u01B0a", (/* @__PURE__ */ new Date()).toISOString()],
      // GENERAL
      ["company_name", "OMNI ASSETS & LOGISTICS", "GENERAL", "T\xEAn ch\xEDnh th\u1EE9c c\u1EE7a doanh nghi\u1EC7p", (/* @__PURE__ */ new Date()).toISOString()],
      ["system_title", "H\u1EC7 Th\u1ED1ng Qu\u1EA3n L\xFD T\xE0i S\u1EA3n & V\u1EADn H\xE0nh Doanh Nghi\u1EC7p", "GENERAL", "Ti\xEAu \u0111\u1EC1 hi\u1EC3n th\u1ECB \u1EE9ng d\u1EE5ng web", (/* @__PURE__ */ new Date()).toISOString()],
      ["company_email", "contact@omniassets.vn", "GENERAL", "Email li\xEAn h\u1EC7 n\u1ED9i b\u1ED9", (/* @__PURE__ */ new Date()).toISOString()],
      ["company_phone", "1900 6868", "GENERAL", "Hotline h\u1ED7 tr\u1EE3 k\u1EF9 thu\u1EADt v\xE0 v\u0103n ph\xF2ng", (/* @__PURE__ */ new Date()).toISOString()],
      ["company_address", "T\xF2a nh\xE0 Landmark 81, 720A \u0110i\u1EC7n Bi\xEAn Ph\u1EE7, TP. H\u1ED3 Ch\xED Minh", "GENERAL", "\u0110\u1ECBa ch\u1EC9 tr\u1EE5 s\u1EDF ch\xEDnh", (/* @__PURE__ */ new Date()).toISOString()],
      ["tax_id", "0109887766", "GENERAL", "M\xE3 s\u1ED1 thu\u1EBF doanh nghi\u1EC7p", (/* @__PURE__ */ new Date()).toISOString()],
      ["currency", "VND", "GENERAL", "\u0110\u01A1n v\u1ECB ti\u1EC1n t\u1EC7 ch\xEDnh", (/* @__PURE__ */ new Date()).toISOString()],
      ["system_announcement", "Ch\xE0o m\u1EEBng b\u1EA1n \u0111\u1EBFn v\u1EDBi h\u1EC7 th\u1ED1ng qu\u1EA3n tr\u1ECB v\u1EADn h\xE0nh OMNI ASSETS!", "GENERAL", "Th\xF4ng b\xE1o chung tr\xEAn b\u1EA3ng tin", (/* @__PURE__ */ new Date()).toISOString()],
      ["allow_user_registration", "false", "GENERAL", "Cho ph\xE9p nh\xE2n vi\xEAn t\u1EF1 t\u1EA1o t\xE0i kho\u1EA3n", (/* @__PURE__ */ new Date()).toISOString()],
      ["gemini_api_key", "", "GENERAL", "Google Gemini AI API Key", (/* @__PURE__ */ new Date()).toISOString()],
      // EMAIL SERVICE (RESEND & BREVO)
      ["mail_provider", "resend", "MAIL", "Nh\xE0 cung c\u1EA5p d\u1ECBch v\u1EE5 Email (resend ho\u1EB7c brevo)", (/* @__PURE__ */ new Date()).toISOString()],
      ["mail_api_key", "", "MAIL", "Kh\xF3a API Key c\u1EE7a d\u1ECBch v\u1EE5 g\u1EEDi mail", (/* @__PURE__ */ new Date()).toISOString()],
      ["mail_sender_name", "OMNI ASSETS & LOGISTICS", "MAIL", "T\xEAn ng\u01B0\u1EDDi g\u1EEDi hi\u1EC3n th\u1ECB trong h\u1ED9p th\u01B0", (/* @__PURE__ */ new Date()).toISOString()],
      ["mail_sender_email", "onboarding@resend.dev", "MAIL", "\u0110\u1ECBa ch\u1EC9 email ng\u01B0\u1EDDi g\u1EEDi", (/* @__PURE__ */ new Date()).toISOString()],
      ["mail_notify_new_user", "true", "MAIL", "T\u1EF1 \u0111\u1ED9ng g\u1EEDi email c\u1EA5p t\xE0i kho\u1EA3n & m\u1EADt kh\u1EA9u khi th\xEAm nh\xE2n s\u1EF1", (/* @__PURE__ */ new Date()).toISOString()],
      ["mail_notify_reminders", "true", "MAIL", "T\u1EF1 \u0111\u1ED9ng g\u1EEDi email th\xF4ng b\xE1o nh\u1EAFc h\u1EA1n (h\u1EE3p \u0111\u1ED3ng, c\xF4ng vi\u1EC7c) l\xFAc 06:00 AM", (/* @__PURE__ */ new Date()).toISOString()],
      ["mail_notify_timesheet", "true", "MAIL", "K\xEDch ho\u1EA1t t\xEDnh n\u0103ng g\u1EEDi phi\u1EBFu ch\u1EA5m c\xF4ng qua email", (/* @__PURE__ */ new Date()).toISOString()],
      // LICENSE & PAYWALL
      ["license_tier", "DEMO", "LICENSE", "C\u1EA5p \u0111\u1ED9 b\u1EA3n quy\u1EC1n (DEMO ho\u1EB7c ENTERPRISE)", (/* @__PURE__ */ new Date()).toISOString()],
      ["license_key", "", "LICENSE", "Kh\xF3a b\u1EA3n quy\u1EC1n \u0111\xE3 k\xEDch ho\u1EA1t", (/* @__PURE__ */ new Date()).toISOString()],
      ["license_status", "ACTIVE", "LICENSE", "Tr\u1EA1ng th\xE1i b\u1EA3n quy\u1EC1n", (/* @__PURE__ */ new Date()).toISOString()],
      ["license_activated_at", "", "LICENSE", "Th\u1EDDi gian k\xEDch ho\u1EA1t b\u1EA3n quy\u1EC1n", (/* @__PURE__ */ new Date()).toISOString()],
      // PAYMENT & BANKING (VIETQR)
      ["bank_name", "ACB - Ng\xE2n H\xE0ng TMCP \xC1 Ch\xE2u", "PAYMENT", "T\xEAn ng\xE2n h\xE0ng th\u1EE5 h\u01B0\u1EDFng thanh to\xE1n", (/* @__PURE__ */ new Date()).toISOString()],
      ["bank_code", "ACB", "PAYMENT", "M\xE3 vi\u1EBFt t\u1EAFt ng\xE2n h\xE0ng", (/* @__PURE__ */ new Date()).toISOString()],
      ["bank_bin", "970416", "PAYMENT", "M\xE3 BIN ng\xE2n h\xE0ng chu\u1EA9n VietQR", (/* @__PURE__ */ new Date()).toISOString()],
      ["bank_account_number", "7909707", "PAYMENT", "S\u1ED1 t\xE0i kho\u1EA3n ng\xE2n h\xE0ng th\u1EE5 h\u01B0\u1EDFng", (/* @__PURE__ */ new Date()).toISOString()],
      ["bank_account_holder", "PHAM MINH HIEU", "PAYMENT", "H\u1ECD t\xEAn ch\u1EE7 t\xE0i kho\u1EA3n th\u1EE5 h\u01B0\u1EDFng", (/* @__PURE__ */ new Date()).toISOString()]
    ];
    for (const [key, val, cat, desc, upd] of defaults) {
      await db.prepare(`
        INSERT OR IGNORE INTO system_settings (key, value, category, description, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(key, val, cat, desc, upd).run();
    }
  } catch (e) {
    console.error("Error initSettingsTable:", e);
  }
}
__name(initSettingsTable, "initSettingsTable");
async function getLicenseStatus(db, companyId) {
  try {
    let tenant = null;
    if (companyId && companyId !== "ALL" && companyId !== "SYSTEM") {
      tenant = await db.prepare("SELECT id, company_name, plan_code, license_status, start_date, expire_date FROM company_tenants WHERE id = ?").bind(companyId).first().catch(() => null);
    }
    const planCode = tenant?.plan_code || "TRIAL_2M";
    let licenseStatus = tenant?.license_status || "ACTIVE";
    const expireDate = tenant?.expire_date || null;
    const companyName = tenant?.company_name || "Doanh Nghi\u1EC7p";
    let isExpired = false;
    let daysRemaining = null;
    if (planCode === "LIFETIME") {
      isExpired = false;
      daysRemaining = null;
    } else if (expireDate) {
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const exp = new Date(expireDate);
      exp.setHours(0, 0, 0, 0);
      const diffMs = exp.getTime() - today.getTime();
      daysRemaining = Math.ceil(diffMs / (1e3 * 60 * 60 * 24));
      if (daysRemaining < 0 || licenseStatus === "EXPIRED") {
        isExpired = true;
        licenseStatus = "EXPIRED";
      }
    } else if (planCode === "TRIAL_2M") {
      daysRemaining = 60;
    }
    const isPaid = !isExpired && (planCode === "ANNUAL_1Y" || planCode === "ANNUAL_2Y" || planCode === "LIFETIME");
    const isTrial = !isExpired && planCode === "TRIAL_2M";
    const isDemo = isExpired || planCode === "DEMO";
    const maxAssets = isPaid ? Infinity : isTrial ? 20 : 5;
    const maxUsers = isPaid ? Infinity : isTrial ? 3 : 2;
    const maxContracts = isPaid ? Infinity : isTrial ? 5 : 2;
    const maxHandovers = isPaid ? Infinity : isTrial ? 5 : 2;
    const maxFinance = isPaid ? Infinity : isTrial ? 10 : 5;
    const maxDepartments = isPaid ? Infinity : isTrial ? 1 : 1;
    let planRow = null;
    try {
      planRow = await db.prepare("SELECT name, price, badge, features FROM pricing_plans WHERE code = ?").bind(planCode).first().catch(() => null);
    } catch (_) {
    }
    return {
      tier: isPaid ? "ENTERPRISE" : isTrial ? "TRIAL" : "DEMO",
      isTrial,
      isPaid,
      isDemo,
      isExpired,
      plan_code: planCode,
      plan_name: planRow?.name || (planCode === "TRIAL_2M" ? "G\xF3i D\xF9ng Th\u1EED 2 Th\xE1ng (Trial 60N)" : planCode === "LIFETIME" ? "G\xF3i V\u0129nh Vi\u1EC5n Tr\u1ECDn \u0110\u1EDDi" : "G\xF3i Ti\xEAu Chu\u1EA9n 1 N\u0103m"),
      plan_price: planRow?.price || 0,
      plan_badge: planRow?.badge || (isTrial ? "D\xF9ng Th\u1EED 0\u0111 (H\u1EA1n Ch\u1EBF Quy\u1EC1n)" : "B\u1EA3n Quy\u1EC1n \u0110\xE3 K\xEDch Ho\u1EA1t"),
      status: licenseStatus,
      expire_date: expireDate,
      days_remaining: daysRemaining,
      company_id: companyId || "comp_1",
      company_name: companyName,
      companyName,
      limits: {
        maxAssets,
        maxUsers,
        maxContracts,
        maxHandovers,
        maxFinance,
        maxDepartments,
        allowAutomatedEmails: isPaid,
        allowTelegram: isPaid,
        allowCustomStamp: isPaid,
        unwatermarkedPrint: isPaid,
        allowAdvancedBackup: isPaid
      }
    };
  } catch (err) {
    return {
      tier: "TRIAL",
      isTrial: true,
      isPaid: false,
      isDemo: false,
      isExpired: false,
      plan_code: "TRIAL_2M",
      plan_name: "G\xF3i D\xF9ng Th\u1EED 2 Th\xE1ng (Trial 60N)",
      plan_price: 0,
      plan_badge: "D\xF9ng Th\u1EED 0\u0111 (H\u1EA1n Ch\u1EBF Quy\u1EC1n)",
      status: "ACTIVE",
      expire_date: null,
      days_remaining: 60,
      company_id: companyId || "comp_1",
      company_name: "Doanh Nghi\u1EC7p",
      companyName: "Doanh Nghi\u1EC7p",
      limits: {
        maxAssets: 20,
        maxUsers: 3,
        maxContracts: 5,
        maxHandovers: 5,
        maxFinance: 10,
        maxDepartments: 1,
        allowAutomatedEmails: false,
        allowTelegram: false,
        allowCustomStamp: false,
        unwatermarkedPrint: false,
        allowAdvancedBackup: false
      }
    };
  }
}
__name(getLicenseStatus, "getLicenseStatus");
app.get("/api/license/status", async (c) => {
  try {
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    const targetCompId = isSuperAdmin && (!companyId || companyId === "ALL") ? "comp_1" : companyId;
    const license = await getLicenseStatus(c.env.DB, targetCompId);
    return c.json({ success: true, data: license });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.post("/api/license/activate", async (c) => {
  try {
    const { license_key } = await c.req.json();
    if (!license_key || !license_key.trim()) {
      return c.json({ success: false, message: "Vui l\xF2ng cung c\u1EA5p m\xE3 b\u1EA3n quy\u1EC1n (License Key)" }, 400);
    }
    const cleanKey = license_key.trim().toUpperCase();
    const keyRecord = await c.env.DB.prepare("SELECT * FROM license_keys WHERE UPPER(license_key) = ?").bind(cleanKey).first().catch(() => null);
    if (!keyRecord) {
      return c.json({ success: false, message: "M\xE3 b\u1EA3n quy\u1EC1n kh\xF4ng t\u1ED3n t\u1EA1i tr\xEAn h\u1EC7 th\u1ED1ng ho\u1EB7c \u0111\xE3 nh\u1EADp sai." }, 400);
    }
    if (keyRecord.status === "REVOKED" || keyRecord.status === "EXPIRED") {
      return c.json({ success: false, message: "M\xE3 b\u1EA3n quy\u1EC1n n\xE0y \u0111\xE3 b\u1ECB thu h\u1ED3i ho\u1EB7c \u0111\xE3 h\u1EBFt hi\u1EC7u l\u1EF1c." }, 400);
    }
    const { companyId } = await getTenantContext(c);
    const targetCompId = !companyId || companyId === "ALL" ? "comp_1" : companyId;
    let newExpire = null;
    if (keyRecord.plan_code === "LIFETIME" || keyRecord.duration_months >= 999) {
      newExpire = "2099-12-31";
    } else {
      const months = Number(keyRecord.duration_months) || 12;
      const d = /* @__PURE__ */ new Date();
      d.setMonth(d.getMonth() + months);
      newExpire = d.toISOString().split("T")[0];
    }
    await c.env.DB.prepare(`
      UPDATE company_tenants 
      SET plan_code = ?, license_status = 'ACTIVE', expire_date = ?
      WHERE id = ?
    `).bind(keyRecord.plan_code, newExpire, targetCompId).run();
    await c.env.DB.prepare(`
      UPDATE license_keys
      SET status = 'USED', company_id = ?, used_at = datetime('now')
      WHERE id = ?
    `).bind(targetCompId, keyRecord.id).run().catch(() => {
    });
    const updatedLicense = await getLicenseStatus(c.env.DB, targetCompId);
    return c.json({
      success: true,
      message: `K\xEDch ho\u1EA1t th\xE0nh c\xF4ng g\xF3i ${keyRecord.plan_name || keyRecord.plan_code}! To\xE0n b\u1ED9 gi\u1EDBi h\u1EA1n h\u1EC7 th\u1ED1ng \u0111\xE3 \u0111\u01B0\u1EE3c m\u1EDF kh\xF3a.`,
      data: updatedLicense
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.post("/api/license/reset-demo", async (c) => {
  try {
    const { companyId } = await getTenantContext(c);
    const targetCompId = !companyId || companyId === "ALL" ? "comp_1" : companyId;
    const expDate = /* @__PURE__ */ new Date();
    expDate.setDate(expDate.getDate() + 60);
    const expStr = expDate.toISOString().split("T")[0];
    await c.env.DB.prepare(`
      UPDATE company_tenants 
      SET plan_code = 'TRIAL_2M', license_status = 'ACTIVE', expire_date = ?
      WHERE id = ?
    `).bind(expStr, targetCompId).run();
    const updatedLicense = await getLicenseStatus(c.env.DB, targetCompId);
    return c.json({
      success: true,
      message: "\u0110\xE3 chuy\u1EC3n v\u1EC1 G\xF3i D\xF9ng Th\u1EED 2 Th\xE1ng (Trial 60N)",
      data: updatedLicense
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.get("/api/plans", async (c) => {
  try {
    await initPricingPlansTable(c.env.DB);
    const plans = await c.env.DB.prepare("SELECT * FROM pricing_plans WHERE is_active = 1 ORDER BY price ASC").all();
    return c.json({
      success: true,
      data: plans.results || []
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.get("/api/settings", async (c) => {
  try {
    await initSettingsTable(c.env.DB);
    const { companyId } = await getTenantContext(c);
    const res = await c.env.DB.prepare("SELECT * FROM system_settings ORDER BY category, key").all();
    const rows = res.results || [];
    const settingsMap = {};
    rows.forEach((r) => {
      settingsMap[r.key] = r.value;
    });
    if (companyId && companyId !== "ALL" && companyId !== "SYSTEM") {
      const tenantSettings = await c.env.DB.prepare("SELECT key, value FROM company_settings WHERE company_id = ?").bind(companyId).all().catch(() => ({ results: [] }));
      (tenantSettings.results || []).forEach((r) => {
        settingsMap[r.key] = r.value;
      });
      const compTenant = await c.env.DB.prepare("SELECT * FROM company_tenants WHERE id = ?").bind(companyId).first().catch(() => null);
      if (compTenant) {
        if (compTenant.company_name) settingsMap["company_name"] = compTenant.company_name;
        if (compTenant.tax_id) settingsMap["tax_id"] = compTenant.tax_id;
        if (compTenant.admin_email) settingsMap["company_email"] = compTenant.admin_email;
        if (compTenant.admin_phone) settingsMap["company_phone"] = compTenant.admin_phone;
      }
    }
    return c.json({
      success: true,
      data: {
        raw: rows,
        settings: settingsMap
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.put("/api/settings", async (c) => {
  try {
    const role = c.req.header("x-user-role") || "ADMIN";
    if (role !== "ADMIN" && role !== "MANAGER") {
      return c.json({ success: false, message: "Ch\u1EC9 Qu\u1EA3n tr\u1ECB vi\xEAn (ADMIN) ho\u1EB7c Qu\u1EA3n l\xFD m\u1EDBi c\xF3 quy\u1EC1n thay \u0111\u1ED5i c\u1EA5u h\xECnh" }, 403);
    }
    await initSettingsTable(c.env.DB);
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    const body = await c.req.json().catch(() => ({}));
    const settingsToUpdate = body.settings || body;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (companyId && companyId !== "ALL" && companyId !== "SYSTEM") {
      for (const [key, value] of Object.entries(settingsToUpdate)) {
        await c.env.DB.prepare(`
          INSERT INTO company_settings (company_id, key, value, updated_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(company_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
        `).bind(companyId, key, String(value), now).run().catch(() => {
        });
      }
      const compName = settingsToUpdate["company_name"];
      const taxId = settingsToUpdate["tax_id"];
      const phone = settingsToUpdate["company_phone"];
      const email = settingsToUpdate["company_email"];
      if (compName || taxId || phone || email) {
        await c.env.DB.prepare(`
          UPDATE company_tenants
          SET company_name = COALESCE(?, company_name),
              tax_id = COALESCE(?, tax_id),
              admin_phone = COALESCE(?, admin_phone),
              admin_email = COALESCE(?, admin_email)
          WHERE id = ?
        `).bind(compName || null, taxId || null, phone || null, email || null, companyId).run().catch(() => {
        });
      }
      if (companyId === "comp_1") {
        for (const [key, value] of Object.entries(settingsToUpdate)) {
          await c.env.DB.prepare(`
            UPDATE system_settings
            SET value = ?, updated_at = ?
            WHERE key = ?
          `).bind(String(value), now, key).run().catch(() => {
          });
        }
      }
    } else if (isSuperAdmin) {
      for (const [key, value] of Object.entries(settingsToUpdate)) {
        await c.env.DB.prepare(`
          UPDATE system_settings
          SET value = ?, updated_at = ?
          WHERE key = ?
        `).bind(String(value), now, key).run().catch(() => {
        });
      }
    }
    const res = await c.env.DB.prepare("SELECT * FROM system_settings ORDER BY category, key").all();
    const rows = res.results || [];
    const settingsMap = {};
    rows.forEach((r) => {
      settingsMap[r.key] = r.value;
    });
    if (companyId && companyId !== "ALL" && companyId !== "SYSTEM") {
      const tenantSettings = await c.env.DB.prepare("SELECT key, value FROM company_settings WHERE company_id = ?").bind(companyId).all().catch(() => ({ results: [] }));
      (tenantSettings.results || []).forEach((r) => {
        settingsMap[r.key] = r.value;
      });
    }
    return c.json({
      success: true,
      message: "C\u1EADp nh\u1EADt c\xE0i \u0111\u1EB7t doanh nghi\u1EC7p th\xE0nh c\xF4ng",
      data: {
        raw: rows,
        settings: settingsMap
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.get("/api/license/status", async (c) => {
  try {
    const { companyId, isSuperAdmin } = await getTenantContext(c);
    let companyName = "OMNI ASSETS";
    let planCode = "TRIAL_2M";
    let licenseStatus = "ACTIVE";
    let startDate = null;
    let expireDate = null;
    let isTrial = true;
    let isExpired = false;
    let daysRemaining = null;
    if (isSuperAdmin) {
      return c.json({
        success: true,
        data: {
          tier: "SUPER_ADMIN",
          isDemo: false,
          isTrial: false,
          status: "ACTIVE",
          plan_code: "MASTER",
          plan_name: "Qu\u1EA3n Tr\u1ECB N\u1EC1n T\u1EA3ng T\u1ED1i Cao",
          badge: "Master Admin",
          expire_date: null,
          days_remaining: null,
          company_name: "H\u1EC7 Th\u1ED1ng Qu\u1EA3n Tr\u1ECB N\u1EC1n T\u1EA3ng",
          companyName: "H\u1EC7 Th\u1ED1ng Qu\u1EA3n Tr\u1ECB N\u1EC1n T\u1EA3ng",
          organization: "H\u1EC7 Th\u1ED1ng Qu\u1EA3n Tr\u1ECB N\u1EC1n T\u1EA3ng",
          limits: {
            assets: { current: 0, max: "UNLIMITED" },
            users: { current: 0, max: "UNLIMITED" },
            contracts: { current: 0, max: "UNLIMITED" },
            finance: { current: 0, max: "UNLIMITED" },
            excelExport: true,
            unwatermarkedPrint: true
          }
        }
      });
    }
    if (companyId && companyId !== "ALL" && companyId !== "SYSTEM") {
      const tenant = await c.env.DB.prepare("SELECT id, company_name, plan_code, license_status, start_date, expire_date FROM company_tenants WHERE id = ?").bind(companyId).first().catch(() => null);
      if (tenant) {
        if (tenant.company_name) companyName = tenant.company_name;
        if (tenant.plan_code) planCode = tenant.plan_code;
        if (tenant.license_status) licenseStatus = tenant.license_status;
        startDate = tenant.start_date || null;
        expireDate = tenant.expire_date || null;
      }
    }
    if (planCode === "LIFETIME") {
      daysRemaining = null;
      expireDate = null;
      isTrial = false;
    } else if (expireDate) {
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const exp = new Date(expireDate);
      exp.setHours(0, 0, 0, 0);
      const diffMs = exp.getTime() - today.getTime();
      daysRemaining = Math.ceil(diffMs / (1e3 * 60 * 60 * 24));
      if (daysRemaining < 0 || licenseStatus === "EXPIRED") {
        isExpired = true;
        licenseStatus = "EXPIRED";
      }
    }
    let planName = "G\xF3i D\xF9ng Th\u1EED 2 Th\xE1ng (Trial 60 Ng\xE0y)";
    let badge = "D\xF9ng Th\u1EED 60 Ng\xE0y";
    let tier = "TRIAL";
    let isDemo = isExpired || planCode === "DEMO";
    const isPaid = !isDemo && !isExpired && (planCode === "ANNUAL_1Y" || planCode === "ANNUAL_2Y" || planCode === "LIFETIME");
    isTrial = !isDemo && !isExpired && planCode === "TRIAL_2M";
    if (planCode === "TRIAL_2M") {
      planName = "G\xF3i D\xF9ng Th\u1EED 2 Th\xE1ng (Trial 60 Ng\xE0y)";
      badge = "D\xF9ng Th\u1EED 0\u0111 (H\u1EA1n Ch\u1EBF Quy\u1EC1n)";
      tier = "TRIAL";
    } else if (planCode === "ANNUAL_1Y") {
      planName = "G\xF3i Ti\xEAu Chu\u1EA9n 1 N\u0103m";
      badge = "G\xF3i 1 N\u0103m";
      tier = "ANNUAL";
    } else if (planCode === "ANNUAL_2Y") {
      planName = "G\xF3i Ti\u1EBFt Ki\u1EC7m 2 N\u0103m";
      badge = "G\xF3i 2 N\u0103m";
      tier = "ANNUAL";
    } else if (planCode === "LIFETIME") {
      planName = "G\xF3i V\u0129nh Vi\u1EC5n Tr\u1ECDn \u0110\u1EDDi";
      badge = "V\u0129nh Vi\u1EC5n (\u221E)";
      tier = "ENTERPRISE";
      isDemo = false;
    } else {
      const planRow = await c.env.DB.prepare("SELECT name, badge FROM pricing_plans WHERE code = ?").bind(planCode).first().catch(() => null);
      if (planRow) {
        planName = planRow.name;
        badge = planRow.badge || planCode;
      }
    }
    const keyRecord = await c.env.DB.prepare("SELECT value FROM company_settings WHERE company_id = ? AND key = 'license_key'").bind(companyId).first().catch(() => null);
    const [assetsCount, usersCount, contractsCount, financeCount, deptsCount] = await Promise.all([
      c.env.DB.prepare("SELECT count(*) as count FROM assets WHERE company_id = ?").bind(companyId).first().catch(() => ({ count: 0 })),
      c.env.DB.prepare("SELECT count(*) as count FROM users WHERE company_id = ?").bind(companyId).first().catch(() => ({ count: 0 })),
      c.env.DB.prepare("SELECT count(*) as count FROM contracts WHERE company_id = ?").bind(companyId).first().catch(() => ({ count: 0 })),
      c.env.DB.prepare("SELECT count(*) as count FROM finance WHERE company_id = ?").bind(companyId).first().catch(() => ({ count: 0 })),
      c.env.DB.prepare('SELECT count(*) as count FROM categories WHERE company_id = ? AND type = "DEPARTMENT"').bind(companyId).first().catch(() => ({ count: 0 }))
    ]);
    const maxAssets = isPaid ? "UNLIMITED" : isTrial ? 20 : 5;
    const maxUsers = isPaid ? "UNLIMITED" : isTrial ? 3 : 2;
    const maxContracts = isPaid ? "UNLIMITED" : isTrial ? 5 : 2;
    const maxFinance = isPaid ? "UNLIMITED" : isTrial ? 10 : 5;
    const maxDepartments = isPaid ? "UNLIMITED" : 1;
    return c.json({
      success: true,
      data: {
        tier,
        isDemo,
        isTrial,
        isPaid,
        isExpired,
        status: licenseStatus,
        plan_code: planCode,
        plan_name: planName,
        badge,
        start_date: startDate,
        expire_date: expireDate,
        days_remaining: daysRemaining,
        company_id: companyId,
        company_name: companyName,
        companyName,
        organization: companyName,
        key: keyRecord?.value || (planCode === "TRIAL_2M" ? "TRIAL-60-DAYS" : planCode === "LIFETIME" ? "OMNI-LIFETIME" : ""),
        limits: {
          assets: { current: assetsCount?.count || 0, max: maxAssets },
          users: { current: usersCount?.count || 0, max: maxUsers },
          contracts: { current: contractsCount?.count || 0, max: maxContracts },
          finance: { current: financeCount?.count || 0, max: maxFinance },
          departments: { current: deptsCount?.count || 1, max: maxDepartments },
          excelExport: !isDemo,
          unwatermarkedPrint: isPaid,
          allowAutomatedEmails: isPaid,
          allowTelegram: isPaid,
          allowCustomStamp: isPaid,
          allowAdvancedBackup: isPaid
        }
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.post("/api/license/activate", async (c) => {
  try {
    const { license_key } = await c.req.json().catch(() => ({}));
    const cleanKey = (license_key || "").trim().toUpperCase();
    if (!cleanKey) {
      return c.json({ success: false, message: "Vui l\xF2ng nh\u1EADp m\xE3 b\u1EA3n quy\u1EC1n (License Key)" }, 400);
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const { companyId } = await getTenantContext(c);
    const dbKey = await c.env.DB.prepare("SELECT * FROM license_keys WHERE license_key = ?").bind(cleanKey).first().catch(() => null);
    let planCode = "LIFETIME";
    let planName = "G\xF3i V\u0129nh Vi\u1EC5n Tr\u1ECDn \u0110\u1EDDi";
    let durationMonths = 120;
    if (dbKey) {
      if (dbKey.status === "USED") {
        return c.json({ success: false, message: "M\xE3 b\u1EA3n quy\u1EC1n n\xE0y \u0111\xE3 \u0111\u01B0\u1EE3c k\xEDch ho\u1EA1t tr\u01B0\u1EDBc \u0111\xF3." }, 400);
      }
      if (dbKey.status === "REVOKED") {
        return c.json({ success: false, message: "M\xE3 b\u1EA3n quy\u1EC1n n\xE0y \u0111\xE3 b\u1ECB thu h\u1ED3i ho\u1EB7c h\u1EBFt hi\u1EC7u l\u1EF1c." }, 400);
      }
      if (dbKey.company_id && companyId && dbKey.company_id !== companyId) {
        return c.json({ success: false, message: "M\xE3 b\u1EA3n quy\u1EC1n n\xE0y \u0111\u01B0\u1EE3c ch\u1EC9 \u0111\u1ECBnh ri\xEAng cho doanh nghi\u1EC7p kh\xE1c." }, 403);
      }
      planCode = dbKey.plan_code || "LIFETIME";
      planName = dbKey.plan_name || "B\u1EA3n Quy\u1EC1n Doanh Nghi\u1EC7p";
      durationMonths = Number(dbKey.duration_months) || 12;
      await c.env.DB.prepare(`
        UPDATE license_keys 
        SET status = 'USED', company_id = ?, activated_at = datetime('now')
        WHERE id = ?
      `).bind(companyId, dbKey.id).run();
    } else {
      return c.json({
        success: false,
        message: "M\xE3 b\u1EA3n quy\u1EC1n kh\xF4ng h\u1EE3p l\u1EC7 ho\u1EB7c kh\xF4ng t\u1ED3n t\u1EA1i tr\xEAn h\u1EC7 th\u1ED1ng. Vui l\xF2ng ki\u1EC3m tra l\u1EA1i ho\u1EB7c li\xEAn h\u1EC7 Hotline/Zalo 0394264400 \u0111\u1EC3 \u0111\u01B0\u1EE3c c\u1EA5p m\xE3 k\xEDch ho\u1EA1t."
      }, 400);
    }
    let expireDateVal = "2099-12-31";
    if (planCode !== "LIFETIME") {
      const d = /* @__PURE__ */ new Date();
      d.setMonth(d.getMonth() + durationMonths);
      expireDateVal = d.toISOString().slice(0, 10);
    }
    if (companyId && companyId !== "ALL" && companyId !== "SYSTEM") {
      await c.env.DB.prepare(`
        UPDATE company_tenants
        SET plan_code = ?, license_status = 'ACTIVE', expire_date = ?
        WHERE id = ?
      `).bind(planCode, expireDateVal, companyId).run();
      await c.env.DB.prepare(`
        INSERT INTO company_settings (company_id, key, value, updated_at)
        VALUES (?, 'license_tier', 'ENTERPRISE', ?),
               (?, 'license_key', ?, ?),
               (?, 'license_status', 'ACTIVE', ?),
               (?, 'license_activated_at', ?, ?)
        ON CONFLICT(company_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).bind(companyId, now, companyId, cleanKey, now, companyId, now, companyId, now, now).run().catch(() => {
      });
    }
    await initSettingsTable(c.env.DB);
    await c.env.DB.prepare(`
      UPDATE system_settings
      SET value = 'ENTERPRISE', updated_at = ?
      WHERE key = 'license_tier'
    `).bind(now).run();
    await c.env.DB.prepare(`
      UPDATE system_settings
      SET value = ?, updated_at = ?
      WHERE key = 'license_key'
    `).bind(cleanKey, now).run();
    await c.env.DB.prepare(`
      UPDATE system_settings
      SET value = ?, updated_at = ?
      WHERE key = 'license_activated_at'
    `).bind(now, now).run();
    return c.json({
      success: true,
      message: `\u{1F389} K\xEDch ho\u1EA1t th\xE0nh c\xF4ng ${planName}! M\u1ECDi ch\u1EE9c n\u0103ng \u0111\xE3 \u0111\u01B0\u1EE3c m\u1EDF kh\xF3a to\xE0n di\u1EC7n.`,
      data: {
        tier: "ENTERPRISE",
        plan_code: planCode,
        isDemo: false,
        key: cleanKey,
        activatedAt: now,
        expire_date: expireDateVal
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.post("/api/license/reset-demo", async (c) => {
  try {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const { companyId } = await getTenantContext(c);
    if (companyId && companyId !== "ALL" && companyId !== "SYSTEM") {
      await c.env.DB.prepare(`
        UPDATE company_tenants
        SET plan_code = 'DEMO', license_status = 'EXPIRED'
        WHERE id = ?
      `).bind(companyId).run();
      await c.env.DB.prepare(`
        INSERT INTO company_settings (company_id, key, value, updated_at)
        VALUES (?, 'license_tier', 'DEMO', ?),
               (?, 'license_key', '', ?)
        ON CONFLICT(company_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).bind(companyId, now, companyId, now).run().catch(() => {
      });
    }
    await c.env.DB.prepare(`
      UPDATE system_settings
      SET value = 'DEMO', updated_at = ?
      WHERE key = 'license_tier'
    `).bind(now).run();
    await c.env.DB.prepare(`
      UPDATE system_settings
      SET value = '', updated_at = ?
      WHERE key = 'license_key'
    `).bind(now).run();
    return c.json({
      success: true,
      message: "\u0110\xE3 chuy\u1EC3n v\u1EC1 ch\u1EBF \u0111\u1ED9 D\xF9ng Th\u1EED (Demo) \u0111\u1EC3 ki\u1EC3m th\u1EED c\xE1c gi\u1EDBi h\u1EA1n t\xEDnh n\u0103ng.",
      data: { tier: "DEMO", isDemo: true }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.post("/api/mail/test", async (c) => {
  try {
    const { companyId } = await getTenantContext(c);
    const body = await c.req.json().catch(() => ({}));
    let targetEmail = (body.email || "").trim();
    if (!targetEmail) {
      const compTenant2 = await c.env.DB.prepare("SELECT admin_email, company_name FROM company_tenants WHERE id = ?").bind(companyId).first().catch(() => null);
      targetEmail = compTenant2?.admin_email;
    }
    if (!targetEmail || !targetEmail.includes("@")) {
      return c.json({ success: false, message: "Vui l\xF2ng cung c\u1EA5p \u0111\u1ECBa ch\u1EC9 email h\u1EE3p l\u1EC7 \u0111\u1EC3 nh\u1EADn th\u1EED nghi\u1EC7m." }, 400);
    }
    const config = await getEmailConfig(c.env.DB, companyId);
    const compTenant = await c.env.DB.prepare("SELECT company_name FROM company_tenants WHERE id = ?").bind(companyId).first().catch(() => null);
    const companyName = compTenant?.company_name || config.senderName || "OMNI ASSETS & LOGISTICS";
    const testHtml = getTestEmailHtml({
      companyName,
      provider: config.provider,
      recipientEmail: targetEmail
    });
    const sendRes = await sendEmail({
      db: c.env.DB,
      companyId,
      senderType: "support",
      replyTo: "hieupham101097@gmail.com",
      to: targetEmail,
      subject: `[OMNI ASSETS] Ki\u1EC3m tra c\u1EA5u h\xECnh g\u1EEDi mail th\xE0nh c\xF4ng (${config.provider.toUpperCase()})`,
      html: testHtml
    });
    return c.json({
      success: true,
      message: `\u0110\xE3 g\u1EEDi th\xE0nh c\xF4ng email th\u1EED nghi\u1EC7m \u0111\u1EBFn ${targetEmail} qua ${config.provider.toUpperCase()} (H\xF2m th\u01B0: support@omniassets.ryug.id.vn)!`,
      data: {
        provider: config.provider,
        recipient: targetEmail,
        id: sendRes.id || sendRes.messageId,
        mailbox: sendRes.mailbox,
        from: sendRes.from,
        replyTo: sendRes.replyTo
      }
    });
  } catch (err) {
    return c.json({ success: false, message: `L\u1ED7i g\u1EEDi mail: ${err.message}` }, 500);
  }
});
app.post("/api/mail/send-timesheet", async (c) => {
  try {
    const { companyId } = await getTenantContext(c);
    const body = await c.req.json().catch(() => ({}));
    const {
      email,
      user_name,
      month,
      totalDaysWorked = 0,
      totalHours = 0,
      standardWorkDays = 0,
      onTimeDays = 0,
      lateDays = 0,
      lateMinutes = 0,
      punctualityRate = 100,
      notes = ""
    } = body;
    const targetEmail = (email || "").trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      return c.json({ success: false, message: "Nh\xE2n vi\xEAn n\xE0y ch\u01B0a c\xF3 \u0111\u1ECBa ch\u1EC9 email h\u1EE3p l\u1EC7." }, 400);
    }
    const compTenant = await c.env.DB.prepare("SELECT company_name FROM company_tenants WHERE id = ?").bind(companyId).first().catch(() => null);
    const companyName = compTenant?.company_name || "OMNI ASSETS & LOGISTICS";
    const timesheetHtml = getTimesheetEmailHtml({
      companyName,
      userName: user_name || "Nh\xE2n vi\xEAn",
      month: month || (/* @__PURE__ */ new Date()).toISOString().slice(0, 7),
      totalDaysWorked,
      totalHours,
      standardWorkDays,
      onTimeDays,
      lateDays,
      lateMinutes,
      punctualityRate,
      notes
    });
    const sendRes = await sendEmail({
      db: c.env.DB,
      companyId,
      senderType: "attendance",
      to: targetEmail,
      subject: `[${companyName}] Phi\u1EBFu t\u1ED5ng h\u1EE3p ch\u1EA5m c\xF4ng th\xE1ng ${month} - ${user_name}`,
      html: timesheetHtml
    });
    return c.json({
      success: true,
      message: `\u0110\xE3 g\u1EEDi phi\u1EBFu ch\u1EA5m c\xF4ng th\xE1ng ${month} \u0111\u1EBFn email ${targetEmail}!`,
      data: sendRes
    });
  } catch (err) {
    return c.json({ success: false, message: `L\u1ED7i g\u1EEDi email phi\u1EBFu c\xF4ng: ${err.message}` }, 500);
  }
});
app.post("/api/mail/send-daily-reminders", async (c) => {
  try {
    const { companyId } = await getTenantContext(c);
    const body = await c.req.json().catch(() => ({}));
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(/* @__PURE__ */ new Date());
    const mailConfig = await getEmailConfig(c.env.DB, companyId);
    let targetEmails = [];
    if (body.email && String(body.email).trim()) {
      targetEmails = String(body.email).split(/[,;\n]/).map((e) => e.trim().toLowerCase()).filter((e) => e && e.includes("@"));
    } else if (mailConfig.reportRecipients && mailConfig.reportRecipients.trim()) {
      targetEmails = mailConfig.reportRecipients.split(/[,;\n]/).map((e) => e.trim().toLowerCase()).filter((e) => e && e.includes("@"));
    }
    const compTenant = await c.env.DB.prepare("SELECT company_name, admin_email FROM company_tenants WHERE id = ?").bind(companyId).first().catch(() => null);
    if (targetEmails.length === 0 && compTenant?.admin_email) {
      targetEmails = [compTenant.admin_email.trim().toLowerCase()];
    }
    if (targetEmails.length === 0) {
      return c.json({ success: false, message: "Ch\u01B0a c\xF3 email n\xE0o trong danh s\xE1ch nh\u1EADn th\xF4ng b\xE1o nh\u1EAFc h\u1EA1n. Vui l\xF2ng thi\u1EBFt l\u1EADp danh s\xE1ch email nh\u1EADn b\xE1o c\xE1o." }, 400);
    }
    const [overdueTasks, upcomingContracts, expiredContracts] = await Promise.all([
      c.env.DB.prepare("SELECT title, assignee, due_date FROM tasks WHERE (company_id = ? OR company_id IS NULL) AND status != 'COMPLETED' AND due_date < ? ORDER BY due_date ASC LIMIT 10").bind(companyId, today).all().catch(() => ({ results: [] })),
      c.env.DB.prepare("SELECT contract_number, partner_name, end_date FROM contracts WHERE (company_id = ? OR company_id IS NULL) AND status = 'ACTIVE' AND end_date <= date('now', '+30 day') ORDER BY end_date ASC LIMIT 10").bind(companyId).all().catch(() => ({ results: [] })),
      c.env.DB.prepare("SELECT contract_number, partner_name, end_date FROM contracts WHERE (company_id = ? OR company_id IS NULL) AND status = 'EXPIRED' ORDER BY end_date DESC LIMIT 10").bind(companyId).all().catch(() => ({ results: [] }))
    ]);
    const companyName = compTenant?.company_name || "OMNIASSETS";
    const mailHtml = getDailyRemindersEmailHtml({
      companyName,
      date: today,
      overdueTasks: overdueTasks.results || [],
      upcomingContracts: upcomingContracts.results || [],
      expiredContracts: expiredContracts.results || [],
      dashboardUrl: "https://company-sheet.hieupham101097.workers.dev"
    });
    const sentResults = [];
    for (const email of targetEmails) {
      try {
        await sendEmail({
          db: c.env.DB,
          companyId,
          senderType: "reports",
          to: email,
          subject: `[Nh\u1EAFc H\u1EA1n V\u1EADn H\xE0nh 06:00 AM] B\xE1o c\xE1o ti\u1EBFn \u0111\u1ED9 ng\xE0y ${today} - ${companyName}`,
          html: mailHtml
        });
        sentResults.push(email);
      } catch (err) {
        console.error(`Error sending reminder to ${email}:`, err.message);
      }
    }
    return c.json({
      success: true,
      message: `\u0110\xE3 g\u1EEDi b\xE1o c\xE1o nh\u1EAFc h\u1EA1n th\xE0nh c\xF4ng \u0111\u1EBFn ${sentResults.length}/${targetEmails.length} email (${sentResults.join(", ")})!`,
      data: { sentCount: sentResults.length, recipients: sentResults }
    });
  } catch (err) {
    return c.json({ success: false, message: `L\u1ED7i g\u1EEDi b\u1EA3n tin nh\u1EAFc h\u1EA1n: ${err.message}` }, 500);
  }
});
app.post("/api/mail/broadcast", async (c) => {
  try {
    const { companyId } = await getTenantContext(c);
    const body = await c.req.json().catch(() => ({}));
    const {
      recipient_type = "SINGLE",
      // 'SINGLE', 'ALL', 'DEPARTMENT'
      target_email,
      target_department,
      subject,
      content,
      urgency = "NORMAL",
      // 'NORMAL', 'URGENT', 'ANNOUNCEMENT'
      sender_type = "tasks"
      // 'tasks' | 'attendance' | 'assets' | 'contracts' | 'reports' | 'notifications'
    } = body;
    if (!subject || !subject.trim()) {
      return c.json({ success: false, message: "Vui l\xF2ng nh\u1EADp ti\xEAu \u0111\u1EC1 email" }, 400);
    }
    if (!content || !content.trim()) {
      return c.json({ success: false, message: "Vui l\xF2ng nh\u1EADp n\u1ED9i dung th\xF4ng b\xE1o email" }, 400);
    }
    const compTenant = await c.env.DB.prepare("SELECT company_name, admin_email FROM company_tenants WHERE id = ?").bind(companyId).first().catch(() => null);
    const companyName = compTenant?.company_name || "OMNI ASSETS & LOGISTICS";
    let recipients = [];
    if (recipient_type === "SINGLE") {
      const email = (target_email || "").trim().toLowerCase();
      if (!email || !email.includes("@")) {
        return c.json({ success: false, message: "Vui l\xF2ng nh\u1EADp \u0111\u1ECBa ch\u1EC9 email ng\u01B0\u1EDDi nh\u1EADn h\u1EE3p l\u1EC7" }, 400);
      }
      recipients = [email];
    } else if (recipient_type === "DEPARTMENT") {
      if (!target_department || !target_department.trim()) {
        return c.json({ success: false, message: "Vui l\xF2ng ch\u1ECDn ph\xF2ng ban nh\u1EADn th\u01B0" }, 400);
      }
      const users = await c.env.DB.prepare('SELECT email FROM users WHERE (company_id = ? OR company_id IS NULL) AND department = ? AND status = "ACTIVE" AND email LIKE "%@%"').bind(companyId, target_department.trim()).all().catch(() => ({ results: [] }));
      recipients = (users.results || []).map((u) => (u.email || "").trim().toLowerCase());
    } else {
      const users = await c.env.DB.prepare('SELECT email FROM users WHERE (company_id = ? OR company_id IS NULL) AND status = "ACTIVE" AND email LIKE "%@%"').bind(companyId).all().catch(() => ({ results: [] }));
      recipients = (users.results || []).map((u) => (u.email || "").trim().toLowerCase());
    }
    recipients = Array.from(new Set(recipients)).filter((e) => e && e.includes("@"));
    if (recipients.length === 0) {
      return c.json({ success: false, message: "Kh\xF4ng t\xECm th\u1EA5y ng\u01B0\u1EDDi nh\u1EADn n\xE0o ph\xF9 h\u1EE3p v\u1EDBi danh s\xE1ch ch\u1ECDn" }, 400);
    }
    const mailHtml = getBroadcastEmailHtml({
      companyName,
      subject: subject.trim(),
      content: content.trim(),
      urgency,
      dashboardUrl: "https://company-sheet.hieupham101097.workers.dev"
    });
    const chosenSenderType = SENDER_MAILBOXES[sender_type] ? sender_type : "tasks";
    const sentList = [];
    const failedList = [];
    for (const email of recipients) {
      try {
        await sendEmail({
          db: c.env.DB,
          companyId,
          senderType: chosenSenderType,
          to: email,
          subject: `[${companyName}] ${subject.trim()}`,
          html: mailHtml
        });
        sentList.push(email);
      } catch (err) {
        failedList.push({ email, error: err.message });
      }
    }
    return c.json({
      success: true,
      message: `\u0110\xE3 ph\xE1t email th\xE0nh c\xF4ng \u0111\u1EBFn ${sentList.length}/${recipients.length} ng\u01B0\u1EDDi nh\u1EADn!`,
      data: {
        total: recipients.length,
        sentCount: sentList.length,
        failedCount: failedList.length,
        sentList,
        failedList
      }
    });
  } catch (err) {
    return c.json({ success: false, message: `L\u1ED7i ph\xE1t email: ${err.message}` }, 500);
  }
});
async function initSupportTicketsTable(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id TEXT PRIMARY KEY,
        company_id TEXT,
        company_name TEXT,
        sender_name TEXT,
        sender_email TEXT,
        sender_phone TEXT,
        subject TEXT,
        message TEXT,
        status TEXT DEFAULT 'PENDING',
        reply_message TEXT,
        replied_at TEXT,
        replied_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  } catch (e) {
    console.error("Init support_tickets table error:", e.message);
  }
}
__name(initSupportTicketsTable, "initSupportTicketsTable");
app.post("/api/mail/send-support", async (c) => {
  try {
    const { companyId } = await getTenantContext(c);
    const body = await c.req.json().catch(() => ({}));
    const {
      sender_name,
      sender_email,
      sender_phone,
      company_name,
      subject = "Y\xEAu c\u1EA7u h\u1ED7 tr\u1EE3 h\u1EC7 th\u1ED1ng OMNI ASSETS",
      message
    } = body;
    if (!message || !message.trim()) {
      return c.json({ success: false, message: "Vui l\xF2ng nh\u1EADp n\u1ED9i dung c\u1EA7n h\u1ED7 tr\u1EE3" }, 400);
    }
    const cleanSenderEmail = (sender_email || "").trim().toLowerCase();
    const compTenant = await c.env.DB.prepare("SELECT company_name FROM company_tenants WHERE id = ?").bind(companyId).first().catch(() => null);
    const effectiveCompName = company_name || compTenant?.company_name || "Doanh Nghi\u1EC7p OMNI ASSETS";
    await initSupportTicketsTable(c.env.DB);
    const ticketId = "ticket_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
    await c.env.DB.prepare(`
      INSERT INTO support_tickets (id, company_id, company_name, sender_name, sender_email, sender_phone, subject, message, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', datetime('now'), datetime('now'))
    `).bind(ticketId, companyId || "TENANT", effectiveCompName, sender_name || "Qu\u1EA3n l\xFD", cleanSenderEmail, sender_phone || "", subject, message).run();
    const supportHtml = `
      <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:18px; margin-bottom:16px;">
        <h3 style="margin:0 0 8px 0; color:#15803d; font-size:16px;">\u{1F4E9} Y\xCAU C\u1EA6U H\u1ED6 TR\u1EE2 / LI\xCAN H\u1EC6 T\u1EEA DOANH NGHI\u1EC6P</h3>
        <p style="margin:4px 0; font-size:13px;"><strong>M\xE3 Ticket:</strong> <code style="background:#dcfce7; padding:2px 6px; border-radius:4px; font-weight:bold;">${ticketId}</code></p>
        <p style="margin:4px 0; font-size:13px;"><strong>Doanh nghi\u1EC7p:</strong> ${effectiveCompName}</p>
        <p style="margin:4px 0; font-size:13px;"><strong>Ng\u01B0\u1EDDi li\xEAn h\u1EC7:</strong> ${sender_name || "Qu\u1EA3n l\xFD"}</p>
        <p style="margin:4px 0; font-size:13px;"><strong>Email g\u1EEDi:</strong> <a href="mailto:${cleanSenderEmail}">${cleanSenderEmail || "Ch\u01B0a cung c\u1EA5p"}</a></p>
        <p style="margin:4px 0; font-size:13px;"><strong>S\u1ED1 \u0111i\u1EC7n tho\u1EA1i:</strong> ${sender_phone || "Ch\u01B0a cung c\u1EA5p"}</p>
      </div>
      <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:18px;">
        <h4 style="margin:0 0 8px 0; color:#0f172a; font-size:14px;">N\u1ED9i dung y\xEAu c\u1EA7u h\u1ED7 tr\u1EE3:</h4>
        <p style="white-space:pre-wrap; color:#334155; line-height:1.6; font-size:14px; margin:0;">${message}</p>
      </div>
      <p style="font-size:12px; color:#64748b; margin-top:16px;">
        \u2139\uFE0F Y\xEAu c\u1EA7u n\xE0y \u0111\xE3 \u0111\u01B0\u1EE3c \u0111\u1ED3ng b\u1ED9 v\xE0o <strong>C\u1ED5ng Qu\u1EA3n Tr\u1ECB H\u1EC7 Th\u1ED1ng (Super Admin Portal - H\xF2m Th\u01B0 H\u1ED7 Tr\u1EE3)</strong>. B\u1EA1n c\xF3 th\u1EC3 m\u1EDF h\u1EC7 th\u1ED1ng \u0111\u1EC3 ph\u1EA3n h\u1ED3i tr\u1EF1c ti\u1EBFp cho kh\xE1ch h\xE0ng.
      </p>
    `;
    const notifyAdmins = ["adminManager@gmail.com", "hieupham101097@gmail.com"];
    for (const adminEmail of notifyAdmins) {
      try {
        await sendEmail({
          db: c.env.DB,
          companyId: "SYSTEM",
          senderType: "support",
          to: adminEmail,
          replyTo: cleanSenderEmail || "support@omniassets.ryug.id.vn",
          subject: `[OMNI ASSETS SUPPORT] ${subject} - ${effectiveCompName}`,
          html: wrapEmailHtml({
            title: "Y\xEAu C\u1EA7u H\u1ED7 Tr\u1EE3 K\u1EF9 Thu\u1EADt & V\u1EADn H\xE0nh",
            preheader: `Y\xEAu c\u1EA7u h\u1ED7 tr\u1EE3 t\u1EEB ${effectiveCompName}: ${subject}`,
            contentHtml: supportHtml
          })
        });
      } catch (err) {
        console.error("Send admin support notify error:", err.message);
      }
    }
    return c.json({
      success: true,
      message: "Y\xEAu c\u1EA7u h\u1ED7 tr\u1EE3 \u0111\xE3 \u0111\u01B0\u1EE3c chuy\u1EC3n th\xE0nh c\xF4ng \u0111\u1EBFn Ban Qu\u1EA3n Tr\u1ECB OMNI ASSETS! \u0110\u1ED9i ng\u0169 h\u1ED7 tr\u1EE3 s\u1EBD ph\u1EA3n h\u1ED3i trong th\u1EDDi gian s\u1EDBm nh\u1EA5t.",
      data: { ticketId }
    });
  } catch (err) {
    return c.json({ success: false, message: `L\u1ED7i g\u1EEDi h\u1ED7 tr\u1EE3: ${err.message}` }, 500);
  }
});
app.get("/api/super-admin/support-tickets", async (c) => {
  try {
    const { isSuperAdmin, role, email } = await getTenantContext(c);
    if (!isSuperAdmin && role !== "SUPER_ADMIN" && email !== "adminManager@gmail.com") {
      return c.json({ success: false, message: "Ch\u1EC9 Super Admin m\u1EDBi c\xF3 quy\u1EC1n truy c\u1EADp h\xF2m th\u01B0 h\u1ED7 tr\u1EE3" }, 403);
    }
    await initSupportTicketsTable(c.env.DB);
    const res = await c.env.DB.prepare(`
      SELECT * FROM support_tickets 
      ORDER BY created_at DESC 
      LIMIT 100
    `).all().catch(() => ({ results: [] }));
    return c.json({
      success: true,
      data: res.results || []
    });
  } catch (err) {
    return c.json({ success: false, message: `L\u1ED7i t\u1EA3i danh s\xE1ch y\xEAu c\u1EA7u h\u1ED7 tr\u1EE3: ${err.message}` }, 500);
  }
});
app.post("/api/super-admin/support-tickets/reply", async (c) => {
  try {
    const { isSuperAdmin, role, email } = await getTenantContext(c);
    if (!isSuperAdmin && role !== "SUPER_ADMIN" && email !== "adminManager@gmail.com") {
      return c.json({ success: false, message: "Ch\u1EC9 Super Admin m\u1EDBi c\xF3 quy\u1EC1n ph\u1EA3n h\u1ED3i y\xEAu c\u1EA7u h\u1ED7 tr\u1EE3" }, 403);
    }
    const body = await c.req.json().catch(() => ({}));
    const { ticketId, replyMessage } = body;
    if (!ticketId) {
      return c.json({ success: false, message: "Thi\u1EBFu m\xE3 ticket" }, 400);
    }
    if (!replyMessage || !replyMessage.trim()) {
      return c.json({ success: false, message: "Vui l\xF2ng nh\u1EADp n\u1ED9i dung th\u01B0 ph\u1EA3n h\u1ED3i" }, 400);
    }
    await initSupportTicketsTable(c.env.DB);
    const ticket = await c.env.DB.prepare("SELECT * FROM support_tickets WHERE id = ?").bind(ticketId).first().catch(() => null);
    if (!ticket) {
      return c.json({ success: false, message: "Kh\xF4ng t\xECm th\u1EA5y y\xEAu c\u1EA7u h\u1ED7 tr\u1EE3 n\xE0y" }, 404);
    }
    const recipientEmail = (ticket.sender_email || "").trim().toLowerCase();
    if (!recipientEmail || !recipientEmail.includes("@")) {
      return c.json({ success: false, message: "Email ng\u01B0\u1EDDi nh\u1EADn kh\xF4ng h\u1EE3p l\u1EC7 trong ticket n\xE0y" }, 400);
    }
    const replySubject = `[OMNI ASSETS SUPPORT] Ph\u1EA3n H\u1ED3i: ${ticket.subject || "Y\xEAu c\u1EA7u h\u1ED7 tr\u1EE3 h\u1EC7 th\u1ED1ng"}`;
    const replyContent = `
      <div style="text-align: center; margin-bottom: 20px;">
        <span class="badge badge-success" style="background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0; padding:6px 16px; font-size:11px; font-weight:700; border-radius:9999px;">
          \u2713 TH\u01AF PH\u1EA2N H\u1ED2I CH\xCDNH TH\u1EE8C T\u1EEA BAN QU\u1EA2N TR\u1ECA
        </span>
      </div>

      <p style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">
        K\xEDnh g\u1EEDi Qu\xFD Doanh nghi\u1EC7p ${ticket.company_name} (${ticket.sender_name || "Qu\u1EA3n l\xFD"}),
      </p>
      <p style="font-size: 14px; color: #334155; line-height: 1.65; margin: 0 0 16px 0;">
        Ban Qu\u1EA3n Tr\u1ECB H\u1EC7 Th\u1ED1ng OMNI ASSETS tr\xE2n tr\u1ECDng g\u1EEDi th\u01B0 ph\u1EA3n h\u1ED3i v\u1EC1 y\xEAu c\u1EA7u h\u1ED7 tr\u1EE3 c\u1EE7a b\u1EA1n li\xEAn quan \u0111\u1EBFn v\u1EA5n \u0111\u1EC1: <strong>"${ticket.subject || "H\u1ED7 tr\u1EE3 k\u1EF9 thu\u1EADt"}"</strong>.
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #059669; border-radius: 12px; padding: 18px 22px; margin: 18px 0;">
        <h4 style="margin: 0 0 8px 0; color: #065f46; font-size: 14px; font-weight: 700;">N\u1ED9i dung ph\u1EA3n h\u1ED3i t\u1EEB Chuy\xEAn vi\xEAn H\u1ED7 tr\u1EE3:</h4>
        <p style="white-space: pre-wrap; font-size: 14px; color: #1e293b; line-height: 1.7; margin: 0;">${replyMessage.trim()}</p>
      </div>

      <div style="background: #f1f5f9; border-radius: 12px; padding: 14px 18px; margin-top: 20px; font-size: 12px; color: #64748b; border: 1px dashed #cbd5e1;">
        <p style="margin: 0 0 4px 0; font-weight: 700; color: #475569;">Tr\xEDch d\u1EABn n\u1ED9i dung y\xEAu c\u1EA7u ban \u0111\u1EA7u c\u1EE7a b\u1EA1n:</p>
        <p style="margin: 0; white-space: pre-wrap; font-style: italic;">"${ticket.message}"</p>
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin-top: 22px;">
        N\u1EBFu b\u1EA1n c\u1EA7n th\xEAm b\u1EA5t k\u1EF3 tr\u1EE3 gi\xFAp n\xE0o, b\u1EA1n c\xF3 th\u1EC3 tr\u1EA3 l\u1EDDi tr\u1EF1c ti\u1EBFp email n\xE0y ho\u1EB7c li\xEAn h\u1EC7 l\u1EA1i v\u1EDBi ch\xFAng t\xF4i qua <a href="mailto:support@omniassets.ryug.id.vn" style="color: #059669; font-weight: 600; text-decoration: none;">support@omniassets.ryug.id.vn</a>.
      </p>
    `;
    await sendEmail({
      db: c.env.DB,
      companyId: "SYSTEM",
      senderType: "support",
      senderName: "OMNI ASSETS Support",
      to: recipientEmail,
      replyTo: "support@omniassets.ryug.id.vn",
      subject: replySubject,
      html: wrapEmailHtml({
        title: "Ph\u1EA3n H\u1ED3i Y\xEAu C\u1EA7u H\u1ED7 Tr\u1EE3 K\u1EF9 Thu\u1EADt",
        preheader: `Ph\u1EA3n h\u1ED3i t\u1EEB OMNI ASSETS: ${ticket.subject}`,
        contentHtml: replyContent
      })
    });
    await c.env.DB.prepare(`
      UPDATE support_tickets 
      SET status = 'REPLIED', reply_message = ?, replied_at = datetime('now'), replied_by = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(replyMessage.trim(), email || "adminManager@gmail.com", ticketId).run();
    return c.json({
      success: true,
      message: `\u0110\xE3 g\u1EEDi th\u01B0 ph\u1EA3n h\u1ED3i ch\xEDnh th\u1EE9c th\xE0nh c\xF4ng \u0111\u1EBFn ${recipientEmail}!`,
      data: { ticketId, status: "REPLIED" }
    });
  } catch (err) {
    return c.json({ success: false, message: `L\u1ED7i ph\u1EA3n h\u1ED3i y\xEAu c\u1EA7u h\u1ED7 tr\u1EE3: ${err.message}` }, 500);
  }
});
app.post("/api/mail/send-management-notification", async (c) => {
  try {
    const { companyId } = await getTenantContext(c);
    const body = await c.req.json().catch(() => ({}));
    const { subject, message, sender_name } = body;
    const compTenant = await c.env.DB.prepare("SELECT company_name, admin_email FROM company_tenants WHERE id = ?").bind(companyId).first().catch(() => null);
    const companyName = compTenant?.company_name || "Doanh Nghi\u1EC7p";
    let usersQuery = `
      SELECT id, name, email, role, department 
      FROM users 
      WHERE (company_id = ? OR company_id IS NULL)
        AND (role = 'ADMIN' OR role = 'MANAGER')
        AND status != 'INACTIVE'
        AND email LIKE '%@%'
    `;
    const usersRes = await c.env.DB.prepare(usersQuery).bind(companyId).all().catch(() => ({ results: [] }));
    const managers = usersRes.results || [];
    let recipientEmails = managers.map((u) => (u.email || "").trim().toLowerCase()).filter(Boolean);
    if (compTenant?.admin_email && compTenant.admin_email.includes("@")) {
      recipientEmails.push(compTenant.admin_email.trim().toLowerCase());
    }
    recipientEmails = Array.from(new Set(recipientEmails)).filter((e) => e && e.includes("@"));
    if (recipientEmails.length === 0) {
      return c.json({
        success: false,
        message: "Kh\xF4ng t\xECm th\u1EA5y t\xE0i kho\u1EA3n Qu\u1EA3n Tr\u1ECB Vi\xEAn (ADMIN) ho\u1EB7c Qu\u1EA3n L\xFD (MANAGER) c\xF3 email h\u1EE3p l\u1EC7 trong doanh nghi\u1EC7p."
      }, 400);
    }
    const timestamp = (/* @__PURE__ */ new Date()).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    const finalSubject = (subject || `[Th\xF4ng B\xE1o N\u1ED9i B\u1ED9] C\u1EADp nh\u1EADt \u0111i\u1EC1u h\xE0nh & ph\xE2n quy\u1EC1n ph\xF2ng ban (${companyName})`).trim();
    const managerNames = managers.map((u) => `${u.name} (${u.role})`);
    const mailHtml = getManagementNotificationEmailHtml({
      companyName,
      subject: finalSubject,
      message: message || "Ban \u0110i\u1EC1u H\xE0nh th\xF4ng b\xE1o: \u0110\xE3 c\u1EADp nh\u1EADt v\xE0 \u0111\u1ED3ng b\u1ED9 c\u1EA5u h\xECnh ph\xE2n quy\u1EC1n, danh m\u1EE5c v\xE0 quy ch\u1EBF v\u1EADn h\xE0nh cho to\xE0n b\u1ED9 ph\xF2ng ban trong doanh nghi\u1EC7p.",
      senderName: sender_name || "Ban Qu\u1EA3n Tr\u1ECB Doanh Nghi\u1EC7p",
      timestamp,
      managerNames,
      dashboardUrl: "https://company-sheet.hieupham101097.workers.dev"
    });
    const sentList = [];
    const failedList = [];
    for (const email of recipientEmails) {
      try {
        await sendEmail({
          db: c.env.DB,
          companyId,
          senderType: "tasks",
          to: email,
          subject: finalSubject,
          html: mailHtml
        });
        sentList.push(email);
      } catch (err) {
        failedList.push({ email, error: err.message });
      }
    }
    return c.json({
      success: true,
      message: `\u0110\xE3 g\u1EEDi email th\xF4ng b\xE1o n\u1ED9i b\u1ED9 th\xE0nh c\xF4ng \u0111\u1EBFn ${sentList.length}/${recipientEmails.length} c\xE1n b\u1ED9 Admin & Manager!`,
      data: {
        total: recipientEmails.length,
        sentCount: sentList.length,
        failedCount: failedList.length,
        from: "tasks@omniassets.ryug.id.vn",
        sentList,
        failedList
      }
    });
  } catch (err) {
    return c.json({ success: false, message: `L\u1ED7i g\u1EEDi email n\u1ED9i b\u1ED9: ${err.message}` }, 500);
  }
});
app.get("/api/super-admin/announcements/recipients", async (c) => {
  try {
    const { isSuperAdmin, userId } = await getTenantContext(c);
    const u = userId ? await c.env.DB.prepare("SELECT role, email FROM users WHERE id = ?").bind(userId).first().catch(() => null) : null;
    const isSuper = isSuperAdmin || u?.role === "SUPER_ADMIN" || u?.email === "adminManager@gmail.com";
    if (!isSuper) {
      return c.json({ success: false, message: "Quy\u1EC1n truy c\u1EADp b\u1ECB t\u1EEB ch\u1ED1i: Ch\u1EC9 Super Admin (adminManager@gmail.com) m\u1EDBi c\xF3 quy\u1EC1n truy c\u1EADp." }, 403);
    }
    const compRes = await c.env.DB.prepare("SELECT id, company_name, admin_name, admin_email, plan_code, license_status FROM company_tenants ORDER BY created_at DESC").all().catch(() => ({ results: [] }));
    const companies = compRes.results || [];
    const usersRes = await c.env.DB.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.department, u.company_id, c.company_name
      FROM users u
      LEFT JOIN company_tenants c ON u.company_id = c.id
      WHERE (u.role = 'ADMIN' OR u.role = 'MANAGER')
        AND u.status != 'INACTIVE'
        AND u.email LIKE '%@%'
      ORDER BY c.company_name, u.role, u.name
    `).all().catch(() => ({ results: [] }));
    const managers = usersRes.results || [];
    const companyMap = {};
    companies.forEach((comp) => {
      companyMap[comp.id] = {
        id: comp.id,
        company_name: comp.company_name,
        plan_code: comp.plan_code,
        license_status: comp.license_status,
        recipients: []
      };
      if (comp.admin_email && comp.admin_email.includes("@")) {
        companyMap[comp.id].recipients.push({
          email: comp.admin_email.trim().toLowerCase(),
          name: comp.admin_name || "Qu\u1EA3n Tr\u1ECB Vi\xEAn",
          role: "ADMIN"
        });
      }
    });
    managers.forEach((m) => {
      const cId = m.company_id || "comp_1";
      if (!companyMap[cId]) {
        companyMap[cId] = {
          id: cId,
          company_name: m.company_name || "Doanh Nghi\u1EC7p",
          plan_code: "TRIAL_2M",
          license_status: "ACTIVE",
          recipients: []
        };
      }
      const cleanEmail = (m.email || "").trim().toLowerCase();
      if (!companyMap[cId].recipients.some((r) => r.email === cleanEmail)) {
        companyMap[cId].recipients.push({
          email: cleanEmail,
          name: m.name,
          role: m.role,
          department: m.department
        });
      }
    });
    const allDistinctEmails = /* @__PURE__ */ new Set();
    Object.values(companyMap).forEach((c2) => {
      c2.recipients.forEach((r) => allDistinctEmails.add(r.email));
    });
    return c.json({
      success: true,
      data: {
        totalCompanies: companies.length,
        totalRecipients: allDistinctEmails.size,
        distinctEmails: Array.from(allDistinctEmails),
        companyList: Object.values(companyMap)
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.post("/api/super-admin/announcements/broadcast", async (c) => {
  try {
    const { isSuperAdmin, userId } = await getTenantContext(c);
    const u = userId ? await c.env.DB.prepare("SELECT role, email FROM users WHERE id = ?").bind(userId).first().catch(() => null) : null;
    const isSuper = isSuperAdmin || u?.role === "SUPER_ADMIN" || u?.email === "adminManager@gmail.com";
    if (!isSuper) {
      return c.json({ success: false, message: "Quy\u1EC1n truy c\u1EADp b\u1ECB t\u1EEB ch\u1ED1i: Ch\u1EC9 Super Admin (adminManager@gmail.com) m\u1EDBi c\xF3 quy\u1EC1n s\u1EED d\u1EE5ng h\xF2m th\u01B0 n\u1EC1n t\u1EA3ng." }, 403);
    }
    const body = await c.req.json().catch(() => ({}));
    const {
      sender_type = "notifications",
      // 'notifications' | 'support'
      target_type = "ALL_COMPANIES",
      // 'ALL_COMPANIES' | 'SINGLE_COMPANY'
      target_company_id = null,
      subject,
      message,
      include_plans = true,
      cta_text,
      cta_url
    } = body;
    const mailboxKey = sender_type === "support" ? "support" : "notifications";
    const senderEmail = mailboxKey === "support" ? "support@omniassets.ryug.id.vn" : "notifications@omniassets.ryug.id.vn";
    const senderName = mailboxKey === "support" ? "OmniAssets Customer Support" : "OmniAssets Platform Announcements";
    let plans = [];
    if (include_plans) {
      const planRes = await c.env.DB.prepare("SELECT code, name, duration_months, price, badge FROM pricing_plans WHERE is_active = 1 ORDER BY price ASC").all().catch(() => ({ results: [] }));
      plans = planRes.results || [];
    }
    let recipientEmails = [];
    let targetName = "To\xE0n B\u1ED9 Kh\xE1ch H\xE0ng";
    if (target_type === "SINGLE_COMPANY" && target_company_id) {
      const comp = await c.env.DB.prepare("SELECT company_name, admin_email FROM company_tenants WHERE id = ?").bind(target_company_id).first().catch(() => null);
      if (comp) targetName = comp.company_name;
      if (comp?.admin_email && comp.admin_email.includes("@")) {
        recipientEmails.push(comp.admin_email.trim().toLowerCase());
      }
      const usersRes = await c.env.DB.prepare(`
        SELECT email FROM users 
        WHERE company_id = ? AND (role = 'ADMIN' OR role = 'MANAGER') AND status != 'INACTIVE' AND email LIKE '%@%'
      `).bind(target_company_id).all().catch(() => ({ results: [] }));
      (usersRes.results || []).forEach((r) => recipientEmails.push((r.email || "").trim().toLowerCase()));
    } else {
      const compRes = await c.env.DB.prepare('SELECT admin_email FROM company_tenants WHERE admin_email LIKE "%@%"').all().catch(() => ({ results: [] }));
      (compRes.results || []).forEach((r) => recipientEmails.push((r.admin_email || "").trim().toLowerCase()));
      const usersRes = await c.env.DB.prepare(`
        SELECT email FROM users 
        WHERE (role = 'ADMIN' OR role = 'MANAGER') AND status != 'INACTIVE' AND email LIKE '%@%'
      `).all().catch(() => ({ results: [] }));
      (usersRes.results || []).forEach((r) => recipientEmails.push((r.email || "").trim().toLowerCase()));
    }
    recipientEmails = Array.from(new Set(recipientEmails)).filter((e) => e && e.includes("@") && e !== "adminmanager@gmail.com");
    if (recipientEmails.length === 0) {
      return c.json({ success: false, message: "Kh\xF4ng t\xECm th\u1EA5y email Qu\u1EA3n tr\u1ECB vi\xEAn/Qu\u1EA3n l\xFD n\xE0o trong ph\u1EA1m vi g\u1EEDi." }, 400);
    }
    const finalSubject = subject ? subject.trim() : "[OmniAssets] C\u1EADp Nh\u1EADt G\xF3i C\u01B0\u1EDBc D\u1ECBch V\u1EE5 & \u01AFu \u0110\xE3i B\u1EA3n Quy\u1EC1n Doanh Nghi\u1EC7p";
    const finalMessage = message ? message.trim() : "Ban Qu\u1EA3n Tr\u1ECB N\u1EC1n T\u1EA3ng tr\xE2n tr\u1ECDng g\u1EEDi th\xF4ng b\xE1o v\u1EC1 b\u1EA3ng g\xF3i c\u01B0\u1EDBc d\u1ECBch v\u1EE5 v\xE0 c\xE1c t\xEDnh n\u0103ng m\u1EDBi \u0111\xE3 \u0111\u01B0\u1EE3c tri\u1EC3n khai tr\xEAn h\u1EC7 th\u1ED1ng.";
    const mailHtml = getSuperAdminPlanAnnouncementEmailHtml({
      subject: finalSubject,
      message: finalMessage,
      plans,
      ctaText: cta_text || "Kh\xE1m Ph\xE1 B\u1EA3ng Gi\xE1 & N\xE2ng C\u1EA5p G\xF3i",
      ctaUrl: cta_url || "https://company-sheet.hieupham101097.workers.dev",
      senderEmail,
      recipientName: targetName
    });
    const sentList = [];
    const failedList = [];
    for (const email of recipientEmails) {
      try {
        await sendEmail({
          db: c.env.DB,
          companyId: "SYSTEM",
          senderType: mailboxKey,
          senderName,
          to: email,
          subject: finalSubject,
          html: mailHtml
        });
        sentList.push(email);
      } catch (err) {
        failedList.push({ email, error: err.message });
      }
    }
    return c.json({
      success: true,
      message: `\u0110\xE3 ph\xE1t th\xF4ng b\xE1o th\xE0nh c\xF4ng qua Resend (${senderEmail}) \u0111\u1EBFn ${sentList.length}/${recipientEmails.length} c\xE1n b\u1ED9 Qu\u1EA3n l\xFD tr\xEAn h\u1EC7 sinh th\xE1i!`,
      data: {
        total: recipientEmails.length,
        sentCount: sentList.length,
        failedCount: failedList.length,
        sender: senderEmail,
        sentList,
        failedList
      }
    });
  } catch (err) {
    return c.json({ success: false, message: `L\u1ED7i ph\xE1t th\xF4ng b\xE1o: ${err.message}` }, 500);
  }
});
app.get("/api/mail/templates", async (c) => {
  return c.json({
    success: true,
    data: Object.values(SENDER_MAILBOXES)
  });
});
app.post("/api/ai/chat", async (c) => {
  try {
    const { companyId } = await getTenantContext(c);
    const { message, activeTab, userRole, userName } = await c.req.json().catch(() => ({}));
    const q = (message || "").toLowerCase().trim();
    const [assetsCount, tasksRes, tenantComp, tenantSettingsRes, sysSettingsRes] = await Promise.all([
      c.env.DB.prepare('SELECT count(*) as count, sum(CASE WHEN status="MAINTENANCE" THEN 1 ELSE 0 END) as maint_count FROM assets WHERE company_id = ?').bind(companyId).first().catch(() => null),
      c.env.DB.prepare('SELECT title, due_date, status, priority FROM tasks WHERE company_id = ? AND status != "COMPLETED" ORDER BY due_date ASC LIMIT 5').bind(companyId).all().catch(() => ({ results: [] })),
      c.env.DB.prepare("SELECT company_name FROM company_tenants WHERE id = ?").bind(companyId).first().catch(() => null),
      c.env.DB.prepare("SELECT key, value FROM company_settings WHERE company_id = ?").bind(companyId).all().catch(() => ({ results: [] })),
      c.env.DB.prepare("SELECT key, value FROM system_settings").all().catch(() => ({ results: [] }))
    ]);
    const settingsMap = {};
    (sysSettingsRes?.results || []).forEach((r) => {
      settingsMap[r.key] = r.value;
    });
    (tenantSettingsRes?.results || []).forEach((r) => {
      settingsMap[r.key] = r.value;
    });
    const compName = tenantComp?.company_name || settingsMap.company_name || (companyId === "comp_1" ? "OMNI ASSETS & LOGISTICS" : "Doanh Nghi\u1EC7p");
    const workStart = settingsMap.work_start_time || "08:30";
    const workEnd = settingsMap.work_end_time || "17:30";
    const graceMin = settingsMap.late_grace_minutes || "15";
    const workDays = settingsMap.work_days || "Th\u1EE9 2 - Th\u1EE9 6";
    const geminiApiKey = (settingsMap.gemini_api_key || c.env?.GEMINI_API_KEY || "").trim();
    const geminiModel = (settingsMap.gemini_model || c.env?.GEMINI_MODEL || "gemini-flash-latest").trim();
    const nowVN = /* @__PURE__ */ new Date();
    const currentDateStr = nowVN.toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Ho_Chi_Minh" });
    const currentTimeStr = nowVN.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });
    const systemPrompt = `B\u1EA1n l\xE0 Tr\u1EE3 l\xFD AI th\xF4ng minh, linh ho\u1EA1t, th\xE2n thi\u1EC7n v\xE0 am hi\u1EC3u s\xE2u s\u1EAFc c\u1EE7a h\u1EC7 th\u1ED1ng qu\u1EA3n l\xFD doanh nghi\u1EC7p ${compName}.
Nhi\u1EC7m v\u1EE5 c\u1EE7a b\u1EA1n l\xE0 t\u01B0 v\u1EA5n, gi\u1EA3i \u0111\xE1p m\u1ECDi th\u1EAFc m\u1EAFc v\xE0 h\u01B0\u1EDBng d\u1EABn ng\u01B0\u1EDDi d\xF9ng x\u1EED l\xFD c\xF4ng vi\u1EC7c hi\u1EC7u qu\u1EA3 tr\xEAn trang web n\xE0y.

B\u1ED1i c\u1EA3nh th\u1EDDi gian & h\u1EC7 th\u1ED1ng th\u1EF1c t\u1EBF c\u1EE7a doanh nghi\u1EC7p ${compName}:
- Th\u1EDDi gian hi\u1EC7n t\u1EA1i: ${currentTimeStr}, ${currentDateStr} (Gi\u1EDD Vi\u1EC7t Nam GMT+7).
- T\xEAn doanh nghi\u1EC7p: ${compName}
- Ng\u01B0\u1EDDi \u0111ang tr\xF2 chuy\u1EC7n: ${userName || "Nh\xE2n s\u1EF1"} (Vai tr\xF2 h\u1EC7 th\u1ED1ng: ${userRole || "STAFF"})
- Tab ng\u01B0\u1EDDi d\xF9ng \u0111ang \u0111\u1EE9ng: '${activeTab || "dashboard"}'
- Quy \u0111\u1ECBnh gi\u1EDD l\xE0m vi\u1EC7c: V\xE0o ca l\xFAc ${workStart}, Tan ca l\xFAc ${workEnd}, \xC2n h\u1EA1n \u0111i mu\u1ED9n ${graceMin} ph\xFAt, L\u1ECBch l\xE0m vi\u1EC7c ${workDays}.
- T\xE0i s\u1EA3n c\u1EE7a c\xF4ng ty: \u0110ang qu\u1EA3n l\xFD ${assetsCount?.count || 0} t\xE0i s\u1EA3n (${assetsCount?.maint_count || 0} thi\u1EBFt b\u1ECB \u0111ang b\u1EA3o tr\xEC).
- C\xF4ng vi\u1EC7c c\u1EE7a c\xF4ng ty: C\xF3 ${tasksRes?.results?.length || 0} c\xF4ng vi\u1EC7c \u0111ang theo d\xF5i trong h\u1EC7 th\u1ED1ng.
- C\xE1c ph\xE2n h\u1EC7 tr\xEAn trang web:
  1. 'dashboard' (T\u1ED5ng quan): B\u1EA3ng \u0111i\u1EC1u khi\u1EC3n t\xE0i s\u1EA3n, thu chi, c\u1EA3nh b\xE1o nh\u1EAFc h\u1EA1n c\u1EE7a doanh nghi\u1EC7p.
  2. 'assets' (T\xE0i s\u1EA3n & Thi\u1EBFt b\u1ECB): Qu\u1EA3n l\xFD m\xE1y m\xF3c, c\u1EA5p ph\xE1t, b\u1EA3o tr\xEC, serial thi\u1EBFt b\u1ECB.
  3. 'finance' (Doanh thu & Chi ph\xED): D\xF2ng ti\u1EC1n thu chi, l\u1EE3i nhu\u1EADn r\xF2ng.
  4. 'tasks' (C\xF4ng vi\u1EC7c & Ph\xE2n c\xF4ng): Giao vi\u1EC7c theo ph\xF2ng ban, h\u1EA1n ch\xF3t, nh\u1EAFc h\u1EA1n t\u1EF1 \u0111\u1ED9ng 06:00 s\xE1ng.
  5. 'contracts' (H\u1EE3p \u0111\u1ED3ng & Bi\xEAn b\u1EA3n): H\u1EE3p \u0111\u1ED3ng \u0111\u1ED1i t\xE1c, L\u1EADp & In Bi\xEAn b\u1EA3n b\xE0n giao chu\u1EA9n A4.
  6. 'attendance' (Ch\u1EA5m c\xF4ng): Check-in, Check-out 1 l\u1EA7n/ng\xE0y, t\xEDnh gi\u1EDD l\xE0m, ph\u1EA1t \u0111i mu\u1ED9n.
  7. 'users' (Qu\u1EA3n l\xFD Nh\xE2n s\u1EF1 & Ph\xF2ng ban): Danh s\xE1ch nh\xE2n vi\xEAn, g\xE1n ph\xF2ng ban, ph\xE2n quy\u1EC1n (ADMIN, MANAGER, STAFF).
  8. 'categories' (Qu\u1EA3n l\xFD Danh m\u1EE5c): Qu\u1EA3n l\xFD danh m\u1EE5c ph\xF2ng ban doanh nghi\u1EC7p, lo\u1EA1i t\xE0i s\u1EA3n, thu chi.
  9. 'settings' (C\xE0i \u0111\u1EB7t h\u1EC7 th\u1ED1ng): Gi\u1EDD l\xE0m vi\u1EC7c, \xE2n h\u1EA1n \u0111i mu\u1ED9n, hotline, th\xF4ng tin doanh nghi\u1EC7p.

Phong c\xE1ch ph\u1EA3n h\u1ED3i c\u1EE7a AI:
- B\u1EA1n l\xE0 tr\xED tu\u1EC7 nh\xE2n t\u1EA1o th\u1EF1c s\u1EF1 c\u1EE7a ${compName}, t\u01B0 duy s\u1EAFc s\u1EA3o, t\u1EF1 nhi\xEAn, hi\u1EC3u ng\u1EEF c\u1EA3nh v\xE0 tr\u1EA3 l\u1EDDi tr\u1EF1c ti\u1EBFp v\xE0o tr\u1ECDng t\xE2m c\xE2u h\u1ECFi.
- TUY\u1EC6T \u0110\u1ED0I KH\xD4NG d\xF9ng v\u0103n m\u1EABu c\u1ED1 \u0111\u1ECBnh, kh\xF4ng l\u1EB7p l\u1EA1i nguy\xEAn si t\xE0i li\u1EC7u h\u01B0\u1EDBng d\u1EABn n\u1EBFu ng\u01B0\u1EDDi d\xF9ng ch\u1EC9 h\u1ECFi ng\u1EAFn g\u1ECDn ho\u1EB7c h\u1ECFi chuy\u1EC7n \u0111\u1EDDi th\u01B0\u1EDDng, ki\u1EBFn th\u1EE9c, t\xEDnh to\xE1n.
- Tr\u1EA3 l\u1EDDi b\u1EB1ng ti\u1EBFng Vi\u1EC7t v\u0103n minh, tr\xECnh b\xE0y m\u1EA1ch l\u1EA1c, s\u1EED d\u1EE5ng g\u1EA1ch \u0111\u1EA7u d\xF2ng (\u2022) v\xE0 in \u0111\u1EADm (**t\u1EEB kh\xF3a**) gi\xFAp ng\u01B0\u1EDDi d\xF9ng d\u1EC5 theo d\xF5i.
- N\u1EBFu ng\u01B0\u1EDDi d\xF9ng c\u1EA7n h\u01B0\u1EDBng d\u1EABn thao t\xE1c tr\xEAn web, h\xE3y ch\u1EC9 r\xF5 t\xEAn menu/n\xFAt b\u1EA5m c\u1EE5 th\u1EC3.
- N\u1EBFu ng\u01B0\u1EDDi d\xF9ng ch\xE0o h\u1ECFi ho\u1EB7c h\u1ECFi b\u1EA5t c\u1EE9 \u0111i\u1EC1u g\xEC (ng\xE0y gi\u1EDD, qu\u1EA3n tr\u1ECB kinh doanh, k\u1EF9 thu\u1EADt, excel, cu\u1ED9c s\u1ED1ng), h\xE3y tr\u1EA3 l\u1EDDi th\xF4ng minh, d\xED d\u1ECFm v\xE0 h\u1EEFu \xEDch.`;
    let answer = "";
    let suggestions = [];
    let navigateTab = null;
    if (q.includes("ch\u1EA5m c\xF4ng") || q.includes("\u0111i\u1EC3m danh") || q.includes("check-in") || q.includes("checkin") || q.includes("mu\u1ED9n")) {
      navigateTab = "attendance";
      suggestions = ["Xem b\u1EA3ng ch\u1EA5m c\xF4ng", "C\xE0i \u0111\u1EB7t l\u1EA1i gi\u1EDD ca l\xE0m vi\u1EC7c", "Quy \u0111\u1ECBnh l\xE0m th\xEAm gi\u1EDD (OT)"];
    } else if (q.includes("t\xE0i s\u1EA3n") || q.includes("thi\u1EBFt b\u1ECB") || q.includes("m\xE1y t\xEDnh") || q.includes("laptop")) {
      navigateTab = "assets";
      suggestions = ["M\u1EDF Qu\u1EA3n l\xFD t\xE0i s\u1EA3n", "H\u01B0\u1EDBng d\u1EABn t\u1EA1o bi\xEAn b\u1EA3n b\xE0n giao", "L\u1EADp k\u1EBF ho\u1EA1ch b\u1EA3o tr\xEC"];
    } else if (q.includes("bi\xEAn b\u1EA3n") || q.includes("b\xE0n giao") || q.includes("in a4") || q.includes("h\u1EE3p \u0111\u1ED3ng")) {
      navigateTab = "contracts";
      suggestions = ["M\u1EDF H\u1EE3p \u0111\u1ED3ng & Bi\xEAn b\u1EA3n", "Xem danh s\xE1ch bi\xEAn b\u1EA3n", "Quy \u0111\u1ECBnh thu h\u1ED3i t\xE0i s\u1EA3n"];
    } else if (q.includes("doanh thu") || q.includes("chi ph\xED") || q.includes("t\xE0i ch\xEDnh") || q.includes("ti\u1EC1n")) {
      navigateTab = "finance";
      suggestions = ["Xem B\xE1o c\xE1o t\xE0i ch\xEDnh", "Th\xEAm kho\u1EA3n thu m\u1EDBi", "Th\xEAm chi ph\xED ph\xE1t sinh"];
    } else if (q.includes("c\xF4ng vi\u1EC7c") || q.includes("task") || q.includes("qu\xE1 h\u1EA1n") || q.includes("deadline")) {
      navigateTab = "tasks";
      suggestions = ["Xem danh s\xE1ch c\xF4ng vi\u1EC7c", "T\u1EA1o c\xF4ng vi\u1EC7c m\u1EDBi", "L\u1ECDc vi\u1EC7c theo ph\xF2ng ban"];
    } else if (q.includes("ph\xF2ng ban") || q.includes("b\u1ED9 ph\u1EADn") || q.includes("department")) {
      navigateTab = "categories";
      suggestions = ["Xem Danh m\u1EE5c ph\xF2ng ban", "Ph\xE2n c\xF4ng vi\u1EC7c theo ph\xF2ng ban", "Danh s\xE1ch nh\xE2n s\u1EF1 ph\xF2ng ban"];
    } else if (q.includes("ph\xE2n quy\u1EC1n") || q.includes("vai tr\xF2") || q.includes("role") || q.includes("nh\xE2n s\u1EF1") || q.includes("nh\xE2n vi\xEAn")) {
      navigateTab = "users";
      suggestions = ["M\u1EDF Qu\u1EA3n l\xFD nh\xE2n s\u1EF1", "Th\xEAm nh\xE2n vi\xEAn m\u1EDBi", "G\u1EAFn nh\xE2n vi\xEAn v\xE0o ph\xF2ng ban"];
    } else if (q.includes("c\xE0i \u0111\u1EB7t") || q.includes("setting") || q.includes("\u0111\u1ED5i gi\u1EDD") || q.includes("c\xF4ng ty")) {
      navigateTab = "settings";
      suggestions = ["M\u1EDF C\xE0i \u0111\u1EB7t h\u1EC7 th\u1ED1ng", "Quy \u0111\u1ECBnh gi\u1EDD ch\u1EA5m c\xF4ng", "\u0110\u1ED5i th\xF4ng tin c\xF4ng ty"];
    } else {
      suggestions = ["Quy \u0111\u1ECBnh gi\u1EDD ch\u1EA5m c\xF4ng", "C\xE1ch xu\u1EA5t bi\xEAn b\u1EA3n b\xE0n giao A4", "Giao vi\u1EC7c cho ph\xF2ng ban", "H\u01B0\u1EDBng d\u1EABn qu\u1EA3n l\xFD t\xE0i s\u1EA3n"];
    }
    let debugInfo = { keyLen: geminiApiKey.length, model: geminiModel };
    if (geminiApiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
        debugInfo.url = geminiUrl.replace(geminiApiKey, "KEY_MASKED");
        const geminiReq = await fetch(geminiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": geminiApiKey
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: `${systemPrompt}

---
Ng\u01B0\u1EDDi d\xF9ng h\u1ECFi: "${message}"` }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 3072,
              thinkingConfig: {
                thinkingBudget: 0
              }
            }
          })
        });
        debugInfo.status = geminiReq.status;
        debugInfo.statusText = geminiReq.statusText;
        if (geminiReq.ok) {
          const geminiData = await geminiReq.json();
          const candidate = geminiData.candidates?.[0];
          debugInfo.candidate = candidate;
          const parts = candidate?.content?.parts || [];
          const textParts = parts.filter((p) => typeof p.text === "string" && !p.thought).map((p) => p.text);
          const fullText = textParts.length > 0 ? textParts.join("\n\n") : parts.map((p) => p.text).filter(Boolean).join("\n\n");
          if (fullText && fullText.trim()) {
            answer = fullText.trim();
          }
        } else {
          const errText = await geminiReq.text();
          debugInfo.errText = errText;
          console.error(`Gemini API call failed with status ${geminiReq.status}:`, errText);
        }
      } catch (geminiError) {
        debugInfo.exception = geminiError?.message || String(geminiError);
        console.error("Gemini API fetch error:", geminiError);
      }
    }
    const needClientGemini = !answer;
    if (!answer) {
      answer = `Xin ch\xE0o ${userName || "b\u1EA1n"}! T\xF4i l\xE0 **OMNI-Bot** (Tr\u1EE3 l\xFD AI t\xEDch h\u1EE3p Google Gemini). 

Hi\u1EC7n t\u1EA1i k\u1EBFt n\u1ED1i m\u1EA1ng \u0111\u1EBFn m\xE1y ch\u1EE7 AI c\u1EE7a Google \u0111ang b\u1ECB gi\xE1n \u0111o\u1EA1n ho\u1EB7c ph\u1EA3n h\u1ED3i ch\u1EADm. B\u1EA1n vui l\xF2ng th\u1EED \u0111\u1EB7t l\u1EA1i c\xE2u h\u1ECFi sau v\xE0i gi\xE2y, ho\u1EB7c ch\u1ECDn nhanh c\xE1c ch\u1EE7 \u0111\u1EC1 b\xEAn d\u01B0\u1EDBi \u0111\u1EC3 t\xF4i h\u1ED7 tr\u1EE3 nh\xE9!`;
    }
    return c.json({
      success: true,
      debug: debugInfo,
      data: {
        reply: answer,
        needClientGemini,
        geminiApiKey,
        geminiModel,
        candidateModels: ["gemini-flash-latest", "gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.1-flash-lite"],
        systemPrompt,
        message,
        suggestions,
        navigateTab
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.get("/api/cloudflare/status", (c) => {
  return c.json({
    success: true,
    data: {
      isConfigured: true,
      databaseMode: "Cloudflare D1 Production (Native Binding)",
      databaseId: "company_assets_db"
    }
  });
});
async function refreshDailyReminders(db) {
  try {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(/* @__PURE__ */ new Date());
    await db.prepare(`
      UPDATE tasks 
      SET urgency = 'OVERDUE' 
      WHERE due_date < ? AND status != 'COMPLETED'
    `).bind(today).run();
    await db.prepare(`
      UPDATE tasks 
      SET urgency = 'TODAY' 
      WHERE due_date = ? AND status != 'COMPLETED'
    `).bind(today).run();
    const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
    await db.prepare(`
      UPDATE tasks 
      SET urgency = 'UPCOMING' 
      WHERE due_date > ? AND due_date <= ? AND status != 'COMPLETED'
    `).bind(today, in3Days).run();
    await db.prepare(`
      UPDATE tasks 
      SET urgency = 'NORMAL' 
      WHERE due_date > ? AND status != 'COMPLETED'
    `).bind(in3Days).run();
    await db.prepare(`
      UPDATE contracts 
      SET status = 'EXPIRED' 
      WHERE end_date < ? AND status = 'ACTIVE'
    `).bind(today).run();
    const nowVN = new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      dateStyle: "short",
      timeStyle: "medium"
    }).format(/* @__PURE__ */ new Date());
    await db.prepare(`
      INSERT INTO system_settings (key, value, category, description, updated_at)
      VALUES ('last_daily_refresh', ?, 'SYSTEM', 'Th\u1EDDi \u0111i\u1EC3m l\xE0m m\u1EDBi h\u1EC7 th\u1ED1ng nh\u1EAFc h\u1EA1n t\u1EF1 \u0111\u1ED9ng (06:00 AM)', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).bind(nowVN, (/* @__PURE__ */ new Date()).toISOString()).run();
    console.log(`[06:00 AM Cron Trigger] \u0110\xE3 l\xE0m m\u1EDBi nh\u1EAFc h\u1EA1n h\u1EC7 th\u1ED1ng th\xE0nh c\xF4ng l\xFAc ${nowVN}`);
    try {
      const companies = await db.prepare("SELECT id, company_name, admin_email FROM company_tenants").all().catch(() => ({ results: [] }));
      for (const comp of companies.results || []) {
        const mailConfig = await getEmailConfig(db, comp.id);
        if (mailConfig.notifyReminders) {
          let reportEmails = [];
          if (mailConfig.reportRecipients) {
            reportEmails = mailConfig.reportRecipients.split(/[,;\n]/).map((e) => e.trim().toLowerCase()).filter((e) => e && e.includes("@"));
          }
          if (reportEmails.length === 0 && comp.admin_email && comp.admin_email.includes("@")) {
            reportEmails = [comp.admin_email.trim().toLowerCase()];
          }
          if (reportEmails.length === 0) continue;
          const [overdueTasks, upcomingContracts, expiredContracts] = await Promise.all([
            db.prepare("SELECT title, assignee, due_date FROM tasks WHERE company_id = ? AND status != 'COMPLETED' AND due_date < ? ORDER BY due_date ASC LIMIT 10").bind(comp.id, today).all().catch(() => ({ results: [] })),
            db.prepare("SELECT contract_number, partner_name, end_date FROM contracts WHERE company_id = ? AND status = 'ACTIVE' AND end_date <= date('now', '+30 day') ORDER BY end_date ASC LIMIT 10").bind(comp.id).all().catch(() => ({ results: [] })),
            db.prepare("SELECT contract_number, partner_name, end_date FROM contracts WHERE company_id = ? AND status = 'EXPIRED' ORDER BY end_date DESC LIMIT 10").bind(comp.id).all().catch(() => ({ results: [] }))
          ]);
          const hasAlerts = overdueTasks.results?.length > 0 || upcomingContracts.results?.length > 0 || expiredContracts.results?.length > 0;
          if (hasAlerts) {
            const mailHtml = getDailyRemindersEmailHtml({
              companyName: comp.company_name,
              date: today,
              overdueTasks: overdueTasks.results || [],
              upcomingContracts: upcomingContracts.results || [],
              expiredContracts: expiredContracts.results || [],
              dashboardUrl: "https://company-sheet.hieupham101097.workers.dev"
            });
            for (const recipient of reportEmails) {
              await sendEmail({
                db,
                companyId: comp.id,
                senderType: "reports",
                to: recipient,
                subject: `[06:00 AM] B\xE1o c\xE1o nh\u1EAFc vi\u1EC7c & H\u1EE3p \u0111\u1ED3ng \u0111\u1EBFn h\u1EA1n - ${comp.company_name}`,
                html: mailHtml
              }).catch((e) => console.error("[Reminder Mail Error]", comp.company_name, recipient, e.message));
            }
          }
        }
      }
    } catch (mailCronErr) {
      console.error("[Reminder Mail Cron Error]", mailCronErr.message);
    }
    return { success: true, refreshed_at: nowVN, today };
  } catch (err) {
    console.error("[06:00 AM Cron Error]", err);
    return { success: false, error: err.message };
  }
}
__name(refreshDailyReminders, "refreshDailyReminders");
app.get("/api/super-admin/overview", async (c) => {
  try {
    const totalCompanies = await c.env.DB.prepare("SELECT count(*) as count FROM company_tenants").first("count") || 0;
    const activeCompanies = await c.env.DB.prepare("SELECT count(*) as count FROM company_tenants WHERE license_status = 'ACTIVE'").first("count") || 0;
    const trialCompanies = await c.env.DB.prepare("SELECT count(*) as count FROM company_tenants WHERE plan_code = 'TRIAL_2M'").first("count") || 0;
    const expiredCompanies = await c.env.DB.prepare("SELECT count(*) as count FROM company_tenants WHERE license_status = 'EXPIRED'").first("count") || 0;
    const lockedCompanies = await c.env.DB.prepare("SELECT count(*) as count FROM company_tenants WHERE license_status = 'LOCKED'").first("count") || 0;
    const totalUsers = await c.env.DB.prepare("SELECT count(*) as count FROM users WHERE role != 'SUPER_ADMIN'").first("count") || 0;
    const totalKeys = await c.env.DB.prepare("SELECT count(*) as count FROM license_keys").first("count") || 0;
    const activeKeys = await c.env.DB.prepare("SELECT count(*) as count FROM license_keys WHERE status = 'ACTIVE'").first("count") || 0;
    const usedKeys = await c.env.DB.prepare("SELECT count(*) as count FROM license_keys WHERE status = 'USED'").first("count") || 0;
    const totalRevenueRes = await c.env.DB.prepare("SELECT sum(amount) as total FROM license_orders WHERE payment_status IN ('PAID', 'COMPLETED')").first("total") || 0;
    const totalOrders = await c.env.DB.prepare("SELECT count(*) as count FROM license_orders").first("count") || 0;
    const pendingOrdersCount = await c.env.DB.prepare("SELECT count(*) as count FROM license_orders WHERE payment_status = 'PENDING'").first("count") || 0;
    const planStats = await c.env.DB.prepare(`
      SELECT plan_code, count(*) as count, sum(revenue) as plan_revenue 
      FROM company_tenants 
      GROUP BY plan_code
    `).all();
    const recentOrders = await c.env.DB.prepare(`
      SELECT * FROM license_orders 
      ORDER BY created_at DESC 
      LIMIT 8
    `).all();
    const recentCompanies = await c.env.DB.prepare(`
      SELECT c.*, (SELECT count(*) FROM users u WHERE u.company_id = c.id) as user_count
      FROM company_tenants c 
      ORDER BY c.created_at DESC 
      LIMIT 6
    `).all();
    return c.json({
      success: true,
      data: {
        stats: {
          totalCompanies: Number(totalCompanies),
          activeCompanies: Number(activeCompanies),
          trialCompanies: Number(trialCompanies),
          expiredCompanies: Number(expiredCompanies),
          lockedCompanies: Number(lockedCompanies),
          totalUsers: Number(totalUsers),
          totalKeys: Number(totalKeys),
          activeKeys: Number(activeKeys),
          usedKeys: Number(usedKeys),
          totalRevenue: Number(totalRevenueRes),
          totalOrders: Number(totalOrders),
          pendingOrdersCount: Number(pendingOrdersCount)
        },
        planDistribution: planStats.results || [],
        recentOrders: recentOrders.results || [],
        recentCompanies: recentCompanies.results || []
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.get("/api/super-admin/companies", async (c) => {
  try {
    const list = await c.env.DB.prepare(`
      SELECT c.*, 
             (SELECT count(*) FROM users u WHERE u.company_id = c.id) as user_count,
             (SELECT count(*) FROM assets a WHERE a.company_id = c.id) as asset_count,
             (SELECT count(*) FROM contracts ctr WHERE ctr.company_id = c.id) as contract_count
      FROM company_tenants c 
      ORDER BY c.created_at DESC
    `).all();
    return c.json({
      success: true,
      data: list.results || []
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.get("/api/super-admin/companies/:id/users", async (c) => {
  try {
    const id = c.req.param("id");
    const users = await c.env.DB.prepare(`
      SELECT id, name, email, role, department, phone, status, created_at
      FROM users
      WHERE company_id = ?
      ORDER BY created_at DESC
    `).bind(id).all();
    return c.json({
      success: true,
      data: users.results || []
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.get("/api/super-admin/keys", async (c) => {
  try {
    const keys = await c.env.DB.prepare(`
      SELECT * FROM license_keys 
      ORDER BY created_at DESC
    `).all();
    return c.json({ success: true, data: keys.results || [] });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.post("/api/super-admin/keys", async (c) => {
  try {
    const body = await c.req.json();
    let {
      license_key,
      plan_code = "ANNUAL_1Y",
      plan_name,
      company_id = null,
      company_name = null,
      duration_months = 12,
      price = 0,
      notes = ""
    } = body;
    if (!license_key || !license_key.trim()) {
      const randSegment = /* @__PURE__ */ __name(() => Math.random().toString(36).substring(2, 6).toUpperCase(), "randSegment");
      license_key = `OMNI-ENT-${randSegment()}-${randSegment()}-${randSegment()}`;
    } else {
      license_key = license_key.trim().toUpperCase();
    }
    if (!plan_name) {
      if (plan_code === "LIFETIME") plan_name = "G\xF3i V\u0129nh Vi\u1EC5n Tr\u1ECDn \u0110\u1EDDi";
      else if (plan_code === "ANNUAL_1Y") plan_name = "G\xF3i Ti\xEAu Chu\u1EA9n 1 N\u0103m";
      else if (plan_code === "TRIAL_2M") plan_name = "G\xF3i D\xF9ng Th\u1EED 2 Th\xE1ng";
      else plan_name = `G\xF3i C\u01B0\u1EDBc ${plan_code}`;
    }
    const id = `key_${Date.now()}_${Math.floor(Math.random() * 1e3)}`;
    await c.env.DB.prepare(`
      INSERT INTO license_keys (id, license_key, plan_code, plan_name, company_id, company_name, duration_months, price, status, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, datetime('now'))
    `).bind(
      id,
      license_key,
      plan_code,
      plan_name,
      company_id || null,
      company_name || null,
      Number(duration_months) || 12,
      Number(price) || 0,
      notes || ""
    ).run();
    return c.json({
      success: true,
      message: "T\u1EA1o m\xE3 b\u1EA3n quy\u1EC1n (License Key) th\xE0nh c\xF4ng!",
      data: { id, license_key, plan_code, plan_name, price }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.put("/api/super-admin/keys/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { status, notes, company_id, company_name } = await c.req.json();
    await c.env.DB.prepare(`
      UPDATE license_keys 
      SET status = COALESCE(?, status), 
          notes = COALESCE(?, notes),
          company_id = COALESCE(?, company_id),
          company_name = COALESCE(?, company_name)
      WHERE id = ?
    `).bind(status || null, notes || null, company_id || null, company_name || null, id).run();
    return c.json({ success: true, message: "C\u1EADp nh\u1EADt th\xF4ng tin Key th\xE0nh c\xF4ng!" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.delete("/api/super-admin/keys/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await c.env.DB.prepare("DELETE FROM license_keys WHERE id = ?").bind(id).run();
    return c.json({ success: true, message: "X\xF3a m\xE3 Key th\xE0nh c\xF4ng!" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.post("/api/super-admin/companies", async (c) => {
  try {
    const body = await c.req.json();
    const {
      company_name,
      tax_id,
      admin_name,
      admin_email,
      admin_phone,
      plan_code = "TRIAL_2M",
      license_status = "ACTIVE",
      start_date,
      expire_date,
      revenue = 0,
      notes = ""
    } = body;
    if (!company_name?.trim()) {
      return c.json({ success: false, message: "Vui l\xF2ng nh\u1EADp t\xEAn c\xF4ng ty / doanh nghi\u1EC7p" }, 400);
    }
    const companyId = `comp_${Date.now()}`;
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const startDateVal = start_date || today;
    let expireDateVal = expire_date;
    if (!expireDateVal) {
      const plan = await c.env.DB.prepare("SELECT duration_months FROM pricing_plans WHERE code = ?").bind(plan_code).first();
      const months = plan ? plan.duration_months : 2;
      const d = new Date(startDateVal);
      d.setMonth(d.getMonth() + months);
      expireDateVal = d.toISOString().slice(0, 10);
    }
    await c.env.DB.prepare(`
      INSERT INTO company_tenants (id, company_name, tax_id, admin_name, admin_email, admin_phone, plan_code, license_status, start_date, expire_date, revenue, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      companyId,
      company_name.trim(),
      tax_id ? tax_id.trim() : null,
      admin_name ? admin_name.trim() : null,
      admin_email ? admin_email.trim() : null,
      admin_phone ? admin_phone.trim() : null,
      plan_code,
      license_status,
      startDateVal,
      expireDateVal,
      Number(revenue) || 0,
      notes ? notes.trim() : ""
    ).run();
    if (Number(revenue) > 0) {
      const orderId = `ord_${Date.now()}`;
      await c.env.DB.prepare(`
        INSERT INTO license_orders (id, company_id, company_name, plan_code, plan_name, amount, payment_status, order_date, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'PAID', ?, ?, datetime('now'))
      `).bind(
        orderId,
        companyId,
        company_name.trim(),
        plan_code,
        plan_code,
        Number(revenue),
        startDateVal,
        "Kh\u1EDFi t\u1EA1o \u0111\u01A1n h\xE0ng t\u1EEB c\u1ED5ng Qu\u1EA3n tr\u1ECB T\u1ED5ng"
      ).run();
    }
    if (admin_email && admin_email.trim()) {
      const emailClean = admin_email.trim().toLowerCase();
      const existingUser = await c.env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(emailClean).first();
      if (!existingUser) {
        const userId = `usr_${Date.now()}`;
        await c.env.DB.prepare(`
          INSERT INTO users (id, company_id, name, email, password, role, status, phone, created_at)
          VALUES (?, ?, ?, ?, ?, 'ADMIN', 'ACTIVE', ?, datetime('now'))
        `).bind(
          userId,
          companyId,
          admin_name ? admin_name.trim() : "Qu\u1EA3n Tr\u1ECB Vi\xEAn",
          emailClean,
          "123456",
          admin_phone ? admin_phone.trim() : null
        ).run();
      }
    }
    return c.json({
      success: true,
      message: "Th\xEAm doanh nghi\u1EC7p th\xE0nh c\xF4ng!",
      data: { id: companyId }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.put("/api/super-admin/companies/:id/license", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const {
      plan_code,
      license_status,
      expire_date,
      add_revenue = 0,
      notes
    } = body;
    const existing = await c.env.DB.prepare("SELECT * FROM company_tenants WHERE id = ?").bind(id).first();
    if (!existing) {
      return c.json({ success: false, message: "Kh\xF4ng t\xECm th\u1EA5y doanh nghi\u1EC7p" }, 404);
    }
    const newPlan = plan_code || existing.plan_code;
    const newStatus = license_status || existing.license_status;
    const newExpire = expire_date || existing.expire_date;
    const newNotes = notes !== void 0 ? notes : existing.notes;
    const newRevenue = Number(existing.revenue || 0) + Number(add_revenue || 0);
    await c.env.DB.prepare(`
      UPDATE company_tenants 
      SET plan_code = ?, license_status = ?, expire_date = ?, revenue = ?, notes = ?
      WHERE id = ?
    `).bind(
      newPlan,
      newStatus,
      newExpire,
      newRevenue,
      newNotes,
      id
    ).run();
    if (Number(add_revenue) > 0) {
      const orderId = `ord_${Date.now()}`;
      const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      await c.env.DB.prepare(`
        INSERT INTO license_orders (id, company_id, company_name, plan_code, plan_name, amount, payment_status, order_date, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'PAID', ?, ?, datetime('now'))
      `).bind(
        orderId,
        existing.id,
        existing.company_name,
        newPlan,
        newPlan,
        Number(add_revenue),
        today,
        `Gia h\u1EA1n / N\xE2ng c\u1EA5p g\xF3i: ${newPlan}`
      ).run();
    }
    return c.json({
      success: true,
      message: "C\u1EADp nh\u1EADt b\u1EA3n quy\u1EC1n doanh nghi\u1EC7p th\xE0nh c\xF4ng!"
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.delete("/api/super-admin/companies/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await c.env.DB.batch([
      c.env.DB.prepare("DELETE FROM assets WHERE company_id = ?").bind(id),
      c.env.DB.prepare("DELETE FROM contracts WHERE company_id = ?").bind(id),
      c.env.DB.prepare("DELETE FROM handover_protocols WHERE company_id = ?").bind(id),
      c.env.DB.prepare("DELETE FROM finance WHERE company_id = ?").bind(id),
      c.env.DB.prepare("DELETE FROM tasks WHERE company_id = ?").bind(id),
      c.env.DB.prepare("DELETE FROM attendance WHERE company_id = ?").bind(id),
      c.env.DB.prepare("DELETE FROM categories WHERE company_id = ?").bind(id),
      c.env.DB.prepare("DELETE FROM users WHERE company_id = ?").bind(id),
      c.env.DB.prepare("DELETE FROM license_orders WHERE company_id = ?").bind(id),
      c.env.DB.prepare("DELETE FROM company_tenants WHERE id = ?").bind(id)
    ]);
    return c.json({ success: true, message: "X\xF3a doanh nghi\u1EC7p v\xE0 d\u1EEF li\u1EC7u li\xEAn quan th\xE0nh c\xF4ng!" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
async function initPricingPlansTable(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS pricing_plans (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        duration_months INTEGER DEFAULT 1,
        price REAL DEFAULT 0,
        features TEXT,
        badge TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {
    });
    const trialPlan = await db.prepare('SELECT id FROM pricing_plans WHERE code = "TRIAL_2M"').first().catch(() => null);
    if (!trialPlan) {
      await db.prepare(`
        INSERT OR IGNORE INTO pricing_plans (id, code, name, duration_months, price, features, badge, is_active, created_at)
        VALUES ('plan_trial_2m', 'TRIAL_2M', 'G\xF3i D\xF9ng Th\u1EED 2 Th\xE1ng (60 Ng\xE0y)', 2, 0, ?, 'D\xF9ng Th\u1EED 0\u0111 (H\u1EA1n Ch\u1EBF Quy\u1EC1n)', 1, datetime('now'))
      `).bind(JSON.stringify([
        "Tr\u1EA3i nghi\u1EC7m d\xF9ng th\u1EED to\xE0n di\u1EC7n 60 ng\xE0y",
        "Gi\u1EDBi h\u1EA1n t\u1ED1i \u0111a 20 t\xE0i s\u1EA3n thi\u1EBFt b\u1ECB",
        "Gi\u1EDBi h\u1EA1n t\u1ED1i \u0111a 3 t\xE0i kho\u1EA3n nh\xE2n s\u1EF1 (1 Qu\u1EA3n tr\u1ECB + 2 Nh\xE2n vi\xEAn)",
        "Gi\u1EDBi h\u1EA1n t\u1ED1i \u0111a 5 h\u1EE3p \u0111\u1ED3ng & 5 bi\xEAn b\u1EA3n b\xE0n giao",
        "C\u1ED1 \u0111\u1ECBnh 1 ph\xF2ng ban v\u1EADn h\xE0nh",
        "Xu\u1EA5t Excel c\u01A1 b\u1EA3n, in \u1EA5n c\xF3 watermark th\u1EED nghi\u1EC7m",
        "Kh\xF3a t\u1EF1 \u0111\u1ED9ng g\u1EEDi Email & Telegram"
      ])).run().catch(() => {
      });
    }
    const annual1y = await db.prepare('SELECT id FROM pricing_plans WHERE code = "ANNUAL_1Y"').first().catch(() => null);
    if (!annual1y) {
      await db.prepare(`
        INSERT OR IGNORE INTO pricing_plans (id, code, name, duration_months, price, features, badge, is_active, created_at)
        VALUES ('plan_annual_1y', 'ANNUAL_1Y', 'G\xF3i Ti\xEAu Chu\u1EA9n 1 N\u0103m', 12, 4800000, ?, 'Ph\u1ED5 bi\u1EBFn nh\u1EA5t', 1, datetime('now'))
      `).bind(JSON.stringify([
        "Kh\xF4ng gi\u1EDBi h\u1EA1n s\u1ED1 l\u01B0\u1EE3ng t\xE0i s\u1EA3n thi\u1EBFt b\u1ECB (Unlimited)",
        "Kh\xF4ng gi\u1EDBi h\u1EA1n t\xE0i kho\u1EA3n nh\xE2n vi\xEAn & to\xE0n b\u1ED9 ph\xF2ng ban",
        "Kh\xF4ng gi\u1EDBi h\u1EA1n h\u1EE3p \u0111\u1ED3ng & bi\xEAn b\u1EA3n b\xE0n giao",
        "In bi\xEAn b\u1EA3n A4 chu\u1EA9n \u0111\xF3ng m\u1ED9c d\u1EA5u s\u1EAFc n\xE9t, kh\xF4ng watermark",
        "Xu\u1EA5t d\u1EEF li\u1EC7u Excel / CSV to\xE0n di\u1EC7n",
        "T\u1EF1 \u0111\u1ED9ng g\u1EEDi email 6:00 AM & th\xF4ng b\xE1o giao vi\u1EC7c",
        "Tr\u1EE3 l\xFD AI OMNI-Bot Gemini 24/7",
        "L\u01B0u tr\u1EEF Cloudflare D1 \u0111\u1ED9 tin c\u1EADy cao"
      ])).run().catch(() => {
      });
    }
    const annual2y = await db.prepare('SELECT id FROM pricing_plans WHERE code = "ANNUAL_2Y"').first().catch(() => null);
    if (!annual2y) {
      await db.prepare(`
        INSERT OR IGNORE INTO pricing_plans (id, code, name, duration_months, price, features, badge, is_active, created_at)
        VALUES ('plan_annual_2y', 'ANNUAL_2Y', 'G\xF3i Ti\u1EBFt Ki\u1EC7m 2 N\u0103m', 24, 8800000, ?, 'Ti\u1EBFt ki\u1EC7m 800.000\u0111', 1, datetime('now'))
      `).bind(JSON.stringify([
        "To\xE0n b\u1ED9 \u0111\u1EB7c quy\u1EC1n c\u1EE7a g\xF3i 1 N\u0103m",
        "Th\u1EDDi h\u1EA1n s\u1EED d\u1EE5ng 24 th\xE1ng li\xEAn t\u1EE5c",
        "Ti\u1EBFt ki\u1EC7m 800.000\u0111 so v\u1EDBi gia h\u1EA1n t\u1EEBng n\u0103m",
        "\u01AFu ti\xEAn h\u1ED7 tr\u1EE3 k\u1EF9 thu\u1EADt v\xE0 sao l\u01B0u d\u1EEF li\u1EC7u ri\xEAng",
        "B\u1EA3o h\xE0nh & n\xE2ng c\u1EA5p t\xEDnh n\u0103ng t\u1EF1 \u0111\u1ED9ng mi\u1EC5n ph\xED"
      ])).run().catch(() => {
      });
    }
    const lifetime = await db.prepare('SELECT id FROM pricing_plans WHERE code = "LIFETIME"').first().catch(() => null);
    if (!lifetime) {
      await db.prepare(`
        INSERT OR IGNORE INTO pricing_plans (id, code, name, duration_months, price, features, badge, is_active, created_at)
        VALUES ('plan_lifetime', 'LIFETIME', 'G\xF3i V\u0129nh Vi\u1EC5n Tr\u1ECDn \u0110\u1EDDi', 999, 12500000, ?, 'Khuy\xEAn D\xF9ng \u2022 VIP', 1, datetime('now'))
      `).bind(JSON.stringify([
        "S\u1EDF h\u1EEFu v\u0129nh vi\u1EC5n tr\u1ECDn \u0111\u1EDDi (Lifetime License)",
        "Kh\xF4ng bao gi\u1EDD ph\xE1t sinh chi ph\xED duy tr\xEC h\xE0ng n\u0103m",
        "M\u1EDF kh\xF3a to\xE0n b\u1ED9 100% t\xEDnh n\u0103ng v\xE0 b\u1EA3n c\u1EADp nh\u1EADt m\u1EDBi",
        "K\xEAnh h\u1ED7 tr\u1EE3 VIP 1-1 ri\xEAng v\u1EDBi \u0111\u1ED9i ng\u0169 k\u1EF9 thu\u1EADt",
        "Xu\u1EA5t h\xF3a \u0111\u01A1n VAT \u0111i\u1EC7n t\u1EED doanh nghi\u1EC7p \u0111\u1EA7y \u0111\u1EE7"
      ])).run().catch(() => {
      });
    }
    await db.prepare(`

      UPDATE pricing_plans 
      SET name = 'G\xF3i D\xF9ng Th\u1EED 2 Th\xE1ng (Trial 60N)', badge = 'D\xF9ng Th\u1EED 0\u0111 (H\u1EA1n Ch\u1EBF Quy\u1EC1n)'
      WHERE code = 'TRIAL_2M' AND (name = 'Th\xE1ng' OR name = 'G\xF3i D\xF9ng Th\u1EED 2 Th\xE1ng')
    `).run().catch(() => {
    });
    await db.prepare(`
      UPDATE pricing_plans 
      SET name = 'G\xF3i Ti\xEAu Chu\u1EA9n 1 N\u0103m', badge = 'Ph\u1ED5 bi\u1EBFn nh\u1EA5t'
      WHERE code = 'ANNUAL_1Y' AND (name = 'N\u0103m' OR name = '1 N\u0103m')
    `).run().catch(() => {
    });
    await db.prepare(`
      UPDATE pricing_plans 
      SET name = 'G\xF3i Ti\u1EBFt Ki\u1EC7m 2 N\u0103m', badge = 'Ti\u1EBFt ki\u1EC7m 800.000\u0111'
      WHERE code = 'ANNUAL_2Y' AND (name = 'N\u0103m' OR name = '2 N\u0103m')
    `).run().catch(() => {
    });
    await db.prepare(`
      UPDATE pricing_plans 
      SET name = 'G\xF3i V\u0129nh Vi\u1EC5n Tr\u1ECDn \u0110\u1EDDi', badge = 'Khuy\xEAn D\xF9ng \u2022 VIP'
      WHERE code = 'LIFETIME' AND (name = 'V\u0129nh Vi\u1EC5n' OR name = 'Tr\u1ECDn \u0110\u1EDDi')
    `).run().catch(() => {
    });
  } catch (err) {
    console.error("Error initPricingPlansTable:", err);
  }
}
__name(initPricingPlansTable, "initPricingPlansTable");
app.get("/api/super-admin/plans", async (c) => {
  try {
    await initPricingPlansTable(c.env.DB);
    const plans = await c.env.DB.prepare("SELECT * FROM pricing_plans ORDER BY price ASC").all();
    return c.json({
      success: true,
      data: plans.results || []
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.post("/api/super-admin/plans", async (c) => {
  try {
    const body = await c.req.json();
    const {
      id,
      code,
      name,
      duration_months,
      price,
      features,
      badge,
      is_active = 1
    } = body;
    if (!code || !name) {
      return c.json({ success: false, message: "M\xE3 g\xF3i (Code) v\xE0 T\xEAn g\xF3i kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng" }, 400);
    }
    const featuresJson = typeof features === "string" ? features : JSON.stringify(features || []);
    const cleanCode = code.trim().toUpperCase();
    if (id) {
      await c.env.DB.prepare(`
        UPDATE pricing_plans 
        SET code = ?, name = ?, duration_months = ?, price = ?, features = ?, badge = ?, is_active = ?
        WHERE id = ?
      `).bind(
        cleanCode,
        name.trim(),
        Number(duration_months) || 1,
        Number(price) || 0,
        featuresJson,
        badge ? badge.trim() : null,
        is_active ? 1 : 0,
        id
      ).run();
      return c.json({ success: true, message: "C\u1EADp nh\u1EADt g\xF3i d\u1ECBch v\u1EE5 th\xE0nh c\xF4ng!" });
    } else {
      const planId = `plan_${cleanCode.toLowerCase()}_${Date.now()}`;
      await c.env.DB.prepare(`
        INSERT INTO pricing_plans (id, code, name, duration_months, price, features, badge, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        planId,
        cleanCode,
        name.trim(),
        Number(duration_months) || 1,
        Number(price) || 0,
        featuresJson,
        badge ? badge.trim() : null,
        is_active ? 1 : 0
      ).run();
      return c.json({ success: true, message: "Th\xEAm g\xF3i d\u1ECBch v\u1EE5 m\u1EDBi th\xE0nh c\xF4ng!", data: { id: planId } });
    }
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.delete("/api/super-admin/plans/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await c.env.DB.prepare("DELETE FROM pricing_plans WHERE id = ?").bind(id).run();
    return c.json({ success: true, message: "X\xF3a g\xF3i d\u1ECBch v\u1EE5 th\xE0nh c\xF4ng!" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.get("/api/super-admin/revenue-orders", async (c) => {
  try {
    const status = c.req.query("status");
    let query = "SELECT * FROM license_orders";
    const params = [];
    if (status) {
      query += " WHERE payment_status = ?";
      params.push(status);
    }
    query += " ORDER BY created_at DESC, order_date DESC";
    const orders = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({
      success: true,
      data: orders.results || []
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.post("/api/super-admin/orders", async (c) => {
  try {
    const body = await c.req.json();
    const {
      company_id,
      company_name,
      plan_code,
      plan_name,
      amount,
      payment_status = "PENDING",
      notes = ""
    } = body;
    if (!company_name || !plan_code) {
      return c.json({ success: false, message: "Thi\u1EBFu th\xF4ng tin c\xF4ng ty ho\u1EB7c m\xE3 g\xF3i" }, 400);
    }
    const orderId = `ord_${Date.now()}`;
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    await c.env.DB.prepare(`
      INSERT INTO license_orders (id, company_id, company_name, plan_code, plan_name, amount, payment_status, order_date, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      orderId,
      company_id || null,
      company_name.trim(),
      plan_code.trim(),
      plan_name ? plan_name.trim() : plan_code.trim(),
      Number(amount) || 0,
      payment_status,
      today,
      notes ? notes.trim() : ""
    ).run();
    if (payment_status === "PAID" && company_id) {
      await c.env.DB.prepare(`
        UPDATE company_tenants 
        SET revenue = COALESCE(revenue, 0) + ? 
        WHERE id = ?
      `).bind(Number(amount) || 0, company_id).run();
    }
    return c.json({ success: true, message: "T\u1EA1o \u0111\u01A1n h\xE0ng b\u1EA3n quy\u1EC1n th\xE0nh c\xF4ng!", data: { id: orderId } });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.put("/api/super-admin/orders/:id/approve", async (c) => {
  try {
    const orderId = c.req.param("id");
    const order2 = await c.env.DB.prepare("SELECT * FROM license_orders WHERE id = ?").bind(orderId).first();
    if (!order2) {
      return c.json({ success: false, message: "Kh\xF4ng t\xECm th\u1EA5y \u0111\u01A1n h\xE0ng" }, 404);
    }
    if (order2.payment_status === "PAID") {
      return c.json({ success: false, message: "\u0110\u01A1n h\xE0ng n\xE0y \u0111\xE3 \u0111\u01B0\u1EE3c duy\u1EC7t v\xE0 k\xEDch ho\u1EA1t tr\u01B0\u1EDBc \u0111\xF3." }, 400);
    }
    let tenant = null;
    if (order2.company_id && order2.company_id !== "comp_1") {
      tenant = await c.env.DB.prepare("SELECT * FROM company_tenants WHERE id = ?").bind(order2.company_id).first();
    }
    if (!tenant && order2.company_name) {
      tenant = await c.env.DB.prepare("SELECT * FROM company_tenants WHERE company_name LIKE ?").bind(`%${order2.company_name.trim()}%`).first();
    }
    if (!tenant) {
      const allTenants = await c.env.DB.prepare("SELECT * FROM company_tenants LIMIT 2").all();
      if (allTenants?.results?.length === 1) {
        tenant = allTenants.results[0];
      }
    }
    const plan = await c.env.DB.prepare("SELECT * FROM pricing_plans WHERE code = ?").bind(order2.plan_code).first().catch(() => null);
    let newExpireDate = null;
    if (order2.plan_code === "LIFETIME" || order2.plan_code === "LIFETIME_PRO") {
      newExpireDate = null;
    } else {
      const months = plan?.duration_months || (order2.plan_code === "ANNUAL_2Y" ? 24 : 12);
      const today = /* @__PURE__ */ new Date();
      let baseDate = today;
      if (tenant?.expire_date && tenant?.license_status === "ACTIVE") {
        const existingExp = new Date(tenant.expire_date);
        if (existingExp > today) {
          baseDate = existingExp;
        }
      }
      baseDate.setMonth(baseDate.getMonth() + months);
      newExpireDate = baseDate.toISOString().slice(0, 10);
    }
    const approvedNote = (order2.notes || "") + " [\u0110\xE3 duy\u1EC7t & k\xEDch ho\u1EA1t l\xFAc " + (/* @__PURE__ */ new Date()).toLocaleString("vi-VN") + "]";
    await c.env.DB.prepare(`
      UPDATE license_orders 
      SET payment_status = 'PAID', notes = ? 
      WHERE id = ?
    `).bind(approvedNote.trim(), orderId).run();
    if (tenant) {
      await c.env.DB.prepare(`
        UPDATE company_tenants 
        SET plan_code = ?, license_status = 'ACTIVE', expire_date = ?, revenue = COALESCE(revenue, 0) + ? 
        WHERE id = ?
      `).bind(order2.plan_code, newExpireDate, Number(order2.amount) || 0, tenant.id).run();
      await c.env.DB.prepare(`
        INSERT INTO company_settings (id, company_id, key, value, updated_at)
        VALUES (?, ?, 'license_key', ?, datetime('now'))
        ON CONFLICT(company_id, key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
      `).bind(`set_${Date.now()}`, tenant.id, order2.plan_code === "LIFETIME" ? "OMNI-LIFETIME" : `OMNI-${order2.plan_code}-${Date.now().toString().slice(-4)}`).run().catch(() => {
      });
    }
    const targetEmail = tenant?.admin_email;
    if (targetEmail) {
      const planDisplayName = order2.plan_name || plan?.name || order2.plan_code;
      const formattedAmount = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(order2.amount) || 0);
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
            <div style="font-size: 36px; margin-bottom: 8px;">\u{1F389}</div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">X\xE1c Nh\u1EADn K\xEDch Ho\u1EA1t B\u1EA3n Quy\u1EC1n Th\xE0nh C\xF4ng</h1>
            <p style="margin: 8px 0 0; font-size: 13px; opacity: 0.95;">Ban Qu\u1EA3n Tr\u1ECB OMNI ASSETS \u0111\xE3 \u0111\u1ED1i so\xE1t thanh to\xE1n v\xE0 k\xEDch ho\u1EA1t g\xF3i d\u1ECBch v\u1EE5 cho Qu\xFD kh\xE1ch</p>
          </div>
          <div style="padding: 28px 24px; color: #334155; line-height: 1.6; font-size: 14px;">
            <p>K\xEDnh g\u1EEDi Qu\xFD Doanh Nghi\u1EC7p <strong>${tenant.company_name || order2.company_name}</strong>,</p>
            <p>Ch\xFAng t\xF4i \u0111\xE3 nh\u1EADn \u0111\u01B0\u1EE3c thanh to\xE1n \u0111\u1ED1i so\xE1t qua chuy\u1EC3n kho\u1EA3n ng\xE2n h\xE0ng v\xE0 \u0111\xE3 k\xEDch ho\u1EA1t to\xE0n di\u1EC7n quy\u1EC1n l\u1EE3i g\xF3i d\u1ECBch v\u1EE5:</p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr><td style="padding: 6px 0; color: #64748b;">M\xE3 \u0110\u01A1n H\xE0ng:</td><td style="padding: 6px 0; font-weight: 700; text-align: right; font-family: monospace;">${order2.id}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;">G\xF3i B\u1EA3n Quy\u1EC1n:</td><td style="padding: 6px 0; font-weight: 700; text-align: right; color: #7c3aed;">${planDisplayName}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;">S\u1ED1 Ti\u1EC1n \u0110\xE3 Thanh To\xE1n:</td><td style="padding: 6px 0; font-weight: 800; text-align: right; color: #059669; font-size: 15px;">${formattedAmount}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;">Th\u1EDDi H\u1EA1n S\u1EED D\u1EE5ng:</td><td style="padding: 6px 0; font-weight: 700; text-align: right;">${newExpireDate ? `\u0110\u1EBFn ng\xE0y ${newExpireDate}` : "V\u0129nh vi\u1EC5n tr\u1ECDn \u0111\u1EDDi (Lifetime)"}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b;">Tr\u1EA1ng Th\xE1i B\u1EA3n Quy\u1EC1n:</td><td style="padding: 6px 0; font-weight: 700; text-align: right; color: #10b981;">\u0110ANG HO\u1EA0T \u0110\u1ED8NG (ACTIVE)</td></tr>
              </table>
            </div>
            <p>To\xE0n b\u1ED9 gi\u1EDBi h\u1EA1n v\u1EC1 t\xE0i s\u1EA3n, nh\xE2n vi\xEAn, h\u1EE3p \u0111\u1ED3ng v\xE0 in \u1EA5n kh\xF4ng watermark \u0111\xE3 \u0111\u01B0\u1EE3c m\u1EDF kh\xF3a ho\xE0n to\xE0n tr\xEAn t\xE0i kho\u1EA3n c\u1EE7a Qu\xFD c\xF4ng ty.</p>
            <div style="text-align: center; margin: 28px 0 16px;">
              <a href="https://company-sheet.hieupham101097.workers.dev" style="background: #10b981; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block;">Truy C\u1EADp N\u1EC1n T\u1EA3ng Ngay &rarr;</a>
            </div>
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">N\u1EBFu c\u1EA7n h\u1ED7 tr\u1EE3 k\u1EF9 thu\u1EADt ho\u1EB7c xu\u1EA5t h\xF3a \u0111\u01A1n VAT, Qu\xFD kh\xE1ch vui l\xF2ng li\xEAn h\u1EC7 hotline / Zalo: 0799.097.070 ho\u1EB7c g\u1EEDi y\xEAu c\u1EA7u t\u1EA1i m\u1EE5c Tr\u1EE3 Gi\xFAp.</p>
          </div>
        </div>
      `;
      try {
        await sendEmail({
          db: c.env.DB,
          companyId: tenant.id,
          to: targetEmail,
          senderType: "notifications",
          senderName: "OMNI ASSETS (Ban Qu\u1EA3n Tr\u1ECB)",
          subject: `\u{1F389} [X\xE1c Nh\u1EADn] \u0110\u01A1n H\xE0ng & K\xEDch Ho\u1EA1t B\u1EA3n Quy\u1EC1n G\xF3i ${planDisplayName} Th\xE0nh C\xF4ng`,
          html: emailHtml
        });
      } catch (mailErr) {
        console.error("L\u1ED7i g\u1EEDi email x\xE1c nh\u1EADn k\xEDch ho\u1EA1t \u0111\u01A1n h\xE0ng:", mailErr);
      }
    }
    return c.json({
      success: true,
      message: `Duy\u1EC7t \u0111\u01A1n h\xE0ng v\xE0 k\xEDch ho\u1EA1t th\xE0nh c\xF4ng g\xF3i ${order2.plan_name || order2.plan_code} cho doanh nghi\u1EC7p!`,
      data: {
        orderId,
        companyId: tenant?.id,
        planCode: order2.plan_code,
        expireDate: newExpireDate
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.put("/api/super-admin/orders/:id/cancel", async (c) => {
  try {
    const orderId = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const reason = body.reason || "Admin h\u1EE7y \u0111\u01A1n";
    const order2 = await c.env.DB.prepare("SELECT * FROM license_orders WHERE id = ?").bind(orderId).first();
    if (!order2) {
      return c.json({ success: false, message: "Kh\xF4ng t\xECm th\u1EA5y \u0111\u01A1n h\xE0ng" }, 404);
    }
    const updatedNote = (order2.notes || "") + ` [\u0110\xE3 h\u1EE7y: ${reason}]`;
    await c.env.DB.prepare(`
      UPDATE license_orders 
      SET payment_status = 'CANCELLED', notes = ? 
      WHERE id = ?
    `).bind(updatedNote.trim(), orderId).run();
    return c.json({ success: true, message: "\u0110\xE3 h\u1EE7y \u0111\u01A1n h\xE0ng th\xE0nh c\xF4ng!" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.get("/api/reminders/status", async (c) => {
  try {
    const s = await c.env.DB.prepare("SELECT value, updated_at FROM system_settings WHERE key = 'last_daily_refresh'").first();
    return c.json({
      success: true,
      data: {
        cronSchedule: "06:00 AM h\xE0ng ng\xE0y (UTC+7)",
        cronExpression: "0 23 * * * (UTC)",
        lastRefreshedAt: s?.value || "06:00:00 h\xF4m nay",
        lastUpdatedAt: s?.updated_at || null,
        status: "ACTIVE"
      }
    });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.post("/api/reminders/refresh", async (c) => {
  try {
    const result = await refreshDailyReminders(c.env.DB);
    return c.json(result);
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
app.get("/favicon.ico", async (c) => {
  if (c.env?.ASSETS) {
    const assetFav = await c.env.ASSETS.fetch(c.req.raw);
    if (assetFav.status !== 404) return assetFav;
    const logoRes = await c.env.ASSETS.fetch(new Request(new URL("/logo.png", c.req.url)));
    if (logoRes.status === 200) {
      const headers = new Headers(logoRes.headers);
      headers.set("Content-Type", "image/png");
      return new Response(logoRes.body, { status: 200, headers });
    }
  }
  return c.redirect("/logo.png", 302);
});
app.notFound(async (c) => {
  const url = new URL(c.req.url);
  const path = url.pathname;
  if (path.startsWith("/api")) {
    return c.json({ success: false, message: `API endpoint ${path} not found` }, 404);
  }
  if (c.env?.ASSETS) {
    const assetRes = await c.env.ASSETS.fetch(c.req.raw);
    if (assetRes.status !== 404) {
      const contentType = assetRes.headers.get("content-type") || "";
      if (contentType.includes("text/html") || path === "/" || path === "/index.html") {
        const headers = new Headers(assetRes.headers);
        headers.set("Content-Type", "text/html; charset=utf-8");
        headers.set("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
        headers.set("Pragma", "no-cache");
        headers.set("Expires", "0");
        return new Response(assetRes.body, { status: assetRes.status, headers });
      }
      return assetRes;
    }
    const indexUrl = new URL("/index.html", c.req.url);
    const indexRes = await c.env.ASSETS.fetch(new Request(indexUrl.toString(), c.req.raw));
    if (indexRes.status === 200) {
      const headers = new Headers(indexRes.headers);
      headers.set("Content-Type", "text/html; charset=utf-8");
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
      headers.set("Pragma", "no-cache");
      headers.set("Expires", "0");
      return new Response(indexRes.body, { status: 200, headers });
    }
    return assetRes;
  }
  return c.text("Not Found", 404);
});
var index_default = {
  fetch: app.fetch,
  async scheduled(event, env2, ctx) {
    ctx.waitUntil(refreshDailyReminders(env2.DB));
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
