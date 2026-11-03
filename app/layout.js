import './globals.css';

export const metadata = {
  title: 'NMB Admin',
  description: 'NMB · MARJCC team admin',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
