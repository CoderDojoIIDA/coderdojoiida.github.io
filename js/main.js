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

// 次回の開催日（毎月第二土曜日）を表示する
(function showNextEvent() {
  function secondSaturday(year, month) {
    var first = new Date(year, month, 1);
    var offset = (6 - first.getDay() + 7) % 7; // 最初の土曜日までの日数
    return new Date(year, month, 1 + offset + 7);
  }

  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var next = secondSaturday(today.getFullYear(), today.getMonth());
  if (next < today) {
    next = secondSaturday(today.getFullYear(), today.getMonth() + 1);
  }

  var week = ['日', '月', '火', '水', '木', '金', '土'];
  var text = next.getFullYear() + '年' + (next.getMonth() + 1) + '月' + next.getDate() + '日（' + week[next.getDay()] + '）';
  var isToday = next.getTime() === today.getTime();

  var box = document.getElementById('next-event');
  document.getElementById('next-date').textContent = isToday ? '本日 ' + text : text;
  box.hidden = false;
})();
