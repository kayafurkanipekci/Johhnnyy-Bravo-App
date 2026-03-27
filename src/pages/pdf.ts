// PDF Tools Page — Suite of tools for PDF manipulation

import { html } from '../lib/utils';
import { router } from '../lib/router';
import { pickFile, pickMultipleFiles, pickDirectory, saveFile } from '../lib/tauri-bridge';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';
import { PDFDocument } from 'pdf-lib';

import * as pdfjsLib from 'pdfjs-dist';
// Let Vite resolve the worker path dynamically for browser environment inside Tauri
// @ts-ignore
import pdfjsWorkerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;

export function createPdfPage(): HTMLElement {
  const page = html`
    <div class="page">
      <div class="page-header">
        <button class="back-btn" id="btn-back" type="button">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <h1><img src="/favicon.ico" class="app-logo" alt="Logo"> PDF Tools</h1>
      </div>

      <div class="home-cards" style="margin-top: 2rem;">
        
        <!-- Tool 1: Merge PDFs -->
        <div class="home-card card-interactive" id="tool-merge">
          <div class="home-card-icon" style="color: var(--accent-primary);">
            <svg class="icon-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          <h2>Merge PDFs</h2>
          <p>Combine multiple PDF files into one</p>
        </div>

        <!-- Tool 2: Split PDFs -->
        <div class="home-card card-interactive" id="tool-split">
          <div class="home-card-icon" style="color: var(--accent-secondary);">
            <svg class="icon-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path>
            </svg>
          </div>
          <h2>Split PDF</h2>
          <p>Extract every page as a separate PDF file</p>
        </div>

        <!-- Tool 3: PDF to Images -->
        <div class="home-card card-interactive" id="tool-pdf2img">
          <div class="home-card-icon" style="color: var(--success);">
            <svg class="icon-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
          <h2>PDF to Images</h2>
          <p>Convert pages into PNG photos</p>
        </div>

        <!-- Tool 4: Images to PDF -->
        <div class="home-card card-interactive" id="tool-img2pdf">
          <div class="home-card-icon" style="color: var(--warning);">
            <svg class="icon-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
          </div>
          <h2>Images to PDF</h2>
          <p>Combine photos into a single PDF</p>
        </div>

      </div>

      <!-- Action Status Feedback -->
      <div class="converter-feedback card-glass" id="pdf-feedback" style="margin-top: 2rem; display: none;">
        <div class="converter-status-text" id="pdf-status">Ready</div>
        <div class="progress-container">
          <div class="progress-bar-wrapper">
            <div class="progress-bar-fill" id="pdf-progress" style="width: 0%"></div>
          </div>
          <div class="progress-info">
            <span id="pdf-percent">0%</span>
          </div>
        </div>

        <div id="pdf-action-results" style="display: none; justify-content: center; gap: 1rem; margin-top: 1.5rem;">
          <button class="btn btn-secondary" id="pdf-btn-show-folder" type="button">
            <svg class="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
            Show in Folder
          </button>
          <button class="btn btn-secondary" id="pdf-btn-open-file" type="button">
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

  let isWorking = false;

  const btnBack = page.querySelector('#btn-back') as HTMLButtonElement;
  const btnBack2 = page.querySelector('#btn-back2') as HTMLButtonElement;
  const tMerge = page.querySelector('#tool-merge') as HTMLElement;
  const tSplit = page.querySelector('#tool-split') as HTMLElement;
  const tPdf2Img = page.querySelector('#tool-pdf2img') as HTMLElement;
  const tImg2Pdf = page.querySelector('#tool-img2pdf') as HTMLElement;

  const feedbackPanel = page.querySelector('#pdf-feedback') as HTMLElement;
  const statusText = page.querySelector('#pdf-status') as HTMLElement;
  const progressFill = page.querySelector('#pdf-progress') as HTMLElement;
  const progressPercent = page.querySelector('#pdf-percent') as HTMLElement;

  const pdfActionResults = page.querySelector('#pdf-action-results') as HTMLElement;
  const pdfBtnShowFolder = page.querySelector('#pdf-btn-show-folder') as HTMLButtonElement;
  const pdfBtnOpenFile = page.querySelector('#pdf-btn-open-file') as HTMLButtonElement;

  const goBack = () => router.navigate('#/');
  btnBack.addEventListener('click', goBack);
  btnBack2.addEventListener('click', goBack);

  function showStatus(msg: string, isError = false) {
    feedbackPanel.style.display = 'block';
    statusText.textContent = msg;
    statusText.style.color = isError ? 'var(--danger)' : 'var(--info)';
  }

  function updateProgress(pct: number) {
    progressFill.style.width = `${pct}%`;
    progressPercent.textContent = `${Math.round(pct)}%`;
    progressFill.className = 'progress-bar-fill';
    if (pct > 0 && pct < 100) progressFill.classList.add('striped');
    if (pct === 100) progressFill.classList.add('success');
  }

  function setBusy(busy: boolean) {
    isWorking = busy;
    [tMerge, tSplit, tPdf2Img, tImg2Pdf].forEach(el => {
      el.style.opacity = busy ? '0.5' : '1';
      el.style.pointerEvents = busy ? 'none' : 'auto';
    });
    if (busy) {
      pdfActionResults.style.display = 'none';
      progressFill.classList.remove('danger', 'success');
    }
  }

  // --- Utility functions to avoid code duplication ---
  async function savePdf(pdfDoc: PDFDocument, title: string, fileName: string): Promise<string | null> {
    const defaultData = await pdfDoc.save();
    const saveLoc = await saveFile(title, ['pdf'], fileName);
    if (saveLoc) {
      await writeFile(saveLoc, defaultData);
      return saveLoc;
    }
    return null;
  }

  // ===================== TOOL 1: MERGE =====================
  tMerge.addEventListener('click', async () => {
    if (isWorking) return;
    const files = await pickMultipleFiles('Select multiple PDF files to merge', ['pdf']);
    if (!files || files.length < 2) {
      if (files && files.length === 1) showStatus('Please select at least 2 PDFs to merge.', true);
      return;
    }

    setBusy(true);
    showStatus('Merging PDFs...');
    updateProgress(0);

    try {
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const fileData = await readFile(files[i]);
        const pdf = await PDFDocument.load(fileData);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        updateProgress(((i + 1) / files.length) * 50); // First 50% is loading/merging
      }

      showStatus('Saving merged PDF...');
      const savedPath = await savePdf(mergedPdf, 'Save Merged PDF', 'merged_document.pdf');
      
      if (savedPath) {
        updateProgress(100);
        showStatus('Merge successful! Saved as merged_document.pdf');
        statusText.style.color = 'var(--success)';

        pdfBtnShowFolder.onclick = () => { import('../lib/tauri-bridge').then(m => m.showItemInFolder(savedPath)); };
        pdfBtnOpenFile.onclick = () => { import('../lib/tauri-bridge').then(m => m.openFileOrFolder(savedPath)); };
        pdfBtnOpenFile.style.display = 'flex';
        pdfActionResults.style.display = 'flex';
      } else {
        showStatus('Cancelled save.', true);
      }
    } catch (err: any) {
      showStatus('Error: ' + (err.message || String(err)), true);
    } finally {
      setBusy(false);
    }
  });

  // ===================== TOOL 2: SPLIT =====================
  tSplit.addEventListener('click', async () => {
    if (isWorking) return;
    const file = await pickFile('Select a PDF to split', ['pdf']);
    if (!file) return;

    const outDir = await pickDirectory();
    if (!outDir) return;

    setBusy(true);
    showStatus('Loading PDF for splitting...');
    updateProgress(0);

    try {
      const fileData = await readFile(file);
      const originalPdf = await PDFDocument.load(fileData);
      const totalPages = originalPdf.getPageCount();
      
      showStatus(`Found ${totalPages} pages. Splitting...`);

      // Extract filename safely
      const originalName = file.split(/[/\\]/).pop()?.replace(/\.[^.]+$/, '') || 'page';

      for (let i = 0; i < totalPages; i++) {
        const singlePagePdf = await PDFDocument.create();
        const [copiedPage] = await singlePagePdf.copyPages(originalPdf, [i]);
        singlePagePdf.addPage(copiedPage);

        const pdfBytes = await singlePagePdf.save();
        const pageNumStr = String(i + 1).padStart(3, '0');
        await writeFile(`${outDir}/${originalName}_${pageNumStr}.pdf`, pdfBytes);
        
        updateProgress(((i + 1) / totalPages) * 100);
      }

      showStatus(`Success! Extracted ${totalPages} pages to directory.`);
      statusText.style.color = 'var(--success)';
      
      pdfBtnShowFolder.onclick = () => { import('../lib/tauri-bridge').then(m => m.showItemInFolder(outDir)); };
      pdfBtnOpenFile.style.display = 'none';
      pdfActionResults.style.display = 'flex';
    } catch (err: any) {
      showStatus('Error: ' + (err.message || String(err)), true);
    } finally {
      setBusy(false);
    }
  });

  // ===================== TOOL 3: PDF TO IMAGE =====================
  tPdf2Img.addEventListener('click', async () => {
    if (isWorking) return;
    const file = await pickFile('Select a PDF to convert to Images', ['pdf']);
    if (!file) return;

    const outDir = await pickDirectory();
    if (!outDir) return;

    setBusy(true);
    showStatus('Loading PDF engine...');
    updateProgress(0);

    try {
      const fileData = await readFile(file);
      // Load with pdfjs via native ArrayBuffer
      const loadingTask = pdfjsLib.getDocument({ data: fileData.buffer });
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;

      showStatus(`Converting ${totalPages} pages to images...`);
      const originalName = file.split(/[/\\]/).pop()?.replace(/\.[^.]+$/, '') || 'page';
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context not available');

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        // Scale 2.0 = roughly 144 DPI (high quality)
        const viewport = page.getViewport({ scale: 2.0 });
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };
        
        // @ts-ignore
        await page.render(renderContext).promise;
        
        // Convert Canvas to ArrayBuffer -> Uint8Array to write using invoke
        const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
        if (blob) {
          const arrayBuffer = await blob.arrayBuffer();
          const pageNumStr = String(i).padStart(3, '0');
          await writeFile(`${outDir}/${originalName}_${pageNumStr}.png`, new Uint8Array(arrayBuffer));
        }

        updateProgress((i / totalPages) * 100);
      }

      showStatus(`Success! Saved ${totalPages} PNG images.`);
      statusText.style.color = 'var(--success)';

      pdfBtnShowFolder.onclick = () => { import('../lib/tauri-bridge').then(m => m.showItemInFolder(outDir)); };
      pdfBtnOpenFile.style.display = 'none';
      pdfActionResults.style.display = 'flex';
    } catch (err: any) {
      showStatus('Error: ' + (err.message || String(err)), true);
    } finally {
      setBusy(false);
    }
  });

  // ===================== TOOL 4: IMAGES TO PDF =====================
  tImg2Pdf.addEventListener('click', async () => {
    if (isWorking) return;
    const files = await pickMultipleFiles('Select Images to combine', ['png', 'jpg', 'jpeg']);
    if (!files || files.length === 0) return;

    setBusy(true);
    showStatus('Preparing PDF layout...');
    updateProgress(0);

    try {
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.toLowerCase().split('.').pop() || '';
        const imgData = await readFile(file);
        
        let pdfImage;
        if (fileExt === 'png') {
          pdfImage = await pdfDoc.embedPng(imgData);
        } else {
          pdfImage = await pdfDoc.embedJpg(imgData);
        }

        const dims = pdfImage.scale(1);
        const page = pdfDoc.addPage([dims.width, dims.height]);
        page.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: dims.width,
          height: dims.height,
        });

        updateProgress(((i + 1) / files.length) * 50);
      }

      showStatus('Saving PDF document...');
      const savedPath = await savePdf(pdfDoc, 'Save Image PDF', 'photo_album.pdf');
      
      if (savedPath) {
        updateProgress(100);
        showStatus('Success! Images combined into PDF.');
        statusText.style.color = 'var(--success)';

        pdfBtnShowFolder.onclick = () => { import('../lib/tauri-bridge').then(m => m.showItemInFolder(savedPath)); };
        pdfBtnOpenFile.onclick = () => { import('../lib/tauri-bridge').then(m => m.openFileOrFolder(savedPath)); };
        pdfBtnOpenFile.style.display = 'flex';
        pdfActionResults.style.display = 'flex';
      } else {
        showStatus('Cancelled save.', true);
      }
    } catch (err: any) {
      showStatus('Error: ' + (err.message || String(err)), true);
    } finally {
      setBusy(false);
    }
  });

  return page;
}
