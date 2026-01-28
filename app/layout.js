import './globals.css';
import { ToastProvider } from '../components/ToastProvider';

export const metadata = {
  title: 'AI WARS Admin',
  description: 'Admin dashboard for AI WARS Hackathon',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
