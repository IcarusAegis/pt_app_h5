<template>
  <main class="v9-screen">
    <header class="v9-header">
      <div class="v9-brand">
        <div class="v9-logo">
          <span>⟐</span>
        </div>
        <div class="v9-connection" :class="'v9-connection--' + connectionTone">
          <span class="v9-connection-dot"></span>
          <span>{{ connectionText }}</span>
        </div>
      </div>
      <div class="v9-header-title">
        <p>kechuang / cabinet-qr</p>
        <h1>柜屏二维码</h1>
      </div>
      <div class="v9-header-meta">
        <div>
          <span>boardId</span>
          <strong>{{ config.boardId || '--' }}</strong>
        </div>
        <button class="v9-icon-btn" @click="refreshAll">
          <RefreshCw :size="36" />
        </button>
      </div>
    </header>

    <section class="v9-workspace">
      <div v-if="viewState === 'home'" class="v9-home">
        <div class="v9-home-heading">
          <p class="v9-path">~/cabinet-qr/src/main.js</p>
          <h1>请选择所需服务</h1>
        </div>
        <div class="v9-home-actions">
          <button class="v9-btn-massive" @click="goToQr('borrow')">
            <PackageCheck :size="80" />
            <span>
              <small>01</small>
              取件
            </span>
          </button>
          <button class="v9-btn-massive v9-btn-massive--alt" @click="goToQr('return')">
            <ArchiveRestore :size="80" />
            <span>
              <small>02</small>
              存件
            </span>
          </button>
        </div>
        <div class="v9-home-status" :class="'v9-home-status--' + connectionTone">
          <span class="v9-status-dot"></span>
          <strong>cabinet:{{ config.boardId || '--' }}</strong>
          <em>{{ connectionText }}</em>
        </div>
      </div>

      <section v-else-if="viewState === 'qr'" class="v9-scan-panel">
        <div class="v9-qr-nav">
          <button class="v9-btn-back" @click="goHome">
            ← 返回首页
          </button>
        </div>

        <div class="v9-scan-copy">
          <p class="v9-eyebrow">{{ activeCopy.badge }}</p>
          <h2>{{ activeCopy.title }}</h2>
          <p class="v9-scan-subtitle">柜体 {{ config.cabinetId || config.boardId || '--' }} · {{ sourceText }}</p>
        </div>

        <div class="v9-scan-stage">
          <section class="v9-qr-panel">
            <div class="v9-qr-shell">
              <canvas ref="qrCanvas" width="500" height="500"></canvas>
              <div v-if="qrBusy || cabinetIdentityMissing" class="v9-qr-overlay">{{ qrOverlayText }}</div>
            </div>
            <div class="v9-qr-meta">
              <div class="v9-timer-ring" :style="{ '--progress': countdownProgress }">
                <span>{{ secondsLeft }}</span>
              </div>
              <div>
                <span>本轮剩余</span>
                <strong>{{ generatedAtText }} 更新</strong>
              </div>
            </div>
          </section>

          <aside class="v9-action-panel">
            <div class="v9-metric-row">
              <div>
                <span>boardId</span>
                <strong>{{ config.boardId || '--' }}</strong>
              </div>
              <div>
                <span>ttl</span>
                <strong>{{ config.qrTtlSeconds }}s</strong>
              </div>
              <div>
                <span>ws</span>
                <strong :class="wsConnected ? 'v9-text-ok' : 'v9-text-err'">{{ wsConnected ? 'connected' : 'offline' }}</strong>
              </div>
            </div>
            <div class="v9-launch-card">
              <div ref="launchHost" class="launch-host"></div>
              <button v-if="!wechatOpenReady" class="v9-launch-fallback" @click="copyQrContent">
                <Copy :size="36" />
                copy(qrContent)
              </button>
            </div>
            <div class="v9-action-note" :class="'v9-action-note--' + connectionTone">
              <span class="v9-note-icon">$</span>
              <div>
                <p>{{ animationMessage }}</p>
                <small v-if="diagnosticText">{{ diagnosticText }}</small>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </section>

    <div
      class="v9-modal-overlay"
      :class="{ active: animationModalVisible, 'v9-modal-overlay--failed': animationState === 'failed' }"
      @click.self="closeAnimationModal"
    >
      <div class="v9-modal-content">
        <div class="v9-locker-animation">
          <div class="v9-locker-inside"></div>
          <div class="v9-locker-door">
            <span class="v9-locker-number">{{ displayLockId }}</span>
          </div>
        </div>
        <h2 class="v9-modal-title">{{ animationModalTitle }}</h2>
        <p class="v9-modal-desc">
          <template v-if="animationState === 'failed'">
            {{ animationMessage || '请重试或联系管理员' }}
          </template>
          <template v-else>
            请前往 <strong class="v9-highlight-text">{{ displayLockId }}</strong> 号柜存放/提取物品
          </template>
        </p>
        <button class="v9-modal-close" @click="closeAnimationModal">
          关闭 <span v-if="closeCountdown > 0">({{ closeCountdown }}s)</span>
        </button>
      </div>
    </div>
  </main>
