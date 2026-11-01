export interface Token {
  path: string;
  variable: string;
  type: string;
  description?: string;
  layer: 'scale' | 'semantic';
  light: string;
  dark: string;
  css: boolean;
}
export const tokens: Token[];
export const primitives: { path: string; value: string }[];
