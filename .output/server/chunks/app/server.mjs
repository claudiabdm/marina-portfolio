import { computed, defineAsyncComponent, defineComponent, inject, provide, h as h$1, Suspense, Transition, reactive, ref, onMounted, isRef, getCurrentInstance, resolveComponent, watchEffect, markRaw, shallowRef, useSSRContext, createApp, toRef, onErrorCaptured, unref, openBlock, createBlock, resolveDynamicComponent, normalizeProps, guardReactiveProps, withCtx, createVNode } from 'vue';
import { $fetch } from 'ohmyfetch';
import { joinURL, hasProtocol, isEqual, parseURL } from 'ufo';
import { createHooks } from 'hookable';
import { getContext, executeAsync } from 'unctx';
import { RouterView, createMemoryHistory, createRouter } from 'vue-router';
import { createError as createError$1, sendRedirect } from 'h3';
import defu, { defuFn } from 'defu';
import { isFunction } from '@vue/shared';
import q from 'axios';
import { ssrRenderSuspense, ssrRenderComponent } from 'vue/server-renderer';
import { a as useRuntimeConfig$1 } from '../nitro/node-server.mjs';
import 'node-fetch-native/polyfill';
import 'http';
import 'https';
import 'destr';
import 'radix3';
import 'unenv/runtime/fetch/index';
import 'scule';
import 'ohash';
import 'unstorage';
import 'fs';
import 'pathe';
import 'url';

