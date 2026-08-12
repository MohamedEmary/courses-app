import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { cookieParser, parseCookies } from "@/middleware/cookieParser.ts";

describe("parseCookies", () => {
  it("returns an empty object for an undefined header", () => {
    expect(parseCookies(undefined)).toEqual({});
  });

  it("parses simple cookies", () => {
    expect(parseCookies("a=1; b=2")).toEqual({ a: "1", b: "2" });
  });

  it("splits only on the first '=' so values may contain '='", () => {
    expect(parseCookies("token=abc=def")).toEqual({ token: "abc=def" });
  });

  it("URL-decodes cookie values", () => {
    expect(parseCookies("name=John%20Doe")).toEqual({ name: "John Doe" });
  });

  it("ignores cookies with malformed percent-encoding", () => {
    expect(parseCookies("a=%zz; b=2")).toEqual({ b: "2" });
  });

  it("ignores pairs without an equals sign", () => {
    expect(parseCookies("justaname; b=2")).toEqual({ b: "2" });
  });

  it("ignores empty cookie names", () => {
    expect(parseCookies("=value; b=2")).toEqual({ b: "2" });
  });

  it("trims whitespace around names and values", () => {
    expect(parseCookies(" a = 1 ")).toEqual({ a: "1" });
  });
});

describe("cookieParser middleware", () => {
  it("attaches parsed cookies to req.cookies and calls next", () => {
    const req = {
      headers: { cookie: "a=1; b=2" },
    } as unknown as Request & { cookies: Record<string, string> };
    const next = vi.fn() as unknown as NextFunction;

    cookieParser(req, {} as Response, next);

    expect(req.cookies).toEqual({ a: "1", b: "2" });
    expect(next).toHaveBeenCalledOnce();
  });

  it("defaults to an empty object when there is no cookie header", () => {
    const req = { headers: {} } as unknown as Request & {
      cookies: Record<string, string>;
    };
    const next = vi.fn() as unknown as NextFunction;

    cookieParser(req, {} as Response, next);

    expect(req.cookies).toEqual({});
    expect(next).toHaveBeenCalledOnce();
  });
});
