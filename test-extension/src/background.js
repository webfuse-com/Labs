browser.webfuseSession.log("Example...");

browser.runtime.onMessage.addListener((msg, sender) => {
    console.log("> background");
    console.log("Received message:", msg);
    console.log("From:", sender);
});

browser.tabs
    .sendMessage(0, {
        from: "background"
    });