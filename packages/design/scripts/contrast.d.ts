export interface ContrastRow {
  fg: string;
  on: string;
  theme: 'light' | 'dark';
  min: number;
  ratio: number | null;
}
export function parseColor(value: string): [number, number, number, number];
export function contrastReport(tokens: { path: string; light: string; dark: string }[], pairs: { fg: string; on: string[]; min: number }[]): ContrastRow[];
