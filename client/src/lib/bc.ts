// Simple BroadcastChannel helper for cross-tab real-time updates
const CHANNEL_NAME = 'samar-farmers-channel';

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  // store on window to reuse the same channel across imports
  const w = window as any;
  if (!w.__SAMAR_BC) {
    if ('BroadcastChannel' in window) w.__SAMAR_BC = new BroadcastChannel(CHANNEL_NAME);
    else w.__SAMAR_BC = null;
  }
  return w.__SAMAR_BC as BroadcastChannel | null;
}

export function broadcast(type: string, payload?: any) {
  const ch = getChannel();
  try {
    ch?.postMessage({ type, payload });
  } catch (e) {
    // ignore
  }
}

export function addListener(fn: (msg: { type: string; payload?: any }) => void) {
  const ch = getChannel();
  if (!ch) return () => {};
  const handler = (ev: MessageEvent) => {
    try {
      fn(ev.data);
    } catch (e) {
      console.error('BC handler error', e);
    }
  };
  ch.addEventListener('message', handler as EventListener);
  return () => ch.removeEventListener('message', handler as EventListener);
}

export function closeChannel() {
  const ch = getChannel();
  try { ch?.close(); } catch (e) {}
}

export default { broadcast, addListener, closeChannel };
