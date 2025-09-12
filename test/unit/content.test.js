const CONTENT_JS = _readDist("content.js");

assertIn(`
    <strong>augmentation</strong>
  </body>
</html>
\`;
window.CONTENT_CSS = \`strong {
  color: red;
}\`;
(()=>{var c=e=>{throw TypeError(e)};var s=(e,t,n)=>t.has(e)||c("Cannot "+n);var i=(e,t,n)=>(s(e,t,"read from private field"),n?n.call(e):t.get(e)),r=(e,t,n)=>t.has(e)?c("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,n),a=(e,t,n,o)=>(s(e,t,"write to private field"),o?o.call(e,n):t.set(e,n),n);document.addEventListener("DOMContentLoaded",()=>{var t;if(!window.CONTENT_HTML)return;let e=document.createElement("div");e.innerHTML=window.CONTENT_HTML,(t=document.body)==null||t.appendChild(e)});var d,T;window.customElements.define("/* @TAG_NAME */",(T=class extends HTMLElement{constructor(){super();r(this,d);a(this,d,this.attachShadow({mode:"closed"})),i(this,d).appendChild(document.querySelector("#t-/* @TEMPLATE_ID */").content.cloneNode(!0))}},d=new WeakMap,T));})();

(()=>{})();

(() => {
  // <stdin>
  browser.webfuseSession.log("Example...");
  browser.runtime.onMessage.addListener((message, sender) => {
    console.log(\`Received message from \${sender.url} in content:\`, {
      message,
      sender
    });
  });
  setTimeout(() => {
    browser.runtime.sendMessage({
      from: "content"
    });
  }, 3e3);
})();
`, CONTENT_JS, "Invalid content.js");