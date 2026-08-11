# Contributing to SnapDock

Thank you for helping improve SnapDock. Contributions of all sizes are welcome, including bug reports, feature ideas, documentation, design feedback, testing, and code.

By participating, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md). Please report security vulnerabilities through the private process in [SECURITY.md](SECURITY.md).

## Before you begin

- Search the [issue tracker](https://github.com/ZFordDev/SnapDock/issues) before opening a new report.
- Use the repository's issue forms for [bugs](https://github.com/ZFordDev/SnapDock/issues/new?template=bug_report.yml), [features](https://github.com/ZFordDev/SnapDock/issues/new?template=feature_request.yml), and [documentation](https://github.com/ZFordDev/SnapDock/issues/new?template=documentation.yml).
- For a substantial change, open an issue before investing significant time so the scope and approach can be discussed.
- Keep changes aligned with SnapDock's local-first, focused writing experience.

SnapDock also follows the broader [ZFordDev project standards](https://github.com/ZFordDev/ZFordDev/blob/main/STANDARDS.md).

## Development setup

SnapDock requires Node.js and npm. Fork the repository, clone your fork, and install its dependencies:

```bash
git clone https://github.com/YOUR-USERNAME/SnapDock.git
cd SnapDock
npm install
```

Create a focused branch from the latest `main` branch:

```bash
git switch -c feature/short-description
```

Useful development commands include:

```bash
npm run bundle       # Bundle the renderer into dist/bundle.js
npm start            # Launch the Tauri development application
npm run tauri:build  # Create native installers for the current platform
```

macOS builds are not currently supported.

## Making changes

- Keep each pull request limited to one logical change.
- Follow the existing JavaScript and CSS style in the files you touch.
- Place application logic in the appropriate area of `src/modules/`.
- Extend the existing theme variables and theme files for visual changes; check all five built-in themes.
- Avoid large dependencies unless their value clearly outweighs the download, startup, and maintenance cost.
- Do not introduce network services, telemetry, or cloud requirements without prior discussion.
- Update user-facing documentation when behaviour, installation, or supported platforms change.

## Testing

The repository does not currently provide a complete automated test suite, so contributors should perform focused manual testing and document it in the pull request.

At minimum:

1. Confirm the app starts or produces the relevant development build.
2. Exercise the changed workflow and likely edge cases.
3. Check that opening, editing, saving, and previewing Markdown still work when your change affects shared application code.
4. Test on Windows and Linux when the change is platform-sensitive. If you cannot test a platform, say so in the pull request.
5. For UI work, check the Light, Dark, Solarized, Arctic Dark, and Forest themes and include screenshots when useful.

## Pull requests

When your change is ready:

1. Push the branch to your fork and open a pull request against `main`.
2. Complete the pull request template.
3. Explain what changed, why it changed, and how you tested it.
4. Link related issues with a keyword such as `Fixes #123` when appropriate.
5. Keep unrelated formatting or refactoring out of the pull request.
6. Respond constructively to review feedback and update the branch as needed.

Clear, present-tense commit messages are appreciated. Maintainers may ask for commits to be reorganised before merging.

## Good bug reports

Please include:

- SnapDock version and installation source
- Operating system, version, desktop environment, and display server where relevant
- Clear reproduction steps
- Expected and actual behaviour
- Logs, screenshots, or a small example Markdown file when they help reproduce the problem

Remove personal information, credentials, private document content, and sensitive file paths before attaching logs or screenshots.

## Feature requests

Describe the problem and use case before proposing an implementation. Strong proposals explain who benefits, what alternatives exist, and how the idea preserves SnapDock's simple, predictable workflow.

Thank you for contributing to SnapDock.
