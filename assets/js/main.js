'use strict';

const urlParams = h5Utils.getUrlParams();
const CS = {
  keyword: urlParams.d || '',
  type: decodeURIComponent(urlParams.type || '全部'),
  el: {
    searchBar: document.getElementById('searchBar'),
    btnGroup: document.getElementById('btnGroup'),
    searchInput: document.getElementById('search'),
    total: document.getElementById('total'),
    siteList: document.getElementById('siteList'),
    backToTo: document.querySelector('.scroll-fixed'),
  },
  allList: [],
  /** 分类信息 */
  typeInfo: {
    全部: '',
    推荐: [],
    get 我的收藏() {
      return [...fav.list]
        .reverse()
        .map(d => CS.allList.find(m => m.url === d))
        .filter(Boolean);
    },
  },
};
const fav = {
  list: new Set(), // url set
  load() {
    try {
      const s = localStorage.getItem('CC_FAV');
      if (s) fav.list = new Set(JSON.parse(s));
    } catch (_e) {
      fav.list = new Set();
    }
    fav.render();
  },
  add(url, $el) {
    const item = CS.allList.find(d => d.url === url);
    // console.log('fav-add', url, item);
    if (item && !fav.list.has(url)) {
      fav.list.add(url);
      fav.render('add', $el);
      fav.save();
    }
  },
  remove(url, $el) {
    if (fav.list.delete(url)) {
      fav.render('remove', $el);
      fav.save();
    }
  },
  save() {
    localStorage.setItem('CC_FAV', JSON.stringify([...fav.list]));
  },
  render(action, $el) {
    const type = document.querySelector('input[name=btnradio]:checked')?.getAttribute('id');

    if (String(type).includes('收藏')) {
      if (action === 'remove' && $el) {
        $el.parents('.item').fadeOut(500);
      } else updateElList(type);
    }
  },
};

