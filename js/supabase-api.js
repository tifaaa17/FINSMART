(() => {
  const config = window.FinSmartSupabaseConfig
  const SESSION_KEY = 'finsmart.supabase.session.v1'

  function isConfigured() {
    return Boolean(config?.url?.trim() && config?.anonKey?.trim())
  }

  function projectUrl() {
    if (!isConfigured()) throw new Error('Isi Project URL dan publishable/anon key di js/supabase-config.js terlebih dahulu.')
    return config.url.replace(/\/+$/, '')
  }

  function readSession() {
    try {
      const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null')
      return session?.access_token && session?.refresh_token ? session : null
    } catch (error) {
      console.error('Sesi Supabase tidak dapat dibaca.', error)
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
  }

  function writeSession(session) {
    if (!session?.access_token || !session?.refresh_token) throw new Error('Supabase tidak mengembalikan sesi login yang valid.')
    const stored = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at || Math.floor(Date.now() / 1000) + (session.expires_in || 3600),
      user: session.user || null,
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(stored))
    return stored
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY)
  }

  async function request(path, { method = 'GET', body, token, headers = {} } = {}) {
    let response
    try {
      response = await fetch(`${projectUrl()}${path}`, {
        method,
        headers: {
          apikey: config.anonKey,
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      })
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('Tidak dapat terhubung ke Supabase. Jalankan aplikasi melalui HTTP/HTTPS, lalu periksa URL proyek dan koneksi internet.')
      }
      throw error
    }
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      const message = payload?.msg || payload?.message || payload?.error_description || payload?.error
      if (response.status === 429) throw new Error('Terlalu banyak permintaan. Coba lagi beberapa saat.')
      if (response.status >= 500) throw new Error('Layanan Supabase sedang bermasalah. Coba lagi nanti.')
      const error = new Error(message || `Permintaan Supabase gagal (HTTP ${response.status}).`)
      error.status = response.status
      throw error
    }
    return payload
  }

  async function signUp(email, password) {
    const payload = await request('/auth/v1/signup', { method: 'POST', body: { email, password } })
    if (payload?.access_token && payload?.refresh_token) return { session: writeSession(payload), needsEmailConfirmation: false }
    return { session: null, needsEmailConfirmation: true }
  }

  async function signIn(email, password) {
    const payload = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } })
    return writeSession(payload)
  }

  async function signOut() {
    const session = readSession()
    if (!session) return
    try {
      await request('/auth/v1/logout', { method: 'POST', token: session.access_token })
    } finally {
      clearSession()
    }
  }

  async function refreshSession(session = readSession()) {
    if (!session?.refresh_token) return null
    const payload = await request('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: { refresh_token: session.refresh_token },
    })
    return writeSession(payload)
  }

  async function getValidSession() {
    let session = readSession()
    if (!session) return null
    if (Number(session.expires_at) < Math.floor(Date.now() / 1000) + 60) {
      try {
        session = await refreshSession(session)
      } catch (error) {
        if (error.status === 400 || error.status === 401) clearSession()
        throw error
      }
    }
    const user = await request('/auth/v1/user', { token: session.access_token })
    session = writeSession({ ...session, user })
    return session
  }

  const TABLES = {
    transactions: 'transactions',
    goals: 'savings_goals',
    budget: 'budget_allocations',
  }
  const LEGACY_BUDGET_PERIOD = '2000-01-01'
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  function recordId(id) {
    return UUID_PATTERN.test(String(id || '')) ? id : crypto.randomUUID()
  }

  async function databaseRequest(table, query, { method = 'GET', body, prefer = '' } = {}) {
    const session = await getValidSession()
    if (!session) throw new Error('Sesi akun berakhir. Silakan masuk kembali.')
    return request(`/rest/v1/${table}?${query}`, {
      method,
      token: session.access_token,
      ...(body === undefined ? {} : { body: Array.isArray(body) ? body : [body] }),
      headers: {
        ...(prefer ? { Prefer: prefer } : {}),
      },
    })
  }

  async function loadFinancialData() {
    const [transactions, goals, budget] = await Promise.all([
      databaseRequest(TABLES.transactions, 'select=id,type,amount,category,transaction_date,note&order=transaction_date.desc,created_at.desc'),
      databaseRequest(TABLES.goals, 'select=id,name,target_amount,saved_amount,deadline&order=created_at.asc'),
      databaseRequest(TABLES.budget, 'select=id,label,amount,color,period_start&order=created_at.asc'),
    ])
    return {
      transactions: transactions.map((item) => ({
        id: item.id,
        type: item.type,
        amount: Number(item.amount),
        category: item.category,
        date: item.transaction_date,
        note: item.note || '',
      })),
      goals: goals.map((item) => ({
        id: item.id,
        name: item.name,
        targetAmount: Number(item.target_amount),
        savedAmount: Number(item.saved_amount),
        deadline: item.deadline || '',
      })),
      budget: budget.map((item) => ({
        id: item.id,
        label: item.label,
        amount: Number(item.amount),
        color: item.color,
      })),
    }
  }

  async function saveTransaction(item) {
    const session = await getValidSession()
    if (!session?.user?.id) throw new Error('Sesi akun berakhir. Silakan masuk kembali.')
    const rows = await databaseRequest(TABLES.transactions, 'on_conflict=id&select=id,type,amount,category,transaction_date,note', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=representation',
      body: {
        id: recordId(item.id),
        user_id: session.user.id,
        type: item.type,
        amount: item.amount,
        category: item.category,
        transaction_date: item.date,
        note: item.note || '',
      },
    })
    const saved = rows[0]
    return { ...item, id: saved.id }
  }

  async function deleteTransaction(id) {
    await databaseRequest(TABLES.transactions, `id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' })
  }

  async function saveGoal(item) {
    const session = await getValidSession()
    if (!session?.user?.id) throw new Error('Sesi akun berakhir. Silakan masuk kembali.')
    const rows = await databaseRequest(TABLES.goals, 'on_conflict=id&select=id,name,target_amount,saved_amount,deadline', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=representation',
      body: {
        id: recordId(item.id),
        user_id: session.user.id,
        name: item.name,
        target_amount: item.targetAmount,
        saved_amount: item.savedAmount,
        deadline: item.deadline || null,
      },
    })
    return {
      ...item,
      id: rows[0].id,
      targetAmount: Number(rows[0].target_amount),
      savedAmount: Number(rows[0].saved_amount),
    }
  }

  async function deleteGoal(id) {
    await databaseRequest(TABLES.goals, `id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' })
  }

  async function saveBudgetAllocation(item) {
    const session = await getValidSession()
    if (!session?.user?.id) throw new Error('Sesi akun berakhir. Silakan masuk kembali.')
    const rows = await databaseRequest(TABLES.budget, 'on_conflict=id&select=id,label,amount,color', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=representation',
      body: {
        id: recordId(item.id),
        user_id: session.user.id,
        label: String(item.label || '').trim(),
        amount: item.amount,
        color: item.color || '#76865e',
        period_start: LEGACY_BUDGET_PERIOD,
      },
    })
    return { ...item, id: rows[0].id }
  }

  async function deleteBudgetAllocation(id) {
    await databaseRequest(TABLES.budget, `id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' })
  }

  async function importLegacyData(data) {
    const session = await getValidSession()
    if (!session?.user?.id) throw new Error('Sesi akun berakhir. Silakan masuk kembali.')
    const transactions = data.transactions.map((item) => ({
      id: recordId(item.id),
      user_id: session.user.id,
      type: item.type,
      amount: Number(item.amount),
      category: item.category,
      transaction_date: item.date,
      note: item.note || '',
    }))
    const goals = data.goals.map((item) => ({
      id: recordId(item.id),
      user_id: session.user.id,
      name: item.name,
      target_amount: Number(item.targetAmount),
      saved_amount: Number(item.savedAmount),
      deadline: item.deadline || null,
    }))
    const budget = data.budget.map((item) => ({
      id: recordId(item.id),
      user_id: session.user.id,
      label: String(item.label || '').trim(),
      amount: Number(item.amount),
      color: item.color || '#76865e',
      period_start: LEGACY_BUDGET_PERIOD,
    }))
    for (const [table, rows] of [[TABLES.transactions, transactions], [TABLES.goals, goals], [TABLES.budget, budget]]) {
      if (rows.length) {
        await databaseRequest(table, 'on_conflict=id', {
          method: 'POST',
          prefer: 'resolution=merge-duplicates,return=minimal',
          body: rows,
        })
      }
    }
  }

  async function invokeFunction(name, body) {
    let session = await getValidSession()
    if (!session) throw new Error('Silakan masuk ke akun Supabase terlebih dahulu.')

    for (let attempt = 0; attempt < 2; attempt += 1) {
      let response
      try {
        response = await fetch(`${projectUrl()}/functions/v1/${encodeURIComponent(name)}`, {
          method: 'POST',
          headers: {
            apikey: config.anonKey,
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })
      } catch (error) {
        if (error instanceof TypeError) {
          throw new Error('Tidak dapat terhubung ke Supabase Edge Function. Periksa URL proyek, koneksi internet, dan ALLOWED_ORIGINS.')
        }
        throw error
      }
      const payload = await response.json().catch(() => null)
      if (response.ok) return payload
      if (response.status === 401 && attempt === 0 && session.refresh_token) {
        session = await refreshSession(session)
        continue
      }
      if (response.status === 429) throw new Error('Batas penggunaan tercapai. Tunggu sebentar sebelum mencoba lagi.')
      throw new Error(payload?.error || payload?.message || `Layanan AI gagal merespons (HTTP ${response.status}).`)
    }
    throw new Error('Sesi login kedaluwarsa. Silakan masuk kembali.')
  }

  async function initialize() {
    if (!isConfigured()) return { configured: false, session: null }
    try {
      return { configured: true, session: await getValidSession() }
    } catch (error) {
      if (error.status === 401) {
        clearSession()
        return { configured: true, session: null, error: 'Sesi login berakhir. Silakan masuk kembali.' }
      }
      return { configured: true, session: readSession(), error: error.message || 'Tidak dapat memeriksa sesi Supabase.' }
    }
  }

  window.FinSmartSupabaseApi = {
    isConfigured,
    signUp,
    signIn,
    signOut,
    initialize,
    loadFinancialData,
    saveTransaction,
    deleteTransaction,
    saveGoal,
    deleteGoal,
    saveBudgetAllocation,
    deleteBudgetAllocation,
    importLegacyData,
    invokeFunction,
    getSession: readSession,
  }
})()
