/**
 * Browser and Webfuse API mock for local development.
 * Specific interfaces are emulated. Everything else just triggers a debug message to verify the
 * call would have happened.
 */

const _MOCK = {
    runtime: {},
    tabs: {},
    virtualSession: {}
};


const handleGet = (scope, prop) => {
    if(_MOCK[scope][prop])
        return _MOCK[scope][prop];

    console.debug(`Dry use of browser.${scope}.${prop}.`);

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
    virtualSession: new Proxy({}, {
        get(_, prop) {
            return handleGet("virtualSession", prop);
        }
    })
};


_MOCK.runtime.onMessage.addListener = function(cb) {
    window.addEventListener("message", e => {
        cb(e.data.data, e.data.sender);
    });
};


window.chrome = window.browser;