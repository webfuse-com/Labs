/**
 * Browser and Webfuse API mock for local development.
 * Specific interfaces are emulated. Everything else just triggers a debug message to verify the
 * call would have happened.
 */

(() => {
    window.__MOCK = {
        runtime: {},
        tabs: {},
        webfuseSession: {}
    };

    window.__SENDER = {
        url: (document.location.pathname.match(/(background|newtab|popup|content)/) || [ "unknown" ])[0]
    };
    window.__MOCK.runtime.sendMessage = function(data) {
        window.parent.postMessage({
            data,
            sender: window .__SENDER
        }, "*");
    };
    window.__MOCK.tabs.sendMessage = function(data) {
        window.parent.postMessage({
            data,
            sender: window .__SENDER,
            toTab: true
        }, "*");
    };

    window.__MOCK.runtime.onMessage = {
        addListener(cb) {
            window.addEventListener("message", e => {
                cb(e.data.data, e.data.sender);
            });
        }
    };


    const handleGet = (scope, prop) => {
        if(window.__MOCK[scope][prop])
            return window.__MOCK[scope][prop];

        console.debug(`Dry use of %cbrowser.${scope}.${prop}`, "color: blue;");

        return () => Promise.resolve();
    };


    window.browser = {
        runtime: new Proxy({}, {
            get(_, prop) {
                return handleGet("runtime", prop);
            }
        }),
        tabs: new Proxy({}, {
            get(_, prop) {
                return handleGet("tabs", prop);
            }
        }),
        webfuseSession: new Proxy({}, {
            get(target, prop) {
                if(prop === "env") return Reflect.get(target, prop);

                return handleGet("webfuseSession", prop);
            }
        })
    };

    window.chrome = window.browser;
})();