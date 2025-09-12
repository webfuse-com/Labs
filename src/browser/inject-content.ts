import _config from "./config.json" with { type: "json" };


const DEFAULT_CSS = `
:host {
    position: fixed;
    margin: 2rem;
    bottom: 0;
    right: 0;
}
`;


document.addEventListener("DOMContentLoaded", () => {
	// Only inject if content augmentation is defined
	if(!window.CONTENT_HTML) return;

	const contentAugmentatioSingleton = document.createElement(_config.contentAugmentationTagName);
	document.body?.appendChild(contentAugmentatioSingleton);

	(window as (
        Window & typeof globalThis & { [key: string]: unknown; }
    ))[_config.contentAugmentationDomProperty] = contentAugmentatioSingleton.dom;
});


class ContentAugmentation extends HTMLElement {
	#DOM;

	constructor() {
		super();

	    if(!window.CONTENT_HTML) return;

		const style = document.createElement("STYLE");
		style.innerHTML = [
			DEFAULT_CSS,
            window.CONTENT_CSS as string
		].join("\n");

		this.#DOM = this.attachShadow({ mode: "closed" });
		this.#DOM.innerHTML = window.CONTENT_HTML as string;
		this.#DOM.appendChild(style);
	}

	get dom() {
		return this.#DOM;
	}
}

customElements.define(_config.contentAugmentationTagName, ContentAugmentation);