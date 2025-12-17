const { BrowserWindow, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

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
        let template = fs.readFileSync(templatePath, "utf8");

        template = template.replace("{{{content}}}", htmlContent);

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

        // FIX: Close the hidden window
        win.close();

        // Auto-delete temp file
        setTimeout(() => {
            fs.unlink(tempPath, () => {});
        }, 5000);

        console.log("PDF export complete");
    }
};