import type { DuplexPort } from "./capture-protocol.ts";

/**
 * Wraps a chrome.runtime.Port as a typed DuplexPort. The caller vouches for the message types:
 * only this extension's own popup and worker ever talk over these ports.
 *
 * @example const port = adaptChromePort<CaptureRequest, CaptureEvent>(chrome.runtime.connect({ name }))
 */
export function adaptChromePort<Sent, Received>(port: chrome.runtime.Port): DuplexPort<Sent, Received> {
  return {
    send: (message) => port.postMessage(message),
    onReceive: (listener) => port.onMessage.addListener((message: Received) => listener(message)),
    onClose: (listener) => port.onDisconnect.addListener(() => listener()),
  };
}