</template>


<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import QRCode from 'qrcode';
import {
  ArchiveRestore,
  Copy,
  PackageCheck,
  RefreshCw,
} from 'lucide-vue-next';
import { formatClock, getQueryPayload } from './codec';
import { FIXED_CABINET_ID, applyCabinetIdentity, getInitialMode, getRuntimeConfig } from './config';
import {
  buildLocalQrContent,
  fetchPolledQr,
  normalizeRemoteQrMessage,
} from './qr-feed';
import { readBoardLocksStatus } from './vendor-api';
import { renderLaunchOpenTag, setupWechatOpenTag } from './wechat-open';

const MODE_COPY = {
  borrow: {
    title: '扫码开柜取件',
    badge: '取件动态码',
    actionText: '取件',
  },
  return: {
    title: '扫码开柜归还',
    badge: '归还动态码',
    actionText: '归还',
  },
};

const config = reactive(getRuntimeConfig());
const viewState = ref('home');
function goHome() {
  viewState.value = 'home';
}
function goToQr(newMode) {
  setMode(newMode);
  viewState.value = 'qr';
}

const mode = ref(getInitialMode());
const qrCanvas = ref(null);
const launchHost = ref(null);
const qrBusy = ref(false);
const qrContent = ref('');
const qrPayload = ref(getQueryPayload());

watch(viewState, async (newState) => {
  if (newState === 'qr') {
    await nextTick();
    if (qrContent.value) {
      drawQr(qrContent.value).catch(e => console.error(e));
    } else {
      refreshQr();
    }
  }
});

const qrPayloadToken = ref('');
const generatedAt = ref(0);
const qrExpiresAt = ref(0);
const secondsLeft = ref(config.qrTtlSeconds);
const doorItems = ref([]);
const statusUpdatedAt = ref(0);
const statusError = ref('');
const remoteError = ref('');
const wsConnected = ref(false);
const wechatOpenReady = ref(false);
const animationState = ref('idle');
const animationMessage = ref('等待学生扫码');
const activeLockId = ref('');
const animationModalVisible = ref(false);
const closeCountdown = ref(0);

let tickTimer = 0;
let statusTimer = 0;
let reconnectTimer = 0;
let modalCountdownTimer = 0;
let postOpenQrRefreshTimer = 0;
let wsClient = null;
let wsStopped = false;

