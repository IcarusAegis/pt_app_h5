<template>
  <main class="v14-screen" aria-label="科创智借智能柜服务系统">
    <!-- 顶部金属壳 -->
    <header class="v14-top-shell">
      <img class="v14-header-logo" :src="logoUrl" alt="上海市普陀区青少年教育活动中心" />
      <div
        class="v14-online-pill"
        :class="{ warn: connectionTone !== 'ok', clickable: true }"
        :title="connectionText"
        @click="onPillClick"
      >
        <span class="dot"></span>
        {{ connectionText }}
      </div>
    </header>

    <!-- 主区域：首页 或 二维码页 -->
    <section class="v14-main-area">
      <div class="v14-white-circuit" aria-hidden="true"></div>
      <div class="v14-floor-ring" aria-hidden="true"></div>

      <!-- 首页 -->
      <template v-if="viewState === 'home'">
        <div class="v14-headline">
          <h2>普陀区青少年科创器材共享系统</h2>
          <div class="v14-headline-rule" aria-hidden="true">
            <span></span>
            <b></b>
            <span></span>
          </div>
          <p class="v14-headline-sub">柜机 {{ config.boardId || '--' }}</p>
          <p class="v14-headline-sub-second">请选择需要的服务</p>
        </div>

        <button
          class="v14-service-card pickup"
          type="button"
          aria-label="扫码取件"
          @click="goToQr('borrow')"
        >
          <span class="v14-card-icon" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 18 32 8l24 10v28L32 56 8 46z" />
              <path d="M8 18l24 10 24-10" />
              <path d="M32 28v28" />
              <path d="m24 36 6 6 12-14" stroke-width="4" />
            </svg>
          </span>
          <span class="v14-service-text">
            <strong>扫码取件</strong>
            <em>扫一扫取出您预约的器材</em>
          </span>
          <span class="v14-arrow-badge" aria-hidden="true">
            <svg viewBox="0 0 64 64">
              <path d="m24 16 18 16-18 16" />
              <path d="m36 16 18 16-18 16" />
            </svg>
          </span>
        </button>

        <button
          class="v14-service-card return"
          type="button"
          aria-label="扫码归还"
          @click="goToQr('return')"
        >
          <span class="v14-card-icon" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <rect x="10" y="14" width="44" height="38" rx="4" />
              <path d="M10 24h44" />
              <path d="M32 44V30" />
              <path d="m24 38 8-8 8 8" stroke-width="4" />
            </svg>
          </span>
          <span class="v14-service-text">
            <strong>扫码归还</strong>
            <em>扫一扫存入您归还的器材</em>
          </span>
          <span class="v14-arrow-badge" aria-hidden="true">
            <svg viewBox="0 0 64 64">
              <path d="m24 16 18 16-18 16" />
              <path d="m36 16 18 16-18 16" />
            </svg>
          </span>
        </button>
      </template>

      <!-- 二维码页 -->
      <section v-else class="v14-qr-page">
        <button class="v14-qr-back" type="button" @click="goHome">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          返回首页
        </button>

        <div class="v14-qr-headline">
          <div class="eyebrow">{{ activeCopy.badge }}</div>
          <h3>{{ activeCopy.title }}</h3>
          <p>柜体 {{ config.boardId || '--' }}</p>
        </div>

        <div class="v14-qr-body">
          <div class="v14-qr-shell">
            <canvas ref="qrCanvas"></canvas>
            <div v-if="cabinetIdentityMissing || qrBusy" class="v14-qr-overlay">
              {{ qrOverlayText }}
            </div>
          </div>

          <div class="v14-qr-meta">
            <div class="v14-timer-ring" :style="{ '--progress': countdownProgress }">
              <span>{{ secondsLeft }}</span>
            </div>
            <div class="v14-qr-meta-text">
              <small>本轮二维码剩余时间</small>
              <strong>{{ generatedAtText }} 更新</strong>
            </div>
            <button class="v14-copy-btn" @click="copyQrContent">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              复制内容
            </button>
          </div>

          <div class="v14-info-row">
            <div>
              <small>主机编号</small>
              <strong>{{ config.boardId || '--' }}</strong>
            </div>
            <div>
              <small>有效期</small>
              <strong>{{ config.qrTtlSeconds }}s</strong>
            </div>
            <div>
              <small>返回主页</small>
              <strong>{{ qrIdleCountdown > 0 ? qrIdleCountdown + 's' : '--' }}</strong>
            </div>
          </div>

          <div class="v14-action-note">
            {{ animationMessage }}
            <span v-if="diagnosticText" class="detail">{{ diagnosticText }}</span>
          </div>

          <div ref="launchHost" class="v14-launch-host"></div>
        </div>
      </section>
    </section>

    <!-- 底部金属壳 -->
    <footer class="v14-bottom-shell">
      <div class="v14-status-block a">
        <span class="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </span>
        <div>
          <strong>可借器材 <b>{{ availableCount }}</b></strong>
          <em>在线柜门 {{ doorStats.online }} / {{ doorStats.total || 0 }}</em>
        </div>
      </div>
      <div class="v14-footer-divider one"></div>

      <div class="v14-status-block b">
        <span class="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M7 7h4M7 11h10M7 15h7" />
          </svg>
        </span>
        <div>
          <strong>已借出器材 <b>{{ doorStats.opened }}</b></strong>
          <em>更新于 {{ statusUpdatedText }}</em>
        </div>
      </div>
      <div class="v14-footer-divider two"></div>

      <div class="v14-status-block c">
        <span class="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5z" />
            <path d="m9 12 2 2 4-4" stroke-width="2.8" />
          </svg>
        </span>
        <div>
          <strong>设备状态 <b>{{ statusBadge }}</b></strong>
          <em>{{ connectionText }}</em>
        </div>
      </div>
    </footer>

    <!-- 开柜结果弹窗 -->
    <div
      class="v14-modal-overlay"
      :class="{ active: animationModalVisible, failed: animationState === 'failed' }"
    >
      <div class="v14-modal-content">
        <div class="v14-locker">
          <div class="v14-locker-inside"></div>
          <div class="v14-locker-door">
            <span>{{ displayLockId }}</span>
          </div>
        </div>
        <h3 class="v14-modal-title">{{ animationModalTitle }}</h3>
        <p class="v14-modal-desc">
          请前往 <span class="v14-modal-highlight">{{ displayLockId }}</span> 号柜
          {{ mode === 'return' ? '存放' : '取出' }}您的物品
        </p>
        <button class="v14-modal-close" @click="closeAnimationModal">
          关闭 ({{ closeCountdown }})
        </button>
      </div>
    </div>

    <!-- 管理员面板：密码验证 + 配置编辑 -->
    <div v-if="adminPanelVisible" class="v14-admin-overlay" @click.self="closeAdminPanel">
      <div class="v14-admin-panel" :class="{ 'config-mode': adminStep === 'config' }">
        <h2 class="v14-admin-title">
          {{ adminStep === 'password' ? '🔒 输入管理员密码' : '⚙️ 系统配置' }}
        </h2>

        <!-- 密码验证步骤 -->
        <template v-if="adminStep === 'password'">
          <div class="v14-admin-hint">
            请输入6位数字密码
          </div>
          <div v-if="passwordError" class="v14-admin-error">{{ passwordError }}</div>

          <div class="v14-password-dots">
            <div v-for="i in 6" :key="i" class="v14-dot" :class="{ filled: passwordInput.length >= i }"></div>
          </div>

          <div class="v14-numpad">
            <button v-for="num in 9" :key="num" class="v14-num-btn" @click="onNumClick(num)">{{ num }}</button>
            <div class="v14-num-btn empty"></div>
            <button class="v14-num-btn" @click="onNumClick(0)">0</button>
            <button class="v14-num-btn delete" @click="onDeleteClick">删除</button>
          </div>

          <div class="v14-admin-actions">
            <button class="v14-admin-btn secondary" @click="closeAdminPanel">取消</button>
            <button class="v14-admin-btn primary" :disabled="passwordInput.length < 6" @click="verifyPassword">确认</button>
          </div>
        </template>

        <!-- 配置编辑步骤 -->
        <template v-else>
          <div class="v14-config-tabs">
            <button class="v14-tab-btn" :class="{ active: configTab === 'sys' }" @click="configTab = 'sys'">系统配置</button>
            <button class="v14-tab-btn" :class="{ active: configTab === 'pwd' }" @click="configTab = 'pwd'">修改密码</button>
          </div>

          <!-- 系统配置 -->
          <div v-if="configTab === 'sys'" class="v14-config-form">
            <div class="v14-config-row">
              <label>柜机编号 boardId</label>
              <input v-model="adminForm.boardId" placeholder="例如：2441" />
            </div>
            <div class="v14-config-row">
              <label>二维码数据源</label>
              <select v-model="adminForm.qrSource">
                <option value="websocket">WebSocket (实时推送)</option>
                <option value="poll">HTTP 轮询</option>
                <option value="local">本地生成二维码</option>
              </select>
            </div>
            <div class="v14-config-row">
              <label>WebSocket 地址</label>
              <input v-model="adminForm.qrWsUrl" placeholder="wss://..." />
            </div>
            <div class="v14-config-row">
              <label>后端 API 地址</label>
              <input v-model="adminForm.vendorBaseUrl" placeholder="http://..." />
            </div>
            <div class="v14-config-row">
              <label>二维码有效期 (秒)</label>
              <input v-model="adminForm.qrTtlSeconds" type="number" placeholder="60" />
            </div>
            <div class="v14-config-row">
              <label>状态轮询间隔 (秒)</label>
              <input v-model="adminForm.statusPollSeconds" type="number" placeholder="10" />
            </div>
          </div>

          <!-- 修改密码 -->
          <div v-else class="v14-config-form">
            <div class="v14-config-row small">
              <label>原密码</label>
              <input v-model="passwordForm.old" type="password" maxlength="6" placeholder="请输入原密码" />
            </div>
            <div class="v14-config-row small">
              <label>新密码 (6位数字)</label>
              <input v-model="passwordForm.new" type="password" maxlength="6" placeholder="请输入新密码" />
            </div>
            <div class="v14-config-row small">
              <label>确认新密码</label>
              <input v-model="passwordForm.confirm" type="password" maxlength="6" placeholder="请再次输入新密码" />
            </div>
          </div>

          <div class="v14-admin-actions" style="margin-top: 20px;">
            <button class="v14-admin-btn secondary" @click="closeAdminPanel">取消</button>
            <button class="v14-admin-btn primary" @click="saveConfig">{{ configTab === 'sys' ? '保存配置' : '修改密码' }}</button>
          </div>
        </template>

        <div class="v14-admin-tip">
          💡 配置保存在浏览器本地存储，重启设备不会丢失<br>
          {{ configTab === 'sys' ? '修改后刷新页面立即生效' : '密码长度必须为6位数字' }}
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import QRCode from 'qrcode';
import { formatClock, getQueryPayload } from './codec';
import {
  FIXED_CABINET_ID,
  applyCabinetIdentity,
  getInitialMode,
  getRuntimeConfig,
} from './config';
import {
  buildLocalQrContent,
  fetchPolledQr,
  normalizeRemoteQrMessage,
} from './qr-feed';
import { readBoardLocksStatus } from './vendor-api';
import { renderLaunchOpenTag, setupWechatOpenTag } from './wechat-open';
import logoUrl from './v14-yec-logo.png';

