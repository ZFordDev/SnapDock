# Security Policy

SnapDock welcomes responsible reports that help keep its users and their documents safe.

## Supported versions

Security fixes are targeted at the latest stable release and the current development branch. Older releases, forks, modified builds, and unofficial distributions may not receive fixes. Users should update to the latest stable release when a security update is published.

## Report a vulnerability privately

Use [GitHub's private vulnerability reporting](https://github.com/ZFordDev/SnapDock/security/advisories/new) whenever possible.

If that form is unavailable, email the maintainer at [zforddev@gmail.com](mailto:zforddev@gmail.com) with `SnapDock security report` in the subject line.

Do not open a public issue, discussion, or pull request for an unpatched vulnerability. Please also avoid sharing sensitive exploit details publicly until a fix and coordinated disclosure are complete.

Include as much of the following as possible:

- A description of the vulnerability and its potential impact
- Affected SnapDock versions and installation source
- Operating system and architecture
- Reproduction steps or a minimal proof of concept
- Relevant logs or screenshots with personal information removed
- Any known mitigations or suggested fixes
- Whether the issue has been disclosed elsewhere

Reports made in good faith should avoid accessing data that is not yours, disrupting services, or causing harm to other users.

## What happens next

The maintainer will review the report, attempt to reproduce it, and assess its impact. You may be asked for more information during the investigation. If the issue is confirmed, a fix or mitigation will be prepared and released as appropriate, followed by an advisory when public disclosure is safe.

Response and release times depend on the issue's complexity and upstream dependencies. Please follow up through the original private channel if you believe a report was missed.

## Scope

This policy covers vulnerabilities in SnapDock's source code, official builds, update mechanism, Markdown rendering, file and workspace handling, and interactions with bundled dependencies.

Security problems in Electron, Chromium, or another dependency may ultimately need an upstream fix, but please report them privately to SnapDock when they affect SnapDock users or require an application-level mitigation.

The following are generally outside scope unless they create a vulnerability in an official SnapDock release:

- Social engineering or physical access attacks
- Vulnerabilities that require an already-compromised operating system
- Unsupported versions, forks, and modified or unofficial builds
- Reports that identify an outdated dependency without demonstrating a relevant impact

## Security characteristics

SnapDock is a local-first desktop application. It uses Electron context isolation and disables Node.js integration in the renderer, but its renderer sandbox is not currently enabled. Store packages and some Linux installation types may handle updates outside the application.

These characteristics provide context, not a guarantee that the application is vulnerability-free. Reports involving untrusted Markdown, local file access, workspace boundaries, external links, PDF export, or updates are especially useful.

Thank you for reporting vulnerabilities responsibly.
