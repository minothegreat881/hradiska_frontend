'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Send, ThumbsUp, Reply, Feather, Calendar } from 'lucide-react';

interface Comment {
  id: string;
  author: string;
  content: string;
  date: string;
  likes: number;
  replies?: Comment[];
}

const mockComments: Comment[] = [
  {
    id: '1',
    author: 'Marián Novák',
    content: 'Vynikajúci článok! Veľmi zaujímavé informácie o Veľkej Morave. Určite navštívim Bojnú.',
    date: '2025-01-15',
    likes: 12,
    replies: [
      {
        id: '1-1',
        author: 'Peter Horváth',
        content: 'Súhlasím, Bojná je určite stojí za návštevu. Odporúčam aj múzeum v Nitre.',
        date: '2025-01-16',
        likes: 5,
      }
    ]
  },
  {
    id: '2',
    author: 'Jana Kováčová',
    content: 'Zaujímavé archeologické nálezy. Máte aj informácie o výskumoch v Pobedime?',
    date: '2025-01-14',
    likes: 8,
  },
];

export function CommentSection() {
  const [comments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState('');
  const [name, setName] = useState('');

  return (
    <div className="relative">
      {/* Decorative header with parchment style */}
      <div className="flex items-center justify-center gap-4 mb-10 relative">
        <div className="absolute inset-0 flex items-center pointer-events-none">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-600/30 to-transparent"></div>
        </div>
        <div className="relative px-6 py-3 bg-gradient-to-br from-amber-100 via-amber-50 to-stone-50 dark:from-amber-950/40 dark:via-stone-900 dark:to-stone-950 border-4 border-double border-amber-600/40 rounded-lg shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-600 dark:bg-amber-700 rounded-full">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h2 
              className="text-2xl text-amber-950 dark:text-amber-100 uppercase tracking-widest"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '0.15em' }}
            >
              Diskusia
            </h2>
            <span className="px-3 py-1 bg-amber-600 dark:bg-amber-700 text-white rounded-full text-sm" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              {comments.length}
            </span>
          </div>
        </div>
      </div>

      {/* Comment form - Parchment style */}
      <motion.div 
        className="mb-12 p-8 bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50/50 dark:from-stone-900 dark:via-amber-950/20 dark:to-stone-950 border-4 border-amber-800/30 rounded-2xl shadow-xl relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Decorative corners */}
        <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-600/40 rounded-tl-lg"></div>
        <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-600/40 rounded-tr-lg"></div>
        <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-600/40 rounded-bl-lg"></div>
        <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-600/40 rounded-br-lg"></div>
        
        {/* Quill icon header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-dashed border-amber-600/30">
          <div className="p-2 bg-amber-600 dark:bg-amber-700 rounded-lg">
            <Feather className="w-5 h-5 text-white" />
          </div>
          <h3 
            className="text-xl text-amber-900 dark:text-amber-200 uppercase tracking-wide"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '0.1em' }}
          >
            Pridať komentár
          </h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label 
              className="block text-sm text-stone-600 dark:text-stone-400 mb-2"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Meno
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vaše meno"
              className="w-full px-5 py-3 bg-white dark:bg-stone-800 border-2 border-amber-600/30 dark:border-amber-700/30 rounded-xl focus:border-amber-600 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-600/20 outline-none transition-all text-stone-900 dark:text-stone-100 shadow-sm"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            />
          </div>

          <div>
            <label 
              className="block text-sm text-stone-600 dark:text-stone-400 mb-2"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Komentár
            </label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Napište svoj komentár..."
              rows={5}
              className="w-full px-5 py-4 bg-white dark:bg-stone-800 border-2 border-amber-600/30 dark:border-amber-700/30 rounded-xl focus:border-amber-600 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-600/20 outline-none transition-all resize-none text-stone-900 dark:text-stone-100 shadow-sm"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 dark:from-amber-600 dark:to-amber-700 dark:hover:from-amber-700 dark:hover:to-amber-800 text-white rounded-xl transition-all flex items-center gap-3 shadow-lg hover:shadow-xl border-2 border-amber-800/30"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            <Feather className="w-5 h-5" />
            <span className="uppercase tracking-wide text-sm">Odoslať komentár</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Comments list - Scroll/Parchment style */}
      <div className="space-y-6">
        {comments.map((comment, idx) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 20, rotateX: -10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            className="p-8 bg-gradient-to-br from-white via-amber-50/30 to-stone-50 dark:from-stone-900/80 dark:via-amber-950/20 dark:to-stone-950/80 border-l-4 border-amber-600 dark:border-amber-500 rounded-xl shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden"
            whileHover={{ y: -4 }}
          >
            {/* Decorative corner stamp */}
            <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-amber-600/10 dark:bg-amber-500/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-amber-600/40 dark:text-amber-500/40" />
            </div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-white border-4 border-white dark:border-stone-900 shadow-lg" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  <span className="text-lg">{comment.author.charAt(0)}</span>
                </div>
                <div>
                  <div className="text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    {comment.author}
                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-xs rounded uppercase tracking-wide">
                      Čitateľ
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-1" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    <Calendar className="w-3 h-3" />
                    {new Date(comment.date).toLocaleDateString('sk-SK', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>

            <p 
              className="text-stone-700 dark:text-stone-300 mb-6 leading-relaxed text-base"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {comment.content}
            </p>

            <div className="flex items-center gap-4 pt-4 border-t border-amber-600/20">
              <motion.button 
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ThumbsUp className="w-4 h-4" />
                <span style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{comment.likes}</span>
              </motion.button>
              <motion.button 
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Reply className="w-4 h-4" />
                <span style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>Odpovedať</span>
              </motion.button>
            </div>

            {/* Replies - Nested parchment style */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-6 ml-8 space-y-4 pl-4 border-l-2 border-dashed border-amber-600/30">
                {comment.replies.map((reply) => (
                  <motion.div
                    key={reply.id}
                    className="p-5 bg-gradient-to-br from-stone-50 to-amber-50/50 dark:from-stone-800/50 dark:to-amber-950/10 border-2 border-amber-800/20 rounded-lg shadow-md relative"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {/* Reply indicator */}
                    <div className="absolute -left-[18px] top-6 w-4 h-px bg-amber-600/30"></div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white text-sm" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                        {reply.author.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm text-stone-900 dark:text-stone-100" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                          {reply.author}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                          {new Date(reply.date).toLocaleDateString('sk-SK', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                    <p 
                      className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed"
                      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                    >
                      {reply.content}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <button className="flex items-center gap-1 text-xs text-stone-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
                        <ThumbsUp className="w-3 h-3" />
                        <span style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{reply.likes}</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
