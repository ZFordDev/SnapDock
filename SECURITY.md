<p align="center">
  <strong>SnapDock Security Policy</strong><br/>
  A clean, focused Markdown editor built with user safety in mind.
</p>

---

# Supported Versions

SnapDock follows a simple, transparent lifecycle model:

| Version Line | Status | Notes |
|--------------|--------|-------|
| **3.x (Active)** | ✔ Supported | Receives security fixes and maintenance updates. |
| **2.x (Classic)** | ✖ End‑of‑Life | Final, archived release. No further updates. |
| **1.x (Classic)** | ✖ End‑of‑Life | No longer maintained. |

Only **SnapDock 3.x** receives security updates.  
SnapDock 2.x and 1.x remain available for download but are **frozen** and do not receive patches unless a critical, high‑severity issue is discovered.

---

# Reporting a Vulnerability

If you believe you’ve found a security issue in SnapDock:

- **Email:** `zforddev@gmail.com`  
- **Do not disclose publicly** until the issue has been reviewed.  
- Expect an initial response within **72 hours**.  
- If confirmed, a fix will be prepared for the **active version line (3.x)**.

Clear, detailed reports are appreciated — SnapDock is maintained by a single developer.

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
- A fix will be released for **SnapDock 3.x**.  
- Critical issues may trigger an immediate hotfix.

Thank you for helping keep SnapDock safe for everyone.