const activeCopy = computed(() => MODE_COPY[mode.value]);
const payloadActionText = computed(() => activeCopy.value.actionText);
const sourceText = computed(() => {
  if (config.qrSource === 'websocket') return '后端 WebSocket';
  if (config.qrSource === 'poll') return '固定 URL';
  return '本地签名';
});
const generatedAtText = computed(() => (generatedAt.value ? formatClock(generatedAt.value) : '--:--:--'));
const statusUpdatedText = computed(() => (statusUpdatedAt.value ? formatClock(statusUpdatedAt.value) : '--:--:--'));
const countdownProgress = computed(() => {
  const value = secondsLeft.value / Math.max(1, config.qrTtlSeconds);
  return `${Math.max(0, Math.min(1, value)) * 100}%`;
});
const connectionTone = computed(() => {
  if (cabinetIdentityMissing.value) return 'warn';
  if (remoteError.value || statusError.value) return 'warn';
  if (config.qrSource === 'websocket') return wsConnected.value ? 'ok' : 'idle';
  return 'ok';
});
const connectionText = computed(() => {
  if (cabinetIdentityMissing.value) return '等待柜机编号';
  if (remoteError.value) return '二维码源异常';
  if (statusError.value) return '状态接口异常';
  if (config.qrSource === 'websocket') return wsConnected.value ? '长连接在线' : '等待连接';
  return '在线';
});
const diagnosticText = computed(() => {
  if (remoteError.value) return `${remoteError.value}：${config.qrWsUrl || config.qrPollUrl || config.qrSource}`;
  if (statusError.value) return statusError.value;
  if (config.qrSource === 'websocket' && !qrContent.value) return `等待二维码：${config.qrWsUrl}`;
  return '';
});
const animationStatusText = computed(() => {
  if (animationState.value === 'opening') return '指令下发中';
  if (animationState.value === 'opened') return '柜门已开';
  if (animationState.value === 'failed') return '开柜失败';
  return '待命';
});
const displayLockId = computed(() => activeLockId.value || '--');
const animationModalTitle = computed(() => (animationState.value === 'failed' ? '开柜失败' : '开柜成功'));
const doorStats = computed(() => {
  const total = doorItems.value.length;
  return doorItems.value.reduce(
    (stats, item) => {
      const open = String(item.door_status || '') === '1';
      const offline = String(item.lighting_lamp || '') === '0' && String(item.indicator_light || '') === '0';
      return {
        total: stats.total,
        opened: stats.opened + (open ? 1 : 0),
        online: stats.online + (offline ? 0 : 1),
      };
    },
    { total, opened: 0, online: 0 },
  );
});
const visualSlots = computed(() => {
  const source = doorItems.value.length
    ? doorItems.value.map((item) => {
        const id = String(item.lock_id || item.id || item.boxId || '');
        return {
          id,
          label: id || '--',
          open: String(item.door_status || '') === '1',
          offline: String(item.lighting_lamp || '') === '0' && String(item.indicator_light || '') === '0',
        };
      })
    : Array.from({ length: 12 }, (_, index) => ({
        id: String(index + 1),
        label: String(index + 1).padStart(2, '0'),
        open: false,
        offline: false,
      }));
  return source.map((slot) => ({
    ...slot,
    active: activeLockId.value && String(slot.id) === String(activeLockId.value),
  }));
});
const cabinetIdentityMissing = computed(() => !firstText(config.boardId, config.cabinetId));
const qrOverlayText = computed(() => (cabinetIdentityMissing.value ? '等待柜机编号' : '刷新中'));

function getDefaultExpiresAt(baseTime = Date.now()) {
  return baseTime + Math.max(1, config.qrTtlSeconds) * 1000;
}

function parseExpiresAt(value, fallbackTime = Date.now()) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    const timestamp = numeric > 1000000000000 ? numeric : numeric * 1000;
    if (timestamp > Date.now()) {
      return timestamp;
    }
  }
  const parsed = Date.parse(value);
  if (Number.isFinite(parsed) && parsed > Date.now()) {
    return parsed;
  }
  return getDefaultExpiresAt(fallbackTime);
}

function buildMiniProgramPath() {
  const path = config.miniProgramPath || '/pages/scan/index/index';
  const query = new URLSearchParams();
  query.set('cabinetAction', mode.value);
  if (qrPayloadToken.value) {
    query.set('cabinetPayload', qrPayloadToken.value);
  } else if (qrContent.value) {
    query.set('scanData', qrContent.value);
  }
  if (config.boardId) {
    query.set('boardId', config.boardId);
  }
  return `${path}${path.includes('?') ? '&' : '?'}${query.toString()}`;
}

function getQrRenderSize() {
  const viewport = typeof window !== 'undefined' ? window.innerWidth : 360;
  const shellWidth = qrCanvas.value && qrCanvas.value.parentElement
    ? qrCanvas.value.parentElement.clientWidth - 36
    : 360;
  const viewportWidth = viewport - 96;
  const maxSize = 500;
  const safeWidth = Math.min(shellWidth, viewportWidth, maxSize);
  return Math.max(320, Math.floor(safeWidth || 420));
}

async function drawQr(content) {
  if (!qrCanvas.value || !content) {
    return;
  }
  const size = getQrRenderSize();
  await QRCode.toCanvas(qrCanvas.value, content, {
    width: size,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#111827',
      light: '#ffffff',
    },
  });
}

async function resolveQrContent() {
  if (config.qrSource === 'websocket') {
    return null;
  }
  if (config.qrSource === 'poll') {
    const remote = await fetchPolledQr(config, mode.value);
    if (remote) {
      return remote;
    }
  }

  return buildLocalQrContent(config, mode.value, Date.now());
}

