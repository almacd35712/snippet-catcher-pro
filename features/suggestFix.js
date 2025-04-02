function applySmartInsertion(original, replacement, instruction = "") {
    const lines = original.split("\n");
    const cleaned = replacement
      .trim()
      .replace(/^```(js|jsx)?/gm, "")
      .replace(/```$/, "")
      .trim();
  
    const insertLogic = instruction.toLowerCase();
  
    if (insertLogic.includes("inside return")) {
      const returnStart = lines.findIndex((l) => l.includes("return ("));
      const returnEnd = lines.findIndex(
        (l, i) => i > returnStart && l.includes(");")
      );
  
      if (returnStart !== -1 && returnEnd !== -1) {
        lines.splice(returnEnd, 0, indent(cleaned, lines[returnStart]));
        return lines.join("\n");
      }
    }
  
    if (insertLogic.includes("below") && insertLogic.includes("button")) {
      const targetLine = lines.findIndex((l) => l.includes("<button"));
      if (targetLine !== -1) {
        lines.splice(targetLine + 1, 0, indent(cleaned, lines[targetLine]));
        return lines.join("\n");
      }
    }
  
    if (insertLogic.includes("above") && insertLogic.includes("button")) {
      const targetLine = lines.findIndex((l) => l.includes("<button"));
      if (targetLine !== -1) {
        lines.splice(targetLine, 0, indent(cleaned, lines[targetLine]));
        return lines.join("\n");
      }
    }
  
    return `${original.trim()}\n\n// 🔁 Appended snippet\n${cleaned}`;
  }
  
  function indent(code, referenceLine) {
    const indentMatch = referenceLine.match(/^(\s+)/);
    const baseIndent = indentMatch ? indentMatch[1] : "  ";
    return code
      .split("\n")
      .map((line) => baseIndent + line)
      .join("\n");
  }
  
  module.exports = { applySmartInsertion };
  