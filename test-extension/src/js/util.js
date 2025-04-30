export function sendMessage() {
    browser.runtime
        .sendMessage(0, {
            from: "content"
        });
}