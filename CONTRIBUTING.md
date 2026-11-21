# Contributing to SnapDock

Thanks for helping make SnapDock better!

Whether you're fixing bugs, adding features, improving documentation, or just sharing ideas, contributions are always welcome.

You don't need to be an expert. Just bring an idea and a willingness to give it a go!

## Where are we heading?

**V3 (`main`) is our current focus.**

> [!IMPORTANT]
> We're stepping back from V4 (Phoenix) for now to make V3 the best it can be. That means new features, bug fixes, and general improvements are all welcome.

V4 isn't officially cancelled, but it may be restarted or replaced. To avoid anyone losing work, please target `main` for new contributions.

Interested in V4? Have a chat with us first!

More details: [Discussion #271](https://github.com/ZFordDev/SnapDock/discussions/271).

## Getting started

SnapDock V3 uses Electron, JavaScript, HTML, and CSS. You'll need Git, Node.js, and npm.

Fork the repository, then:

```bash
git clone https://github.com/YOUR-USERNAME/SnapDock.git
cd SnapDock
git switch -c feature/my-improvement
npm install
npm run build:dev
npm test
npm start
```

`build:dev` prepares the development build, including the renderer bundle, so don't skip it!

Other useful commands:

```bash
npm run build:win    # Windows build
npm run build:linux  # Linux build
```

Windows and Linux are supported. macOS isn't officially supported yet.

> [!NOTE]
> New to development? Don't be afraid to ask questions!
>
> I'd rather have my inbox flooded with little questions than see someone spend hours on a contribution only to have their PR sent back for changes we could've discussed beforehand.
>
> Emails, issue comments, discussions, or even Discord if you catch me online. Seriously, spam away! 😂

## Making changes

A few things to keep in mind:

- Keep changes focused and follow the existing code style.
- SnapDock is local-first and aims to stay lightweight.
- Avoid unnecessary dependencies, telemetry, or cloud requirements.
- For bigger changes, open an issue or discussion first so we can share ideas.

## Testing and pull requests

Run `npm test` to check your changes, then `npm start` to try them in the app.

For editor changes, check that opening, editing, saving, and previewing Markdown still work. For visual changes, check the built-in themes where possible.

When you're ready, open a PR against **`main`**.

Tell us what changed, link any related issues, and mention what you've tested. Screenshots are welcome for UI changes.

Don't worry if everything isn't perfect. Reviews are a conversation, not an exam!

## Bugs, ideas, and questions

Found something broken? [Report a bug](https://github.com/ZFordDev/SnapDock/issues/new?template=bug_report.yml).

Have an idea? [Suggest a feature](https://github.com/ZFordDev/SnapDock/issues/new?template=feature_request.yml).

Just want to chat? [Join the discussions](https://github.com/ZFordDev/SnapDock/discussions).

Please follow our [Code of Conduct](CODE_OF_CONDUCT.md), and report security issues privately using [SECURITY.md](SECURITY.md).

---

**Thanks for being part of SnapDock!** Every contribution counts, big or small. 🚀
