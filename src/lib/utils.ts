// Utility helpers

export function $(selector: string, parent: Element | Document = document): HTMLElement | null {
  return parent.querySelector(selector);
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  ...children: (string | HTMLElement)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'className') {
        el.className = value;
      } else if (key === 'textContent') {
        el.textContent = value;
      } else if (key === 'innerHTML') {
        el.innerHTML = value;
      } else {
        el.setAttribute(key, value);
      }
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else {
      el.appendChild(child);
    }
  }
  return el;
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): HTMLElement {
  const template = document.createElement('template');
  template.innerHTML = strings.reduce((result, str, i) => {
    const value = values[i] ?? '';
    return result + str + String(value);
  }, '').trim();
  return template.content.firstElementChild as HTMLElement;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
