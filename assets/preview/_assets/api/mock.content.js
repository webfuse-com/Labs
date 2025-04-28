_MOCK.runtime.onMessage.addListener = function(cb) {
    window.addEventListener("message", e => {
        (e.data.source === "tabs")
            && cb(e.data.data, e.data.sender);
    });
};


const sender = {
    id: 0,
    url: null,  // TODO: Distinguish sender
    ...(true)   // TODO: Distinguish sender (type)
        ? {
                tab: {
                id: 0,
                incognito: false,
                index: 0,
                title: document.title,
                url: document.location.href,
                windowId: 0,
            }
        }
        : {}
};

_MOCK.tabs.sendMessage = function(_, data) {
    window.parent.postMessage({
        data,
        sender,
        source: "tabs"
    }, "*");
};