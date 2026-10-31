export type Lang = 'en' | 'fr';

export const langOf = (locale: string | undefined): Lang => (locale === 'fr' ? 'fr' : 'en');

const strings = {
  en: {
    token: 'Token', light: 'Light', dark: 'Dark', value: 'Value', sample: 'Sample', foreground: 'Text or element', background: 'On', ratio: 'Ratio', minimum: 'Minimum', theme: 'Theme',
    primitive: 'Primitive', do: 'Do', dont: "Don't", code: 'Code', sampleText: 'The quick brown fox',
  },
  fr: {
    token: 'Jeton', light: 'Clair', dark: 'Sombre', value: 'Valeur', sample: 'Exemple', foreground: 'Texte ou élément', background: 'Sur', ratio: 'Ratio', minimum: 'Minimum', theme: 'Thème',
    primitive: 'Primitive', do: 'À faire', dont: 'À éviter', code: 'Code', sampleText: 'Portez ce vieux whisky',
  },
} as const;

export const t = (locale: string | undefined) => strings[langOf(locale)];
