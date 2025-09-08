browser.webfuseSession.log("Example...");

browser.runtime.onMessage.addListener((msg, sender) => {
    console.log("Received message:", msg);
    console.log("From:", sender);
});

setTimeout(util.sendMessage, 3000);