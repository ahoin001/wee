function registerCaptureHandlers({
  ipcMain,
  BrowserWindow,
  dialog,
  fsPromises,
  path,
}) {
  ipcMain.handle('take-screenshot', async (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) {
        return { success: false, error: 'Window not found' };
      }

      const image = await win.webContents.capturePage();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const defaultFilename = `screenshot-${timestamp}.png`;

      const result = await dialog.showSaveDialog(win, {
        title: 'Save Screenshot',
        defaultPath: defaultFilename,
        filters: [
          { name: 'PNG Images', extensions: ['png'] },
          { name: 'JPEG Images', extensions: ['jpg', 'jpeg'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        properties: ['createDirectory'],
      });

      if (result.canceled) {
        return { success: false, error: 'Save cancelled by user' };
      }

      const filePath = result.filePath;
      const fileExtension = path.extname(filePath).toLowerCase();
      const imageBuffer = (fileExtension === '.jpg' || fileExtension === '.jpeg')
        ? image.toJPEG(90)
        : image.toPNG();

      await fsPromises.writeFile(filePath, imageBuffer);
      console.log('Screenshot saved:', filePath);

      return {
        success: true,
        filePath,
        filename: path.basename(filePath),
      };
    } catch (error) {
      console.error('Screenshot failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('capture-preset-thumbnail', async (event, options = {}) => {
    const hideUiScript = `
      (() => {
        const styleId = '__weePresetCaptureHideUI__';
        if (document.getElementById(styleId)) return true;
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = [
          '[role="dialog"]',
          '[class*="modal"]',
          '[class*="popover"]',
          '[class*="tooltip"]',
          '[class*="widget"]',
          '.settings-action-menu'
        ].join(',') + '{ visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }';
        document.head.appendChild(style);
        return true;
      })();
    `;

    const restoreUiScript = `
      (() => {
        const style = document.getElementById('__weePresetCaptureHideUI__');
        if (style) style.remove();
        return true;
      })();
    `;

    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) {
        return { success: false, error: 'Window not found' };
      }

      const width = Number(options.width) || 960;
      const height = Number(options.height) || 540;
      const quality = Math.min(95, Math.max(60, Number(options.quality) || 88));

      await win.webContents.executeJavaScript(hideUiScript);
      await new Promise((resolve) => setTimeout(resolve, 80));

      const image = await win.webContents.capturePage();
      const resized = image.resize({ width, height, quality: 'best' });
      const buffer = resized.toJPEG(quality);

      return {
        success: true,
        dataUrl: `data:image/jpeg;base64,${buffer.toString('base64')}`,
        mimeType: 'image/jpeg',
        width,
        height,
      };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      try {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win && !win.isDestroyed()) {
          await win.webContents.executeJavaScript(restoreUiScript);
        }
      } catch {
        // noop: best-effort style cleanup
      }
    }
  });
}

module.exports = {
  registerCaptureHandlers,
};
