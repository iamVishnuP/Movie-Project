const fs = require('fs');
const path = require('path');

function renameFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const oldPath = path.join(dir, file);
    if (file.endsWith("'")) {
      const newName = file.slice(0, -1);
      const newPath = path.join(dir, newName);
      console.log(`Renaming: ${oldPath} -> ${newPath}`);
      if (fs.existsSync(newPath)) {
        if (fs.statSync(newPath).isDirectory()) {
            // If it's a directory, we need to merge or something? 
            // For now let's just skip if it already exists as a non-quote version
            console.log(`Skipping ${oldPath} as ${newPath} already exists`);
            continue;
        }
        fs.unlinkSync(newPath);
      }
      fs.renameSync(oldPath, newPath);
      if (fs.statSync(newPath).isDirectory()) {
        renameFiles(newPath);
      }
    } else if (fs.statSync(oldPath).isDirectory()) {
      renameFiles(oldPath);
    }
  }
}

const targetDir = path.resolve(__dirname);
renameFiles(targetDir);
