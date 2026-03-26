// Entry point — Initialize router and start the app

import { router } from './lib/router';
import { createHomePage } from './pages/home';
import { createDownloaderPage } from './pages/downloader';
import { createConverterPage } from './pages/converter';

// Register routes
router
  .addRoute('/', () => createHomePage())
  .addRoute('/downloader', () => createDownloaderPage())
  .addRoute('/converter', () => createConverterPage());

// Start the router
window.addEventListener('DOMContentLoaded', () => {
  router.start();
});
