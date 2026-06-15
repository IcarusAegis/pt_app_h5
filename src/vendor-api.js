import { makeSha256Sign } from './sign';

function buildVendorUrl(config, path) {
  const url = new URL(path, `${config.vendorBaseUrl}/`);
  if (config.vendorUqKey) {
    url.searchParams.set('uqKey', config.vendorUqKey);
  }
  return url.toString();
}

async function requestJson(url, options = {}) {
  const { timeoutMs, ...fetchOptions } = options;
  const controller = typeof AbortController === 'function' && timeoutMs > 0 ? new AbortController() : null;
  const timer = controller
    ? window.setTimeout(() => controller.abort(), timeoutMs)
    : null;

  let response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      signal: controller ? controller.signal : fetchOptions.signal,
    });
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw new Error('请求超时');
    }
    throw error;
  } finally {
    if (timer) {
      window.clearTimeout(timer);
    }
  }

  const text = await response.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (error) {
    body = text;
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  if (body && typeof body === 'object' && body.code !== undefined && Number(body.code) !== 0) {
    throw new Error(body.msg || '接口返回失败');
  }
  return body && typeof body === 'object' && body.data !== undefined ? body.data : body;
}

export async function readBoardLocksStatus(config) {
  if (!config.boardId || !config.vendorBaseUrl) {
    return [];
  }

  return requestJson(buildVendorUrl(config, '/third_api/lock/getBordLocksStatus'), {
    method: 'POST',
    timeoutMs: config.vendorTimeoutMs,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      board_id: Number(config.boardId) || config.boardId,
    }),
  });
}

export async function buildSignedOpenLockForm(config, payload) {
  const body = {
    board_id: payload.boardId || config.boardId,
    offline_code: payload.offlineCode || '1',
  };
  if (payload.lockId) {
    body.lock_id = payload.lockId;
  }

  if (payload.bizData) {
    body.biz_data = typeof payload.bizData === 'string' ? payload.bizData : JSON.stringify(payload.bizData);
  }
  if (payload.callback) {
    body.callback = payload.callback;
  }

  body.sign = await makeSha256Sign(body, config.vendorSecret);
  return body;
}
