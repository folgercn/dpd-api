import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import StyledComponentsRegistry from "@/lib/AntdRegistry";
import { AuthProvider } from "@/components/AuthProvider";
import { ConfigProvider, theme } from "antd";
import zhCN from "antd/locale/zh_CN";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DPD 快递管理平台 | OMS",
  description: "基于自动化脚本的 DPD 批量出单与管理系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AuthProvider>
          <StyledComponentsRegistry>
            <ConfigProvider
              locale={zhCN}
              theme={{
                token: {
                  colorPrimary: "#1890ff",
                  borderRadius: 6,
                },
              }}
            >
              {children}
            </ConfigProvider>
          </StyledComponentsRegistry>
        </AuthProvider>
      </body>
    </html>
  );
}
