const BACKGROUND_JS = _readDist("background.js");

assertIn(`
(() => {
  // <stdin>
  browser.virtualSession.log("Example...");
})();
`, BACKGROUND_JS, "Invalid background.js");