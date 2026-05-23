import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import chokidar from 'chokidar';

export const collectFiles = async (dirPath) => {
  if (!fs.existsSync(dirPath)) return [];
  const files = [];

  const scanDir = async (currentDir) => {
    let list;
    try {
      list = fs.readdirSync(currentDir);
    } catch (e) {
      return;
    }
    for (const file of list) {
      const fullPath = path.join(currentDir, file);
      let stat;
      try {
        stat = fs.statSync(fullPath);
      } catch (e) {
        continue;
      }
      if (stat.isDirectory()) {
        await scanDir(fullPath);
      } else {
        files.push({
          path: fullPath,
          size: stat.size,
          modifiedAt: stat.mtime,
          hash: getFileHash(fullPath),
        });
      }
    }
  };

  await scanDir(dirPath);
  return files;
};

export const watchFiles = (dirPath, onChangeCallback) => {
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
    } catch (e) {
      return null;
    }
  }
  const watcher = chokidar.watch(dirPath, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
  });

  watcher
    .on('add', filePath => onChangeCallback('created', filePath))
    .on('change', filePath => onChangeCallback('modified', filePath))
    .on('unlink', filePath => onChangeCallback('deleted', filePath));

  return watcher;
};

function getFileHash(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (e) {
    return '';
  }
}
