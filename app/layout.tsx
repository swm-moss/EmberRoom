import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "모닥방 — 앱을 나가면, 내 캐릭터도 폰을 봅니다",
  description:
    "공부할 때 켜놓는 따뜻한 디지털 독서실. 내 캐릭터가 함께 앉아 집중하고, 앱을 나가면 캐릭터도 슬쩍 폰을 봅니다."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#15110d"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
