# Publishing Checklist

This project is intended to be publishable as a public, dependency-light VS Code extension, but publishing is intentionally gated on product decisions and a final manual review.

## Product decisions

- [ ] Choose GitHub organization or user namespace.
- [ ] Choose repository name.
- [ ] Choose VS Code Marketplace publisher ID.
- [ ] Choose final extension display name.
- [ ] Choose final extension identifier/package name.
- [ ] Choose license.
- [ ] Decide icon/branding.

## Repository readiness

- [ ] Create public GitHub repository.
- [ ] Add `LICENSE` after license decision.
- [ ] Add `CHANGELOG.md` with release notes.
- [ ] Add `SECURITY.md` with vulnerability reporting path.
- [ ] Add contribution/development notes if accepting external PRs.
- [ ] Confirm `helix-docs/` remains local-only and untracked.
- [ ] Confirm no screenshots, generated files, or local artifacts leak into the package.

## Extension metadata

- [ ] Remove `private: true` only when ready to package/publish.
- [ ] Set final `name`, `displayName`, `description`, `publisher`, `repository`, `bugs`, `homepage`, `license`, `categories`, and `keywords` in `package.json`.
- [ ] Add extension icon if desired.
- [ ] Review activation events and commands for minimal scope.
- [ ] Review keybindings for conflicts and accurate `when` clauses.

## Packaging

- [ ] Add packaging tool only after approval under the dependency policy, likely `@vscode/vsce` as a dev dependency.
- [ ] Add `.vscodeignore` package exclusions.
- [ ] Build a local `.vsix`.
- [ ] Install the `.vsix` into a clean VS Code profile.
- [ ] Run `docs/ADAPTER_SMOKE_CHECKLIST.md` against the packaged extension.

## Validation gate

Run before every release candidate:

```sh
npm test
npm run typecheck
npm run compile
npm audit
```

Release candidate must have:

- [ ] Passing validation gate.
- [ ] Manual smoke pass.
- [ ] No runtime dependencies unless explicitly approved and documented.
- [ ] No shelling out for core modal editing behavior.
- [ ] No VS Code API imports in `src/core`.

## Marketplace publishing

- [ ] Create or confirm Marketplace publisher.
- [ ] Generate publisher token locally; do not commit secrets.
- [ ] Publish pre-release or initial stable release.
- [ ] Tag the matching Git commit.
- [ ] Create GitHub release with `.vsix` artifact if desired.