async function refreshQr() {
  if (cabinetIdentityMissing.value) {
    qrBusy.value = false;
    qrContent.value = '';
    qrPayload.value = null;
    qrPayloadToken.value = '';
    secondsLeft.value = config.qrTtlSeconds;
    return;
  }
  if (config.qrSource === 'websocket') {
    requestWebSocketQr();
    return;
  }
  qrBusy.value = true;
  remoteError.value = '';
  try {
    const next = await resolveQrContent();
    const nextGeneratedAt = Date.now();
    qrContent.value = next.content;
    qrPayload.value = next.payload;
    qrPayloadToken.value = next.payloadToken || '';
    generatedAt.value = nextGeneratedAt;
    qrExpiresAt.value = parseExpiresAt(next.expiresAt || (next.payload && next.payload.expiresAt), nextGeneratedAt);
    secondsLeft.value = Math.max(0, Math.ceil((qrExpiresAt.value - Date.now()) / 1000));
    await nextTick();
    await drawQr(next.content);
    renderWechatLaunch();
  } catch (error) {
    remoteError.value = error.message || '二维码刷新失败';
  } finally {
    qrBusy.value = false;
  }
}

async function refreshStatus() {
  if (config.qrSource === 'websocket') {
    statusError.value = '';
    return;
  }
  statusError.value = '';
  try {
    const list = await readBoardLocksStatus(config);
    doorItems.value = Array.isArray(list) ? list : [];
    statusUpdatedAt.value = Date.now();
  } catch (error) {
    statusError.value = error.message || '状态读取失败';
  }
}

async function refreshAll() {
  await Promise.all([refreshQr(), refreshStatus()]);
}

function startTicking() {
  window.clearInterval(tickTimer);
  tickTimer = window.setInterval(() => {
    const expiresAt = qrExpiresAt.value || getDefaultExpiresAt(generatedAt.value || Date.now());
    secondsLeft.value = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    if (secondsLeft.value <= 0 && !qrBusy.value) {
      refreshQr();
    }
  }, 1000);
}

function startStatusPolling() {
  window.clearInterval(statusTimer);
  if (config.qrSource === 'websocket' || !config.boardId || !config.statusPollSeconds) {
    return;
  }
  statusTimer = window.setInterval(refreshStatus, config.statusPollSeconds * 1000);
}

function buildSubscribeMessage(type = 'subscribeCabinetQr') {
  const payload = {
    type,
    action: mode.value,
    qrBaseUrl: config.qrPublicBaseUrl,
  };
  if (config.boardId) {
    payload.boardId = config.boardId;
  }
  if (config.cabinetId || config.boardId) {
    payload.cabinetId = config.cabinetId || config.boardId;
  }
  return JSON.stringify(payload);
}

function requestWebSocketQr() {
  if (config.qrSource !== 'websocket') {
    return;
  }
  if (cabinetIdentityMissing.value) {
    qrBusy.value = false;
    return;
  }
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    qrBusy.value = true;
    wsClient.send(buildSubscribeMessage('refreshCabinetQr'));
  }
}

