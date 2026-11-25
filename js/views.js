(() => {
  const { state } = window.FinSmartData
  const { escapeHtml: esc, formatRupiah: rupiah, formatDate, currentMonthTransactions, sumTransactions, monthLabel, icon } = window.FinSmartUtils
  const titles = {
    dashboard: ['Ringkasan keuangan', 'Ringkasan keuangan pribadi, dimulai dari catatanmu.'],
    transactions: ['Transaksi', 'Semua pemasukan dan pengeluaranmu di satu tempat.'],
    budget: ['Rencana anggaran', 'Atur uang sesuai prioritasmu, bukan aturan orang lain.'],
    savings: ['Target tabungan', 'Sedikit demi sedikit, tujuanmu makin dekat.'],
    assistant: ['Teman finansialmu', 'Ngobrol soal uang, tanpa menghakimi.'],
  }
  const nav = [
    ['dashboard', 'Dashboard', 'dashboard'],
    ['transactions', 'Pemasukan & pengeluaran', 'wallet'],
    ['budget', 'Rencana anggaran', 'down'],
    ['savings', 'Target tabungan', 'piggy'],
    ['assistant', 'AI financial assistant', 'bot'],
  ]

  function sidebar() {
    return `<aside class="sidebar">
      <button class="brand" data-page="dashboard" aria-label="FINSMART, kembali ke dashboard">
        <span class="brand-mark">${icon('leaf', 19)}</span><span class="brand-name">fin<span>smart</span><small>PERSONAL FINANCE</small></span>
      </button>
      <div class="workspace-label">WORKSPACE</div>
      <nav class="main-nav" aria-label="Navigasi utama">${nav.map(([key, label, glyph]) => `<button class="nav-item ${state.page === key ? 'active' : ''}" data-page="${key}">${icon(glyph)}<span>${label}</span>${key === 'assistant' ? '<span class="new-indicator"></span>' : ''}</button>`).join('')}</nav>
      <div class="sidebar-note"><span class="note-icon">${icon('arrow', 17)}</span><div><strong>Pelan-pelan, ya.</strong><p>Keuangan sehat dibangun dari langkah kecil yang konsisten.</p></div></div>
      <div class="sidebar-bottom">
        <button class="nav-item muted-nav">${icon('sparkles')}<span>Pengaturan</span></button>
        <button class="nav-item muted-nav">${icon('info')}<span>Pusat bantuan</span></button>
        <button class="profile-button account-profile" data-action="${state.auth.status === 'guest' ? 'open-account' : 'signout'}" ${state.auth.busy ? 'disabled' : ''}><span class="avatar">${esc((state.auth.session?.user?.email || (state.auth.status === 'guest' ? 'T' : 'A')).slice(0, 1).toUpperCase())}</span><span class="profile-copy"><strong>${esc(state.auth.session?.user?.email || (state.auth.status === 'guest' ? 'Mode tamu' : 'Akun'))}</strong><small>${state.auth.status === 'guest' ? 'Data di perangkat ini' : 'Keluar dari akun'}</small></span><span class="profile-chevron">${icon(state.auth.status === 'guest' ? 'lock' : 'logout', 14)}</span></button>
        <div class="sidebar-footer">${icon('lock', 13)} ${state.auth.status === 'guest' ? 'Data hanya di perangkat ini' : 'Data tersimpan di akun ini'}</div>
      </div>
    </aside>`
  }

  function header() {
    const [title, subtitle] = titles[state.page]
    return `<header class="top-header">
      <div class="page-heading"><div class="breadcrumb">RUANG PRIBADI <span>/</span> <b>${esc(title.toUpperCase())}</b></div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>
      <div class="header-actions">
        <span class="period-button"><span class="period-dot"></span> Bulan ini</span>
        <button class="icon-button theme-toggle" data-action="theme" aria-label="Aktifkan tema ${state.theme === 'light' ? 'gelap' : 'terang'}">${icon(state.theme === 'light' ? 'moon' : 'sun')}</button>
        <button class="mobile-account-action" data-action="${state.auth.status === 'guest' ? 'open-account' : 'signout'}" aria-label="${state.auth.status === 'guest' ? 'Masuk atau daftar akun' : 'Keluar dari akun'}">${icon(state.auth.status === 'guest' ? 'lock' : 'logout', 16)}${state.auth.status === 'guest' ? 'Masuk' : 'Keluar'}</button>
        <button class="button button-primary header-add" data-action="new-transaction">${icon('plus', 17)} Catat transaksi</button>
      </div>
    </header>`
  }

  function recentTransactions(items, limit = 5, showActions = true) {
    const recent = [...items].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit)
    if (!recent.length) return '<p class="empty-copy">Belum ada transaksi. Catat yang pertama, yuk.</p>'
    return recent.map((item) => `<div class="transaction-row">
      <span class="transaction-icon ${item.type}">${icon(item.type === 'income' ? 'down' : 'up', 17)}</span>
      <span class="transaction-copy"><strong>${esc(item.category)}</strong><small>${esc(item.note || (item.type === 'income' ? 'Pemasukan' : 'Pengeluaran'))} · ${formatDate(item.date)}</small></span>
      <strong class="transaction-amount ${item.type}">${item.type === 'income' ? '+' : '−'}${rupiah(item.amount)}</strong>
      ${showActions ? `<button class="row-more" data-action="edit-transaction" data-id="${esc(item.id)}" aria-label="Ubah ${esc(item.category)}">${icon('pencil', 14)}</button><button class="row-more" data-action="delete-transaction" data-id="${esc(item.id)}" aria-label="Hapus ${esc(item.category)}">${icon('trash', 14)}</button>` : ''}
    </div>`).join('')
  }

  function dashboard() {
    const monthItems = currentMonthTransactions(state.transactions)
    const income = sumTransactions(monthItems, 'income')
    const expense = sumTransactions(monthItems, 'expense')
    const saved = state.goals.reduce((sum, goal) => sum + Number(goal.savedAmount), 0)
    const planned = state.budget.reduce((sum, item) => sum + Number(item.amount), 0)
    const expenses = monthItems.filter((item) => item.type === 'expense').reduce((result, item) => {
      result[item.category] = (result[item.category] || 0) + Number(item.amount)
      return result
    }, {})
    const categories = Object.entries(expenses).sort((a, b) => b[1] - a[1]).slice(0, 4)
    const maximum = Math.max(...categories.map(([, amount]) => amount), 1)
    const days = [1, 5, 9, 13, 17, 21, 25, 29]
    const series = (type) => days.map((day) => monthItems.filter((item) => item.type === type && Number(item.date.slice(-2)) <= day).reduce((sum, item) => sum + Number(item.amount), 0))
    const incomeSeries = series('income')
    const expenseSeries = series('expense')
    const highest = Math.max(...incomeSeries, ...expenseSeries, 1)
    const points = (values) => values.map((value, index) => `${(index / (values.length - 1)) * 100},${94 - (value / highest) * 78}`).join(' ')
    const month = new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(new Date())
    return `<div class="page-content dashboard-content">
      <div class="month-caption"><span class="month-mark"></span> Ikhtisar untuk <strong>${esc(monthLabel)}</strong><span class="caption-divider">·</span> semua terasa lebih jelas saat dicatat.</div>
      <section class="balance-banner"><div class="balance-copy">
        <div class="balance-label">${icon('wallet', 16)} SISA UANG BULAN INI</div>
        <div class="balance-amount">${rupiah(income - expense)}</div>
        <div class="balance-subtitle"><span class="balance-arrow">${icon('up', 13)}</span> Terus bergerak ke arah yang baik <span class="balance-separator">·</span> saldo dihitung dari transaksi bulan ini</div>
      </div><div class="balance-decoration" aria-hidden="true"><div class="decor-orbit orbit-one"></div><div class="decor-orbit orbit-two"></div><div class="decor-orbit orbit-three"></div><span class="decor-coin"><span>Rp</span></span></div><div class="balance-index"><span>01</span> / OVERVIEW</div></section>
      <div class="summary-grid">
        ${[
          ['down', 'PEMASUKAN', income, `Dari ${monthItems.filter((item) => item.type === 'income').length} catatan pemasukan`, 'income-icon', 'income-line-color'],
          ['up', 'PENGELUARAN', expense, `Dari ${monthItems.filter((item) => item.type === 'expense').length} catatan pengeluaran`, 'expense-icon', 'expense-line-color'],
          ['piggy', 'SUDAH DITABUNG', saved, `Terkumpul di ${state.goals.length} target pribadi`, 'savings-icon', 'savings-line-color'],
        ].map(([glyph, label, amount, description, colorClass, lineClass]) => `<article class="summary-card"><div class="summary-top"><span class="summary-icon ${colorClass}">${icon(glyph, 17)}</span><span class="summary-overline">${label}</span><span class="summary-period">Bulan ini</span></div><strong>${rupiah(amount)}</strong><div class="summary-foot"><span class="summary-line ${lineClass}"></span>${description}</div></article>`).join('')}
      </div>
      <div class="dashboard-grid">
        <section class="panel chart-panel"><div class="panel-heading"><div><span class="eyebrow">ARUS KAS</span><h2>Uangmu bergerak</h2></div><span class="select-button">30 hari terakhir <span>⌄</span></span></div>
          <div class="chart-legend"><span><i class="legend-dot income-dot"></i> Pemasukan <b>${new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(incomeSeries.at(-1))}</b></span><span><i class="legend-dot expense-dot"></i> Pengeluaran <b>${new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(expenseSeries.at(-1))}</b></span><div class="chart-change">${icon('up', 14)} catatan bulan ini</div></div>
          <div class="chart-wrap"><div class="chart-y-labels"><span>8 jt</span><span>6 jt</span><span>4 jt</span><span>2 jt</span><span>0</span></div><svg class="finance-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Grafik pemasukan dan pengeluaran bulan ini">
            <defs><linearGradient id="incomeFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="var(--chart-income)" stop-opacity=".17"/><stop offset="100%" stop-color="var(--chart-income)" stop-opacity="0"/></linearGradient><linearGradient id="expenseFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="var(--chart-expense)" stop-opacity=".14"/><stop offset="100%" stop-color="var(--chart-expense)" stop-opacity="0"/></linearGradient></defs>
            ${[16, 36, 56, 76, 96].map((y) => `<line x1="0" x2="100" y1="${y}" y2="${y}" class="chart-grid"/>`).join('')}
            <polygon points="0,96 ${points(incomeSeries)} 100,96" fill="url(#incomeFill)"/><polygon points="0,96 ${points(expenseSeries)} 100,96" fill="url(#expenseFill)"/>
            <polyline points="${points(incomeSeries)}" class="chart-line income-line"/><polyline points="${points(expenseSeries)}" class="chart-line expense-line"/>
            ${incomeSeries.map((amount, index) => `<circle cx="${(index / (incomeSeries.length - 1)) * 100}" cy="${94 - (amount / highest) * 78}" r="1.25" class="chart-point income-point"/>`).join('')}
            ${expenseSeries.map((amount, index) => `<circle cx="${(index / (expenseSeries.length - 1)) * 100}" cy="${94 - (amount / highest) * 78}" r="1.25" class="chart-point expense-point"/>`).join('')}
          </svg></div><div class="chart-x-labels">${days.map((day) => `<span>${day} ${month}</span>`).join('')}</div><div class="chart-footnote">${icon('down', 14)} Grafik mengikuti catatan transaksi bulan ini.</div>
        </section>
        <section class="panel spending-panel"><div class="panel-heading"><div><span class="eyebrow">KE MANA UANGMU PERGI?</span><h2>Belanja bulan ini</h2></div><button class="round-arrow" data-page="transactions" aria-label="Lihat semua transaksi">${icon('chevron', 17)}</button></div>
          ${categories.length ? `<div class="category-list">${categories.map(([name, amount], index) => `<div class="category-row"><div class="category-row-head"><span class="category-swatch swatch-${index}"></span><span class="category-name">${esc(name)}</span><strong>${rupiah(amount)}</strong></div><div class="category-track"><span class="category-fill fill-${index}" style="width:${Math.max(4, amount / maximum * 100)}%"></span></div></div>`).join('')}</div>` : '<p class="empty-copy">Belum ada pengeluaran bulan ini.</p>'}
          <div class="spending-summary"><span>Total pengeluaran</span><strong>${rupiah(expense)}</strong></div>
        </section>
      </div>
      <div class="dashboard-grid lower-grid">
        <section class="panel recent-panel"><div class="panel-heading"><div><span class="eyebrow">AKTIVITAS TERAKHIR</span><h2>Catatan terbaru</h2></div><button class="text-button" data-page="transactions">Lihat semua <span>→</span></button></div><div class="transaction-list">${recentTransactions(state.transactions, 5)}</div></section>
        <section class="panel budget-panel"><div class="panel-heading"><div><span class="eyebrow">DIBAGI SESUAI PRIORITAS</span><h2>Ruang anggaran</h2></div><button class="text-button" data-page="budget">Atur <span>→</span></button></div>
          <div class="budget-total"><strong>${rupiah(planned)}</strong><span>direncanakan</span></div><div class="allocation-bar">${state.budget.map((item) => `<span style="width:${planned ? item.amount / planned * 100 : 0}%;background:${esc(item.color)}"></span>`).join('')}</div>
          <div class="allocation-legend">${state.budget.slice(0, 3).map((item) => `<span><i style="background:${esc(item.color)}"></i>${esc(item.label)}</span>`).join('')}</div>
          <button class="assistant-nudge" data-page="assistant"><span class="nudge-icon">${icon('sparkles', 16)}</span><span><b>Perlu sudut pandang lain?</b><small>Ngobrol dengan teman finansialmu</small></span>${icon('chevron', 16)}</button>
        </section>
      </div><div class="data-note">${state.auth.status === 'guest' ? 'Data Guest disimpan di browser ini saja.' : 'Data disimpan privat di akun Supabase milikmu.'}</div>
    </div>`
  }

  function transactionsPage() {
    const filtered = [...state.transactions]
      .filter((item) => state.transactionFilter === 'Semua' || (state.transactionFilter === 'Pemasukan' ? item.type === 'income' : item.type === 'expense'))
      .filter((item) => `${item.category} ${item.note}`.toLowerCase().includes(state.search.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date))
    const income = sumTransactions(filtered, 'income')
    const expense = sumTransactions(filtered, 'expense')
    return `<div class="page-content">
      <div class="transaction-overview"><div><span class="eyebrow">YANG MASUK</span><strong class="income-text">${rupiah(income)}</strong></div><span class="overview-rule"></span><div><span class="eyebrow">YANG KELUAR</span><strong class="expense-text">${rupiah(expense)}</strong></div><div class="overview-count">${filtered.length} catatan ditemukan</div></div>
      <section class="panel history-panel"><div class="history-toolbar"><div><span class="eyebrow">BUKU CATATAN</span><h2>Semua transaksi</h2></div><div class="history-controls"><label class="search-field">${icon('search', 16)}<input data-focus="search" placeholder="Cari transaksi..." value="${esc(state.search)}"></label><select class="filter-select" data-action="filter-transactions" aria-label="Filter jenis transaksi"><option ${state.transactionFilter === 'Semua' ? 'selected' : ''}>Semua</option><option ${state.transactionFilter === 'Pemasukan' ? 'selected' : ''}>Pemasukan</option><option ${state.transactionFilter === 'Pengeluaran' ? 'selected' : ''}>Pengeluaran</option></select></div></div>
      <div class="table-scroll"><table class="transaction-table"><thead><tr><th>TRANSAKSI</th><th>KATEGORI</th><th>TANGGAL</th><th>NOMINAL</th><th><span class="visually-hidden">Aksi</span></th></tr></thead><tbody>
      ${filtered.map((item) => `<tr><td><span class="transaction-icon table-icon ${item.type}">${icon(item.type === 'income' ? 'down' : 'up', 16)}</span><span class="table-copy"><strong>${esc(item.note || item.category)}</strong><small>${item.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</small></span></td><td><span class="category-pill">${esc(item.category)}</span></td><td>${formatDate(item.date)}</td><td><strong class="transaction-amount ${item.type}">${item.type === 'income' ? '+' : '−'}${rupiah(item.amount)}</strong></td><td class="table-actions"><button class="delete-button" data-action="edit-transaction" data-id="${esc(item.id)}" aria-label="Ubah transaksi">${icon('pencil', 14)}</button><button class="delete-button" data-action="delete-transaction" data-id="${esc(item.id)}" aria-label="Hapus transaksi">${icon('trash', 15)}</button></td></tr>`).join('')}
      </tbody></table>${filtered.length ? '' : '<div class="empty-state"><span>Belum ada yang cocok.</span><small>Coba ubah kata pencarian atau filter.</small></div>'}</div><div class="table-footer">Menampilkan <strong>${filtered.length}</strong> dari <strong>${state.transactions.length}</strong> catatan</div></section>
    </div>`
  }

  function budgetPage() {
    const monthItems = currentMonthTransactions(state.transactions)
    const income = sumTransactions(monthItems, 'income')
    const expense = sumTransactions(monthItems, 'expense')
    const planned = state.budget.reduce((sum, item) => sum + Number(item.amount), 0)
    const remaining = income - expense - planned
    return `<div class="page-content budget-content">
      <section class="budget-intro panel"><div><span class="eyebrow">RENCANA YANG FLEKSIBEL</span><h2>Uang punya arah. <em>Kamu yang menentukan.</em></h2><p>Mulai dari kebutuhan dan kewajiban, lalu sisanya kamu atur sesuai hidupmu.</p></div><div class="budget-available"><span>MASIH BISA DIALOKASIKAN</span><strong class="${remaining < 0 ? 'negative-balance' : ''}">${rupiah(remaining)}</strong><small>Dari pemasukan dikurangi pengeluaran tercatat & rencana</small></div></section>
      <div class="budget-workspace"><section class="panel allocation-panel"><div class="panel-heading"><div><span class="eyebrow">ALOKASIMU</span><h2>Rencana bulan ini</h2></div><span class="editable-label">BISA DIUBAH</span></div>
        <div class="budget-input-list">${state.budget.map((item) => `<div class="budget-input-row"><span class="budget-color-marker" style="background-color:${esc(item.color)}"></span><input aria-label="Nama alokasi" maxlength="80" class="allocation-name-input" data-budget-id="${esc(item.id)}" data-budget-field="label" value="${esc(item.label)}"><label class="allocation-amount"><span>Rp</span><input type="number" min="0" step="50000" data-budget-id="${esc(item.id)}" data-budget-field="amount" value="${Number(item.amount)}" aria-label="Nominal ${esc(item.label)}"></label><button class="allocation-remove" data-action="remove-allocation" data-id="${esc(item.id)}" aria-label="Hapus ${esc(item.label)}" ${state.dataBusy ? 'disabled' : ''}>×</button></div>`).join('')}</div>
        <button class="add-allocation" data-action="add-allocation">${icon('plus', 16)} Tambah kategori alokasi</button><div class="allocation-total"><span>Total rencana</span><strong>${rupiah(planned)}</strong></div>
        ${planned + expense > income ? `<div class="budget-warning" role="status">${icon('info', 16)} Rencana dan pengeluaranmu lebih besar daripada pemasukan bulan ini. Coba sesuaikan nominalnya.</div>` : ''}
        ${state.savedBudget ? `<div class="saved-inline" role="status">${icon('check', 15)} Rencana anggaran tersimpan ${state.auth.status === 'guest' ? 'di perangkat ini' : 'di akunmu'}.</div>` : ''}
        <button class="button button-primary save-budget-button" data-action="save-budget" ${state.dataBusy ? 'disabled' : ''}>${icon('check', 16)} ${state.dataBusy ? 'Menyimpan...' : 'Simpan rencana'}</button>
      </section><aside class="budget-side"><section class="panel allocation-preview"><span class="eyebrow">GAMBARAN PEMBAGIAN</span><h2>Ruang tiap prioritas</h2>
        <div class="preview-bar">${state.budget.map((item) => `<span style="background:${esc(item.color)};width:${planned ? item.amount / planned * 100 : 0}%"></span>`).join('')}</div>
        <div class="preview-list">${state.budget.map((item) => `<div><span><i style="background:${esc(item.color)}"></i>${esc(item.label)}</span><strong>${rupiah(item.amount)}</strong></div>`).join('')}</div>
        <div class="preview-total"><span>Terencana</span><strong>${planned ? Math.round(planned / (income || 1) * 100) : 0}% <small>dari pemasukan</small></strong></div>
      </section><section class="gentle-tip"><span class="tip-mark">“</span><p>Anggaran yang baik bukan yang paling ketat, tapi yang terasa <strong>masuk akal untuk hidupmu.</strong></p>${icon('arrow', 16)}</section></aside></div>
    </div>`
  }

  function savingsPage() {
    const saved = state.goals.reduce((sum, goal) => sum + Number(goal.savedAmount), 0)
    const target = state.goals.reduce((sum, goal) => sum + Number(goal.targetAmount), 0)
    return `<div class="page-content savings-content">
      <section class="savings-hero"><div class="savings-hero-copy"><span class="eyebrow">SEDIKIT DEMI SEDIKIT</span><h2>Yang kamu sisihkan<br>hari ini, <em>berarti.</em></h2><p>Setiap setoran adalah langkah kecil menuju sesuatu yang kamu inginkan.</p></div>
      <div class="savings-total"><span>TERKUMPUL DARI SEMUA TARGET</span><strong>${rupiah(saved)}</strong><div><span class="overall-track"><i style="width:${target ? Math.min(100, saved / target * 100) : 0}%"></i></span><small>${target ? Math.round(saved / target * 100) : 0}% dari total tujuan</small></div></div><div class="savings-flower" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span><i></i></span></div></section>
      <div class="goals-section-heading"><div><span class="eyebrow">DISIMPAN UNTUK NANTI</span><h2>Targetmu</h2></div><button class="button button-primary" data-action="new-goal">${icon('plus', 16)} Buat target baru</button></div>
      ${state.goals.length ? `<div class="goal-grid">${state.goals.map((goal, index) => {
        const progress = goal.targetAmount > 0 ? Math.min(100, goal.savedAmount / goal.targetAmount * 100) : 0
        const left = Math.max(0, goal.targetAmount - goal.savedAmount)
        const deadline = goal.deadline ? `Target ${new Date(`${goal.deadline}T00:00:00`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}` : 'Tidak ada tenggat'
        return `<article class="goal-card goal-tone-${index % 3}"><div class="goal-card-top"><span class="goal-icon">${icon('target')}</span><div class="goal-actions"><button class="delete-button" data-action="edit-goal" data-id="${esc(goal.id)}" aria-label="Ubah target">${icon('pencil', 14)}</button><button class="delete-button" data-action="delete-goal" data-id="${esc(goal.id)}" aria-label="Hapus target">${icon('trash', 15)}</button></div></div>
        <span class="eyebrow">TARGET TABUNGAN</span><h3>${esc(goal.name)}</h3><div class="goal-amounts"><strong>${rupiah(goal.savedAmount)}</strong><span>dari ${rupiah(goal.targetAmount)}</span></div><div class="goal-track"><span style="width:${progress}%"></span></div><div class="goal-progress-copy"><strong>${Math.round(progress)}%</strong><span>${rupiah(left)} lagi</span></div>
        <div class="goal-card-footer"><span>${deadline}</span><button class="deposit-button" data-action="deposit-goal" data-id="${esc(goal.id)}" ${left === 0 ? 'disabled' : ''}>${icon('plus', 15)} Setor</button></div></article>`
      }).join('')}</div>` : `<div class="panel empty-goals">${icon('target', 26)}<h3>Belum ada target tabungan.</h3><p>Mulai dengan satu tujuan kecil yang berarti buatmu.</p><button class="button button-primary" data-action="new-goal">Buat target pertamamu</button></div>`}
      <div class="saving-reminder">${icon('sparkles', 16)}<span>Tak perlu buru-buru. <strong>Yang penting, terus bergerak.</strong></span>${icon('arrow', 16)}</div>
    </div>`
  }

  function assistantPage() {
    const messages = state.messages.map((message) => `<div class="chat-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}">${message.role === 'assistant' ? `<span class="message-avatar">${icon('bot', 15)}</span>` : ''}<p>${esc(message.text)}</p>${message.role === 'user' ? '<span class="user-avatar">A</span>' : ''}</div>`).join('')
    const auth = state.auth
    const consent = `<label class="ai-consent"><input type="checkbox" data-action="ai-consent" ${auth.consent ? 'checked' : ''} ${state.assistantBusy ? 'disabled' : ''}><span><strong>Saya setuju memakai asisten Gemini.</strong> Pertanyaan, hingga 8 pesan percakapan terakhir, dan ringkasan bulan ini (total, maksimal 8 kategori pengeluaran serta maksimal 8 alokasi anggaran, masing-masing beserta nominal; dan nama serta angka maksimal 8 target tabungan) dikirim ke Supabase Edge Function dan Google Gemini untuk menyusun jawaban. Catatan transaksi pribadi tidak dikirim. <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer">Baca ketentuan Gemini</a>.</span></label>`
    const chatDisabled = auth.session ? !auth.consent || state.assistantBusy : state.assistantBusy
    const faq = window.FinSmartGeminiConfig.faqs
    return `<div class="page-content assistant-content">
      <section class="assistant-intro"><div class="assistant-orbit"><div class="assistant-orbit-ring"></div><span>${icon('bot', 28)}</span><i>${icon('sparkles', 12)}</i></div><span class="eyebrow">ASISTEN GEMINI</span><h2>Uang bisa terasa rumit.<br><em>Kita uraikan pelan-pelan.</em></h2><p>Tanya soal catatanmu, anggaran, atau kebiasaan mengelola uang.</p><span class="local-mode"><span></span> Gemini via server aman · data hanya dikirim setelah persetujuanmu</span></section>
      ${auth.session ? `<section class="chat-panel panel"><div class="chat-heading"><span class="chat-bot-icon">${icon('bot', 17)}</span><div><strong>Teman finansial · Gemini</strong><small><span></span> Data ringkas sesuai persetujuanmu</small></div><span class="privacy-badge">${icon('lock', 12)} PRIVAT</span></div>
        ${consent}
        <div class="chat-messages" aria-live="polite"><div class="chat-message assistant-message"><span class="message-avatar">${icon('bot', 15)}</span><p>Hai. Tanya apa pun tentang catatan keuanganmu. Aku akan membantu menjelaskan dengan mempertimbangkan konteks yang tersedia.</p></div>${messages}
        ${state.assistantBusy ? `<div class="chat-message assistant-message typing-message"><span class="message-avatar">${icon('bot', 15)}</span><p>Gemini sedang menyusun jawaban...</p></div>` : ''}
        <div class="suggestion-row">${window.FinSmartGeminiConfig.faqs.slice(0, 4).map((item) => `<button data-action="ask-prompt" data-prompt="${esc(item.prompt)}" ${chatDisabled ? 'disabled' : ''}>${esc(item.question)} ${icon('up', 12)}</button>`).join('')}</div></div>
        ${state.assistantError ? `<div class="chat-error" role="alert">${icon('info', 14)} ${esc(state.assistantError)}</div>` : ''}
        <form class="chat-composer" data-form="chat"><input name="question" maxlength="1200" placeholder="${auth.consent ? 'Tulis pertanyaanmu di sini...' : 'Setujui pengiriman ringkasan untuk mulai bertanya'}" aria-label="Tulis pertanyaan untuk teman finansial" ${chatDisabled ? 'disabled' : ''} required><button type="submit" aria-label="Kirim pertanyaan" ${chatDisabled ? 'disabled' : ''}>${icon('up', 17)}</button></form>
        <div class="chat-disclaimer">${icon('sparkles', 13)} Informasi umum, bukan nasihat keuangan profesional. Periksa kembali angka sebelum mengambil keputusan.</div>
      </section>` : `<section class="guest-ai-card panel"><span class="chat-bot-icon">${icon('lock', 17)}</span><div><strong>Chat Gemini perlu akun</strong><p>Mode tamu tetap bisa membaca FAQ dan mengelola catatan di perangkat ini. Masuk atau daftar jika ingin bertanya ke Gemini.</p></div><button class="button button-primary" data-action="open-account">Masuk / Daftar</button></section>`}
      <section class="faq-section"><div class="faq-heading"><div><span class="eyebrow">PUSAT JAWABAN</span><h2>Pertanyaan yang sering muncul</h2></div><p>Jawaban umum tersedia kapan saja. Pilih “Tanya Gemini” untuk membahasnya lebih lanjut.</p></div>
        <div class="faq-list">${faq.map((item, index) => `<details class="faq-item" ${index === 0 ? 'open' : ''}><summary>${esc(item.question)}<span>${icon('chevron', 16)}</span></summary><p>${esc(item.answer)}</p><button class="faq-ask" data-action="ask-prompt" data-prompt="${esc(item.prompt)}" ${chatDisabled ? 'disabled' : ''}>Tanya Gemini ${icon('arrow', 14)}</button></details>`).join('')}</div>
      </section>
      <div class="assistant-privacy">${icon('lock', 14)}<span>API key Gemini disimpan sebagai secret Supabase Edge Function, bukan di browser. Percakapan tidak disimpan setelah halaman ditutup.</span></div>
    </div>`
  }

  function transactionModal() {
    const item = state.modal?.item
    const draft = state.modal?.draft || {}
    const type = state.modal?.type || item?.type || 'expense'
    const amount = draft.amount ?? item?.amount ?? ''
    const category = draft.category ?? item?.category ?? ''
    const date = draft.date ?? item?.date ?? window.FinSmartUtils.todayIso()
    const note = draft.note ?? item?.note ?? ''
    const categories = window.FinSmartData.categories
    const categoryOptions = type === 'expense' ? categories : []
    return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="transaction-modal-title">
      <div class="modal-header"><div><span class="eyebrow">CATAT AKTIVITAS</span><h2 id="transaction-modal-title">${item ? 'Ubah transaksi' : 'Transaksi baru'}</h2></div><button class="icon-button" data-action="close-modal" aria-label="Tutup">${icon('close', 18)}</button></div>
      <form class="modal-form" data-form="transaction" data-id="${esc(item?.id || '')}">
        <div class="segmented-control"><button type="button" class="${type === 'expense' ? 'selected expense-selected' : ''}" data-action="set-type" data-type="expense">Pengeluaran</button><button type="button" class="${type === 'income' ? 'selected income-selected' : ''}" data-action="set-type" data-type="income">Pemasukan</button></div>
        <label>Nominal<div class="currency-input"><span>Rp</span><input autofocus name="amount" type="number" min="1" step="1" placeholder="0" value="${esc(amount)}" required></div></label>
        <label>${type === 'expense' ? 'Kategori' : 'Sumber pemasukan'}${type === 'expense' ? `<select name="category" required>${!categoryOptions.includes(category) && category ? `<option>${esc(category)}</option>` : ''}${categoryOptions.map((option) => `<option ${category === option ? 'selected' : ''}>${esc(option)}</option>`).join('')}</select>` : `<input name="category" maxlength="80" value="${esc(category)}" placeholder="Contoh: Gaji, bonus" required>`}</label>
        <label>Tanggal<input name="date" type="date" value="${esc(date)}" required></label>
        <label>Catatan <span class="optional-label">OPSIONAL</span><input name="note" value="${esc(note)}" placeholder="Tambahkan detail kecil..."></label>
        <p class="form-error" data-error hidden></p>
        <div class="modal-actions"><button type="button" class="button button-quiet" data-action="close-modal">Batal</button><button type="submit" class="button button-primary">${item ? 'Simpan perubahan' : 'Simpan transaksi'}</button></div>
      </form></section></div>`
  }

  function goalModal() {
    const { mode, goal } = state.modal
    const deposit = mode === 'deposit'
    const remaining = goal ? Math.max(0, goal.targetAmount - goal.savedAmount) : 0
    return `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="goal-modal-title">
      <div class="modal-header"><div><span class="eyebrow">${deposit ? 'LANGKAH KECIL BERIKUTNYA' : mode === 'edit' ? 'SESUAIKAN TUJUAN' : 'TENTUKAN TUJUANMU'}</span><h2 id="goal-modal-title">${deposit ? `Setor ke ${esc(goal.name)}` : mode === 'edit' ? 'Ubah target tabungan' : 'Target tabungan baru'}</h2></div><button class="icon-button" data-action="close-modal" aria-label="Tutup">${icon('close', 18)}</button></div>
      <form class="modal-form" data-form="goal" data-id="${esc(goal?.id || '')}" data-mode="${mode}">
        ${deposit ? `<label>Nominal setoran<div class="currency-input"><span>Rp</span><input autofocus name="amount" type="number" min="1" max="${remaining}" step="1" placeholder="0" required></div><small class="field-hint">Sisa target ${rupiah(remaining)}</small></label>` : `<label>Nama tujuan<input autofocus name="name" maxlength="50" value="${esc(goal?.name || '')}" placeholder="Contoh: Dana darurat" required></label><label>Nominal yang ingin dicapai<div class="currency-input"><span>Rp</span><input name="targetAmount" type="number" min="1" step="1" value="${goal ? Number(goal.targetAmount) : ''}" placeholder="0" required></div></label><label>Tenggat waktu <span class="optional-label">OPSIONAL</span><input name="deadline" type="date" value="${esc(goal?.deadline || '')}"></label>`}
        <p class="form-error" data-error hidden></p><div class="modal-actions"><button type="button" class="button button-quiet" data-action="close-modal">Batal</button><button type="submit" class="button button-primary">${deposit ? 'Simpan setoran' : mode === 'edit' ? 'Simpan perubahan' : 'Buat target'}</button></div>
      </form></section></div>`
  }

  function mobileNav() {
    return `<nav class="mobile-nav" aria-label="Navigasi bawah">${[['dashboard', 'Ringkasan', 'dashboard'], ['transactions', 'Transaksi', 'wallet'], ['budget', 'Anggaran', 'down'], ['savings', 'Tabungan', 'piggy'], ['assistant', 'Teman', 'bot']].map(([key, label, glyph]) => `<button class="${state.page === key ? 'selected' : ''}" data-page="${key}">${icon(glyph)}<span>${label}</span></button>`).join('')}</nav>`
  }

  function authGate() {
    const auth = state.auth
    if (auth.loading) return `<main class="auth-gate"><section class="auth-gate-card"><div class="brand-mark">${icon('leaf', 19)}</div><h1>FINSMART</h1><p class="auth-gate-copy">${auth.dataLoading ? 'Mengambil data akunmu...' : 'Memeriksa sesi akunmu...'}</p><div class="auth-loading">Mohon tunggu sebentar.</div></section></main>`
    const mode = auth.mode
    const error = auth.error || (auth.status === 'account' && !auth.configured
      ? 'Supabase belum dikonfigurasi. Isi Project URL dan publishable/anon key di js/supabase-config.js untuk mengaktifkan aplikasi.'
      : '')
    return `<main class="auth-gate"><section class="auth-gate-card">
      <div class="brand-mark">${icon('leaf', 19)}</div><span class="eyebrow">RUANG KEUANGAN PRIBADIMU</span>
      <h1>${auth.status === 'choose' ? 'Keuanganmu, pilih caramu' : mode === 'signup' ? 'Buat akun FINSMART' : 'Selamat datang kembali'}</h1>
      <p class="auth-gate-copy">${auth.status === 'choose' ? 'Pakai sebagai tamu tanpa daftar, atau masuk agar data tersimpan di akun dan bisa dibuka dari perangkat lain.' : mode === 'signup' ? 'Daftar untuk menyimpan catatan keuangan dengan aman di akunmu.' : 'Masuk untuk melihat catatan keuangan yang hanya milik akunmu.'}</p>
      ${error ? `<div class="auth-message error-message" role="alert">${icon('info', 16)}<span>${esc(error)}</span></div>` : ''}
      ${auth.notice ? `<div class="auth-message success-message" role="status">${icon('check', 16)}<span>${esc(auth.notice)}</span></div>` : ''}
      ${auth.status === 'choose' ? `<div class="auth-choice-actions"><button class="button button-primary auth-submit" data-action="continue-guest">Lanjut sebagai tamu</button><button class="button button-quiet auth-submit" data-action="open-account">Masuk / Daftar akun</button></div><p class="auth-footnote">Tamu: data hanya tersimpan di browser ini. Akun: data tersimpan privat di Supabase.</p>` : ''}
      ${auth.configured && auth.session && auth.dataLoading ? `<div class="auth-loading">Memuat data akunmu...</div>` : ''}
      ${auth.configured && auth.dataReady === false && auth.session && !auth.loading && !auth.dataLoading ? `<button class="button button-primary auth-submit" data-action="retry-data" ${auth.busy ? 'disabled' : ''}>${auth.busy ? 'Memuat...' : 'Coba muat ulang data'}</button>` : ''}
      ${auth.session && auth.dataReady === false && !auth.loading && !auth.dataLoading ? `<button class="auth-switch" data-action="signout" ${auth.busy ? 'disabled' : ''}>Keluar dan pilih Guest</button>` : ''}
      ${auth.status === 'account' && auth.configured && !auth.session && !auth.loading ? `<form class="auth-form auth-gate-form" data-form="auth" data-mode="${mode}">
        <label>Email<input type="email" name="email" autocomplete="email" placeholder="nama@email.com" required></label>
        <label>Kata sandi<input type="password" name="password" autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}" minlength="8" placeholder="Minimal 8 karakter" required></label>
        ${mode === 'signup' ? '<small class="auth-footnote">Gunakan minimal 8 karakter. Jika konfirmasi email aktif, cek inbox sebelum masuk.</small>' : ''}
        <button class="button button-primary auth-submit" type="submit" ${auth.busy ? 'disabled' : ''}>${auth.busy ? 'Memproses...' : mode === 'signup' ? 'Daftar akun' : 'Masuk'}</button>
      </form><button class="auth-switch" data-action="toggle-auth-mode" ${auth.busy ? 'disabled' : ''}>${mode === 'signup' ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}</button><button class="auth-switch" data-action="back-to-choice" ${auth.busy ? 'disabled' : ''}>Kembali ke pilihan Guest</button>` : ''}
      ${auth.status === 'account' && !auth.configured ? `<button class="auth-switch" data-action="back-to-choice">Kembali ke pilihan Guest</button>` : ''}
      <div class="auth-gate-privacy">${icon('lock', 14)} Data akun dipisahkan per pengguna; data Guest tetap di browser dan tidak diunggah.</div>
    </section></main>`
  }

  function accountBanner() {
    const local = window.FinSmartData.legacyData
    const localCount = local.transactions.length + local.goals.length + local.budget.length
    const banners = []
    if (state.dataError) {
      banners.push(`<div class="auth-message error-message data-error" role="alert">${icon('info', 16)}<span>${esc(state.dataError)}</span><button class="data-error-dismiss" data-action="clear-data-error" aria-label="Tutup pesan">${icon('close', 14)}</button></div>`)
    }
    if (state.auth.migrationAvailable && localCount) {
      banners.push(`<section class="migration-banner"><div><strong>Data lama tersimpan di browser ini</strong><p>Ada ${local.transactions.length} transaksi, ${local.goals.length} target tabungan, dan ${local.budget.length} alokasi lokal. Jika data ini milikmu, salin ke akun ${esc(state.auth.session?.user?.email || '')}. Salinan lokal akan dihapus setelah impor berhasil.</p></div><button class="button button-primary" data-action="import-local-data" ${state.auth.migrationBusy ? 'disabled' : ''}>${state.auth.migrationBusy ? 'Mengimpor...' : 'Impor data saya'}</button><button class="button button-quiet" data-action="skip-local-import">Nanti</button></section>`)
    }
    return banners.join('')
  }

  function render() {
    const root = document.getElementById('app')
    const focused = document.activeElement?.dataset?.focus
    const selection = focused === 'search' ? document.activeElement.selectionStart : null
    if (state.auth.loading || state.auth.status === 'choose' || state.auth.status === 'account' && (!state.auth.session || !state.auth.dataReady)) {
      root.innerHTML = authGate()
      document.documentElement.dataset.theme = state.theme
      return
    }
    const page = { dashboard, transactions: transactionsPage, budget: budgetPage, savings: savingsPage, assistant: assistantPage }[state.page]()
    root.innerHTML = `<div class="app-shell">${sidebar()}<main class="main-area">${header()}${accountBanner()}${page}</main>${mobileNav()}${state.modal ? (state.modal.kind === 'transaction' ? transactionModal() : goalModal()) : ''}</div>`
    document.documentElement.dataset.theme = state.theme
    if (focused === 'search') {
      const input = root.querySelector('[data-focus="search"]')
      input?.focus()
      if (selection !== null) input?.setSelectionRange(selection, selection)
    }
    if (state.page === 'assistant') {
      const chat = root.querySelector('.chat-messages')
      if (chat) chat.scrollTop = chat.scrollHeight
    }
  }

  window.FinSmartViews = { render }
})()
