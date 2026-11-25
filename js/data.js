(() => {
  function read(key, fallback) {
    try {
      const value = localStorage.getItem(`finsmart.${key}.v1`)
      return value ? JSON.parse(value) : fallback
    } catch (error) {
      console.error(`Data ${key} tidak dapat dibaca dari browser.`, error)
      return fallback
    }
  }

  function removePreviousDemoData() {
    const storedTransactions = read('transactions', [])
    const storedGoals = read('goals', [])
    const storedBudget = read('budget', [])
    const transactions = Array.isArray(storedTransactions) ? storedTransactions : []
    const goals = Array.isArray(storedGoals) ? storedGoals : []
    const budget = Array.isArray(storedBudget) ? storedBudget : []
    const cleanTransactions = transactions.filter((item) => !String(item.id).startsWith('seed-'))
    const cleanGoals = goals.filter((item) => !(
      (item.id === 'goal-1' && item.name === 'Dana darurat' && item.savedAmount === 7350000)
      || (item.id === 'goal-2' && item.name === 'Liburan akhir tahun' && item.savedAmount === 2800000)
    ))
    const cleanBudget = budget.filter((item) => !(
      ['needs', 'bills', 'savings', 'wants'].includes(item.id)
      && ['Kebutuhan utama', 'Tagihan & kewajiban', 'Tabungan', 'Keinginan'].includes(item.label)
    ))
    try {
      if (cleanTransactions.length !== transactions.length) localStorage.setItem('finsmart.transactions.v1', JSON.stringify(cleanTransactions))
      if (cleanGoals.length !== goals.length) localStorage.setItem('finsmart.goals.v1', JSON.stringify(cleanGoals))
      if (cleanBudget.length !== budget.length) localStorage.setItem('finsmart.budget.v1', JSON.stringify(cleanBudget))
    } catch (error) {
      console.error('Data contoh lama tidak dapat dibersihkan dari browser.', error)
    }
    return { transactions: cleanTransactions, goals: cleanGoals, budget: cleanBudget }
  }

  const savedData = removePreviousDemoData()
  const legacyData = {
    transactions: savedData.transactions,
    goals: savedData.goals,
    budget: savedData.budget,
  }
  function loadGuestData() {
    const transactions = read('transactions', [])
    const goals = read('goals', [])
    const budget = read('budget', [])
    return {
      transactions: (Array.isArray(transactions) ? transactions : []).filter((item) => !String(item.id).startsWith('seed-')),
      goals: Array.isArray(goals) ? goals : [],
      budget: Array.isArray(budget) ? budget : [],
    }
  }

  function captureLegacyData(data) {
    legacyData.transactions = JSON.parse(JSON.stringify(data.transactions))
    legacyData.goals = JSON.parse(JSON.stringify(data.goals))
    legacyData.budget = JSON.parse(JSON.stringify(data.budget))
  }

  const state = {
    page: 'dashboard',
    theme: read('theme', 'light') === 'dark' ? 'dark' : 'light',
    transactions: savedData.transactions,
    goals: savedData.goals,
    budget: savedData.budget,
    search: '',
    transactionFilter: 'Semua',
    messages: [],
    auth: {
      configured: window.FinSmartSupabaseApi.isConfigured(),
      session: null,
      loading: true,
      dataReady: false,
      dataLoading: false,
      busy: false,
      mode: 'signin',
      consent: false,
      error: '',
      notice: '',
      migrationAvailable: false,
      migrationBusy: false,
      status: 'choose',
    },
    dataError: '',
    dataBusy: false,
    assistantBusy: false,
    assistantError: '',
    modal: null,
    savedBudget: false,
  }

  function persist(key) {
    try {
      if (!['theme', 'transactions', 'goals', 'budget'].includes(key)) return false
      localStorage.setItem(`finsmart.${key}.v1`, JSON.stringify(key === 'theme' ? state.theme : state[key]))
      return true
    } catch (error) {
      console.error(`Data ${key} tidak dapat disimpan di browser.`, error)
      return false
    }
  }

  window.FinSmartData = { state, persist, legacyData, loadGuestData, captureLegacyData, categories: ['Kebutuhan pokok', 'Tagihan', 'Transportasi', 'Pendidikan / pekerjaan', 'Kesehatan', 'Kebutuhan sekunder', 'Hiburan', 'Lain-lain'] }
})()
