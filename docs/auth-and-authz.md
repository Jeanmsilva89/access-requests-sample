# Authentication and authorization conventions (guidance, not implementation)

No authentication is implemented in this sandbox sample. Before production, each
app must implement and test these independently. Do not put auth/session/enforcement
code into `packages/shared`, and do not make the main-domain app the identity service.

## One identity authority, isolated relying parties

Use an established OIDC/OAuth2 identity provider as the authority for users and
organization membership. Register each app as a separate client with exact callback
URLs, its own audience/scopes and independently rotated secrets. Prefer authorization
code + PKCE, validate state and nonce, and use well-maintained provider libraries.
An existing IdP session can give SSO without one app depending on another app's server.
No local credentials, fabricated production identities or home-grown token issuer.

## Enforce locally at the backend boundary

Each API validates issuer, audience, signature algorithm/key, expiration and other
required claims. Cache JWKS with bounded TTL and handle rotation; do not accept
unsigned JWTs or use decoding alone as validation. Each app has its own least-privilege
scopes/roles, documented mapping of IdP claims, and server-side checks on every read
and mutation. Recommended conventions: `sub` is immutable subject, an agreed tenant
claim scopes data, and app-prefixed roles (`access-requests:reviewer`) avoid accidental
cross-app privileges. UI hiding is not authorization. Unknown/missing claims deny
access. Test resource ownership, tenant isolation, expiry and role removal.

## Sessions and boundaries

Prefer host-only Secure, HttpOnly cookies (no parent-domain `Domain` attribute),
with appropriate SameSite and CSRF protection. Keep sessions independently scoped
to each app; no shared cookie encryption keys or session DB. Use exact CORS origin
allowlists, TLS and explicit credential policy, not sandbox permissive CORS. Do not
put bearer tokens in localStorage. Isolate logout/session expiry expectations;
provider-wide logout is an explicit product/security policy, not implicit coupling.
Machine-to-machine access uses narrow audience-bound credentials, timeouts and
rotation per caller. IdP availability is a shared infrastructure risk to document.

## Sandbox identities and audit

Sandbox actors are fixtures, not trusted identities. An actor field sent from the
current UI must never establish a real reviewer's identity: the production API
must derive actor/tenant from validated credentials. Keep deterministic mock identities
and `/__reset` strictly outside stage/production. Label mock responses with `X-Mock`
and expose the banner; never reuse mock roles as an authorization bypass. A real API
must emit attributable audit records without logging credentials/tokens.

## Per-app production acceptance

Document client registration, audience/roles, secret delivery/rotation, cookie/CSRF
policy, failure behavior, audit retention and independent rollback. Verify allowed
and denied flows, replay/expiry, cross-tenant and cross-app audience rejection.
Security review and real-API tests are required before treating the app as production-ready.
