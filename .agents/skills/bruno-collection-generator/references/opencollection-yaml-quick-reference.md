# OpenCollection YAML Quick Reference for Bruno

Use this reference when generating Bruno request YAML files.

## Core request shape

OpenCollection YAML request files commonly use these top-level sections:

```yaml
info:        # Request metadata: name, type, seq, tags
http:        # HTTP method, URL, params, headers, body, auth
runtime:     # Scripts, tests, assertions
settings:    # Request settings
metadata:    # Optional internal metadata
vars:        # Optional request variables
docs:        # Request-level documentation
```

`info`, `http`, and `settings` should be present for generated HTTP requests. Add `runtime` only when tests, assertions, or scripts are useful. Add `docs` whenever creating user-facing collections.

## info

```yaml
info:
  name: Get Users
  type: http
  seq: 1
  tags:
    - smoke
    - regression
```

Rules:

- `name` is the display name.
- `type` is usually `http`.
- `seq` controls ordering.
- `tags` enable CLI filtering and CI subsets.

## http

```yaml
http:
  method: GET
  url: "{{baseUrl}}/users/:id"
  params:
    - name: id
      value: "{{userId}}"
      type: path
    - name: include
      value: profile
      type: query
  headers:
    - name: Accept
      value: application/json
  body:
    type: json
    data: |-
      {
        "name": "Ada Lovelace"
      }
  auth:
    type: bearer
    token: "{{token}}"
```

Rules:

- Use uppercase methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD`.
- Use `{{baseUrl}}` rather than hardcoding environment-specific hosts.
- Use `:id` style path parameters when a request path needs a path parameter.
- Use arrays of objects for `params` and `headers`.
- Use `auth: inherit` when collection or folder auth is preferred.

## body

For JSON:

```yaml
body:
  type: json
  data: |-
    {
      "email": "user@example.com"
    }
```

Supported body types include `json`, `text`, `xml`, `form-urlencoded`, `multipart-form`, and `graphql`.

## runtime scripts

Before-request script:

```yaml
runtime:
  scripts:
    - type: before-request
      code: |-
        const requestId = bru.interpolate("{{$guid}}");
        bru.setVar("requestId", requestId);
```

After-response script:

```yaml
runtime:
  scripts:
    - type: after-response
      code: |-
        const body = res.getBody();
        if (body.token) {
          bru.setVar("token", body.token);
        }
```

Tests:

```yaml
runtime:
  scripts:
    - type: tests
      code: |-
        test("should return success", function () {
          expect(res.getStatus()).to.equal(200);
        });
```

## assertions

```yaml
runtime:
  assertions:
    - expression: res.status
      operator: eq
      value: "200"
    - expression: res.body.id
      operator: isString
```

Use assertions for simple status/body checks. Use test scripts when logic is conditional, multi-step, or more expressive.

## settings

```yaml
settings:
  encodeUrl: true
  timeout: 0
  followRedirects: true
  maxRedirects: 5
```

## docs

```yaml
docs: |-
  Gets a user by ID.

  Required variables:
  - baseUrl
  - userId

  Expected result:
  - 200 with a user object containing id, name, and email.
```

Keep request docs concise and operational.
