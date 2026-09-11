# V3 Migration Roadmap

> **Phoenix warning:** Phoenix is the experimental V4 branch. It may break, misbehave, or discover new and creative interpretations of "ready." Use `main` if you need the safer, established SnapDock experience.

This roadmap tracks work that still needs to be migrated from the V3 `main` line to the V4 Phoenix branch. It is a parity and hardening checklist only. It does not describe the roadmap for completing V4, the Phoenix UI, or any new V4 product features.

## Security and data protection

- [ ] Enforce workspace boundaries in Phoenix Rust commands for `save_file`, `read_text_file`, and `list_files`.
- [ ] Enforce the custom-theme directory boundary for theme load, save, and delete commands.
- [ ] Restrict external link handling to the approved protocols and validate the protocol in the native layer as well as the renderer.
- [ ] Review local attachment resolution and Tauri asset access for workspace escape and unintended file exposure.
- [ ] Add focused tests for path traversal, symlinked paths, malformed URLs, and untrusted Markdown/PDF content.

## V3 feature parity

- [ ] Migrate workspace and open-tab session restoration, including workspace isolation and stale-file handling.
- [ ] Migrate editor tab indentation and outdent behavior.
- [ ] Compare V3 Markdown rendering and preview behavior with Phoenix after the renderer migration, then record and resolve any compatibility differences.
- [ ] Compare V3 file, tab, recent-file, and close-project workflows and close any remaining parity gaps.

## Update and release parity

- [ ] Complete Tauri updater signing and replace the placeholder public key before publishing release builds.
- [ ] Define and validate the Phoenix update-channel endpoints and channel-selection rules.
- [ ] Preserve pending update state across restart or clearly provide an equivalent recovery flow.
- [ ] Add Phoenix pull-request checks for TypeScript, Rust, tests, bundling, and Tauri configuration.
- [ ] Verify release artifacts, version metadata, and supported package targets on Windows and Linux.
- [ ] Ensure the Phoenix build and release workflows use the committed lockfiles reproducibly.

## Completion criteria

Migration is complete when each item above is implemented or explicitly marked not applicable, the relevant tests and build checks pass, and the result is documented in the Phoenix pull request. New V4 functionality belongs in a separate V4 roadmap and must not be added to this list.