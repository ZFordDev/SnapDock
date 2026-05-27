# SnapDock Updater (Modular Rewrite)

This folder contains the new modular updater system for SnapDock.  
It replaces the legacy `update.js` implementation with a cleaner, safer, and more maintainable architecture.

> **Status:** Pending integration  
> This system is complete but not yet wired into production.  
> It will be fully enabled once UI changes from **PR #93** land.

---

## What’s in this folder

### **detectSource.js**
Determines where SnapDock was installed from:

- `direct` (portable / installer)
- `windows-store`
- `snap-store`

This controls whether updates, prerelease channels, and rollback are allowed.

### **settings.js**
Stores updater‑related settings:

- `updateChannel` (`stable` or `prerelease`)
- `lastInstalledVersion` (used for rollback)

### **feed.js**
Builds the correct update feed URL based on:

- install source  
- user’s update channel  
- `homepage` from package.json  

No hardcoded GitHub paths.

### **versionCompare.js**
Semver utilities:

- compare versions  
- detect prerelease tags  
- detect “ahead of stable” cases  

### **download.js**
Handles:

- configuring autoUpdater  
- checking for updates  
- downloading updates  
- installing updates  
- storing rollback version  

### **events.js**
Bridges autoUpdater events → renderer IPC:

- `update:available`
- `update:none`
- `update:progress`
- `update:ready`
- `update:error`

### **rollback.js**
Implements safe rollback:

- Direct‑install only  
- Uses GitHub API to fetch assets  
- Picks correct installer per platform  
- Follows redirects  
- Downloads + runs previous version  

### **index.js**
The orchestrator:

- Wires IPC handlers  
- Exposes update/rollback actions  
- Forwards updater events  
- Loads settings and permissions  

---

## Why this rewrite exists

The old updater (`update.js`) was:

- tightly coupled to autoUpdater  
- not platform‑aware  
- not rollback‑safe  
- not aware of install source  
- hardcoded to a single feed  
- not maintainable long‑term  

This rewrite:

- modularizes every responsibility  
- supports stable + prerelease channels  
- supports rollback  
- blocks updates for store installs  
- uses GitHub API for asset discovery  
- uses package.json homepage for dynamic repo paths  
- is fully testable and future‑proof  

---

## Current status (stalled pending PR #93)

This updater backend is **complete**, but intentionally **not wired into production** yet.

Reason:

- PR **#93** introduces the new UI layout (Tools → Update panel)
- The updater UI needs to match the new IPC API
- Wiring it now would cause UI mismatch and broken buttons

Once PR #93 merges:

1. Replace legacy `update.js` with `setupUpdater()` from `index.js`
2. Update preload to expose the new IPC API
3. Update renderer UI to use:
   - `update:check`
   - `update:download`
   - `update:install`
   - `update:rollback`
   - `update:getSettings`
   - `update:setChannel`

After that, the new updater becomes the default.

---

## Next steps to fully integrate

1. **Merge PR #93** (UI restructure)
2. **Wire `setupUpdater(mainWindow)` in main.js**
3. **Remove old `update.js`**
4. **Update preload.js** to expose new IPC calls
5. **Update renderer UI** to match new event names
6. **Test on:**
   - Windows installer
   - Linux AppImage
   - Linux .deb
   - Snap Store (updates disabled)
   - Windows Store (updates disabled)

Once these steps are done, the new updater is production‑ready.

---

## Notes

- Rollback uses **AppImage** on Linux (matches electron‑updater behavior)
- Redirect‑safe downloads are implemented
- Install source detection is hardened
- No updater logic lives in UI or main.js anymore
- All logic is testable in isolation

---

If you're reading this:  
Welcome to the new updater system — it’s cleaner, safer, and built to last.