const MODE_COPY = {
  borrow: { title: '扫码开柜取件', badge: '取件 · 动态码', actionText: '取件' },
  return: { title: '扫码开柜归还', badge: '归还 · 动态码', actionText: '归还' },
};

const config = reactive(getRuntimeConfig());
const viewState = ref('home');
const mode = ref(getInitialMode());
const qrCanvas = ref(null);
const launchHost = ref(null);
const qrBusy = ref(false);
const qrContent = ref('');
const qrPayload = ref(getQueryPayload());
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

// ---------- 管理员模式 ----------
const STORAGE_CONFIG_KEY = 'v14_cabinet_config';
const STORAGE_PASSWORD_KEY = 'v14_cabinet_password';
const DEFAULT_PASSWORD = '123456';

const adminPanelVisible = ref(false);
const adminStep = ref('password'); // 'password' | 'config'
const configTab = ref('sys'); // 'sys' | 'pwd'
const passwordInput = ref('');
const passwordError = ref('');
let adminClickCount = 0;
let adminClickTimer = null;

// 系统配置表单
const adminForm = reactive({
  boardId: '',
  qrSource: 'websocket',
  qrWsUrl: '',
  vendorBaseUrl: '',
  qrTtlSeconds: '60',
  statusPollSeconds: '10',
});

