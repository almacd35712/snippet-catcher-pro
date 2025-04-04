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
