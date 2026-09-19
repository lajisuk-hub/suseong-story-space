import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://suseong-story-space.vercel.app"),
  title: "수성구 AI 선도기관 성과전시회",
  description: "읽고싶은 책을 클릭 후 소감을 남겨주세요!",
  openGraph: {
    title: "수성구 AI 선도기관 성과전시회",
    description: "읽고싶은 책을 클릭 후 소감을 남겨주세요!",
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
        <link href="https://fonts.googleapis.com/css2?family=Jua&family=Gowun+Batang:wght@400;700&display=swap" rel="stylesheet" />
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
