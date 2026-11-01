export type Lang = 'en' | 'fr';

export const langOf = (locale: string | undefined): Lang => (locale === 'fr' ? 'fr' : 'en');

const strings = {
  en: {
    token: 'Token', light: 'Light', dark: 'Dark', value: 'Value', sample: 'Sample', foreground: 'Text or element', background: 'On', ratio: 'Ratio', minimum: 'Minimum', theme: 'Theme',
    primitive: 'Primitive', do: 'Do', dont: "Don't", code: 'Code', sampleText: 'The quick brown fox',
    language: 'Language', toggleTheme: 'Toggle theme', links: 'Links', website: 'Website', pauseAnimation: 'Pause animation', resumeAnimation: 'Resume animation',
  },
  fr: {
    token: 'Jeton', light: 'Clair', dark: 'Sombre', value: 'Valeur', sample: 'Exemple', foreground: 'Texte ou élément', background: 'Sur', ratio: 'Ratio', minimum: 'Minimum', theme: 'Thème',
    primitive: 'Primitive', do: 'À faire', dont: 'À éviter', code: 'Code', sampleText: 'Portez ce vieux whisky',
    language: 'Langue', toggleTheme: 'Changer de thème', links: 'Liens', website: 'Site web', pauseAnimation: 'Mettre en pause l’animation', resumeAnimation: 'Reprendre l’animation',
  },
} as const;

export const t = (locale: string | undefined) => strings[langOf(locale)];
