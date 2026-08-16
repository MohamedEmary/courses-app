/**
 * Workaround for a Bruno bug: fixes variable chaining in the Bruno API docs
 * page (index.html). NOT part of the API (that lives in `server/`).
 *
 * VISITORS: ignore this file. It only patches the docs viewer inside the
 * generated page; it never runs as part of the API.
 *
 * WHY: the docs viewer drops post-response variables (AUTH_TOKEN, USER_ID,
 * COURSE_ID), so later requests lose auth. This script captures them from
 * responses (fetch + XMLHttpRequest), stores them in localStorage, and
 * re-injects them into later requests.
 *
 * HOW TO LINK: index.html must load it after the api-docs.js script tag, and
 * the tag is dropped on every regeneration:
 *   <script src="bruno/api-docs-fix.js"></script>
 *
 * CONFIG: new captured value -> CAPTURE_RULES; new /:id route -> URL_ID_RULES;
 * new deploy host -> API_URL_PATTERN (all below).
 *
 * DUAL MODE (single file, two jobs):
 * - Browser: loaded by index.html (see HOW TO LINK) and patches the viewer.
 * - Node: run `node bruno/api-docs-fix.js` to ensure index.html links this
 *   file again after a regeneration. Used by .githooks/pre-commit and the
 *   `pnpm docs:link` script.
 */

