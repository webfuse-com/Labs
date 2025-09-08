const BACKGROUND_JS = _readDist("background.js");

assertIn(`
browser.webfuseSession.log("Example...");
`, BACKGROUND_JS, "Invalid background.js");