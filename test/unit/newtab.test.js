const NEWTAB_HTML = _readDist("newtab.html");
const NEWTAB_CSS = _readDist("newtab.css");
const NEWTAB_JS = _readDist("newtab.js");

assertIn(`
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Test</title>
    <link rel="stylesheet" href="./global.css" />
    <link rel="stylesheet" href="./shared.css" />
    <link rel="stylesheet" href="./newtab.css" />
    <script src="./newtab.js"></script>
  </head>
`, NEWTAB_HTML, "Invalid head (newtab.html)");

assertIn(`
  <body>
    <template id="t-
`, NEWTAB_HTML, "SFCs not rendered (newtab.html)");

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
                document.querySelector("#t-
`, NEWTAB_HTML, "Shared SFC not rendered (newtab.html)");

assertNotIn(`
    >
      Popup only
      <style></style>
    </template>
`, NEWTAB_HTML, "Popup-only SFC was rendered (newtab.html)");

assertIn(`
    <h1>Newtab</h1>
    <p>This is presented in each new tab in a session.</p>
    <sfc-my-component onclick="sayHello()">Say Hello</sfc-my-component>
  </body>
</html>
`, NEWTAB_HTML, "Markup not rendered (newtab.html)");

assertIn(`
h1 {
  font-size: 3rem;
}
  `, NEWTAB_CSS, "Invalid stylesheet (newtab.css)");
  
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

  // src/newtab/ts/message.ts
  function sendMessage() {
    browser.runtime.sendMessage({
      from: "newtab"
    });
    browser.tabs.sendMessage(0, {
      from: "newtab"
    });
  }

  // <stdin>
  window.sayHello = function() {
    document.querySelector("p").textContent = \`\${randomGreeting()} from Newtab.\`;
  };
  browser.runtime.onMessage.addListener((message, sender) => {
    console.log(\`Received message from \${sender.url} in newtab:\`, {
      message,
      sender
    });
  });
  setTimeout(sendMessage, 1500);
})();
`, NEWTAB_JS, "Invalid script (newtab.js)");