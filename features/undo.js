const fs = require("fs");

let lastBackup = {};

function saveBackup(filePath) {
  if (fs.existsSync(filePath)) {
    lastBackup[filePath] = fs.readFileSync(filePath, "utf8");
  }
}

function revertLastChange(filePath) {
  if (lastBackup[filePath]) {
    fs.writeFileSync(filePath, lastBackup[filePath], "utf8");
    return true;
  }
  return false;
}

module.exports = { saveBackup, revertLastChange };
