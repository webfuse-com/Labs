_MOCK.runtime.onMessage.addListener = function(cb) {
    window.addEventListener("message", e => {
        (e.data.source === "runtime")
            && cb(e.data.data, e.data.sender);
    });
};