// Entry point — Initialize router and start the app

import { router } from './lib/router';
import { initThemeToggle } from './lib/theme';
import { createHomePage } from './pages/home';
import { createDownloaderPage } from './pages/downloader';
import { createConverterPage } from './pages/converter';
import { createPdfPage } from './pages/pdf';

// Register routes
router
  .addRoute('/', () => createHomePage())
  .addRoute('/downloader', () => createDownloaderPage())
  .addRoute('/converter', () => createConverterPage())
  .addRoute('/pdf', () => createPdfPage());

// Start the router and initialize global components
window.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  router.start();
});
