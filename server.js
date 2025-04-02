const express = require("express");
const fs = require("fs");
const path = require("path");
const prettier = require("prettier");
const detect = require("detect-port");

const app = express();
const DEFAULT_PORT = 3001;
const BASE_DIR = path.join(process.cwd(), "../workout-logger-next");

app.use(express.json());
app.use(express.static("public"));

function getAllJsFiles(dir, fileList = [], base = dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(base, fullPath);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllJsFiles(fullPath, fileList, base);
    } else if (file.endsWith(".js") || file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".jsx")) {
      fileList.push(relPath.replace(/\\/g, "/"));
    }
  });
  return fileList;
}

app.get("/files", (req, res) => {
  try {
    const files = getAllJsFiles(BASE_DIR).filter(f =>
      !f.includes("node_modules") &&
      !f.includes("package-lock.json") &&
      !f.includes("backups") &&
      !f.includes(".git") &&
      !f.includes(".next") &&
      !f.includes("dist") &&
      !f.includes("coverage") &&
      !f.includes("vercel") &&
      !f.includes("credentials.json") &&
      !f.includes("public/") &&
      !f.startsWith(".")
    );
    console.log("📂 Files sent (" + files.length + ")");
    res.json({ files });
  } catch (err) {
    console.error("Error reading files:", err);
    res.status(500).json({ error: "Failed to read files" });
  }
});

app.post("/auto-match", async (req, res) => {
  try {
    const { path: relativePath, code } = req.body;

    if (!relativePath || !code || typeof code !== "string") {
      console.warn("⚠️ Empty or invalid code snippet received");
      return res.status(400).json({ error: "Invalid code snippet" });
    }

    const fullPath = path.join(BASE_DIR, relativePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const content = fs.readFileSync(fullPath, "utf8");
    const cleanedCode = cleanCodeSnippet(code);
    const replaced = await autoReplace(content, cleanedCode);
    const formatted = prettier.format(replaced, { parser: "babel" });

    fs.writeFileSync(fullPath, formatted, "utf8");
    console.log("✅ File updated successfully");
    res.json({ success: true, old: content, updated: formatted });
  } catch (err) {
    console.error("❌ Auto-match error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

function cleanCodeSnippet(raw) {
  const lines = raw.split("\n");
  return lines
    .filter(line =>
      !/^\s*(js|jsx|tsx|Copy|Edit|\*\*.*\*\*|\/\/\s?(Replace|Fix):?)\s*$/i.test(line)
    )
    .map(line => line.replace(/^\s*(\/\/\s)?(✅|🔁|❌|📌|🔄)?\s?(DELETE THIS LINE\s*–.*)?/, ""))
    .join("\n")
    .trim();
}

async function autoReplace(original, newCode) {
  const lines = original.split("\n");
  const matchStart = lines.findIndex(line => line.includes("for (const col of actualCols"));
  const matchEnd = lines.findIndex((line, i) => i > matchStart && line.includes("}"));

  if (matchStart !== -1 && matchEnd > matchStart) {
    console.log("🔁 Replacing matched block");
    lines.splice(matchStart, matchEnd - matchStart + 1, newCode);
  } else {
    console.log("➕ Code appended at end of file.");
    lines.push("\n// 🔁 Append fallback replacement\n" + newCode);
  }

  return lines.join("\n");
}

detect(DEFAULT_PORT).then((availablePort) => {
  app.listen(availablePort, () => {
    console.log(`🚀 Snippet Catcher Pro running at http://localhost:${availablePort}`);
  });
});
