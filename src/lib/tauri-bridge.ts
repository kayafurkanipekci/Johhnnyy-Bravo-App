// Tauri Bridge — Wraps Tauri APIs for clean usage in pages

import { Command } from '@tauri-apps/plugin-shell';
import { open, save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';

// ===================== TYPES =====================

export interface DownloadProgress {
  percent: string;
  speed: string;
  eta: string;
  status: 'downloading' | 'finished' | 'error';
  message?: string;
}

export interface DownloadOptions {
  type: 'video' | 'audio';
  resolution?: string;
  cookieFile?: string;
}

export interface ConvertOptions {
  inputPath: string;
  outputPath: string;
  args: string[];
}


// ===================== DIALOGS =====================

export async function pickDirectory(): Promise<string | null> {
  const result = await open({ directory: true, title: 'Select Download Directory' });
  return result as string | null;
}

export async function pickFile(title: string, extensions: string[]): Promise<string | null> {
  const result = await open({
    title,
    filters: [{ name: 'Files', extensions }]
  });
  return result as string | null;
}

export async function saveFile(title: string, extensions: string[], defaultName?: string): Promise<string | null> {
  const result = await save({
    title,
    filters: [{ name: 'Files', extensions }],
    defaultPath: defaultName
  });
  return result as string | null;
}

// ===================== YT-DLP =====================

export async function getYtDlpVersion(): Promise<string> {
  try {
    const command = Command.sidecar('binaries/yt-dlp', ['--version']);
    const output = await command.execute();
    return output.stdout.trim() || 'unknown';
  } catch {
    return 'not found';
  }
}

export async function updateYtDlp(
  onProgress: (msg: string) => void,
  onDone: (success: boolean, msg: string) => void
): Promise<void> {
  try {
    onProgress('Checking for updates...');
    const command = Command.sidecar('binaries/yt-dlp', ['--update']);
    const output = await command.execute();

    const fullOutput = output.stdout + output.stderr;

    if (output.code === 0) {
      if (fullOutput.includes('up to date') || fullOutput.includes('Up-to-date')) {
        onDone(true, 'yt-dlp is already up to date!');
      } else {
        onDone(true, 'yt-dlp updated successfully!');
      }
    } else {
      onDone(false, `Update failed: ${fullOutput.slice(0, 200)}`);
    }
  } catch (err) {
    onDone(false, `Update error: ${err}`);
  }
}

export async function getFFmpegPath(): Promise<string | null> {
  try {
    return await invoke<string>('get_sidecar_path', { name: 'binaries/ffmpeg' });
  } catch {
    return null;
  }
}

export async function startDownloadAsync(
  url: string,
  outputDir: string,
  options: DownloadOptions,
  onProgress: (progress: DownloadProgress) => void,
  onDone: (success: boolean, message: string) => void
): Promise<{ kill: () => void }> {
  const args: string[] = [];

  // Get ffmpeg location for merging video+audio
  const ffmpegPath = await getFFmpegPath();
  if (ffmpegPath) {
    // Pass the directory containing ffmpeg, not the binary itself
    const ffmpegDir = ffmpegPath.replace(/[\\/][^\\/]+$/, '');
    args.push('--ffmpeg-location', ffmpegDir);
  }

  if (options.type === 'video') {
    const res = options.resolution || '1080';
    if (res === 'best') {
      args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best');
    } else {
      args.push('-f', `bestvideo[height<=${res}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${res}][ext=mp4]/best`);
    }
    args.push('--merge-output-format', 'mp4');
  } else {
    args.push('-f', 'bestaudio/best');
    args.push('-x', '--audio-format', 'mp3', '--audio-quality', '192K');
  }

  args.push('-o', `${outputDir}/%(title)s.%(ext)s`);
  args.push('--newline');
  args.push('--no-colors');

  if (options.cookieFile) {
    args.push('--cookies', options.cookieFile);
  }

  args.push(url);

  let killed = false;
  let childProcess: any = null;

  const command = Command.sidecar('binaries/yt-dlp', args);

  command.stdout.on('data', (line: string) => {
    if (killed) return;

    // Parse yt-dlp progress output
    // Example: "[download]  45.2% of ~150.30MiB at 5.23MiB/s ETA 00:15"
    const progressMatch = line.match(/\[download\]\s+([\d.]+)%\s+of\s+~?([\S]+)\s+at\s+([\S]+)\s+ETA\s+([\S]+)/);
    if (progressMatch) {
      onProgress({
        percent: progressMatch[1],
        speed: progressMatch[3],
        eta: progressMatch[4],
        status: 'downloading'
      });
      return;
    }

    // Merger / Already downloaded
    if (line.includes('[Merger]') || line.includes('Merging formats')) {
      onProgress({
        percent: '100',
        speed: '-',
        eta: '-',
        status: 'downloading',
        message: 'Merging video and audio...'
      });
      return;
    }

    // User requested error handling for already downloaded items
    if (line.includes('has already been downloaded')) {
      onDone(false, 'Warning: The file you are trying to download already exists in the selected folder!');
      return;
    }

    if (line.includes('[ExtractAudio]') || line.includes('Deleting original')) {
      onProgress({
        percent: '100',
        speed: '-',
        eta: '-',
        status: 'downloading',
        message: 'Extracting audio...'
      });
    }
  });

  let stderrOutput = '';
  command.stderr.on('data', (line: string) => {
    if (killed) return;
    stderrOutput += line + '\n';
    console.error('[yt-dlp stderr]', line);
  });

  command.on('close', (data) => {
    if (killed) return;
    if (data.code === 0) {
      onDone(true, 'Download completed successfully!');
    } else {
      const errMsg = stderrOutput.trim().split('\n').pop() || `exit code ${data.code}`;
      onDone(false, `Download failed: ${errMsg.slice(0, 200)}`);
    }
  });

  command.on('error', (err) => {
    if (killed) return;
    onDone(false, `Error: ${err}`);
  });

  try {
    childProcess = await command.spawn();
  } catch (err) {
    onDone(false, `Failed to start yt-dlp: ${err}`);
  }

  return {
    kill: () => {
      killed = true;
      if (childProcess) {
        childProcess.kill().catch(() => {});
      }
    }
  };
}

// ===================== FFMPEG =====================

export function startConversion(
  inputPath: string,
  outputPath: string,
  ffmpegArgs: string[],
  onProgress: (percent: number, message: string) => void,
  onDone: (success: boolean, message: string) => void
): { kill: () => void } {
  // Build full args: -i input [extra args] -progress pipe:1 -y output
  const args = [
    '-i', inputPath,
    ...ffmpegArgs,
    '-progress', 'pipe:1',
    '-y',
    outputPath
  ];

  let killed = false;
  let duration = 0;
  let childProcess: any = null;

  const command = Command.sidecar('binaries/ffmpeg', args);

  // stderr handling moved to combined handler below

  command.stdout.on('data', (line: string) => {
    if (killed) return;
    // Parse progress from -progress pipe:1 output
    const timeMatch = line.match(/out_time_ms=(\d+)/);
    if (timeMatch && duration > 0) {
      const currentSec = parseInt(timeMatch[1]) / 1000000;
      const percent = Math.min(100, Math.round((currentSec / duration) * 100));
      onProgress(percent, `Converting... ${percent}%`);
    }

    if (line.includes('progress=end')) {
      onProgress(100, 'Conversion complete!');
    }
  });

  let stderrConv = '';
  const origStderr = command.stderr;
  origStderr.on('data', (line: string) => {
    if (killed) return;
    stderrConv += line + '\n';
    // Also keep original duration parsing
    const durMatch = line.match(/Duration:\s*(\d+):(\d+):(\d+)/);
    if (durMatch) {
      duration = parseInt(durMatch[1]) * 3600 + parseInt(durMatch[2]) * 60 + parseInt(durMatch[3]);
    }
  });

  command.on('close', (data) => {
    if (killed) return;
    if (data.code === 0) {
      onDone(true, 'Conversion completed successfully!');
    } else {
      const errMsg = stderrConv.trim().split('\n').pop() || `exit code ${data.code}`;
      onDone(false, `Conversion failed: ${errMsg.slice(0, 200)}`);
    }
  });

  command.on('error', (err) => {
    if (killed) return;
    onDone(false, `Error: ${err}`);
  });

  command.spawn()
    .then(child => {
      childProcess = child;
    })
    .catch((err) => {
      onDone(false, `Failed to start ffmpeg: ${err}`);
    });

  return {
    kill: () => {
      killed = true;
      if (childProcess) {
        childProcess.kill().catch(() => {});
      }
    }
  };
}

// ===================== RUST COMMANDS =====================

export async function ensureYtDlpInAppData(): Promise<string> {
  return await invoke<string>('ensure_ytdlp_in_appdata');
}

export async function getSidecarPath(name: string): Promise<string> {
  return await invoke<string>('get_sidecar_path', { name });
}