const appConfig = useRuntimeConfig$1().app;
const baseURL = () => appConfig.baseURL;
const buildAssetsDir = () => appConfig.buildAssetsDir;
const buildAssetsURL = (...path) => joinURL(publicAssetsURL(), buildAssetsDir(), ...path);
const publicAssetsURL = (...path) => {
  const publicBase = appConfig.cdnURL || appConfig.baseURL;
  return path.length ? joinURL(publicBase, ...path) : publicBase;
};
globalThis.__buildAssetsURL = buildAssetsURL;
globalThis.__publicAssetsURL = publicAssetsURL;
const nuxtAppCtx = getContext("nuxt-app");
const NuxtPluginIndicator = "__nuxt_plugin";
function createNuxtApp(options) {
  const nuxtApp = {
    provide: void 0,
    globalName: "nuxt",
    payload: reactive({
      data: {},
      state: {},
      _errors: {},
      ...{ serverRendered: true }
    }),
    isHydrating: false,
    _asyncDataPromises: {},
    _asyncData: {},
    ...options
  };
  nuxtApp.hooks = createHooks();
  nuxtApp.hook = nuxtApp.hooks.hook;
  nuxtApp.callHook = nuxtApp.hooks.callHook;
  nuxtApp.provide = (name, value) => {
    const $name = "$" + name;
    defineGetter(nuxtApp, $name, value);
    defineGetter(nuxtApp.vueApp.config.globalProperties, $name, value);
  };
  defineGetter(nuxtApp.vueApp, "$nuxt", nuxtApp);
  defineGetter(nuxtApp.vueApp.config.globalProperties, "$nuxt", nuxtApp);
  {
    if (nuxtApp.ssrContext) {
      nuxtApp.ssrContext.nuxt = nuxtApp;
    }
    nuxtApp.ssrContext = nuxtApp.ssrContext || {};
    if (nuxtApp.ssrContext.payload) {
      Object.assign(nuxtApp.payload, nuxtApp.ssrContext.payload);
    }
    nuxtApp.ssrContext.payload = nuxtApp.payload;
    nuxtApp.payload.config = {
      public: options.ssrContext.runtimeConfig.public,
      app: options.ssrContext.runtimeConfig.app
    };
  }
  const runtimeConfig = options.ssrContext.runtimeConfig;
  const compatibilityConfig = new Proxy(runtimeConfig, {
    get(target, prop) {
      var _a;
      if (prop === "public") {
        return target.public;
      }
      return (_a = target[prop]) != null ? _a : target.public[prop];
    },
    set(target, prop, value) {
      {
        return false;
      }
    }
  });
  nuxtApp.provide("config", compatibilityConfig);
  return nuxtApp;
}
async function applyPlugin(nuxtApp, plugin) {
  if (typeof plugin !== "function") {
    return;
  }
  const { provide: provide2 } = await callWithNuxt(nuxtApp, plugin, [nuxtApp]) || {};
  if (provide2 && typeof provide2 === "object") {
    for (const key in provide2) {
      nuxtApp.provide(key, provide2[key]);
    }
  }
}
async function applyPlugins(nuxtApp, plugins2) {
  for (const plugin of plugins2) {
    await applyPlugin(nuxtApp, plugin);
  }
}
function normalizePlugins(_plugins2) {
  const plugins2 = _plugins2.map((plugin) => {
    if (typeof plugin !== "function") {
      return null;
    }
    if (plugin.length > 1) {
      return (nuxtApp) => plugin(nuxtApp, nuxtApp.provide);
    }
    return plugin;
  }).filter(Boolean);
  return plugins2;
}
function defineNuxtPlugin(plugin) {
  plugin[NuxtPluginIndicator] = true;
  return plugin;
}
function callWithNuxt(nuxt, setup, args) {
  const fn = () => args ? setup(...args) : setup();
  {
    return nuxtAppCtx.callAsync(nuxt, fn);
  }
}
function useNuxtApp() {
  const nuxtAppInstance = nuxtAppCtx.tryUse();
  if (!nuxtAppInstance) {
    const vm = getCurrentInstance();
    if (!vm) {
      throw new Error("nuxt instance unavailable");
    }
    return vm.appContext.app.$nuxt;
  }
  return nuxtAppInstance;
}
function useRuntimeConfig() {
  return useNuxtApp().$config;
}
function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
function useState(...args) {
  const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
  if (typeof args[0] !== "string") {
    args.unshift(autoKey);
  }
  const [_key, init] = args;
  if (!_key || typeof _key !== "string") {
    throw new TypeError("[nuxt] [useState] key must be a string: " + _key);
  }
  if (init !== void 0 && typeof init !== "function") {
    throw new Error("[nuxt] [useState] init must be a function: " + init);
  }
  const key = "$s" + _key;
  const nuxt = useNuxtApp();
  const state = toRef(nuxt.payload.state, key);
  if (state.value === void 0 && init) {
    const initialValue = init();
    if (isRef(initialValue)) {
      nuxt.payload.state[key] = initialValue;
      return initialValue;
    }
    state.value = initialValue;
  }
  return state;
}
const useError = () => toRef(useNuxtApp().payload, "error");
const showError = (_err) => {
  const err = createError(_err);
  try {
    const nuxtApp = useNuxtApp();
    nuxtApp.callHook("app:error", err);
    const error = useError();
    error.value = error.value || err;
  } catch {
    throw err;
  }
  return err;
};
const createError = (err) => {
  const _err = createError$1(err);
  _err.__nuxt_error = true;
  return _err;
};
const useRouter = () => {
  var _a;
  return (_a = useNuxtApp()) == null ? void 0 : _a.$router;
};
const useRoute = () => {
  if (getCurrentInstance()) {
    return inject("_route", useNuxtApp()._route);
  }
  return useNuxtApp()._route;
};
const navigateTo = (to, options) => {
  if (!to) {
    to = "/";
  }
  const toPath = typeof to === "string" ? to : to.path || "/";
  const isExternal = hasProtocol(toPath, true);
  if (isExternal && !(options == null ? void 0 : options.external)) {
    throw new Error("Navigating to external URL is not allowed by default. Use `nagivateTo (url, { external: true })`.");
  }
  if (isExternal && parseURL(toPath).protocol === "script:") {
    throw new Error("Cannot navigate to an URL with script protocol.");
  }
  const router = useRouter();
  {
    const nuxtApp = useNuxtApp();
    if (nuxtApp.ssrContext && nuxtApp.ssrContext.event) {
      const redirectLocation = isExternal ? toPath : joinURL(useRuntimeConfig().app.baseURL, router.resolve(to).fullPath || "/");
      return nuxtApp.callHook("app:redirected").then(() => sendRedirect(nuxtApp.ssrContext.event, redirectLocation, (options == null ? void 0 : options.redirectCode) || 302));
    }
  }
  if (isExternal) {
    if (options == null ? void 0 : options.replace) {
      location.replace(toPath);
    } else {
      location.href = toPath;
    }
    return Promise.resolve();
  }
  return (options == null ? void 0 : options.replace) ? router.replace(to) : router.push(to);
};
const firstNonUndefined = (...args) => args.find((arg) => arg !== void 0);
const DEFAULT_EXTERNAL_REL_ATTRIBUTE = "noopener noreferrer";
function defineNuxtLink(options) {
  const componentName = options.componentName || "NuxtLink";
  return defineComponent({
    name: componentName,
    props: {
      to: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      href: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      target: {
        type: String,
        default: void 0,
        required: false
      },
      rel: {
        type: String,
        default: void 0,
        required: false
      },
      noRel: {
        type: Boolean,
        default: void 0,
        required: false
      },
      prefetch: {
        type: Boolean,
        default: void 0,
        required: false
      },
      noPrefetch: {
        type: Boolean,
        default: void 0,
        required: false
      },
      activeClass: {
        type: String,
        default: void 0,
        required: false
      },
      exactActiveClass: {
        type: String,
        default: void 0,
        required: false
      },
      prefetchedClass: {
        type: String,
        default: void 0,
        required: false
      },
      replace: {
        type: Boolean,
        default: void 0,
        required: false
      },
      ariaCurrentValue: {
        type: String,
        default: void 0,
        required: false
      },
      external: {
        type: Boolean,
        default: void 0,
        required: false
      },
      custom: {
        type: Boolean,
        default: void 0,
        required: false
      }
    },
    setup(props, { slots }) {
      const router = useRouter();
      const to = computed(() => {
        return props.to || props.href || "";
      });
      const isExternal = computed(() => {
        if (props.external) {
          return true;
        }
        if (props.target && props.target !== "_self") {
          return true;
        }
        if (typeof to.value === "object") {
          return false;
        }
        return to.value === "" || hasProtocol(to.value, true);
      });
      const prefetched = ref(false);
      return () => {
        var _a, _b, _c;
        if (!isExternal.value) {
          return h$1(
            resolveComponent("RouterLink"),
            {
              ref: void 0,
              to: to.value,
              ...prefetched.value && !props.custom ? { class: props.prefetchedClass || options.prefetchedClass } : {},
              activeClass: props.activeClass || options.activeClass,
              exactActiveClass: props.exactActiveClass || options.exactActiveClass,
              replace: props.replace,
              ariaCurrentValue: props.ariaCurrentValue,
              custom: props.custom
            },
            slots.default
          );
        }
        const href = typeof to.value === "object" ? (_b = (_a = router.resolve(to.value)) == null ? void 0 : _a.href) != null ? _b : null : to.value || null;
        const target = props.target || null;
        const rel = props.noRel ? null : firstNonUndefined(props.rel, options.externalRelAttribute, href ? DEFAULT_EXTERNAL_REL_ATTRIBUTE : "") || null;
        const navigate = () => navigateTo(href, { replace: props.replace });
        if (props.custom) {
          if (!slots.default) {
            return null;
          }
          return slots.default({
            href,
            navigate,
            route: router.resolve(href),
            rel,
            target,
            isActive: false,
            isExactActive: false
          });
        }
        return h$1("a", { href, rel, target }, (_c = slots.default) == null ? void 0 : _c.call(slots));
      };
    }
  });
}
const __nuxt_component_0$1 = defineNuxtLink({ componentName: "NuxtLink" });
const inlineConfig = {};
defuFn(inlineConfig);
function useHead(meta2) {
  const resolvedMeta = isFunction(meta2) ? computed(meta2) : meta2;
  useNuxtApp()._useHead(resolvedMeta);
}
const components = {
  Feature: defineAsyncComponent(() => import('./_nuxt/Feature.b00d7622.mjs').then((c) => c.default || c)),
  Grid: defineAsyncComponent(() => import('./_nuxt/Grid.3756b629.mjs').then((c) => c.default || c)),
  Page: defineAsyncComponent(() => import('./_nuxt/Page.902a5a1d.mjs').then((c) => c.default || c)),
  Teaser: defineAsyncComponent(() => import('./_nuxt/Teaser.819c0ca4.mjs').then((c) => c.default || c))
};
const _nuxt_components_plugin_mjs_KR1HBZs4kY = defineNuxtPlugin((nuxtApp) => {
  for (const name in components) {
    nuxtApp.vueApp.component(name, components[name]);
    nuxtApp.vueApp.component("Lazy" + name, components[name]);
  }
});
var PROVIDE_KEY = `usehead`;
var HEAD_COUNT_KEY = `head:count`;
var HEAD_ATTRS_KEY = `data-head-attrs`;
var SELF_CLOSING_TAGS = ["meta", "link", "base"];
var BODY_TAG_ATTR_NAME = `data-meta-body`;
var createElement = (tag, attrs, document) => {
  const el = document.createElement(tag);
  for (const key of Object.keys(attrs)) {
    if (key === "body" && attrs.body === true) {
      el.setAttribute(BODY_TAG_ATTR_NAME, "true");
    } else {
      let value = attrs[key];
      if (key === "renderPriority" || key === "key" || value === false) {
        continue;
      }
      if (key === "children") {
        el.textContent = value;
      } else {
        el.setAttribute(key, value);
      }
    }
  }
  return el;
};
var stringifyAttrName = (str) => str.replace(/[\s"'><\/=]/g, "").replace(/[^a-zA-Z0-9_-]/g, "");
var stringifyAttrValue = (str) => str.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
var stringifyAttrs = (attributes) => {
  const handledAttributes = [];
  for (let [key, value] of Object.entries(attributes)) {
    if (key === "children" || key === "key") {
      continue;
    }
    if (value === false || value == null) {
      continue;
    }
    let attribute = stringifyAttrName(key);
    if (value !== true) {
      attribute += `="${stringifyAttrValue(String(value))}"`;
    }
    handledAttributes.push(attribute);
  }
  return handledAttributes.length > 0 ? " " + handledAttributes.join(" ") : "";
};
function isEqualNode(oldTag, newTag) {
  if (oldTag instanceof HTMLElement && newTag instanceof HTMLElement) {
    const nonce = newTag.getAttribute("nonce");
    if (nonce && !oldTag.getAttribute("nonce")) {
      const cloneTag = newTag.cloneNode(true);
      cloneTag.setAttribute("nonce", "");
      cloneTag.nonce = nonce;
      return nonce === oldTag.nonce && oldTag.isEqualNode(cloneTag);
    }
  }
  return oldTag.isEqualNode(newTag);
}
var tagDedupeKey = (tag) => {
  if (!["meta", "base", "script", "link"].includes(tag.tag)) {
    return false;
  }
  const { props, tag: tagName } = tag;
  if (tagName === "base") {
    return "base";
  }
  if (tagName === "link" && props.rel === "canonical") {
    return "canonical";
  }
  if (props.charset) {
    return "charset";
  }
  const name = ["key", "id", "name", "property", "http-equiv"];
  for (const n of name) {
    let value = void 0;
    if (typeof props.getAttribute === "function" && props.hasAttribute(n)) {
      value = props.getAttribute(n);
    } else {
      value = props[n];
    }
    if (value !== void 0) {
      return `${tagName}-${n}-${value}`;
    }
  }
  return false;
};
var acceptFields = [
  "title",
  "meta",
  "link",
  "base",
  "style",
  "script",
  "noscript",
  "htmlAttrs",
  "bodyAttrs"
];
var renderTemplate = (template, title) => {
  if (template == null)
    return "";
  if (typeof template === "string") {
    return template.replace("%s", title != null ? title : "");
  }
  return template(unref(title));
};
var headObjToTags = (obj) => {
  const tags = [];
  const keys = Object.keys(obj);
  for (const key of keys) {
    if (obj[key] == null)
      continue;
    switch (key) {
      case "title":
        tags.push({ tag: key, props: { children: obj[key] } });
        break;
      case "titleTemplate":
        break;
      case "base":
        tags.push({ tag: key, props: { key: "default", ...obj[key] } });
        break;
      default:
        if (acceptFields.includes(key)) {
          const value = obj[key];
          if (Array.isArray(value)) {
            value.forEach((item) => {
              tags.push({ tag: key, props: unref(item) });
            });
          } else if (value) {
            tags.push({ tag: key, props: value });
          }
        }
        break;
    }
  }
  return tags;
};
var setAttrs = (el, attrs) => {
  const existingAttrs = el.getAttribute(HEAD_ATTRS_KEY);
  if (existingAttrs) {
    for (const key of existingAttrs.split(",")) {
      if (!(key in attrs)) {
        el.removeAttribute(key);
      }
    }
  }
  const keys = [];
  for (const key in attrs) {
    const value = attrs[key];
    if (value == null)
      continue;
    if (value === false) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, value);
    }
    keys.push(key);
  }
  if (keys.length) {
    el.setAttribute(HEAD_ATTRS_KEY, keys.join(","));
  } else {
    el.removeAttribute(HEAD_ATTRS_KEY);
  }
};
var updateElements = (document = window.document, type, tags) => {
  var _a, _b;
  const head = document.head;
  const body = document.body;
  let headCountEl = head.querySelector(`meta[name="${HEAD_COUNT_KEY}"]`);
  let bodyMetaElements = body.querySelectorAll(`[${BODY_TAG_ATTR_NAME}]`);
  const headCount = headCountEl ? Number(headCountEl.getAttribute("content")) : 0;
  const oldHeadElements = [];
  const oldBodyElements = [];
  if (bodyMetaElements) {
    for (let i = 0; i < bodyMetaElements.length; i++) {
      if (bodyMetaElements[i] && ((_a = bodyMetaElements[i].tagName) == null ? void 0 : _a.toLowerCase()) === type) {
        oldBodyElements.push(bodyMetaElements[i]);
      }
    }
  }
  if (headCountEl) {
    for (let i = 0, j = headCountEl.previousElementSibling; i < headCount; i++, j = (j == null ? void 0 : j.previousElementSibling) || null) {
      if (((_b = j == null ? void 0 : j.tagName) == null ? void 0 : _b.toLowerCase()) === type) {
        oldHeadElements.push(j);
      }
    }
  } else {
    headCountEl = document.createElement("meta");
    headCountEl.setAttribute("name", HEAD_COUNT_KEY);
    headCountEl.setAttribute("content", "0");
    head.append(headCountEl);
  }
  let newElements = tags.map((tag) => {
    var _a2;
    return {
      element: createElement(tag.tag, tag.props, document),
      body: (_a2 = tag.props.body) != null ? _a2 : false
    };
  });
  newElements = newElements.filter((newEl) => {
    for (let i = 0; i < oldHeadElements.length; i++) {
      const oldEl = oldHeadElements[i];
      if (isEqualNode(oldEl, newEl.element)) {
        oldHeadElements.splice(i, 1);
        return false;
      }
    }
    for (let i = 0; i < oldBodyElements.length; i++) {
      const oldEl = oldBodyElements[i];
      if (isEqualNode(oldEl, newEl.element)) {
        oldBodyElements.splice(i, 1);
        return false;
      }
    }
    return true;
  });
  oldBodyElements.forEach((t) => {
    var _a2;
    return (_a2 = t.parentNode) == null ? void 0 : _a2.removeChild(t);
  });
  oldHeadElements.forEach((t) => {
    var _a2;
    return (_a2 = t.parentNode) == null ? void 0 : _a2.removeChild(t);
  });
  newElements.forEach((t) => {
    if (t.body === true) {
      body.insertAdjacentElement("beforeend", t.element);
    } else {
      head.insertBefore(t.element, headCountEl);
    }
  });
  headCountEl.setAttribute(
    "content",
    "" + (headCount - oldHeadElements.length + newElements.filter((t) => !t.body).length)
  );
};
var createHead = (initHeadObject) => {
  let allHeadObjs = [];
  let previousTags = /* @__PURE__ */ new Set();
  if (initHeadObject) {
    allHeadObjs.push(shallowRef(initHeadObject));
  }
  const head = {
    install(app) {
      app.config.globalProperties.$head = head;
      app.provide(PROVIDE_KEY, head);
    },
    get headTags() {
      const deduped = [];
      const deduping = {};
      const titleTemplate = allHeadObjs.map((i) => unref(i).titleTemplate).reverse().find((i) => i != null);
      allHeadObjs.forEach((objs, headObjectIdx) => {
        const tags = headObjToTags(unref(objs));
        tags.forEach((tag, tagIdx) => {
          tag._position = headObjectIdx * 1e4 + tagIdx;
          if (titleTemplate && tag.tag === "title") {
            tag.props.children = renderTemplate(
              titleTemplate,
              tag.props.children
            );
          }
          const dedupeKey = tagDedupeKey(tag);
          if (dedupeKey) {
            deduping[dedupeKey] = tag;
          } else {
            deduped.push(tag);
          }
        });
      });
      deduped.push(...Object.values(deduping));
      return deduped.sort((a, b2) => a._position - b2._position);
    },
    addHeadObjs(objs) {
      allHeadObjs.push(objs);
    },
    removeHeadObjs(objs) {
      allHeadObjs = allHeadObjs.filter((_objs) => _objs !== objs);
    },
    updateDOM(document = window.document) {
      let title;
      let htmlAttrs = {};
      let bodyAttrs = {};
      const actualTags = {};
      for (const tag of head.headTags.sort(sortTags)) {
        if (tag.tag === "title") {
          title = tag.props.children;
          continue;
        }
        if (tag.tag === "htmlAttrs") {
          Object.assign(htmlAttrs, tag.props);
          continue;
        }
        if (tag.tag === "bodyAttrs") {
          Object.assign(bodyAttrs, tag.props);
          continue;
        }
        actualTags[tag.tag] = actualTags[tag.tag] || [];
        actualTags[tag.tag].push(tag);
      }
      if (title !== void 0) {
        document.title = title;
      }
      setAttrs(document.documentElement, htmlAttrs);
      setAttrs(document.body, bodyAttrs);
      const tags = /* @__PURE__ */ new Set([...Object.keys(actualTags), ...previousTags]);
      for (const tag of tags) {
        updateElements(document, tag, actualTags[tag] || []);
      }
      previousTags.clear();
      Object.keys(actualTags).forEach((i) => previousTags.add(i));
    }
  };
  return head;
};
var tagToString = (tag) => {
  let isBodyTag = false;
  if (tag.props.body) {
    isBodyTag = true;
    delete tag.props.body;
  }
  if (tag.props.renderPriority) {
    delete tag.props.renderPriority;
  }
  let attrs = stringifyAttrs(tag.props);
  if (SELF_CLOSING_TAGS.includes(tag.tag)) {
    return `<${tag.tag}${attrs}${isBodyTag ? `  ${BODY_TAG_ATTR_NAME}="true"` : ""}>`;
  }
  return `<${tag.tag}${attrs}${isBodyTag ? ` ${BODY_TAG_ATTR_NAME}="true"` : ""}>${tag.props.children || ""}</${tag.tag}>`;
};
var sortTags = (aTag, bTag) => {
  const tagWeight = (tag) => {
    if (tag.props.renderPriority) {
      return tag.props.renderPriority;
    }
    switch (tag.tag) {
      case "base":
        return -1;
      case "meta":
        if (tag.props.charset) {
          return -2;
        }
        if (tag.props["http-equiv"] === "content-security-policy") {
          return 0;
        }
        return 10;
      default:
        return 10;
    }
  };
  return tagWeight(aTag) - tagWeight(bTag);
};
var renderHeadToString = (head) => {
  const tags = [];
  let titleTag = "";
  let htmlAttrs = {};
  let bodyAttrs = {};
  let bodyTags = [];
  for (const tag of head.headTags.sort(sortTags)) {
    if (tag.tag === "title") {
      titleTag = tagToString(tag);
    } else if (tag.tag === "htmlAttrs") {
      Object.assign(htmlAttrs, tag.props);
    } else if (tag.tag === "bodyAttrs") {
      Object.assign(bodyAttrs, tag.props);
    } else if (tag.props.body) {
      bodyTags.push(tagToString(tag));
    } else {
      tags.push(tagToString(tag));
    }
  }
  tags.push(`<meta name="${HEAD_COUNT_KEY}" content="${tags.length}">`);
  return {
    get headTags() {
      return titleTag + tags.join("");
    },
    get htmlAttrs() {
      return stringifyAttrs({
        ...htmlAttrs,
        [HEAD_ATTRS_KEY]: Object.keys(htmlAttrs).join(",")
      });
    },
    get bodyAttrs() {
      return stringifyAttrs({
        ...bodyAttrs,
        [HEAD_ATTRS_KEY]: Object.keys(bodyAttrs).join(",")
      });
    },
    get bodyTags() {
      return bodyTags.join("");
    }
  };
};
const node_modules_nuxt_dist_head_runtime_lib_vueuse_head_plugin_mjs_D7WGfuP1A0 = defineNuxtPlugin((nuxtApp) => {
  const head = createHead();
  nuxtApp.vueApp.use(head);
  nuxtApp.hooks.hookOnce("app:mounted", () => {
    watchEffect(() => {
      head.updateDOM();
    });
  });
  nuxtApp._useHead = (_meta) => {
    const meta2 = ref(_meta);
    const headObj = computed(() => {
      const overrides = { meta: [] };
      if (meta2.value.charset) {
        overrides.meta.push({ key: "charset", charset: meta2.value.charset });
      }
      if (meta2.value.viewport) {
        overrides.meta.push({ name: "viewport", content: meta2.value.viewport });
      }
      return defu(overrides, meta2.value);
    });
    head.addHeadObjs(headObj);
    {
      return;
    }
  };
  {
    nuxtApp.ssrContext.renderMeta = () => {
      const meta2 = renderHeadToString(head);
      return {
        ...meta2,
        bodyScripts: meta2.bodyTags
      };
    };
  }
});
const removeUndefinedProps = (props) => Object.fromEntries(Object.entries(props).filter(([, value]) => value !== void 0));
const setupForUseMeta = (metaFactory, renderChild) => (props, ctx) => {
  useHead(() => metaFactory({ ...removeUndefinedProps(props), ...ctx.attrs }, ctx));
  return () => {
    var _a, _b;
    return renderChild ? (_b = (_a = ctx.slots).default) == null ? void 0 : _b.call(_a) : null;
  };
};
const globalProps = {
  accesskey: String,
  autocapitalize: String,
  autofocus: {
    type: Boolean,
    default: void 0
  },
  class: String,
  contenteditable: {
    type: Boolean,
    default: void 0
  },
  contextmenu: String,
  dir: String,
  draggable: {
    type: Boolean,
    default: void 0
  },
  enterkeyhint: String,
  exportparts: String,
  hidden: {
    type: Boolean,
    default: void 0
  },
  id: String,
  inputmode: String,
  is: String,
  itemid: String,
  itemprop: String,
  itemref: String,
  itemscope: String,
  itemtype: String,
  lang: String,
  nonce: String,
  part: String,
  slot: String,
  spellcheck: {
    type: Boolean,
    default: void 0
  },
  style: String,
  tabindex: String,
  title: String,
  translate: String
};
const Script = defineComponent({
  name: "Script",
  inheritAttrs: false,
  props: {
    ...globalProps,
    async: Boolean,
    crossorigin: {
      type: [Boolean, String],
      default: void 0
    },
    defer: Boolean,
    fetchpriority: String,
    integrity: String,
    nomodule: Boolean,
    nonce: String,
    referrerpolicy: String,
    src: String,
    type: String,
    charset: String,
    language: String
  },
  setup: setupForUseMeta((script) => ({
    script: [script]
  }))
});
const NoScript = defineComponent({
  name: "NoScript",
  inheritAttrs: false,
  props: {
    ...globalProps,
    title: String
  },
  setup: setupForUseMeta((props, { slots }) => {
    var _a;
    const noscript = { ...props };
    const textContent = (((_a = slots.default) == null ? void 0 : _a.call(slots)) || []).filter(({ children }) => children).map(({ children }) => children).join("");
    if (textContent) {
      noscript.children = textContent;
    }
    return {
      noscript: [noscript]
    };
  })
});
const Link = defineComponent({
  name: "Link",
  inheritAttrs: false,
  props: {
    ...globalProps,
    as: String,
    crossorigin: String,
    disabled: Boolean,
    fetchpriority: String,
    href: String,
    hreflang: String,
    imagesizes: String,
    imagesrcset: String,
    integrity: String,
    media: String,
    prefetch: {
      type: Boolean,
      default: void 0
    },
    referrerpolicy: String,
    rel: String,
    sizes: String,
    title: String,
    type: String,
    methods: String,
    target: String
  },
  setup: setupForUseMeta((link) => ({
    link: [link]
  }))
});
const Base = defineComponent({
  name: "Base",
  inheritAttrs: false,
  props: {
    ...globalProps,
    href: String,
    target: String
  },
  setup: setupForUseMeta((base) => ({
    base
  }))
});
const Title = defineComponent({
  name: "Title",
  inheritAttrs: false,
  setup: setupForUseMeta((_, { slots }) => {
    var _a, _b, _c;
    const title = ((_c = (_b = (_a = slots.default) == null ? void 0 : _a.call(slots)) == null ? void 0 : _b[0]) == null ? void 0 : _c.children) || null;
    return {
      title
    };
  })
});
const Meta = defineComponent({
  name: "Meta",
  inheritAttrs: false,
  props: {
    ...globalProps,
    charset: String,
    content: String,
    httpEquiv: String,
    name: String
  },
  setup: setupForUseMeta((props) => {
    const meta2 = { ...props };
    if (meta2.httpEquiv) {
      meta2["http-equiv"] = meta2.httpEquiv;
      delete meta2.httpEquiv;
    }
    return {
      meta: [meta2]
    };
  })
});
const Style = defineComponent({
  name: "Style",
  inheritAttrs: false,
  props: {
    ...globalProps,
    type: String,
    media: String,
    nonce: String,
    title: String,
    scoped: {
      type: Boolean,
      default: void 0
    }
  },
  setup: setupForUseMeta((props, { slots }) => {
    var _a, _b, _c;
    const style = { ...props };
    const textContent = (_c = (_b = (_a = slots.default) == null ? void 0 : _a.call(slots)) == null ? void 0 : _b[0]) == null ? void 0 : _c.children;
    if (textContent) {
      style.children = textContent;
    }
    return {
      style: [style]
    };
  })
});
const Head = defineComponent({
  name: "Head",
  inheritAttrs: false,
  setup: (_props, ctx) => () => {
    var _a, _b;
    return (_b = (_a = ctx.slots).default) == null ? void 0 : _b.call(_a);
  }
});
const Html = defineComponent({
  name: "Html",
  inheritAttrs: false,
  props: {
    ...globalProps,
    manifest: String,
    version: String,
    xmlns: String
  },
  setup: setupForUseMeta((htmlAttrs) => ({ htmlAttrs }), true)
});
const Body = defineComponent({
  name: "Body",
  inheritAttrs: false,
  props: globalProps,
  setup: setupForUseMeta((bodyAttrs) => ({ bodyAttrs }), true)
});
const Components = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Script,
  NoScript,
  Link,
  Base,
  Title,
  Meta,
  Style,
  Head,
  Html,
  Body
}, Symbol.toStringTag, { value: "Module" }));
const appHead = { "meta": [], "link": [], "style": [], "script": [{ "src": "https://cdn.tailwindcss.com" }], "noscript": [], "charset": "utf-8", "viewport": "width=device-width, initial-scale=1" };
const appLayoutTransition = { "name": "layout", "mode": "out-in" };
const appPageTransition = { "name": "page", "mode": "out-in" };
const appKeepalive = false;
const metaMixin = {
  created() {
    const instance = getCurrentInstance();
    if (!instance) {
      return;
    }
    const options = instance.type;
    if (!options || !("head" in options)) {
      return;
    }
    const nuxtApp = useNuxtApp();
    const source = typeof options.head === "function" ? computed(() => options.head(nuxtApp)) : options.head;
    useHead(source);
  }
};
const node_modules_nuxt_dist_head_runtime_plugin_mjs_1QO0gqa6n2 = defineNuxtPlugin((nuxtApp) => {
  useHead(markRaw({ title: "", ...appHead }));
  nuxtApp.vueApp.mixin(metaMixin);
  for (const name in Components) {
    nuxtApp.vueApp.component(name, Components[name]);
  }
});
const interpolatePath = (route, match) => {
  return match.path.replace(/(:\w+)\([^)]+\)/g, "$1").replace(/(:\w+)[?+*]/g, "$1").replace(/:\w+/g, (r) => {
    var _a;
    return ((_a = route.params[r.slice(1)]) == null ? void 0 : _a.toString()) || "";
  });
};
const generateRouteKey = (override, routeProps) => {
  var _a;
  const matchedRoute = routeProps.route.matched.find((m2) => {
    var _a2;
    return ((_a2 = m2.components) == null ? void 0 : _a2.default) === routeProps.Component.type;
  });
  const source = (_a = override != null ? override : matchedRoute == null ? void 0 : matchedRoute.meta.key) != null ? _a : matchedRoute && interpolatePath(routeProps.route, matchedRoute);
  return typeof source === "function" ? source(routeProps.route) : source;
};
const wrapInKeepAlive = (props, children) => {
  return { default: () => children };
};
const Fragment = defineComponent({
  setup(_props, { slots }) {
    return () => {
      var _a;
      return (_a = slots.default) == null ? void 0 : _a.call(slots);
    };
  }
});
const _wrapIf = (component, props, slots) => {
  return { default: () => props ? h$1(component, props === true ? {} : props, slots) : h$1(Fragment, {}, slots) };
};
const isNestedKey = Symbol("isNested");
const NuxtPage = defineComponent({
  name: "NuxtPage",
  inheritAttrs: false,
  props: {
    name: {
      type: String
    },
    transition: {
      type: [Boolean, Object],
      default: void 0
    },
    keepalive: {
      type: [Boolean, Object],
      default: void 0
    },
    route: {
      type: Object
    },
    pageKey: {
      type: [Function, String],
      default: null
    }
  },
  setup(props, { attrs }) {
    const nuxtApp = useNuxtApp();
    const isNested = inject(isNestedKey, false);
    provide(isNestedKey, true);
    return () => {
      return h$1(RouterView, { name: props.name, route: props.route, ...attrs }, {
        default: (routeProps) => {
          var _a, _b, _c, _d;
          if (!routeProps.Component) {
            return;
          }
          const key = generateRouteKey(props.pageKey, routeProps);
          const transitionProps = (_b = (_a = props.transition) != null ? _a : routeProps.route.meta.pageTransition) != null ? _b : appPageTransition;
          return _wrapIf(
            Transition,
            transitionProps,
            wrapInKeepAlive(
              (_d = (_c = props.keepalive) != null ? _c : routeProps.route.meta.keepalive) != null ? _d : appKeepalive,
              isNested && nuxtApp.isHydrating ? h$1(Component, { key, routeProps, pageKey: key, hasTransition: !!transitionProps }) : h$1(Suspense, {
                onPending: () => nuxtApp.callHook("page:start", routeProps.Component),
                onResolve: () => nuxtApp.callHook("page:finish", routeProps.Component)
              }, { default: () => h$1(Component, { key, routeProps, pageKey: key, hasTransition: !!transitionProps }) })
            )
          ).default();
        }
      });
    };
  }
});
const Component = defineComponent({
  props: ["routeProps", "pageKey", "hasTransition"],
  setup(props) {
    const previousKey = props.pageKey;
    const previousRoute = props.routeProps.route;
    const route = {};
    for (const key in props.routeProps.route) {
      route[key] = computed(() => previousKey === props.pageKey ? props.routeProps.route[key] : previousRoute[key]);
    }
    provide("_route", reactive(route));
    return () => {
      return h$1(props.routeProps.Component);
    };
  }
});
var L = Object.defineProperty, z = Object.defineProperties, B = Object.getOwnPropertyDescriptors, b = Object.getOwnPropertySymbols, D = Object.prototype.hasOwnProperty, U = Object.prototype.propertyIsEnumerable, v = (o, t, e) => t in o ? L(o, t, { enumerable: true, configurable: true, writable: true, value: e }) : o[t] = e, h = (o, t) => {
  for (var e in t || (t = {}))
    D.call(t, e) && v(o, e, t[e]);
  if (b)
    for (var e of b(t))
      U.call(t, e) && v(o, e, t[e]);
  return o;
}, y = (o, t) => z(o, B(t));
const V = (o) => new Promise((t, e) => {
  return;
}), H = function(o, t) {
  if (!o)
    return null;
  let e = {};
  for (let r in o) {
    let s = o[r];
    t.indexOf(r) > -1 && s !== null && (e[r] = s);
  }
  return e;
}, J = (o) => o === "email";
var Y = {
  nodes: {
    horizontal_rule() {
      return {
        singleTag: "hr"
      };
    },
    blockquote() {
      return {
        tag: "blockquote"
      };
    },
    bullet_list() {
      return {
        tag: "ul"
      };
    },
    code_block(o) {
      return {
        tag: [
          "pre",
          {
            tag: "code",
            attrs: o.attrs
          }
        ]
      };
    },
    hard_break() {
      return {
        singleTag: "br"
      };
    },
    heading(o) {
      return {
        tag: `h${o.attrs.level}`
      };
    },
    image(o) {
      return {
        singleTag: [
          {
            tag: "img",
            attrs: H(o.attrs, ["src", "alt", "title"])
          }
        ]
      };
    },
    list_item() {
      return {
        tag: "li"
      };
    },
    ordered_list() {
      return {
        tag: "ol"
      };
    },
    paragraph() {
      return {
        tag: "p"
      };
    }
  },
  marks: {
    bold() {
      return {
        tag: "b"
      };
    },
    strike() {
      return {
        tag: "strike"
      };
    },
    underline() {
      return {
        tag: "u"
      };
    },
    strong() {
      return {
        tag: "strong"
      };
    },
    code() {
      return {
        tag: "code"
      };
    },
    italic() {
      return {
        tag: "i"
      };
    },
    link(o) {
      const t = h({}, o.attrs), { linktype: e = "url" } = o.attrs;
      return J(e) && (t.href = `mailto:${t.href}`), t.anchor && (t.href = `${t.href}#${t.anchor}`, delete t.anchor), {
        tag: [
          {
            tag: "a",
            attrs: t
          }
        ]
      };
    },
    styled(o) {
      return {
        tag: [
          {
            tag: "span",
            attrs: o.attrs
          }
        ]
      };
    }
  }
};
const F = function(o) {
  const t = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }, e = /[&<>"']/g, r = RegExp(e.source);
  return o && r.test(o) ? o.replace(e, (s) => t[s]) : o;
};
class R {
  constructor(t) {
    t || (t = Y), this.marks = t.marks || [], this.nodes = t.nodes || [];
  }
  addNode(t, e) {
    this.nodes[t] = e;
  }
  addMark(t, e) {
    this.marks[t] = e;
  }
  render(t = {}) {
    if (t.content && Array.isArray(t.content)) {
      let e = "";
      return t.content.forEach((r) => {
        e += this.renderNode(r);
      }), e;
    }
    return console.warn("The render method must receive an object with a content field, which is an array"), "";
  }
  renderNode(t) {
    let e = [];
    t.marks && t.marks.forEach((s) => {
      const n = this.getMatchingMark(s);
      n && e.push(this.renderOpeningTag(n.tag));
    });
    const r = this.getMatchingNode(t);
    return r && r.tag && e.push(this.renderOpeningTag(r.tag)), t.content ? t.content.forEach((s) => {
      e.push(this.renderNode(s));
    }) : t.text ? e.push(F(t.text)) : r && r.singleTag ? e.push(this.renderTag(r.singleTag, " /")) : r && r.html && e.push(r.html), r && r.tag && e.push(this.renderClosingTag(r.tag)), t.marks && t.marks.slice(0).reverse().forEach((s) => {
      const n = this.getMatchingMark(s);
      n && e.push(this.renderClosingTag(n.tag));
    }), e.join("");
  }
  renderTag(t, e) {
    return t.constructor === String ? `<${t}${e}>` : t.map((s) => {
      if (s.constructor === String)
        return `<${s}${e}>`;
      {
        let n = `<${s.tag}`;
        if (s.attrs)
          for (let a in s.attrs) {
            let i = s.attrs[a];
            i !== null && (n += ` ${a}="${i}"`);
          }
        return `${n}${e}>`;
      }
    }).join("");
  }
  renderOpeningTag(t) {
    return this.renderTag(t, "");
  }
  renderClosingTag(t) {
    return t.constructor === String ? `</${t}>` : t.slice(0).reverse().map((r) => r.constructor === String ? `</${r}>` : `</${r.tag}>`).join("");
  }
  getMatchingNode(t) {
    if (typeof this.nodes[t.type] == "function")
      return this.nodes[t.type](t);
  }
  getMatchingMark(t) {
    if (typeof this.marks[t.type] == "function")
      return this.marks[t.type](t);
  }
}
/*!
 * storyblok-js-client v4.5.2
 * Universal JavaScript SDK for Storyblok's API
 * (c) 2020-2022 Stobylok Team
 */
