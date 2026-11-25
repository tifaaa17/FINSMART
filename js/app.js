(() => {
  const { state, persist } = window.FinSmartData
  const { render } = window.FinSmartViews
  const root = document.getElementById('app')

  function isGuest() {
    return state.auth.status === 'guest'
  }

  function saveGuestCollection(key) {
    if (!isGuest()) return
    if (!persist(key)) throw new Error('Perubahan belum dapat disimpan di browser ini. Periksa ruang penyimpanan perangkat.')
  }

  function openAccount() {
    if (isGuest()) window.FinSmartData.captureLegacyData(state)
    state.auth.status = 'account'
    state.auth.mode = 'signin'
    state.auth.dataReady = false
    state.auth.error = state.auth.configured ? '' : 'Supabase belum dikonfigurasi. Isi Project URL dan publishable/anon key di js/supabase-config.js untuk mengaktifkan akun.'
    state.auth.notice = ''
    render()
  }

  function continueAsGuest() {
    const data = window.FinSmartData.loadGuestData()
    state.transactions = data.transactions
    state.goals = data.goals
    state.budget = data.budget
    state.auth.status = 'guest'
    state.auth.dataReady = true
    state.auth.error = ''
    state.auth.notice = ''
    state.auth.session = null
    state.auth.consent = false
    state.auth.migrationAvailable = false
    state.dataError = ''
    render()
  }

  function navigate(page) {
    state.page = page
    render()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function findById(items, id) {
    return items.find((item) => item.id === id)
  }

  function reportFormError(form, message) {
    const error = form.querySelector('[data-error]')
    if (!error) return
    error.textContent = message
    error.hidden = false
  }

  async function saveTransaction(form) {
    const data = new FormData(form)
    const amount = Number(data.get('amount'))
    const category = String(data.get('category') || '').trim()
    const date = String(data.get('date') || '')
    if (!Number.isFinite(amount) || amount <= 0) return reportFormError(form, 'Masukkan nominal lebih dari Rp0.')
    if (!category || !date) return reportFormError(form, 'Kategori dan tanggal wajib diisi.')
    const id = form.dataset.id
    const transaction = {
      id: id || crypto.randomUUID(),
      type: state.modal.type || state.modal.item?.type || 'expense',
      amount,
      category,
      date,
      note: String(data.get('note') || '').trim(),
    }
    form.querySelector('button[type="submit"]').disabled = true
    try {
      const saved = isGuest() ? transaction : await window.FinSmartSupabaseApi.saveTransaction(transaction)
      const previous = state.transactions
      const index = previous.findIndex((item) => item.id === transaction.id)
      state.transactions = index >= 0
        ? previous.map((item, itemIndex) => itemIndex === index ? saved : item)
        : [saved, ...previous]
      if (isGuest()) {
        try {
          saveGuestCollection('transactions')
        } catch (error) {
          state.transactions = previous
          throw error
        }
      }
    } catch (error) {
      return reportFormError(form, error.message || 'Transaksi tidak dapat disimpan ke akun.')
    }
    state.modal = null
    render()
  }

  async function saveGoal(form) {
    const mode = form.dataset.mode
    const id = form.dataset.id
    const goal = findById(state.goals, id)
    if (mode === 'deposit') {
      if (!goal) return
      const amount = Number(new FormData(form).get('amount'))
      const remaining = goal.targetAmount - goal.savedAmount
      if (!Number.isFinite(amount) || amount <= 0) return reportFormError(form, 'Masukkan setoran lebih dari Rp0.')
      if (amount > remaining) return reportFormError(form, `Setoran maksimal untuk target ini adalah ${window.FinSmartUtils.formatRupiah(remaining)}.`)
      const updated = { ...goal, savedAmount: goal.savedAmount + amount }
      form.querySelector('button[type="submit"]').disabled = true
      try {
        if (isGuest()) {
          const previous = { ...goal }
          Object.assign(goal, updated)
          try {
            saveGuestCollection('goals')
          } catch (error) {
            Object.assign(goal, previous)
            throw error
          }
        } else Object.assign(goal, await window.FinSmartSupabaseApi.saveGoal(updated))
      } catch (error) {
        return reportFormError(form, error.message || 'Setoran tidak dapat disimpan ke akun.')
      }
      state.modal = null
      render()
      return
    }
    const data = new FormData(form)
    const name = String(data.get('name') || '').trim()
    const targetAmount = Number(data.get('targetAmount'))
    const deadline = String(data.get('deadline') || '')
    if (!name || !Number.isFinite(targetAmount) || targetAmount <= 0) return reportFormError(form, 'Isi nama target dan nominal tujuan yang valid.')
    if (mode === 'edit' && goal && targetAmount < goal.savedAmount) {
      return reportFormError(form, `Nominal target tidak boleh kurang dari jumlah yang sudah terkumpul (${window.FinSmartUtils.formatRupiah(goal.savedAmount)}).`)
    }
    const updated = mode === 'edit' && goal
      ? { ...goal, name, targetAmount, deadline }
      : { id: crypto.randomUUID(), name, targetAmount, savedAmount: 0, deadline }
    form.querySelector('button[type="submit"]').disabled = true
    try {
      const saved = isGuest() ? updated : await window.FinSmartSupabaseApi.saveGoal(updated)
      const previous = state.goals
      state.goals = goal
        ? previous.map((item) => item.id === goal.id ? saved : item)
        : [...previous, saved]
      if (isGuest()) {
        try {
          saveGuestCollection('goals')
        } catch (error) {
          state.goals = previous
          throw error
        }
      }
    } catch (error) {
      return reportFormError(form, error.message || 'Target tidak dapat disimpan ke akun.')
    }
    state.modal = null
    render()
  }

  async function loadAccountData() {
    const auth = state.auth
    auth.dataReady = false
    auth.dataLoading = true
    auth.error = ''
    render()
    try {
      const data = await window.FinSmartSupabaseApi.loadFinancialData()
      state.transactions = data.transactions
      state.goals = data.goals
      state.budget = data.budget
      auth.dataReady = true
      const legacy = window.FinSmartData.legacyData
      const legacyCount = legacy.transactions.length + legacy.goals.length + legacy.budget.length
      const remoteIsEmpty = !data.transactions.length && !data.goals.length && !data.budget.length
      auth.migrationAvailable = remoteIsEmpty && legacyCount > 0
      state.dataError = ''
    } catch (error) {
      auth.dataReady = false
      auth.error = error.message || 'Data akun tidak dapat dimuat dari Supabase.'
    } finally {
      auth.dataLoading = false
      render()
    }
  }

  async function sendQuestion(question) {
    const value = String(question || '').trim()
    if (!value || state.assistantBusy) return
    if (!state.auth.session) {
      state.auth.error = 'Masuk ke akun Supabase terlebih dahulu untuk menggunakan Gemini.'
      render()
      return
    }
    if (!state.auth.consent) {
      state.assistantError = 'Centang persetujuan pengiriman pertanyaan dan ringkasan sebelum bertanya.'
      render()
      return
    }
    const history = state.messages.slice(-8)
    const userMessage = { role: 'user', text: value }
    state.messages.push(userMessage)
    state.assistantBusy = true
    state.assistantError = ''
    render()
    try {
      const response = await window.FinSmartGeminiApi.ask(value, history)
      state.messages.push({ role: 'assistant', text: response })
      if (state.messages.length > 16) state.messages.splice(0, state.messages.length - 16)
    } catch (error) {
      state.messages = state.messages.filter((message) => message !== userMessage)
      state.assistantError = error.message || 'Gemini tidak dapat menjawab saat ini. Silakan coba lagi.'
    } finally {
      state.assistantBusy = false
      render()
      root.querySelector('[name="question"]')?.focus()
    }
  }

  async function initializeAuth() {
    try {
      const result = await window.FinSmartSupabaseApi.initialize()
      state.auth.configured = result.configured
      state.auth.session = result.session
      state.auth.status = result.session ? 'account' : 'choose'
      state.auth.error = result.error || ''
      if (result.session) await loadAccountData()
    } catch (error) {
      state.auth.configured = window.FinSmartSupabaseApi.isConfigured()
      state.auth.status = 'choose'
      state.auth.error = error.message || 'Tidak dapat memeriksa sesi Supabase.'
    } finally {
      state.auth.loading = false
      render()
    }
  }

  async function submitAuth(form) {
    const data = new FormData(form)
    const email = String(data.get('email') || '').trim()
    const password = String(data.get('password') || '')
    if (!email || password.length < 8) return reportFormError(form, 'Masukkan email dan kata sandi minimal 8 karakter.')
    state.auth.busy = true
    state.auth.status = 'account'
    state.auth.error = ''
    state.auth.notice = ''
    render()
    try {
      if (form.dataset.mode === 'signup') {
        const result = await window.FinSmartSupabaseApi.signUp(email, password)
        if (result.session) {
          state.auth.session = result.session
          state.auth.status = 'account'
          state.auth.notice = 'Akun berhasil dibuat. Memuat data akun...'
          await loadAccountData()
        } else {
          state.auth.mode = 'signin'
          state.auth.notice = 'Akun berhasil dibuat. Periksa email untuk konfirmasi, lalu masuk di sini.'
        }
      } else {
        state.auth.session = await window.FinSmartSupabaseApi.signIn(email, password)
        state.auth.consent = false
        state.messages = []
        state.assistantError = ''
        await loadAccountData()
      }
    } catch (error) {
      state.auth.error = error.message || 'Tidak dapat memproses akun. Periksa koneksi dan pengaturan Supabase.'
    } finally {
      state.auth.busy = false
      render()
    }
  }

  async function retryDataLoad() {
    if (!state.auth.session || state.auth.busy) return
    state.auth.busy = true
    await loadAccountData()
    state.auth.busy = false
    render()
  }

  async function importLegacyData() {
    if (!state.auth.migrationAvailable || state.auth.migrationBusy) return
    state.auth.migrationBusy = true
    render()
    try {
      await window.FinSmartSupabaseApi.importLegacyData(window.FinSmartData.legacyData)
      const cleanupErrors = []
      for (const key of ['transactions', 'goals', 'budget']) {
        try {
          localStorage.removeItem(`finsmart.${key}.v1`)
        } catch (error) {
          cleanupErrors.push(error)
        }
      }
      state.auth.migrationAvailable = false
      state.auth.notice = cleanupErrors.length
        ? 'Data Guest berhasil disalin ke akun. Sebagian salinan lokal masih ada; jangan impor ulang.'
        : 'Data Guest berhasil diimpor ke akunmu dan salinan lokal telah dihapus.'
      if (!cleanupErrors.length) {
        for (const key of ['transactions', 'goals', 'budget']) window.FinSmartData.legacyData[key] = []
      }
      await loadAccountData()
      if (cleanupErrors.length) state.dataError = 'Sebagian salinan Guest belum dapat dibersihkan dari browser. Periksa pengaturan penyimpanan browser.'
    } catch (error) {
      state.dataError = error.message || 'Data lokal tidak dapat diimpor. Data lokal asli tetap tersimpan.'
    } finally {
      state.auth.migrationBusy = false
      render()
    }
  }

  async function saveBudgetPlan() {
    state.dataBusy = true
    state.savedBudget = false
    render()
    try {
      if (isGuest()) {
        saveGuestCollection('budget')
        state.dataError = ''
        state.savedBudget = true
      } else {
        for (const item of state.budget) {
          Object.assign(item, await window.FinSmartSupabaseApi.saveBudgetAllocation(item))
        }
        state.dataError = ''
        state.savedBudget = true
      }
    } catch (error) {
      state.dataError = error.message || 'Rencana anggaran tidak dapat disimpan ke akun.'
      if (!isGuest()) {
        try {
          const data = await window.FinSmartSupabaseApi.loadFinancialData()
          state.transactions = data.transactions
          state.goals = data.goals
          state.budget = data.budget
        } catch (reloadError) {
          state.dataError = `${state.dataError} ${reloadError.message || 'Data akun belum dapat dimuat ulang.'}`
        }
      }
    } finally {
      state.dataBusy = false
    }
    render()
  }

  root.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-page], [data-action]')
    if (!target) return
    if (target.dataset.page) {
      navigate(target.dataset.page)
      return
    }

    const { action, id } = target.dataset
    if (action === 'theme') {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
      persist('theme')
      render()
    } else if (action === 'new-transaction') {
      state.modal = { kind: 'transaction', type: 'expense', draft: {} }
      render()
      root.querySelector('[name="amount"]')?.focus()
    } else if (action === 'edit-transaction') {
      const item = findById(state.transactions, id)
      if (item) state.modal = { kind: 'transaction', type: item.type, item, draft: {} }
      render()
    } else if (action === 'delete-transaction') {
      if (window.confirm('Hapus catatan transaksi ini?')) {
        try {
          if (!isGuest()) await window.FinSmartSupabaseApi.deleteTransaction(id)
          const previous = state.transactions
          state.transactions = previous.filter((item) => item.id !== id)
          if (isGuest()) {
            try {
              saveGuestCollection('transactions')
            } catch (error) {
              state.transactions = previous
              throw error
            }
          }
          state.dataError = ''
        } catch (error) {
          state.dataError = error.message || 'Transaksi tidak dapat dihapus dari akun.'
        }
        render()
      }
    } else if (action === 'new-goal') {
      state.modal = { kind: 'goal', mode: 'create' }
      render()
      root.querySelector('[name="name"]')?.focus()
    } else if (action === 'edit-goal' || action === 'deposit-goal') {
      const goal = findById(state.goals, id)
      if (goal) state.modal = { kind: 'goal', mode: action === 'edit-goal' ? 'edit' : 'deposit', goal }
      render()
      root.querySelector('[name="amount"]')?.focus()
    } else if (action === 'delete-goal') {
      if (window.confirm('Hapus target tabungan ini?')) {
        try {
          if (!isGuest()) await window.FinSmartSupabaseApi.deleteGoal(id)
          const previous = state.goals
          state.goals = previous.filter((goal) => goal.id !== id)
          if (isGuest()) {
            try {
              saveGuestCollection('goals')
            } catch (error) {
              state.goals = previous
              throw error
            }
          }
          state.dataError = ''
        } catch (error) {
          state.dataError = error.message || 'Target tidak dapat dihapus dari akun.'
        }
        render()
      }
    } else if (action === 'close-modal' || (action === 'backdrop-close' && event.target === target)) {
      state.modal = null
      render()
    } else if (action === 'set-type') {
      const form = root.querySelector('[data-form="transaction"]')
      const data = new FormData(form)
      state.modal.type = target.dataset.type
      state.modal.draft = {
        amount: data.get('amount'),
        category: target.dataset.type === 'expense' ? window.FinSmartData.categories[0] : '',
        date: data.get('date'),
        note: data.get('note'),
      }
      render()
      root.querySelector('[name="amount"]')?.focus()
    } else if (action === 'add-allocation') {
      const colors = ['#76865e', '#c4a16b', '#668d83', '#c98270', '#8e7a9d', '#7696a2']
      const allocation = { id: crypto.randomUUID(), label: 'Alokasi baru', amount: 0, color: colors[state.budget.length % colors.length] }
      try {
        const saved = isGuest() ? allocation : await window.FinSmartSupabaseApi.saveBudgetAllocation(allocation)
        const previous = state.budget
        state.budget = [...previous, saved]
        if (isGuest()) {
          try {
            saveGuestCollection('budget')
          } catch (error) {
            state.budget = previous
            throw error
          }
        }
        state.savedBudget = false
        state.dataError = ''
      } catch (error) {
        state.dataError = error.message || 'Alokasi tidak dapat ditambahkan ke akun.'
      }
      render()
    } else if (action === 'remove-allocation') {
      try {
        if (!isGuest()) await window.FinSmartSupabaseApi.deleteBudgetAllocation(id)
        const previous = state.budget
        state.budget = previous.filter((item) => item.id !== id)
        if (isGuest()) {
          try {
            saveGuestCollection('budget')
          } catch (error) {
            state.budget = previous
            throw error
          }
        }
        state.savedBudget = false
        state.dataError = ''
      } catch (error) {
        state.dataError = error.message || 'Alokasi tidak dapat dihapus dari akun.'
      }
      render()
    } else if (action === 'save-budget') {
      await saveBudgetPlan()
    } else if (action === 'ask-prompt') {
      if (isGuest()) {
        openAccount()
        state.auth.notice = 'Masuk atau daftar untuk menggunakan chat Gemini. FAQ umum tetap bisa dibaca sebagai tamu.'
        render()
      } else sendQuestion(target.dataset.prompt)
    } else if (action === 'continue-guest') {
      continueAsGuest()
    } else if (action === 'open-account') {
      openAccount()
    } else if (action === 'back-to-choice') {
      state.auth.status = 'choose'
      state.auth.error = ''
      state.auth.notice = ''
      render()
    } else if (action === 'toggle-auth-mode') {
      state.auth.mode = state.auth.mode === 'signin' ? 'signup' : 'signin'
      state.auth.error = ''
      state.auth.notice = ''
      render()
    } else if (action === 'retry-data') {
      await retryDataLoad()
    } else if (action === 'import-local-data') {
      await importLegacyData()
    } else if (action === 'skip-local-import') {
      state.auth.migrationAvailable = false
      render()
    } else if (action === 'clear-data-error') {
      state.dataError = ''
      render()
    } else if (action === 'signout') {
      state.auth.busy = true
      render()
      window.FinSmartSupabaseApi.signOut()
        .catch((error) => { state.auth.error = error.message || 'Tidak dapat keluar dari Supabase.' })
        .finally(() => {
          state.auth.session = null
          state.auth.status = 'choose'
          state.auth.dataReady = false
          state.auth.dataLoading = false
          state.auth.consent = false
          state.auth.migrationAvailable = false
          state.auth.busy = false
          state.messages = []
          state.transactions = []
          state.goals = []
          state.budget = []
          state.dataError = ''
          state.modal = null
          render()
        })
    }
  })

  root.addEventListener('input', (event) => {
    const target = event.target
    if (target.dataset.action === 'ai-consent') {
      state.auth.consent = target.checked
      state.assistantError = ''
      const input = root.querySelector('[name="question"]')
      const submit = root.querySelector('[data-form="chat"] button[type="submit"]')
      if (input) {
        input.disabled = !state.auth.consent || state.assistantBusy
        input.placeholder = state.auth.consent ? 'Tulis pertanyaanmu di sini...' : 'Setujui pengiriman ringkasan untuk mulai bertanya'
      }
      if (submit) submit.disabled = !state.auth.consent || state.assistantBusy
      root.querySelectorAll('[data-action="ask-prompt"], .faq-ask').forEach((button) => { button.disabled = !state.auth.consent })
    } else if (target.dataset.focus === 'search') {
      state.search = target.value
      const cursor = target.selectionStart
      render()
      const search = root.querySelector('[data-focus="search"]')
      search?.focus()
      search?.setSelectionRange(cursor, cursor)
    } else if (target.dataset.budgetId) {
      const allocation = findById(state.budget, target.dataset.budgetId)
      if (!allocation) return
      allocation[target.dataset.budgetField] = target.dataset.budgetField === 'amount' ? Math.max(0, Number(target.value) || 0) : target.value
      state.savedBudget = false
      if (isGuest()) {
        try {
          saveGuestCollection('budget')
          state.dataError = ''
        } catch (error) {
          state.dataError = error.message || 'Anggaran belum dapat disimpan di browser ini.'
        }
      }
    }
  })

  root.addEventListener('change', async (event) => {
    const target = event.target
    if (target.dataset.action === 'filter-transactions') {
      state.transactionFilter = target.value
      render()
    } else if (target.dataset.budgetId) {
      render()
    }
  })

  root.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-form]')
    if (!form) return
    event.preventDefault()
    if (form.dataset.form === 'auth') submitAuth(form)
    else if (form.dataset.form === 'transaction') saveTransaction(form)
    else if (form.dataset.form === 'goal') saveGoal(form)
    else if (form.dataset.form === 'chat') sendQuestion(new FormData(form).get('question'))
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.modal) {
      state.modal = null
      render()
    }
  })

  render()
  initializeAuth()
})()
