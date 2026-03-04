(() => {
    const WS_SERVER_URL = "http://localhost:7654";


    console.log("%cWebfuse Labs", "color: rgb(222, 74, 183); font-weight: bold;");

    const initFrame = name => {
        const sectionElement = document.querySelector(`.${name}`);
        const iframeElement = sectionElement.querySelector("iframe");

        let timeout = setTimeout(() => {
            sectionElement.classList.add("passive");
        }, 1000);

        iframeElement
            .addEventListener("load", () => {
                clearTimeout(timeout);

                const document = iframeElement.contentDocument || iframeElement.contentWindow.document;

                sectionElement.classList.remove("active");
                sectionElement.classList.remove("passive");
                sectionElement.classList.add(
                    (document.body && document.body.innerHTML.trim().length)
                        ? "active"
                        : "passive"
                );
            });
    };

    document
        .addEventListener("DOMContentLoaded", () => {
            initFrame("newtab");
            initFrame("popup");
        });

    const print = message => console.log(`%c${message}`, "color: rgb(222, 74, 183);");

    const reloadModule = name => {
        const iframeElement = document.querySelector(`.${name} iframe`);

        iframeElement.contentWindow.location.reload();
    };

    const wsClient = new WebSocket(WS_SERVER_URL);

    wsClient
        .onmessage = message => {
            if(message.data === "0") {
                print("Hot module replacement initialized.")

                return;
            }

            if(message.data !== "1") return;

            print(`[${new Date().toLocaleString(
                Intl.DateTimeFormat().resolvedOptions().locale, {
                    hour: "numeric", minute: "numeric", second: "numeric"
                }
            )}] Replaced modules due to source change.`);

            reloadModule("newtab");
            reloadModule("popup");
        };

    wsClient
        .onerror = err => {
            console.error("Hot module replacement failed to initialize:", err);
        };
})();