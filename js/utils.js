(() => {
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character])

  const formatRupiah = (amount) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(Number(amount) || 0)

  const todayIso = () => {
    const date = new Date()
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const formatDate = (date) => new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))

  const currentMonthTransactions = (transactions) => {
    const now = new Date()
    return transactions.filter((item) => {
      const date = new Date(`${item.date}T00:00:00`)
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    })
  }

  const sumTransactions = (transactions, type) => transactions
    .filter((item) => item.type === type)
    .reduce((total, item) => total + Number(item.amount), 0)

  const monthLabel = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date())

  const icon = (name, size = 18) => {
    const paths = {
      leaf: '<path d="M20 4c-8 0-14 3-14 10a6 6 0 0 0 6 6c7 0 10-6 8-16Z"/><path d="M4 21c3-6 7-9 13-12"/>',
      dashboard: '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/>',
      wallet: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M16 15h.01"/><path d="M6 5V3h12"/>',
      down: '<path d="M12 3v12m0 0 5-5m-5 5-5-5"/><path d="M5 19h14"/>',
      up: '<path d="M12 21V9m0 0 5 5m-5-5-5 5"/><path d="M5 5h14"/>',
      piggy: '<path d="M19 8h2v5h-2"/><path d="M4 10V7l3 1a11 11 0 0 1 8-1c3 1 5 3 5 6s-2 5-5 6H9a6 6 0 0 1-5-3l-2-1 2-2v-3Z"/><path d="M10 12h.01M7 19v2m8-2v2"/>',
      bot: '<rect x="4" y="7" width="16" height="13" rx="3"/><path d="M12 3v4m-4 5h.01M16 12h.01M9 16h6"/>',
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
      moon: '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>',
      plus: '<path d="M12 5v14m-7-7h14"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
      trash: '<path d="M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6"/>',
      pencil: '<path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z"/>',
      arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
      target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
      sparkles: '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Zm7 12 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      close: '<path d="m18 6-12 12M6 6l12 12"/>',
      chevron: '<path d="m9 18 6-6-6-6"/>',
      logout: '<path d="M10 17l5-5-5-5m5 5H3"/><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/>',
      lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
    }
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.sparkles}</svg>`
  }

  window.FinSmartUtils = { escapeHtml, formatRupiah, todayIso, formatDate, currentMonthTransactions, sumTransactions, monthLabel, icon }
})()
