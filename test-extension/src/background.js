browser.webfuseSession.log("Example...");

browser.runtime.onMessage.addListener((message, sender) => {
    console.log(`Received message from ${sender.url} in content:`, {
        message,
        sender
    });
});

browser.tabs
    .sendMessage(0, {
        from: "background"
    });