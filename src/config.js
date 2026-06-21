const DEFAULT_VENDOR_BASE_URL = 'http://td.youyuancheng.com';
const DEFAULT_UQ_KEY = '';
const DEFAULT_VENDOR_TIMEOUT_SECONDS = 30;
const DEFAULT_QR_WS_URL = 'ws://localhost:8080/ws/cabinet-h5';
export const FIXED_CABINET_ID = '2441';
const CABINET_ID_STORAGE_KEY = 'kc:cabinet-h5:identity';
const ADMIN_CONFIG_KEY = 'v14_cabinet_config';
const CABINET_CONFIG_GLOBALS = [
  '__KC_CABINET_CONFIG__',
  '__KECHUANG_CABINET_CONFIG__',
  '__CABINET_CONFIG__',
];

// 读取管理员保存的配置
function readAdminConfig() {
  try {
    const raw = window.localStorage.getItem(ADMIN_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch {}
  return null;
}

function getQuery() {
  return new URLSearchParams(window.location.search);
}

function readText(query, key, fallback = '') {
  const queryValue = query.get(key);
  if (queryValue !== null && queryValue !== '') {
    return queryValue.trim();
  }
  return String(fallback || '').trim();
}

function firstText(...values) {
  const match = values
    .map((value) => (value === undefined || value === null ? '' : String(value).trim()))
    .find(Boolean);
  return match || '';
}

function readQueryText(query, keys) {
  for (const key of keys) {
    const value = readText(query, key);
    if (value) {
      return value;
    }
  }
  return '';
}

function parseObject(value) {
  if (!value) {
    return {};
  }
  if (typeof value === 'object') {
    return value;
  }
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

function readObjectText(source, keys) {
  if (!source || typeof source !== 'object') {
    return '';
  }
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return '';
}

function readNumber(query, key, fallback) {
  const value = Number(readText(query, key, fallback));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function readBoolean(query, key, fallback = false) {
  const text = readText(query, key).toLowerCase();
  if (!text) {
    return fallback;
  }
  return text === '1' || text === 'true' || text === 'yes';
}

function normalizeQrSource(value, allowLocalQr) {
  const text = String(value || '').trim().toLowerCase();
  if (text === 'poll') {
    return 'poll';
  }
  if (text === 'local' && allowLocalQr) {
    return 'local';
  }
  return 'websocket';
}

function normalizeBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

function getCurrentPageBaseUrl() {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  return url.toString();
}

function createSessionId() {
  const random = Math.random().toString(16).slice(2);
  return `h5-${Date.now()}-${random}`;
}

function buildDefaultWsUrl(sessionId) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/cabinet-h5/${encodeURIComponent(sessionId)}`;
}

function buildWsUrl(rawUrl, sessionId) {
  const session = encodeURIComponent(sessionId);
  const value = String(rawUrl || '').trim();
  if (!value) {
    return buildDefaultWsUrl(sessionId);
  }
  if (value.includes('{sessionId}')) {
    return value.replaceAll('{sessionId}', session);
  }
  try {
    const url = new URL(value, window.location.href);
    const marker = '/ws/cabinet-h5';
    if (url.pathname === marker || url.pathname === `${marker}/` || url.pathname.startsWith(`${marker}/`)) {
      url.pathname = `${marker}/${session}`;
      if (url.protocol === 'http:') {
        url.protocol = 'ws:';
      }
      if (url.protocol === 'https:') {
        url.protocol = 'wss:';
      }
      return url.toString();
    }
  } catch (error) {
    return value;
  }
  return value;
}

function normalizeCabinetIdentity() {
  return {
    boardId: FIXED_CABINET_ID,
    cabinetId: FIXED_CABINET_ID,
  };
}

function readQueryCabinetIdentity(query) {
  return normalizeCabinetIdentity({
    boardId: readQueryText(query, ['boardId', 'board_id', 'boardCode', 'board_code', 'board', 'deviceId', 'device_id', 'device']),
    cabinetId: readQueryText(query, ['cabinetId', 'cabinet_id', 'cabinetCode', 'cabinet_code', 'cabinet']),
  });
}

function readGlobalCabinetIdentity() {
  for (const key of CABINET_CONFIG_GLOBALS) {
    const identity = normalizeCabinetIdentity(window[key]);
    if (identity.boardId || identity.cabinetId) {
      return identity;
    }
  }
  return { boardId: '', cabinetId: '' };
}

function readStoredCabinetIdentity() {
  try {
    return normalizeCabinetIdentity(window.localStorage.getItem(CABINET_ID_STORAGE_KEY));
  } catch (error) {
    return { boardId: '', cabinetId: '' };
  }
}

function saveCabinetIdentity(identity) {
  const normalized = normalizeCabinetIdentity(identity);
  if (!normalized.boardId && !normalized.cabinetId) {
    return;
  }
  try {
    window.localStorage.setItem(CABINET_ID_STORAGE_KEY, JSON.stringify(normalized));
  } catch (error) {
    // Local persistence is only a convenience for cabinet app reloads.
  }
}

function resolveCabinetIdentity(query) {
  const queryIdentity = readQueryCabinetIdentity(query);
  if (queryIdentity.boardId || queryIdentity.cabinetId) {
    saveCabinetIdentity(queryIdentity);
    return queryIdentity;
  }
  const globalIdentity = readGlobalCabinetIdentity();
  if (globalIdentity.boardId || globalIdentity.cabinetId) {
    saveCabinetIdentity(globalIdentity);
    return globalIdentity;
  }
  return readStoredCabinetIdentity();
}

export function applyCabinetIdentity(config, value) {
  const identity = normalizeCabinetIdentity(value);
  if (!identity.boardId && !identity.cabinetId) {
    return false;
  }
  const changed = config.boardId !== identity.boardId || config.cabinetId !== identity.cabinetId;
  config.boardId = identity.boardId;
  config.cabinetId = identity.cabinetId;
  saveCabinetIdentity(identity);
  return changed;
}

export function getRuntimeConfig() {
  const query = getQuery();
  const env = import.meta.env;
  const adminConfig = readAdminConfig();

  const h5SessionId = readText(query, 'sid') || createSessionId();
  const allowLocalQr = readBoolean(query, 'allowLocalQr', String(env.VITE_ALLOW_LOCAL_QR || '').toLowerCase() === 'true');

  // 优先使用管理员保存的配置
  function getValue(queryKey, envKey, fallback) {
    // URL查询参数优先级最高
    const queryValue = query.get(queryKey);
    if (queryValue !== null && queryValue !== '') {
      return queryValue.trim();
    }
    // 然后是管理员配置
    if (adminConfig && adminConfig[queryKey] !== undefined && String(adminConfig[queryKey]).trim()) {
      return String(adminConfig[queryKey]).trim();
    }
    // 最后是环境变量
    const envValue = envKey ? env[envKey] : '';
    if (envValue !== undefined && String(envValue).trim()) {
      return String(envValue).trim();
    }
    return String(fallback || '').trim();
  }

  const qrSource = normalizeQrSource(getValue('source', 'VITE_QR_SOURCE', 'websocket'), allowLocalQr);
  const explicitQrPublicBaseUrl = getValue('qrBaseUrl', 'VITE_QR_PUBLIC_BASE_URL', '');
  const cabinetIdentity = resolveCabinetIdentity(query);

  // 管理员配置的boardId优先
  let finalBoardId = cabinetIdentity.boardId;
  let finalCabinetId = cabinetIdentity.cabinetId;
  if (adminConfig && adminConfig.boardId) {
    finalBoardId = String(adminConfig.boardId).trim();
    finalCabinetId = finalBoardId;
  }

  const qrTtlSeconds = Number(getValue('ttl', 'VITE_QR_TTL_SECONDS', '60')) || 60;
  const statusPollSeconds = Number(getValue('statusPoll', 'VITE_STATUS_POLL_SECONDS', '10')) || 10;
  const vendorTimeoutSeconds = Number(getValue('timeout', 'VITE_VENDOR_TIMEOUT_SECONDS', String(DEFAULT_VENDOR_TIMEOUT_SECONDS))) || DEFAULT_VENDOR_TIMEOUT_SECONDS;

  return {
    h5SessionId,
    vendorBaseUrl: normalizeBaseUrl(getValue('baseUrl', 'VITE_VENDOR_BASE_URL', DEFAULT_VENDOR_BASE_URL)),
    vendorUqKey: getValue('uqKey', 'VITE_VENDOR_UQ_KEY', DEFAULT_UQ_KEY),
    vendorSecret: getValue('secret', 'VITE_VENDOR_SECRET', ''),
    vendorTimeoutMs: vendorTimeoutSeconds * 1000,
    boardId: finalBoardId,
    cabinetId: finalCabinetId,
    qrTtlSeconds,
    qrSource,
    qrPollUrl: getValue('pollUrl', 'VITE_QR_POLL_URL', ''),
    qrWsUrl: buildWsUrl(getValue('wsUrl', 'VITE_QR_WS_URL', DEFAULT_QR_WS_URL), h5SessionId),
    devQrFallbackUrl: getValue('devQrFallbackUrl', 'VITE_DEV_QR_FALLBACK_URL', '/dev/cabinet-qr'),
    qrPublicBaseUrl: explicitQrPublicBaseUrl || (qrSource === 'websocket' ? '' : getCurrentPageBaseUrl()),
    statusPollSeconds,
    miniProgramAppId: getValue('appId', 'VITE_MINIPROGRAM_APP_ID', ''),
    miniProgramPath: getValue('mpPath', 'VITE_MINIPROGRAM_PATH', '/pages/scan/index/index'),
    wechatJsConfigUrl: getValue('wxConfigUrl', 'VITE_WECHAT_JS_CONFIG_URL', ''),
  };
}

export function getInitialMode() {
  const query = getQuery();
  const value = readText(query, 'mode', readText(query, 'action', 'borrow')).toLowerCase();
  return value === 'return' ? 'return' : 'borrow';
}
