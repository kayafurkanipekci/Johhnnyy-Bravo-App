# Johnny Bravo Media Tools v2

A modern, cross-platform desktop application for downloading YouTube media and converting files between formats. Built with **Tauri v2**, **TypeScript**, and **Vite**.

> ⚡ Powered by [yt-dlp](https://github.com/yt-dlp/yt-dlp) and [ffmpeg](https://ffmpeg.org/) as sidecar binaries — no Python required!

## Features

### YouTube Downloader
- Download videos in various resolutions (Best, 1080p, 720p, 480p)
- Extract audio directly to MP3
- Real-time download progress with speed and ETA
- Cookie file support for bypassing bot detection
- **One-click yt-dlp updates** that actually work!

### File Converter
Powered by ffmpeg with 20+ conversion options:

**Video:** MP4 ↔ AVI, MKV ↔ MP4, MOV → MP4, WebM → MP4, FLV → MP4, MP4 → GIF, GIF → MP4

**Audio:** WAV ↔ MP3, M4A ↔ MP3, FLAC → MP3, OGG → MP3, OPUS → MP3, AAC → MP3, WAV → FLAC

**Extract:** Video → MP3, Video → WAV, Video → FLAC

**Process:** Video compression

## Prerequisites

- [Rust](https://rustup.rs/) (for building the Tauri backend)
- [Node.js](https://nodejs.org/) v18+
- ffmpeg installed on your system (`scoop install ffmpeg` or `choco install ffmpeg` on Windows)

## Setup

```bash
# Install dependencies
npm install

# Download sidecar binaries (yt-dlp + ffmpeg)
npm run setup-sidecars

# Start development server
npm run tauri dev
```

## Build for Production

```bash
npm run tauri build
```

This creates platform-specific installers in `src-tauri/target/release/bundle/`.

## Architecture

- **Frontend:** Vite + Vanilla TypeScript (SPA with hash-based routing)
- **Backend:** Tauri v2 (Rust) — minimal, handles plugin registration
- **yt-dlp:** Standalone binary (sidecar) — can self-update via `--update`
- **ffmpeg:** Standalone binary (sidecar) — handles all media conversion

## Why Tauri?

This project was migrated from Python (ttkbootstrap + PyInstaller) to solve a fundamental problem: **yt-dlp bundled inside a PyInstaller exe cannot update itself**. With Tauri's sidecar approach, yt-dlp runs as a standalone binary that can self-update, making the app always work with YouTube's latest changes.
