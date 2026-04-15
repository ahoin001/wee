function createJsonStorageUtils({ fsPromises, path }) {
  async function readJson(filePath, defaultValue) {
    try {
      const data = await fsPromises.readFile(filePath, 'utf-8');
      if (!data.trim()) {
        console.warn(`[READ] File is empty: ${filePath}`);
        return {};
      }

      try {
        return JSON.parse(data);
      } catch {
        console.warn(`[READ] File is invalid JSON: ${filePath}`);
        return {};
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.warn(`[READ] File not found: ${filePath}`);
      } else if (err.code === 'EACCES') {
        console.error(`[READ] Permission denied: ${filePath}`);
      } else {
        console.error(`[READ] Error reading file ${filePath}:`, err);
      }
      return defaultValue;
    }
  }

  async function writeJson(filePath, data) {
    const tempPath = `${filePath}.tmp`;
    try {
      await fsPromises.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      await fsPromises.rename(tempPath, filePath);
      console.log(`[WRITE] Atomically wrote file: ${filePath}`);
      return true;
    } catch (err) {
      if (err.code === 'EACCES') {
        console.error(`[WRITE] Permission denied: ${filePath}`);
      } else {
        console.error(`[WRITE] Error writing file ${filePath}:`, err);
      }
      try {
        await fsPromises.unlink(tempPath);
      } catch {}
      return false;
    }
  }

  async function copyFileToUserDirectory(sourcePath, targetDirectory, filename) {
    try {
      const targetPath = path.join(targetDirectory, filename);
      await fsPromises.copyFile(sourcePath, targetPath);
      console.log(`[COPY] Copied file to: ${targetPath}`);
      return targetPath;
    } catch (err) {
      console.error('[COPY] Failed to copy file:', err);
      throw err;
    }
  }

  return {
    readJson,
    writeJson,
    copyFileToUserDirectory,
  };
}

module.exports = {
  createJsonStorageUtils,
};
