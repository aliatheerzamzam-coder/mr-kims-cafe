/* ============================================================
   Mr. Kim's CAFE — Table Reservation
   Public globals: loadReserveSlots, selectResSlot, submitReservation,
                   resetReserveForm
   Depends on globals (defined in index.js): authHeader, showToast,
                                              prefillResContactIfLoggedIn
   ============================================================ */
(function () {
  let resSlotSelected = null;
  let resAreaSelected = null;

  function selectResArea(area, btn) {
    resAreaSelected = area;
    document.getElementById('res-table').value = area;
    document.querySelectorAll('.reserve-area-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  }

  function getResDateMin() {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }

  // Initialize date input min on first run
  (function initResDate() {
    const inp = document.getElementById('res-date');
    if (inp) inp.min = getResDateMin();
  })();

  async function loadReserveSlots() {
    const dateInput = document.getElementById('res-date');
    const date = dateInput.value;
    if (!date) return;
    const todayStr = getResDateMin();
    if (date < todayStr) {
      const isAr = document.getElementById('html-root').lang === 'ar';
      showToast(isAr ? 'لا يمكن حجز تاريخ في الماضي' : 'Cannot book a date in the past');
      dateInput.value = todayStr;
      return;
    }
    resSlotSelected = null;
    document.getElementById('res-slots-wrap').style.display = 'none';

    try {
      const res = await fetch(`/api/reservations/availability?date=${encodeURIComponent(date)}`);
      const data = await res.json();
      const grid = document.getElementById('res-slots');
      const isAr = document.getElementById('html-root').lang === 'ar';
      grid.innerHTML = data.slots.map(s => {
        const full = s.count >= 4;
        const disabled = full || s.is_past;
        const nextDayMark = s.is_next_day ? (isAr ? '<br><small>+يوم</small>' : '<br><small>+1d</small>') : '';
        let stateMark = '';
        if (full) stateMark = isAr ? '<br><small>ممتلئ</small>' : '<br><small>Full</small>';
        else if (s.is_past) stateMark = isAr ? '<br><small>مضى</small>' : '<br><small>Past</small>';
        return `<button class="reserve-time-btn" ${disabled ? 'disabled' : ''}
          onclick="selectResSlot('${s.time}', this)">
          ${s.time}${nextDayMark}${stateMark}
        </button>`;
      }).join('');
      document.getElementById('res-slots-wrap').style.display = 'block';
    } catch (e) { console.warn('[reserve-slots] fetch failed', e); }
  }

  function selectResSlot(time, btn) {
    resSlotSelected = time;
    document.querySelectorAll('.reserve-time-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  }

  async function submitReservation() {
    const date = document.getElementById('res-date').value;
    const party = document.getElementById('res-party').value;
    const name = document.getElementById('res-name').value.trim();
    const phone = document.getElementById('res-phone').value.trim();
    const notes = document.getElementById('res-notes').value.trim();
    const tableNum = document.getElementById('res-table').value.trim();
    const errEl = document.getElementById('res-error');
    const isAr = document.getElementById('html-root').lang === 'ar';
    errEl.textContent = '';

    if (!date) {
      errEl.textContent = isAr ? 'يرجى اختيار تاريخ' : 'Please select a date.';
      return;
    }
    if (!resSlotSelected) {
      errEl.textContent = isAr ? 'يرجى اختيار وقت' : 'Please select a time slot.';
      return;
    }
    if (!name) {
      errEl.textContent = isAr ? 'يرجى إدخال اسمك' : 'Please enter your name.';
      return;
    }
    if (!phone) {
      errEl.textContent = isAr ? 'يرجى إدخال رقم هاتفك' : 'Please enter your phone number.';
      return;
    }
    if (!resAreaSelected) {
      errEl.textContent = isAr ? 'يرجى اختيار المنطقة' : 'Please choose an area.';
      return;
    }

    const btn = document.getElementById('btn-reserve');
    btn.disabled = true;

    try {
      const headers = { 'Content-Type': 'application/json', ...authHeader() };
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers,
        // table_num must be the *area* code (floor_1 / floor_2 / study_room).
        // Any free-text table preference from #res-table is appended into notes
        // so the server's ALLOWED_AREAS validation accepts the request.
        body: JSON.stringify({
          date,
          time: resSlotSelected,
          party_size: Number(party),
          name,
          phone,
          notes: tableNum ? `${notes || ''} [table: ${tableNum}]`.trim() : notes,
          table_num: resAreaSelected,
        })
      });
      const data = await res.json();
      if (!res.ok) {
        errEl.textContent = data.error || (isAr ? 'فشل الحجز، حاول مجدداً' : 'Reservation failed, please try again.');
        btn.disabled = false;
        return;
      }
      // Show success
      document.getElementById('reserve-form-wrap').style.display = 'none';
      const successEl = document.getElementById('reserve-success');
      successEl.style.display = 'block';
      successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const timeLabel = resSlotSelected;
      document.getElementById('reserve-success-msg').innerHTML = isAr
        ? `${name} — ${date} الساعة ${timeLabel}<br>سنكون بانتظارك! 🫶`
        : `${name} — ${date} at ${timeLabel}<br>We'll be waiting for you! 🫶`;
    } catch (e) {
      console.warn('[submitReservation] failed', e);
      errEl.textContent = isAr ? 'خطأ في الاتصال، حاول مجدداً' : 'Connection error, please try again.';
      btn.disabled = false;
    }
  }

  function resetReserveForm() {
    document.getElementById('reserve-success').style.display = 'none';
    document.getElementById('reserve-form-wrap').style.display = 'block';
    document.getElementById('res-date').value = '';
    document.getElementById('res-slots-wrap').style.display = 'none';
    document.getElementById('res-name').value = '';
    document.getElementById('res-phone').value = '';
    document.getElementById('res-table').value = '';
    document.getElementById('res-notes').value = '';
    document.getElementById('res-error').textContent = '';
    document.querySelectorAll('.reserve-area-btn').forEach(b => b.classList.remove('selected'));
    resSlotSelected = null;
    resAreaSelected = null;
    document.getElementById('btn-reserve').disabled = false;
    if (typeof prefillResContactIfLoggedIn === 'function') prefillResContactIfLoggedIn();
  }

  // Expose to global scope (inline onclick handlers)
  window.loadReserveSlots = loadReserveSlots;
  window.selectResSlot = selectResSlot;
  window.selectResArea = selectResArea;
  window.submitReservation = submitReservation;
  window.resetReserveForm = resetReserveForm;
})();
