# 📘 SnapDock Ecosystem Roadmap  
*A transparent, community‑focused overview of where SnapDock is heading and how each part of the ecosystem fits together.*

The SnapDock ecosystem is growing into a connected suite of tools designed for writers, developers, and teams. This roadmap outlines the current state of each project, the long‑term vision, and how all the pieces interlock to form a cohesive writing platform.

This document is intentionally transparent about delays, sequencing, and the realities of a small but passionate team.

---

# 🟦 SnapDock v2 — Long-Term Support (Current)  
SnapDock v2 is stable, predictable, and in maintenance mode.

### **What to expect**
- Electron version updates  
- Dependency refreshes  
- Security patches  
- Minor UI polish  
- No new features  

SnapDock v2 remains the recommended version for everyday use while the next generation is being built.

---

# 🟩 SnapDock 3 — Next‑Generation Editor (In Development)  
SnapDock 3 is a major evolution of the editor, but development is intentionally paused until **SnapBoard reaches beta**. The two apps must work together seamlessly.

### **Why the pause?**  
SnapDock 3 and SnapBoard share:
- Virtual workspace logic  
- Themes  
- Metadata  
- Cross‑app continuity  

SnapDock 3 cannot ship until SnapBoard’s foundation is stable.

### **Core goals for SnapDock 3**
- Markdown‑first, but supports evolving writing stacks:
  - GitHub‑flavored Markdown  
  - LaTeX  
  - HTML  
- Cleaner, more modern architecture  
- Workspace‑aware editing  
- Future‑ready plugin and theme systems  

SnapDock 3 remains a **professional writing workspace**, not a full word processor. A standalone word editor is planned for the future.

---

# 🟨 SnapBoard — Workspace Brain of the Ecosystem (In Development)  
SnapBoard is the organizational layer that ties the ecosystem together.

### **Its role**
- Defines virtual workspaces  
- Manages project structure  
- Stores metadata  
- Syncs themes and workspace logic across apps  

SnapBoard is the reason SnapDock 3 can become more powerful without becoming bloated.

---

# 🟪 SnapNotes — Official Mobile Companion (Planned)  
SnapNotes is the **native mobile app** for capturing ideas quickly.

### **Its purpose**
- Fast note capture on the go  
- Send notes directly to SnapDock on desktop  
- Integrate with SnapBoard’s workspace structure  
- Provide a native feel that SnapDock Online cannot fully match  

SnapNotes is the mobile entry point into the ecosystem.

---

# 🟧 SnapDock Online — Portable Browser Edition (Active Trial)  
SnapDock Online is the browser‑based version of SnapDock.

### **Current state**
- Fully functional trial editor  
- Great for quick edits or writing away from your main machine  

### **Future direction**
- Login system  
- Cloud file system  
- Downloadable PWA for phones  
- Sync with SnapBoard workspaces  

SnapNotes = native capture  
SnapDock Online = portable editor  
SnapDock desktop = full writing environment

---

# 🟥 SnapDock‑Server — Publishing Portal (Planned)  
SnapDock‑Server is a document server designed for writers, developers, and teams who publish frequently.

### **What it will do**
- Run as a Docker‑friendly server  
- Allow secure login from SnapDock  
- Accept pushes directly from the editor  
- Instantly render updated documents  
- Support internal or external hosting  

This is perfect for:
- Documentation sites  
- Internal company portals  
- Personal knowledge bases  
- Team publishing workflows  

SnapDock writes → SnapDock‑Server publishes.

---

# 🟫 SnapDock‑Pro — Team Workspace Edition (Conceptual)  
SnapDock‑Pro is the professional, collaboration‑focused edition of the ecosystem.

### **Its purpose**
- Team workspaces  
- Shared editing  
- Collaboration tools  
- Advanced features for studios, dev teams, and writers  

Pro builds on:
- SnapBoard’s workspace logic  
- SnapDock’s writing engine  
- SnapNotes’ capture flow  
- SnapDock‑Server’s publishing pipeline  

This is the “co‑working” edition of SnapDock.

---

# 🟦 Future Standalone Word Editor (Conceptual)  
A full word processor is planned as a separate app in the future.

### **Why separate?**
- SnapDock stays Markdown‑first  
- The word editor will support rich formatting workflows  
- Both tools will integrate with SnapBoard and SnapDock‑Server  

This keeps SnapDock focused and avoids identity drift.

---

# 🧩 How the Ecosystem Fits Together  
The ecosystem is designed around a simple flow:

### **SnapNotes → SnapBoard → SnapDock → SnapDock‑Server → SnapDock‑Pro**

Or visually:

| App | Role | Relationship |
|------|------|--------------|
| **SnapNotes** | Capture | Feeds ideas into SnapBoard + SnapDock |
| **SnapBoard** | Organize | Defines workspaces for all apps |
| **SnapDock** | Write | Main editor, Markdown-first |
| **SnapDock Online** | Portable Write | Browser-based fallback |
| **SnapDock‑Server** | Publish | Receives documents from SnapDock |
| **SnapDock‑Pro** | Collaborate | Team edition built on all the above |

Everything is modular.  
Everything is connected.  
Everything reinforces the writing workflow.

---

# 🤝 Contributing  
The SnapDock ecosystem is being built in the open, and contributors are welcome.

### We’re especially looking for:
- Phone app developers  
- Documentation writers  
- JavaScript developers  
- Rust developers (shh… that part’s still under wraps)  
- Product testers across Windows, macOS, and Linux  

If you want to get involved early or just chat about the project, email:  
**zforddev@gmail.com**

Dedicated Discord channels and a private contributor roadmap are in the works.

---

# 🧭 Transparency  
SnapDock is currently developed by a solo developer with regular contributors.  
This roadmap reflects realistic sequencing, honest limitations, and the long‑term vision of the ecosystem.

If something is delayed, it’s because quality and cohesion matter more than rushing features.

---