import './globals.css';

export const metadata = {
  title: 'Batch Image Warp Editor',
  description: 'AI-powered image perspective correction and stretching tool',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
