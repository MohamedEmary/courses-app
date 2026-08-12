# Bruno Collection Generation Checklist

Use this checklist before returning generated Bruno collection files.

## Endpoint coverage

- Each discovered route has a corresponding request or an explicit reason it was skipped.
- Request names are readable and stable.
- Folders group related resources.
- Sequence numbers are deterministic.

## Variables and environments

- Hostnames are represented as `{{baseUrl}}` unless the user requested a fixed public API URL.
- Secrets are placeholders, never real values.
- Auth-related variables have clear names: `token`, `apiKey`, `clientId`, `clientSecret`, `tenantId`.
- Required environment variables are documented.

## Request shape

- HTTP methods are uppercase in YAML.
- Path parameters are listed as `type: path`.
- Query parameters are listed as `type: query`.
- Headers are represented as arrays with `name` and `value`.
- JSON bodies are valid JSON strings under `body.data`.

## Tests and scripts

- Smoke tests validate expected status codes.
- POST/PUT/PATCH requests validate required response fields when known.
- Chaining scripts store runtime variables with `bru.setVar` only when subsequent requests need them.
- Tests use Bruno's Chai `expect` style.

## Final response

Include:

- A generated file tree.
- How to open/import the collection in Bruno.
- How to run it with Bruno CLI if relevant.
- A list of assumptions and TODOs.
