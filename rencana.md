# Panduan Lengkap Deploy CoreShield ke Server Production (VPS/Cloud)

Dokumen ini berisi panduan langkah demi langkah yang spesifik untuk mendeploy aplikasi CoreShield menggunakan Docker ke server Anda (seperti Ubuntu VPS).

## Langkah 1: Akses Server Anda

Buka terminal/CMD/PowerShell di komputer lokal Anda, lalu remote masuk ke server Anda menggunakan koneksi SSH. Pastikan mengubah `username` dan `ip_address_server` dengan data yang tepat.

```bash
ssh username@ip_address_server
```

## Langkah 2: Install Git, Docker, dan Docker Compose

Jika server Anda adalah server baru (terutama berbasis **Ubuntu/Debian**), Anda harus menginstal kebutuhan dasarnya terlebih dahulu.

```bash
# Update repository server
sudo apt update && sudo apt upgrade -y

# Install Git
sudo apt install git -y

# Install Docker
sudo apt install docker.io -y

# Install Docker Compose plugin
sudo apt install docker-compose -y

# Pastikan Docker selalu menyala otomatis saat server di-restart
sudo systemctl enable docker
sudo systemctl start docker
```

## Langkah 3: Clone Repository dari GitHub

Ambil kode proyek Anda yang sudah berhasil di-push ke GitHub sebelumnya.

```bash
# Clone proyek ke dalam server
git clone https://github.com/Setfact/Core-Shield.git

# Pindah ke dalam folder direktori proyek yang baru saja di-clone
cd Core-Shield
```

## Langkah 4: Build dan Jalankan Docker Compose

Sekarang Anda bisa membangun (*build*) image aplikasi dan menjalankannya secara *background* (*detached*). Pastikan posisi Anda di terminal saat ini ada di dalam folder `Core-Shield`.

```bash
# Menjalankan build frontend, backend, lalu menyalakannya
sudo docker-compose up -d --build
```
*Catatan: Langkah ini mungkin akan memakan waktu beberapa menit saat pertama kali dijalankan karena server harus mengunduh beberapa library.*

## Langkah 5: Verifikasi Deployment

Setelah prosesnya selesai, periksa apakah ada error dan pastikan container berstatus `Up` (berjalan).

```bash
# Melihat daftar status container
sudo docker-compose ps

# (Penting) Mengecek Log aplikasi untuk memastikan tidak ada error backend/frontend.
# Anda bisa menekan Ctrl + C untuk keluar dari log.
sudo docker-compose logs -f
```

## Langkah 6: Akses Aplikasi via Browser Web

Aplikasi Anda kini sudah mengudara secara live dan dapat diakses dari internet menggunakan IP Publik (Public IP) dari server Anda:
- **Frontend Panel/Dashboard**: Kunjungi URL `http://ip_address_server` (Browser akan otomatis membaca port 80).
- **Backend API**: Kunjungi URL `http://ip_address_server:8080`.

## Langkah Tambahan: (Opsional) Atur Firewall Server

Jika Anda tidak bisa membuka web Anda setelah menjalankan docker, kemungkinan port di-blokir oleh sistem *Firewall* OS. Jika menggunakan `UFW` (Ubuntu Firewall), ketik ini:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 8080/tcp
sudo ufw reload
```

---

### Tips Maintenance (Pembaruan Kode)
Jika di kemudian hari Anda menambahkan fitur atau mengedit kode di laptop Anda:
1. Push kodenya ke GitHub seperti biasa.
2. Masuk kembali ke SSH Server Anda.
3. Jalankan perintah ini untuk memperbarui server Anda:
   ```bash
   cd Core-Shield
   git pull origin main
   sudo docker-compose up -d --build
   ```
