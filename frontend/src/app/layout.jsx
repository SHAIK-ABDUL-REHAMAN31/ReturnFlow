import '../styles/globals.css';
import { Providers } from '../components/layout/Providers.jsx';

export const metadata = {
  title: 'ReturnFlow — E-commerce Returns & Reverse Logistics Platform',
  description: 'Production-grade merchant-facing returns management and reverse logistics platform.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500&display=swap"
        />
      </head>
      <body>
        <Providers>
          <div className="app-container">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
