import "./globals.css";

export const metadata = {
  title: "동화책 우주 전시관 | 수성구 AI 선도기관 성과보고회",
  description: "우주에 떠다니는 동화책을 눌러 읽고, 후기 한마디를 우주에 띄워 보세요.",
  openGraph: {
    title: "동화책 우주 전시관",
    description: "수성구 AI 선도기관 성과보고회 · 동화책을 읽고 후기를 우주에 띄워 보세요",
    images: ["/space1.jpg"],
  },
};

export const viewport = { width: "device-width", initialScale: 1, maximumScale: 1, themeColor: "#1a1147" };

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Jua&display=swap" rel="stylesheet" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <link rel="preload" as="image" href="/space1.jpg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
