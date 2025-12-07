/* SnapDock - A simple markdown editor and viewer
   Core script: scripts.js
*/
import { initRust, getDirectory } from './fsHandler.js';

const MarkdownIt = window.markdownit;

function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), timeout);
    };
}

/* DOM cache */

const $ = id => document.getElementById(id);

const themeToggleBtn = $('themeToggleBtn');
const openFileBtn     = $('openFileBtn');
const exportPdfBtn    = $('exportPdfBtn');
const markdownEditor  = $('markdownEditor');
const previewPane     = $('previewPane');
const toggleViewBtn   = $('toggleViewBtn');
const editorContainer = $('editorContainer');
toggleViewBtn.addEventListener('click', () => {
    const isPreviewMode = editorContainer.classList.contains('preview-mode');
    editorContainer.classList.remove('preview-mode', 'edit-mode');
    const newMode = isPreviewMode ? 'edit-mode' : 'preview-mode';
    editorContainer.classList.add(newMode);
    toggleViewBtn.classList.remove('preview-mode', 'edit-mode');
    toggleViewBtn.classList.add(newMode);

    // If we're switching to edit mode, focus the textarea so the user can type immediately
    if (newMode === 'edit-mode') {
        markdownEditor.focus();
        // place cursor at end
        const len = markdownEditor.value.length;
        markdownEditor.setSelectionRange(len, len);
    }
});

// Start in edit mode so the main window is writable by default
window.addEventListener('DOMContentLoaded', () => {
    if (editorContainer && toggleViewBtn) {
        editorContainer.classList.add('edit-mode');
        toggleViewBtn.classList.add('edit-mode');
        // focus editor on load
        markdownEditor.focus();
    }
});

const saveFileBtn  = $('saveFileBtn');
const filenameDisplay = $('filenameDisplay');
const filenameInput   = $('filenameInput');
const versionTag      = $('versionTag');
const fileList        = $('fileList');
const tabs            = $('tabs');
const openFolderBtn   = $('openFolderBtn');
const folderTree      = $('folderTree');
const helpBtn         = $('helpBtn');
const updateBtn       = $('updateBtn');
const newFileBtn      = $('newFileBtn');

/*  Utility helpers */

function setLS(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
}
function getLS(key, def = null) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (_) { }
    return def;
}
function triggerDownload(name, content, mime = 'text/plain') {
    const blob = new Blob([content], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href   = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
}

/* new rust filetree and file button */

(async () => {
  try {
    await initRust();
    console.log('Rust WASM initialized');
  } catch (e) {
    console.error('Failed to initialize Rust WASM:', e);
  }
})();


// Renderer
openFolderBtn.addEventListener('click', async () => {
  const dirPath = await window.electronAPI.openDirectory();
  if (!dirPath) {
    folderTree.innerHTML = "<li>No directory selected</li>";
    return;
  }

  const entries = await window.electronAPI.listDirectory(dirPath);
  renderFolderTree(entries);
});

// Renderer for entries from preload (expects { name, isDir, path })
function renderFolderTree(entries, parent = folderTree) {
  parent.innerHTML = '';

  entries.forEach(entry => {
    const li = document.createElement('li');

    if (entry.isDir) {
      li.className = 'folder';

      const label = document.createElement('span');
      label.textContent = `📁 ${entry.name}`;
      label.style.cursor = 'pointer';

      const sub = document.createElement('ul');
      sub.style.display = 'none';

      label.addEventListener('click', async () => {
        const isHidden = sub.style.display === 'none';
        sub.style.display = isHidden ? 'block' : 'none';

        if (isHidden && sub.childElementCount === 0) {
          const children = await window.electronAPI.listDirectory(entry.path);
          renderFolderTree(children, sub);
        }
      });

      li.appendChild(label);
      li.appendChild(sub);
    } else {
      li.className = 'file';
      li.textContent = `📄 ${entry.name}`;

      // Add click handler to load file contents
      li.addEventListener('click', async () => {
        const text = await window.electronAPI.readFile(entry.path);
        openFileInTab(entry.name, text);
      });
    }

    parent.appendChild(li);
  });
}

// Initialize markdown-it with all available features
const md = new MarkdownIt({
    html: true,
    xhtmlOut: true,
    breaks: true,
    linkify: true,
    typographer: true,
    langPrefix: 'language-',
    quotes: '\u201c\u201d\u2018\u2019',
    maxNesting: 100,
    highlight: function (str, lang) {
        if (lang && lang !== 'plain') {
            return '<pre class="highlight"><code class="language-' + lang + '">' +
                str +
                '</code></pre>';
        }
        return '<pre class="highlight"><code>' + str + '</code></pre>';
    }
});

// Enable all available rules
md.enable('code')
    .enable('fence')
    .enable('table')
    .enable('heading')
    .enable('lheading')
    .enable('hr')
    .enable('list')
    .enable('reference')
    .enable('blockquote')
    .enable('html_block')
    .enable('paragraph')
    .enable('link')
    .enable('image')
    .enable('emphasis')
    .enable('autolink')
    .enable('backticks')
    .enable('strikethrough')
    .enable('html_inline');

function renderMarkdown(text) {
    previewPane.innerHTML = md.render(text);
}

/* Theme handling */

const THEME_KEY = 'snapdock-theme';
themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    setLS(THEME_KEY, document.body.classList.contains('dark-mode') ? 'dark' : 'light');
});
window.addEventListener('DOMContentLoaded', () => {
    if (getLS(THEME_KEY, 'light') === 'dark')
        document.body.classList.add('dark-mode');
});

