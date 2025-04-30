/* @IMPORTS */

window.customElements.define(
    "/* @TAG_NAME */",
    class extends HTMLElement {
        #DOM;

        constructor() {
            super();

            this.#DOM = this.attachShadow({ mode: "closed" });
            this.#DOM.appendChild(
                document.querySelector("#t-/* @TEMPLATE_ID */")
                    .content
                    .cloneNode(true)
            );
        }

        /* @LIFECYCLE */
    }
);