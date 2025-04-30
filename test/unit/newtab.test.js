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
        <script src="./global.js"></script>
        <script src="./shared.js"></script>
        <script src="./newtab.js"></script>
    </head>
`, NEWTAB_HTML, "Invalid head (newtab.html)");

assertIn(`
    <body>
        <template id="
`, NEWTAB_HTML, "SFCs not rendered (newtab.html)");

assertIn(`
        <span>
        <slot></slot>
      </span>
      <style>
        span {
          color: red;
        }
      </style>
    </template>
    <script>
      window.customElements.define(
        "sfc-my-component-2",
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
  // src/newtab/ts/message.ts
  function sendMessage() {
    browser.tabs.sendMessage(0, {
      from: "newtab"
    });
  }

  // <stdin>
  window.sayHello = function() {
    document.querySelector("p").textContent = \`\${randomGreeting()} from Newtab.\`;
  };
  setTimeout(sendMessage, 1500);
})();

`, NEWTAB_JS, "Invalid script (newtab.js)");