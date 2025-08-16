
/// <reference lib="WebWorker" />

// This file is required to prevent a build error from the firebase-messaging-sw.js file.
// It tells TypeScript that we are intentionally using a Service Worker scope.
// See: https://github.com/microsoft/TypeScript/issues/11781
declare const self: ServiceWorkerGlobalScope;
export {};
