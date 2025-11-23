import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import AuthProviderWrapper from "@/components/AuthProvider";
import BackendConfigWrapper from "@/components/BackendConfigWrapper";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import PWAHeadTags from "@/components/PWAHeadTags";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900",
  ],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MOBZI",
  description: "Plataforma para encontrar rutas.",
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/square_logo.png', sizes: '192x192', type: 'image/png' },
      { url: '/square_logo.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/square_logo.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Mobzi',
  },
  themeColor: '#2563EB',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable}`}>
        <PWAHeadTags />
        <AuthProviderWrapper>
          <ServiceWorkerRegistration />
          {children}
          <BackendConfigWrapper />
          <PWAInstallPrompt />
        </AuthProviderWrapper>
      </body>
    </html>
  );
}

// export default function RootLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <html lang="es">
//       <body className={poppins.className}>
//         {children}
//       </body>
//     </html>
//   );
// }
