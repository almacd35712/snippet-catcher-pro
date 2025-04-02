function highlightMatchedBlock(original, keyword) {
    const lines = original.split("\n");
    const matchLine = lines.findIndex(l => l.includes(keyword));
  
    if (matchLine !== -1) {
      lines[matchLine] = "// 🔍 Matched line below:\n" + lines[matchLine];
    }
  
    return lines.join("\n");
  }
  
  module.exports = { highlightMatchedBlock };
  