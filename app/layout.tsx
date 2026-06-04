import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "모닥방 | 공부할 때 켜놓는 디지털 독서실",
  description:
    "공부가 시작되는 가장 포근한 방식. 모닥방은 내 캐릭터와 NPC 친구들이 함께 앉아 언제든 집중할 수 있는 따뜻한 디지털 공부방입니다.",
  openGraph: {
    title: "모닥방 | 공부할 때 켜놓는 디지털 독서실",
    description:
      "언제든 켜두고 집중하는 작은 디지털 공부방. 캐릭터 싱크와 NPC 공부방이 있는 EmberRoom.",
    siteName: "EmberRoom",
    locale: "ko_KR",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "모닥방 | 공부할 때 켜놓는 디지털 독서실",
    description:
      "햇살 공부방부터 비 오는 밤까지, 조용한 NPC와 앱 밖까지 이어지는 캐릭터 싱크가 있는 Study With Me 감성 공부방."
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fff7e8"
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
