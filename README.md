<a href="#webfuse-labs" target="_blank"><img src="./.github/hero.png" alt="Webfuse Labs"></a>

# Webfuse Labs

**Labs** is a framework that facilitates web extension development: Build with a bundler made for extensions, in a local preview environment. It supports Typescript and SCSS out-of-the-box, and also [Vue](https://vuejs.org/guide/scaling-up/sfc.html)-inspired single file components. Imagine [Vite](https://vite.dev), but for extensions.

<p align="left">
  <a href="https://www.webfuse.com"><img src="https://img.shields.io/badge/Webfuse-4D94FF"></a>
  <a href="https://www.webfuse.com/labs"><img src="https://img.shields.io/github/package-json/v/webfuse-com/Labs?color=C65AA0"></a>
  <a href="https://github.com/webfuse-com/Labs/actions/workflows/test.yml"><img src="https://img.shields.io/github/actions/workflow/status/webfuse-com/Labs/test.yml?label=test&logo=github"></a>
</p>

<p align="center">
  <a href="#webfuse-labs" target="_blank"><img src="./.github/figure-1.png" alt="Labs' features: Bundler, SFCs, and Preview""></a>
</p>

1. [**Prerequisites**](#prerequisites)
2. [**Installation**](#installation)
3. [**Preview**](#preview)
4. [**Assets**](#assets)
4. [**Single File Components**](#single-file-components)
4. [**Content Augmentation**](#content-augmentation)
5. [**Browser & Webfuse APIs**](#browser--webfuse-apis)
6. [**Upload**](#upload)
7. [**CLI Reference**](#cli-reference)
8. [**Cheatsheet**](#cheatsheet)
8. [**with Webfuse**](#with-webfuse)
9. [**Further Reading**](#further-reading)

## Prerequisites

- [Node.js + NPM](https://nodejs.org) v22+/v10+
- [Webfuse](https://webfuse.com/studio/auth/signup) Account (optional, recommended)
  > [**Webfuse**](https://webfuse.com) is a web augmentation platform to instantly extend, automate & share any web session. Webfuse extensions are browser extensions, but enhanced with a powerful augmentation API.

## Installation

Run the below command to install Labs. It becomes available in your command line interface (CLI) as `labs`.

``` console
npm i -g webfuse-com/labs
```

> You might need to execute the above command with admin priviliges. Try `sudo npm i -g webfuse-com/labs` – at your own risk. Otherwise, create a wrapper directory, and install Labs on project level:
> ``` console
> mkdir with-labs
> cd with-labs
> npm init -y
> npm i webfuse-com/labs
> ```
> Prefix all subsequent `labs` commands with `npx`, e.g. `npx labs create`.

Use `labs` with the `create` command to scaffold an extension project:

```  console
labs create
cd my-extension
```

## Preview

Extensions can be uploaded to Webfuse through a neat session user interface (UI) dialogue. In a prototyping or incremental development process, however, this is unfortunate. Natural browser and file system boundaries force it to become a redundant task. With Labs, you can instead preview the latest state of your bundle right on your local machine. The following command spins up the preview environment:

``` console
labs preview
```

The preview app is a browser application. Open the address that is printed to the console in a web browser. The preview environment implements hot module replacement. This is, the provided UI always presents the latest bundle.

<a href="#preview" target="_blank"><img src="./.github/figure-2.png" alt="Webfuse Labs Preview Environment"></a>

> `labs` commands that affect a specific extension work in its root directory. With other words, the current working directory (`pwd`) needs to correspond to the extensions project's root directory.

## Assets

The scaffolded project resembles the following file structure:

```
.                                       # Extension root directory
└── /my-extension
    ├── /dist 🛠️                        # Eventually emitted files, for upload in a session
    ├── /src                            # Source files to edit
    │   ├── /newtab                     # Newtab target files
    │   │   ├── newtab.html ❕
    │   │   ├── newtab.[css|scss]
    │   │   └── newtab.[js|ts]
    │   ├── /popup                      # Popup target files
    │   │   ├── popup.html ❕
    │   │   ├── popup.[css|scss]
    │   │   └── popup.[js|ts]
    │   ├── /shared                     # Shared files
    │   │   ├── /components             # Single file components ('SFCs'), see below
    │   │   │   └── my-component.html
    │   │   ├── shared.[css|scss]
    │   │   └── shared.[js|ts]
    │   ├── background.js ❕            # Background script
    │   └── icon.svg                    # Extension icon
    └── /static                         # Static assets (reference like /static)
        └── image.png
```

The `/src` directory contains all individual extension files. Edit them to your needs. Aligned with browser and Webfuse terminology, Labs constrains the file structure and naming in order to enforce consistency across extensions: There is an asset directory targeting each a new tab (_'newtab'_), and the popup window (_'popup'_), as well as a directory shared among both aforementioned (_'shared'_). The target directories require exactly one markup file, and may optionally contain a stylesheet and a script file. Moreover, a shared stylesheet and script may be provided to the shared directory. Also, each directory may contain a components directory that contains Labs-specific single file components, i.e. reusable markup (more details below).

Run the `bundle` command to emit your session-ready extension bundle to the `/dist` directory:

``` console
labs bundle
```

The bundler automatically runs with the preview environment. Once your preview is up and running, there is no need to run the `bundle` command everytime you edited the source.

> You do not have to specify a `manifest.json`. Labs takes care of all the metadata. In particular, it copies the name and version fields from `package.json`.

### Markup

Markup is automatically wrapped within proper document syntax. There is hence no need to declare doctype, `<html>`, `<head>`, or `<body>`.

<sub><code>src/newtab/newtab.html</code></sub>

``` html
<h1>Newtab</h1>
<p>
    This is presented in each new tab in a session.
</p>
```

### Style

Stylesheets can either be encoded with CSS (`.css`) or SCSS (`.scss`). Shared styles (inside the `shared` directory) apply across all targets. Labs, furthermore, specifies a handful of normalized styles (see [global.css](./assets/bundle/globals/global.css)).

<sub><code>src/newtab/newtab.css</code></sub>

``` css
h1 {
  font-size: 2rem;
}
```

> Component styles are always scoped in Labs.

### Script

Scripts evaluate in the respective target's global (window) scope. Both JavaScript (`.js`) and TypeScript (`.ts`) files work out-of-the-box, as well as module bundling, which allows relative imports. To enforce clean scoping, absolute imports, and relative imports beyond a target directory are not allowed. Shared script are furthermore accessible from all targets via macro import (prefixed with `#shared`):

<sub><code>src/shared/constants.js</code></sub>

``` js
export const GREETINGS = [ "Hello", "Hi", "Hoi" ];
```
<sub><code>src/shared/shared.js</code></sub>

``` js
import { GREETINGS } from "./constants.js";

function randomGreeting() {
  return GREETINGS
    .sort(() => Math.round(Math.random()))
    .pop();
}
```

<sub><code>src/popup/popup.js</code></sub>

``` js
import { randomGreeting } from "#shared/shared.js";

function sayHello() {
  document.querySelector("p")
    .textContent = `${randomGreeting()} from Popup.`;
}
```

### Icon

An optional extension icon can be provided as an SVG. The Labs bundler creates different size PNGs for the icon to be compatible across browsers and devices.

### Static Assets

Provide static assets, such as images to the `/static` directory.

<sub><code>src/popup/popup.html</code></sub>

``` html
<img src="./static/image.png">
```

## Single File Components

Labs introduces a lean single file component (SFC) interface. Every SFC is declared in its own file, which must be a direct child of a `/components` directory. A dedicated `/components` directory works for each asset directory – i.e. a target or the shared directory. An SFC's filename (without the extension) dictates the related tag name. A tag name is furthermore always prefixed (namespaced) with `sfc-`.

<sub><code>src/shared/components/my-component.html</code></sub>

``` html
<template>
  <button type="button">
    <slot></slot>
  </button>
</template>

<script>
  connectedCallback() {
    console.log("SFC attached to target.");
  }
</script>

<style>
  button {
    cursor: pointer;
    outline: none;
    border: none;
  }
</style>
```

<sub><code>src/newtab/popup.html</code></sub>

``` html
<h1>Newtab</h1>
<p>
    This is presented in the popup window.
</p>

<SFC-MY-COMPONENT onclick="sayHello()">Say Hello</SFC-MY-COMPONENT>
```

A valid SFC file assembles from at most one of the following tags (top-level): `<template>` can contain the component markup. It can be leveraged with [slots](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots#adding_flexibility_with_slots). `<style>` can contain styles that apply only to the component markup. `<script>` can contain native web component [lifecycle callbacks](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#custom_element_lifecycle_callbacks), and utilize related concepts. A component's DOM object can be accessed through `this.#DOM`.

> SFCs work with SCSS and TypeScript by specifiying a `lang` attribute on the respective tag. This is, `<style lang="scss">` or `<script lang="ts">`, respectively.

## Content Augmentation

The background and content script can optionally be grouped within directories, too. In case of a grouped content script, files to augmentat any individual content page can be placed in the `augmentation` subdirectory:

```
.
└── /my-extension
    ├── ...
    └── /src
        ├── ...
        ├── /background                 # Optionally group background files
        │   │   helpers.js              # Relative import helper modules
        │   └── background.[js|ts]
        └── /content                    # Optionally group content files
            ├── augmentation            # UI augmentation files
            │   ├── content.html
            │   └── content.c[css|scss]
            └── content.[js|ts]
```

Augmentation exists on top of actually browsed pages' content. It is encapsulated from the respective window scope, except for the accessor identifier `window.AUGMENTATION`. The accessor represents the root node (host) of the augmentation component DOM subtree.

<sub><code>src/content/augmentation/content.html</code></sub>

``` js
<span id="dynamic"></span>
```

<sub><code>src/content/augmentation/content.css</code></sub>

``` css
:host {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
```

<sub><code>src/content/content.js</code></sub>

``` js
document.addEventListener("DOMContentLoaded", () => {
  window.AUGMENTATION
    .querySelector("#dynamic")
    .textContent = `Today is: ${new Date().toLocaleDateString()}`;
});
```

<a href="#content-augmentation" target="_blank"><img src="./.github/figure-3.png" alt="Webfuse Labs Content Augmentation" width="500"></a>

> The second layer of the lefthand side preview pane simulates how the extension works in a third-party page (content). Keep hovering a layer to activate it, i.e., move it to the top. 

## Browser & Webfuse APIs

The Labs preview environment primarily enables incremental development of the extension UI. Extensions do, certainly, subsist on [Browser APIs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API), and the [Webfuse API](https://dev.webfuse.com/reference/extension-api/). API-based functionality, on the other hand, is strongly tied to a browser and session environment.

A Labs preview only mocks what is relevant to an extension's components. Complementary API properties are considered 'dry': They exist for completeness, but a call does nothing but return an empty promise, and log a debug message. 

<sub><code>src/content.js</code></sub>

``` js
browser.runtime
  .sendMessage("Hello world");
```

### Implemented API

| Property Chain | State |
| :- | :- |
| `browser.runtime.onMessage.addListener()` | ✔ |
| `browser.runtime.sendMessage()` | ✔ |
| `browser.tabs.sendMessage()` | ✔ |
| `browser.browserAction.resizePopup()` | ⏳ |
| `browser.browserAction.detachPopup()` | ⏳ |
| `browser.browserAction.attachPopup()` | ⏳ |

> API mocking is work in progress.

## Upload

### Webfuse

Follow the [Official Documentation](https://dev.webfuse.com/guides/virtual-web-extensions/#how-to-install-an-extension) to install your extension to a Webfuse session. This holds for both use in production, as well as verification with full browser/session capabilities. In a nutshell, this comprises three steps:

1. Open your Webfuse session,
2. navigate to the Extensions tab, and
3. use the upload option.

> Select the `/dist` directory for upload.

### Browser

- [Upload to Chrome](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)
- [Upload to Firefox](https://extensionworkshop.com/documentation/publish/package-your-extension)

## CLI Reference

### Synopsis

``` console
labs <command> [--<argument> [<option>]?]*
```

`--stacktrace` &emsp; Print stacktrace of non-recoverable exceptions  
`--working-dir` &emsp; Specify working, i.e. extension directory &emsp; `./`  

### Commands

#### `bundle`

Bundle and emit extension source files.

`--debug`, `-D` &emsp; Skip minification of emitted files  
`--watch`, `-W` &emsp; Watch files for incremental builds  

#### `create`

Create an extension project blueprint.

`--path`, `-P` &emsp; Path to create blueprint at &emsp; `./my-extension`  

#### `preview`

Spin up the preview environment.

`--only` &emsp; Just serve preview, without implicit bundle (watch)  

#### `update`

Update Labs to the latest version.

#### `version`

Print the currently installed version of Labs.

> Use the `help` command to display usage description in the CLI.

## Cheatsheet

**Setup:**

1. `npm i -g webfuse-com/labs`
2. `labs create`
3. `cd my-extension`

**Workflow:**

1. `labs preview`
2. Edit `/src`.

**Upload:**

1. `labs bundle`
2. Upload `/dist` to Webfuse session.

## with Webfuse

### Environmental Variables

<sub><code>.env</code></sub>

``` .env
FOO=bar
BAZ=123
```

<sub><code>src/background.js</code></sub>

``` js
console.log(browser.webfuseSession.env.FOO);  // "bar"
```

> Environment variables are emptied during build, unless debug mode is used.

## Further Reading

- [Planned Features](https://github.com/webfuse-com/labs/issues)
- [Webfuse](https://www.webfuse.com)
- [Webfuse Extensions](https://dev.webfuse.com/extension-api)
- [Browser Extensions](https://developer.chrome.com/docs/extensions/get-started)
- [Introducing: Web Augmentation](https://www.webfuse.com/blog/web-augmentation)

<p align="right">
  <sub>&copy; Surfly BV</sub>
</p>