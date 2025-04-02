const esprima = require("esprima");

function isValidJavaScript(code) {
  try {
    esprima.parseScript(code);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = { isValidJavaScript };
