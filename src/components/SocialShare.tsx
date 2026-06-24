'use client';

import { Facebook, Linkedin, Mail, Link2, Check, Twitter } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner@2.0.3';

interface SocialShareProps {
  title: string;
  url?: string;
}

export function SocialShare({ title, url = '' }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(currentUrl);

  const items = [
    {
      name: 'Facebook',
      Icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'X',
      Icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
    {
      name: 'LinkedIn',
      Icon: Linkedin,
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
    },
    {
      name: 'E-mail',
      Icon: Mail,
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
    },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
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
