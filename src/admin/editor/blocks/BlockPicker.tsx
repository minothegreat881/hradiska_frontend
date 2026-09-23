'use client';

/**
 * Výber typu bloku.
 *
 * Dve podoby toho istého:
 *   • `variant="empty"` — veľká dlaždica pre prázdny článok. Predtým tu bola
 *     len veta „Pridajte prvý tlačidlom +", lenže tlačidlá „+" sa kreslia LEN
 *     medzi existujúce bloky — pri prázdnom článku teda neexistovalo žiadne
 *     a nedal sa vôbec začať.
 *   • `variant="menu"` — kompaktná ponuka pod tlačidlom „+" medzi blokmi.
 *
 * Ikony a popisy sú na jednom mieste, aby sa obe podoby nikdy nerozišli.
 */

import React from 'react';
import {
  AlignLeft, Image as ImageIcon, Quote, BookMarked, Youtube, Feather, Images,
  type LucideIcon,
} from 'lucide-react';

export interface BlockType {
  id: string;
  label: string;
  accent: string;
}

const META: Record<string, { icon: LucideIcon; hint: string }> = {
  'content.rich-text': { icon: AlignLeft, hint: 'Odsek, nadpis alebo odrážky' },
  'content.image-block': { icon: ImageIcon, hint: 'Jeden obrázok s popisom' },
  'content.quote-block': { icon: Quote, hint: 'Dobový prameň — kronika, listina' },
  'content.sources': { icon: BookMarked, hint: 'Zoznam literatúry a odkazov' },
  'content.embed': { icon: Youtube, hint: 'YouTube, Vimeo alebo Sketchfab' },
  'content.poem': { icon: Feather, hint: 'Verše so zachovaným zalomením' },
  'content.image-gallery': { icon: Images, hint: 'Mriežka viacerých obrázkov' },
};

export const blockIcon = (type: string): LucideIcon => META[type]?.icon || AlignLeft;
export const blockHint = (type: string): string => META[type]?.hint || '';

export function BlockPicker({
  blockTypes,
  onPick,
  variant = 'menu',
  onClose,
}: {
  blockTypes: BlockType[];
  onPick: (type: string) => void;
  variant?: 'empty' | 'menu';
  onClose?: () => void;
}) {
  if (variant === 'empty') {
    return (
      <div className="ed-empty">
        <div className="ed-empty-head">
          <strong>Začnite článok</strong>
          <span>Vyberte, čím sa má začať. Ďalšie bloky pridáte tlačidlom „+“ medzi nimi.</span>
        </div>
        <div className="ed-empty-grid">
          {blockTypes.map((t) => {
            const Icon = blockIcon(t.id);
            return (
              <button key={t.id} type="button" className="ed-empty-card" onClick={() => onPick(t.id)}>
                <span className="ed-empty-icon" style={{ background: t.accent }}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="ed-empty-label">{t.label}</span>
                <span className="ed-empty-hint">{blockHint(t.id)}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="ed-menu" role="menu">
      <div className="ed-menu-head">
        Vložiť blok
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Zavrieť">✕</button>
        )}
      </div>
      {blockTypes.map((t) => {
        const Icon = blockIcon(t.id);
        return (
          <button key={t.id} type="button" role="menuitem" onClick={() => onPick(t.id)}>
            <span className="ed-menu-icon" style={{ background: t.accent }}>
              <Icon className="w-3.5 h-3.5" />
            </span>
            <span className="ed-menu-text">
              <b>{t.label}</b>
              <i>{blockHint(t.id)}</i>
            </span>
          </button>
        );
      })}
    </div>
  );
}
