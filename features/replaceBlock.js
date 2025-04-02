function replaceExactBlock(original, oldBlock, newBlock) {
    const cleanedOld = oldBlock.trim().replace(/^```(js)?/gm, "").replace(/```$/, "").trim();
    const cleanedNew = newBlock.trim().replace(/^```(js)?/gm, "").replace(/```$/, "").trim();
  
    if (!original.includes(cleanedOld)) {
      return null;
    }
  
    return original.replace(cleanedOld, cleanedNew);
  }
  
  module.exports = { replaceExactBlock };
  