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