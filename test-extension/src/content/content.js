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

document.addEventListener("DOMContentLoaded", () => {
    window.AUGMENTATION
        .querySelector("#dynamic")
        .textContent = `Today is: ${new Date().toLocaleDateString()}`;
});