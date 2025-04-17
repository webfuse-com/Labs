const BACKGROUND_JS = _readDist("background.js");

assertIn(`
  browser.virtualSession.log("Example...");
`, BACKGROUND_JS, "Invalid background.js");