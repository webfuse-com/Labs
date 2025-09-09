const POPUP_HTML = _readDist("popup.html");
const POPUP_CSS = _readDist("popup.css");
const POPUP_JS = _readDist("popup.js");

assertIn(`
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Test</title>
    <link rel="stylesheet" href="./global.css" />
    <link rel="stylesheet" href="./shared.css" />
    <link rel="stylesheet" href="./popup.css" />
    <script src="./global.js"></script>
    <!-- <script src="./shared.js"></script> -->
    <script src="./popup.js"></script>
  </head>
`, POPUP_HTML, "Invalid head (popup.html)");

assertIn(`
    <body>
        <template id="
`, POPUP_HTML, "SFCs not rendered (popup.html)");

assertIn(`
    <input type="url" placeholder="Type in a URL and press enter" />
      <style>
        input {
          color: red;
        }
      </style>
    </template>
    <script>
      (() => {
        // <stdin>
        window.customElements.define(
          "webfuse-search",
          class extends HTMLElement {
            #DOM;
            constructor() {
              super();
              this.#DOM = this.attachShadow({ mode: "closed" });
              this.#DOM.appendChild(
`, POPUP_HTML, "Shared SFC not rendered (popup.html)");

assertIn(`
    >
      Popup only
      <style></style>
    </template>
`, POPUP_HTML, "Popup-only SFC not rendered (popup.html)");

assertIn(`
    <img src="./static/image.png" height="40" />
    <h1>Popup</h1>
    <p>This is presented in the popup window.</p>
    <sfc-my-component onclick="sayHello()">Say Hello</sfc-my-component>
  </body>
</html>
`, POPUP_HTML, "Markup not rendered (popup.html)");

assertIn(`
h1 {
  font-size: 1.5rem;
}
`, POPUP_CSS, "Invalid stylesheet (popup.css)");

assertIn(`
(() => {
  // src/shared/js/constants.js
  var GREETINGS = ["Hello", "Hi", "Hoi"];

  // src/shared/js/util/util.js
  function getGreeting() {
    return GREETINGS.sort(() => Math.round(Math.random()))[0];
  }

  // src/shared/js/shared.js
  function randomGreeting() {
    return getGreeting();
  }

  // <stdin>
  window.sayHello = function() {
    document.querySelector("p").textContent = \`\${randomGreeting()} from Popup.\`;
  };
  browser.runtime.onMessage.addListener((message, sender) => {
    console.log(\`Received message from \${sender.url} in popup:\`, {
      message,
      sender
    });
  });
  browser.runtime.sendMessage({
    from: "newtab"
  });
  browser.tabs.sendMessage(0, {
    from: "newtab"
  });
})();
`, POPUP_JS, "Invalid script (popup.js)");