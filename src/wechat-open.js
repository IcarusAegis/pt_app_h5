function isWeChatBrowser() {
  return /MicroMessenger/i.test(window.navigator.userAgent || '');
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      if (window.wx) {
        resolve();
      }
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function fetchWechatConfig(configUrl) {
  const url = new URL(configUrl, window.location.href);
  url.searchParams.set('url', window.location.href.split('#')[0]);
  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });
  const body = await response.json();
  return body && body.data ? body.data : body;
}

export async function setupWechatOpenTag(config) {
  if (!isWeChatBrowser() || !config.miniProgramAppId || !config.wechatJsConfigUrl) {
    return false;
  }

  await loadScript('https://res.wx.qq.com/open/js/jweixin-1.6.0.js');
  const wxConfig = await fetchWechatConfig(config.wechatJsConfigUrl);
  await new Promise((resolve, reject) => {
    window.wx.config({
      ...wxConfig,
      jsApiList: wxConfig.jsApiList || [],
      openTagList: ['wx-open-launch-weapp'],
    });
    window.wx.ready(resolve);
    window.wx.error(reject);
  });
  return true;
}

export function renderLaunchOpenTag(host, appId, path) {
  if (!host || !appId || !path) {
    return;
  }
  const safeAppId = String(appId).replace(/"/g, '&quot;');
  const safePath = String(path).replace(/"/g, '&quot;');
  host.innerHTML = [
    `<wx-open-launch-weapp appid="${safeAppId}" path="${safePath}">`,
    '<script type="text/wxtag-template">',
    '<style>.launch-template{width:100%;height:48px;border:0;border-radius:8px;background:#0f766e;color:#fff;font-size:16px;font-weight:700;}</style>',
    '<button class="launch-template">打开小程序</button>',
    '</' + 'script>',
    '</wx-open-launch-weapp>',
  ].join('');
}
