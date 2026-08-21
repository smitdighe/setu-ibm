# AGENTS.md — Plan mode

This file provides guidance to agents when working with code in this repository.

<!-- Fill in non-obvious architectural constraints.
     Only include things that would cause wrong plans if unknown.
     Delete this comment once populated. -->

## Architectural Constraints

<!-- Hard rules that limit design options.
     Example:
     - Providers MUST be stateless — a hidden caching layer assumes this
     - DB migrations are forward-only; no rollback mechanism exists
     - React state only — external state libraries break webview sandbox isolation
-->

## Hidden Coupling

<!-- Dependencies that aren't visible from import graphs.
     Example:
     - `auth` module shares an in-memory token store with `session` module via global singleton
     - Changing the User schema requires updating the search index mapping manually
-->

## Performance Constraints

<!-- Non-obvious bottlenecks to plan around.
     Example:
     - The PDF parser is single-threaded and blocks the event loop; offload to worker threads
-->