function w(o) {
  return typeof o == "number" && o == o && o !== 1 / 0 && o !== -1 / 0;
}
function $(o, t, e) {
  if (!w(t))
    throw new TypeError("Expected `limit` to be a finite number");
  if (!w(e))
    throw new TypeError("Expected `interval` to be a finite number");
  var r = [], s = [], n = 0, a = function() {
    n++;
    var c = setTimeout(function() {
      n--, r.length > 0 && a(), s = s.filter(function(u) {
        return u !== c;
      });
    }, e);
    s.indexOf(c) < 0 && s.push(c);
    var l = r.shift();
    l.resolve(o.apply(l.self, l.args));
  }, i = function() {
    var c = arguments, l = this;
    return new Promise(function(u, p) {
      r.push({ resolve: u, reject: p, args: c, self: l }), n < t && a();
    });
  };
  return i.abort = function() {
    s.forEach(clearTimeout), s = [], r.forEach(function(c) {
      c.reject(new throttle.AbortError());
    }), r.length = 0;
  }, i;
}
$.AbortError = function() {
  Error.call(this, "Throttled function aborted"), this.name = "AbortError";
};
const K = function(o, t) {
  if (!o)
    return null;
  let e = {};
  for (let r in o) {
    let s = o[r];
    t.indexOf(r) > -1 && s !== null && (e[r] = s);
  }
  return e;
};
var G = { nodes: { horizontal_rule: () => ({ singleTag: "hr" }), blockquote: () => ({ tag: "blockquote" }), bullet_list: () => ({ tag: "ul" }), code_block: (o) => ({ tag: ["pre", { tag: "code", attrs: o.attrs }] }), hard_break: () => ({ singleTag: "br" }), heading: (o) => ({ tag: `h${o.attrs.level}` }), image: (o) => ({ singleTag: [{ tag: "img", attrs: K(o.attrs, ["src", "alt", "title"]) }] }), list_item: () => ({ tag: "li" }), ordered_list: () => ({ tag: "ol" }), paragraph: () => ({ tag: "p" }) }, marks: { bold: () => ({ tag: "b" }), strike: () => ({ tag: "strike" }), underline: () => ({ tag: "u" }), strong: () => ({ tag: "strong" }), code: () => ({ tag: "code" }), italic: () => ({ tag: "i" }), link(o) {
  const t = h({}, o.attrs), { linktype: e = "url" } = o.attrs;
  return e === "email" && (t.href = `mailto:${t.href}`), t.anchor && (t.href = `${t.href}#${t.anchor}`, delete t.anchor), { tag: [{ tag: "a", attrs: t }] };
}, styled: (o) => ({ tag: [{ tag: "span", attrs: o.attrs }] }) } };
class Q {
  constructor(t) {
    t || (t = G), this.marks = t.marks || [], this.nodes = t.nodes || [];
  }
  addNode(t, e) {
    this.nodes[t] = e;
  }
  addMark(t, e) {
    this.marks[t] = e;
  }
  render(t = {}) {
    if (t.content && Array.isArray(t.content)) {
      let e = "";
      return t.content.forEach((r) => {
        e += this.renderNode(r);
      }), e;
    }
    return console.warn("The render method must receive an object with a content field, which is an array"), "";
  }
  renderNode(t) {
    let e = [];
    t.marks && t.marks.forEach((s) => {
      const n = this.getMatchingMark(s);
      n && e.push(this.renderOpeningTag(n.tag));
    });
    const r = this.getMatchingNode(t);
    return r && r.tag && e.push(this.renderOpeningTag(r.tag)), t.content ? t.content.forEach((s) => {
      e.push(this.renderNode(s));
    }) : t.text ? e.push(function(s) {
      const n = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }, a = /[&<>"']/g, i = RegExp(a.source);
      return s && i.test(s) ? s.replace(a, (c) => n[c]) : s;
    }(t.text)) : r && r.singleTag ? e.push(this.renderTag(r.singleTag, " /")) : r && r.html && e.push(r.html), r && r.tag && e.push(this.renderClosingTag(r.tag)), t.marks && t.marks.slice(0).reverse().forEach((s) => {
      const n = this.getMatchingMark(s);
      n && e.push(this.renderClosingTag(n.tag));
    }), e.join("");
  }
  renderTag(t, e) {
    return t.constructor === String ? `<${t}${e}>` : t.map((r) => {
      if (r.constructor === String)
        return `<${r}${e}>`;
      {
        let s = `<${r.tag}`;
        if (r.attrs)
          for (let n in r.attrs) {
            let a = r.attrs[n];
            a !== null && (s += ` ${n}="${a}"`);
          }
        return `${s}${e}>`;
      }
    }).join("");
  }
  renderOpeningTag(t) {
    return this.renderTag(t, "");
  }
  renderClosingTag(t) {
    return t.constructor === String ? `</${t}>` : t.slice(0).reverse().map((e) => e.constructor === String ? `</${e}>` : `</${e.tag}>`).join("");
  }
  getMatchingNode(t) {
    if (typeof this.nodes[t.type] == "function")
      return this.nodes[t.type](t);
  }
  getMatchingMark(t) {
    if (typeof this.marks[t.type] == "function")
      return this.marks[t.type](t);
  }
}
const W = (o = 0, t = o) => {
  const e = Math.abs(t - o) || 0, r = o < t ? 1 : -1;
  return ((s = 0, n) => [...Array(s)].map(n))(e, (s, n) => n * r + o);
}, k = (o, t, e) => {
  const r = [];
  for (const s in o) {
    if (!Object.prototype.hasOwnProperty.call(o, s))
      continue;
    const n = o[s], a = e ? "" : encodeURIComponent(s);
    let i;
    i = typeof n == "object" ? k(n, t ? t + encodeURIComponent("[" + a + "]") : a, Array.isArray(n)) : (t ? t + encodeURIComponent("[" + a + "]") : a) + "=" + encodeURIComponent(n), r.push(i);
  }
  return r.join("&");
};
let f = {}, d = {};
class X {
  constructor(t, e) {
    if (!e) {
      let n = t.region ? `-${t.region}` : "", a = t.https === false ? "http" : "https";
      e = t.oauthToken === void 0 ? `${a}://api${n}.storyblok.com/v2` : `${a}://api${n}.storyblok.com/v1`;
    }
    let r = Object.assign({}, t.headers), s = 5;
    t.oauthToken !== void 0 && (r.Authorization = t.oauthToken, s = 3), t.rateLimit !== void 0 && (s = t.rateLimit), this.richTextResolver = new Q(t.richTextSchema), typeof t.componentResolver == "function" && this.setComponentResolver(t.componentResolver), this.maxRetries = t.maxRetries || 5, this.throttle = $(this.throttledRequest, s, 1e3), this.accessToken = t.accessToken, this.relations = {}, this.links = {}, this.cache = t.cache || { clear: "manual" }, this.client = q.create({ baseURL: e, timeout: t.timeout || 0, headers: r, proxy: t.proxy || false }), t.responseInterceptor && this.client.interceptors.response.use((n) => t.responseInterceptor(n)), this.resolveNestedRelations = t.resolveNestedRelations || true;
  }
  setComponentResolver(t) {
    this.richTextResolver.addNode("blok", (e) => {
      let r = "";
      return e.attrs.body.forEach((s) => {
        r += t(s.component, s);
      }), { html: r };
    });
  }
  parseParams(t = {}) {
    return t.version || (t.version = "published"), t.token || (t.token = this.getToken()), t.cv || (t.cv = d[t.token]), Array.isArray(t.resolve_relations) && (t.resolve_relations = t.resolve_relations.join(",")), t;
  }
  factoryParamOptions(t, e = {}) {
    return ((r = "") => r.indexOf("/cdn/") > -1)(t) ? this.parseParams(e) : e;
  }
  makeRequest(t, e, r, s) {
    const n = this.factoryParamOptions(t, ((a = {}, i = 25, c = 1) => y(h({}, a), { per_page: i, page: c }))(e, r, s));
    return this.cacheResponse(t, n);
  }
  get(t, e) {
    let r = `/${t}`;
    const s = this.factoryParamOptions(r, e);
    return this.cacheResponse(r, s);
  }
  async getAll(t, e = {}, r) {
    const s = e.per_page || 25, n = `/${t}`, a = n.split("/");
    r = r || a[a.length - 1];
    const i = await this.makeRequest(n, e, s, 1), c = Math.ceil(i.total / s);
    return ((l = [], u) => l.map(u).reduce((p, O) => [...p, ...O], []))([i, ...await (async (l = [], u) => Promise.all(l.map(u)))(W(1, c), async (l) => this.makeRequest(n, e, s, l + 1))], (l) => Object.values(l.data[r]));
  }
  post(t, e) {
    let r = `/${t}`;
    return this.throttle("post", r, e);
  }
  put(t, e) {
    let r = `/${t}`;
    return this.throttle("put", r, e);
  }
  delete(t, e) {
    let r = `/${t}`;
    return this.throttle("delete", r, e);
  }
  getStories(t) {
    return this.get("cdn/stories", t);
  }
  getStory(t, e) {
    return this.get(`cdn/stories/${t}`, e);
  }
  setToken(t) {
    this.accessToken = t;
  }
  getToken() {
    return this.accessToken;
  }
  _cleanCopy(t) {
    return JSON.parse(JSON.stringify(t));
  }
  _insertLinks(t, e) {
    const r = t[e];
    r && r.fieldtype == "multilink" && r.linktype == "story" && typeof r.id == "string" && this.links[r.id] ? r.story = this._cleanCopy(this.links[r.id]) : r && r.linktype === "story" && typeof r.uuid == "string" && this.links[r.uuid] && (r.story = this._cleanCopy(this.links[r.uuid]));
  }
  _insertRelations(t, e, r) {
    if (r.indexOf(t.component + "." + e) > -1) {
      if (typeof t[e] == "string")
        this.relations[t[e]] && (t[e] = this._cleanCopy(this.relations[t[e]]));
      else if (t[e].constructor === Array) {
        let s = [];
        t[e].forEach((n) => {
          this.relations[n] && s.push(this._cleanCopy(this.relations[n]));
        }), t[e] = s;
      }
    }
  }
  _insertAssetsRelations(t, e) {
    e.forEach((r) => {
      t.id === r.id && (t.original = r, t.original.filename = t.filename, t.original.filename = t.original.filename.includes("https://s3.amazonaws.com/") ? t.original.filename : t.original.filename.replace("https://", "https://s3.amazonaws.com/"), delete t.original.s3_filename);
    });
  }
  iterateTree(t, e) {
    let r = (s) => {
      if (s != null) {
        if (s.constructor === Array)
          for (let n = 0; n < s.length; n++)
            r(s[n]);
        else if (s.constructor === Object) {
          if (s._stopResolving)
            return;
          for (let n in s)
            s.component && s._uid || s.type === "link" ? (this._insertRelations(s, n, e), this._insertLinks(s, n)) : "id" in s && s.fieldtype === "asset" && this._insertAssetsRelations(s, e), r(s[n]);
        }
      }
    };
    r(t.content);
  }
  async resolveLinks(t, e) {
    let r = [];
    if (t.link_uuids) {
      const s = t.link_uuids.length;
      let n = [];
      const a = 50;
      for (let i = 0; i < s; i += a) {
        const c = Math.min(s, i + a);
        n.push(t.link_uuids.slice(i, c));
      }
      for (let i = 0; i < n.length; i++)
        (await this.getStories({ per_page: a, language: e.language, version: e.version, by_uuids: n[i].join(",") })).data.stories.forEach((c) => {
          r.push(c);
        });
    } else
      r = t.links;
    r.forEach((s) => {
      this.links[s.uuid] = y(h({}, s), { _stopResolving: true });
    });
  }
  async resolveRelations(t, e) {
    let r = [];
    if (t.rel_uuids) {
      const s = t.rel_uuids.length;
      let n = [];
      const a = 50;
      for (let i = 0; i < s; i += a) {
        const c = Math.min(s, i + a);
        n.push(t.rel_uuids.slice(i, c));
      }
      for (let i = 0; i < n.length; i++)
        (await this.getStories({ per_page: a, language: e.language, version: e.version, by_uuids: n[i].join(",") })).data.stories.forEach((c) => {
          r.push(c);
        });
    } else
      r = t.rels;
    r.forEach((s) => {
      this.relations[s.uuid] = y(h({}, s), { _stopResolving: true });
    });
  }
  async resolveStories(t, e) {
    let r = [];
    if (e.resolve_relations !== void 0 && e.resolve_relations.length > 0 && (t.rels || t.rel_uuids) && (r = e.resolve_relations.split(","), await this.resolveRelations(t, e)), ["1", "story", "url"].indexOf(e.resolve_links) > -1 && (t.links || t.link_uuids) && await this.resolveLinks(t, e), this.resolveNestedRelations)
      for (const s in this.relations)
        this.iterateTree(this.relations[s], r);
    t.story ? this.iterateTree(t.story, r) : t.stories.forEach((s) => {
      this.iterateTree(s, r);
    });
  }
  resolveAssetsRelations(t) {
    const { assets: e, stories: r, story: s } = t;
    if (r)
      for (const n of r)
        this.iterateTree(n, e);
    else {
      if (!s)
        return t;
      this.iterateTree(s, e);
    }
  }
  cacheResponse(t, e, r) {
    return r === void 0 && (r = 0), new Promise(async (s, n) => {
      let a = k({ url: t, params: e }), i = this.cacheProvider();
      if (this.cache.clear === "auto" && e.version === "draft" && await this.flushCache(), e.version === "published" && t != "/cdn/spaces/me") {
        const l = await i.get(a);
        if (l)
          return s(l);
      }
      try {
        let l = await this.throttle("get", t, { params: e, paramsSerializer: (p) => k(p) }), u = { data: l.data, headers: l.headers };
        if (u.data.assets && u.data.assets.length && this.resolveAssetsRelations(u.data), l.headers["per-page"] && (u = Object.assign({}, u, { perPage: parseInt(l.headers["per-page"]), total: parseInt(l.headers.total) })), l.status != 200)
          return n(l);
        (u.data.story || u.data.stories) && await this.resolveStories(u.data, e), e.version === "published" && t != "/cdn/spaces/me" && i.set(a, u), u.data.cv && (e.version == "draft" && d[e.token] != u.data.cv && this.flushCache(), d[e.token] = u.data.cv), s(u);
      } catch (l) {
        if (l.response && l.response.status === 429 && (r += 1) < this.maxRetries)
          return console.log(`Hit rate limit. Retrying in ${r} seconds.`), await (c = 1e3 * r, new Promise((u) => setTimeout(u, c))), this.cacheResponse(t, e, r).then(s).catch(n);
        n(l);
      }
      var c;
    });
  }
  throttledRequest(t, e, r) {
    return this.client[t](e, r);
  }
  cacheVersions() {
    return d;
  }
  cacheVersion() {
    return d[this.accessToken];
  }
  setCacheVersion(t) {
    this.accessToken && (d[this.accessToken] = t);
  }
  cacheProvider() {
    return this.cache.type === "memory" ? { get: (t) => f[t], getAll: () => f, set(t, e) {
      f[t] = e;
    }, flush() {
      f = {};
    } } : { get() {
    }, getAll() {
    }, set() {
    }, flush() {
    } };
  }
  async flushCache() {
    return await this.cacheProvider().flush(), this;
  }
}
const at = (o = {}) => {
  const { apiOptions: t } = o;
  if (!t.accessToken) {
    console.error("You need to provide an access token to interact with Storyblok API. Read https://www.storyblok.com/docs/api/content-delivery#topics/authentication");
    return;
  }
  return { storyblokApi: new X(t) };
};
var Z = (o) => {
  if (typeof o != "object" || typeof o._editable > "u")
    return {};
  const t = JSON.parse(o._editable.replace(/^<!--#storyblok#/, "").replace(/-->$/, ""));
  return {
    "data-blok-c": JSON.stringify(t),
    "data-blok-uid": t.id + "-" + t.uid
  };
};
let m;
const et = (o, t, e = {}) => {
}, rt = (o = {}) => {
  const {
    bridge: t,
    accessToken: e,
    use: r = [],
    apiOptions: s = {},
    richText: n = {}
  } = o;
  s.accessToken = s.accessToken || e;
  const a = { bridge: t, apiOptions: s };
  let i = {};
  return r.forEach((c) => {
    i = h(h({}, i), c(a));
  }), t !== false && V(), m = new R(n.schema), n.resolver && E(m, n.resolver), i;
}, E = (o, t) => {
  o.addNode("blok", (e) => {
    let r = "";
    return e.attrs.body.forEach((s) => {
      r += t(s.component, s);
    }), {
      html: r
    };
  });
}, st = /* @__PURE__ */ defineComponent({
  __name: "StoryblokComponent",
  props: {
    blok: null
  },
  setup(o) {
    return (t, e) => (openBlock(), createBlock(resolveDynamicComponent(o.blok.component), normalizeProps(guardReactiveProps({ ...t.$props, ...t.$attrs })), null, 16));
  }
}), ot = {
  beforeMount(o, t) {
    if (t.value) {
      const e = Z(t.value);
      o.setAttribute("data-blok-c", e["data-blok-c"]), o.setAttribute("data-blok-uid", e["data-blok-uid"]), o.classList.add("storyblok__outline");
    }
  }
}, S = (o) => {
  console.error(`You can't use ${o} if you're not loading apiPlugin. Please provide it on StoryblokVue initialization.
    `);
};
let g = null;
const ut = async (o, t = {}, e = {}) => {
  const r = ref(null);
  if (onMounted(() => {
    r.value && r.value.id && et(
      r.value.id,
      (s) => r.value = s,
      e
    );
  }), g) {
    const { data: s } = await g.get(
      `cdn/stories/${o}`,
      t
    );
    r.value = s.story;
  } else
    S("useStoryblok");
  return r;
}, ht = {
  install(o, t = {}) {
    o.directive("editable", ot), o.component("StoryblokComponent", st);
    const { storyblokApi: e } = rt(t);
    g = e;
  }
};
const meta$2 = void 0;
const meta$1 = void 0;
const meta = void 0;
const _routes = [
  {
    name: "Home",
    path: "/Home",
    file: "/Users/claudiabenito/Documents/code/marina-portfolio/pages/Home.vue",
    children: [],
    meta: meta$2,
    alias: [],
    component: () => import('./_nuxt/Home.9653434f.mjs').then((m2) => m2.default || m2)
  },
  {
    name: "index",
    path: "/",
    file: "/Users/claudiabenito/Documents/code/marina-portfolio/pages/index.vue",
    children: [],
    meta: meta$1,
    alias: [],
    component: () => import('./_nuxt/index.ca56cbd0.mjs').then((m2) => m2.default || m2)
  },
  {
    name: "vcalong",
    path: "/vcalong",
    file: "/Users/claudiabenito/Documents/code/marina-portfolio/pages/vcalong.vue",
    children: [],
    meta,
    alias: [],
    component: () => import('./_nuxt/vcalong.7959f87d.mjs').then((m2) => m2.default || m2)
  }
];
const configRouterOptions = {};
const routerOptions = {
  ...configRouterOptions
};
const globalMiddleware = [];
const namedMiddleware = {};
const node_modules_nuxt_dist_pages_runtime_router_mjs_qNv5Ky2ZmB = defineNuxtPlugin(async (nuxtApp) => {
  var _a, _b, _c, _d;
  let __temp, __restore;
  nuxtApp.vueApp.component("NuxtPage", NuxtPage);
  nuxtApp.vueApp.component("NuxtNestedPage", NuxtPage);
  nuxtApp.vueApp.component("NuxtChild", NuxtPage);
  let routerBase = useRuntimeConfig().app.baseURL;
  if (routerOptions.hashMode && !routerBase.includes("#")) {
    routerBase += "#";
  }
  const history = (_b = (_a = routerOptions.history) == null ? void 0 : _a.call(routerOptions, routerBase)) != null ? _b : createMemoryHistory(routerBase);
  const routes = (_d = (_c = routerOptions.routes) == null ? void 0 : _c.call(routerOptions, _routes)) != null ? _d : _routes;
  const initialURL = nuxtApp.ssrContext.url;
  const router = createRouter({
    ...routerOptions,
    history,
    routes
  });
  nuxtApp.vueApp.use(router);
  const previousRoute = shallowRef(router.currentRoute.value);
  router.afterEach((_to, from) => {
    previousRoute.value = from;
  });
  Object.defineProperty(nuxtApp.vueApp.config.globalProperties, "previousRoute", {
    get: () => previousRoute.value
  });
  const _route = shallowRef(router.resolve(initialURL));
  const syncCurrentRoute = () => {
    _route.value = router.currentRoute.value;
  };
  nuxtApp.hook("page:finish", syncCurrentRoute);
  router.afterEach((to, from) => {
    var _a2, _b2, _c2, _d2;
    if (((_b2 = (_a2 = to.matched[0]) == null ? void 0 : _a2.components) == null ? void 0 : _b2.default) === ((_d2 = (_c2 = from.matched[0]) == null ? void 0 : _c2.components) == null ? void 0 : _d2.default)) {
      syncCurrentRoute();
    }
  });
  const route = {};
  for (const key in _route.value) {
    route[key] = computed(() => _route.value[key]);
  }
  nuxtApp._route = reactive(route);
  nuxtApp._middleware = nuxtApp._middleware || {
    global: [],
    named: {}
  };
  useError();
  try {
    if (true) {
      ;
      [__temp, __restore] = executeAsync(() => router.push(initialURL)), await __temp, __restore();
      ;
    }
    ;
    [__temp, __restore] = executeAsync(() => router.isReady()), await __temp, __restore();
    ;
  } catch (error2) {
    callWithNuxt(nuxtApp, showError, [error2]);
  }
  const initialLayout = useState("_layout");
  router.beforeEach(async (to, from) => {
    var _a2, _b2;
    to.meta = reactive(to.meta);
    if (nuxtApp.isHydrating) {
      to.meta.layout = (_a2 = initialLayout.value) != null ? _a2 : to.meta.layout;
    }
    nuxtApp._processingMiddleware = true;
    const middlewareEntries = /* @__PURE__ */ new Set([...globalMiddleware, ...nuxtApp._middleware.global]);
    for (const component of to.matched) {
      const componentMiddleware = component.meta.middleware;
      if (!componentMiddleware) {
        continue;
      }
      if (Array.isArray(componentMiddleware)) {
        for (const entry2 of componentMiddleware) {
          middlewareEntries.add(entry2);
        }
      } else {
        middlewareEntries.add(componentMiddleware);
      }
    }
    for (const entry2 of middlewareEntries) {
      const middleware = typeof entry2 === "string" ? nuxtApp._middleware.named[entry2] || await ((_b2 = namedMiddleware[entry2]) == null ? void 0 : _b2.call(namedMiddleware).then((r) => r.default || r)) : entry2;
      if (!middleware) {
        throw new Error(`Unknown route middleware: '${entry2}'.`);
      }
      const result = await callWithNuxt(nuxtApp, middleware, [to, from]);
      {
        if (result === false || result instanceof Error) {
          const error2 = result || createError$1({
            statusMessage: `Route navigation aborted: ${initialURL}`
          });
          return callWithNuxt(nuxtApp, showError, [error2]);
        }
      }
      if (result || result === false) {
        return result;
      }
    }
  });
  router.afterEach(async (to) => {
    delete nuxtApp._processingMiddleware;
    if (to.matched.length === 0) {
      callWithNuxt(nuxtApp, showError, [createError$1({
        statusCode: 404,
        fatal: false,
        statusMessage: `Page not found: ${to.fullPath}`
      })]);
    } else if (to.matched[0].name === "404" && nuxtApp.ssrContext) {
      nuxtApp.ssrContext.event.res.statusCode = 404;
    } else {
      const currentURL = to.fullPath || "/";
      if (!isEqual(currentURL, initialURL)) {
        await callWithNuxt(nuxtApp, navigateTo, [currentURL]);
      }
    }
  });
  nuxtApp.hooks.hookOnce("app:created", async () => {
    try {
      await router.replace({
        ...router.resolve(initialURL),
        name: void 0,
        force: true
      });
    } catch (error2) {
      callWithNuxt(nuxtApp, showError, [error2]);
    }
  });
  return { provide: { router } };
});
const node_modules__64storyblok_nuxt_src_runtime_plugin_js_9mZ8bwCWc9 = defineNuxtPlugin(({ vueApp }) => {
  let { storyblok } = useRuntimeConfig();
  storyblok = JSON.parse(JSON.stringify(storyblok));
  vueApp.use(ht, { ...storyblok, use: [at] });
});
const _plugins = [
  _nuxt_components_plugin_mjs_KR1HBZs4kY,
  node_modules_nuxt_dist_head_runtime_lib_vueuse_head_plugin_mjs_D7WGfuP1A0,
  node_modules_nuxt_dist_head_runtime_plugin_mjs_1QO0gqa6n2,
  node_modules_nuxt_dist_pages_runtime_router_mjs_qNv5Ky2ZmB,
  node_modules__64storyblok_nuxt_src_runtime_plugin_js_9mZ8bwCWc9
];
const _sfc_main$1 = {
  __name: "nuxt-root",
  __ssrInlineRender: true,
  setup(__props) {
    const ErrorComponent = defineAsyncComponent(() => import('./_nuxt/error-component.f7aff29b.mjs').then((r) => r.default || r));
    const nuxtApp = useNuxtApp();
    provide("_route", useRoute());
    nuxtApp.hooks.callHookWith((hooks) => hooks.map((hook) => hook()), "vue:setup");
    const error = useError();
    onErrorCaptured((err, target, info) => {
      nuxtApp.hooks.callHook("vue:error", err, target, info).catch((hookError) => console.error("[nuxt] Error in `vue:error` hook", hookError));
      {
        callWithNuxt(nuxtApp, showError, [err]);
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_App = resolveComponent("App");
      ssrRenderSuspense(_push, {
        default: () => {
          if (unref(error)) {
            _push(ssrRenderComponent(unref(ErrorComponent), { error: unref(error) }, null, _parent));
          } else {
            _push(ssrRenderComponent(_component_App, null, null, _parent));
          }
        },
        _: 1
      });
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-root.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const layouts = {};
const __nuxt_component_0 = defineComponent({
  props: {
    name: {
      type: [String, Boolean, Object],
      default: null
    }
  },
  setup(props, context) {
    const route = useRoute();
    return () => {
      var _a, _b, _c;
      const layout = (_b = (_a = isRef(props.name) ? props.name.value : props.name) != null ? _a : route.meta.layout) != null ? _b : "default";
      const hasLayout = layout && layout in layouts;
      const transitionProps = (_c = route.meta.layoutTransition) != null ? _c : appLayoutTransition;
      return _wrapIf(Transition, hasLayout && transitionProps, {
        default: () => {
          return _wrapIf(layouts[layout], hasLayout, context.slots).default();
        }
      }).default();
    };
  }
});
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const _sfc_main = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  const _component_NuxtLayout = __nuxt_component_0;
  const _component_NuxtPage = resolveComponent("NuxtPage");
  _push(ssrRenderComponent(_component_NuxtLayout, _attrs, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(ssrRenderComponent(_component_NuxtPage, null, null, _parent2, _scopeId));
      } else {
        return [
          createVNode(_component_NuxtPage)
        ];
      }
    }),
    _: 1
  }, _parent));
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/pages/runtime/app.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const AppComponent = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
if (!globalThis.$fetch) {
  globalThis.$fetch = $fetch.create({
    baseURL: baseURL()
  });
}
let entry;
const plugins = normalizePlugins(_plugins);
{
  entry = async function createNuxtAppServer(ssrContext) {
    const vueApp = createApp(_sfc_main$1);
    vueApp.component("App", AppComponent);
    const nuxt = createNuxtApp({ vueApp, ssrContext });
    try {
      await applyPlugins(nuxt, plugins);
      await nuxt.hooks.callHook("app:created", vueApp);
    } catch (err) {
      await nuxt.callHook("app:error", err);
      nuxt.payload.error = nuxt.payload.error || err;
    }
    return vueApp;
  };
}
const entry$1 = (ctx) => entry(ctx);

export { _export_sfc as _, useHead as a, __nuxt_component_0$1 as b, entry$1 as default, ut as u };
//# sourceMappingURL=server.mjs.map
