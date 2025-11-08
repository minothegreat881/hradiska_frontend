'use client';

import { Facebook, Twitter, Linkedin, Link2, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface SocialShareProps {
  title: string;
  url?: string;
}

export function SocialShare({ title, url = '' }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(currentUrl);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <h3 
        className="text-stone-800 dark:text-stone-200 uppercase tracking-wide text-sm"
        style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '0.1em' }}
      >
        Zdieľať článok
      </h3>
      
      <div className="flex flex-wrap gap-3">
        <motion.a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-lg transition-colors flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Zdieľať na Facebooku"
        >
          <Facebook className="w-5 h-5" />
          <span className="text-sm" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>Facebook</span>
        </motion.a>

        <motion.a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 bg-[#1DA1F2] hover:bg-[#1A94DA] text-white rounded-lg transition-colors flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Zdieľať na Twitteri"
        >
          <Twitter className="w-5 h-5" />
          <span className="text-sm" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>Twitter</span>
        </motion.a>

        <motion.a
          href={shareLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 bg-[#0A66C2] hover:bg-[#095196] text-white rounded-lg transition-colors flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Zdieľať na LinkedIn"
        >
          <Linkedin className="w-5 h-5" />
          <span className="text-sm" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>LinkedIn</span>
        </motion.a>

        <motion.a
          href={shareLinks.email}
          className="p-3 bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Zdieľať emailom"
        >
          <Mail className="w-5 h-5" />
          <span className="text-sm" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>Email</span>
        </motion.a>

        <motion.button
          onClick={copyToClipboard}
          className="p-3 bg-stone-700 hover:bg-stone-800 dark:bg-stone-600 dark:hover:bg-stone-700 text-white rounded-lg transition-colors flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Kopírovať odkaz"
        >
          <Link2 className="w-5 h-5" />
          <span className="text-sm" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {copied ? 'Skopírované!' : 'Kopírovať'}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
