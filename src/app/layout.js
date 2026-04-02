import './globals.css';

export const metadata = {
  title: '图片变形编辑器',
  description: '批量图片拉伸编辑器',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
