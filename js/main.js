'use strict';

function setMenu(isOpen) {
  document.getElementById('global-nav').classList.toggle('active', isOpen);
  var btn = document.querySelector('.menu-toggle');
  btn.setAttribute('aria-expanded', String(isOpen));
  btn.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
}

function toggleMenu() {
  setMenu(!document.getElementById('global-nav').classList.contains('active'));
}

function closeMenu() {
  setMenu(false);
}

// 次回の開催情報を表示する
// data/next-event.json は GitHub Actions が connpass のフィードから毎日更新している
(function showNextEvent() {
  var week = ['日', '月', '火', '水', '木', '金', '土'];

  function pad(n) {
    return (n < 10 ? '0' : '') + n;
  }

  // "2026-11-14T13:30:00+09:00" を日本時間として読み取る（閲覧者のタイムゾーンに左右されないように）
  function parseJst(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso || '');
    if (!m) return null;
    return { y: +m[1], mo: +m[2], d: +m[3], h: +m[4], mi: +m[5] };
  }

  function render(ev) {
    var start = parseJst(ev.start);
    var end = parseJst(ev.end);
    if (!start) return;

    // 終了時刻を過ぎていたら表示しない（JSONの更新待ちの間など）
    var endTime = new Date(ev.end || ev.start).getTime();
    if (isNaN(endTime) || endTime < Date.now()) return;

    var dow = week[new Date(Date.UTC(start.y, start.mo - 1, start.d)).getUTCDay()];
    var time = pad(start.h) + ':' + pad(start.mi) + '〜' + (end ? pad(end.h) + ':' + pad(end.mi) : '');

    document.getElementById('next-label').textContent = ev.number ? '次回の開催（#' + ev.number + '）' : '次回の開催';
    document.getElementById('next-date').textContent = start.y + '年' + start.mo + '月' + start.d + '日（' + dow + '）';
    document.getElementById('next-time').textContent = time;
    document.getElementById('next-event').classList.add('is-loaded');

    if (/^https:\/\/coderdojoiida\.connpass\.com\//.test(ev.url || '')) {
      document.getElementById('next-event').href = ev.url;
      document.getElementById('hero-apply').href = ev.url;
    }
  }

  if (!window.fetch) return;
  fetch('data/next-event.json', { cache: 'no-cache' })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (data) { if (data && data.next) render(data.next); })
    .catch(function () { /* 取得できなければ「connpassでご確認ください」のまま */ });
})();
