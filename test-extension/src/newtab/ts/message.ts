export function sendMessage() {
    browser.tabs
        .sendMessage(0, {
            from: "newtab"
        });
}