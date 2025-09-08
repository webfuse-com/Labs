const SHARED_CSS = _readDist("shared.css");

assertIn(`
:root {
  --color-primary: #F194B4;
  --color-bg: #FFFFFF;
  --color-fg: #002626;
}

html {
  background-color: var(--color-bg);
  color: var(--color-fg);
}

body {
  padding: 1rem;
}
`, SHARED_CSS, "Invalid shared.css");