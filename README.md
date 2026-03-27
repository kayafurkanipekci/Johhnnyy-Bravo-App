# Johnny Bravo Medya Araçları v2

YouTube üzerinden medya indirme ve farklı formatlar arasında dosya dönüştürme işlemlerini gerçekleştiren, çapraz platform destekli modern bir masaüstü uygulamasıdır. **Tauri v2**, **TypeScript** ve **Vite** kullanılarak geliştirilmiştir.

> [yt-dlp](https://github.com/yt-dlp/yt-dlp) ve [ffmpeg](https://ffmpeg.org/) harici ikili dosyalar (sidecar) olarak kullanılmıştır — Python gereksinimi bulunmamaktadır.

## Sistem Mimarisi ve Sürüm Geçişi Hakkında Önemli Bilgilendirme

Sistemin eski mimarisi artık güncel değildir ve sistem önceki halinde olduğu gibi çalışmamaktadır. Proje, Python tabanlı (ttkbootstrap + PyInstaller) yapıdan Tauri mimarisine geçirilmiştir. Bunun temel sebebi, PyInstaller içerisine gömülen yt-dlp uygulamasının kendi kendini güncelleyememesidir. Tauri yaklaşımı sayesinde, yt-dlp bağımsız bir uygulama olarak çalışmakta ve kendini güncelleyebilmektedir.

Mevcut geliştirme süreci `tauri-migration` dalı üzerinden yürütülmektedir ve bu dal ilerleyen dönemde `main` dalı ile birleştirilecektir. Eski Python sürümünün korunması amacıyla `python` adında yeni bir dal oluşturulacak ve projenin eski hali o dal üzerinde saklanacaktır.

## Özellikler

### YouTube İndirici
- Videoları çeşitli çözünürlüklerde (En İyi, 1080p, 720p, 480p) indirebilme
- Sesi doğrudan MP3 formatında çıkarabilme
- Hız ve tahmini tamamlanma süresi ile gerçek zamanlı indirme durumu gösterimi
- Bot korumalarını atlatabilmek için çerez (cookie) dosyası desteği
- Sorunsuz çalışan **tek tıklama ile yt-dlp güncelleme** imkanı

### Dosya Dönüştürücü
ffmpeg altyapısı ile 20'den fazla dönüştürme seçeneği sunulmaktadır:

**Video:** MP4 ↔ AVI, MKV ↔ MP4, MOV → MP4, WebM → MP4, FLV → MP4, MP4 → GIF, GIF → MP4

**Ses:** WAV ↔ MP3, M4A ↔ MP3, FLAC → MP3, OGG → MP3, OPUS → MP3, AAC → MP3, WAV → FLAC

**Ayrıştırma:** Video → MP3, Video → WAV, Video → FLAC

**İşlem:** Video sıkıştırma

## Önkoşullar

- [Rust](https://rustup.rs/) (Tauri arka plan hizmetlerini derlemek için)
- [Node.js](https://nodejs.org/) v18 veya üzeri sürüm
- Sisteminize kurulu ffmpeg (Windows üzerinde `scoop install ffmpeg` veya `choco install ffmpeg` kullanılabilir)

## Kurulum

```bash
# Bağımlılıkları yükleyin
npm install

# Harici ikili dosyaları (yt-dlp + ffmpeg) indirin
npm run setup-sidecars

# Geliştirme sunucusunu başlatın
npm run tauri dev
```

## Üretim İçin Derleme

```bash
npm run tauri build
```

Bu işlem, `src-tauri/target/release/bundle/` dizini içerisinde platforma özel kurulum dosyalarını oluşturacaktır.

## Mimari

- **Önyüz (Frontend):** Vite ve Saf (Vanilla) TypeScript (Hash tabanlı yönlendirme kullanan Tek Sayfa Uygulaması)
- **Arka Plan (Backend):** Tauri v2 (Rust) — asgari düzeyde eklenti kaydını yönetir
- **yt-dlp:** Bağımsız ikili dosya (sidecar) — `--update` komutu ile kendini güncelleyebilir
- **ffmpeg:** Bağımsız ikili dosya (sidecar) — tüm medya dönüştürme işlemlerini üstlenir
