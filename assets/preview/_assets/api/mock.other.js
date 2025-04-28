const sender = {
    url: null   // TODO
};

_MOCK.runtime.sendMessage = function(data) {
    window.parent.postMessage({
        data,
        sender,
        source: "runtime"
    }, "*");
};