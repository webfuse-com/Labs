/**
 * Browser and Webfuse API mock for local development.
 * Specific interfaces are emulated. Everything else just triggers a debug message to verify the
 * call would have happened.
 */

const _MOCK = {
    runtime: {},
    tabs: {},
    webfuseSession: {}
};


_MOCK.runtime.onMessage = {
    addListener(cb) {
        window.addEventListener("message", e => {
            cb(e.data.data, e.data.sender);
        });
    }
};


const handleGet = (scope, prop) => {
    if(_MOCK[scope][prop])
        return _MOCK[scope][prop];

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