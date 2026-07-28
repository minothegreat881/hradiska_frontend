'use client';

import { Facebook, Instagram, Youtube, MessageCircle, Link2, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner@2.0.3';
import { useMember } from '../auth/MemberAuth';
import { recordShare } from '../lib/profileApi';

interface SocialShareProps {
  title: string;
  url?: string;
  /** documentId článku — ak je zadané a člen je prihlásený, zdieľanie sa započíta do profilu */
  postDocumentId?: string;
}

export function SocialShare({ title, url = '', postDocumentId }: SocialShareProps) {
  const { token } = useMember();
  const [copied, setCopied] = useState(false);
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  // best-effort záznam zdieľania (neblokuje samotné zdieľanie)
  const track = (channel: string) => {
    if (token && postDocumentId) recordShare(token, postDocumentId, channel).catch(() => {});
  };
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(currentUrl);

  // FB a WhatsApp zdieľajú odkaz na článok; Instagram a YouTube (bez URL-share)
  // vedú na profily OZ Slovanské hradiská.
  const items = [
    {
      name: 'Facebook',
      Icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'WhatsApp',
      Icon: MessageCircle,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      name: 'Instagram',
      Icon: Instagram,
      href: 'https://www.instagram.com/slovanske_hradiska/',
    },
    {
      name: 'YouTube',
      Icon: Youtube,
      href: 'https://www.youtube.com/@ozhradiska3940',
    },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      track('copy');
      toast.success('Odkaz skopírovaný');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Nepodarilo sa skopírovať odkaz');
    }
  };

  return (
    <div style={{ width: '100%', margin: '40px 0' }}>
      {/* Horná zlatá linka */}
      <div style={{ height: 1, background: 'rgba(196,165,116,0.6)', marginBottom: 16 }} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#a87437',
          }}
        >
          Zdieľať článok
        </span>
        <div style={{ display: 'flex', gap: 10 }}>
          {items.map(({ name, Icon, href }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track(name)}
              aria-label={`Zdieľať na ${name}`}
              title={name}
              style={{
                width: 40,
                height: 40,
                borderRadius: 9999,
                border: '1px solid #a87437',
                background: 'transparent',
                color: '#3a2a1a',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s, color 0.2s',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#a87437';
                e.currentTarget.style.color = '#fffdf8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#3a2a1a';
              }}
            >
              <Icon style={{ width: 18, height: 18 }} />
            </a>
          ))}
          <button
            onClick={copy}
            aria-label="Kopírovať odkaz"
            title={copied ? 'Skopírované' : 'Kopírovať odkaz'}
            style={{
              width: 40,
              height: 40,
              borderRadius: 9999,
              border: '1px solid #a87437',
              background: copied ? '#a87437' : 'transparent',
              color: copied ? '#fffdf8' : '#3a2a1a',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s, color 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!copied) {
                e.currentTarget.style.background = '#a87437';
                e.currentTarget.style.color = '#fffdf8';
              }
            }}
            onMouseLeave={(e) => {
              if (!copied) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#3a2a1a';
              }
            }}
          >
            {copied ? (
              <Check style={{ width: 18, height: 18 }} />
            ) : (
              <Link2 style={{ width: 18, height: 18 }} />
            )}
          </button>
        </div>
      </div>
      {/* Spodná zlatá linka */}
      <div style={{ height: 1, background: 'rgba(196,165,116,0.6)', marginTop: 16 }} />
    </div>
  );
}
