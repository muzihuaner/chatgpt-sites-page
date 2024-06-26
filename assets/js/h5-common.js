!(function () {
  const isDev = ['localhost', '127.0.0', '192.168.'].some(d => location.host.includes(d));
  const inited = {
    comm: false,
    bdtj: isDev,
    iosDisableScale: false,
  };

  const h5Utils = {
    config: {
      h5List: [
        // url, title, desc, type
        ['/', '官方博客', '志文工作室博客', 'lzwme'],
        ['/v', '福利短视频', '小姐姐福利短视频在线看', 'h5'],
        ['/pages/djt', '毒鸡汤', '干了这碗鸡汤!', 'h5'],
        ['/x/mikutap', 'Mikutap（初音未来版）', '初音未来二次元音乐解压娱乐应用', 'h5'],
        ['/x/relax', '白噪音促眠', '白噪音促眠在线播放网页版', 'h5'],
        ['/x/jtcs', '今天吃啥呀？', '今天吃啥呀？再也不用为今天吃什么发愁了', 'h5'],
        ['/x/dzmy', '电子木鱼网页版', '在线电子木鱼', 'h5'],
        ['/x/screentest', '在线屏幕测试', '', 'tool'],
        ['/x/random-password', '随机密码生成器', '随机密码生成器网页版', 'tool'],
        ['/x/163musichot', '网易云音乐热评墙', '网易云热评墙，热评音乐在线随心听!', 'h5'],
        ['/pages/games', 'H5小游戏集合', '收集的几十款好玩又解压的H5小游戏', 'game'],
        ['/x/games/200', '200+微信H5小游戏', '收集的上百款款好玩又解压的H5小游戏', 'game'],
        ['/x/v-player', '影视搜索智能解析', '电影、电视剧在线搜索与观看', 'tool'],
        ['/x/vip', 'VIP视频解析免费看', '支持所有视频网站VIP视频免费在线解析播放', 'tool'],
        ['/x/m3u8-player', 'M3U8在线播放器', 'tool'],
        ['/x/m3u8-downloader', 'm3u8视频在线下载工具', 'm3u8视频免费在线下载工具', 'tool'],
        ['/x/audio-converter', '音频文件在线转换工具', ''],
      ],
    },
    getUrlParams(search = location.search) {
      const params = {};
      const paramsSplit = search
        .replace(/^[^\?]*\?/i, '')
        .split(/&/)
        .filter(d => d.trim());

      if (paramsSplit.length > 0) {
        paramsSplit.forEach(function (item) {
          const list = item.split('=').map(d => decodeURIComponent(d));
          const key = list.splice(0, 1);
          const value = list.join('=');

          if (params[key]) {
            if (!Array.isArray(params[key])) params[key] = [params[key]];
            params[key].push(value);
          } else {
            params[key] = value;
          }
        });
      }

      return params;
    },
    setRandomBodyBg(el = document.body) {
      if (el) {
        const bg = '//lzw.me/x/iapi/bing/api.php?n=8&idx=' + Math.ceil(Math.random() * 7);
        if (el === 'blur') {
          const id = 'bodyBefore';
          const styleEl = document.getElementById(id);
          if (styleEl) styleEl.remove();
          setTimeout(() => {
            document.head.insertAdjacentHTML(
              'beforeend',
              [
                `<style id="${id}">body:before{`,
                `content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%;`,
                `background: transparent url(https://lzw.me/x/iapi/bing/api.php?n=10) center/cover no-repeat;`,
                `filter: blur(7px); z-index: -1; background-attachment: fixed;`,
                `}</style>`,
              ].join('')
            );
          }, 0);
        } else if (el.setAttribute) {
          el.setAttribute('style', `background: transparent url(${bg}) center/cover no-repeat fixed`);
        }
      }
    },
    loadJsOrCss(urls = [], options = {}) {
      if (typeof urls == 'string') urls = [urls];
      const list = [];
      for (const url of urls) {
        const isCss = url.includes('.css');
        const isLoaded = document.querySelector(isCss ? `link[href="${url}"]` : `script[src="${url}"]`);
        if (isLoaded) continue;

        const el = document.createElement(isCss ? 'link' : 'script');
        if (isCss) {
          el.rel = 'stylesheet';
          el.href = url;
        } else {
          el.src = url;
          el.type = options.type || 'text/javascript';
          if (options.crossOrigin) el.crossOrigin = options.crossOrigin;
          if (options.async) el.async = true;
          if (options.defer) el.defer = true;
        }

        list.push(
          new Promise(rs => {
            el.onload = () => rs();
            setTimeout(() => rs(), 5_000);
            document.querySelector('head').append(el);
          })
        );
      }

      return Promise.allSettled(list);
    },
    loadBDLianmeng(force) {
      if (force || window.slotbydup) {
        this.loadJsOrCss(`//cpro.baidustatic.com/cpro/ui/cm.js`);
      }
    },
    loadAdsense() {
      if (window.adsbygoogle == 0) return;

      const opts = { async: true, crossOrigin: 'anonymous' };
      h5Utils.loadJsOrCss('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2830518914778771', opts);
    },
    /** {@see https://sweetalert2.github.io/} */
    alert(msg, params) {
      if (typeof msg === 'object') params = msg;
      else params = Object.assign({ text: msg }, params);

      return this.loadJsOrCss([
        'https://npm.elemecdn.com/sweetalert2@11/dist/sweetalert2.min.css',
        'https://npm.elemecdn.com/sweetalert2@11/dist/sweetalert2.all.min.js',
      ]).then(() => Swal.fire(Object.assign({ icon: 'info', showConfirmButton: false }, params)));
    },
    toast(msg, p) {
      this.alert(Object.assign({ toast: true, position: 'top-end', text: msg, icon: 'success', timer: 2000, timerProgressBar: true }, p));
    },
    copy(msg) {
      const copy = ev => {
        ev.preventDefault();
        msg = typeof msg === 'string' ? msg : JSON.stringify(msg);
        ev.clipboardData.setData('text/plain', msg);
      };

      document.addEventListener('copy', copy);
      const ok = document.execCommand('copy');
      document.removeEventListener('copy', copy);
      return ok;
    },
  };

  function initTJ(id) {
    if (inited.bdtj) return;
    inited.bdtj = true;

    const src = 'https://hm.baidu.com/hm.js?' + (id || '1c720b7315e37bbf488afd28e60002bf');
    if (!window._hmt) window._hmt = [];
    // var hm = document.createElement('script');
    // var s = document.getElementsByTagName('script')[0];
    // s.src = src;
    // s.parentNode.insertBefore(hm, s);
    h5Utils.loadJsOrCss(src);
  }

  /** ios 禁用缩放 */
  function iosDisableScale() {
    if (inited.iosDisableScale) return;
    inited.iosDisableScale = true;

    if (/iPad｜Macintosh|iPhone OS/i.test(navigator.userAgent)) {
      document.addEventListener('gesturestart', function (event) {
        event.preventDefault();
      });
    }
  }

  function setCurrentYear(id = 'currentYear') {
    const cy = document.getElementById(id);
    if (cy) cy.innerText = new Date().getFullYear();
  }

  function loadCommCss() {
    return h5Utils.loadJsOrCss(`https://lzw.me/x/lib/utils/h5-common.css?v=1`); // ${new Date().toISOString().slice(0, 10)}
  }

  // === init ====
  function h5CommInit(types, isMergeDefault = true) {
    const defaultTypes = ['disableScale', 'bdtj'];

    if (!types) types = defaultTypes;
    else if (isMergeDefault) types = defaultTypes.concat(types);

    setCurrentYear();

    if (types.includes('bdtj')) initTJ();
    if (types.includes('disableScale')) iosDisableScale();
    if (types.includes('bg')) h5Utils.setRandomBodyBg();
    if (types.includes('css')) loadCommCss();

    h5Utils.loadAdsense();

    inited.comm = true;
  }

  function init() {
    window.h5Utils = h5Utils;
    window.h5CommInit = h5CommInit;

    setTimeout(() => {
      if (!inited.comm) h5CommInit();
    }, 1000);
  }

  init();
})();
