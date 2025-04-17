assertExists("#newtab iframe", "Missing newtab frame");
assertExists("#popup iframe", "Missing popup frame");

assertExists("header > div > ul a", "Missing header menu");

assertAttr("#newtab iframe", "src", "/newtab.html");
assertAttr("#popup iframe", "src", "/popup.html");