/* File operations */

const AUTOSAVE_KEY = 'snapdock-autosave';
const RECENT_KEY   = 'snapdock-recent';

function pickFile(accept, callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = e => {
        const f = e.target.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = ev => callback(ev.target.result, f.name);
        r.readAsText(f);
    };
    input.click();
}

function loadContent(name, text) {
    markdownEditor.value = text;
    renderMarkdown(text);
    filenameDisplay.textContent = name;
    filenameInput.value = name;

    setLS(AUTOSAVE_KEY, text);
    saveToRecentFiles(name, text);
}
function saveCurrentFile(useFilename) {
    const name = useFilename ? filenameInput.value.trim() || 'untitled.md'
        : `snapdock-${Date.now()}.md`;
    triggerDownload(name, markdownEditor.value, 'text/markdown');
}

/*  Autosave – debounced listener */

const debouncedRender = debounce(() => {
    renderMarkdown(markdownEditor.value);
    setLS(AUTOSAVE_KEY, markdownEditor.value);
}, 300);

markdownEditor.addEventListener('input', debouncedRender);

/* Load autosaved content on startup */
window.addEventListener('DOMContentLoaded', () => {
    const saved = getLS(AUTOSAVE_KEY, '');
    if (saved) loadContent(filenameInput.value || 'untitled.md', saved);
});

/* Manual save button */
saveFileBtn.addEventListener('click', () => saveCurrentFile(true));

/* New file button – clears the editor and creates a unique untitled name */
newFileBtn.addEventListener('click', () => {
    const name = `untitled-${Date.now()}.md`;
    markdownEditor.value = '';
    previewPane.innerHTML = '';
    loadContent(name, '');
});


/*  Filename editing UI */

filenameDisplay.addEventListener('click', () => {
    filenameDisplay.style.display = 'none';
    filenameInput.style.display = 'inline-block';
    filenameInput.focus();
});
filenameInput.addEventListener('blur', () => {
    const newName = filenameInput.value.trim() || 'untitled.md';
    loadContent(newName, markdownEditor.value);
});

/*  Recent files & sidebar */
function saveToRecentFiles(name, content) {
  const recent = getLS(RECENT_KEY, []) || [];
  const updated = [{ name, content }, ...recent.filter(r => r.name !== name)].slice(0, 10);
  setLS(RECENT_KEY, updated);
  renderRecentFiles(updated);
}

function renderRecentFiles(files) {
  const fileListEl = document.getElementById('fileList');
  if (!fileListEl) return;
  const safeFiles = files || [];
  fileListEl.innerHTML = '';
  safeFiles.forEach(f => {
    const li = document.createElement('li');
    li.textContent = f.name;
    li.addEventListener('click', () => openFileInTab(f.name, f.content));
    fileListEl.appendChild(li);
  });
}
/* Load recent files on startup */
window.addEventListener('DOMContentLoaded', () => {
    const recent = getLS(RECENT_KEY, []);
    renderRecentFiles(recent);
});


/* Tab system */

let openTabs = {}; // Object to store file content by tab name

function openFileInTab(name, content) {
    let existing = document.querySelector(`.tab[data-name="${name}"]`);
    if (existing) return setActiveTab(existing);

    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.dataset.name = name;
    tab.innerHTML = `${name}<span class="closeTab">×</span>`;
    tab.addEventListener('click', () => setActiveTab(tab));
    tabs.appendChild(tab);
    setActiveTab(tab);

    openTabs[name] = content; // Store the content in openTabs

    if (name === 'user_guide.md') {
        loadContent(name, content); // Load help content into editor
    } else {
        openFileInEditor(content); // Open other files normally
    }
}

function setActiveTab(tab) {
    const name = tab.dataset.name;
    const content = openTabs[name];
    if (content) {
        markdownEditor.value = content;
        renderMarkdown(content);
    }
    document.getElementById('recentFilesPanel').classList.remove('active');
    document.getElementById('editorContainer').style.display = 'block';
    tab.classList.add('active');
}

tabs.addEventListener('click', e => {
    if (e.target.classList.contains('closeTab')) {
        const tab   = e.target.parentElement;
        const name  = tab.dataset.name;
        tab.remove();
        delete openTabs[name]; // Remove the content from openTabs

        const remaining = tabs.querySelector('.tab');
        if (remaining) setActiveTab(remaining);
    }
});

function openFileInEditor(content) {
    const filename = `untitled-${Date.now()}.md`;
    loadContent(filename, content);
}

function showHelp() {
    fetch('assets/resources/docs/user_guide.md')
        .then(response => response.text())
        .then(text => {
            // Open the fetched markdown content into a new tab
            openFileInTab('user_guide.md', text);
        })
        .catch(error => console.error('Error fetching help documentation:', error));
}

helpBtn.addEventListener('click', showHelp);

updateBtn.addEventListener('click', () => {
    fetch('version.json')
        .then(r => r.json())
        .then(d => alert(`SnapDock ${d.version} (${d.build})\nBuild date: ${d.date}`))
        .catch(() => alert('Unable to check for updates.'));
});

/* Version tag */

fetch('version.json')
    .then(r => r.json())
    .then(d => { versionTag.textContent = `v${d.version} ${d.build}`; })
    .catch(() => { versionTag.textContent = 'v2.0.0'; });

/* Kick off Rust WASM initialization early */
initRust();
