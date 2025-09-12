const BACKGROUND_JS = _readDist("background.js");

// SNAPSHOT
assertIn(`
browser.webfuseSession.log("Example...");
`, BACKGROUND_JS, "Invalid background.js");