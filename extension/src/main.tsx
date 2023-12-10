import React from "react";
import ReactDOM from "react-dom/client";
import Content from "./Content";
import { createDomElement } from "./createElement";

let root = document.getElementById("crx-root") as HTMLElement;
if (!root) {
  root = createDomElement(`<div id="crx-root"></div>`);
  document.body.append(root);
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <Content />
  </React.StrictMode>
);
