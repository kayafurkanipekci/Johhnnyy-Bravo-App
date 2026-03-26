// Home Page — Main menu with cards for YouTube Downloader and File Converter

import { html } from '../lib/utils';
import { router } from '../lib/router';
import { getYtDlpVersion, updateYtDlp } from '../lib/tauri-bridge';

export function createHomePage(): HTMLElement {
  const page = html`
    <div class="home-page">
      <div class="home-logo">
        <h1>🎬 Johnny Bravo</h1>
        <p>Media Tools</p>
      </div>

      <div class="home-cards">
        <div class="home-card" id="card-downloader">
          <div class="home-card-icon">⬇️</div>
          <h2>YouTube Downloader</h2>
          <p>Download videos and audio from YouTube</p>
        </div>
        <div class="home-card" id="card-converter">
          <div class="home-card-icon">🔄</div>
          <h2>File Converter</h2>
          <p>Convert media files between formats</p>
        </div>
      </div>

      <div class="home-footer">
        <div class="home-update-row" id="update-row">
          <div class="home-update-info">
            <span>🔧</span>
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

  cardDownloader.addEventListener('click', () => router.navigate('#/downloader'));
  cardConverter.addEventListener('click', () => router.navigate('#/converter'));

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
    btnUpdate.textContent = '⏳ Updating...';

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