(() => {
  "use strict";

  // ---- Node mode: re-link index.html after a regeneration ----
  var fs = null;
  try {
    fs = require("node:fs");
  } catch (err) {
    // browser context: require is not defined
  }

  if (fs) {
    var nodePath = require("node:path");
    var indexPath = nodePath.join(__dirname, "..", "index.html");
    var TAG = '<script src="bruno/api-docs-fix.js"></script>';
    var ANCHOR =
      /([ \t]*)(<script src="https:\/\/cdn\.usebruno\.com\/api-docs\/api-docs\.js"><\/script>)/;

    try {
      var html = fs.readFileSync(indexPath, "utf8");
      if (html.includes(TAG)) {
        console.log("index.html already links api-docs-fix.js; nothing to do");
      } else {
        var match = html.match(ANCHOR);
        var next = match
          ? html.replace(ANCHOR, function (_m, indent, tag) {
              return indent + tag + "\n" + indent + TAG;
            })
          : html.replace("</head>", "    " + TAG + "\n</head>");
        fs.writeFileSync(indexPath, next);
        console.log(
          match
            ? "linked api-docs-fix.js after the api-docs.js tag"
            : "api-docs.js tag not found; linked api-docs-fix.js before </head>"
        );
      }
    } catch (err) {
      console.warn(
        "api-docs-fix: could not read " + indexPath + ": " + err.message
      );
    }
    return;
  }

  // ---- browser mode: patch the docs viewer ----

  var STORAGE_KEY = "coursesApp.apiDocs.vars";
  var API_URL_PATTERN = /onrender\.com\/api|localhost:3000\/api/;

  /* Variables captured from JSend `data` responses (dot-path into `data`).
     Append an entry here when a new endpoint returns a value to persist. */
  var CAPTURE_RULES = [
    { name: "AUTH_TOKEN", path: "accessToken" },
    { name: "USER_ID", path: "user.id" },
    { name: "COURSE_ID", path: "course._id" },
  ];

  /* Id-bearing URL segments. The viewer resolves {{VARIABLE}} to "" before
     sending, leaving a trailing "/segment/". The script fills it from storage
     and blocks the request when the variable is unset. Append an entry here
     for every path param that depends on an earlier request. */
  var URL_ID_RULES = [
    { variable: "COURSE_ID", segment: "course" },
    { variable: "USER_ID", segment: "users" },
  ];

  function loadVars() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (err) {
      return {};
    }
  }

  function saveVars(vars) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vars));
    } catch (err) {
      /* localStorage unavailable; requests just run without auth */
    }
  }

  /* Read a dot-path (e.g. "user.id") off an object. */
  function getByPath(obj, path) {
    return path.split(".").reduce(function (acc, key) {
      return acc == null ? undefined : acc[key];
    }, obj);
  }

  /* Capture configured variables out of any JSend response. */
  function capture(json) {
    if (!json || typeof json !== "object" || !json.data) return;
    var vars = loadVars();
    var changed = false;
    CAPTURE_RULES.forEach(function (rule) {
      var value = getByPath(json.data, rule.path);
      if (value !== undefined && value !== null && value !== "") {
        vars[rule.name] = value;
        changed = true;
      }
    });
    if (changed) saveVars(vars);
  }

  /* Precompile each rule's regexes once: the {{VARIABLE}} placeholder and the
     trailing empty id segment (e.g. ".../course/") the viewer leaves behind. */
  URL_ID_RULES.forEach(function (rule) {
    rule.placeholder = new RegExp("\\{\\{" + rule.variable + "\\}\\}", "g");
    rule.segmentEnd = new RegExp("/" + rule.segment + "/$");
  });

  /* Interpolate id variables into a request URL and report a missing one.
     Handles both forms: a raw {{VARIABLE}} placeholder, and the trailing
     "/segment/" the viewer leaves when it resolves the placeholder to "".
     Returns { url, missing }; missing is null when every id is present. */
  function resolveUrl(url) {
    var vars = loadVars();
    var missing = null;
    URL_ID_RULES.forEach(function (rule) {
      var id = vars[rule.variable];
      url = url.replace(rule.placeholder, id || "");
      if (rule.segmentEnd.test(url)) {
        if (id) {
          url = url.replace(rule.segmentEnd, "/" + rule.segment + "/" + id);
        } else {
          missing = rule.variable + " is not set";
        }
      }
    });
    return { url: url, missing: missing };
  }

  /* JSend error body shared by both blocked-response paths. */
  function missingBody(missing) {
    return JSON.stringify({ status: "error", message: missing });
  }

  /* Builds a synthetic 400 JSON response so the viewer shows the message in
     its response panel without sending a request or popping an alert. */
  function missingResponse(missing) {
    return new Response(missingBody(missing), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  /* Simulates a completed 400 response on an XMLHttpRequest so the viewer
     shows the message without sending a request or popping an alert. */
  function xhrRespondMissing(xhr, missing) {
    var body = missingBody(missing);
    var props = {
      readyState: { value: 4, configurable: true },
      status: { value: 400, configurable: true },
      statusText: { value: "Bad Request", configurable: true },
      responseText: { value: body, configurable: true },
      response: { value: body, configurable: true },
    };
    Object.keys(props).forEach(function (key) {
      try {
        Object.defineProperty(xhr, key, props[key]);
      } catch (err) {
        /* some properties are non-configurable in some browsers; ignore */
      }
    });
    try {
      xhr.dispatchEvent(new Event("load"));
    } catch (err) {
      // ignore
    }
  }

  function authHeader() {
    var vars = loadVars();
    return vars.AUTH_TOKEN ? "Bearer " + vars.AUTH_TOKEN : null;
  }

  /* Override the header only when it is absent, empty, a bare "Bearer", or an
     unresolved {{AUTH_TOKEN}} placeholder. Otherwise respect an existing
     token. */
  function needsAuthOverride(existing) {
    if (!existing) return true;
    existing = existing.trim();
    return !existing || existing === "Bearer" || existing.indexOf("{{") !== -1;
  }

  /* Parse response text and capture variables; ignores non-JSON bodies. */
  function captureText(text) {
    try {
      capture(JSON.parse(text));
    } catch (err) {
      // not JSON; ignore
    }
  }

  // ---- fetch ----
  var origFetch = window.fetch;
  if (origFetch) {
    window.fetch = function (input, init) {
      init = init || {};
      var url = typeof input === "string" ? input : (input && input.url) || "";

      if (API_URL_PATTERN.test(url)) {
        var resolved = resolveUrl(url);
        if (resolved.missing) {
          console.warn("[api-docs-fix]", resolved.missing);
          return Promise.resolve(missingResponse(resolved.missing));
        }
        var headers = new Headers(init.headers);
        var auth = authHeader();
        if (auth && needsAuthOverride(headers.get("Authorization"))) {
          headers.set("Authorization", auth);
        }
        init = Object.assign({}, init, {
          headers: headers,
          credentials: "include",
        });
        input =
          typeof input === "string"
            ? resolved.url
            : new Request(resolved.url, input);
      }

      return origFetch.call(this, input, init).then(function (response) {
        response
          .clone()
          .text()
          .then(captureText)
          .catch(function () {});
        return response;
      });
    };
  }

  // ---- XMLHttpRequest ----
  var origOpen = XMLHttpRequest.prototype.open;
  var origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    var resolved = resolveUrl(url || "");
    this.__fixUrl = resolved.url;
    this.__fixMissing = resolved.missing;
    return origOpen.call(this, method, this.__fixUrl);
  };

  XMLHttpRequest.prototype.send = function (body) {
    if (API_URL_PATTERN.test(this.__fixUrl || "")) {
      if (this.__fixMissing) {
        console.warn("[api-docs-fix]", this.__fixMissing);
        xhrRespondMissing(this, this.__fixMissing);
        return;
      }
      var auth = authHeader();
      var existing = "";
      try {
        existing = this.getRequestHeader("Authorization") || "";
      } catch (err) {
        // ignore
      }
      if (auth && needsAuthOverride(existing)) {
        this.setRequestHeader("Authorization", auth);
      }
      this.withCredentials = true;
    }
    this.addEventListener("load", function () {
      captureText(this.responseText);
    });
    return origSend.apply(this, arguments);
  };
})();
