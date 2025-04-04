function highlightMatchedBlock(original, keyword) {
    const lines = original.split("\n");
    const matchIndex = lines.findIndex(line => line.includes(keyword));
    if (matchIndex !== -1) {
      lines[matchIndex] = "// 🔍 Matched line below:\n" + lines[matchIndex];
    }
    return lines.join("\n");
  }
  
  module.exports = { highlightMatchedBlock };
  