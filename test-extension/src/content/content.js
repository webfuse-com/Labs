browser.webfuseSession.log("Example...");

browser.runtime.onMessage.addListener((message, sender) => {
    console.log(`Received message from ${sender.url} in content:`, {
        message,
        sender
    });
});

setTimeout(() => {
    browser.runtime
        .sendMessage({
            from: "content"
        });
}, 3000);