// 密码修改表单
const passwordForm = reactive({
  old: '',
  new: '',
  confirm: '',
});

function getSavedPassword() {
  try {
    return localStorage.getItem(STORAGE_PASSWORD_KEY) || DEFAULT_PASSWORD;
  } catch {
    return DEFAULT_PASSWORD;
  }
}

function loadAdminForm() {
  try {
    const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 兼容旧版 key 与 config.js 读取的 key
      adminForm.boardId = parsed.boardId ?? '';
      adminForm.qrSource = parsed.source ?? parsed.qrSource ?? 'websocket';
      adminForm.qrWsUrl = parsed.wsUrl ?? parsed.qrWsUrl ?? '';
      adminForm.vendorBaseUrl = parsed.baseUrl ?? parsed.vendorBaseUrl ?? '';
      adminForm.qrTtlSeconds = String(parsed.ttl ?? parsed.qrTtlSeconds ?? 60);
      adminForm.statusPollSeconds = String(parsed.statusPoll ?? parsed.statusPollSeconds ?? 10);
      return;
    }
  } catch {}
  // 使用当前配置初始化表单
  adminForm.boardId = config.boardId || FIXED_CABINET_ID;
  adminForm.qrSource = config.qrSource || 'websocket';
  adminForm.qrWsUrl = config.qrWsUrl || '';
  adminForm.vendorBaseUrl = config.vendorBaseUrl || '';
  adminForm.qrTtlSeconds = String(config.qrTtlSeconds || 60);
  adminForm.statusPollSeconds = String(config.statusPollSeconds || 10);
}

