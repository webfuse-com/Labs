browser.virtualSession.log("Example...");


browser.runtime.onMessage.addListener((msg, sender) => {
    console.log("Received message:", msg);
    console.log("From:", sender);
});

setTimeout(() => {
    browser.runtime.sendMessage(0, {
        from: "content"
    });
}, 3000);