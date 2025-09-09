export function sendMessage() {
    browser.runtime
        .sendMessage({
            from: "newtab"
        });

    browser.tabs
        .sendMessage(0, {
            from: "newtab"
        });
}