function closeAdminPanel() {
  adminPanelVisible.value = false;
  adminStep.value = 'password';
  configTab.value = 'sys';
  passwordInput.value = '';
  passwordError.value = '';
  passwordForm.old = '';
  passwordForm.new = '';
  passwordForm.confirm = '';
}

function onPillClick() {
  adminClickCount++;
  if (adminClickTimer) clearTimeout(adminClickTimer);
  if (adminClickCount >= 5) {
    adminClickCount = 0;
    loadAdminForm();
    adminPanelVisible.value = true;
    return;
  }
  adminClickTimer = setTimeout(() => {
    adminClickCount = 0;
  }, 1200);
}

// 数字键盘
function onNumClick(num) {
  if (passwordInput.value.length >= 6) return;
  passwordInput.value += String(num);
  passwordError.value = '';
}

function onDeleteClick() {
  passwordInput.value = passwordInput.value.slice(0, -1);
  passwordError.value = '';
}

function verifyPassword() {
  const saved = getSavedPassword();
  if (passwordInput.value === saved) {
    passwordInput.value = '';
    passwordError.value = '';
    adminStep.value = 'config';
  } else {
    passwordError.value = '密码错误，请重试';
    passwordInput.value = '';
  }
}

// 保存配置
function saveConfig() {
  if (configTab.value === 'sys') {
    try {
      // key 与 config.js 的 getValue 读取的查询参数名保持一致
      const toSave = {
        boardId: adminForm.boardId.trim(),
        source: adminForm.qrSource,
        wsUrl: adminForm.qrWsUrl.trim(),
        baseUrl: adminForm.vendorBaseUrl.trim(),
        ttl: Number(adminForm.qrTtlSeconds) || 60,
        statusPoll: Number(adminForm.statusPollSeconds) || 10,
      };
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(toSave));
      alert('配置已保存！页面将刷新以应用新配置');
      location.reload();
    } catch (e) {
      alert('保存失败：' + e.message);
    }
  } else {
    // 修改密码
    if (passwordForm.old !== getSavedPassword()) {
      alert('原密码错误');
      return;
    }
    if (!/^\d{6}$/.test(passwordForm.new)) {
      alert('新密码必须为6位数字');
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      alert('两次输入的新密码不一致');
      return;
    }
    localStorage.setItem(STORAGE_PASSWORD_KEY, passwordForm.new);
    alert('密码修改成功！');
    closeAdminPanel();
  }
}

