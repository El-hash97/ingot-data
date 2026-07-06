# Input Page Redesign — Stok Awal, Table, Share JPG

## Context

Halaman `src/app/input/page.tsx` menampilkan form input pergerakan stok ingot. Tema visual mengikuti `DESIGN.md` (Lamborghini-inspired: kanvas hitam `#000000`, aksen gold `#FFC000`, radius 0). Tiga masalah yang diselesaikan:

1. Section pada form (Informasi Operator / Waktu / Data Stok) sulit dibedakan karena `--border` dan `--card` di `globals.css` memakai warna yang sama (`#202020`), sehingga batas antar-card nyaris tidak terlihat.
2. Stok Awal (carry-over dari `akhir` entri terakhir) sudah dihitung di kode (`prevAkhir`) tapi tidak pernah ditampilkan ke operator, dan **tidak pernah dipakai dalam rumus** — `akhir` dihitung hanya dari `masuk - pakai - buang`, mengabaikan stok sebelumnya. Ini bug laten yang harus diperbaiki bersamaan.
3. Tidak ada cara membagikan hasil input (mis. ke grup WhatsApp shift) selain lewat halaman Riwayat/export CSV.

## Goals

- Redesain visual section Input Data agar section-nya jelas terpisah, tetap dalam tema dark/gold yang sudah ada (tidak mengubah token warna global).
- Tampilkan Stok Awal sebagai baris terkunci (read-only) dalam tabel Data Stok, diambil otomatis dari entri terakhir.
- Perbaiki rumus: `Stok Akhir = Stok Awal + Masuk − Pakai − Buang`.
- Setelah simpan berhasil, tampilkan dialog kartu ringkasan (receipt) dengan tombol untuk export/share kartu tersebut sebagai file JPG.

## Non-goals

- Tidak mengubah `globals.css` / token tema global (hanya override lokal di halaman Input).
- Tidak menambah kolom `awal` ke `IngotEntry` / localStorage schema — Stok Awal untuk receipt cukup disimpan di state komponen saat submit, tidak perlu persist permanen (Riwayat tidak menampilkan kolom ini).
- Tidak mengubah halaman Riwayat atau Dashboard.

## Design

### 1. Layout & Contrast

- Card tunggal dengan `Separator` internal diganti jadi 3 `Card` terpisah (Informasi Operator, Waktu, Data Stok), disusun dengan `space-y-5`.
- Tiap `Card` diberi `border-white/10` (override lokal, lebih terlihat dibanding `--border` default) dan sedikit elevasi (`bg-card` tetap `#202020`, tapi border kontras membuat batas jelas di atas kanvas hitam `#000000`).
- `SectionTitle` (label uppercase kecil) diberi aksen garis gold pendek di kiri teks untuk penanda visual tambahan.
- Actions bar (`Reset` / `Simpan Data`) tetap sebagai bagian bawah, dipisahkan sebagai elemen sendiri (bukan lagi menyatu di card terakhir via divider), dengan `border-white/10` juga.

### 2. Tabel Data Stok

Ganti grid 3-kolom input dengan `Table` (komponen `@/components/ui/table` yang sudah dipakai di Riwayat):

| Baris | Kolom Kiri (label) | Kolom Kanan (nilai) | Editable? |
|---|---|---|---|
| 1 | Stok Awal | angka, badge "Terkunci" | Tidak — `disabled`, diisi dari `stokAwal` |
| 2 | Total Ingot Masuk | `<Input type=number>` | Ya |
| 3 | Pakai Produksi | `<Input type=number>` | Ya |
| 4 | Buang / Reject | `<Input type=number>` | Ya |
| 5 (footer, highlight) | Stok Akhir (Otomatis) | nilai besar, gold/merah | Tidak — dihitung |

- `stokAwal` dihitung dari `getAllEntries()` sort terbaru → `sorted[0]?.akhir ?? 0`, di-load saat mount dan setiap kali form berhasil submit (agar entri berikutnya lanjut dari stok terbaru).
- Baris antar row pakai `divide-y border-white/10` supaya kelihatan jelas.
- Rumus akhir (baik live-preview di form maupun saat disimpan):
  `akhir = stokAwal + masuk - pakai - buang`.
- Baris Stok Akhir tetap pakai styling `isNegative` yang sudah ada (border/bg destructive vs primary).

### 3. Dialog Receipt + Share JPG

- State baru `receipt: (IngotEntry & { stokAwal: number }) | null`. Diisi saat submit sukses (menggantikan langsung reset+toast).
- `Dialog` (komponen yang sudah ada, dipakai juga di Riwayat untuk confirm) menampilkan kartu ringkasan saat `receipt !== null`:
  - Header: "INGOT MONITOR" kecil uppercase + tanggal/waktu simpan.
  - Baris data: Operator, Shift (badge merah/putih sesuai existing `ShiftBadge` pattern), Waktu (Day/Night), Tanggal, Stok Awal, Masuk, Pakai, Buang.
  - Footer ditonjolkan: **Stok Akhir** besar, gold (atau merah bila negatif).
  - Kartu ini dirender dalam elemen dengan `ref` (`receiptRef`) agar bisa di-capture ke gambar.
- Tombol dialog:
  - **"Share sebagai JPG"** (primary, icon share):
    1. `htmlToImage.toJpeg(receiptRef.current, { quality: 0.95, backgroundColor: "#000000" })` dari library baru `html-to-image`.
    2. Convert dataURL → `Blob` → `File`.
    3. Jika `navigator.canShare?.({ files: [file] })` true → `navigator.share({ files: [file], title, text })`.
    4. Jika tidak didukung → fallback: buat `<a>` dengan `href` dataURL, `download="ingot-{date}-{shift}.jpg"`, klik otomatis.
    5. Tampilkan `toast.success`/`toast.error` sesuai hasil.
  - **"Tutup"** (outline): set `receipt` ke `null` (form sudah direset lebih dulu saat submit sukses, independen dari state receipt).
- Toast sukses lama (`toast.success("Data berhasil disimpan!", ...)`) dihapus — digantikan oleh dialog receipt yang lebih informatif. Toast error validasi tetap ada.

### 4. Dependency baru

- Tambah `html-to-image` ke `package.json` (`npm install html-to-image`). Dipilih karena ringan, tanpa native binding, dan hasil lebih akurat untuk CSS modern dibanding `html2canvas`.

## Error Handling

- Jika `navigator.share` gagal/dibatalkan user (`AbortError`) → tidak tampilkan error toast (silent, karena itu aksi user membatalkan sendiri).
- Jika gagal generate image (exception dari `html-to-image`) → `toast.error("Gagal membuat gambar. Coba lagi.")`.
- Jika browser tidak mendukung `navigator.share` maupun file download (sangat jarang) → fallback ke download tetap jalan karena hanya mengandalkan anchor+dataURL, bukan API browser khusus.

## Testing / Verification

- Manual: isi form → submit → cek Stok Awal baris pertama terkunci dan sesuai entri terakhir → cek Stok Akhir = stokAwal+masuk-pakai-buang → cek dialog receipt muncul dengan data benar → klik Share sebagai JPG → cek file JPG ter-download (desktop) berisi kartu ringkasan yang terbaca jelas → cek entri baru berikutnya, Stok Awal baris pertama ikut naik/turun sesuai entri sebelumnya.
- Visual: bandingkan section-section form terlihat jelas terpisah di atas background hitam.
