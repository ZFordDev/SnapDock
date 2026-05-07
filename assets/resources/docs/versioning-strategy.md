# SnapDock Versioning Strategy

## Purpose

This document defines the actual SnapDock dual lifecycle strategy for the repo, release workflow, and update delivery.
It is written for contributors, release engineers, and maintainers—not end users.

SnapDock is now split into two supported lines:

- **SnapDock V2 → LTS**: stable, maintenance-only, predictable patch cadence.
- **SnapDock V3 → Active Development**: redesigned UI, new architecture, and new feature work.

The repo is shared, but the distribution and updater layers must remain isolated.
This document describes how that isolation works in the context of SnapDock’s existing Electron / electron-builder / GitHub Releases architecture.

## Goals

This strategy covers:

- Branch structure for V2 and V3
- How SnapDock’s Electron updater must be configured for each line
- Release metadata and feed file naming for GitHub Releases
- Packaging separation for Windows and Linux artifacts
- Optional V2 → V3 upgrade path without forcing migration
- Contributor workflow, local testing, and CI/CI expectations

## 1. Branching Model

### Recommended Branch Structure

- `main` → V3 active development
- `v2-lts` → V2 maintenance only
- Git tags:
  - `v2.x.y` for V2 releases
  - `v3.x.y` for V3 releases

### What belongs in each branch

#### `main` (V3)

- New UI / architecture work
- New features, component refactors, and UX changes
- Anything that should not be shipped to V2 users

#### `v2-lts`

- Bug fixes and security patches for the current V2 line
- Packaging corrections and metadata fixes for V2
- No new UX or feature work unless it is tiny, safe, and user-facing compatibility only

### Patch flow and backports

- V2 fixes are developed in `v2-lts`.
- If a fix is needed in both V3 and V2, the preferred path is:
  1. Fix in `main` if it is V3-native.
  2. Backport explicitly into `v2-lts` only if the patch is safe for V2.
- Do not backport V2-specific maintenance from `v2-lts` into `main` unless the same code can remain compatible in both lines.

### Tags and release semantics

- Use `v2.x.y` tags for V2 patch releases.
- Use `v3.x.y` tags for V3 releases.
- Release tags are the primary release identity, because SnapDock artifacts names are reused across versions.

Example:

- `v2.3.6` → V2 maintenance release.
- `v3.0.0` → V3 launch release.

### PR targeting guidance

- V3 development PRs target `main`.
- V2 maintenance PRs target `v2-lts`.
- Use branch prefixes to clarify intent:
  - `v3/feature/...`
  - `v2/lts/fix/...`
- If a change legitimately spans both lines, open separate PRs and document the cross-branch relationship.

### Branch diagram

```mermaid
flowchart TB
  M[main (V3 active development)] -->|release| T3[v3 tags]
  L[v2-lts (V2 maintenance)] -->|release| T2[v2 tags]
  T3 -->|optional backport| L
  L -. no auto-upgrade .-> M
```

## 2. Release Channels & Update Metadata

### SnapDock updater reality

SnapDock uses `electron-updater` via `src/modules/update.js`.
That means:

- `autoUpdater` is the runtime updater.
- electron-builder normally expects `latest.yml` as the default feed file.
- There is no built-in V2/V3 channel separation unless the feed URL is overridden at build time.
- electron-updater caches metadata aggressively, so channel migration must be explicit.

### Current distribution backend

SnapDock publishes via GitHub Releases.
The repo currently produces artifacts named:

- `SnapDock-Setup.exe`
- `SnapDock-Setup.deb`
- `SnapDock-Setup.AppImage`

Because the artifact names are reused across versions, the release tag and update metadata are the boundaries that separate V2 from V3.

### Required metadata feeds

For SnapDock, use two feed identifiers in the release ecosystem:

- `latest.yml` → V3 release metadata
- `lts-v2.yml` → V2 release metadata

In practice:

- V3 packages should resolve to `latest.yml` by default.
- V2 packages must be hardwired to `lts-v2.yml`.
- Old V2 installs that still point at `latest.yml` must continue to find the current V2 line during a migration window.

### Migration requirement for V2

Because V2 installs previously used `latest.yml`, the transition to V2-LTS must be staged.
SnapDock must support a migration window where:

- A V2 release publishes both `latest.yml` and `lts-v2.yml` for the same version.
- V2 installers continue to work and can find updates on `lts-v2.yml`.
- V3 can be introduced on `latest.yml` only after the migration window ends.

The key rule:

- V2 releases must not be orphaned by removing `latest.yml` too early.
- V2 must not start checking plain `latest.yml` after the migration is complete.

### Hard-coded feed override for V2

For V2 packages, the updater must be configured at build time so the update feed URL is not the default `latest.yml` path.
That means:

- V2 builds embed a direct reference to the V2 metadata feed.
- V2 packages must never resolve `latest.yml` once they are on the stable LTS path.

### Preventing cross-version updates

To isolate updates safely:

- V3 packages: use `latest.yml` and release asset metadata exclusively for V3 tags.
- V2 packages: use `lts-v2.yml` only.
- Do not use a common update endpoint for both lines.
- Ensure the V2 updater rejects any metadata that indicates a V3-major version.

### Feed naming and artifact behavior

Preferred names for SnapDock feeds:

- `latest.yml` → active V3 feed
- `lts-v2.yml` → stable V2 feed
- `latest-mac.yml` / `lts-v2-mac.yml` if macOS metadata is needed later