let tickTimer = 0;
let statusTimer = 0;
let reconnectTimer = 0;
let modalCountdownTimer = 0;
let postOpenQrRefreshTimer = 0;
let wsClient = null;
let wsStopped = false;

function goHome() { viewState.value = 'home'; }
function goToQr(newMode) { setMode(newMode); viewState.value = 'qr'; }

// 取件/归还页面停留超过 60s 自动返回主页
const QR_IDLE_TIMEOUT_SECONDS = 60;
const qrIdleCountdown = ref(0);
let qrIdleTimer = 0;
function clearQrIdle() {
  window.clearInterval(qrIdleTimer);
  qrIdleTimer = 0;
  qrIdleCountdown.value = 0;
}
function scheduleQrIdleReturn() {
  clearQrIdle();
  // 仅在取件/归还页且未弹出开柜动画时计时；动画期间等待开柜结果，不触发返回
  if (viewState.value !== 'qr' || animationModalVisible.value) return;
  qrIdleCountdown.value = QR_IDLE_TIMEOUT_SECONDS;
  qrIdleTimer = window.setInterval(() => {
    qrIdleCountdown.value -= 1;
    if (qrIdleCountdown.value <= 0) {
      clearQrIdle();
      if (viewState.value === 'qr' && !animationModalVisible.value) goHome();
    }
  }, 1000);
}

const activeCopy = computed(() => MODE_COPY[mode.value]);
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

const cabinetIdentityMissing = computed(() => !firstText(config.boardId, config.cabinetId));
const qrOverlayText = computed(() => (cabinetIdentityMissing.value ? '等待柜机编号' : '刷新中…'));

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
  return '设备在线';
});
const statusBadge = computed(() => (connectionTone.value === 'ok' ? '正常' : '注意'));
const diagnosticText = computed(() => {
  if (remoteError.value) return `${remoteError.value}：${config.qrWsUrl || config.qrPollUrl || config.qrSource}`;
  if (statusError.value) return statusError.value;
  if (config.qrSource === 'websocket' && !qrContent.value) return `等待二维码：${config.qrWsUrl}`;
  return '';
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

const availableCount = computed(() => {
  const total = doorStats.value.total || 0;
  const opened = doorStats.value.opened || 0;
  const remain = Math.max(0, total - opened);
  return remain || '--';
});

watch(viewState, async (newState) => {
  scheduleQrIdleReturn();
  if (newState === 'qr') {
    await nextTick();
    if (qrContent.value) {
      drawQr(qrContent.value).catch((e) => console.error(e));
    } else {
      refreshQr();
    }
  }
});

function firstText(...values) {
  const match = values
    .map((value) => (value === undefined || value === null ? '' : String(value).trim()))
    .find(Boolean);
  return match || '';
}

function getDefaultExpiresAt(baseTime = Date.now()) {
  return baseTime + Math.max(1, config.qrTtlSeconds) * 1000;
}

function parseExpiresAt(value, fallbackTime = Date.now()) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    const timestamp = numeric > 1000000000000 ? numeric : numeric * 1000;
    if (timestamp > Date.now()) return timestamp;
  }
  const parsed = Date.parse(value);
  if (Number.isFinite(parsed) && parsed > Date.now()) return parsed;
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
  if (config.boardId) query.set('boardId', config.boardId);
  return `${path}${path.includes('?') ? '&' : '?'}${query.toString()}`;
}

function getQrRenderSize() {
  const shell = qrCanvas.value && qrCanvas.value.parentElement;
  if (shell) {
    const size = Math.min(shell.clientWidth, shell.clientHeight) - 48;
    return Math.max(320, Math.floor(size));
  }
  return 480;
}

async function drawQr(content) {
  if (!qrCanvas.value || !content) return;
  const size = getQrRenderSize();
  await QRCode.toCanvas(qrCanvas.value, content, {
    width: size,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#07183b', light: '#ffffff' },
  });
}

