// File Converter Page — Dynamic Dropdown Interface

import { html } from '../lib/utils';
import { router } from '../lib/router';
import { startConversion, pickFile, saveFile } from '../lib/tauri-bridge';

// ===== Conversion Algorithms =====

interface ConversionDef {
  label: string;
  fromExt: string[];
  toExt: string;
  ffmpegArgs: string[];
}

const VIDEO_FORMATS = ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'wmv', 'mpeg', 'mpg', 'm4v', '3gp', 'ts', 'gif'];
const AUDIO_FORMATS = ['mp3', 'wav', 'm4a', 'flac', 'ogg', 'aac', 'opus', 'wma'];

const VIDEO_CONVERSIONS: ConversionDef[] = VIDEO_FORMATS.flatMap(outExt => ({
  label: `To .${outExt.toUpperCase()}`,
  fromExt: VIDEO_FORMATS.filter(ext => ext !== outExt),
  toExt: outExt,
  ffmpegArgs: [] // ffmpeg will automatically transcode video/audio streams into the container natively
}));

const AUDIO_CONVERSIONS: ConversionDef[] = AUDIO_FORMATS.flatMap(outExt => ({
  label: `To .${outExt.toUpperCase()}`,
  fromExt: AUDIO_FORMATS.filter(ext => ext !== outExt),
  toExt: outExt,
  ffmpegArgs: [] // ffmpeg will automatically transcode audio natively
}));

const EXTRACT_CONVERSIONS: ConversionDef[] = AUDIO_FORMATS.map(outExt => ({
  label: `Video to ${outExt.toUpperCase()}`,
  fromExt: VIDEO_FORMATS,
  toExt: outExt,
  ffmpegArgs: ['-vn'] // Strip video track
}));