Do not invent a `/updates/` path in the documentation; SnapDock’s actual distribution is GitHub Releases and release artifact metadata.

### Version bump safety

- V2 version bumps are patch-only on `v2-lts`.
- V3 version bumps follow semantic versioning on `main`.
- Do not let a V3 release rewrite the `latest.yml` feed while old V2 packages still depend on it.
- Document the migration window in release notes.

### Testing update isolation

Local validation should include:

- Build a V2 artifact and confirm it resolves only to `lts-v2.yml`.
- Build a V3 artifact and confirm it resolves only to `latest.yml`.
- Verify the V2 artifact does not surface V3 metadata.
- Verify the V3 artifact does not surface V2 metadata.

## 3. Packaging Separation

### Existing SnapDock packaging model

SnapDock currently packages a single installer artifact per target platform.
That means packaging separation is not by package ID but by release lineage and feed metadata.

### Windows

- Use a separate V2 release line and a separate V3 release line.
- The same `SnapDock-Setup.exe` file name can be reused across tags, so metadata is the true channel separator.
- Ensure the Windows NSIS build for V2 contains the V2 feed override.

### Linux

- Produce separate AppImage and `.deb` builds for V2 and V3.
- Package names may remain the same, but the release tag, metadata feed, and release notes must identify the line clearly.

### Packaging isolation best practices

- Keep V2 and V3 publish logic separate in CI.
- Do not reuse a single metadata manifest for both lines.
- Avoid a shared `latest.yml` path for V2 once migration is complete.
- Keep the release asset naming stable, but use tags and metadata feeds to disambiguate V2 vs V3.

### CI / release job expectations

SnapDock’s workflow should use separate jobs for each line:

- `build-v2-lts`: builds V2 artifacts, uploads V2 assets, writes `lts-v2.yml`.
- `build-v3`: builds V3 artifacts, uploads V3 assets, writes `latest.yml`.

The jobs may share toolchain config, but not upload rules.
If a single pipeline step publishes both, the step must explicitly select the target line.

## 4. Optional Upgrade Path from V2 → V3

### Core principle

V2 remains supported and stable.
The upgrade path is optional and must not be forced by the updater.

### V2 UI behavior

- Show an explicit “Upgrade to V3” action in V2 settings or the about screen.
- The action should explain:
  - V2 is stable and will continue to receive fixes.
  - V3 is a separate, newer line with a redesigned interface.
  - Choosing V3 is optional.

### Recommended upgrade flow

The button should:

- open a landing page or GitHub release page for V3,
- surface V3 download links,
- and explain the difference clearly.

Do not:

- perform an automatic upgrade,
- silently switch V2 installs to V3,
- or hide the fact that V2 remains maintained.

### Messaging guidance

Use explicit language such as:

- “Stay on V2 for stability and ongoing security patches.”
- “V3 is a separate new release line with a new UI.”
- “Upgrade only when you are ready.”

## 5. Contributor Workflow

### V3 PRs

- Target `main`.
- Use branch names like `v3/feature/...` or `v3/fix/...`.
- Keep update metadata changes scoped to the V3 feed.
- Confirm packaging metadata in the PR points at `latest.yml`.

### V2 PRs

- Target `v2-lts`.
- Use branch names like `v2/lts/fix/...` or `v2/lts/patch/...`.
- Keep changes minimal and focused on stability, packaging, or compatibility.
- Avoid adding new feature work unless it is clearly required for maintenance.

### Testing update channels locally

To verify each line locally:

- Build a V2 package and confirm the runtime updater uses `lts-v2.yml`.
- Build a V3 package and confirm the runtime updater uses `latest.yml`.
- Validate the built artifact metadata in the output directory.
- Use local feed overrides in CI if needed for channel testing.

### Verifying packaging metadata

For any release-related PR:

- Confirm installer/package metadata points to the intended feed.
- Confirm V2 asset metadata does not mention or resolve to V3.
- Confirm V3 asset metadata does not mention or resolve to V2.
- Confirm the release tag naming matches the target line.

### PR review checklist

- [ ] Does the PR target the correct branch? (`main` for V3, `v2-lts` for V2)
- [ ] Is the update feed override correct for the release line?
- [ ] Are artifact publish rules separated by line in CI?
- [ ] Does the change keep V2 isolated from V3 metadata?
- [ ] Is there a clear note about whether this is a V2 backport or V3-only change?

## 6. Validation and Guardrails

### Avoiding channel drift

- Keep V2 and V3 feeds, release tags, and packaging metadata separate.
- Prefer explicit feed names like `lts-v2.yml` instead of generic channel naming.
- Review release PRs for accidental `latest.yml` changes that could impact V2.

### Release communication

- Use consistent branch naming.
- Document which lifecycle a PR or release belongs to.
- Treat this strategy doc as the source of truth for all branch, release, and updater decisions.

## 7. Glossary

- **LTS**: Long-Term Support, the stable V2 maintenance line.
- **latest.yml**: electron-builder’s default active updater metadata feed used by V3.
- **lts-v2.yml**: V2-specific updater metadata feed.
- **GitHub Releases**: SnapDock’s distribution backend and metadata source.
- **Backport**: Applying a fix from `main` into `v2-lts`.
- **Tag**: Git reference used to publish a release.

## Notes

This document is SnapDock-specific.
Any implementation changes, updater overrides, or packaging scripts should be guided by these branch and release rules.
