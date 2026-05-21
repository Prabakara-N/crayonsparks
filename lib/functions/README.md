# lib/functions

Pure async / pure-logic functions — split by execution environment.

## `client/`

Functions that run in the **browser**. May use:

- `fetch`, `URL.createObjectURL`, `document`, dynamic `import()` of browser libs
- The oRPC client (`@/lib/orpc/client`)
- DOM APIs

Every file is wrapped in `"use client"` and must NOT import anything from
`@/lib/firebase/admin`, `@/lib/storage/*`, or any `"server-only"` module.

Imported by:
- React hooks under `@/lib/hooks/*`
- React components under `@/components/*`

## `server/`

Functions that run in **Vercel functions / API routes / oRPC procedures**.
May use:

- Firebase Admin SDK
- R2 / S3 SDK
- `sharp`, `pdf-lib`
- Any `"server-only"` module

Every file imports `"server-only"` so accidental client-side import errors at build time.

Imported by:
- API routes under `app/api/*/route.ts`
- oRPC routers under `@/lib/orpc/routers/*`

## Naming

- File name: kebab-case verb-phrase that describes the action.
  - `save-book.ts` → `saveBookToCloud()` / `saveBook()`
  - `download-coloring-book.ts` → `downloadColoringBook()`
- Exported function name: camelCase, matches the file's primary intent.
- One main function per file. Helpers stay private inside the file.
- **No `use-` prefix** — that's reserved for React hooks under `@/lib/hooks/`.
