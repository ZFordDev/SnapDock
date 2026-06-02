<!-- ========================================================= -->
<!-- Standards Approval Badge -->
<!-- ========================================================= -->
<table align="right">
  <tr>
    <td>
      <img src="https://raw.githubusercontent.com/ZFordDev/ZFordDev/main/assets/standards-approved.svg" width="80" alt="ZFordDev Standards Approved Badge">
    </td>
  </tr>
</table>

# Security Policy

The ZFordDev ecosystem values stability, safety, and long‑term maintainability.  
We take security seriously and appreciate responsible disclosure of any vulnerabilities.

This document explains how to report security issues and what to expect during the process.

---

## Supported Versions

Security updates are provided for:

- **Current stable releases**  
- **Active development branches**  
- **Classic versions**, where applicable  

Older or archived versions may not receive fixes.

---

## Reporting a Vulnerability

If you discover a security issue, please report it responsibly.

### **How to report**
- Open a **private GitHub security advisory** (preferred)  
- Or contact the project maintainer directly through GitHub  

Please **do not** open a public issue for security vulnerabilities.

### **Include the following information**
- Description of the issue  
- Steps to reproduce  
- Impact or potential risk  
- Affected versions  
- Any relevant logs or screenshots  

Clear reports help us respond quickly.

---

## Response Process

When a report is received:

1. The maintainer will acknowledge the report  
2. The issue will be investigated  
3. A fix or mitigation will be prepared  
4. A patched release will be published  
5. A security advisory will be issued (if applicable)  

We aim to handle all reports respectfully and promptly.

---

## Scope

This policy applies to:

- All ZFordDev repositories  
- All official releases  
- All ecosystem tools and modules  

It does **not** apply to:

- Third‑party dependencies  
- Forks or modified builds  
- Unofficial distributions  

---

## SnapDock‑Specific Notes

SnapDock is a desktop application built on Electron.  
When reporting security issues, please consider:

- Electron/Chromium vulnerabilities should be reported upstream when appropriate  
- SnapDock does not execute remote code or load remote content  
- All Markdown rendering is local and sandboxed  
- The in‑app updater is disabled in some versions (store builds, certain Linux packages, and some pre‑releases)
- SnapDock does not collect telemetry or send user data anywhere  

If a vulnerability involves file handling, workspace logic, or the update system, please include reproduction steps for both Windows and Linux if possible.

---

## Thank You

Responsible disclosure helps keep the entire ZFordDev ecosystem safe.  
We appreciate your effort and your commitment to improving the project.
