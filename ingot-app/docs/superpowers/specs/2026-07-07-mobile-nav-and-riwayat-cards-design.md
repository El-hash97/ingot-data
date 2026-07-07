# Mobile Bottom Nav & Riwayat Card List

## Context

Perbandingan tiga mockup Stitch ("Visual Website Revamp" project) terhadap halaman aplikasi saat ini (`dashboard`, `input`, `riwayat`) menunjukkan dua kesenjangan struktural terbesar:

1. `AppShell.tsx` memakai pola navigasi desktop-first: sidebar collapsible + tombol hamburger + overlay untuk mobile. Mockup Stitch memakai pola mobile-native: top app bar sederhana + bottom tab bar (Dashboard / Input / History).
2. `riwayat/page.tsx` merender satu `<Table>` HTML 9 kolom untuk semua ukuran layar. Di layar sempit ini memaksa scroll horizontal. Mockup Stitch merender riwayat sebagai daftar kartu (satu kartu per entri) di mobile.

Tema warna (dark maroon/black + amber, radius 0) dari sesi sebelumnya **tidak** diubah oleh spec ini — mockup Stitch dipakai murni sebagai referensi layout/struktur, bukan referensi warna (sudah dikonfirmasi user).

## Goals

- Tambahkan bottom navigation bar untuk mobile (<768px / breakpoint Tailwind `md`) berisi 3 item nav yang sudah ada (Dashboard, Input Data, Riwayat), menggantikan sidebar+overlay sepenuhnya di mobile.
- Sederhanakan topbar mobile: hilangkan tombol hamburger dan pill tanggal, tampilkan brand row ringkas (ikon + "Ingot Monitor") + judul halaman.
- Tambahkan tampilan kartu untuk daftar Riwayat di mobile, menggantikan tabel hanya di bawah breakpoint `md`; tabel tetap dipakai di layar `md` ke atas.
- Kartu Riwayat menampilkan 4 stat (Masuk, Pakai, Buang, Stok Akhir) plus aksi hapus per baris — paritas fungsional penuh dengan tabel desktop.

## Non-goals

- Tidak mengubah token warna (`globals.css`) atau tema visual.
- Tidak menambahkan filter tab "Shift 1 / Shift 2" yang ada di mockup — di luar scope, fitur filter baru terpisah dari perubahan layout.
- Tidak mengubah logika filter/sort/pagination yang sudah ada di `riwayat/page.tsx` (`filtered`, `pageData`, `pageRange`) — hanya menambah cara render alternatif dari data yang sama.
- Tidak mengubah halaman Dashboard atau Input.
- Tidak menghapus item navigasi apa pun dari sidebar desktop — sidebar desktop tetap identik dengan sekarang.

## Design

### 1. Mobile Nav Shell (`AppShell.tsx`)

**Pendekatan:** CSS-driven responsive (bukan JS `isMobile` state) — kedua layout (sidebar dan bottom nav) selalu ada di DOM, visibilitas diatur murni lewat class breakpoint Tailwind. Ini menghindari "flash of wrong layout" saat hydration karena hasil akhir CSS sudah pasti sebelum JS jalan.

**Desktop (≥`md`, tidak berubah):**
- Sidebar collapsible, tombol hamburger, topbar dengan judul halaman + tanggal — sama persis seperti sekarang.

