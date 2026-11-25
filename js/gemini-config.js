// The Gemini key must only be configured as a Supabase Edge Function secret.
// This browser config contains only the public name of the server-side function.
window.FinSmartGeminiConfig = {
  functionName: 'gemini-assistant',
  faqs: [
    {
      question: 'Bagaimana cara mulai mengatur keuangan?',
      answer: 'Mulai dengan mencatat pemasukan, kebutuhan penting, kewajiban, dan pengeluaran rutin. Setelah terlihat polanya, tentukan prioritas yang terasa realistis untuk situasimu.',
      prompt: 'Bantu aku memahami langkah awal mengatur keuangan berdasarkan catatan yang tersedia.',
    },
    {
      question: 'Bagaimana membuat anggaran yang realistis?',
      answer: 'Dahulukan kebutuhan pokok dan kewajiban yang jatuh tempo. Setelah itu, sesuaikan alokasi tabungan dan kebutuhan lain dengan uang yang benar-benar tersedia. Tidak ada persentase yang wajib sama untuk semua orang.',
      prompt: 'Bantu tinjau anggaran saya berdasarkan pemasukan, pengeluaran, dan alokasi yang tercatat.',
    },
    {
      question: 'Apa yang perlu diketahui tentang dana darurat?',
      answer: 'Dana darurat membantu menghadapi kebutuhan mendesak yang tidak direncanakan. Besaran dan waktu mengumpulkannya bergantung pada kondisi, tanggungan, dan pengeluaran tiap orang; target kecil bertahap juga bisa menjadi awal.',
      prompt: 'Bagaimana saya bisa mulai menyiapkan dana darurat secara bertahap?',
    },
    {
      question: 'Pengeluaran apa yang sebaiknya saya periksa?',
      answer: 'Lihat kategori dengan jumlah terbesar dan pisahkan kebutuhan rutin dari pengeluaran yang bisa diatur ulang. Pastikan catatannya lengkap sebelum mengambil kesimpulan.',
      prompt: 'Kategori pengeluaran apa yang paling besar bulan ini dan apa yang sebaiknya saya periksa?',
    },
    {
      question: 'Bagaimana progres target tabungan saya?',
      answer: 'Buat target dengan nominal yang jelas, catat setoran, lalu periksa jumlah terkumpul dan sisanya. Pilih target dan langkah berkala yang masuk akal untuk kebutuhanmu.',
      prompt: 'Tolong ringkas progres semua target tabungan saya.',
    },
    {
      question: 'Apakah jawaban asisten merupakan nasihat profesional?',
      answer: 'Bukan. Asisten memberi informasi umum dari ringkasan yang kamu setujui untuk dibagikan. Keputusan finansial penting sebaiknya mempertimbangkan kondisi lengkapmu dan, bila perlu, didiskusikan dengan profesional.',
      prompt: 'Apa batasan saran yang bisa diberikan asisten finansial ini?',
    },
  ],
}
