// File Converter Page — Expanded conversion options with ffmpeg sidecar

import { html } from '../lib/utils';
import { router } from '../lib/router';
import { startConversion, pickFile, saveFile } from '../lib/tauri-bridge';

interface ConversionDef {
  label: string;
  fromExt: string[];
  toExt: string;
  ffmpegArgs: string[];
}

// ===== Conversion Definitions =====

const VIDEO_CONVERSIONS: ConversionDef[] = [
  { label: 'MP4 → AVI',  fromExt: ['mp4'],  toExt: 'avi', ffmpegArgs: ['-c:v', 'libxvid', '-q:v', '4', '-c:a', 'libmp3lame', '-q:a', '4'] },
  { label: 'AVI → MP4',  fromExt: ['avi'],  toExt: 'mp4', ffmpegArgs: ['-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'aac', '-b:a', '192k'] },
  { label: 'MKV → MP4',  fromExt: ['mkv'],  toExt: 'mp4', ffmpegArgs: ['-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k'] },
  { label: 'MP4 → MKV',  fromExt: ['mp4'],  toExt: 'mkv', ffmpegArgs: ['-c:v', 'copy', '-c:a', 'copy'] },
  { label: 'MOV → MP4',  fromExt: ['mov'],  toExt: 'mp4', ffmpegArgs: ['-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'aac', '-b:a', '192k'] },
  { label: 'WebM → MP4', fromExt: ['webm'], toExt: 'mp4', ffmpegArgs: ['-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'aac', '-b:a', '192k'] },
  { label: 'FLV → MP4',  fromExt: ['flv'],  toExt: 'mp4', ffmpegArgs: ['-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'aac', '-b:a', '192k'] },
  { label: 'MP4 → GIF',  fromExt: ['mp4'],  toExt: 'gif', ffmpegArgs: ['-vf', 'fps=12,scale=480:-1:flags=lanczos', '-loop', '0'] },
  { label: 'GIF → MP4',  fromExt: ['gif'],  toExt: 'mp4', ffmpegArgs: ['-movflags', 'faststart', '-pix_fmt', 'yuv420p', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2'] },
];

const AUDIO_CONVERSIONS: ConversionDef[] = [
  { label: 'WAV → MP3',  fromExt: ['wav'],  toExt: 'mp3',  ffmpegArgs: ['-c:a', 'libmp3lame', '-b:a', '192k'] },
  { label: 'MP3 → WAV',  fromExt: ['mp3'],  toExt: 'wav',  ffmpegArgs: ['-c:a', 'pcm_s16le'] },
  { label: 'M4A → MP3',  fromExt: ['m4a'],  toExt: 'mp3',  ffmpegArgs: ['-c:a', 'libmp3lame', '-b:a', '192k'] },
  { label: 'MP3 → M4A',  fromExt: ['mp3'],  toExt: 'm4a',  ffmpegArgs: ['-c:a', 'aac', '-b:a', '192k'] },
  { label: 'FLAC → MP3', fromExt: ['flac'], toExt: 'mp3',  ffmpegArgs: ['-c:a', 'libmp3lame', '-b:a', '320k'] },
  { label: 'OGG → MP3',  fromExt: ['ogg'],  toExt: 'mp3',  ffmpegArgs: ['-c:a', 'libmp3lame', '-b:a', '192k'] },
  { label: 'OPUS → MP3', fromExt: ['opus'], toExt: 'mp3',  ffmpegArgs: ['-c:a', 'libmp3lame', '-b:a', '192k'] },
  { label: 'AAC → MP3',  fromExt: ['aac'],  toExt: 'mp3',  ffmpegArgs: ['-c:a', 'libmp3lame', '-b:a', '192k'] },
  { label: 'WAV → FLAC', fromExt: ['wav'],  toExt: 'flac', ffmpegArgs: ['-c:a', 'flac'] },
];

const EXTRACT_CONVERSIONS: ConversionDef[] = [
  { label: 'Video → MP3',  fromExt: ['mp4', 'avi', 'mkv', 'mov', 'webm', 'flv'], toExt: 'mp3',  ffmpegArgs: ['-vn', '-c:a', 'libmp3lame', '-b:a', '192k'] },
  { label: 'Video → WAV',  fromExt: ['mp4', 'avi', 'mkv', 'mov', 'webm', 'flv'], toExt: 'wav',  ffmpegArgs: ['-vn', '-c:a', 'pcm_s16le'] },
  { label: 'Video → FLAC', fromExt: ['mp4', 'avi', 'mkv', 'mov', 'webm', 'flv'], toExt: 'flac', ffmpegArgs: ['-vn', '-c:a', 'flac'] },
];

const PROCESSING_CONVERSIONS: ConversionDef[] = [
  { label: 'Compress Video', fromExt: ['mp4', 'avi', 'mkv', 'mov', 'webm'], toExt: 'mp4', ffmpegArgs: ['-c:v', 'libx265', '-vtag', 'hvc1', '-preset', 'medium', '-crf', '30', '-c:a', 'aac', '-b:a', '128k'] },
];

// ===== Page Creation =====

export function createConverterPage(): HTMLElement {
  const page = html`
    <div class="page">
      <div class="page-header">
        <button class="back-btn" id="btn-back" type="button">←</button>
        <h1>File Converter</h1>
      </div>

      <div class="converter-sections" id="sections-container"></div>

      <!-- Feedback -->
      <div class="converter-feedback" id="converter-feedback">
        <div class="converter-status-text" id="conv-status">Ready</div>
        <div class="progress-container">
          <div class="progress-bar-wrapper">
            <div class="progress-bar-fill" id="conv-progress" style="width: 0%"></div>
          </div>
          <div class="progress-info">
            <span id="conv-percent">0%</span>
            <span id="conv-detail"></span>
          </div>
        </div>
      </div>

      <div class="action-buttons" style="margin-top: var(--spacing-lg)">
        <button class="btn btn-ghost" id="btn-back2" type="button">← Back</button>
      </div>
    </div>
  `;

  // State
  let isConverting = false;

  // Elements
  const btnBack = page.querySelector('#btn-back') as HTMLButtonElement;
  const btnBack2 = page.querySelector('#btn-back2') as HTMLButtonElement;
  const sectionsContainer = page.querySelector('#sections-container') as HTMLElement;
  const convStatus = page.querySelector('#conv-status') as HTMLElement;
  const convProgress = page.querySelector('#conv-progress') as HTMLElement;
  const convPercent = page.querySelector('#conv-percent') as HTMLElement;
  const convDetail = page.querySelector('#conv-detail') as HTMLElement;

  // Navigation
  btnBack.addEventListener('click', () => router.navigate('#/'));
  btnBack2.addEventListener('click', () => router.navigate('#/'));

  // Build sections
  function buildSection(title: string, emoji: string, conversions: ConversionDef[]): HTMLElement {
    const section = document.createElement('div');

    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `<h3>${emoji} ${title}</h3><div class="line"></div>`;
    section.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'conversion-grid';

    for (const conv of conversions) {
      const btn = document.createElement('button');
      btn.className = 'conversion-btn';
      btn.innerHTML = `<span>${conv.label}</span>`;
      btn.addEventListener('click', () => runConversion(conv));
      grid.appendChild(btn);
    }

    section.appendChild(grid);
    return section;
  }

  sectionsContainer.appendChild(buildSection('Video Conversion', '🎬', VIDEO_CONVERSIONS));
  sectionsContainer.appendChild(buildSection('Audio Conversion', '🎵', AUDIO_CONVERSIONS));
  sectionsContainer.appendChild(buildSection('Extract Audio', '🎤', EXTRACT_CONVERSIONS));
  sectionsContainer.appendChild(buildSection('Video Processing', '⚡', PROCESSING_CONVERSIONS));

  // Status helpers
  function setStatus(msg: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info') {
    convStatus.textContent = msg;
    const colors: Record<string, string> = {
      info: 'var(--info)', success: 'var(--success)',
      warning: 'var(--warning)', danger: 'var(--danger)'
    };
    convStatus.style.color = colors[type] || 'var(--text-secondary)';
  }

  function setProgress(pct: number) {
    convProgress.style.width = `${pct}%`;
    convPercent.textContent = `${Math.round(pct)}%`;
    convProgress.classList.remove('indeterminate', 'success', 'danger', 'striped');
    if (pct > 0 && pct < 100) convProgress.classList.add('striped');
  }

  function setAllButtons(disabled: boolean) {
    const allBtns = page.querySelectorAll('.conversion-btn') as NodeListOf<HTMLButtonElement>;
    allBtns.forEach(b => b.disabled = disabled);
  }

  // Run conversion
  async function runConversion(conv: ConversionDef) {
    if (isConverting) return;

    // Pick input file
    const inputPath = await pickFile(
      `Select ${conv.fromExt.join('/')} File`,
      conv.fromExt
    );
    if (!inputPath) {
      setStatus('Cancelled', 'warning');
      return;
    }

    // Pick output file
    const inputName = inputPath.split(/[/\\]/).pop()?.replace(/\.[^.]+$/, '') || 'output';
    const outputPath = await saveFile(
      'Save As',
      [conv.toExt],
      `${inputName}.${conv.toExt}`
    );
    if (!outputPath) {
      setStatus('Cancelled', 'warning');
      return;
    }

    // Start conversion
    isConverting = true;
    setAllButtons(true);
    setProgress(0);
    convProgress.classList.add('striped');
    setStatus(`Converting: ${inputPath.split(/[/\\]/).pop()}...`, 'info');
    convDetail.textContent = '';

    startConversion(
      inputPath,
      outputPath,
      conv.ffmpegArgs,
      (percent, message) => {
        setProgress(percent);
        setStatus(message, 'info');
      },
      (success, message) => {
        isConverting = false;
        setAllButtons(false);

        if (success) {
          setProgress(100);
          convProgress.classList.add('success');
          setStatus(message, 'success');
        } else {
          convProgress.classList.add('danger');
          setStatus(message, 'danger');
        }
      }
    );
  }

  return page;
}
