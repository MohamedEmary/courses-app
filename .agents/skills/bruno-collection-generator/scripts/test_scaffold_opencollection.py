"""Tests for scaffold_opencollection.py: rendering, YAML safety, and guard paths.

Run with:  pytest scripts/test_scaffold_opencollection.py
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPT = Path(__file__).with_name("scaffold_opencollection.py")

# Import the module directly to unit-test pure helpers.
sys.path.insert(0, str(SCRIPT.parent))
import scaffold_opencollection as scaffold  # noqa: E402


def run(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        capture_output=True,
        text=True,
    )


def write_endpoints(tmp_path: Path, data: object) -> Path:
    path = tmp_path / "endpoints.json"
    path.write_text(json.dumps(data))
    return path


# --- quote(): YAML scalar safety -------------------------------------------


@pytest.mark.parametrize(
    "value",
    [
        "*/*",          # leading '*' is a YAML alias -> must be quoted
        "true",         # bool-like
        "null",         # null-like
        "123",          # number-like
        " leading",     # leading whitespace
        "trailing ",    # trailing whitespace
        "a: b",         # colon
        "@handle",      # reserved indicator
        "- dash",       # block sequence indicator
        "{{baseUrl}}",  # brace
    ],
)
def test_quote_wraps_unsafe_scalars(value: str) -> None:
    out = scaffold.quote(value)
    assert out.startswith('"') and out.endswith('"')
    # Round-trips back to the original string via JSON (YAML superset).
    assert json.loads(out) == value


@pytest.mark.parametrize("value", ["application/json", "smoke", "GetUser", "v1"])
def test_quote_leaves_safe_scalars_plain(value: str) -> None:
    assert scaffold.quote(value) == value


def test_none_and_empty_quoted(tmp_path: Path) -> None:
    assert scaffold.quote(None) == '""'
    assert scaffold.quote("") == '""'


# --- end-to-end rendering ---------------------------------------------------


def test_scaffolds_request_files(tmp_path: Path) -> None:
    endpoints = write_endpoints(
        tmp_path,
        [
            {
                "name": "Get User by ID",
                "method": "get",
                "path": "/users/:id",
                "folder": "users",
                "headers": [{"name": "Accept", "value": "*/*"}],
            }
        ],
    )
    out = tmp_path / "collection"
    result = run("--endpoints", str(endpoints), "--out", str(out))
    assert result.returncode == 0, result.stderr
    files = list((out / "requests" / "users").glob("*.yml"))
    assert len(files) == 1
    text = files[0].read_text()
    assert "method: GET" in text          # uppercased
    assert 'value: "*/*"' in text          # the YAML-unsafe header is quoted
    assert (out / "README.md").exists()


def test_generated_yaml_parses(tmp_path: Path) -> None:
    yaml = pytest.importorskip("yaml")
    endpoints = write_endpoints(
        tmp_path,
        [{"name": "Ping", "method": "GET", "path": "/ping",
          "headers": [{"name": "Accept", "value": "*/*"}],
          "query": [{"name": "n", "value": "123"}]}],
    )
    out = tmp_path / "c"
    assert run("--endpoints", str(endpoints), "--out", str(out)).returncode == 0
    doc = list((out / "requests").rglob("*.yml"))[0].read_text()
    parsed = yaml.safe_load(doc)
    assert parsed["http"]["method"] == "GET"
    # Quoting preserved string types rather than coercing them to int/bool.
    accept = next(h["value"] for h in parsed["http"]["headers"] if h["name"] == "Accept")
    assert accept == "*/*"
    query_n = next(p["value"] for p in parsed["http"]["params"] if p["name"] == "n")
    assert query_n == "123" and isinstance(query_n, str)


# --- guard paths ------------------------------------------------------------


def test_missing_file_exits_cleanly(tmp_path: Path) -> None:
    result = run("--endpoints", str(tmp_path / "nope.json"), "--out", str(tmp_path / "c"))
    assert result.returncode == 1
    assert "cannot read endpoints" in result.stderr
    assert "Traceback" not in result.stderr


def test_invalid_json_exits_cleanly(tmp_path: Path) -> None:
    bad = tmp_path / "e.json"
    bad.write_text("not json")
    result = run("--endpoints", str(bad), "--out", str(tmp_path / "c"))
    assert result.returncode == 1
    assert "not valid JSON" in result.stderr


def test_non_array_rejected(tmp_path: Path) -> None:
    endpoints = write_endpoints(tmp_path, {"not": "an array"})
    result = run("--endpoints", str(endpoints), "--out", str(tmp_path / "c"))
    assert result.returncode == 1
    assert "must be an array" in result.stderr


def test_non_object_element_rejected(tmp_path: Path) -> None:
    endpoints = write_endpoints(tmp_path, ["just a string"])
    result = run("--endpoints", str(endpoints), "--out", str(tmp_path / "c"))
    assert result.returncode == 1
    assert "must be a JSON object" in result.stderr


def test_unsupported_method_exits_cleanly(tmp_path: Path) -> None:
    endpoints = write_endpoints(tmp_path, [{"name": "X", "method": "FETCH", "path": "/x"}])
    result = run("--endpoints", str(endpoints), "--out", str(tmp_path / "c"))
    assert result.returncode == 1
    assert "Unsupported method" in result.stderr
    assert "Traceback" not in result.stderr


def test_refuses_nonempty_out_without_force(tmp_path: Path) -> None:
    endpoints = write_endpoints(tmp_path, [{"name": "X", "method": "GET", "path": "/x"}])
    out = tmp_path / "c"
    out.mkdir()
    (out / "keep.txt").write_text("important")
    result = run("--endpoints", str(endpoints), "--out", str(out))
    assert result.returncode == 1
    assert "already exists and is not empty" in result.stderr
    assert (out / "keep.txt").read_text() == "important"


def test_force_writes_into_nonempty_out(tmp_path: Path) -> None:
    endpoints = write_endpoints(tmp_path, [{"name": "X", "method": "GET", "path": "/x"}])
    out = tmp_path / "c"
    out.mkdir()
    (out / "keep.txt").write_text("important")
    result = run("--endpoints", str(endpoints), "--out", str(out), "--force")
    assert result.returncode == 0


# --- path-traversal hardening already provided by slugify -------------------


def test_slugify_neutralizes_path_traversal() -> None:
    assert "/" not in scaffold.slugify("../../etc/passwd")
    assert ".." not in scaffold.slugify("../../etc/passwd")


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))
