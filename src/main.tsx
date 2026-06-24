// esbuild helper polyfill — niektoré pre-bundlované balíky (maplibre-gl, lightgallery, ...)
// volajú __publicField bez injectnutia helper definície a spôsobujú "ReferenceError: __publicField is not defined".
// https://github.com/evanw/esbuild/blob/main/internal/runtime/runtime.go#L284
(globalThis as any).__publicField = (globalThis as any).__publicField || function __publicField(obj: any, key: any, value: any) {
  if (typeof key !== 'symbol' && key in obj) {
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      writable: true,
      value,
    });
  } else {
    obj[key] = value;
  }
  return value;
};

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
