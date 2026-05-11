/* ============================================================
   Mr. Kim's CAFE — Meeting Room Calendar + Booking
   Public globals: calNav, calSelectDay, selectSlot, submitBooking, renderCal
   Depends on globals: showToast (from index.js)
   ============================================================ */
(function () {
  const DOW_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const DOW_AR = ['أحد','اثن','ثلا','أرب','خمس','جمع','سبت'];
  const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const TIME_SLOTS = ['09:00–11:00','11:00–13:00','13:00–15:00','15:00–17:00','17:00–19:00','19:00–21:00'];

  let calDate = new Date();
  let calSelected = null;
  let slotSelected = null;
  // Slot end hours (index matches TIME_SLOTS)
  const SLOT_END_HOURS = [11, 13, 15, 17, 19, 21];

  function calNav(delta) {
    calDate = new Date(calDate.getFullYear(), calDate.getMonth() + delta, 1);
    renderCal();
  }

  function renderCal() {
    const lang = document.getElementById('html-root').getAttribute('lang');
    const y = calDate.getFullYear();
    const m = calDate.getMonth();
    const today = new Date(); today.setHours(0,0,0,0);

    // Month label
    document.getElementById('cal-month-label').textContent =
      (lang === 'ar' ? MONTHS_AR[m] : MONTHS_EN[m]) + ' ' + y;

    // Days of week
    const dowEl = document.getElementById('cal-dow');
    dowEl.innerHTML = (lang === 'ar' ? DOW_AR : DOW_EN)
      .map(d => `<div class="cal-dow">${d}</div>`).join('');

    // Grid
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m+1, 0).getDate();
    const prevDays = new Date(y, m, 0).getDate();
    let html = '';

    // Prev month fill
    for (let i = firstDay - 1; i >= 0; i--) {
      html += `<button class="cal-day cal-day--outside" disabled>${prevDays - i}</button>`;
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, m, d);
      const isPast = date < today;
      const isToday = date.getTime() === today.getTime();
      const isSel = calSelected &&
        calSelected.getDate() === d && calSelected.getMonth() === m && calSelected.getFullYear() === y;
      let cls = 'cal-day';
      if (isPast) cls += ' cal-day--disabled';
      else if (isSel) cls += ' cal-day--selected';
      else if (isToday) cls += ' cal-day--today';
      const disabled = isPast ? 'disabled' : '';
      html += `<button class="${cls}" ${disabled} onclick="calSelectDay(${d},${m},${y})">${d}</button>`;
    }
    // Next month fill
    const total = firstDay + daysInMonth;
    const remain = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (let d = 1; d <= remain; d++) {
      html += `<button class="cal-day cal-day--outside" disabled>${d}</button>`;
    }
    document.getElementById('cal-days').innerHTML = html;
  }

  function calSelectDay(d, m, y) {
    calSelected = new Date(y, m, d);
    slotSelected = null;
    renderCal();
    document.getElementById('timeslot-wrap').style.display = '';
    document.getElementById('booking-form-wrap').style.display = 'none';
    fetchAndRenderSlots();
  }

  function calDateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  async function fetchAndRenderSlots() {
    if (!calSelected) return;
    const isoDate = calDateStr(calSelected);
    let bookedSet = new Set();
    try {
      const res = await fetch(`/api/meeting-reservations/availability?date=${isoDate}`);
      if (res.ok) {
        const data = await res.json();
        data.slots.forEach(s => { if (!s.available) bookedSet.add(s.slot); });
      }
    } catch (e) { console.warn('[meeting-availability] fetch failed', e); }
    renderSlots(bookedSet);
  }

  function renderSlots(bookedSet = new Set()) {
    if (!calSelected) return;
    const now = new Date();
    const isToday = calSelected.toDateString() === now.toDateString();
    const currentHour = now.getHours();
    const grid = document.getElementById('timeslot-grid');
    grid.innerHTML = TIME_SLOTS.map((slot, i) => {
      const isBooked = bookedSet.has(slot);
      const isPast = isToday && SLOT_END_HOURS[i] <= currentHour;
      const isSel = slotSelected === i;
      let cls = 'timeslot-btn';
      if (isBooked) cls += ' booked';
      else if (isPast) cls += ' past';
      else if (isSel) cls += ' selected';
      return `<button class="${cls}" onclick="selectSlot(${i},${isBooked},${isPast})">${slot}</button>`;
    }).join('');
  }

  function selectSlot(idx, isBooked, isPast) {
    const lang = document.getElementById('html-root').getAttribute('lang');
    if (isBooked) {
      showToast(lang === 'ar' ? '⚠️ هذا الوقت محجوز بالفعل' : '⚠️ This time slot is already booked');
      return;
    }
    if (isPast) {
      showToast(lang === 'ar' ? '⚠️ هذا الوقت قد مضى' : '⚠️ This time slot has already passed');
      return;
    }
    slotSelected = idx;
    fetchAndRenderSlots();
    const dateStr = calSelected.toLocaleDateString(lang === 'ar' ? 'ar-IQ' : 'en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric', numberingSystem: 'latn' });
    const info = document.getElementById('booking-selected-info');
    info.innerHTML = `📅 ${dateStr} &nbsp;·&nbsp; ⏰ ${TIME_SLOTS[idx]}`;
    document.getElementById('booking-form-wrap').style.display = '';
  }

  async function submitBooking() {
    const name = document.getElementById('book-name').value.trim();
    const phone = document.getElementById('book-phone').value.trim();
    const lang = document.getElementById('html-root').getAttribute('lang');
    if (!name) { showToast(lang === 'ar' ? '⚠️ أدخل اسمك' : '⚠️ Please enter your name'); return; }
    if (!phone) { showToast(lang === 'ar' ? '⚠️ أدخل رقم هاتفك' : '⚠️ Please enter your phone'); return; }

    const isoDate = calDateStr(calSelected);
    const slot = TIME_SLOTS[slotSelected];

    try {
      const res = await fetch('/api/meeting-reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, date: isoDate, slot })
      });
      if (!res.ok) throw new Error();
      showToast(lang === 'ar' ? '✅ تم إرسال الحجز!' : '✅ Booking sent!');
    } catch (e) {
      console.warn('[meeting-booking] submit failed', e);
      showToast(lang === 'ar' ? '⚠️ فشل إرسال الحجز' : '⚠️ Booking failed, please try again');
      return;
    }

    // Reset
    calSelected = null; slotSelected = null;
    document.getElementById('book-name').value = '';
    document.getElementById('book-phone').value = '';
    document.getElementById('timeslot-wrap').style.display = 'none';
    document.getElementById('booking-form-wrap').style.display = 'none';
    renderCal();
  }

  // Expose to global scope (inline onclick handlers + setLang in index.js)
  window.calNav = calNav;
  window.calSelectDay = calSelectDay;
  window.selectSlot = selectSlot;
  window.submitBooking = submitBooking;
  window.renderCal = renderCal;
})();
