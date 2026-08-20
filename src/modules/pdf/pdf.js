const { BrowserWindow, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

// FIX C5 + FIX 240: sanitize HTML before injecting into PDF template — strips
// script tags, event handlers, dangerous URLs, and iframe srcdoc to prevent
// code execution when exporting untrusted markdown files to PDF.
function sanitizeHtml(html) {
    return html
        // Remove script tags and their content
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        // Remove iframe tags (prevents srcdoc attacks)
        .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
        // FIX 240: match event handlers with optional whitespace before =
        // and support backtick-quoted values
        .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|`[^`]*`|[^\s>]+)/gi, "")
        // Block javascript: and data:text/html URIs in href
        .replace(/href\s*=\s*(?:"(?:javascript|data):[^"]*"|'(?:javascript|data):[^']*')/gi, "")
        // Block javascript: and data:text/html URIs in src
        .replace(/src\s*=\s*(?:"(?:javascript|data):[^"]*"|'(?:javascript|data):[^']*')/gi, "");
}

module.exports = {
    async exportCurrentMarkdown(htmlContent) {
        console.log("PDF export started");

        const win = new BrowserWindow({
            show: false,
            webPreferences: {
                offscreen: true
            }
        });

        const templatePath = path.join(__dirname, "template.html");
        const pdfStylesPath = path.join(__dirname, "pdf.css");
        const markdownStylesPath = path.join(__dirname, "../../styles/markdown/markdown.css");
        let template = fs.readFileSync(templatePath, "utf8");
        const styles = [pdfStylesPath, markdownStylesPath]
            .map(stylePath => fs.readFileSync(stylePath, "utf8"))
            .join("\n");

        template = template.replace("{{{styles}}}", styles);
        template = template.replace("{{{content}}}", sanitizeHtml(htmlContent));

        await win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(template));

        const pdfBuffer = await win.webContents.printToPDF({
            printBackground: true,
            marginsType: 1
        });

        const tempPath = path.join(os.tmpdir(), `snapdock_${Date.now()}.pdf`);
        fs.writeFileSync(tempPath, pdfBuffer);

        console.log("PDF saved:", tempPath);

        // Open PDF
        await shell.openPath(tempPath);

        // FIX M2: destroy the hidden window to guarantee cleanup.
        // close() only hides it; destroy() ensures the BrowserWindow is freed.
        win.destroy();

        // Auto-delete temp file after a longer delay to avoid race with PDF viewer
        // FIX M3: increased from 5s to 10s so the viewer has time to finish reading
        setTimeout(() => {
            fs.unlink(tempPath, (err) => {
                if (err) console.warn("Failed to delete temp PDF:", err);
            });
        }, 10000);

        console.log("PDF export complete");
    }
};
