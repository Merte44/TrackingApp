import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Eigene Textgrößen aus tailwind.config.js (fontSize) — sonst hält tailwind-merge
// z. B. `text-title2` für eine Farbe und verwirft `text-foreground`.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'large-title',
            'title1',
            'title2',
            'title3',
            'headline',
            'body',
            'callout',
            'subhead',
            'footnote',
            'caption',
            'caption2',
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
