# Agent Guidance

## Project direction

This plugin should take a near-suckless approach to development: keep the implementation small, direct, auditable, and dependency-light.

The goal is to build a performant and secure VS Code plugin that emulates Helix/Wisp-style motions and modal editing behavior.

## Dependency policy

Prefer TypeScript primitives, language features, and the standard library wherever practical.

Do not add external runtime or development dependencies lightly. Before introducing any new dependency, explain to the project owner:

- what problem the dependency solves,
- why TypeScript/Node/VS Code built-ins are insufficient,
- the security and maintenance implications,
- the expected performance impact,
- and whether the dependency is runtime-only, development-only, or optional.

Only add the dependency after approval.

## Implementation priorities

- Keep `src/core` pure TypeScript with no VS Code API imports.
- Favor deterministic, fixture-backed behavior over broad feature coverage.
- Prefer simple data structures and explicit control flow.
- Avoid unnecessary abstraction, code generation, frameworks, or heavy libraries.
- Optimize for correctness, responsiveness, and auditability.
- Treat text offsets as UTF-16 indices to match VS Code behavior.

## Security and performance posture

- Do not shell out to external executables for core editing behavior.
- Do not depend on the external `wi` binary.
- Avoid parsing or executing untrusted input beyond normal editor text processing.
- Keep command dispatch predictable and testable.
- Minimize work done per keypress, especially in normal/select mode.
