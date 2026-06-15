function sortEntries(params) {
  return Object.keys(params || {})
    .filter((key) => key !== 'sign' && params[key] !== undefined && params[key] !== null && params[key] !== '')
    .sort()
    .map((key) => [key, params[key]]);
}

function buildSignSource(params) {
  const search = new URLSearchParams();
  sortEntries(params).forEach(([key, value]) => {
    search.set(key, String(value));
  });
  return search.toString();
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function makeSha256Sign(params, secret) {
  const source = `${buildSignSource(params)}${secret || ''}`;
  const data = new TextEncoder().encode(source);
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  return toHex(hash);
}