function parseCabinetIdentityPayload(value) {
  if (!value) {
    return {};
  }
  if (typeof value === 'object') {
    return value.detail || value.data || value;
  }
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

function applyRuntimeCabinetIdentity(value) {
  const changed = applyCabinetIdentity(config, parseCabinetIdentityPayload(value));
  if (!changed) {
    return false;
  }
  remoteError.value = '';
  qrBusy.value = false;
  statusError.value = '';
  if (config.qrSource === 'websocket') {
    stopWebSocket();
    startWebSocket();
    requestWebSocketQr();
  } else {
    refreshAll();
  }
  startStatusPolling();
  renderWechatLaunch();
  return true;
}

function handleCabinetIdentityEvent(event) {
  applyRuntimeCabinetIdentity(event);
}

function handleWindowMessage(event) {
  const payload = parseCabinetIdentityPayload(event);
  const type = String(payload.type || payload.event || '').trim();
  if (!type || type === 'cabinet.deviceConfig' || type === 'cabinet.identity' || type === 'cabinet.config') {
    applyRuntimeCabinetIdentity(payload.data || payload);
  }
}

function installCabinetIdentityListeners() {
  window.addEventListener('cabinet-device-config', handleCabinetIdentityEvent);
  window.addEventListener('cabinet-identity', handleCabinetIdentityEvent);
  window.addEventListener('cabinet-config', handleCabinetIdentityEvent);
  window.addEventListener('message', handleWindowMessage);
}

function removeCabinetIdentityListeners() {
  window.removeEventListener('cabinet-device-config', handleCabinetIdentityEvent);
  window.removeEventListener('cabinet-identity', handleCabinetIdentityEvent);
  window.removeEventListener('cabinet-config', handleCabinetIdentityEvent);
  window.removeEventListener('message', handleWindowMessage);
}

function readNativeCabinetIdentity() {
  const bridgeTargets = [
    ['KeChuangCabinet', 'getCabinetConfig'],
    ['KeChuangCabinet', 'getDeviceConfig'],
    ['KeChuangCabinet', 'getCabinetIdentity'],
    ['KechuangCabinet', 'getCabinetConfig'],
    ['KcCabinet', 'getCabinetConfig'],
    ['CabinetApp', 'getCabinetConfig'],
    ['Android', 'getCabinetConfig'],
    ['Android', 'getDeviceConfig'],
    ['android', 'getCabinetConfig'],
  ];

  for (const [targetName, methodName] of bridgeTargets) {
    const target = window[targetName];
    if (target && typeof target[methodName] === 'function') {
      try {
        if (applyRuntimeCabinetIdentity(target[methodName]())) {
          return true;
        }
      } catch (error) {
        // Try the next known bridge shape.
      }
    }
  }
  return false;
}

function requestCabinetIdentityFromNative() {
  if (readNativeCabinetIdentity()) {
    return;
  }
  window.dispatchEvent(new CustomEvent('cabinet-device-config-request', {
    detail: {
      source: 'cabinet-h5',
      sessionId: config.h5SessionId,
    },
  }));
  const webkitHandlers = ['getCabinetConfig', 'cabinetDeviceConfig', 'cabinetIdentity'];
  for (const handlerName of webkitHandlers) {
    const handler = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers[handlerName];
    if (handler && typeof handler.postMessage === 'function') {
      handler.postMessage({
        type: 'cabinet.deviceConfig.request',
        source: 'cabinet-h5',
        sessionId: config.h5SessionId,
      });
    }
  }
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      type: 'cabinet.deviceConfig.request',
      source: 'cabinet-h5',
      sessionId: config.h5SessionId,
    }, '*');
  }
}

function updateQrFromRemote(next) {
  if (!next) {
    return;
  }
  qrContent.value = next.content;
  qrPayload.value = next.payload;
  qrPayloadToken.value = next.payloadToken || '';
  generatedAt.value = Date.now();
  qrExpiresAt.value = parseExpiresAt(next.expiresAt || (next.payload && next.payload.expiresAt), generatedAt.value);
  secondsLeft.value = Math.max(0, Math.ceil((qrExpiresAt.value - Date.now()) / 1000));
  drawQr(next.content).catch((error) => {
    remoteError.value = error.message || '二维码绘制失败';
  });
  renderWechatLaunch();
  qrBusy.value = false;
  remoteError.value = '';
}

function dispatchCabinetAnimationEvent(type, data) {
  window.dispatchEvent(new CustomEvent('cabinet-open-event', {
    detail: {
      type,
      data,
    },
  }));
}

function recordDebug(event, data = {}) {
  const item = {
    event,
    data,
    ts: Date.now(),
  };
  window.__KC_CABINET_DEBUG__ = window.__KC_CABINET_DEBUG__ || [];
  window.__KC_CABINET_DEBUG__.push(item);
  if (window.__KC_CABINET_DEBUG__.length > 30) {
    window.__KC_CABINET_DEBUG__.shift();
  }
  // Keep this visible in development because cabinet screens often run without devtools open.
  console.info('[cabinet-h5]', event, data);
}

function firstText(...values) {
  const match = values
    .map((value) => (value === undefined || value === null ? '' : String(value).trim()))
    .find(Boolean);
  return match || '';
}

function normalizeOpenCommandPayload(data = {}) {
  const order = data.order || {};
  const lockId = firstText(data.lockId, data.lock_id, data.locker_id, order.lockerSlot);
  const boardId = FIXED_CABINET_ID;
  const cabinetId = FIXED_CABINET_ID;
  return {
    type: 'openLock',
    source: 'cabinet-h5',
    action: firstText(data.action, mode.value),
    boardId,
    cabinetId,
    lockId,
    reservationId: data.reservationId || order.reservationId || '',
    orderNo: firstText(data.orderNo, order.orderNo),
    equipmentTitle: firstText(data.equipmentTitle, order.equipmentTitle),
    commandStatus: firstText(data.commandStatus),
    message: firstText(data.message),
    raw: data,
  };
}

