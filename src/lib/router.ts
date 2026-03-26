// Simple hash-based SPA Router

type RouteHandler = () => HTMLElement | Promise<HTMLElement>;

interface Route {
  path: string;
  handler: RouteHandler;
}

class Router {
  private routes: Route[] = [];
  private container: HTMLElement;
  private currentPath: string = '';

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Router container #${containerId} not found`);
    this.container = el;

    window.addEventListener('hashchange', () => this.handleRoute());
  }

  addRoute(path: string, handler: RouteHandler): Router {
    this.routes.push({ path, handler });
    return this;
  }

  async navigate(path: string) {
    window.location.hash = path;
  }

  async start() {
    if (!window.location.hash) {
      window.location.hash = '#/';
    }
    await this.handleRoute();
  }

  private async handleRoute() {
    const hash = window.location.hash.slice(1) || '/';

    if (hash === this.currentPath) return;
    this.currentPath = hash;

    const route = this.routes.find(r => r.path === hash);

    if (route) {
      const page = await route.handler();
      this.container.innerHTML = '';
      page.classList.add('page-enter');
      this.container.appendChild(page);
    } else {
      // Default to home
      window.location.hash = '#/';
    }
  }
}

export const router = new Router('page-container');
