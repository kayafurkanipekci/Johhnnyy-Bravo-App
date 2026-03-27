// YouTube Downloader Page

import { html } from '../lib/utils';
import { router } from '../lib/router';
import { startDownloadAsync, pickDirectory, type DownloadProgress } from '../lib/tauri-bridge';

export function createDownloaderPage(): HTMLElement {
  const page = html`
    <div class="page">
      <div class="page-header">
        <button class="back-btn" id="btn-back" type="button">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <h1><img src="/favicon.ico" class="app-logo" alt="Logo"> YouTube Downloader</h1>
      </div>

      <!-- URL Input -->
      <div class="form-section">
        <label class="label">Video URL</label>
        <div class="input-group">
          <input class="input" type="text" id="url-input" placeholder="https://youtube.com/watch?v=..." autocomplete="off" />
          <button class="btn btn-icon" id="btn-paste" type="button" title="Paste from clipboard">
            <svg class="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Download Type -->
      <div class="form-section">
        <label class="label">Download Type</label>
        <div class="radio-group" id="type-group">
          <input type="radio" name="dl-type" id="type-video" value="video" checked />
          <label for="type-video">
            <svg class="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            Video
          </label>
          <input type="radio" name="dl-type" id="type-audio" value="audio" />
          <label for="type-audio">
            <svg class="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
            Audio (MP3)
          </label>
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
              <span id="progress-details">Starting download...</span>
            </div>
          </div>
          
          <div id="dl-action-results" style="display: none; justify-content: center; gap: 1rem; margin-top: 1.5rem;">
            <button class="btn btn-secondary" id="btn-show-folder" type="button">
              <svg class="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
              Show in Folder
            </button>
            <button class="btn btn-secondary" id="btn-open-file" type="button">
              <svg class="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Open File
            </button>
          </div>
        </div>
      <!-- Action Buttons -->
      <div class="action-buttons">
        <button class="btn btn-primary btn-lg" id="btn-download" type="button">
          <svg class="icon-md" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" stroke-linejoin="round" stroke-linecap="round"></path>
          </svg>
          Download
        </button>
      </div>

      <div class="action-buttons" style="margin-top: var(--spacing-lg)">
        <button class="btn btn-ghost" id="btn-back2" type="button">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
      </div>
    </div>
  `;

  // --- State ---
  let isDownloading = false;
  let currentDownload: { kill: () => void } | null = null;

  // --- Elements ---
  const btnBack = page.querySelector('#btn-back') as HTMLButtonElement;
  const btnBack2 = page.querySelector('#btn-back2') as HTMLButtonElement;
  const btnPaste = page.querySelector('#btn-paste') as HTMLButtonElement;
  const urlInput = page.querySelector('#url-input') as HTMLInputElement;
  const typeVideo = page.querySelector('#type-video') as HTMLInputElement;
  const typeAudio = page.querySelector('#type-audio') as HTMLInputElement;
  const resSection = page.querySelector('#resolution-section') as HTMLElement;
  const dlStatus = page.querySelector('#dl-status') as HTMLElement;
  const progressFill = page.querySelector('#progress-fill') as HTMLElement;
  const progressPercent = page.querySelector('#progress-percent') as HTMLElement;
  const progressDetails = page.querySelector('#progress-details') as HTMLElement;
  const btnDownload = page.querySelector('#btn-download') as HTMLButtonElement;
  
  const dlActionResults = page.querySelector('#dl-action-results') as HTMLElement;
  const btnShowFolder = page.querySelector('#btn-show-folder') as HTMLButtonElement;
  const btnOpenFile = page.querySelector('#btn-open-file') as HTMLButtonElement;

  // --- Navigation ---
  const goBack = () => {
    if (currentDownload) currentDownload.kill();
    router.navigate('#/');
  };
  
  btnBack.addEventListener('click', goBack);
  btnBack2.addEventListener('click', goBack);

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
    btnDownload.innerHTML = `
      <svg class="icon-md animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2"></path>
        <circle cx="12" cy="12" r="10"></circle>
      </svg>
      Downloading...
    `;
    resetProgress();
    updateStatus('Starting download...', 'info');
    dlActionResults.style.display = 'none';

    const dlType = typeVideo.checked ? 'video' : 'audio';
    const resolution = dlType === 'video'
      ? (page.querySelector('input[name="resolution"]:checked') as HTMLInputElement)?.value || '1080'
      : undefined;

    const options = { type: dlType as 'video' | 'audio', resolution };

    currentDownload = await startDownloadAsync(
      url,
      outputDir,
      options,
      (progress: DownloadProgress) => {
        if (progress.message) {
          updateStatus(progress.message, 'info');
        } else {
          const pct = parseFloat(progress.percent) || 0;
          updateProgress(pct);
          updateStatus(`${progress.status === 'downloading' ? 'Downloading' : 'Processing'}... ${progress.speed} (ETA: ${progress.eta})`, 'info');
          progressDetails.textContent = `Speed: ${progress.speed} | ETA: ${progress.eta}`;
        }
      },
      (success: boolean, message: string, finalPath?: string) => {
        isDownloading = false;
        currentDownload = null;
        btnDownload.disabled = false;
        btnDownload.innerHTML = `
          <svg class="icon-md" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" stroke-linejoin="round" stroke-linecap="round"></path>
          </svg>
          Download
        `;

        if (success) {
          updateProgress(100);
          progressFill.classList.add('success');
          updateStatus(message, 'success');
          
          btnShowFolder.onclick = () => { 
            import('../lib/tauri-bridge').then(m => {
              if (finalPath) {
                m.showItemInFolder(finalPath);
              } else {
                m.openFileOrFolder(outputDir);
              }
            }); 
          };
          btnOpenFile.onclick = () => { if(finalPath) import('../lib/tauri-bridge').then(m => m.openFileOrFolder(finalPath)); };
          btnOpenFile.style.display = finalPath ? 'flex' : 'none';
          dlActionResults.style.display = 'flex';
        } else {
          progressFill.classList.add('danger');
          updateStatus(message, 'danger');
        }
      }
    );
  });

  return page;
}
