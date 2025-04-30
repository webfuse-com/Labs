const CONTENT_JS = _readDist("content.js");

assertIn(`
(() => {
  // src/js/util.js
  function sendMessage() {
    browser.runtime.sendMessage(0, {
      from: "content"
    });
  }

  // <stdin>
  browser.virtualSession.log("Example...");
  browser.runtime.onMessage.addListener((msg, sender) => {
    console.log("Received message:", msg);
    console.log("From:", sender);
  });
  setTimeout(sendMessage, 3e3);
})();
`, CONTENT_JS, "Invalid content.js");