# Johnny Bravo Media Tools

A lightweight, modern desktop application for downloading YouTube videos and converting local media files. Built with Python, `ttkbootstrap`, `yt-dlp`, and `ffmpeg-python`.

## Download (Recommended)

The easiest way to use this application is to download the latest pre-compiled `.exe` file. This single file runs on any Windows computer and requires no installation or Python setup.

[**Go to the GitHub Releases page to download the latest `.exe`**](https://github.com/kayafurkanipekci/Johhnnyy-Bravo-App/releases)

---

## Features

* **YouTube Downloader:**
    * Download videos in various resolutions (Best, 1080p, 720p, etc.).
    * Extract audio directly to MP3.
    * Real-time download progress bar and stats.
    * Supports using a `cookies.txt` file to bypass "bot" detection.
* **File Converter:**
    * Reliable media conversion powered directly by `ffmpeg`.
    * Video-to-Video: MP4, AVI, MKV.
    * Audio-to-Audio: MP3, WAV, M4A.
    * Video-to-Audio: Extract audio (MP3) from any video file.
* **Built-in Updater:**
    * Keep the `yt-dlp` library up-to-date with a single click.

---

## How to Use the Cookies Feature (Bypass Bot Blocks)

Sometimes, YouTube may block downloads and show an error like *"Sign in to confirm you're not a bot"* or fail on age-restricted content.

Using the **"Load Cookies.txt"** feature bypasses this. It tells `yt-dlp` to make the download request as if it were your logged-in browser, not a bot.

### Step-by-Step Guide:

1.  **Install a Cookie Exporter Extension:**
    * Go to your browser's extension store (Chrome, Firefox, Edge, etc.).
    * Search for and install an extension named **"Cookie-Editor"** or **"Get cookies.txt"**.

2.  **Go to YouTube:**
    * Open `youtube.com` in your browser.
    * Make sure you are logged into your YouTube/Google account.

3.  **Export Your Cookies:**
    * Click the icon for the "Cookie-Editor" extension you just installed.
    * Find the "Export" button.
    * Choose the format **"Export as TXT"** (or "Export Cookies as `cookies.txt`").
    * This will download a file, usually named `cookies.txt` or `youtube.com_cookies.txt`. Save it somewhere safe.

4.  **Load Cookies into the App:**
    * Open the "Johnny Bravo Media Tools" application and go to the "YouTube Downloader".
    * Click the **"Load Cookies.txt"** button.
    * Select the `cookies.txt` file you just downloaded.

5.  **Done!**
    * The status label in the app will turn green and say "Active: cookies.txt" (or similar).
    * You can now download age-restricted videos, private videos (that you have access to), or bypass most "bot" detection errors.

---

## Setup (for Developers)

This section is for users who want to run the application directly from the Python source code.

### 1. Prerequisites (Crucial!)

Before you run the application, you **MUST** have `ffmpeg` installed on your system.

#### What is `ffmpeg`?

`ffmpeg` is the core engine that handles ALL media conversion and merging. Both `yt-dlp` (for merging video+audio) and the File Converter *require* it.

#### How to Install `ffmpeg`

The easiest way is using a package manager on Windows:

**Option 1: Scoop (Recommended)**
```powershell
scoop install ffmpeg
```

**Option 2: Chocolatey**
```powershell
choco install ffmpeg
```

If you install it manually, you MUST add the `ffmpeg.exe` and `ffprobe.exe` folder (usually C:\ffmpeg\bin) to your system's PATH environment variable.

### 2. Setup and Running the Source Code

**Clone the Repository:**
```powershell
git clone https://github.com/kayafurkanipekci/Johhnnyy-Bravo-App.git
cd Johhnnyy-Bravo-App
```

**Create a Stable Python Environment (Recommended):**

This project is tested and stable on Python 3.11 and 3.12. It is not recommended to use Python 3.13+ until all libraries are fully compatible.

```powershell
# Use a specific, stable Python version (e.g., 3.11) to create the venv
py -3.11 -m venv venv

# Activate the virtual environment
.\venv\Scripts\activate
```

**Install Dependencies:
(While your venv is active)**

```powershell
pip install -r requirements.txt
```

**Run the Application:
(While your venv is active)**

```powershell
python main.py
```
