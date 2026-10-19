export interface NavItem {
  label: string;
  href: string;
}

export const HEADER_NAV_ITEMS: NavItem[] = [
  { label: 'Tools', href: '/tools' },
  { label: 'Guides', href: '/guides' },
  { label: 'Image Tools', href: '/image-tools' },
  { label: 'Video Tools', href: '/video-tools' },
  { label: 'Audio Tools', href: '/audio-tools' },
  { label: 'PDF Tools', href: '/pdf-tools' },
  { label: 'File Tools', href: '/file-tools' },
];

export const FOOTER_LINKS = {
  tools: [
    { label: 'Image Tools', href: '/image-tools' },
    { label: 'Video Tools', href: '/video-tools' },
    { label: 'Audio Tools', href: '/audio-tools' },
    { label: 'PDF Tools', href: '/pdf-tools' },
    { label: 'File Tools', href: '/file-tools' },
    { label: 'All Tools Catalog', href: '/tools' },
  ],
  popular: [
    { label: 'Sarkari Photo Resizer', href: 'https://sarkariframe.quickvero.in' },
    { label: 'Image Compressor', href: '/tools/image-compressor' },
    { label: 'Compress to 20KB', href: '/tools/compress-image-to-20kb' },
    { label: 'PDF Compressor', href: '/tools/pdf-compressor' },
    { label: 'JPG to PDF', href: '/tools/jpg-to-pdf' },
    { label: 'QR Menu Maker', href: '/tools/qr-menu-maker' },
    { label: 'MP4 to MP3', href: '/tools/mp4-to-mp3' },
  ],
  company: [
    { label: 'Guides & Tutorials', href: '/guides' },
    { label: 'About Us', href: '/about' },
    { label: 'Contact & Feedback', href: '/contact' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Disclaimer', href: '/disclaimer' },
  ]
};