const PROCESSING_CONVERSIONS: ConversionDef[] = [
  { label: 'Compress Video (HEVC / H.265)', fromExt: VIDEO_FORMATS, toExt: 'mp4', ffmpegArgs: ['-c:v', 'libx265', '-vtag', 'hvc1', '-preset', 'medium', '-crf', '30', '-c:a', 'aac', '-b:a', '128k'] },
  { label: 'Convert to Apple HEVC (.mov)', fromExt: VIDEO_FORMATS, toExt: 'mov', ffmpegArgs: ['-c:v', 'libx265', '-vtag', 'hvc1', '-preset', 'medium', '-crf', '28', '-c:a', 'aac'] },
  { label: 'Convert HEVC to H.264', fromExt: ['mp4', 'mkv', 'mov'], toExt: 'mp4', ffmpegArgs: ['-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'copy'] },
  { label: 'Create GIF from Video', fromExt: VIDEO_FORMATS, toExt: 'gif', ffmpegArgs: ['-vf', 'fps=12,scale=480:-1:flags=lanczos', '-loop', '0'] }
];

const IMAGE_FORMATS = ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff', 'ico'];
const INPUT_ONLY_IMAGE_FORMATS = ['heic', 'heif'];

const IMAGE_CONVERSIONS: ConversionDef[] = [
  // Specialized Input Formats (HEIC/HEIF) -> All Standard Outputs
  ...INPUT_ONLY_IMAGE_FORMATS.flatMap(inExt => IMAGE_FORMATS.map(outExt => ({
    label: `${inExt.toUpperCase()} to ${outExt.toUpperCase()}`,
    fromExt: [inExt],
    toExt: outExt,
    ffmpegArgs: outExt === 'jpg' || outExt === 'jpeg' ? ['-qscale:v', '2'] : 
                outExt === 'ico' ? ['-vf', 'scale=256:256'] : []
  }))),
  
  // Dynamic Standard Image Conversions
  ...IMAGE_FORMATS.flatMap(outExt => ({
    label: `To .${outExt.toUpperCase()}`,
    fromExt: IMAGE_FORMATS.filter(ext => ext !== outExt),
    toExt: outExt,
    ffmpegArgs: outExt === 'jpg' || outExt === 'jpeg' ? ['-qscale:v', '2'] : 
                outExt === 'ico' ? ['-vf', 'scale=256:256'] : []
  }))
];

// Combine all for UI mapping
const CATEGORIES = [
  { id: 'video', title: 'Video Formats', icon: '<svg class="icon-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>', defs: VIDEO_CONVERSIONS },
  { id: 'audio', title: 'Audio Formats', icon: '<svg class="icon-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>', defs: AUDIO_CONVERSIONS },
  { id: 'extract', title: 'Audio Extraction', icon: '<svg class="icon-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>', defs: EXTRACT_CONVERSIONS },
  { id: 'image', title: 'Image Formats', icon: '<svg class="icon-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>', defs: IMAGE_CONVERSIONS },
  { id: 'process', title: 'Compression & Codecs', icon: '<svg class="icon-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>', defs: PROCESSING_CONVERSIONS },
];

export function createConverterPage(): HTMLElement {
  const page = html`
    <div class="page">
      <div class="page-header">
        <button class="back-btn" id="btn-back" type="button">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <h1><img src="/favicon.ico" class="app-logo" alt="Logo"> File Converter</h1>
      </div>

      <!-- Dynamic Conversion UI -->
      <div id="converter-categories" style="display: flex; flex-direction: column; gap: 2rem;"></div>

      <!-- Action Status Feedback -->
      <div class="converter-feedback card-glass" id="converter-feedback">
        <div class="converter-status-text" id="converter-status">Ready</div>
        <div class="progress-container">
          <div class="progress-bar-wrapper">
            <div class="progress-bar-fill" id="converter-progress" style="width: 0%"></div>
          </div>
          <div class="progress-info">
            <span id="converter-percent">0%</span>
            <span id="converter-detail"></span>
          </div>
        </div>

        <div id="cv-action-results" style="display: none; justify-content: center; gap: 1rem; margin-top: 1.5rem;">
          <button class="btn btn-secondary" id="cv-btn-show-folder" type="button">
            <svg class="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
            Show in Folder
          </button>
          <button class="btn btn-secondary" id="cv-btn-open-file" type="button">
            <svg class="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Open File
          </button>
        </div>
      </div>

      <div class="action-buttons" style="margin-top: var(--spacing-lg)">
        <button class="btn btn-ghost" id="btn-back2" type="button">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
      </div>
    </div>
  `;

  let isConverting = false;

  const btnBack = page.querySelector('#btn-back') as HTMLButtonElement;
  const btnBack2 = page.querySelector('#btn-back2') as HTMLButtonElement;
  const categoriesContainer = page.querySelector('#converter-categories') as HTMLElement;
  const convStatus = page.querySelector('#converter-status') as HTMLElement;
  const convProgress = page.querySelector('#converter-progress') as HTMLElement;
  const convPercent = page.querySelector('#converter-percent') as HTMLElement;
  const convDetail = page.querySelector('#converter-detail') as HTMLElement;
  const cvActionResults = page.querySelector('#cv-action-results') as HTMLElement;
  const cvBtnShowFolder = page.querySelector('#cv-btn-show-folder') as HTMLButtonElement;
  const cvBtnOpenFile = page.querySelector('#cv-btn-open-file') as HTMLButtonElement;

  btnBack.addEventListener('click', () => router.navigate('#/'));
  btnBack2.addEventListener('click', () => router.navigate('#/'));

  // Build the UI elements for each category
  CATEGORIES.forEach(category => {
    // Collect unique inputs
    const uniqueInputs = new Set<string>();
    category.defs.forEach(d => d.fromExt.forEach(ext => uniqueInputs.add(ext)));
    const inputs = Array.from(uniqueInputs).sort();

    const section = html`
      <div class="converter-section card">
        <div class="section-header">
          <div class="flex-center gap-sm" style="color: var(--accent-primary)">
            ${category.icon} 
            <h3 style="color: var(--text-primary); margin: 0;">${category.title}</h3>
          </div>
          <div class="line"></div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 1rem; align-items: end;">
          <div>
            <label class="label">Input Format</label>
            <select class="input" id="sel-in-${category.id}">
              <option value="" disabled selected>Select Input...</option>
              ${inputs.map(ext => `<option value="${ext}">.${ext.toUpperCase()}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="label">Output Format</label>
            <select class="input" id="sel-out-${category.id}" disabled>
              <option value="" disabled selected>Waiting for Input...</option>
            </select>
          </div>
          <div>
            <button class="btn btn-primary btn-conversion-action" id="btn-run-${category.id}" disabled>
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 4v6h6"></path><path d="M23 20v-6h-6"></path>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"></path>
              </svg>
              Convert
            </button>
          </div>
        </div>
      </div>
    `;

    categoriesContainer.appendChild(section);

    const selIn = page.querySelector(`#sel-in-${category.id}`) as HTMLSelectElement;
    const selOut = page.querySelector(`#sel-out-${category.id}`) as HTMLSelectElement;
    const btnRun = page.querySelector(`#btn-run-${category.id}`) as HTMLButtonElement;

    // Handle input selection -> Populate output selection
    selIn.addEventListener('change', () => {
      const selectedIn = selIn.value;
      selOut.innerHTML = '<option value="" disabled selected>Select Output...</option>';

      // Find all definitions that support this input
      const supportedOuts = category.defs.filter(d => d.fromExt.includes(selectedIn));

      supportedOuts.forEach(def => {
        const option = document.createElement('option');
        option.value = def.toExt;
        // Check if it's a special processing codec rather than a simple extension
        const labelText = def.label.includes('(') || category.id === 'process'
          ? def.label
          : `.${def.toExt.toUpperCase()}`;
        option.textContent = labelText;
        selOut.appendChild(option);
      });

      selOut.disabled = false;
      btnRun.disabled = true; // Wait for output selection
    });

    selOut.addEventListener('change', () => {
      btnRun.disabled = !selOut.value;
    });

    btnRun.addEventListener('click', () => {
      const selectedIn = selIn.value;
      const selectedOut = selOut.value;

      // In the process category, we might have multiple definitions for the same output ext but the label tells them apart
      // Wait, since we map value=toExt, if there are duplicates (like in process, toExt=mp4 but varying labels), the value alone isn't enough!
      // Let's match by finding the FIRST definition that matches both input AND output. Note: this means process category options must yield unique toExts or we must store index.
      // Let's map by Definition Index to be safe!


      // Edge case specifically for process where multiple have toExt="mp4".
      // Since we just populated selOut with "value=toExt", we must find it. If there are duplicates, the first one matches.
      // Option text fallback for exact matching when output extension is identical
      const optionText = selOut.options[selOut.selectedIndex].text;
      const exactDefinition = category.defs.find(d => d.fromExt.includes(selectedIn) && d.toExt === selectedOut && (d.label === optionText || `.${d.toExt.toUpperCase()}` === optionText));

      if (exactDefinition) {
        runConversion(exactDefinition, selectedIn);
      }
    });
  });

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
    const allBtns = page.querySelectorAll('.btn-conversion-action, .input') as NodeListOf<HTMLButtonElement | HTMLSelectElement>;
    allBtns.forEach(b => b.disabled = disabled);
  }

  // File Picker and execution
  async function runConversion(conv: ConversionDef, explicitFromExt: string) {
    if (isConverting) return;

    // We can allow multiple fromExt formats since pickFile supports arrays
    const inputPath = await pickFile(
      `Select .${explicitFromExt.toUpperCase()} File`,
      [explicitFromExt]
    );
    if (!inputPath) {
      setStatus('Cancelled', 'warning');
      return;
    }

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

    isConverting = true;
    setAllButtons(true);
    setProgress(0);
    convProgress.classList.add('striped');
    setStatus(`Converting: ${inputPath.split(/[/\\]/).pop()}...`, 'info');
    convDetail.textContent = '';
    cvActionResults.style.display = 'none';

    startConversion(
      inputPath,
      outputPath,
      conv.ffmpegArgs,
      (percent, message) => {
        setProgress(percent);
        setStatus(message, 'info');
      },
      (success, message, finalPath) => {
        isConverting = false;

        // Re-enable UI but verify states
        CATEGORIES.forEach(cat => {
          const selIn = page.querySelector(`#sel-in-${cat.id}`) as HTMLSelectElement;
          const selOut = page.querySelector(`#sel-out-${cat.id}`) as HTMLSelectElement;
          const btnRun = page.querySelector(`#btn-run-${cat.id}`) as HTMLButtonElement;

          selIn.disabled = false;
          if (selIn.value) {
            selOut.disabled = false;
            btnRun.disabled = !selOut.value;
          }
        });

        if (success) {
          setProgress(100);
          convProgress.classList.add('success');
          setStatus(message, 'success');

          cvBtnShowFolder.onclick = () => { import('../lib/tauri-bridge').then(m => m.showItemInFolder(finalPath || outputPath)); };
          cvBtnOpenFile.onclick = () => { import('../lib/tauri-bridge').then(m => m.openFileOrFolder(finalPath || outputPath)); };
          cvBtnOpenFile.style.display = (finalPath || outputPath) ? 'flex' : 'none';
          cvActionResults.style.display = 'flex';

        } else {
          convProgress.classList.add('danger');
          setStatus('Failed: ' + message, 'danger');
        }
      }
    );
  }

  return page;
}
