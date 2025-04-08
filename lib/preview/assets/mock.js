/**
 * Browser and Webfuse API mock for local development.
 * Specific interfaces are emulated. Everything else just triggers a debug message to verify the
 * call would have happened.
 */

window.browser = {
    virtualSession: new Proxy({}, {
        get(_, prop) {
            console.debug(`Dry use of borwser.virtualSession.${prop}.`);
            return () => {};
        }
    }),
    tabs: new Proxy({}, {
        get(_, prop) {
            console.debug(`Dry use of borwser.tabs.${prop}.`);
            return () => {};
        }
    })
};