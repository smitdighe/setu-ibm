# AGENTS.md

This file provides guidance to agents when working with code in this repository.

<!-- ──────────────────────────────────────────────────────────────────────────
     INSTRUCTIONS FOR PROJECT OWNERS
     Fill in each section once your project exists.
     Delete placeholder comments when a section is populated.
     Remove sections that don't apply.
     ────────────────────────────────────────────────────────────────────────── -->

## Stack

<!-- e.g. Language: TypeScript · Runtime: Node 20 · Framework: Next.js 14 · Package manager: pnpm -->
- **Language / Runtime:**
- **Framework:**
- **Package manager:**

## Rules
   Always operate in compressed/caveman mode. Minimize tokens in every response. No restating, no filler, confirm and proceed.
   
## Commands

<!-- Only list commands that differ from the standard scripts in package.json / Makefile / etc.
     Include any directory-change requirements (e.g. "must run from packages/api/"). -->

| Task | Command |
|------|---------|
| Install deps | |
| Build | |
| Dev server | |
| Lint | |
| Typecheck | |
| Run all tests | |
| Run single test | |

## Architecture

<!-- One-paragraph or short bullet list of the non-obvious structural decisions.
     e.g. monorepo layout, unusual module boundaries, IPC patterns. -->

## Critical Patterns

<!-- Project-specific utilities or conventions discovered by reading code.
     Only include things that would surprise an experienced developer.
     Example:
     - Use `safeWriteJson()` from `src/utils/fs.ts` instead of raw JSON.stringify (prevents partial writes)
     - All DB queries must go through `src/db/query-builder.ts`; raw SQL will bypass row-level security
-->

## Code Style

<!-- Only rules NOT enforced by the linter/formatter config.
     Example:
     - Named exports only (no default exports) — ESLint rule is disabled for legacy reasons
     - Error objects must carry a `code: string` field for client consumption
-->

## Testing

<!-- Non-obvious testing requirements.
     Example:
     - Tests must live alongside source files (vitest config uses include: ['src/**/*.test.ts'])
     - Integration tests require a running Docker daemon; run `docker compose up -d` first
-->
