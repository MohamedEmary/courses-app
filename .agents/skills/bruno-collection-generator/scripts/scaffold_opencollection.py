#!/usr/bin/env python3
"""Scaffold Bruno OpenCollection YAML request files from endpoint metadata.

The input is a JSON array of endpoint objects. This script intentionally uses
only the Python standard library so it can run in most agent environments.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any, Dict, Iterable, List

HTTP_METHODS = {"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD", "TRACE", "CONNECT"}

# Refuse pathologically large inputs so failure is predictable rather than OOM.
MAX_INPUT_BYTES = 5 * 1024 * 1024

# Strings YAML would otherwise read as booleans or null.
YAML_BOOL_NULL = {"true", "false", "null", "~", "yes", "no", "on", "off"}
# Leading characters that make a plain YAML scalar ambiguous or invalid
# (alias, anchor, tag, flow markers, comments, block scalars, etc.).
YAML_LEADING_INDICATORS = set("!&*?|>%@`#,[]{}\"'- ")
NUMBER_RE = re.compile(r"^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$")


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "request"


def quote(value: Any) -> str:
    if value is None:
        return '""'
    text = str(value)
    if text == "":
        return '""'
    if (
        text.lower() in YAML_BOOL_NULL
        # Leading/trailing whitespace is lost in a plain scalar.
        or text != text.strip()
        # Bare numbers would be read as ints/floats, not strings.
        or NUMBER_RE.match(text)
        # Ambiguous or invalid leading indicator, e.g. an "Accept: */*" header.
        or text[0] in YAML_LEADING_INDICATORS
        or any(ch in text for ch in [":", "#", "{", "}", "[", "]", "\n", "\t", '"', "'"])
    ):
        return json.dumps(text)
    return text


def indent_block(text: str, spaces: int) -> str:
    pad = " " * spaces
    return "\n".join(pad + line if line else pad for line in text.splitlines())


def list_items(items: Iterable[Dict[str, Any]], type_name: str | None = None) -> List[str]:
    lines: List[str] = []
    for item in items:
        lines.append(f"    - name: {quote(item.get('name', ''))}")
        lines.append(f"      value: {quote(item.get('value', ''))}")
        if type_name:
            lines.append(f"      type: {type_name}")
        elif item.get("type"):
            lines.append(f"      type: {quote(item.get('type'))}")
        if item.get("disabled") is True:
            lines.append("      disabled: true")
    return lines


def render_request(endpoint: Dict[str, Any], seq: int, base_url: str) -> str:
    name = endpoint.get("name") or f"{endpoint.get('method', 'GET')} {endpoint.get('path', '/')}"
    method = str(endpoint.get("method", "GET")).upper()
    if method not in HTTP_METHODS:
        raise ValueError(f"Unsupported method for {name}: {method}")
    path = endpoint.get("path") or endpoint.get("url") or "/"
    if str(path).startswith("http://") or str(path).startswith("https://") or str(path).startswith("{{"):
        url = str(path)
    else:
        url = base_url.rstrip("/") + "/" + str(path).lstrip("/")

    lines: List[str] = []
    lines.extend([
        "info:",
        f"  name: {quote(name)}",
        "  type: http",
        f"  seq: {seq}",
    ])
    tags = endpoint.get("tags") or []
    if tags:
        lines.append("  tags:")
        for tag in tags:
            lines.append(f"    - {quote(tag)}")

    lines.extend(["", "http:", f"  method: {method}", f"  url: {quote(url)}"])

    params: List[Dict[str, Any]] = []
    for item in endpoint.get("path_params", []) or []:
        params.append({**item, "type": "path"})
    for item in endpoint.get("query", []) or endpoint.get("query_params", []) or []:
        params.append({**item, "type": "query"})
    if params:
        lines.append("  params:")
        lines.extend(list_items(params))

    headers = endpoint.get("headers") or []
    if headers:
        lines.append("  headers:")
        lines.extend(list_items(headers))

    auth = endpoint.get("auth")
    if auth:
        lines.append("  auth:")
        if isinstance(auth, str):
            if auth == "inherit":
                lines[-1] = "  auth: inherit"
            elif auth == "bearer":
                lines.extend(["    type: bearer", "    token: \"{{token}}\""])
            elif auth == "apikey":
                lines.extend(["    type: apikey", "    key: \"{{apiKey}}\""])
            else:
                lines.append(f"    type: {quote(auth)}")
        elif isinstance(auth, dict):
            for key, value in auth.items():
                lines.append(f"    {key}: {quote(value)}")

    if "body" in endpoint and endpoint["body"] is not None:
        body = endpoint["body"]
        body_type = endpoint.get("body_type", "json")
        if body_type == "json" and not isinstance(body, str):
            body_text = json.dumps(body, indent=2)
        else:
            body_text = str(body)
        lines.extend(["  body:", f"    type: {quote(body_type)}", "    data: |-"])
        lines.append(indent_block(body_text, 6))

    tests = endpoint.get("tests")
    after_response = endpoint.get("after_response")
    if tests or after_response:
        lines.extend(["", "runtime:", "  scripts:"])
        if after_response:
            lines.extend(["    - type: after-response", "      code: |-"])
            lines.append(indent_block(str(after_response), 8))
        if tests:
            lines.extend(["    - type: tests", "      code: |-"])
            lines.append(indent_block(str(tests), 8))

    lines.extend([
        "",
        "settings:",
        "  encodeUrl: true",
        "  timeout: 0",
        "  followRedirects: true",
        "  maxRedirects: 5",
    ])

    docs = endpoint.get("docs") or f"Generated request for {method} {path}."
    lines.extend(["", "docs: |-"])
    lines.append(indent_block(str(docs), 2))
    lines.append("")
    return "\n".join(lines)


def load_endpoints(path_str: str) -> List[Dict[str, Any]]:
    path = Path(path_str)
    try:
        size = path.stat().st_size
    except OSError as exc:
        raise SystemExit(f"error: cannot read endpoints {path}: {exc}")
    if size > MAX_INPUT_BYTES:
        raise SystemExit(
            f"error: endpoints {path} is {size} bytes, larger than the "
            f"{MAX_INPUT_BYTES}-byte limit"
        )
    try:
        text = path.read_text()
    except OSError as exc:
        raise SystemExit(f"error: cannot read endpoints {path}: {exc}")
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"error: endpoints {path} is not valid JSON: {exc}")
    if not isinstance(data, list):
        raise SystemExit("error: endpoints JSON must be an array")
    for i, item in enumerate(data, start=1):
        if not isinstance(item, dict):
            raise SystemExit(
                f"error: endpoint #{i} must be a JSON object, got {type(item).__name__}"
            )
    return data


def main() -> int:
    parser = argparse.ArgumentParser(description="Scaffold Bruno OpenCollection YAML request files")
    parser.add_argument("--endpoints", required=True, help="Path to endpoints JSON array")
    parser.add_argument("--out", required=True, help="Output collection directory")
    parser.add_argument("--base-url", default="{{baseUrl}}", help="Base URL variable or literal URL")
    parser.add_argument("--force", action="store_true", help="Write into --out even if it is a non-empty directory")
    args = parser.parse_args()

    out_dir = Path(args.out)
    if out_dir.exists() and out_dir.is_dir() and any(out_dir.iterdir()) and not args.force:
        raise SystemExit(
            f"error: {out_dir} already exists and is not empty; pass --force to write into it"
        )

    endpoints = load_endpoints(args.endpoints)

    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "requests").mkdir(exist_ok=True)
    written: List[Path] = []
    for index, endpoint in enumerate(endpoints, start=1):
        folder = slugify(str(endpoint.get("folder", "requests")))
        req_dir = out_dir / "requests" / folder
        req_dir.mkdir(parents=True, exist_ok=True)
        name = endpoint.get("name") or f"{endpoint.get('method', 'GET')} {endpoint.get('path', '/') }"
        file_path = req_dir / f"{index:03d}-{slugify(str(name))}.yml"
        try:
            content = render_request(endpoint, index, args.base_url)
        except ValueError as exc:
            raise SystemExit(f"error: {exc}")
        file_path.write_text(content)
        written.append(file_path)

    readme = out_dir / "README.md"
    readme.write_text(
        "# Generated Bruno Collection Scaffold\n\n"
        "This scaffold contains OpenCollection YAML request files generated from endpoint metadata.\n\n"
        "Next steps:\n"
        "1. Open the folder in Bruno and verify the collection structure.\n"
        "2. Set environment variables such as baseUrl and token.\n"
        "3. Add or refine tests for business-specific behavior.\n"
    )

    print(f"Wrote {len(written)} request file(s) to {out_dir}")
    for path in written:
        print(path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
