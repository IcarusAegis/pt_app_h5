export function trimText(value) {
  return String(value || '').trim();
}

export function encodeBase64Url(text) {
  const bytes = new TextEncoder().encode(String(text));
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window
    .btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function decodeBase64Url(value) {
  const text = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = text.padEnd(Math.ceil(text.length / 4) * 4, '=');
  const binary = window.atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder().decode(bytes);
}

export function getQueryPayload() {
  const query = new URLSearchParams(window.location.search);
  const payload = query.get('cabinetPayload') || query.get('kc_payload') || query.get('payload');
  if (!payload) {
    return null;
  }
  try {
    return JSON.parse(decodeBase64Url(payload));
  } catch (error) {
    return null;
  }
}

export function formatClock(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--:--:--';
  }
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

export function safeJson(value) {
  try {
    return JSON.stringify(value);
  } catch (error) {
    return '';
  }
}
