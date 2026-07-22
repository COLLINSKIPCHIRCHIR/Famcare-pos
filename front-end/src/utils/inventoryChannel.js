// src/utils/inventoryChannel.js
//
// Lightweight cross-tab notifier so that when inventory is edited/deleted
// on one tab (e.g. InventoryList.jsx), any other open tab showing live
// stock (e.g. NewSale.jsx) can refresh immediately instead of waiting
// for its next poll cycle.
//
// BroadcastChannel only works across tabs/windows of the SAME browser.
// It's a nice instant bonus, but it is not a replacement for polling —
// polling is what covers a different device/browser (e.g. admin on a
// separate PC) editing the same inventory.

const CHANNEL_NAME = "inventory-updates";

// Guard for browsers/environments without BroadcastChannel support.
const supported = typeof window !== "undefined" && "BroadcastChannel" in window;

export function notifyInventoryUpdated() {
  if (!supported) return;
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "inventory-updated", at: Date.now() });
    channel.close();
  } catch (err) {
    console.error("Failed to broadcast inventory update:", err);
  }
}

// Returns an unsubscribe function. Pass a callback to run whenever
// another tab reports an inventory change.
export function subscribeToInventoryUpdates(callback) {
  if (!supported) return () => {};
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (event) => {
    if (event.data?.type === "inventory-updated") {
      callback();
    }
  };
  return () => channel.close();
}