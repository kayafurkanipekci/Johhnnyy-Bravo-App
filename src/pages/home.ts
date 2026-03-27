// Home Page — Main menu with cards for YouTube Downloader and File Converter

import { html } from '../lib/utils';
import { router } from '../lib/router';
import { getYtDlpVersion, updateYtDlp } from '../lib/tauri-bridge';

export function createHomePage(): HTMLElement {
  const page = html`
    <div class="home-page">
      <div class="home-logo">
        <img src="/favicon.ico" class="app-logo-large" alt="Logo">
        <h1>Johnny Bravo</h1>
        <p>Media Tools</p>
      </div>

      <div class="home-cards">
        <div class="home-card" id="card-converter">
          <div class="home-card-icon">
            <svg class="icon-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
          </div>
          <h2>File Converter</h2>
          <p>Convert media files between formats</p>
        </div>
        <div class="home-card" id="card-downloader">
          <div class="home-card-icon">
            <svg class="icon-lg" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" fill="none"><path d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" stroke-linejoin="round" stroke-linecap="round"></path></svg>
          </div>
          <h2>YouTube Downloader</h2>
          <p>Download videos and audio from YouTube</p>
        </div>
        <div class="home-card" id="card-pdf">
          <div class="home-card-icon">
            <svg class="icon-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </div>
          <h2>PDF Tools</h2>
          <p>Merge, Split, and Convert PDFs</p>
        </div>
      </div>

      <div class="home-footer">
        <div class="home-update-row" id="update-row">
          <div class="home-update-info">
            <svg class="icon-xs" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <span id="update-status-text">yt-dlp</span>
            <span class="badge badge-info" id="ytdlp-version-badge">checking...</span>
          </div>
          <button class="btn btn-ghost" id="btn-update" type="button">
            Update
          </button>
        </div>
        <span class="home-version">Johnny Bravo Media Tools v2.0.0</span>
      </div>
    </div>
  `;

  // Navigation
  const cardDownloader = page.querySelector('#card-downloader') as HTMLElement;
  const cardConverter = page.querySelector('#card-converter') as HTMLElement;
  const cardPdf = page.querySelector('#card-pdf') as HTMLElement;

  cardDownloader.addEventListener('click', () => router.navigate('#/downloader'));
  cardConverter.addEventListener('click', () => router.navigate('#/converter'));
  cardPdf.addEventListener('click', () => router.navigate('#/pdf'));

  // yt-dlp version check
  const versionBadge = page.querySelector('#ytdlp-version-badge') as HTMLElement;
  const btnUpdate = page.querySelector('#btn-update') as HTMLButtonElement;
  const updateStatusText = page.querySelector('#update-status-text') as HTMLElement;

  getYtDlpVersion().then(version => {
    versionBadge.textContent = version;
    if (version === 'not found') {
      versionBadge.className = 'badge badge-danger';
    } else {
      versionBadge.className = 'badge badge-success';
    }
  });

  // Update button
  btnUpdate.addEventListener('click', async () => {
    btnUpdate.disabled = true;
    btnUpdate.innerHTML = `
      <svg class="icon-sm animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
      </svg>
    `;

    await updateYtDlp(
      (msg) => {
        updateStatusText.textContent = msg;
      },
      (success, msg) => {
        updateStatusText.textContent = msg;
        btnUpdate.disabled = false;
        btnUpdate.textContent = 'Update';

        if (success) {
          versionBadge.className = 'badge badge-success';
          // Refresh version
          getYtDlpVersion().then(v => {
            versionBadge.textContent = v;
          });
        } else {
          versionBadge.className = 'badge badge-danger';
        }

        // Reset status text after 5s
        setTimeout(() => {
          updateStatusText.textContent = 'yt-dlp';
        }, 5000);
      }
    );
  });

  return page;
}
