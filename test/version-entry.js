import { createApp } from 'vue';

const v = new URLSearchParams(location.search).get('v') || 'v5';

async function load() {
  let App;

  // 根据版本动态加载组件和样式，Vite 可以分析这些明确路径
  if (v === 'v1') {
    const mod = await import('./App.vue');
    await import('./style.css');
    App = mod.default;
  } else if (v === 'v2') {
    const mod = await import('./App-v2.vue');
    await import('./style-v2.css');
    App = mod.default;
  } else if (v === 'v3') {
    const mod = await import('./App-v3.vue');
    await import('./style-v3.css');
    App = mod.default;
  } else if (v === 'v4') {
    const mod = await import('./App-v4.vue');
    await import('./style-v4.css');
    App = mod.default;
  } else if (v === 'v5') {
    const mod = await import('./App-v5.vue');
    await import('./style-v5.css');
    App = mod.default;
  } else if (v === 'v6') {
    const mod = await import('./App-v6.vue');
    await import('./style-v6.css');
    App = mod.default;
  } else if (v === 'v7') {
    const mod = await import('./App-v7.vue');
    await import('./style-v7.css');
    App = mod.default;
  } else if (v === 'v8') {
    const mod = await import('./App-v8.vue');
    await import('./style-v8.css');
    App = mod.default;
  } else if (v === 'v9') {
    const mod = await import('./App-v9.vue');
    await import('./style-v9.css');
    App = mod.default;
  } else if (v === 'v10') {
    const mod = await import('./App-v10.vue');
    await import('./style-v10.css');
    App = mod.default;
  } else if (v === 'v11') {
    const mod = await import('./App-v11.vue');
    await import('./style-v11.css');
    App = mod.default;
  } else if (v === 'v12') {
    const mod = await import('./App-v12.vue');
    await import('./style-v12.css');
    App = mod.default;
  } else if (v === 'v13') {
    const mod = await import('./App-v13.vue');
    await import('./style-v13.css');
    App = mod.default;
  } else if (v === 'v14') {
    const mod = await import('./App-v14.vue');
    await import('./style-v14.css');
    App = mod.default;
  } else {
    // 默认 v5
    const mod = await import('./App-v5.vue');
    await import('./style-v5.css');
    App = mod.default;
  }

  createApp(App).mount('#app');
}

load();
