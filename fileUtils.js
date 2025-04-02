const fs = require("fs");
const path = require("path");

function getAllJsFiles(baseDir) {
  const result = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path
        .relative(baseDir, fullPath)
        .replace(/\\/g, "/");

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (relPath.endsWith(".js") || relPath.endsWith(".ts")) {
        result.push(relPath);
      }
    }
  }

  walk(baseDir);
  return result;
}

module.exports = { getAllJsFiles };
