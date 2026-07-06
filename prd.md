Product Requirements Document (PRD): Aplikasi Monitoring Ingot
1. Tujuan Produk
Membangun aplikasi berbasis web untuk memantau stok ingot, mencatat pergerakan barang (masuk, terpakai, terbuang), dan melihat riwayat data secara efisien. Aplikasi dirancang untuk meminimalkan input berulang dari pengguna melalui penyimpanan lokal.

2. Pengguna Target
Operator Produksi / Gudang: Melakukan input harian terkait pergerakan ingot.

Supervisor / Manager: Memantau ketersediaan stok melalui dashboard dan mengevaluasi riwayat penggunaan.

3. Fitur Utama (Core Features)
A. Dashboard Stock Ingot
Menampilkan ringkasan total stok ingot secara real-time.

Menampilkan status stok terakhir berdasarkan pembaharuan data terbaru.

B. Input Data Ingot
Formulir pencatatan pergerakan ingot dengan spesifikasi berikut:

Nama Operator: Input teks (Wajib).

Shift: Pilihan dropdown atau radio button (Red / White).

Smart Feature: Sistem akan menyimpan Nama dan Shift terakhir ke dalam localStorage browser. Jika pengguna membuka form lagi, field ini akan terisi otomatis (auto-fill).

Tanggal: Date picker dengan nilai default hari ini.

Time: Pilihan (Day / Night).

Total Ingot Masuk: Input angka.

Pakai Produksi: Input angka (jumlah ingot yang digunakan).

Buang (Reject/Scrap): Input angka (jumlah ingot yang cacat/terbuang).

Stock Akhir (Auto-Calculate): Field read-only yang terisi otomatis secara real-time saat pengguna mengetik angka di field sebelumnya.

Rumus: Stock Akhir = Total Ingot Masuk - Pakai Produksi - Buang

C. History (Riwayat Data)
Tabel yang menampilkan seluruh data yang telah di-submit (Tanggal, Waktu, Shift, Nama, Masuk, Pakai, Buang, Stock Akhir).

Menyediakan fitur sorting (urutkan berdasarkan tanggal terbaru) dan pagination agar halaman tidak berat jika data sudah banyak.

Rekomendasi Tech Stack
Mengingat aplikasi ini membutuhkan manipulasi DOM yang reaktif (untuk auto-kalkulasi), akses localStorage, dan sistem CRUD (Create, Read, Update, Delete) standar, berikut adalah kombinasi teknologi yang optimal:

Opsi 1: Modern & Cepat (Direkomendasikan)
Pendekatan ini sangat cocok jika Anda ingin mendevelop aplikasi dengan cepat dan tidak ingin pusing mengurus infrastruktur backend yang rumit.

Frontend: Vue.js atau React.js. Keduanya sangat unggul dalam menangani state form secara real-time (memudahkan fitur auto-kalkulasi Stok Akhir).

Styling: Tailwind CSS. Memudahkan pembuatan antarmuka yang rapi dan responsif (nyaman digunakan di tablet atau HP operator).

Backend & Database: Localstorage dulu