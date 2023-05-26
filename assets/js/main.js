'use strict';

const urlParams = h5Utils.getUrlParams();
const CS = {
  keyword: urlParams.d || '',
  type: urlParams.type || 'all',
  el: {
    searchBar: document.getElementById('searchBar'),
    btnGroup: document.getElementById('btnGroup'),
    searchInput: document.getElementById('search'),
    total: document.getElementById('total'),
    siteList: document.getElementById('siteList'),
    backToTo: document.querySelector('.scroll-fixed'),
  },
  allList: [],
  info: {
    recommend: [],
    needKey: [],
    needPay: [],
    needPwd: [],
    needVPN: [],
    needVerify: [],
    invalid: [],
  },
};
const typeKeys = Object.keys(CS.info);

function htmlEscape(str) {
  return String(str || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function getSiteList() {
  return fetch('https://ghp.quickso.cn/https://raw.githubusercontent.com/muzihuaner/chatgpt-sites/main/site-info.json')
    .then((d) => d.json())
    .then((d) => {
      if (d.siteInfo) {
        const list = Object.entries(d.siteInfo)
          .filter((d) => !d[1].hide)
          .sort((a, b) => {
            for (const key of ['invalid', 'needVerify', 'needVPN', 'needPwd', 'needPay', 'needKey']) {
              if ('needVerify' == key) {
                if (a[1].needVerify > 2 || b[1].needVerify > 2) return a[1].needVerify > 2 ? 1 : -1;
              } else if (a[1][key] !== b[1][key]) return a[1][key] ? 1 : -1;
            }

            if (a[1].star !== b[1].star) return (b[1].star || 1) - (a[1].star || 1);

            return a[0] > b[0] ? 1 : -1;
          });

        // format
        for (const [url, item] of list) {
          Object.entries(item).forEach(([key, val]) => {
            if (val && typeof val === 'string') item[key] = htmlEscape(val);
          });

          item.url = url;
          if (!item.title) item.title = url.replace(/https?:\/\//, '');
          if (!item.desc && !item.errmsg) item.desc = url;

          let typed = 0;
          typeKeys.forEach((key) => {
            if (item[key]) {
              if (key === 'needVerify' && item.needVerify < 1) return;

              CS.info[key].push(item);
              typed = 1;
            }
          });

          if (!typed) {
            item.recommend = 1;
            CS.info.recommend.push(item);
          }

          setPrefixAndIcon(item);
        }

        CS.alllist = list.map((d) => d[1]);
        return list;
      }
    });
}

function setPrefixAndIcon(info) {
  let prefix = '';

  if (info.invalid) prefix = '❌' + (typeof info.invalid === 'string' ? info.invalid : '');
  else if (info.needVerify > 2) prefix += '❓';

  if (info.star && info.star > 0) prefix += '⭐'.repeat(Math.min(3, info.star));
  else if (info.star == 0) prefix += '⛔';

  if (info.needPwd) prefix += '🔒';
  if (info.needPay) prefix += '💰';
  if (info.needKey) prefix += '🔑';
  if (info.needVPN) prefix += '🚀';

  // cls、icon
  if (info.recommend) {
    info.cls = 'item-green';
    if (!info.icon) info.icon = 'fa-star';
  } else if (info.invalid) {
    info.cls = 'item-red';
    if (!info.icon) info.icon = 'fa-solid fa-xmark';
  } else if (info.needVerify > 0) {
    info.cls = 'item-purple';
    if (!info.icon) info.icon = 'fa-regular fa-circle-question';
  } else if (info.needPwd) {
    info.cls = 'item-primary';
    if (!info.icon) info.icon = 'fa-solid fa-unlock-keyhole';
  } else if (info.needPay) {
    info.cls = 'item-blue';
    if (!info.icon) info.icon = 'fa-brands fa-amazon-pay';
  } else if (info.needKey) {
    info.cls = 'item-pink';
    if (!info.icon) info.icon = 'fa-solid fa-key';
  } else if (info.needVPN) {
    info.cls = 'item-orange';
    if (!info.icon) info.icon = 'fa-solid fa-paper-plane';
  } else {
    info.cls = 'item-purple';
    if (!info.icon) info.icon = 'fa-regular fa-star';
  }

  info.prefix = prefix;
  if (!info.star) info.star = 1;
}

function updateElList(type = CS.type) {
  const htmlList = [];
  const list = CS.info[type] || CS.alllist;

  list.forEach((item, idx) => {
    if (CS.keyword) {
      const ok = [item.url, item.desc, item.title, item.errmsg].some((d) => d && d.includes(CS.keyword));
      if (!ok) return;
    }

    htmlList.push(` <div class="item ${item.cls || 'item-green'} col" title="${item.desc || item.title}">
		<div class="item-inner">
			<div class="icon-holder">
				<i class="icon fa ${item.icon || 'paper-plane'}"></i>
			</div>
			<h3 class="title d-flex align-items-center">${item.title}</h3>
			<p class="intro">${item.prefix || '⭐'} ${item.desc || ''} <span class="errmsg text-danger">${item.errmsg || ''}</span></p>
			<a class="link" href="${item.url}" target="_blank"><span>${idx + 1}</span></a>
		</div>
	</div>`);
  });

  CS.el.total.innerHTML = htmlList.length;
  CS.el.siteList.innerHTML = htmlList.join('');
}

function onInputChange(event) {
  const keyword = event.target.value.trim();
  console.log(keyword, event)
  if (keyword !== CS.keyword) {
    CS.keyword = keyword;
    updateElList();

    const url = new URL(location.href);
    if (!keyword) url.searchParams.delete('w');
    else url.searchParams.set('w', keyword);
    history.pushState(null, null, url.href);
  }
}

async function init() {
  (window.slotbydup = window.slotbydup || []).push({
      id: document.body.clientWidth < 1000 ?  'u6898755' : 'u6899146', // 'u6899145',
      container: "_e12r7e6qdvu",
      async: true
  });
  h5Utils.loadJsOrCss(`//cpro.baidustatic.com/cpro/ui/xx.js`);

  await getSiteList();
  updateElList();

  CS.el.searchInput.addEventListener('change', onInputChange, false);
  CS.el.searchInput.addEventListener('input', onInputChange, false);
  CS.el.btnGroup.addEventListener(
    'click',
    () => {
      const type = document.querySelector('input[name=btnradio]:checked').getAttribute('id');
      if (type && CS.type !== type) {
        CS.type = type;
        updateElList(type);

        const url = new URL(location.href);
        if (type === 'type') url.searchParams.delete('type');
        else url.searchParams.set('type', type);
        history.pushState(null, null, url.href);
      }
    },
    false
  );

  const searchTop = CS.el.searchBar.getBoundingClientRect().top;

  window.onscroll = function () {
    const maxtop = Math.max(document.body.scrollTop, document.documentElement.scrollTop);
    if (maxtop > searchTop) {
      CS.el.backToTo.style.display = 'flex';
      CS.el.searchBar.classList.add('search-bar__fixed');
    } else {
      CS.el.backToTo.style.display = 'none';
      CS.el.searchBar.classList.remove('search-bar__fixed');
    }
  };

  document.querySelector('.scroll-fixed .scroll-bottom').addEventListener(
    'click',
    (ev) => {
      ev.preventDefault();
      window.scrollBy(0, document.body.scrollHeight);
    },
    false
  );
}

init();