async function resolveQrContent() {
  if (config.qrSource === 'websocket') return null;
  if (config.qrSource === 'poll') {
    const remote = await fetchPolledQr(config, mode.value);
    if (remote) return remote;
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
  if (config.qrSource === 'websocket') { statusError.value = ''; return; }
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
    if (secondsLeft.value <= 0 && !qrBusy.value && viewState.value === 'qr') {
      refreshQr();
    }
  }, 1000);
}

function startStatusPolling() {
  window.clearInterval(statusTimer);
  if (config.qrSource === 'websocket' || !config.boardId || !config.statusPollSeconds) return;
  statusTimer = window.setInterval(refreshStatus, config.statusPollSeconds * 1000);
}

function buildSubscribeMessage(type = 'subscribeCabinetQr') {
  const payload = { type, action: mode.value, qrBaseUrl: config.qrPublicBaseUrl };
  if (config.boardId) payload.boardId = config.boardId;
  if (config.cabinetId || config.boardId) payload.cabinetId = config.cabinetId || config.boardId;
  return JSON.stringify(payload);
}

function requestWebSocketQr() {
  if (config.qrSource !== 'websocket') return;
  if (cabinetIdentityMissing.value) { qrBusy.value = false; return; }
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    qrBusy.value = true;
    wsClient.send(buildSubscribeMessage('refreshCabinetQr'));
  }
}

function parseCabinetIdentityPayload(value) {
  if (!value) return {};
  if (typeof value === 'object') return value.detail || value.data || value;
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch { return {}; }
}

function applyRuntimeCabinetIdentity(value) {
  const changed = applyCabinetIdentity(config, parseCabinetIdentityPayload(value));
  if (!changed) return false;
  remoteError.value = ''; qrBusy.value = false; statusError.value = '';
  if (config.qrSource === 'websocket') {
    stopWebSocket(); startWebSocket(); requestWebSocketQr();
  } else {
    refreshAll();
  }
  startStatusPolling();
  renderWechatLaunch();
  return true;
}

function handleCabinetIdentityEvent(event) { applyRuntimeCabinetIdentity(event); }

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
    ['KechuangCabinet', 'getCabinetConfig'],
    ['CabinetApp', 'getCabinetConfig'],
    ['Android', 'getCabinetConfig'],
    ['Android', 'getDeviceConfig'],
  ];
  for (const [t, m] of bridgeTargets) {
    const target = window[t];
    if (target && typeof target[m] === 'function') {
      try { if (applyRuntimeCabinetIdentity(target[m]())) return true; } catch {}
    }
  }
  return false;
}

function requestCabinetIdentityFromNative() {
  if (readNativeCabinetIdentity()) return;
  window.dispatchEvent(new CustomEvent('cabinet-device-config-request', {
    detail: { source: 'cabinet-h5', sessionId: config.h5SessionId },
  }));
}

function updateQrFromRemote(next) {
  if (!next) return;
  qrContent.value = next.content;
  qrPayload.value = next.payload;
  qrPayloadToken.value = next.payloadToken || '';
  generatedAt.value = Date.now();
  qrExpiresAt.value = parseExpiresAt(next.expiresAt || (next.payload && next.payload.expiresAt), generatedAt.value);
  secondsLeft.value = Math.max(0, Math.ceil((qrExpiresAt.value - Date.now()) / 1000));
  drawQr(next.content).catch((error) => { remoteError.value = error.message || '二维码绘制失败'; });
  renderWechatLaunch();
  qrBusy.value = false;
  remoteError.value = '';
}

function dispatchCabinetAnimationEvent(type, data) {
  window.dispatchEvent(new CustomEvent('cabinet-open-event', { detail: { type, data } }));
}

function markDoorOpen(lockId) {
  const id = String(lockId || '').trim();
  if (!id) return;
  const next = doorItems.value.slice();
  const index = next.findIndex((item) => String(item.lock_id || item.id || item.boxId || '') === id);
  if (index >= 0) {
    next[index] = { ...next[index], door_status: '1' };
  } else {
    next.unshift({
      board_id: config.boardId || config.cabinetId,
      lock_id: id,
      door_status: '1',
      product_name: '已开柜门',
    });
  }
  doorItems.value = next;
  statusUpdatedAt.value = Date.now();
}

