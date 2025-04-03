const express = require("express");
const fs = require("fs");
const path = require("path");
const prettier = require("prettier");
const detectPort = require("detect-port");

const app = express();
const DEFAULT_PORT = 3001;

// ✅ Lock to your actual project
const BASE_DIR = "C:/Users/alexm/Documents/workout-logger-next";

app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

function getAllJsFiles(dir, fileList = [], base = dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(base, fullPath);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllJsFiles(fullPath, fileList, base);
    } else if ((file.endsWith(".js") || file.endsWith(".ts")) && !relPath.includes("node_modules")) {
      fileList.push(relPath.replace(/\\/g, "/"));
    }
  });
  return fileList;
}

app.get("/files", (req, res) => {
  const files = getAllJsFiles(BASE_DIR).filter(f =>
    !f.includes("node_modules") &&
    !f.includes("package-lock.json") &&
    !f.includes("backups") &&
    !f.includes(".git") &&
    !f.includes(".next") &&
    !f.includes("dist") &&
    !f.includes("coverage") &&
    !f.includes("vercel") &&
    !f.includes("public/") &&
    !f.startsWith(".")
  );
  res.json({ files });
});

app.post("/auto-match", async (req, res) => {
  try {
    const { path: relativePath, code, instruction } = req.body;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Invalid code snippet" });
    }

    const fullPath = path.join(BASE_DIR, relativePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const original = fs.readFileSync(fullPath, "utf8");
    const cleanedCode = cleanCodeSnippet(code);
    const newContent = autoReplace(original, cleanedCode, instruction);
    const formatted = await prettier.format(newContent, { parser: "babel" });

    fs.writeFileSync(fullPath, formatted, "utf8");

    res.json({
      success: true,
      original,
      updated: formatted,
    });
  } catch (err) {
    console.error("Auto-match error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

function cleanCodeSnippet(raw) {
  return raw
    .split("\n")
    .filter(line => !/^\s*(js|Copy|Edit|\*\*.*\*\*|\/\/ ?(Replace|Fix):?)\s*$/i.test(line))
    .map(line => line.replace(/^\s*(\/\/\s)?(✅|🔁|❌|📌|🔄|🔧)?\s?(DELETE THIS LINE.*)?/, ""))
    .join("\n")
    .trim();
}

function autoReplace(original, newCode, instruction = "") {
  const lines = original.split("\n");

  const matchStart = lines.findIndex(line => line.includes("for (const col of actualCols"));
  const matchEnd = lines.findIndex((line, i) => i > matchStart && line.includes("}"));

  if (matchStart !== -1 && matchEnd > matchStart) {
    lines.splice(matchStart, matchEnd - matchStart + 1, newCode);
  } else {
    const marker = instruction || "// Inserted by Snippet Catcher Pro";
    lines.push("\n" + marker + "\n" + newCode);
  }

  return lines.join("\n");
}

// Start with a dynamic port
detectPort(DEFAULT_PORT).then(port => {
  app.listen(port, () => {
    console.log(`🚀 Snippet Catcher Pro running at http://localhost:${port}`);
  });
});
