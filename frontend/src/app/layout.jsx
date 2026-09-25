import '../styles/globals.css';
import { Providers } from '../components/layout/Providers.jsx';

export const metadata = {
  title: 'ReturnFlow — E-commerce Returns & Reverse Logistics Platform',
  description: 'Production-grade merchant-facing returns management and reverse logistics platform.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="ambient-mesh" />
        <Providers>
          <div className="app-container">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
