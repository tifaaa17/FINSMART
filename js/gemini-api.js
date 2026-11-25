(() => {
  const config = window.FinSmartGeminiConfig

  function financialSummary() {
    const { state } = window.FinSmartData
    const { currentMonthTransactions, sumTransactions } = window.FinSmartUtils
    const monthItems = currentMonthTransactions(state.transactions)
    const expenses = monthItems.filter((item) => item.type === 'expense').reduce((result, item) => {
      result[item.category] = (result[item.category] || 0) + Number(item.amount)
      return result
    }, {})
    return {
      period: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date()),
      income: sumTransactions(monthItems, 'income'),
      expenses: sumTransactions(monthItems, 'expense'),
      balance: sumTransactions(monthItems, 'income') - sumTransactions(monthItems, 'expense'),
      expenseByCategory: Object.entries(expenses)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([category, amount]) => ({ category, amount })),
      budgetAllocations: state.budget.slice(0, 8).map((allocation) => ({
        label: allocation.label,
        amount: Number(allocation.amount),
      })),
      savingsGoals: state.goals.slice(0, 8).map((goal) => ({
        name: goal.name,
        targetAmount: Number(goal.targetAmount),
        savedAmount: Number(goal.savedAmount),
        remainingAmount: Math.max(0, Number(goal.targetAmount) - Number(goal.savedAmount)),
      })),
    }
  }

  async function ask(question, messages) {
    if (!window.FinSmartSupabaseApi.isConfigured()) {
      throw new Error('Supabase belum dikonfigurasi. Isi js/supabase-config.js terlebih dahulu.')
    }
    if (!config?.functionName) throw new Error('Nama Supabase Edge Function belum diatur di js/gemini-config.js.')
    const context = financialSummary()
    const history = messages
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .slice(-8)
      .map((message) => ({ role: message.role, text: message.text }))
    const result = await window.FinSmartSupabaseApi.invokeFunction(config.functionName, {
      question: question.trim().slice(0, 1200),
      history,
      financialSummary: context,
    })
    if (typeof result?.answer !== 'string' || !result.answer.trim()) {
      throw new Error('Asisten belum mengembalikan jawaban. Coba ubah pertanyaan dan kirim lagi.')
    }
    return result.answer.trim()
  }

  window.FinSmartGeminiApi = { ask, financialSummary }
})()
