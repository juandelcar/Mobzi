'use client';

import { useEffect } from 'react';

/**
 * Componente que agrega los meta tags necesarios para PWA
 * en el head del documento
 */
export default function PWAHeadTags() {
  useEffect(() => {
    // Agregar link al manifest si no existe
    if (typeof document !== 'undefined') {
      const existingManifest = document.querySelector('link[rel="manifest"]');
      if (!existingManifest) {
        const manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = '/manifest.json';
        document.head.appendChild(manifestLink);
      }

      // Agregar meta tags para PWA
      const metaTags = [
        { name: 'theme-color', content: '#2563EB' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Mobzi' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'application-name', content: 'Mobzi' },
      ];

      metaTags.forEach(({ name, content }) => {
        const existing = document.querySelector(`meta[name="${name}"]`);
        if (!existing) {
          const meta = document.createElement('meta');
          meta.name = name;
          meta.content = content;
          document.head.appendChild(meta);
        }
      });

      // Agregar apple-touch-icon si no existe
      const existingAppleIcon = document.querySelector('link[rel="apple-touch-icon"]');
      if (!existingAppleIcon) {
        const appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        appleIcon.href = '/square_logo.png';
        document.head.appendChild(appleIcon);
      }
    }
  }, []);

  return null;
}

