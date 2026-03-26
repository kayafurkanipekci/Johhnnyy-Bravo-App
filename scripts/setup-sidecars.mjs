#!/usr/bin/env node
/**
 * Setup Sidecars Script
 * Downloads yt-dlp and ffmpeg binaries for the current platform
 * and places them in src-tauri/binaries/ with correct naming.
 *
 * Usage: node scripts/setup-sidecars.mjs
 */

import { execSync } from 'child_process';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BINARIES_DIR = path.join(__dirname, '..', 'src-tauri', 'binaries');

// Get target triple
const targetTriple = execSync('rustc --print host-tuple').toString().trim();
const isWindows = process.platform === 'win32';
const ext = isWindows ? '.exe' : '';

console.log(`\n🎯 Platform: ${targetTriple}`);
console.log(`📁 Binaries dir: ${BINARIES_DIR}\n`);

// Ensure directory exists
fs.mkdirSync(BINARIES_DIR, { recursive: true });

// ===== Download Helper =====

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`  ⬇️  Downloading: ${url}`);
    const follow = (url) => {
      https.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          follow(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const file = fs.createWriteStream(destPath);
        let downloaded = 0;
        const total = parseInt(res.headers['content-length'] || '0', 10);

        res.on('data', (chunk) => {
          downloaded += chunk.length;
          if (total > 0) {
            const pct = ((downloaded / total) * 100).toFixed(1);
            process.stdout.write(`\r  📦 ${pct}% (${(downloaded / 1048576).toFixed(1)} MB)`);
          }
        });
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`\n  ✅ Saved: ${path.basename(destPath)}`);
          // Set executable permissions on Unix
          if (!isWindows) {
            fs.chmodSync(destPath, 0o755);
          }
          resolve();
        });
      }).on('error', reject);
    };
    follow(url);
  });
}

// ===== yt-dlp =====

