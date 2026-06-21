<template>
  <div class="demo-root">
    <aside class="demo-sidebar">
      <div class="demo-brand">
        <span class="demo-logo">KZ</span>
        <div>
          <h1>UI 版本演示</h1>
          <p>科创智借柜屏二维码</p>
        </div>
      </div>
      <nav class="demo-nav">
        <button
          v-for="ver in versions"
          :key="ver.id"
          class="demo-tab"
          :class="{ active: active === ver.id }"
          @click="active = ver.id"
        >
          <span class="demo-tab-id">{{ ver.id }}</span>
          <span class="demo-tab-name">{{ ver.name }}</span>
        </button>
      </nav>
      <div class="demo-footer">
        <span>共 {{ versions.length }} 个版本</span>
      </div>
    </aside>
    <main class="demo-stage">
      <div class="demo-toolbar">
        <span class="demo-current">当前预览：<strong>{{ currentLabel }}</strong></span>
        <a :href="iframeSrc" target="_blank" class="demo-open">在新窗口打开 ↗</a>
      </div>
      <div class="demo-frame-wrap">
        <iframe
          :src="iframeSrc"
          class="demo-iframe"
          sandbox="allow-scripts allow-same-origin allow-forms"
        ></iframe>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const versions = [
  { id: 'v1',  name: 'Material Design' },
  { id: 'v2',  name: 'Apple 极简' },
  { id: 'v3',  name: '玻璃拟态自然' },
  { id: 'v4',  name: '基准版本' },
  { id: 'v5',  name: '霓虹深渊' },
  { id: 'v6',  name: '水墨国风' },
  { id: 'v7',  name: '复古 CRT 终端' },
  { id: 'v8',  name: 'Apple visionOS' },
  { id: 'v9',  name: 'Claude Code 终端琥珀' },
  { id: 'v10', name: '液态玻璃' },
  { id: 'v11', name: '纯净白 iOS' },
  { id: 'v12', name: '实验室白' },
  { id: 'v13', name: '奶油暖白' },
];

const active = ref('v5');
const currentLabel = computed(() => {
  const v = versions.find(x => x.id === active.value);
  return v ? `${v.id} · ${v.name}` : active.value;
});
const iframeSrc = computed(() => `./version.html?v=${active.value}`);
</script>

<style>
* { box-sizing: border-box; }

html, body, #demo {
  height: 100%;
  margin: 0;
}

body {
  font-family: "Inter", "PingFang SC", "Microsoft YaHei", ui-sans-serif, system-ui, sans-serif;
  background: #0f0f1a;
  color: #e2e2e8;
}

.demo-root {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ===== 侧边栏 ===== */
.demo-sidebar {
  display: flex;
  flex-direction: column;
  width: 260px;
  min-width: 260px;
  background: #161621;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.demo-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 24px 20px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.demo-logo {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #7c3aed, #06b6d4);
  color: #fff;
  font-size: 16px;
  font-weight: 900;
}

.demo-brand h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.5px;
}

.demo-brand p {
  margin: 4px 0 0;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.35);
}

.demo-nav {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
}

.demo-tab {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 14px;
  margin-bottom: 6px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.demo-tab:hover {
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.8);
}

.demo-tab.active {
  background: rgba(124, 58, 237, 0.15);
  color: #a78bfa;
  box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.2);
}

.demo-tab-id {
  display: grid;
  place-items: center;
  width: 36px;
  height: 28px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.demo-tab.active .demo-tab-id {
  background: rgba(124, 58, 237, 0.2);
  color: #a78bfa;
}

.demo-tab-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.demo-footer {
  padding: 14px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.25);
}

/* ===== 主区域 ===== */
.demo-stage {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  background: #0f0f1a;
}

.demo-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.demo-current {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
}

.demo-current strong {
  color: #fff;
  font-weight: 700;
}

.demo-open {
  font-size: 13px;
  font-weight: 600;
  color: #a78bfa;
  text-decoration: none;
  transition: color 0.2s;
}

.demo-open:hover {
  color: #c4b5fd;
}

.demo-frame-wrap {
  flex: 1;
  min-height: 0;
  padding: 20px 24px 24px;
}

.demo-iframe {
  width: 100%;
  height: 100%;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: #000;
}

/* ===== 响应式 ===== */
@media (max-width: 900px) {
  .demo-sidebar {
    width: 200px;
    min-width: 200px;
  }
  .demo-tab-name {
    display: none;
  }
}

@media (max-width: 600px) {
  .demo-root {
    flex-direction: column;
  }
  .demo-sidebar {
    width: 100%;
    min-width: 0;
    height: auto;
    max-height: 180px;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .demo-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 10px;
  }
  .demo-tab {
    width: auto;
    margin-bottom: 0;
  }
  .demo-tab-name {
    display: none;
  }
}
</style>
