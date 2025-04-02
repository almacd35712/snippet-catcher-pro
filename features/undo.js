const fs = require("fs");

let lastBackup = null;

function revertLastChange() {
  if (!lastBackup || !fs.existsSync(lastBackup.path)) {
    throw new Error("No backup available.");
  }
  fs.writeFileSync(lastBackup.path, lastBackup.content);
}

function saveBackup(filePath) {
  lastBackup = {
    path: filePath,
    content: fs.readFileSync(filePath, "utf8"),
  };
}

module.exports = { revertLastChange, saveBackup };
