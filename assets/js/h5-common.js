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
        ['/', '官方', '欢哥科技', 'l'],
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
    loadJsOrCss(urls = []) {
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
          // el.type = 'module';
        }

        list.push(
          new Promise(rs => {
            el.onload = () => rs();
            setTimeout(() => rs(), 10_000);
            document.querySelector('head').append(el);
          })
        );
      }

      return Promise.allSettled(list);
    },
    loadBDLianmeng(force) {
      if (force || window.slotbydup) {
        this.loadJsOrCss(`//cpro.baidustatic.com/cpro/ui/xx.js`);
      }
    },
    /** {@see https://sweetalert2.github.io/} */
    alert(...args) {
      return this.loadJsOrCss([
        'https://npm.elemecdn.com/sweetalert2@11/dist/sweetalert2.min.css',
        'https://npm.elemecdn.com/sweetalert2@11/dist/sweetalert2.all.min.js',
      ]).then(() => Swal.fire(...args));
    },
  };

  

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

  function setCurrentYear() {
    const cy = document.getElementById('currentYear');
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

 
    if (types.includes('disableScale')) iosDisableScale();
    if (types.includes('bg')) h5Utils.setRandomBodyBg();
    if (types.includes('css')) loadCommCss();

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
