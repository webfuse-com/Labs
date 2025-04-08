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
        <script src="./shared.js"></script>
        <script src="./popup.js"></script>
    </head>
`, POPUP_HTML, "Invalid head (popup.html)");

assertIn(`
    <body>
        <template id="
`, POPUP_HTML, "SFCs not rendered (popup.html)");

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
`, POPUP_HTML, "Shared SFC not rendered (popup.html)");

assertIn(`
    >
      Popup only
      <style></style>
    </template>
`, POPUP_HTML, "Popup-only SFC not rendered (popup.html)");

assertIn(`
    <img src="/assets/image.png" height="40" />
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
function sayHello() {
  document.querySelector("p")
      .textContent = \`\${randomGreeting()} from Popup.\`;
}
`, POPUP_JS, "Invalid script (popup.js)");