# Use Axios and TanStack Query for client-side remote music data

Scopify uses Axios as the NetEase backend transport and TanStack Query as the owner of Remote Music Data lifecycle. The first migration remains client-side because backend configuration, cookies, and Electron runtime settings are resolved in the renderer; native fetch was rejected because the application already needs a coherent transport abstraction for these concerns.

## Consequences

- Axios owns request configuration, shared parameters, credentials, timeouts, cancellation, and normalized transport errors.
- TanStack Query owns caching, persistence, retry policy, deduplication, invalidation, and query or mutation lifecycle.
- API functions return typed payloads rather than `AxiosResponse`; retries, toasts, and page caching leave Axios interceptors.
- Account-Scoped Music Data is evicted on logout or an account change; public catalog data may remain persisted.
- The first migration disables automatic retries. Retry policy will be introduced separately once read and write error semantics are defined.
- Query failures render in their owning page, mutations report at their interaction point, and an Expired Music Session is handled once at the renderer boundary.
- User-initiated refresh failures remain visible even when cached data is displayed; music collection mutations update optimistically and roll back on failure.