function invokeNativeOpenBridge(payload) {
  const serialized = JSON.stringify(payload);
  const bridgeTargets = [
    ['KeChuangCabinet', 'openLock'],
    ['KeChuangCabinet', 'openLocker'],
    ['KechuangCabinet', 'openLock'],
    ['KcCabinet', 'openLock'],
    ['CabinetApp', 'openLock'],
    ['Android', 'openLock'],
    ['Android', 'openCabinet'],
    ['android', 'openLock'],
  ];

  for (const [targetName, methodName] of bridgeTargets) {
    const target = window[targetName];
    if (target && typeof target[methodName] === 'function') {
      try {
        target[methodName](serialized);
        return true;
      } catch (error) {
        try {
          target[methodName](payload.lockId, payload.boardId, serialized);
          return true;
        } catch (fallbackError) {
          // Try the next known bridge shape.
        }
      }
    }
  }

  const webkitHandlers = ['openLock', 'cabinetOpen', 'cabinetOpenLock'];
  for (const handlerName of webkitHandlers) {
    const handler = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers[handlerName];
    if (handler && typeof handler.postMessage === 'function') {
      handler.postMessage(payload);
      return true;
    }
  }

  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      type: 'cabinet.openLock',
      data: payload,
    }, '*');
    return true;
  }

  return false;
}

function sendOpenCommandAck(payload, bridgeInvoked) {
  if (!wsClient || wsClient.readyState !== WebSocket.OPEN) {
    return;
  }
  try {
    wsClient.send(JSON.stringify({
      type: 'open.command.dispatched',
      lockId: payload.lockId,
      boardId: payload.boardId,
      cabinetId: payload.cabinetId,
      reservationId: payload.reservationId,
      bridgeInvoked,
      ts: Date.now(),
    }));
  } catch (error) {
    // The next heartbeat or reconnect will resync the screen.
  }
}

function shouldDispatchOpenCommand(type, data = {}) {
  return type === 'open.start' && (
    data.openByH5 === true ||
    data.openByH5 === 'true' ||
    data.commandChannel === 'h5' ||
    data.commandStatus === 'h5_command'
  );
}

function dispatchCabinetOpenCommand(data = {}) {
  const payload = normalizeOpenCommandPayload(data);
  if (!payload.lockId || !payload.boardId) {
    return false;
  }
  const event = new CustomEvent('cabinet-open-command', {
    detail: payload,
    cancelable: true,
  });
  window.dispatchEvent(event);
  const bridgeInvoked = event.defaultPrevented || invokeNativeOpenBridge(payload);
  sendOpenCommandAck(payload, bridgeInvoked);
  return bridgeInvoked;
}

function markDoorOpen(lockId) {
  const id = String(lockId || '').trim();
  if (!id) {
    return;
  }
  const next = doorItems.value.slice();
  const index = next.findIndex((item) => String(item.lock_id || item.id || item.boxId || '') === id);
  if (index >= 0) {
    next[index] = {
      ...next[index],
      door_status: '1',
    };
  } else {
    next.unshift({
      board_id: config.boardId || config.cabinetId,
      lock_id: id,
      door_status: '1',
      product_name: '已开柜门',
      weight: '0',
      quantity: '0',
    });
  }
  doorItems.value = next;
  statusUpdatedAt.value = Date.now();
}

function closeAnimationModal() {
  animationModalVisible.value = false;
  closeCountdown.value = 0;
  window.clearInterval(modalCountdownTimer);
}

function openAnimationModal() {
  animationModalVisible.value = true;
  window.clearInterval(modalCountdownTimer);
  closeCountdown.value = 5;
  modalCountdownTimer = window.setInterval(() => {
    closeCountdown.value -= 1;
    if (closeCountdown.value <= 0) {
      closeAnimationModal();
    }
  }, 1000);
}

