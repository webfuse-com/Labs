const CONTENT_JS = _readDist("content.js");

assertIn(`
  browser.virtualSession.log("Example...");
`, CONTENT_JS, "Invalid content.js");