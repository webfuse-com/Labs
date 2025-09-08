document.addEventListener("DOMContentLoaded", () => {
	// Only inject if content augmentation is defined
	if(!window.CONTENT_HTML) return;

	const fragment = document.createElement("div");

	fragment.innerHTML = (window.CONTENT_HTML as string);

	document.body?.appendChild(fragment);
});