async function setupYtDlp() {
  console.log('📥 Setting up yt-dlp...');
  const destName = `yt-dlp-${targetTriple}${ext}`;
  const destPath = path.join(BINARIES_DIR, destName);

  if (fs.existsSync(destPath)) {
    console.log(`  ⏭️  Already exists: ${destName}`);
    return;
  }

  // Determine download URL based on platform
  let fileName;
  if (isWindows) {
    fileName = 'yt-dlp.exe';
  } else if (process.platform === 'darwin') {
    fileName = 'yt-dlp_macos';
  } else {
    fileName = 'yt-dlp_linux';
  }

  const url = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${fileName}`;
  await downloadFile(url, destPath);
}

// ===== ffmpeg =====

async function setupFfmpeg() {
  console.log('\n📥 Setting up ffmpeg...');

  const ffmpegDest = path.join(BINARIES_DIR, `ffmpeg-${targetTriple}${ext}`);
  const ffprobeDest = path.join(BINARIES_DIR, `ffprobe-${targetTriple}${ext}`);

  if (fs.existsSync(ffmpegDest) && fs.existsSync(ffprobeDest)) {
    console.log('  ⏭️  Already exists: ffmpeg & ffprobe');
    return;
  }

  if (isWindows) {
    console.log('  ℹ️  For Windows, please download ffmpeg manually:');
    console.log('     https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip');
    console.log(`  Then place ffmpeg.exe and ffprobe.exe in: ${BINARIES_DIR}`);
    console.log(`  Rename them to:`);
    console.log(`    ffmpeg-${targetTriple}.exe`);
    console.log(`    ffprobe-${targetTriple}.exe`);
    console.log('');
    console.log('  Or if you have ffmpeg installed, you can copy them:');

    // Try to find existing ffmpeg
    try {
      const pathsFfmpeg = execSync('where ffmpeg').toString().trim().split('\n').map(p => p.trim());
      const pathsFfprobe = execSync('where ffprobe').toString().trim().split('\n').map(p => p.trim());
      
      let ffmpegPath = pathsFfmpeg[0];
      let ffprobePath = pathsFfprobe[0];

      // Handle Chocolatey shims
      if (ffmpegPath && ffmpegPath.toLowerCase().includes('chocolatey\\bin')) {
        const chocPath = path.join(process.env.ProgramData || 'C:\\ProgramData', 'chocolatey\\lib\\ffmpeg\\tools\\ffmpeg\\bin\\ffmpeg.exe');
        if (fs.existsSync(chocPath)) {
          ffmpegPath = chocPath;
        }
      }
      if (ffprobePath && ffprobePath.toLowerCase().includes('chocolatey\\bin')) {
        const chocPath = path.join(process.env.ProgramData || 'C:\\ProgramData', 'chocolatey\\lib\\ffmpeg\\tools\\ffmpeg\\bin\\ffprobe.exe');
        if (fs.existsSync(chocPath)) {
          ffprobePath = chocPath;
        }
      }

      if (ffmpegPath && ffprobePath) {
        console.log(`  Found ffmpeg at: ${ffmpegPath}`);
        console.log(`  Found ffprobe at: ${ffprobePath}`);
        
        // Also verify file sizes to ensure they're real binaries, not shims
        const sizeMg = fs.statSync(ffmpegPath).size / (1024 * 1024);
        if (sizeMg < 1) {
          console.log(`  ⚠️  Warning: ${ffmpegPath} seems too small (${sizeMg.toFixed(2)} MB), it might be a shim wrapper.`);
        }

        // Copy sidecar triple variants (for Tauri sidecar resolution)
        fs.copyFileSync(ffmpegPath, ffmpegDest);
        fs.copyFileSync(ffprobePath, ffprobeDest);
        
        // Copy standard variants (for yt-dlp internal finding via --ffmpeg-location)
        fs.copyFileSync(ffmpegPath, path.join(BINARIES_DIR, `ffmpeg${ext}`));
        fs.copyFileSync(ffprobePath, path.join(BINARIES_DIR, `ffprobe${ext}`));

        console.log('  ✅ Copied from system installation!');
        return;
      }
    } catch (e) {
      console.log('  ⚠️  ffmpeg not found in PATH. Please install it manually.', e.message || '');
    }
  } else {
    // On macOS/Linux, try to find system ffmpeg
    try {
      const ffmpegPath = execSync('which ffmpeg').toString().trim();
      const ffprobePath = execSync('which ffprobe').toString().trim();
      if (ffmpegPath && ffprobePath) {
        // Target triple variants (For Tauri)
        fs.copyFileSync(ffmpegPath, ffmpegDest);
        fs.copyFileSync(ffprobePath, ffprobeDest);
        
        // Clean name variants (For yt-dlp)
        fs.copyFileSync(ffmpegPath, path.join(BINARIES_DIR, `ffmpeg${ext}`));
        fs.copyFileSync(ffprobePath, path.join(BINARIES_DIR, `ffprobe${ext}`));

        fs.chmodSync(ffmpegDest, 0o755);
        fs.chmodSync(ffprobeDest, 0o755);
        fs.chmodSync(path.join(BINARIES_DIR, `ffmpeg${ext}`), 0o755);
        fs.chmodSync(path.join(BINARIES_DIR, `ffprobe${ext}`), 0o755);

        console.log('  ✅ Copied from system installation!');
        return;
      }
    } catch {
      console.log('  ⚠️  ffmpeg not found. Please install: brew install ffmpeg (macOS) or sudo apt install ffmpeg (Linux)');
    }
  }
}

// ===== Main =====

async function main() {
  console.log('🚀 Johnny Bravo — Sidecar Setup\n');
  await setupYtDlp();
  await setupFfmpeg();
  console.log('\n🎉 Setup complete!\n');
}

main().catch(err => {
  console.error('❌ Setup failed:', err);
  process.exit(1);
});
