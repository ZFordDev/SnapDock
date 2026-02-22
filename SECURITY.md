<p align="center">
  <strong>SnapDock Security Policy</strong><br/>
  A clean, focused Markdown editor built with user safety in mind.
</p>

---

# Supported Versions

SnapDock 2.x is in **Long‑Term Support (LTS)**.  
Only the latest 2.x release receives security updates.

| Version | Supported |
|--------|-----------|
| 2.x LTS | ✔ Active |
| 1.x     | ✖ End of life |

SnapDock 3.x will adopt the same model once released.

---

# Reporting a Vulnerability

If you believe you’ve found a security issue in SnapDock:

- **Email:** `zforddev@gmail.com`  
- **Do not disclose publicly** until the issue has been reviewed.  
- Expect an initial response within **72 hours**.  
- If confirmed, a fix will be prepared and released promptly.

SnapDock 2.x is maintained by a single developer, so clear, detailed reports are appreciated.

---

# What to Include in a Report

To help reproduce and resolve the issue, please include:

- Steps to reproduce  
- SnapDock version  
- Operating system  
- Whether you used a packaged build or built from source  
- Logs or screenshots if available  

---

# Security Scope

SnapDock is a **local‑first Markdown editor** with no network features.  
Security concerns typically relate to:

- file handling  
- workspace safety  
- data loss prevention  
- dependency vulnerabilities  
- sandboxing (planned for SnapDock 3.x)

Network‑based vulnerabilities are unlikely because SnapDock does not connect to external services.

---

# Responsible Disclosure

If a vulnerability is confirmed:

- You may be credited in the release notes (optional).  
- The fix will be included in the next patch release.  
- Critical issues may trigger an immediate hotfix.

Thank you for helping keep SnapDock safe for everyone.
