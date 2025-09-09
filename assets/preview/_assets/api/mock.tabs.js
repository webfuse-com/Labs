(() => {
    window.__SENDER = {
        ... window.__SENDER,

        tab: {
            id: 0,
            incognito: false,
            index: 0,
            title: document.title,
            url: document.location.href,
            windowId: 0,
        }
    }
})();