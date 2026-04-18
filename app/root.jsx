import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import './index.css';

// Inline script applied before first paint to avoid theme flash.
const themeScript = `
  try {
    const t = localStorage.getItem('beadee-theme') || 'dark'
    document.documentElement.dataset.theme =
      t === 'auto'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : t
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
        <Meta />
        <Links />
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
