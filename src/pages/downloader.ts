// YouTube Downloader Page

import { html } from '../lib/utils';
import { router } from '../lib/router';
import { startDownloadAsync, pickDirectory, pickFile, type DownloadProgress } from '../lib/tauri-bridge';

export function createDownloaderPage(): HTMLElement {
  const page = html`
    <div class="page">
      <div class="page-header">
        <button class="back-btn" id="btn-back" type="button">←</button>
        <h1>YouTube Downloader</h1>
      </div>

      <!-- URL Input -->
      <div class="form-section">
        <label class="label">Video URL</label>
        <div class="input-group">
          <input class="input" type="text" id="url-input" placeholder="https://youtube.com/watch?v=..." autocomplete="off" />
          <button class="btn" id="btn-paste" type="button" title="Paste from clipboard">📋</button>
        </div>
      </div>

      <!-- Download Type -->
      <div class="form-section">
        <label class="label">Download Type</label>
        <div class="radio-group" id="type-group">
          <input type="radio" name="dl-type" id="type-video" value="video" checked />
          <label for="type-video">🎬 Video</label>
          <input type="radio" name="dl-type" id="type-audio" value="audio" />
          <label for="type-audio">🎵 Audio (MP3)</label>
        </div>
      </div>

      <!-- Resolution Selection -->
      <div class="form-section" id="resolution-section">
        <label class="label">Resolution</label>
        <div class="radio-group" id="res-group">
          <input type="radio" name="resolution" id="res-best" value="best" />
          <label for="res-best">Best</label>
          <input type="radio" name="resolution" id="res-1080" value="1080" checked />
          <label for="res-1080">1080p</label>
          <input type="radio" name="resolution" id="res-720" value="720" />
          <label for="res-720">720p</label>
          <input type="radio" name="resolution" id="res-480" value="480" />
          <label for="res-480">480p</label>
        </div>
      </div>

      <!-- Cookie -->
      <div class="form-section">
        <label class="label">Cookie File (Bot Prevention)</label>
        <div class="cookie-row">
          <div class="cookie-status">
            <span id="cookie-icon">⚠️</span>
            <span id="cookie-text">No cookies loaded</span>
          </div>
          <button class="btn" id="btn-cookie" type="button">Load Cookies.txt</button>
        </div>
      </div>

      <!-- Progress -->
      <div class="form-section">
        <div class="download-feedback" id="feedback-area">
          <div class="download-status-text" id="dl-status">Ready to download</div>
          <div class="progress-container">
            <div class="progress-bar-wrapper">
              <div class="progress-bar-fill" id="progress-fill" style="width: 0%"></div>
            </div>
            <div class="progress-info">
              <span id="progress-percent">0%</span>
              <span id="progress-details"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button class="btn btn-primary btn-lg" id="btn-download" type="button">⬇️ Download</button>
        <button class="btn btn-danger" id="btn-exit" type="button">Exit</button>
      </div>
    </div>
  `;

  // --- State ---
  let cookieFilePath: string | null = null;
  let isDownloading = false;
  let currentDownload: { kill: () => void } | null = null;

  // --- Elements ---
  const btnBack = page.querySelector('#btn-back') as HTMLButtonElement;
  const btnPaste = page.querySelector('#btn-paste') as HTMLButtonElement;
  const urlInput = page.querySelector('#url-input') as HTMLInputElement;
  const typeVideo = page.querySelector('#type-video') as HTMLInputElement;
  const typeAudio = page.querySelector('#type-audio') as HTMLInputElement;
  const resSection = page.querySelector('#resolution-section') as HTMLElement;
  const btnCookie = page.querySelector('#btn-cookie') as HTMLButtonElement;
  const cookieIcon = page.querySelector('#cookie-icon') as HTMLElement;
  const cookieText = page.querySelector('#cookie-text') as HTMLElement;
  const dlStatus = page.querySelector('#dl-status') as HTMLElement;
  const progressFill = page.querySelector('#progress-fill') as HTMLElement;
  const progressPercent = page.querySelector('#progress-percent') as HTMLElement;
  const progressDetails = page.querySelector('#progress-details') as HTMLElement;
  const btnDownload = page.querySelector('#btn-download') as HTMLButtonElement;
  const btnExit = page.querySelector('#btn-exit') as HTMLButtonElement;

  // --- Navigation ---
  btnBack.addEventListener('click', () => {
    if (currentDownload) currentDownload.kill();
    router.navigate('#/');
  });

  btnExit.addEventListener('click', () => {
    if (currentDownload) currentDownload.kill();
    // @ts-ignore
    if (window.__TAURI__) {
      import('@tauri-apps/plugin-process').then(p => p.exit(0));
    }
  });

  // --- Paste ---
  btnPaste.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      urlInput.value = text;
    } catch {
      updateStatus('Could not read clipboard', 'warning');
    }
  });

  // --- Type Toggle ---
  function toggleResolution() {
    resSection.style.display = typeVideo.checked ? 'block' : 'none';
  }
  typeVideo.addEventListener('change', toggleResolution);
  typeAudio.addEventListener('change', toggleResolution);
  toggleResolution();

  // --- Cookie ---
  btnCookie.addEventListener('click', async () => {
    const path = await pickFile('Select cookies.txt file', ['txt']);
    if (path) {
      cookieFilePath = path;
      const fileName = path.split(/[/\\]/).pop() || 'cookies.txt';
      cookieIcon.textContent = '✅';
      cookieText.textContent = `Active: ${fileName}`;
      cookieText.style.color = 'var(--success)';
    }
  });

  // --- Status Helpers ---
  function updateStatus(msg: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info') {
    dlStatus.textContent = msg;
    const colors: Record<string, string> = {
      info: 'var(--info)',
      success: 'var(--success)',
      warning: 'var(--warning)',
      danger: 'var(--danger)'
    };
    dlStatus.style.color = colors[type] || 'var(--text-secondary)';
  }

  function updateProgress(percent: number) {
    progressFill.style.width = `${percent}%`;
    progressPercent.textContent = `${Math.round(percent)}%`;

    // Color
    progressFill.classList.remove('success', 'danger', 'striped');
    if (percent > 0 && percent < 100) {
      progressFill.classList.add('striped');
    }
  }

  function resetProgress() {
    updateProgress(0);
    progressDetails.textContent = '';
    progressFill.classList.remove('success', 'danger', 'striped');
  }

  // --- Download ---
  btnDownload.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) {
      updateStatus('Please enter a URL', 'warning');
      return;
    }

    if (isDownloading) return;

    // Pick output directory
    const outputDir = await pickDirectory();
    if (!outputDir) {
      updateStatus('Download cancelled', 'warning');
      return;
    }

    isDownloading = true;
    btnDownload.disabled = true;
    btnDownload.textContent = '⏳ Downloading...';
    resetProgress();
    updateStatus('Starting download...', 'info');

    const dlType = typeVideo.checked ? 'video' : 'audio';
    const resolution = dlType === 'video'
      ? (page.querySelector('input[name="resolution"]:checked') as HTMLInputElement)?.value || '1080'
      : undefined;

    currentDownload = await startDownloadAsync(
      url,
      outputDir,
      { type: dlType as 'video' | 'audio', resolution, cookieFile: cookieFilePath || undefined },
      (progress: DownloadProgress) => {
        if (progress.message) {
          updateStatus(progress.message, 'info');
        } else {
          const pct = parseFloat(progress.percent) || 0;
          updateProgress(pct);
          updateStatus(`Downloading: ${progress.percent}%`, 'info');
          progressDetails.textContent = `Speed: ${progress.speed} | ETA: ${progress.eta}`;
        }
      },
      (success: boolean, message: string) => {
        isDownloading = false;
        currentDownload = null;
        btnDownload.disabled = false;
        btnDownload.textContent = '⬇️ Download';

        if (success) {
          updateProgress(100);
          progressFill.classList.add('success');
          updateStatus(message, 'success');
        } else {
          progressFill.classList.add('danger');
          updateStatus(message, 'danger');
        }
      }
    );
  });

  return page;
}
