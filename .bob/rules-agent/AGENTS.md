# AGENTS.md — Agent (coding) mode

This file provides guidance to agents when working with code in this repository.

<!-- Fill in non-obvious coding rules discovered by reading project files.
     Delete this comment once populated.
     Only include things that would surprise an experienced developer.
     Standard practices (use const, handle errors, etc.) do not belong here. -->

## Custom Utilities

<!-- List project-specific helpers that replace standard approaches.
     Example:
     - `src/utils/logger.ts` wraps console — never use console.log directly
     - `src/config/env.ts` provides typed env vars — never read process.env directly
-->

## Required Patterns

<!-- Patterns that look optional but are actually mandatory.
     Example:
     - API handlers must call `withAuth()` middleware — auth is NOT applied globally
     - State mutations must go through the store's `dispatch()` — direct mutation bypasses persistence
-->

## Hidden Gotchas

<!-- Coupling, ordering, or side-effect requirements not obvious from signatures.
     Example:
     - `initDatabase()` must be called before any repository import (side-effect on module load)
-->
