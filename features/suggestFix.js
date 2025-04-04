function applySmartInsertion(original, replacement, instruction = "") {
    const lines = original.split("\n");
    const cleaned = replacement
      .trim()
      .replace(/^```(js|jsx)?/gm, "")
      .replace(/```$/, "")
      .trim();
  
    // Example logic: if instruction mentions "inside return", insert cleaned snippet before closing )
    if (instruction.toLowerCase().includes("inside return")) {
      const returnIndex = lines.findIndex(l => l.includes("return ("));
      const closingIndex = lines.findIndex((l, i) => i > returnIndex && l.includes(");"));
      if (returnIndex !== -1 && closingIndex !== -1) {
        // Insert before closing )
        lines.splice(closingIndex, 0, indent(cleaned, lines[returnIndex]));
        return lines.join("\n");
      }
    }
    // Fallback: append the cleaned snippet
    return `${original.trim()}\n\n// 🔁 Appended snippet\n${cleaned}`;
  }
  
  function indent(code, referenceLine) {
    const match = referenceLine.match(/^(\s+)/);
    const baseIndent = match ? match[1] : "  ";
    return code
      .split("\n")
      .map(line => baseIndent + line)
      .join("\n");
  }
  
  module.exports = { applySmartInsertion };
  