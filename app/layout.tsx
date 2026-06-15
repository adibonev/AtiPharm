import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Аптека Атифарм — брошура",
  description: "Генератор на промоционална брошура за Аптека Атифарм",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bg">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="prem">{children}</body>
    </html>
  );
}
