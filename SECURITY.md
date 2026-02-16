<p align="center">
  <strong>SnapDock Security Policy</strong><br/>
  A clean, focused Markdown editor built with user safety in mind.
</p>

---

# Supported Versions

SnapDock follows a simple, predictable support model:

- **The latest stable release (2.x LTS)** receives security fixes.
- Older versions are not maintained.

| Version | Supported |
|--------|-----------|
| 2.x LTS | ✔ Active |
| 1.x     | ✖ No longer supported |

SnapDock 3.x will adopt the same model once released.

---

# Reporting a Vulnerability

If you believe you’ve found a security issue in SnapDock:

- **Email directly:** `zforddev@gmail.com`  
- **Do not disclose publicly** until the issue has been reviewed.  
- You’ll receive an initial response within **72 hours**.  
- If confirmed, a fix will be prepared and released as soon as possible.

This project is maintained by a single developer, so clear, detailed reports are appreciated.

---

# What to Include in a Report

To help reproduce and resolve the issue:

- Steps to reproduce  
- SnapDock version  
- Operating system  
- Whether you used a packaged build or compiled from source  
- Any logs or screenshots that help illustrate the issue  

---

# Security Scope

SnapDock is a local Markdown editor.  
Security concerns typically relate to:

- file handling  
- workspace safety  
- data loss prevention  
- sandboxing (future SnapDock 3.x)  
- dependency vulnerabilities  

Network‑based vulnerabilities are unlikely because SnapDock does not connect to external services.

---

# Responsible Disclosure

If a vulnerability is confirmed:

- You will be credited in the release notes (optional).  
- The fix will be included in the next patch release.  
- Severe issues may trigger an immediate hotfix release.  

Thank you for helping keep SnapDock safe for everyone.