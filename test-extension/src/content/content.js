browser.webfuseSession.log("Example...");

browser.runtime.onMessage.addListener((msg, sender) => {
    console.log("> content");
    console.log("Received message:", msg);
    console.log("From:", sender);
});

setTimeout(() => {
    browser.runtime
        .sendMessage({
            from: "content"
        });
}, 3000);