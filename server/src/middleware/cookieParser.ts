import type { RequestHandler } from "express";

/**
 * Parse a `Cookie` request header into a plain object of name -> value pairs.
 * Cookies with malformed encoding or missing names are skipped.
 *
 * @param {string | undefined} header - The raw `Cookie` header value.
 * @returns {Record<string, string>} The parsed cookies.
 */
const parseCookies = (header: string | undefined): Record<string, string> => {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;

  for (const pair of header.split(";")) {
    // split at the FIRST "=" only, since values may themselves contain "="
    const sep = pair.indexOf("=");
    if (sep === -1) continue;

    const name = pair.slice(0, sep).trim();
    if (!name) continue;

    try {
      cookies[name] = decodeURIComponent(pair.slice(sep + 1).trim());
    } catch {
      // ignore cookies with malformed percent-encoding (e.g. "%zz")
    }
  }

  return cookies;
};

/**
 * Express middleware that attaches the parsed cookies to `req.cookies`.
 *
 * @param {import("express").Request} req - Receives the parsed `cookies` object.
 * @param {import("express").Response} _res - Unused.
 * @param {import("express").NextFunction} next - Calls the next middleware.
 * @returns {void}
 */
const cookieParser: RequestHandler = (req, _res, next) => {
  req.cookies = parseCookies(req.headers.cookie);
  next();
};

export { cookieParser, parseCookies };