function htmlEscape(str) {
  return String(str || '')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getSiteList() {
  return fetch('./index.json')
    .then(d => d.json())
    .then(d => {
      if (d.siteInfo) {
        const list = Object.entries(d.siteInfo)
          .filter(d => !d[1].hide)
          .sort((a, b) => {
            for (const key of ['invalid', 'needVerify', 'needVPN', 'needPwd', 'needPay', 'needKey']) {
              if ('needVerify' == key) {
                if (a[1].needVerify > 2 || b[1].needVerify > 2) return a[1].needVerify > 2 ? 1 : -1;
              } else if (a[1][key] !== b[1][key]) return a[1][key] ? 1 : -1;
            }

            if (a[1].star !== b[1].star) return (b[1].star || 1) - (a[1].star || 1);
            // sort 越小越靠前
            if (a[1].sort !== b[1].sort) return (a[1].sort || 1) - (b[1].sort || 1);

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

          if (!item.type) item.type = ['AI 聊天对话'];
          if (!Array.isArray(item.type)) item.type = [item.type];
          if (item.star >= 3 && !item.type.includes('推荐')) item.type.push('推荐');

          // if (null == item.icon && !item.needVPN) item.icon = `https://www.favicon.vip/get.php?url=${encodeURI(item.url)}`;
          if (null == item.icon && !item.needVPN) item.icon = `https://x.lzw.me/iapi/favicon/?url=${encodeURI(item.url)}`;

          item.type.forEach(t => {
            if (!CS.typeInfo[t]) CS.typeInfo[t] = [];
            CS.typeInfo[t].push(item);
          });

          setPrefixAndFaIcon(item);
        }

        CS.allList = list.map(d => d[1]);
        return list;
      }
    });
}

function setPrefixAndFaIcon(info) {
  let prefix = '';

  if (info.invalid) prefix = '❌' + (typeof info.invalid === 'string' ? info.invalid : '');
  else if (info.needVerify > 2) prefix += '❓';

  if (info.star && info.star > 0) prefix += '⭐'.repeat(Math.min(3, info.star));
  else if (info.star == 0) prefix += '⛔';

  if (info.needLogin) prefix += '🧑‍💻';
  if (info.needPwd) prefix += '🔒';
  if (info.needPay) prefix += '💰';
  if (info.needKey) prefix += '🔑';
  if (info.needVPN) prefix += '🚀';

  if (!info.fa) {
    if (info.source === 'sponsor') info.fa = 'fa-handshake';
    if (info.source === 'sponsor') info.fa = 'fa-solid fa-rectangle-ad';
  }

  // cls、fa-icon
  if (info.recommend) {
    info.cls = 'item-green';
    if (!info.fa) info.fa = 'fa-star';
  } else if (info.invalid) {
    info.cls = 'item-red';
    if (!info.fa) info.fa = 'fa-solid fa-xmark';
  } else if (info.needVerify > 0) {
    info.cls = 'item-purple';
    if (!info.fa) info.fa = 'fa-regular fa-circle-question';
  } else if (info.needPwd) {
    info.cls = 'item-primary';
    if (!info.fa) info.fa = 'fa-solid fa-unlock-keyhole';
  } else if (info.needPay) {
    info.cls = 'item-blue';
    if (!info.fa) info.fa = 'fa-brands fa-amazon-pay';
  } else if (info.needKey) {
    info.cls = 'item-pink';
    if (!info.fa) info.fa = 'fa-solid fa-key';
  } else if (info.needVPN) {
    info.cls = 'item-orange';
    if (!info.fa) info.fa = 'fa-solid fa-paper-plane';
  } else {
    info.cls = 'item-green';
    if (!info.fa) info.fa = 'fa-regular fa-star';
  }

  info.prefix = prefix;
  if (!info.star) info.star = 1;
}

function updateElList(type = CS.type) {
  const htmlList = [];
  const list = CS.typeInfo[type] || CS.allList;

  list.forEach((item, idx) => {
    if (CS.keyword) {
      const ok = [item.url, item.desc, item.title, item.errmsg].some(d => d && d.includes(CS.keyword));
      if (!ok) return;
    }

    htmlList.push(` <div class="item ${item.cls || 'item-green'} col" title="${item.desc || item.title}">
		<div class="item-inner">
			<div class="icon-holder">${
        String(item.icon).includes('/') ? `<img src="${item.icon}" />` : `<i class="icon fa ${item.fa || 'paper-plane'}"></i>`
      }
			</div>
			<h3 class="title d-flex align-items-center">${item.title}</h3>
			<p class="intro">${item.desc || ''} <span class="errmsg text-danger">${item.errmsg || ''}</span></p>
			<a class="link" href="${item.url}" target="_blank"><span>${idx + 1}</span></a>
      <span class="star-icon">${'<i class="fa-regular fa-thumbs-up"></i>'.repeat(item.star || 1)}</span>
      <span class="rounded-circle fav-icon" data-url="${item.url}" title="收藏">
        ${fav.list.has(item.url) ? '<i class="fa-solid fa-heart"></i>' : `<i class="fa-regular fa-heart"></i>`}
      </button>
		</div>
	</div>`);
  });

  CS.el.total.innerHTML = htmlList.length;
  CS.el.siteList.innerHTML = htmlList.join('');
}

function onInputChange(event) {
  const keyword = event.target.value.trim();
  console.log(keyword, event);
  if (keyword !== CS.keyword) {
    CS.keyword = keyword;
    updateElList();

    const url = new URL(location.href);
    if (!keyword) url.searchParams.delete('w');
    else url.searchParams.set('w', keyword);
    history.pushState(null, null, url.href);
  }
}

function initEvents() {
  $(document).on('click', '.fav-icon', ev => {
    const $el = $(ev.currentTarget);
    const url = $el.data('url');
    if (url) {
      if (fav.list.has(url)) {
        $el.html('<i class="fa-regular fa-heart"></i>');
        fav.remove(url, $el);
      } else {
        $el.html('<i class="fa-solid fa-heart"></i>');
        fav.add(url, $el);
      }
    }
  });

  CS.el.searchInput.addEventListener('change', onInputChange, false);
  CS.el.searchInput.addEventListener('input', onInputChange, false);
  CS.el.btnGroup.addEventListener(
    'click',
    () => {
      const type = document.querySelector('input[name=btnradio]:checked')?.getAttribute('id');
      console.log(type);
      if (type && CS.type !== type) {
        CS.type = type;
        updateElList(type);

        const url = new URL(location.href);
        if (type === 'type') url.searchParams.delete('type');
        else url.searchParams.set('type', encodeURIComponent(type));
        history.pushState(null, null, url.href);
      }
    },
    false
  );

  const searchTop = CS.el.searchBar.getBoundingClientRect().top;

  let timer;
  window.onscroll = function () {
    clearTimeout(timer);
    setTimeout(() => {
      const maxtop = Math.max(document.body.scrollTop, document.documentElement.scrollTop);
      const wrapperHeight = document.querySelector('.page-wrapper').clientHeight;

      if (maxtop > searchTop && wrapperHeight > 2000) {
        if (CS.el.backToTo.style.display === 'none') {
          CS.el.backToTo.style.display = 'flex';
          CS.el.searchBar.classList.add('search-bar__fixed');
        }
      } else if (CS.el.backToTo.style.display !== 'none') {
        CS.el.backToTo.style.display = 'none';
        CS.el.searchBar.classList.remove('search-bar__fixed');
      }
    }, 50);
  };

  document.querySelector('.scroll-fixed .scroll-bottom').addEventListener(
    'click',
    ev => {
      ev.preventDefault();
      window.scrollBy(0, document.body.scrollHeight);
    },
    false
  );
}

async function init() {
  // (window.slotbydup = window.slotbydup || []).push({
  //     id: document.body.clientWidth < 1000 ?  'u6898755' : 'u6899146', // 'u6899145',
  //     container: "_e12r7e6qdvu",
  //     async: true
  // });
  // h5Utils.loadJsOrCss(`//cpro.baidustatic.com/cpro/ui/cm.js`);

  initEvents();
  await getSiteList();

  const types = Object.keys(CS.typeInfo);
  const html = types
    .map(
      d => `<input type="radio" class="btn-check" name="btnradio" id="${d}"><label class="btn btn-outline-primary" for="${d}">${d}</label>`
    )
    .join('');
  CS.el.btnGroup.innerHTML = html;

  if (!(CS.type in CS.typeInfo)) CS.type = '全部';
  document.querySelector(`input[id="${CS.type}"]`)?.setAttribute('checked', true);
  fav.load();
  updateElList();
}

init();
