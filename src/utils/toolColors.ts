export interface ToolTheme {
  bg: string;
  text: string;
  border: string;
}

const THEMES: Record<string, ToolTheme> = {
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200/80 dark:border-emerald-800/60',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200/80 dark:border-rose-800/60',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200/80 dark:border-blue-800/60',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200/80 dark:border-amber-800/60',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200/80 dark:border-purple-800/60',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200/80 dark:border-teal-800/60',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200/80 dark:border-indigo-800/60',
  },
  fuchsia: {
    bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/40',
    text: 'text-fuchsia-600 dark:text-fuchsia-400',
    border: 'border-fuchsia-200/80 dark:border-fuchsia-800/60',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-200/80 dark:border-cyan-800/60',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200/80 dark:border-orange-800/60',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200/80 dark:border-violet-800/60',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200/80 dark:border-red-800/60',
  },
};

// Tool ID to Theme Key mapping for colorful, distinct tool icons
const TOOL_THEME_MAP: Record<string, keyof typeof THEMES> = {
  // Compressors (Green/Emerald)
  'image-compressor': 'emerald',
  'compress-image-to-20kb': 'emerald',
  'compress-image-to-50kb': 'teal',
  'compress-image-to-100kb': 'cyan',
  'pdf-compressor': 'emerald',
  'compress-pdf-to-100kb': 'teal',
  'compress-pdf-to-200kb': 'cyan',
  'audio-compressor': 'emerald',
  'video-compressor': 'teal',

  // PDF Core Suite (Vibrant Red, Rose, Violet, Blue, Amber)
  'merge-pdf': 'rose',
  'split-pdf': 'orange',
  'rotate-pdf': 'indigo',
  'protect-pdf': 'red',
  'unlock-pdf': 'emerald',
  'add-watermark-to-pdf': 'purple',
  'add-page-numbers-to-pdf': 'cyan',
  'remove-pdf-pages': 'rose',
  'pdf-editor': 'violet',

  // Document Converters (Word = Blue, Excel = Teal/Emerald, Images = Amber/Fuchsia)
  'word-to-pdf': 'blue',
  'pdf-to-word': 'blue',
  'excel-to-pdf': 'emerald',
  'pdf-to-excel': 'teal',
  'jpg-to-pdf': 'amber',
  'pdf-to-jpg': 'amber',

  // Image Utilities
  'image-resizer': 'blue',
  'image-cropper': 'cyan',
  'jpg-to-png': 'violet',
  'png-to-jpg': 'amber',
  'webp-converter': 'fuchsia',

  // Video Utilities
  'video-trimmer': 'purple',
  'video-to-gif': 'fuchsia',
  'video-resizer': 'indigo',
  'video-converter': 'violet',
  'instagram-video-downloader': 'fuchsia',
  'facebook-video-downloader': 'blue',
  'youtube-video-downloader': 'red',
  'tiktok-video-downloader': 'cyan',
  'twitter-video-downloader': 'blue',
  'all-video-downloader': 'purple',

  // Audio Utilities
  'mp4-to-mp3': 'amber',
  'audio-extractor': 'orange',
  'audio-converter': 'amber',
  'wav-to-mp3': 'violet',
  'mp3-to-wav': 'indigo',

  // Developer & File Utilities
  'hash-generator': 'emerald',
  'base64-encoder-decoder': 'cyan',
  'file-size-calculator': 'blue',
  'zip-creator': 'amber',
  'file-converter': 'indigo',
};

// Category fallback themes
const CATEGORY_DEFAULT_THEMES: Record<string, keyof typeof THEMES> = {
  image: 'blue',
  video: 'purple',
  audio: 'amber',
  pdf: 'rose',
  file: 'teal',
};

export function getToolTheme(toolId: string, category?: string): ToolTheme {
  const themeKey = TOOL_THEME_MAP[toolId] || (category ? CATEGORY_DEFAULT_THEMES[category] : 'blue') || 'blue';
  return THEMES[themeKey] || THEMES.blue;
}
