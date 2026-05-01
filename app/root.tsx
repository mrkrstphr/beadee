import { QueryClientProvider } from '@tanstack/react-query';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import './index.css';
import { queryClient } from './queryClient';

const THEME_COLORS: Record<string, string> = {
  light: '#0969da',
  dark: '#58a6ff',
  dracula: '#bd93f9',
  synthwave: '#f72585',
  hacker: '#00ff41',
};

export function applyThemeColor(theme: string) {
  const resolved =
    theme === 'auto'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;
  const color = THEME_COLORS[resolved] ?? THEME_COLORS.light;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
}

const themeScript = `
  try {
    const THEME_COLORS = ${JSON.stringify(THEME_COLORS)};
    const t = localStorage.getItem('beadee-theme') || 'auto'
    const resolved = t === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : t
    document.documentElement.dataset.theme = resolved
    const color = THEME_COLORS[resolved] || THEME_COLORS.light
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
  } catch(e) {}
`;

export default function Root() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>beadee</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="theme-color" content="#0969da" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <Meta />
        <Links />
        {/* eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <Outlet />
        </QueryClientProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