function handleOpenMessage(type, data = {}) {
  activeLockId.value = String(data.lockId || data.lock_id || data.locker_id || (data.order && data.order.lockerSlot) || '').trim();
  const commandDispatched = shouldDispatchOpenCommand(type, data) ? dispatchCabinetOpenCommand(data) : false;
  const eventData = {
    ...data,
    commandDispatched,
  };
  if (type === 'open.start') {
    animationState.value = 'opening';
    animationMessage.value = data.message || '开柜指令下发中';
  } else if (type === 'open.success' || type === 'open') {
    animationState.value = 'opened';
    animationMessage.value = data.message || '柜门已打开';
    markDoorOpen(activeLockId.value);
    openAnimationModal();
  } else if (type === 'open.fail') {
    animationState.value = 'failed';
    animationMessage.value = data.message || '开柜失败，请重试';
    openAnimationModal();
  }
  window.clearTimeout(postOpenQrRefreshTimer);
  postOpenQrRefreshTimer = window.setTimeout(refreshQr, 300);
  dispatchCabinetAnimationEvent(type, eventData);
}

function startWebSocket() {
  if (config.qrSource !== 'websocket' || !config.qrWsUrl) {
    return;
  }
  if (cabinetIdentityMissing.value) {
    wsConnected.value = false;
    return;
  }

  wsStopped = false;
  window.clearTimeout(reconnectTimer);
  wsClient = new WebSocket(config.qrWsUrl);
  wsClient.onopen = () => {
    wsConnected.value = true;
    remoteError.value = '';
    recordDebug('ws.open', { url: config.qrWsUrl });
    wsClient.send(buildSubscribeMessage('subscribeCabinetQr'));
  };
  wsClient.onclose = () => {
    wsConnected.value = false;
    recordDebug('ws.close', { stopped: wsStopped });
    if (!wsStopped) {
      reconnectTimer = window.setTimeout(startWebSocket, 2000);
    }
  };
  wsClient.onerror = (error) => {
    remoteError.value = 'WebSocket 连接失败';
    recordDebug('ws.error', { message: error && error.message ? error.message : '' });
  };
  wsClient.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      recordDebug('ws.message', {
        type: message.type || '',
        hasData: Boolean(message.data),
        hasContent: Boolean(message.qrContent || message.content || (message.data && (message.data.qrContent || message.data.content))),
      });
      if (message.type === 'connected') {
        requestWebSocketQr();
        return;
      }
      if (
        message.type === 'open.start' ||
        message.type === 'open.success' ||
        message.type === 'open.fail' ||
        message.type === 'open'
      ) {
        handleOpenMessage(message.type, message.data || message);
        return;
      }
      const next = normalizeRemoteQrMessage(message);
      if (!next) {
        return;
      }
      updateQrFromRemote(next);
    } catch (error) {
      remoteError.value = error.message || 'WebSocket 数据异常';
      qrBusy.value = false;
      recordDebug('ws.message.error', { message: remoteError.value });
    }
  };
}

function stopWebSocket() {
  wsStopped = true;
  window.clearTimeout(reconnectTimer);
  if (wsClient) {
    wsClient.close();
    wsClient = null;
  }
}

function setMode(nextMode) {
  if (mode.value === nextMode) {
    return;
  }
  mode.value = nextMode;
  if (config.qrSource === 'websocket' && wsClient && wsClient.readyState === WebSocket.OPEN) {
    qrBusy.value = true;
    wsClient.send(buildSubscribeMessage('switchCabinetQrAction'));
    return;
  }
  refreshQr();
}

async function copyQrContent() {
  if (!qrContent.value || !navigator.clipboard) {
    return;
  }
  await navigator.clipboard.writeText(qrContent.value);
}

function renderWechatLaunch() {
  if (!wechatOpenReady.value) {
    return;
  }
  renderLaunchOpenTag(launchHost.value, config.miniProgramAppId, buildMiniProgramPath());
}

onMounted(async () => {
  installCabinetIdentityListeners();
  requestCabinetIdentityFromNative();
  await refreshAll();
  startTicking();
  startStatusPolling();
  startWebSocket();

  try {
    wechatOpenReady.value = await setupWechatOpenTag(config);
    renderWechatLaunch();
  } catch (error) {
    wechatOpenReady.value = false;
  }
});

onBeforeUnmount(() => {
  window.clearInterval(tickTimer);
  window.clearInterval(statusTimer);
  window.clearInterval(modalCountdownTimer);
  window.clearTimeout(postOpenQrRefreshTimer);
  removeCabinetIdentityListeners();
  stopWebSocket();
});

watch(mode, () => {
  renderWechatLaunch();
});
</script>
