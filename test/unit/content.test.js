const CONTENT_JS = _readDist("content.js");

assertIn(`
(() => {
  // <stdin>
  browser.virtualSession.log("Example...");
  browser.runtime.onMessage.addListener((msg, sender) => {
    console.log("Received message:", msg);
    console.log("From:", sender);
  });
  setTimeout(() => {
    browser.runtime.sendMessage(0, {
      from: "content"
    });
  }, 3e3);
})();
`, CONTENT_JS, "Invalid content.js");