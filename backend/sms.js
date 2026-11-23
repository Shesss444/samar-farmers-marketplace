// TextBee SMS helper — https://textbee.dev/docs/api-reference
// TextBee sends SMS through your own Android phone running the TextBee app.
// Requires TEXTBEE_API_KEY in backend/.env (TEXTBEE_DEVICE_ID is optional).

const TEXTBEE_URL = 'https://api.textbee.dev/api/v1/gateway/send-sms';

// Convert Philippine numbers like 09171234567 / 9171234567 / 639171234567 to E.164 (+639171234567).
export function normalizePhoneNumber(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+') && digits.length >= 10) return `+${digits}`;
  if (digits.startsWith('63') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('09') && digits.length === 11) return `+63${digits.slice(1)}`;
  if (digits.startsWith('9') && digits.length === 10) return `+63${digits}`;
  return null;
}

export function isSmsConfigured() {
  return Boolean(process.env.TEXTBEE_API_KEY);
}

// Returns { sent: true, messageId } or { sent: false, error }. Never throws.
// "sent" means TextBee accepted the message; the phone still has to be online to deliver it.
export async function sendSms(to, body) {
  if (!isSmsConfigured()) return { sent: false, error: 'SMS is not configured on the server' };
  const phone = normalizePhoneNumber(to);
  if (!phone) return { sent: false, error: 'Buyer has no valid contact number' };

  const payload = { recipients: [phone], message: body };
  if (process.env.TEXTBEE_DEVICE_ID) payload.deviceId = process.env.TEXTBEE_DEVICE_ID;

  try {
    const resp = await fetch(TEXTBEE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.TEXTBEE_API_KEY },
      body: JSON.stringify(payload)
    });
    const data = await resp.json().catch(() => ({}));
    const result = data?.data;
    if (!resp.ok || !result || result.success === false || result.failureCount > 0) {
      const detail = Array.isArray(data?.message) ? data.message.join(', ') : (data?.message || data?.error || result?.message);
      const error = resp.status === 401 ? 'Invalid TextBee API key'
        : resp.status === 429 ? 'TextBee daily/monthly SMS limit reached'
        : detail || `TextBee HTTP ${resp.status}`;
      console.error('TextBee SMS failed:', resp.status, data);
      return { sent: false, error };
    }
    if (result.warning) console.warn('TextBee warning:', result.warning);
    return { sent: true, messageId: result.smsBatchId };
  } catch (e) {
    console.error('TextBee SMS error:', e);
    return { sent: false, error: 'Could not reach SMS provider' };
  }
}
