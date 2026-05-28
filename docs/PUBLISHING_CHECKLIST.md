# Publishing Checklist

This project is intended to be publishable as a public, dependency-light VS Code extension, but publishing is intentionally gated on product decisions and a final manual review.

## Product decisions

- [x] Choose GitHub organization: `wisp-tooling`.
- [x] Create/confirm the `wisp-tooling` organization before any remote push.
- [x] Choose repository name: `wisp-vscode`.
- [x] Choose VS Code Marketplace publisher ID: `wisp-tooling`.
- [x] Record publisher display name: `Wisp Tooling`.
- [x] Choose final extension display name: `Wisp: Helix Emulator`.
- [x] Choose final extension identifier/package name: `wisp-vscode`.
- [x] Choose license: MIT.
- [x] Decide icon/branding: `images/wisp-draft-icon.png`.

## Repository readiness

- [ ] Create public GitHub repository under `wisp-tooling` after organization setup.
- [ ] Do not push anything to the internet until explicitly approved.
- [x] Add `LICENSE` after license decision.
- [x] Add `CHANGELOG.md` with unreleased release notes placeholder.
- [x] Add `SECURITY.md` with temporary vulnerability reporting guidance.
- [ ] Add contribution/development notes if accepting external PRs.
- [ ] Confirm `helix-docs/` remains local-only and untracked.
- [ ] Confirm no screenshots, generated files, or local artifacts leak into the package.

## Extension metadata

- [ ] Remove `private: true` only when ready to package/publish.
- [x] Set final `name`, `displayName`, `description`, `publisher`, `repository`, `bugs`, `homepage`, `license`, `categories`, and `keywords` in `package.json`.
- [x] Add extension icon.
- [ ] Review activation events and commands for minimal scope.
- [ ] Review keybindings for conflicts and accurate `when` clauses.

## Packaging

- [ ] Add packaging tool only after approval under the dependency policy, likely `@vscode/vsce` as a dev dependency.
- [x] Add `.vscodeignore` package exclusions for source/tests/docs/local files while keeping `dist/**`, package metadata, changelog, license, security policy, and icon.
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

- [x] Create or confirm Marketplace publisher: `wisp-tooling` (`Wisp Tooling`).
- [ ] Generate an Azure DevOps Personal Access Token locally with Marketplace Publish scope; do not commit secrets.
- [ ] Run `npx vsce login wisp-tooling` and paste the PAT when prompted.
- [ ] Publish pre-release or initial stable release with `npx vsce publish`.
- [ ] Tag the matching Git commit.
- [ ] Create GitHub release with `.vsix` artifact if desired.