**Mobile (<`md`):**
- `<aside>` sidebar dan backdrop overlay-nya disembunyikan total (`hidden md:flex` pada elemen sidebar; backdrop overlay tidak dirender ketika sidebar tidak mungkin terbuka di mobile — logika `sidebarOpen`/overlay untuk mobile dihapus, bukan sekadar disembunyikan via CSS, supaya tidak ada backdrop mengambang tanpa sidebar).
- Topbar mobile diganti jadi brand row: ikon `Building2` kecil + teks "Ingot Monitor", lalu judul halaman (`pageTitle`) di sampingnya. Tombol hamburger (`Menu` icon) dan pill tanggal disembunyikan di mobile (`hidden md:flex` / setara).
- Komponen baru `BottomNav` (file baru `src/components/layout/BottomNav.tsx`), `fixed bottom-0 inset-x-0 z-40`, `md:hidden`. `NAV_ITEMS` (array 3 item: href/label/icon) dipindah keluar dari `AppShell.tsx` ke file baru `src/components/layout/nav-items.ts` dan diimpor oleh kedua komponen (`AppShell` dan `BottomNav`), supaya tidak ada duplikasi/definisi ganda. Tiap item nav di `BottomNav` menampilkan ikon + label kecil, state aktif memakai warna `primary` (pola yang sama dengan highlight aktif di sidebar sekarang).
- `<main>` mendapat padding bawah tambahan di mobile (`pb-20 md:pb-0`) supaya konten terakhir tidak tertutup `BottomNav` yang fixed.

**Komponen yang terpengaruh:** `src/components/layout/AppShell.tsx` (edit), `src/components/layout/BottomNav.tsx` (baru).

### 2. Riwayat Card List (`riwayat/page.tsx`)

**Pendekatan:** sama seperti di atas — CSS-driven, kedua struktur (tabel dan kartu) dirender dari `pageData` yang sama, visibilitas diatur breakpoint (`hidden md:block` untuk wrapper tabel, `block md:hidden` untuk stack kartu).

**Komponen baru:** `src/components/riwayat/RiwayatCard.tsx`, menerima props `entry: IngotEntry` dan `onDelete: (id: number) => void`. Dirender dalam `<div className="space-y-3 md:hidden">` di `riwayat/page.tsx`, di-map dari `pageData` (array yang sama dipakai tabel).

**Isi tiap kartu:**
- Baris header: `formatDate(e.date)` + `TimeBadge` (komponen sudah ada, di-reuse) di kiri; `ShiftBadge` (sudah ada, di-reuse) di kanan.
- Sub-baris: nama operator (`e.operator`).
- Grid mini-stat 2×2: Masuk, Pakai, Buang, Stok Akhir — tiap chip label kecil uppercase + angka (`formatNumber`), warna mengikuti konvensi yang sudah dipakai (Stok Akhir: `text-destructive` jika negatif, else `text-primary`; Masuk/Pakai/Buang: warna netral/`chart-2` konsisten dengan pola badge/nilai yang sudah ada di tabel dan dashboard — tidak memperkenalkan token warna baru).
- Tombol ikon hapus (`Trash2`, pola sama dengan tombol di tabel) di pojok kanan atas/bawah kartu, memanggil `handleDelete(e.id)` yang sudah ada — dialog konfirmasi (`Dialog` yang sudah ada di halaman) tidak berubah, dipicu sama seperti dari tabel.

**Empty state:** blok pesan kosong (`Search` icon + teks "Belum ada data..." / "Tidak ada data yang cocok...") dirender sekali, di luar/di atas kedua layout (tidak diduplikasi per-layout) — ditampilkan ketika `pageData.length === 0`, menggantikan baris kosong yang saat ini ada di dalam `<TableBody>`.

**Pagination:** tidak berubah — kontrol pagination yang ada di bawah tabel sudah terpisah dari elemen `<Table>` itu sendiri, jadi otomatis berlaku untuk kedua layout tanpa modifikasi.

## Testing

- Verifikasi manual di browser (dev server) pada lebar viewport <768px dan ≥768px: pastikan hanya satu layout nav (sidebar atau bottom nav) dan satu layout Riwayat (tabel atau kartu) yang terlihat pada satu waktu.
- Verifikasi klik item `BottomNav` berpindah halaman dan menandai item aktif dengan benar (`usePathname` match, pola sama seperti sidebar).
- Verifikasi hapus entri dari kartu mobile memicu dialog konfirmasi yang sama dan menghapus data yang benar (uji dengan beberapa entri berbeda `id`).
- Verifikasi search/sort/pagination di Riwayat tetap berfungsi sama saat toggle antar breakpoint (resize browser) — data yang tampil di kartu harus identik dengan yang tampil di tabel untuk halaman/filter yang sama.
