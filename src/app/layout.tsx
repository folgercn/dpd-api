import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DPD Extension API",
  description: "提供给 Chrome 扩展使用的激活校验和 AI 地址解析后端",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
      </body>
    </html>
  );
}
