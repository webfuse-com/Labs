const MANIFEST_JSON = _readDist("manifest.json");

assertEquals({
  "manifest_version": 3,
  "version": "1.0",
  "action": {
    "default_popup": "popup.html"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "js": [
        "content.js"
      ],
      "matches": [
        "<all_urls>"
      ]
    }
  ],
  "chrome_url_overrides": {
    "newtab": "newtab.html"
  },
  "host_permissions": [
    "<all_urls>"
  ],
  "name": "test"
}, JSON.parse(MANIFEST_JSON), "Invalid manifest.json");