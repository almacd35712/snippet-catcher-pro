function autoMatchBlock(original, replacement) {
    const lines = original.split("\n");
    const cleaned = replacement
      .trim()
      .replace(/^```(js|jsx)?/gm, "")
      .replace(/```$/, "")
      .trim();
  
    const matchStart = lines.findIndex(line =>
      line.includes("for (const col of actualCols")
    );
    const matchEnd = lines.findIndex((line, i) => i > matchStart && line.includes("}"));
  
    if (matchStart !== -1 && matchEnd > matchStart) {
      lines.splice(matchStart, matchEnd - matchStart + 1, cleaned);
    } else {
      lines.push("\n// 🔁 Appended fallback replacement\n" + cleaned);
    }
  
    return lines.join("\n");
  }
  
  module.exports = { autoMatchBlock };
  