# FINSMART AI

Website pencatatan dan perencanaan keuangan pribadi berbahasa Indonesia. Aplikasi menggunakan **HTML, CSS, dan JavaScript murni** tanpa React, Node.js, npm, bundler, atau proses instalasi. Halaman dapat dibuka langsung dari file `index.html`.

Panduan ini ditujukan untuk pemilik proyek, developer berikutnya, atau siapa pun yang menerima folder aplikasi. Isinya menjelaskan cara menjalankan, struktur kode, fitur, penyimpanan data, serta langkah persiapan Supabase dan batas integrasi yang sudah tersedia.

## Daftar isi

- [Ringkasan proyek](#ringkasan-proyek)
- [Menjalankan aplikasi](#menjalankan-aplikasi)
- [Memulai penggunaan](#memulai-penggunaan)
- [Fitur aplikasi](#fitur-aplikasi)
- [Struktur folder dan tanggung jawab file](#struktur-folder-dan-tanggung-jawab-file)
- [Alur kerja aplikasi](#alur-kerja-aplikasi)
- [Data lokal dan privasi](#data-lokal-dan-privasi)
- [Deploy GitHub dan Vercel](#deploy-github-dan-vercel)
- [Persiapan Supabase dan Gemini](#persiapan-supabase-dan-gemini)
- [Status integrasi Supabase](#status-integrasi-supabase)
- [Keamanan](#keamanan)
- [Troubleshooting](#troubleshooting)
- [Daftar pengujian sebelum rilis](#daftar-pengujian-sebelum-rilis)
- [Panduan pengembangan](#panduan-pengembangan)

## Ringkasan proyek

FINSMART AI membantu pengguna mengelola keuangan pribadi lewat dashboard, pencatatan transaksi, anggaran yang dapat disesuaikan, target tabungan, riwayat, serta asisten finansial berbasis Gemini yang diakses melalui Supabase Edge Function.

### Teknologi

- HTML5 untuk struktur halaman.
- CSS untuk komponen, layout responsif, dan tema.
- JavaScript browser biasa untuk rendering, interaksi, validasi, serta perhitungan.
- `localStorage` browser untuk preferensi tema dan data Guest yang hanya tersimpan di perangkat tersebut.
- Supabase Auth REST API untuk login/register email/password dan penyimpanan akun lintas perangkat.
- Supabase REST API untuk transaksi, target tabungan, dan alokasi anggaran dengan kebijakan RLS per akun.
- Supabase Edge Function (TypeScript/Deno) sebagai proxy aman untuk Gemini.
- SQL Supabase untuk tabel dan kebijakan Row Level Security (RLS) yang memisahkan data setiap akun.

Frontend tidak memerlukan framework atau library runtime yang perlu diunduh. Supabase CLI diperlukan terpisah hanya untuk deploy Edge Function. File font diambil dari Google Fonts jika perangkat tersambung ke internet; jika tidak, browser memakai font fallback.

### Status saat ini

Pengguna dapat memilih **Lanjut sebagai tamu** atau **Masuk / Daftar akun**. Guest dapat memakai aplikasi tanpa akun; transaksi, target, dan anggarannya hanya tersimpan di `localStorage` browser/perangkat itu. Mode akun menyimpan data ke Supabase dan memisahkannya berdasarkan pengguna dengan RLS, sehingga bisa dibuka lagi di perangkat lain. Guest dapat beralih ke akun dan memilih secara eksplisit apakah akan mengimpor data lokal saat akun cloud masih kosong. Chat Gemini memerlukan akun; FAQ tetap tersedia untuk Guest. Lihat [Status integrasi Supabase](#status-integrasi-supabase).

## Menjalankan aplikasi

### Melihat tampilan aplikasi

1. Pastikan folder proyek sudah diekstrak.
2. Buka folder proyek melalui File Explorer.
3. Klik dua kali `index.html`.
4. Pilih **Lanjut sebagai tamu** untuk mulai tanpa akun. Untuk sinkronisasi antarperangkat, pilih **Masuk / Daftar akun** setelah Supabase dikonfigurasi.

Contoh lokasi proyek:

```text
D:\finsmart ai\index.html
```

Tidak perlu memasang Node.js atau npm untuk menjalankan frontend. Mode Guest dapat dicoba tanpa Supabase. Supabase URL/key publik, provider Email, tabel/RLS, dan Edge Function diperlukan untuk akun serta chat Gemini.

### Menggunakan VS Code

1. Buka folder proyek `D:\finsmart ai` di VS Code.
2. Di Explorer, klik kanan `index.html`.
3. Pilih **Open in Default Browser**, jika tersedia, atau buka file tersebut lewat File Explorer.
4. Jika memakai extension seperti Live Server, klik **Go Live**. Extension itu opsional, bukan keharusan.

### Catatan penggunaan file://

Aplikasi dan script disusun agar dapat dibuka langsung melalui `file://`. Perubahan pada file `index.html`, `js/`, atau `src/index.css` dapat dilihat dengan me-refresh halaman di browser. Jika browser memblokir file lokal karena pengaturan lingkungan tertentu, gunakan extension server lokal VS Code atau host statis. Server lokal tetap tidak memerlukan framework.

`file://` adalah file yang dibuka langsung dari disk; `http://localhost:...` adalah server lokal. Keduanya tidak memerlukan Node.js untuk proyek ini. Perlu diketahui, perilaku `localStorage` untuk file `file://` berbeda antar-browser. Jika data tidak bertahan setelah tab/browser ditutup, jalankan folder melalui server lokal statis (contoh: extension Live Server di VS Code) dan selalu gunakan alamat lokal yang sama. Data `file://` dan data `localhost` mungkin terpisah karena browser memperlakukannya sebagai origin berbeda.

Fitur Supabase Auth dan AI memerlukan origin HTTP/HTTPS yang masuk ke konfigurasi Supabase serta `ALLOWED_ORIGINS`; membuka file langsung `file://` hanya cocok untuk mencoba fitur lokal.

## Memulai penggunaan

1. Pilih **Lanjut sebagai tamu** untuk memakai browser ini saja, atau masuk/daftar dengan email dan kata sandi minimal 8 karakter untuk memakai akun.
2. Jika pendaftaran memerlukan konfirmasi email, buka email konfirmasi lalu masuk.
3. Setelah dashboard terbuka, buka **Pemasukan & pengeluaran** atau tombol **Catat transaksi**.
4. Pilih jenis pemasukan/pengeluaran dan isi nominal, kategori/sumber, tanggal, serta catatan jika perlu.
5. Untuk menyusun rencana, buka **Rencana anggaran**; untuk tabungan, buka **Target tabungan**.
6. Di Guest, data tersimpan hanya di browser/perangkat ini. Di mode akun, data tersimpan pada akun Supabase dan tersedia kembali di perangkat lain.
7. Tombol ikon matahari/bulan mengganti tema terang atau gelap.

Pada Guest baru atau akun baru, seluruh transaksi, target tabungan, dan anggaran mulai kosong. Saat berpindah dari Guest ke akun yang cloud-nya kosong, aplikasi menawarkan impor data Guest; data tidak diunggah sebelum pengguna memilih **Impor data saya**. Impor yang berhasil menghapus salinan lokal tersebut. Jika dilewati, data Guest tetap berada di perangkat.

## Fitur aplikasi

### Dashboard

- Menampilkan total pemasukan, pengeluaran, saldo bulan berjalan, dan akumulasi saldo target tabungan.
- Menghitung angka dari transaksi dan target yang tersimpan, bukan angka contoh tetap.
- Membuat grafik arus kas kumulatif berdasarkan catatan bulan ini.
- Mengelompokkan pengeluaran menurut kategori dan menampilkan aktivitas terakhir.
- Menampilkan ringkasan alokasi anggaran.

Rumus saldo periode: `total pemasukan - total pengeluaran`. Total tabungan adalah penjumlahan jumlah terkumpul pada semua target.

Saat semua data masih kosong, saldo, pemasukan, pengeluaran, tabungan, grafik, dan total rencana mulai dari nol. Pengguna membuat catatan sendiri sebelum angka selain nol muncul.

### Pemasukan dan pengeluaran

- Membuat catatan pemasukan atau pengeluaran.
- Mengubah transaksi yang sudah ada, termasuk jenis transaksi.
- Mencari transaksi berdasarkan kategori atau catatan.
- Memfilter daftar menurut pemasukan atau pengeluaran.
- Menghapus catatan dengan dialog konfirmasi.

Nominal harus berupa angka lebih besar dari nol. Kategori, sumber pemasukan, dan tanggal harus diisi.

Riwayat mendukung pencarian pada nama kategori dan catatan serta filter jenis transaksi. Nilai ringkasan pada halaman riwayat menghitung baris yang sedang ditampilkan setelah pencarian/filter, bukan selalu seluruh data. Pada versi sekarang belum tersedia filter tanggal, ekspor CSV, atau pagination.

Kategori pengeluaran yang tersedia:

- Kebutuhan pokok.
- Tagihan.
- Transportasi.
- Pendidikan / pekerjaan.
- Kesehatan.
- Kebutuhan sekunder.
- Hiburan.
- Lain-lain.

### Rencana anggaran

- Menambah dan menghapus kategori alokasi.
- Mengubah nama kategori serta nominal alokasi.
- Menghitung total alokasi dan sisa uang berdasarkan pemasukan, pengeluaran tercatat, dan rencana.
- Menampilkan peringatan jika rencana dan pengeluaran tercatat melebihi pemasukan.
- Menyimpan rancangan anggaran di browser (Guest) atau akun Supabase.

Anggaran merupakan alat perencanaan yang fleksibel, bukan pembagian persentase wajib atau nasihat keuangan.

Perubahan nama dan nominal disimpan melalui tombol **Simpan rencana**; kategori yang ditambah/dihapus langsung disimpan. Alokasi tidak dibedakan per bulan walaupun label tampilan menyebut rencana bulan ini. Total anggaran di dashboard hanya menampilkan tiga nama kategori pertama.

### Target tabungan

- Membuat target dengan nama, nominal tujuan, dan tenggat opsional.
- Mengubah target. Nominal tujuan tidak boleh diubah menjadi lebih kecil daripada jumlah yang sudah terkumpul.
- Menambahkan setoran dan melihat progresnya.
- Mencegah setoran melewati sisa target.
- Menghapus target dengan konfirmasi.

Setoran menambah `saved_amount` pada target di penyimpanan Guest lokal atau Supabase sesuai mode. Tabel riwayat `savings_deposits` sudah disiapkan skema, tetapi UI belum membuat baris riwayat setoran.

### Asisten finansial

- Asisten memakai Google Gemini melalui Supabase Edge Function. Gemini API key hanya berada di secret server dan tidak disimpan di HTML/JavaScript browser.
- Chat Gemini memerlukan akun Supabase yang sudah masuk. Guest tetap dapat membuka FAQ umum tanpa login.
- Sebelum chat aktif, pengguna harus mencentang persetujuan pengiriman. Ringkasan yang dikirim berisi total pemasukan/pengeluaran/saldo bulan ini, maksimal 8 kategori pengeluaran dan maksimal 8 alokasi anggaran (masing-masing dengan nominal), maksimal 8 target tabungan beserta angka target/progres, pertanyaan, serta maksimal 8 pesan chat terakhir.
- Catatan transaksi, tanggal transaksi, catatan pribadi, email, dan kata sandi tidak disertakan dalam ringkasan keuangan yang dikirim ke Gemini.
- FAQ menyediakan jawaban umum tanpa login. Tombol “Tanya Gemini” meminta pengguna Guest untuk masuk/daftar dan setelah login juga memerlukan persetujuan.
- Percakapan hanya ada di memori tab browser; tidak disimpan ke `localStorage` atau tabel Supabase.
- Jawaban bersifat informasi umum, dapat keliru, dan bukan nasihat keuangan profesional. Hindari mengirim PIN, kata sandi, nomor rekening, atau informasi sensitif lain dalam pertanyaan.

### Tema dan tampilan

- Tema terang/gelap dapat diganti melalui tombol tema di header.
- Pilihan tema tersimpan untuk kunjungan berikutnya pada browser yang sama.
- Layout menyesuaikan desktop dan ponsel; navigasi bawah muncul pada layar sempit.

### Bagian yang masih berupa tampilan / batasan demo

- Tombol periode **Bulan ini** dan label grafik **30 hari terakhir** bersifat tampilan, bukan pemilih periode. Perhitungan data sekarang memakai bulan kalender berjalan. Titik grafik memakai tanggal tertentu pada bulan itu, sedangkan label sumbu Y memakai nilai tetap (0–8 juta); skala belum menyesuaikan otomatis jika nominal lebih tinggi/rendah.
- Nama dan avatar pada sidebar bersifat dekoratif, bukan profil pengguna.
- Menu Pengaturan dan Pusat bantuan belum mempunyai halaman/fungsi pengaturan atau pusat bantuan.
- Reset password belum tersedia.
- Catatan Guest disimpan lokal di browser/perangkat, tidak disinkronkan, dan tidak dapat dipulihkan jika data situs/browser dihapus. Catatan akun disimpan di Supabase dan terpisah per pengguna.
- Saat Guest beralih ke akun, data lokal hanya dapat diimpor secara eksplisit jika akun cloud masih kosong. Jika impor dilewati, Guest dapat melanjutkan mengakses data lokal setelah keluar dari akun.
- Fitur setoran belum menyimpan catatan transaksi setoran terpisah.
- Penggunaan AI memerlukan konfigurasi/deployment Supabase dan Gemini oleh pengelola proyek.

## Struktur folder dan tanggung jawab file

```text
finsmart-ai/
├── index.html                 # Halaman HTML utama dan urutan pemuatan script
├── README.md                  # Panduan proyek ini
├── js/
│   ├── supabase-config.js     # URL proyek dan publishable/anon key (publik)
│   ├── supabase-api.js        # Auth dan pemanggilan Edge Function via REST
│   ├── gemini-config.js       # Nama fungsi dan konten FAQ, tanpa API key
│   ├── gemini-api.js          # Ringkasan data lokal dan client Gemini
│   ├── data.js                # State, kategori, penyimpanan Guest, dan snapshot untuk migrasi
│   ├── utils.js               # Format Rupiah/tanggal, perhitungan, ikon SVG, utilitas
│   ├── views.js               # Template HTML untuk seluruh halaman dan dialog
│   └── app.js                 # Event, validasi/form, aksi, dan inisialisasi aplikasi
├── src/
│   └── index.css              # Design tokens, komponen, tema, dan responsive layout
└── supabase/
    ├── config.toml             # Konfigurasi JWT Supabase Functions
    ├── schema.sql              # Tabel, constraint, index, dan kebijakan RLS data
    └── functions/
        └── gemini-assistant/
            └── index.ts        # Verifikasi Auth, validasi input, proxy server-side ke Gemini
```

### File JavaScript

- `js/data.js`: menyimpan state UI dan tema, memuat data Guest dari browser, serta mengambil snapshot lokal untuk opsi impor eksplisit ke akun. Data akun aktif dimuat dari Supabase.
- `js/utils.js`: utilitas yang dapat dipakai ulang oleh rendering dan interaksi, termasuk pemformatan angka/tanggal, filter bulan, agregasi angka, sanitasi teks, dan ikon SVG.
- `js/views.js`: menyusun tampilan navigasi, header, dashboard, transaksi, anggaran, tabungan, asisten, dan modal berdasarkan state.
- `js/app.js`: menghubungkan interaksi pengguna dengan state, menangani pengiriman form, mengubah/menghapus data, mengganti halaman/tema, dan memanggil rendering ulang.
- `js/supabase-config.js`: isi URL proyek dan publishable/anon key. Kedua nilai ini bersifat publik; jangan masukkan secret/service-role key.
- `js/supabase-api.js`: implementasi REST untuk Auth email/password, refresh sesi, logout, pemuatan/CRUD data finansial, impor data lama, dan pemanggilan Edge Function. Sesi login disimpan di `sessionStorage`.
- `js/gemini-config.js`: nama Edge Function dan FAQ; jangan pernah menaruh Gemini API key di sini.
- `js/gemini-api.js`: membentuk ringkasan minimum transaksi/target dari data akun Supabase dan mengirimkannya hanya setelah pengguna memberi persetujuan.
- `supabase/functions/gemini-assistant/index.ts`: validasi JWT pengguna, allowlist CORS, batas ukuran input, validasi ringkasan/riwayat, dan panggilan Gemini server-side.

Script dimuat berurutan menggunakan atribut `defer` di bagian akhir `index.html`. Browser mempertahankan urutan script `defer`, sehingga:

1. `supabase-config.js` dan `gemini-config.js` membuat konfigurasi publik.
2. `supabase-api.js` dan `gemini-api.js` menyiapkan lapisan Auth/API.
3. `data.js` membaca koleksi lokal dan membuat `window.FinSmartData`.
4. `utils.js` membuat utilitas bersama pada `window.FinSmartUtils`.
5. `views.js` menyiapkan renderer tampilan pada `window.FinSmartViews`.
6. `app.js` memasang handler, menampilkan aplikasi, lalu memeriksa sesi Supabase.

Jangan menghapus `defer`, mengubah file menjadi `type="module"`, atau memindahkan `app.js` ke sebelum dependensinya tanpa mengubah mekanisme bootstrap.

### Menambah atau mengubah tampilan

1. Ubah struktur dan template komponen di `js/views.js`.
2. Tambahkan atau ubah event/form serta validasi yang diperlukan di `js/app.js`.
3. Gunakan utilitas di `js/utils.js` untuk hitung/format yang bisa dipakai ulang.
4. Tambahkan gaya di `src/index.css`, dan gunakan CSS variables yang sudah ada untuk menjaga konsistensi tema.
5. Tambahkan field data baru di `js/data.js` dan sesuaikan skema `supabase/schema.sql` jika field itu nantinya akan disinkronkan.
6. Buka ulang halaman dan cek tampilan desktop maupun ponsel.

Semua teks yang berasal dari input pengguna harus dirender secara aman (gunakan utilitas `escapeHtml` sebelum memasukkannya sebagai HTML).

## Alur kerja aplikasi

1. `index.html` memuat CSS dan script JavaScript.
2. `js/data.js` membaca data lokal atau memakai koleksi kosong.
3. `js/app.js` mengatur event dan meminta halaman dirender.
4. `js/views.js` menghasilkan tampilan sesuai halaman dan data saat ini.
5. Aksi pengguna memperbarui state; koleksi finansial disimpan ke `localStorage` pada Guest atau ke Supabase saat masuk ke akun.
6. Dashboard dan halaman lain menghitung ulang tampilan dari state yang sama.

Struktur ini sengaja dibuat tanpa framework supaya dapat dipahami dan dijalankan langsung, tetapi pemisahan tugas tiap file tetap memungkinkan perawatan yang teratur.

### Bentuk data yang disimpan di browser

Contoh struktur UI yang dipetakan ke tabel Supabase. Nominal disimpan sebagai angka Rupiah (JavaScript `Number`):

```js
// finsmart.transactions.v1
{ id, type, amount, category, date, note }
// type: "income" | "expense"; date: "YYYY-MM-DD"

// finsmart.goals.v1
{ id, name, targetAmount, savedAmount, deadline }
// deadline berupa "YYYY-MM-DD" atau string kosong

// finsmart.budget.v1
{ id, label, amount, color }

// finsmart.theme.v1
"light" // atau "dark"
```

Mode Guest membaca dan menyimpan koleksi transaksi, target, serta anggaran pada key `finsmart.*.v1` di `localStorage`. Mode akun memuat dan menyimpan data ke Supabase; selama masuk ke akun, koleksi finansial tidak disimpan ulang ke `localStorage`. Tema tersimpan lokal di kedua mode. Token sesi akun disimpan sementara di `sessionStorage`.

## Data lokal dan privasi

- Guest: transaksi, target, dan anggaran tersimpan hanya di `localStorage` browser yang dipakai. Gunakan browser/perangkat dan origin yang sama untuk mengaksesnya lagi.
- Akun: transaksi, target, dan anggaran tersimpan di Supabase; login dari perangkat lain memuat data akun yang sama.
- RLS menerapkan pemisahan berdasarkan `user_id` dari token login, bukan email yang dikirim dari browser.
- Data Guest tetap berada lokal saat masuk/daftar akun sampai pengguna memilih impor eksplisit. Saat seluruh impor berhasil, salinan key lokal dihapus; bila impor gagal, salinan lokal tidak dihapus dan impor dapat dicoba kembali.
- Preferensi tema disimpan lokal. Token login sementara disimpan di `sessionStorage` dan dibuang ketika tab/sesi berakhir atau pengguna logout.
- Hindari memakai perangkat umum untuk login dan selalu logout setelah selesai.
- Dengan menyetujui chat AI, pengguna mengirim ringkasan finansial minimum dan pertanyaan ke Supabase serta Google Gemini; rincian persetujuan dicantumkan di bagian [Asisten finansial](#asisten-finansial).
- Data contoh dari versi awal dihapus saat aplikasi dibuka. Migrasi tersebut hanya menghapus ID contoh yang dikenal, bukan catatan pengguna biasa.
- Pembersihan berjalan saat `data.js` pertama kali dimuat. Transaksi yang ID-nya diawali `seed-` dihapus. Target dibuang hanya jika kombinasi ID/nama/jumlah tersimpan sama dengan salah satu target demo lama. Alokasi dibuang hanya jika ID dan nama kategori sama-sama cocok dengan pasangan preset lama. Item lain tetap dipertahankan. Jika pengguna memang memakai ID dan nilai persis yang sama, item tersebut dapat dianggap sebagai data contoh dan ikut terhapus.
- Jika isi JSON `localStorage` rusak/tidak bisa dibaca, aplikasi mencatat kesalahan di Console lalu melanjutkan dengan daftar kosong. Nilai rusak tidak otomatis diperbaiki/dihapus; cadangkan data terlebih dahulu jika ingin mencoba pemulihan manual.
- Jika browser menolak penulisan koleksi Guest, antarmuka menampilkan error pada form/banner dan perubahan tidak dipertahankan setelah reload. Kegagalan menyimpan preferensi tema dicatat di Console.
- Untuk memulai ulang data lokal sendiri, buka Developer Tools browser → **Application/Storage → Local Storage** lalu hapus hanya entri dengan awalan `finsmart.`. Tindakan ini menghapus data finansial yang tersimpan di browser tersebut.

Key lokal yang digunakan:

```text
finsmart.theme.v1
finsmart.transactions.v1
finsmart.goals.v1
finsmart.budget.v1
```

Tiga key koleksi digunakan oleh mode Guest. Ketika Guest beralih ke akun, key yang sama dapat ditawarkan untuk migrasi eksplisit jika database akun masih kosong. Saat pengguna sedang masuk ke akun, koleksi finansial akun tidak disalin ke key tersebut.

## Deploy GitHub dan Vercel

Arsitektur deployment yang disarankan:

- **GitHub:** menyimpan source code website. Data transaksi pengguna tidak disimpan di repository.
- **Vercel:** meng-host website HTML/CSS/JavaScript statis; proyek ini tidak perlu build command, Node.js lokal, atau framework.
- **Supabase:** mengelola akun dan data tersinkron, serta menjalankan Edge Function yang memanggil Gemini. Mode Guest tidak mengirimkan data finansial ke Supabase.
- **Gemini API key:** hanya disimpan sebagai secret Supabase Edge Function. Jangan dimasukkan ke repository, file frontend, atau Vercel sebagai variable `NEXT_PUBLIC_*`.
- **Supabase Project URL dan publishable/anon key:** boleh terlihat di frontend dan repository karena merupakan konfigurasi publik. Key ini **bukan password**; keamanan database wajib menggunakan Auth dan RLS.

### Sebelum push ke GitHub

1. Pastikan `js/supabase-config.js` hanya berisi URL proyek dan key `publishable`/`anon`. Untuk repository publik, isi ini memang dapat dilihat siapa saja.
2. Jangan pernah mengisi file frontend atau mengunggah `GEMINI_API_KEY`, Supabase `service_role`/secret key, password akun, access token, atau data transaksi pribadi.
3. `.gitignore` mengabaikan `.env`, file konfigurasi `.env.*`, `.vercel/`, dan cache lokal Supabase. `.gitignore` membantu mencegah file tertentu ikut ter-commit, tetapi **bukan tempat menyimpan secret** dan tidak menghapus file yang sebelumnya sudah di-commit.
4. Jangan menaruh data keuangan pribadi dalam source, test fixture publik, screenshot, atau README. Data yang dibuat lewat website saat ini tinggal di penyimpanan browser pengguna.
5. Commit source code, lalu buat repository GitHub (private jika ingin membatasi akses source) dan push branch yang akan dipakai untuk rilis.

Jika Gemini key pernah ter-commit atau dikirim ke tempat publik, menghapus file saja tidak cukup: segera cabut/rotasi key di Google AI Studio dan periksa riwayat commit.

### Hubungkan repository ke Vercel

1. Masuk ke [Vercel](https://vercel.com/) dengan akun yang dapat mengakses repository GitHub.
2. Pilih **Add New → Project**, lalu **Import** repository FINSMART AI.
3. Untuk preset/framework, pilih **Other** atau static site. Pastikan **Root Directory** adalah folder yang berisi `index.html`.
4. Tidak perlu Build Command atau framework. Deploy situs statis langsung dari root repository.
5. Klik **Deploy**. Setelah berhasil, Vercel memberi domain seperti `https://nama-proyek.vercel.app`.
6. Bila menggunakan domain sendiri, tambahkan domain itu pada pengaturan proyek Vercel dan tunggu status DNS/SSL siap.
7. Jangan menaruh Gemini API key di Vercel Environment Variables untuk konfigurasi proyek ini: permintaan Gemini berjalan lewat Supabase Edge Function, sehingga Gemini key disimpan sebagai Supabase Function secret sesuai bagian konfigurasi di bawah.

Setelah push berikutnya ke branch yang terhubung, Vercel membuat deployment baru secara otomatis. Preview deployments juga otomatis; jangan menggunakan URL preview yang tidak stabil untuk konfigurasi Auth/CORS produksi tanpa menambah origin yang tepat.

### Sambungkan domain Vercel ke Supabase

Setelah domain produksi diketahui:

1. Di Supabase, buka **Authentication → URL Configuration**.
2. Atur **Site URL** ke domain produksi, misalnya `https://nama-proyek.vercel.app` (atau domain sendiri).
3. Tambahkan origin/domain yang memang akan dipakai ke **Redirect URLs**. Untuk website ini, login email/password tidak memakai OAuth redirect, tetapi URL yang benar tetap penting untuk konfigurasi Auth dan email konfirmasi.
4. Pastikan secret `ALLOWED_ORIGINS` pada Supabase berisi origin halaman frontend yang tepat, misalnya `https://nama-proyek.vercel.app` atau `https://contoh.com`; jangan menambahkan path atau wildcard origin.
5. Jika mengganti domain, perbarui Site URL, Redirect URLs, dan `ALLOWED_ORIGINS`. Preview deployment memakai origin berbeda dari domain produksi; izinkan satu per satu hanya bila benar-benar diperlukan.
6. Buka domain Vercel melalui HTTPS dan uji pendaftaran/login, persetujuan AI, FAQ, serta jawaban Gemini.

**Jangan memasukkan token/secret Supabase Function ke Vercel browser environment variable.** Website hanya memerlukan Supabase URL dan publishable/anon key yang memang publik. Gemini key tetap berada di server Supabase.

### Data apa yang ikut ke mana?

| Data | GitHub | Vercel | Supabase/Gemini |
|---|---|---|---|
| Source code aplikasi | Ya | Ya, di-host sebagai website | Tidak |
| Supabase URL dan publishable/anon key | Boleh, bersifat publik | Terlihat di browser | Dipakai untuk memilih proyek dan Auth |
| Gemini API key | **Tidak** | **Tidak** | Hanya Supabase Function secret |
| Service-role/secret Supabase key | **Tidak** | **Tidak** | Jangan dipakai website; tidak diperlukan fungsi ini |
| Catatan keuangan Guest | Tidak | Tidak | Tetap di browser/perangkat; tidak dikirim ke Supabase atau Gemini |
| Catatan keuangan akun | Tidak | Tidak | Tersimpan di Supabase per akun; ringkasannya hanya dikirim ke Gemini setelah pengguna menyetujui |
| Percakapan AI | Tidak | Tidak | Dikirim untuk menjawab; tidak disimpan aplikasi setelah tab ditutup |

Deploy membuat website statis online. Mode Guest dapat dipakai tanpa Supabase; fitur akun dan AI memerlukan konfigurasi/deployment Supabase dan Gemini seperti dijelaskan di bawah.

## Persiapan Supabase

### Ambil konfigurasi proyek

1. Buat atau buka proyek di [Supabase](https://supabase.com/).
2. Di sidebar dashboard, buka **Project Settings** (ikon roda gigi) → **API** / **API Keys**, bergantung versi dashboard.
3. Salin **Project URL**.
4. Pada bagian **Project API keys**, salin **publishable key** (awalan `sb_publishable_...`). Proyek lama mungkin menamai key publiknya **anon** (`anon` / `anon public`).
5. Di folder proyek, buka `js/supabase-config.js` dan isi nilai `url` serta `anonKey`:

```js
window.FinSmartSupabaseConfig = {
  url: 'https://PROJECT-REF.supabase.co',
  anonKey: 'sb_publishable_GANTI_DENGAN_KEY_PUNYA_PROYEK',
}
```

Gunakan key publik (`publishable`/`anon`) untuk website di browser. URL dan key tersebut memang dapat dilihat oleh setiap pengunjung halaman dan tidak boleh dianggap sebagai kata sandi. Keamanan data berasal dari Supabase Auth dan RLS yang benar, bukan dari menyembunyikan publishable key.

### Jalankan SQL untuk menyiapkan tabel

1. Di Supabase dashboard, buka **SQL Editor**.
2. Buka file `supabase/schema.sql` di VS Code.
3. Periksa nama proyek/organisasi yang aktif supaya query tidak dijalankan pada project yang salah.
4. Salin seluruh isi file dan jalankan sekali di SQL Editor.
5. Buka **Table Editor** dan cek tabel berikut:
   - `transactions`
   - `savings_goals`
   - `savings_deposits`
   - `budget_allocations`
6. Pilih setiap tabel lalu cek bagian **RLS Policies**. Pastikan RLS aktif dan policy pengguna tersedia.
7. Aktifkan dan konfigurasi Supabase Auth sebelum mengizinkan aplikasi mengakses data pengguna.

Skema menggunakan `auth.users` dan membatasi tiap baris berdasarkan `user_id`. Policy tersebut dirancang agar pengguna hanya dapat membaca/mengubah baris miliknya sendiri. Jangan menghapus policy atau menonaktifkan RLS untuk menyelesaikan masalah izin.

Jangan menjalankan ulang `schema.sql` tanpa memeriksa policy yang sudah ada: tabel/index memakai `if not exists`, tetapi deklarasi `create policy` tidak memakai kondisi idempoten. Jika tabel sudah dibuat dan SQL dijalankan ulang, deklarasi policy dapat gagal karena policy dengan nama tersebut sudah ada. Periksa hasil eksekusi sebelum mencoba ulang.

### Tabel yang disiapkan skema

| Tabel | Kolom/data utama | Constraint penting |
|---|---|---|
| `transactions` | `user_id`, `type`, `amount`, `category`, `transaction_date`, `note` | Jenis hanya `income`/`expense`; nominal harus positif; akun Auth dihapus berarti baris ikut dihapus. |
| `savings_goals` | `user_id`, `name`, `target_amount`, `saved_amount`, `deadline` | Target positif; saldo terkumpul tidak negatif dan tidak boleh lebih besar daripada target. |
| `savings_deposits` | `user_id`, `goal_id`, `amount`, `deposit_date`, `note` | Nominal setoran positif; target yang dihapus menghapus baris setoran terkait. Policy memastikan pemilik setoran cocok dengan pemilik target. |
| `budget_allocations` | `user_id`, `label`, `amount`, `color`, `period_start` | Alokasi tidak negatif; satu label unik per pengguna dan awal periode. |

Setiap tabel menyimpan `user_id` yang mengacu ke `auth.users`. RLS diaktifkan untuk semua tabel; policy CRUD memeriksa `auth.uid() = user_id`. Policy setoran juga memeriksa bahwa goal terkait memang milik pengguna yang sedang login. Index membantu pencarian data berdasarkan pemilik/tanggal.

**Catatan skema:** `savings_deposits` disediakan untuk riwayat setoran mendatang. UI sekarang hanya memperbarui `savings_goals.saved_amount` dan belum membuat baris riwayat setoran atau trigger/RPC.

### Konfigurasikan Supabase Auth

1. Di dashboard Supabase, buka **Authentication → Providers → Email** dan aktifkan provider email/password.
2. Tentukan apakah registrasi harus dikonfirmasi melalui email. Jika konfirmasi aktif, pengguna harus membuka email sebelum bisa masuk.
3. Buka **Authentication → URL Configuration**. Atur **Site URL** dan **Redirect URLs** untuk origin development serta domain hosting yang benar, misalnya `http://127.0.0.1:5500/**` dan `https://nama-domain-anda/**`.
4. Isi `url` dan `anonKey` pada `js/supabase-config.js` seperti langkah sebelumnya.
5. Jalankan aplikasi melalui server HTTP, misalnya Live Server di VS Code. Login dan Edge Function tidak dapat digunakan dengan membuka `index.html` sebagai `file://`.

Gunakan origin yang benar-benar dipakai browser. `localhost` dan `127.0.0.1` dianggap origin berbeda.

### Konfigurasikan dan deploy Gemini Edge Function

1. Buat Gemini API key di [Google AI Studio](https://aistudio.google.com/apikey). Jangan menempelkannya ke file proyek, chat, source control, atau JavaScript browser.
2. Instal Supabase CLI mengikuti [panduan resmi instalasi](https://supabase.com/docs/guides/cli). Aplikasi browser tetap tidak memerlukan Node.js; CLI hanya dibutuhkan untuk deployment.
3. Buka PowerShell pada folder proyek, masuk ke akun CLI, dan hubungkan proyek:

   ```powershell
   supabase login
   supabase link --project-ref PROJECT-REF
   ```

4. Di dashboard Supabase, buka **Edge Functions → Secrets** (atau pengaturan secrets proyek). Tambahkan:

   | Nama secret | Nilai |
   |---|---|
   | `GEMINI_API_KEY` | API key dari Google AI Studio |
   | `GEMINI_MODEL` | `gemini-2.5-flash` (opsional; model default fungsi) |
   | `ALLOWED_ORIGINS` | Daftar origin browser yang dipisah koma, tanpa path, misalnya `http://127.0.0.1:5500,https://nama-domain-anda` |

   Fungsi memerlukan variabel standar `SUPABASE_URL` dan `SUPABASE_ANON_KEY` yang disediakan runtime Supabase. Jangan menambahkan `service_role` ke konfigurasi browser. Jangan commit secret ke repositori.

5. Deploy dari folder utama proyek:

   ```powershell
   supabase functions deploy gemini-assistant
   ```

   `supabase/config.toml` mengaktifkan pemeriksaan JWT di gateway. Fungsi juga memeriksa pengguna lewat Supabase Auth, menolak origin di luar `ALLOWED_ORIGINS`, dan memvalidasi ukuran/bentuk pertanyaan, riwayat, serta ringkasan.

6. Pastikan origin halaman yang sedang dibuka sama persis dengan salah satu origin di `ALLOWED_ORIGINS`. Untuk menambahkan domain baru, perbarui secret tersebut dan deploy ulang bila diperlukan.
7. Muat ulang aplikasi melalui HTTP, buat akun atau masuk, lalu centang persetujuan sebelum mengirim chat. Cek log Edge Function di dashboard jika server mengembalikan error.

Atur batas pemakaian/billing dan kuota API Gemini pada proyek Google. Untuk penggunaan publik, pertimbangkan mewajibkan konfirmasi email atau membatasi pendaftaran. Edge Function membatasi ukuran payload, jumlah pesan riwayat, dan panjang jawaban, tetapi belum menerapkan kuota penggunaan per pengguna.

### Key mana yang tidak boleh dipakai?

**Jangan pernah** memasukkan `service_role`, `secret`, atau private key ke `js/supabase-config.js`, HTML, JavaScript browser, repositori publik, atau screenshot. Key tersebut dapat melewati RLS dan hanya boleh digunakan pada lingkungan server yang rahasia.

## Status integrasi Supabase

- **Akses aplikasi:** pengunjung memilih Guest atau akun. Guest dapat membuka halaman utama tanpa login; mode akun menggunakan email/password dan pengelola dapat mewajibkan konfirmasi email di dashboard Supabase.
- **Penyimpanan data:** transaksi, target tabungan (termasuk jumlah terkumpul), dan alokasi anggaran menggunakan Supabase REST API. RLS memeriksa `auth.uid() = user_id` untuk setiap operasi. Email bukan kunci kepemilikan data.
- **Pemisahan akun:** saat login, data dimuat ulang dari tabel remote; saat logout, state data aktif dihapus dari memori. Jangan menonaktifkan RLS.
- **Migrasi Guest:** data `localStorage` tidak otomatis dikirim. Bila akun Supabase masih kosong dan perangkat memiliki data Guest, aplikasi menawarkan impor eksplisit. Setelah seluruh impor berhasil, salinan key lokal dihapus. Jika impor gagal, salinan lokal dipertahankan.
- **AI:** hanya pengguna yang sudah masuk ke akun dapat mengaktifkan chat. Setelah persetujuan eksplisit, browser mengirim pertanyaan, beberapa pesan chat terakhir, dan ringkasan terhitung dari data akun ke Edge Function. Gemini API key tetap menjadi secret Supabase. FAQ umum dapat digunakan tanpa login.
- **Batasan:** tabel `savings_deposits` tersedia di skema tetapi riwayat setoran satu per satu belum dicatat; yang disimpan saat ini adalah `saved_amount` pada target.
- **Konfigurasi diperlukan:** sebelum aplikasi digunakan, pengelola harus mengisi Supabase URL/key publik, menjalankan SQL schema terbaru, mengaktifkan Email Auth, deploy Edge Function, dan memasang secrets yang disebutkan di panduan deployment.

Uji dengan setidaknya dua akun nyata setelah konfigurasi selesai: buat satu catatan di akun pertama, keluar, masuk dengan akun kedua, pastikan catatan tidak terlihat; masuk kembali ke akun pertama dan pastikan catatan tetap ada. Pengujian browser lokal dengan respons tiruan tidak menggantikan pemeriksaan RLS di proyek Supabase.

## Keamanan

- Jangan menyimpan Gemini API key, secret, atau service-role key di front-end.
- Pastikan semua tabel yang mengandung data pengguna memakai RLS dan policy yang diverifikasi.
- Jangan menonaktifkan autentikasi/RLS hanya agar pengujian lokal terlihat berhasil.
- Hindari memasukkan PIN, kata sandi, nomor rekening, atau informasi rahasia lain ke asisten. Pertanyaan dan ringkasan yang disetujui dikirim ke Google Gemini.
- Periksa dan batasi `ALLOWED_ORIGINS`; gunakan HTTPS pada hosting produksi.
- Atur kuota/billing Gemini dan pantau penggunaan Edge Function.
- Sebelum hosting publik, sertakan kebijakan privasi yang sesuai dengan data dan layanan yang benar-benar digunakan.

## Troubleshooting

### Halaman kosong

- Pastikan file yang dibuka adalah `index.html` di folder utama, bukan file JavaScript atau folder `src`.
- Buka Developer Tools browser → tab **Console**. Pastikan tidak ada kesalahan pemuatan file.
- Pastikan folder `js` dan `src` tetap berdampingan dengan `index.html`, dan nama file/folder tidak diubah tanpa menyesuaikan referensi di HTML.
- Cek Network/Console untuk memastikan script `js/` termuat dan urutannya tidak berubah. `index.html` harus tetap menjadi file yang dibuka.

### CSS atau ikon tidak tampil

- Pastikan `src/index.css` tersedia pada lokasi yang tepat.
- Refresh halaman setelah menyimpan perubahan.
- Jika font khusus tidak tampil tanpa internet, browser akan memakai fallback; layout tetap dapat digunakan.

### Data tidak muncul setelah browser dibuka ulang

- Gunakan profil browser yang sama dan jangan memakai mode privat.
- Jangan membersihkan data situs/file dari pengaturan browser.
- Pastikan sedang masuk dengan email akun yang benar.
- Pastikan schema terbaru sudah dijalankan dan tabel memiliki policy RLS yang sesuai.
- Periksa **Table Editor** di Supabase dan log Network/Console; jangan menaruh service-role key di frontend untuk mengatasi izin.
- Guest: tema serta transaksi, anggaran, dan target tersimpan lokal pada browser/perangkat yang sama. Akun: transaksi, anggaran, dan target dibaca dari Supabase; sesi yang masih berlaku ada di `sessionStorage`.
- Jika berpindah dari `file://` ke Live Server (`http://localhost`), cek origin lama dan baru secara terpisah. Browser dapat memberikan penyimpanan lokal berbeda untuk kedua origin tersebut.

### Perubahan kode tidak terlihat

- Simpan file di editor, lalu refresh halaman browser.
- Pastikan perubahan dilakukan pada folder proyek yang sama dengan `index.html` yang sedang dibuka.
- Jika menggunakan extension server, pastikan server mengarah ke folder proyek yang benar.

### Periksa JavaScript dan data melalui Developer Tools

1. Buka halaman aplikasi, lalu tekan `F12` atau klik kanan → **Inspect**.
2. Tab **Console** menampilkan kesalahan JavaScript, error pembacaan/penulisan storage, dan log lainnya.
3. Tab **Application → Local Storage** (Chrome/Edge) memperlihatkan key `finsmart.*` dan nilainya. Firefox menyediakan bagian Storage di Developer Tools.
4. Setelah mengubah file, refresh halaman. Jangan membagikan screenshot atau salinan data `localStorage` bila isinya memuat informasi finansial pribadi.

### RLS menolak akses Supabase

- Pastikan pengguna sudah login dan memiliki sesi autentikasi yang valid.
- Pastikan schema dijalankan pada proyek Supabase yang benar.
- Pastikan policy RLS tidak dihapus atau diedit tanpa pemahaman.
- Jangan mengatasinya dengan menaruh service-role key di browser atau menonaktifkan RLS.
- Periksa nama field dan tipe data pada request dibandingkan dengan `supabase/schema.sql`.

### Login atau asisten AI gagal

- Pastikan aplikasi dibuka melalui HTTP/HTTPS, bukan `file://`, dan `js/supabase-config.js` berisi URL proyek serta publishable/anon key yang benar.
- Pastikan provider Email aktif di Supabase. Bila konfirmasi email aktif, konfirmasikan email sebelum login.
- Pastikan fungsi `gemini-assistant` sudah di-deploy dan secret `GEMINI_API_KEY` sudah diisi di dashboard.
- Pastikan origin halaman tercantum tepat di `ALLOWED_ORIGINS` (scheme, hostname, dan port harus cocok; tanpa path/trailing slash).
- Periksa bahwa `GEMINI_MODEL` masih tersedia untuk Gemini API serta kuota/billing belum habis.
- Lihat **Edge Functions → Logs** di Supabase. Jangan membagikan log yang berisi token atau data pengguna.

## Daftar pengujian sebelum rilis

- [ ] Website bisa dibuka dari `index.html` tanpa Node.js.
- [ ] Guest dapat membuka dashboard tanpa login dan data baru dimulai kosong pada profil browser yang belum punya data.
- [ ] Tambah/edit/hapus data Guest tersimpan setelah refresh di browser/origin yang sama.
- [ ] Mode akun meminta login; pengguna Guest tidak dapat melihat atau mengubah data akun.
- [ ] Catatan dapat dibaca kembali setelah refresh dan setelah login dari perangkat/browser lain.
- [ ] Tambah/edit/hapus transaksi bekerja untuk pemasukan maupun pengeluaran.
- [ ] Pencarian dan filter transaksi bekerja.
- [ ] Saldo, grafik, ringkasan kategori, dan anggaran mengikuti data saat ini.
- [ ] Anggaran menampilkan peringatan saat alokasi melebihi dana tersedia.
- [ ] Target dapat dibuat, diedit, disetor, dan dihapus dengan validasi yang sesuai.
- [ ] Tema terang/gelap dan layout ponsel bekerja.
- [ ] FAQ dapat dibaca Guest; chat Gemini terkunci sampai login akun dan persetujuan dipilih.
- [ ] Login/logout, error login, dan konfirmasi email telah dicoba di proyek Supabase.
- [ ] AI berhasil menjawab melalui Edge Function; origin yang tidak diizinkan ditolak.
- [ ] Ringkasan/pertanyaan hanya dikirim setelah consent; tidak ada Gemini API key di browser atau repositori.
- [ ] Tidak ada error JavaScript yang belum ditangani di Console.
- [ ] Dua akun berbeda sudah diuji; data tiap akun tidak bocor atau tertukar.
- [ ] Impor Guest ke akun meminta aksi eksplisit; data Guest lokal hanya dihapus setelah impor berhasil.
- [ ] Dokumentasi, konfigurasi, dan UI tidak memuat secret key atau kredensial pribadi.

## Panduan pengembangan

- Jaga teks/UI tetap berbahasa Indonesia dan hindari klaim seolah-olah data demo tersimpan di cloud.
- Pertahankan palet warna, token CSS, tipografi, komponen, dan perilaku responsif yang sudah ada.
- Letakkan perhitungan bersama di utilitas atau fungsi yang jelas; jangan gunakan nominal contoh tetap sebagai sumber perhitungan.
- Validasi data sebelum menyimpan dan tampilkan error kepada pengguna saat penyimpanan gagal.
- Jika struktur data berubah, perbarui sekaligus validasi, penyimpanan lokal, dokumentasi, dan skema SQL yang relevan.
- Uji perubahan di browser sebelum menyerahkan atau menerbitkannya.
#   F I N S M A R T  
 