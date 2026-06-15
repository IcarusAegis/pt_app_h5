import { encodeBase64Url, safeJson, trimText } from './codec';
import { makeSha256Sign } from './sign';

function randomToken() {
  const bytes = new Uint8Array(12);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function buildQrLink(config, payload, payloadToken) {
  const url = new URL(config.qrPublicBaseUrl || window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('cabinetPayload', payloadToken);
  url.searchParams.set('mode', payload.action);
  if (payload.boardId) {
    url.searchParams.set('boardId', payload.boardId);
  }
  if (payload.cabinetId) {
    url.searchParams.set('cabinetId', payload.cabinetId);
  }
  return url.toString();
}

export async function buildLocalQrContent(config, action, issuedAt) {
  const ttlMs = Math.max(1, config.qrTtlSeconds) * 1000;
  const issuedAtMs = Number.isFinite(Number(issuedAt)) ? Number(issuedAt) : Date.now();
  const payload = {
    scheme: action === 'return' ? 'returnCabinet' : 'scanCabinet',
    action,
    boardId: trimText(config.boardId),
    cabinetId: trimText(config.cabinetId || config.boardId),
    issuedAt: String(issuedAtMs),
    expiresAt: String(issuedAtMs + ttlMs),
    nonce: randomToken(),
  };

  if (config.vendorSecret) {
    payload.sign = await makeSha256Sign(payload, config.vendorSecret);
  }

  const payloadToken = encodeBase64Url(safeJson(payload));
  return {
    content: buildQrLink(config, payload, payloadToken),
    payload,
    payloadToken,
    expiresAt: payload.expiresAt,
    source: 'local',
  };
}

export function normalizeRemoteQrMessage(raw) {
  const data = raw && typeof raw === 'object' && raw.data && typeof raw.data === 'object' ? raw.data : raw;
  const content = trimText(
    data && (data.qrContent || data.content || data.url || data.code || data.scanData || data.qrText),
  );
  if (!content) {
    return null;
  }
  return {
    content,
    payload: data.payload || data,
    payloadToken: data.payloadToken || data.cabinetPayload || '',
    expiresAt: data.expiresAt || data.expireAt || '',
    source: data.source || 'remote',
  };
}

export async function fetchPolledQr(config, action) {
  if (!config.qrPollUrl) {
    return null;
  }

  const url = new URL(config.qrPollUrl, window.location.href);
  url.searchParams.set('action', action);
  if (config.boardId) {
    url.searchParams.set('boardId', config.boardId);
  }
  if (config.cabinetId) {
    url.searchParams.set('cabinetId', config.cabinetId);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });
  const body = await response.json();
  return normalizeRemoteQrMessage(body);
}
