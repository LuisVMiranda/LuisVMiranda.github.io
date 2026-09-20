import type { Locale, SectionId } from './types';

export interface Section {
  id: SectionId;
  label: Record<Locale, string>;
  light: string;
  dark: string;
}

export const sections: Section[] = [
  {
    id: 'brasil',
    label: { 'pt-BR': 'Brasil', en: 'Brazil' },
    light: '#166534',
    dark: '#86EFAC',
  },
  {
    id: 'mundo',
    label: { 'pt-BR': 'Mundo', en: 'World' },
    light: '#1D4ED8',
    dark: '#93C5FD',
  },
  {
    id: 'politica',
    label: { 'pt-BR': 'Política', en: 'Politics' },
    light: '#6D28D9',
    dark: '#C4B5FD',
  },
  {
    id: 'economia',
    label: { 'pt-BR': 'Economia', en: 'Economy' },
    light: '#92400E',
    dark: '#FCD34D',
  },
  {
    id: 'tecnologia',
    label: { 'pt-BR': 'Tecnologia', en: 'Technology' },
    light: '#0E7490',
    dark: '#67E8F9',
  },
  {
    id: 'ciencia',
    label: { 'pt-BR': 'Ciência', en: 'Science' },
    light: '#0F766E',
    dark: '#5EEAD4',
  },
  {
    id: 'cultura',
    label: { 'pt-BR': 'Cultura', en: 'Culture' },
    light: '#9D174D',
    dark: '#F9A8D4',
  },
  {
    id: 'esportes',
    label: { 'pt-BR': 'Esportes', en: 'Sports' },
    light: '#9A3412',
    dark: '#FDBA74',
  },
];

export function sectionLabel(id: SectionId, locale: Locale): string {
  return sections.find((section) => section.id === id)!.label[locale];
}

export function sectionStyle(id: SectionId): string {
  const section = sections.find((item) => item.id === id)!;
  return `--section-light:${section.light};--section-dark:${section.dark}`;
}
