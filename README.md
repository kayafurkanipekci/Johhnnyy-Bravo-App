# Johnny Bravo Media Tools

Johnny Bravo Media Tools is a professional-grade, cross-platform desktop application designed for high-performance YouTube media downloading and versatile file conversion. Rebuilt from the ground up using **Tauri v2**, **TypeScript**, and **Vite**, it offers a lightweight and secure environment for media processing.

## Download and Installation (For End Users)

The application provides pre-compiled binaries for major operating systems. Technical dependencies such as Node.js or Rust are **not required** for users who download these standalone versions.

### How to Download
Navigate to the [GitHub Releases](https://github.com/kayafurkanipekci/Johhnnyy-Bravo-App/releases) page to obtain the latest installer suitable for your platform:
- **Windows**: `.exe` or `.msi` installers.
- **Linux**: `.deb` or AppImage packages.
- **macOS**: `.dmg` disk images.

Simply download the appropriate file for your system and run the installer to begin using the application.

---

## Features

### YouTube Media Downloader
Powered by a robust implementation of `yt-dlp`, the downloader supports:
- Video downloads in multiple resolutions (Best, 1080p, 720p, 480p).
- Direct audio extraction to MP3 format.
- Real-time progress monitoring, including download speed and estimated time of arrival (ETA).
- Integrated update mechanism for sidecar binaries to ensure compatibility with YouTube's latest changes.

### Universal File Converter
Utilizing `ffmpeg`, the application supports an extensive range of conversion workflows:
- **Video Formats**: MP4, AVI, MKV, MOV, WebM, FLV, WMV, MPEG, MPG, M4V, 3GP, TS, GIF.
- **Audio Formats**: MP3, WAV, M4A, FLAC, OGG, OPUS, AAC, WMA.
- **Image Formats**: PNG, JPG, JPEG, WEBP, BMP, TIFF, ICO (Input support for HEIC/HEIF).
- **Specialized Processing**: Video compression, and high-fidelity audio extraction.

### PDF Management Suite
A comprehensive set of tools for document manipulation:
- Merging multiple PDF files into a single document.
- Splitting PDF pages into individual files.
- Converting PDF pages to PNG images.
- Assembling a collection of images into a professional PDF document.

---

## Developer Documentation (Build from Source)

If you intend to contribute to the project or build it manually from the repository, please follow the instructions below.

### Prerequisites
The following tools must be installed on your development system:
- **Rust**: Required for compiling the Tauri backend ([rustup.rs](https://rustup.rs/)).
- **Node.js**: Version 18 or higher.
- **FFmpeg**: Must be available in the system PATH for the setup script to detect and package it as a sidecar binary.

### Local Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/kayafurkanipekci/Johhnnyy-Bravo-App.git
   cd Johhnnyy-Bravo-App
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure sidecar binaries**:
   Run the following script to automatically download and prepare `yt-dlp` and `ffmpeg` binaries for your specific architecture:
   ```bash
   npm run setup-sidecars
   ```
4. **Launch development environment**:
   ```bash
   npm run tauri dev
   ```

### Production Build
To generate platform-specific installers, execute:
```bash
npm run tauri build
```
The resulting binaries will be located in the `src-tauri/target/release/bundle/` directory.

---

## Versioning and Migration History

The project has undergone a significant architectural shift. 

### Transition from Python to Tauri
Version 1.0 of Johnny Bravo Media Tools was developed using Python (with `ttkbootstrap` and `PyInstaller`). However, a critical limitation was identified: `yt-dlp` instances bundled within a PyInstaller-generated executable often failed to self-update, leading to broken functionality as streaming services updated their protocols.

To resolve this, the project migrated to Tauri v2. This architecture utilizes a "sidecar" approach where `yt-dlp` and `ffmpeg` operate as independent binaries controlled by a secure Rust backend. This ensures that `yt-dlp` can update itself successfully without affecting the integrity of the main application.

### Legacy Access
The original Python-based source code is preserved in the `python` branch for historical reference. Please note that the Python version is no longer actively maintained and does not include the modern fixes found in the current Tauri release.

### Developer Note
This project is part of a continuous learning journey. As a student developer, I researched various frameworks and identified Tauri as the most efficient and modern solution for cross-platform desktop development. Its focus on performance, security, and small executable sizes represents a significant improvement over the previous implementation.
