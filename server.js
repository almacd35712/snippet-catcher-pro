const express = require("express");
const fs = require("fs");
const path = require("path");
const prettier = require("prettier");
const detectPort = require("detect-port");
const chalk = require("chalk");

const app = express();
const DEFAULT_PORT = 3001;
const BASE_DIR = "C:/Users/alexm/Documents/workout-logger-next";
const UNDO_DIR = path.join(__dirname, "undo");

app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

if (!fs.existsSync(UNDO_DIR)) {
  fs.mkdirSync(UNDO_DIR);
}

function getAllJsFiles(dir, fileList = [], base = dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(base, fullPath).replace(/\\/g, "/");
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllJsFiles(fullPath, fileList, base);
    } else if (file.endsWith(".js") || file.endsWith(".ts")) {
      fileList.push(relPath);
    }
  }
  return fileList;
}

function extractBeforeAfter(snippet) {
  const beforeMatch = snippet.match(/\/\/\s*BEFORE[\s\r\n]+([\s\S]*?)\/\/\s*AFTER/);
  const afterMatch = snippet.match(/\/\/\s*AFTER[\s\r\n]+([\s\S]*)/);
  if (!beforeMatch || !afterMatch) return null;
  return {
    before: beforeMatch[1].trim(),
    after: afterMatch[1].trim(),
  };
}

function matchAndReplace(content, before, after) {
  const index = content.indexOf(before);
  if (index === -1) return null;

  const indentMatch = content.slice(0, index).match(/(^|\n)(\s*)$/);
  const indent = indentMatch ? indentMatch[2] : "";
  const indentedAfter = after
    .split("\n")
    .map((line) => (line ? indent + line : ""))
    .join("\n");

  return content.replace(before, indentedAfter);
}

function backupFile(filePath, originalContent) {
  const filename = path.basename(filePath);
  const timestamp = Date.now();
  const backupPath = path.join(UNDO_DIR, `${filename}.${timestamp}.bak`);
  fs.writeFileSync(backupPath, originalContent, "utf8");
  console.log(chalk.yellow("📝 Backup created:"), backupPath);
}

app.get("/files", (req, res) => {
  try {
    const allowedDirs = [
      path.join(BASE_DIR, "lib"),
      path.join(BASE_DIR, "pages"),
    ];

    const envFile = path.join(BASE_DIR, ".env.local");
    let files = [];

    for (const dir of allowedDirs) {
      if (fs.existsSync(dir)) {
        files.push(...getAllJsFiles(dir).map(f => path.relative(BASE_DIR, path.join(dir, f)).replace(/\\/g, "/")));
      }
    }

    if (fs.existsSync(envFile)) {
      files.push(".env.local");
    }

    console.log("📂 Filtered Files:", files.length);
    res.json({ files });
  } catch (err) {
    console.error("Error filtering files:", err);
    res.status(500).json({ error: "Failed to list files" });
  }
});


app.post("/auto-match", async (req, res) => {
  try {
    const { path: relativePath, code } = req.body;
    const fullPath = path.join(BASE_DIR, relativePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const content = fs.readFileSync(fullPath, "utf8");
    const blocks = extractBeforeAfter(code);
    if (!blocks) {
      return res.status(400).json({ error: "Missing BEFORE/AFTER blocks" });
    }

    const replaced = matchAndReplace(content, blocks.before, blocks.after);
    if (!replaced) {
      return res.json({ success: false, message: "Match not found" });
    }

    // Format validation
    let formatted;
    try {
      formatted = await prettier.format(replaced, { parser: "babel" });
    } catch (err) {
      console.error("❌ Prettier format error:", err.message);
      return res.status(400).json({ error: "Syntax error in new code" });
    }

    backupFile(fullPath, content);
    fs.writeFileSync(fullPath, formatted, "utf8");
    res.json({ success: true, original: content, updated: formatted });
  } catch (err) {
    console.error("Auto-match error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/undo", (req, res) => {
  const { file } = req.body;
  const fileName = path.basename(file);
  const fullPath = path.join(BASE_DIR, file);
  const backups = fs
    .readdirSync(UNDO_DIR)
    .filter((f) => f.startsWith(fileName))
    .sort()
    .reverse();

  if (backups.length === 0) {
    return res.status(404).json({ error: "No undo backup found" });
  }

  const latestBackupPath = path.join(UNDO_DIR, backups[0]);
  const backupContent = fs.readFileSync(latestBackupPath, "utf8");

  fs.writeFileSync(fullPath, backupContent, "utf8");
  console.log(chalk.cyan(`↩️ Undo restored: ${file}`));
  res.json({ success: true });
});

detectPort(DEFAULT_PORT).then((availablePort) => {
  app.listen(availablePort, () => {
    console.log(`🚀 Snippet Catcher Pro running at http://localhost:${availablePort}`);
  });
});