function closeAnimationModal() {
  animationModalVisible.value = false;
  closeCountdown.value = 0;
  window.clearInterval(modalCountdownTimer);
  // 弹窗关闭后若仍在取件/归还页，重新开始 60s 计时
  scheduleQrIdleReturn();
}

function openAnimationModal() {
  animationModalVisible.value = true;
  window.clearInterval(modalCountdownTimer);
  // 弹窗期间暂停 60s 自动返回计时
  clearQrIdle();
  closeCountdown.value = 5;
  modalCountdownTimer = window.setInterval(() => {
    closeCountdown.value -= 1;
    if (closeCountdown.value <= 0) closeAnimationModal();
  }, 1000);
}

function handleOpenMessage(type, data = {}) {
  activeLockId.value = String(data.lockId || data.lock_id || data.locker_id || (data.order && data.order.lockerSlot) || '').trim();
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
  dispatchCabinetAnimationEvent(type, data);
}

function startWebSocket() {
  if (config.qrSource !== 'websocket' || !config.qrWsUrl) return;
  if (cabinetIdentityMissing.value) { wsConnected.value = false; return; }
  wsStopped = false;
  window.clearTimeout(reconnectTimer);
  wsClient = new WebSocket(config.qrWsUrl);
  wsClient.onopen = () => {
    wsConnected.value = true;
    remoteError.value = '';
    wsClient.send(buildSubscribeMessage('subscribeCabinetQr'));
  };
  wsClient.onclose = () => {
    wsConnected.value = false;
    if (!wsStopped) reconnectTimer = window.setTimeout(startWebSocket, 2000);
  };
  wsClient.onerror = () => { remoteError.value = 'WebSocket 连接失败'; };
  wsClient.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === 'connected') { requestWebSocketQr(); return; }
      if (['open.start', 'open.success', 'open.fail', 'open'].includes(message.type)) {
        handleOpenMessage(message.type, message.data || message);
        return;
      }
      const next = normalizeRemoteQrMessage(message);
      if (!next) return;
      updateQrFromRemote(next);
    } catch (error) {
      remoteError.value = error.message || 'WebSocket 数据异常';
      qrBusy.value = false;
    }
  };
}

function stopWebSocket() {
  wsStopped = true;
  window.clearTimeout(reconnectTimer);
  if (wsClient) { wsClient.close(); wsClient = null; }
}

function setMode(nextMode) {
  if (mode.value === nextMode) return;
  mode.value = nextMode;
  if (config.qrSource === 'websocket' && wsClient && wsClient.readyState === WebSocket.OPEN) {
    qrBusy.value = true;
    wsClient.send(buildSubscribeMessage('switchCabinetQrAction'));
    return;
  }
  refreshQr();
}

async function copyQrContent() {
  if (!qrContent.value || !navigator.clipboard) return;
  await navigator.clipboard.writeText(qrContent.value);
}

function renderWechatLaunch() {
  if (!wechatOpenReady.value) return;
  renderLaunchOpenTag(launchHost.value, config.miniProgramAppId, buildMiniProgramPath());
}

onMounted(async () => {
  installCabinetIdentityListeners();
  requestCabinetIdentityFromNative();
  // 首页不立即生成二维码，避免无谓的接口压力，但状态仍需要拉取一次
  await refreshStatus();
  startTicking();
  startStatusPolling();
  startWebSocket();
  try {
    wechatOpenReady.value = await setupWechatOpenTag(config);
    renderWechatLaunch();
  } catch {
    wechatOpenReady.value = false;
  }
});

onBeforeUnmount(() => {
  window.clearInterval(tickTimer);
  window.clearInterval(statusTimer);
  window.clearInterval(modalCountdownTimer);
  window.clearTimeout(postOpenQrRefreshTimer);
  clearQrIdle();
  removeCabinetIdentityListeners();
  stopWebSocket();
});

watch(mode, () => { renderWechatLaunch(); });
</script>
