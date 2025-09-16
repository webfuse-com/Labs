const CONTENT_JS = _readDist("content.js");

assertIn(`
window.CONTENT_HTML = \`<strong>Content Augmentation</strong>
<br />
<span id="dynamic"></span>
\`;
window.CONTENT_CSS = \`:host {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem;
  background-color: lightgoldenrodyellow;
  border-radius: 0.5rem;
  box-shadow: 0 0 0.75rem 0.075rem rgba(0, 0, 0, 0.1);
}

strong {
  text-transform: uppercase;
}\`;
`, CONTENT_JS, "Invalid content.js");

assertIn(`
  // <stdin>
  browser.webfuseSession.log(text_default);
  browser.runtime.onMessage.addListener((message, sender) => {
    console.log(\`Received message from \${sender.url} in content:\`, {
      message,
      sender
    });
  });
  setTimeout(() => {
    browser.runtime.sendMessage({
      from: "content"
    });
  }, 3e3);
  document.addEventListener("DOMContentLoaded", () => {
    window.AUGMENTATION.querySelector("#dynamic").textContent = \`Today is: \${(/* @__PURE__ */ new Date()).toLocaleDateString()}\`;
  });
})();
`, CONTENT_JS, "Invalid content.js");