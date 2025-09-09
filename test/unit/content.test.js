const CONTENT_JS = _readDist("content.js");

assertIn(`
    <strong>augmentation</strong>
  </body>
</html>
\`;
window.CONTENT_CSS = \`strong {
  color: red;
}\`;
(()=>{document.addEventListener("DOMContentLoaded",()=>{var e;if(!window.CONTENT_HTML)return;let n=document.createElement("div");n.innerHTML=window.CONTENT_HTML,(e=document.body)==null||e.appendChild(n)});})();

(()=>{})();

(() => {
  // <stdin>
  browser.webfuseSession.log("Example...");
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
})();
`, CONTENT_JS, "Invalid content.js");