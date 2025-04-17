const GLOBAL_CSS = _readDist("global.css");
// const GLOBAL_JS = _readDist("global.js");

assertIn(`
@import url("https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap");

* {
    box-sizing: border-box;
}

html, body {
    margin: 0;
    height: 100%;
}

html {
    font-family: "Open Sans", Arial, Helvetica, sans-serif;
}
`, GLOBAL_CSS, "Invalid global.css");