'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Grid3x3, 
  LayoutGrid, 
  Search, 
  X, 
  ZoomIn, 
  Download, 
  Calendar,
  MapPin,
  Tag,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Filter,
  Boxes,
  Mountain,
  Camera,
  Share2,
  Link as LinkIcon,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Check
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import Masonry from 'react-responsive-masonry';
import { toast } from 'sonner@2.0.3';

interface GalleryImage {
  id: string;
  url: string;
  title: string;
  description: string;
  location: string;
  date: string;
  category: 'fotografie' | '3d-modely' | 'vypravy';
  tags: string[];
  photographer?: string;
  width?: number;
  height?: number;
}

const mockGalleryImages: GalleryImage[] = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1712186567189-161a80d881a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmNpZW50JTIwZm9ydGlmaWNhdGlvbiUyMGFlcmlhbHxlbnwxfHx8fDE3NjIyNzI2MDB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Nitrianske hradisko - letecký pohľad',
    description: 'Úchvatný pohľad na Nitrianske hradisko zo vzduchu, kde je viditeľná celá štruktúra opevnenia.',
    location: 'Nitra, Slovensko',
    date: '2024-06-15',
    category: 'fotografie',
    tags: ['Veľká Morava', 'Nitra', 'Letecká fotografia'],
    photographer: 'Martin Horáček',
    width: 1920,
    height: 1080
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1680598205249-de51b94e5de9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmNoYWVvbG9naWNhbCUyMGV4Y2F2YXRpb24lMjBzaXRlfGVufDF8fHx8MTc2MjI3MjYwMHww&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Archeologický výskum v Bojnej',
    description: 'Detailný záber na prebiehajúci archeologický výskum v lokalite Bojná.',
    location: 'Bojná, Slovensko',
    date: '2024-05-20',
    category: 'fotografie',
    tags: ['Veľká Morava', 'Bojná', 'Výskum'],
    photographer: 'Peter Šimko',
    width: 720,
    height: 1080
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1626880700245-0fe6ffa47742?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpZXZhbCUyMGNhc3RsZSUyMHJ1aW5zfGVufDF8fHx8MTc2MjI3MjYwMHww&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Devínske hradisko - ruiny',
    description: 'Romantické ruiny Devínskeho hradiska za súmraku.',
    location: 'Devín, Bratislava',
    date: '2024-04-10',
    category: 'fotografie',
    tags: ['Veľká Morava', 'Devín', 'Ruiny'],
    photographer: 'Jana Nováková',
    width: 720,
    height: 1080
  },
  {
    id: '4',
    url: 'https://images.unsplash.com/photo-1529080666093-e863229ff121?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXN0b3JpYyUyMHNldHRsZW1lbnQlMjBsYW5kc2NhcGV8ZW58MXx8fHwxNzYyMjcyNjAxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Historické osídlenie - krajina',
    description: 'Panoráma historického osídlenia v kontexte krajiny.',
    location: 'Veľká Morava',
    date: '2024-03-15',
    category: 'fotografie',
    tags: ['Krajina', 'Osídlenie'],
    width: 1920,
    height: 1080
  },
  {
    id: '5',
    url: 'https://images.unsplash.com/photo-1690428083668-1a22f1fd2895?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmNpZW50JTIwcnVpbnMlMjBuYXR1cmV8ZW58MXx8fHwxNzYyMjcyNjAxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Antické ruiny v prírode',
    description: 'Starobylé ruiny zarastené zeleňou.',
    location: 'Európa',
    date: '2024-02-20',
    category: 'fotografie',
    tags: ['Ruiny', 'Príroda'],
    width: 720,
    height: 1080
  },
  {
    id: '6',
    url: 'https://images.unsplash.com/photo-1644176041496-393d63975fba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmNoYWVvbG9naWNhbCUyMGFydGlmYWN0cyUyMHBvdHRlcnl8ZW58MXx8fHwxNzYyMjcyNjAxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Keramické nálezy',
    description: 'Zbierka archeologických nálezov - keramika z obdobia Veľkej Moravy.',
    location: 'Archeologické múzeum',
    date: '2024-01-10',
    category: '3d-modely',
    tags: ['Nálezy', 'Keramika', '3D'],
    width: 1920,
    height: 1080
  },
  {
    id: '7',
    url: 'https://images.unsplash.com/photo-1708550004534-fca36d5778dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdG9uZSUyMHdhbGxzJTIwZm9ydHJlc3N8ZW58MXx8fHwxNzYyMjcyNjAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Kamenné opevnenie',
    description: 'Detail kamenných hradieb slovanského hradiska.',
    location: 'Stredná Európa',
    date: '2023-12-15',
    category: 'fotografie',
    tags: ['Opevnenie', 'Kameň'],
    width: 720,
    height: 1080
  },
  {
    id: '8',
    url: 'https://images.unsplash.com/photo-1592409787595-8dfe6bea4a36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXN0b3JpY2FsJTIwbW9udW1lbnQlMjBldXJvcGV8ZW58MXx8fHwxNzYyMjcyNjAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Historická pamiatka Európy',
    description: 'Významná historická pamiatka v európskom kontexte.',
    location: 'Európa',
    date: '2023-11-20',
    category: 'fotografie',
    tags: ['Pamiatka', 'Európa'],
    width: 1920,
    height: 1080
  },
  {
    id: '9',
    url: 'https://images.unsplash.com/photo-1760898994368-df95b3b929c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmNpZW50JTIwYXJjaGl0ZWN0dXJlJTIwc3RvbmV8ZW58MXx8fHwxNzYyMjA2NDQxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Antická architektúra',
    description: 'Kamenná architektúra staroveku.',
    location: 'Stredozemie',
    date: '2023-10-05',
    category: 'fotografie',
    tags: ['Architektúra', 'Antika'],
    width: 720,
    height: 1080
  },
  {
    id: '10',
    url: 'https://images.unsplash.com/photo-1701595008373-19f299a0f0a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpZXZhbCUyMGZvcnRyZXNzJTIwbGFuZHNjYXBlfGVufDF8fHx8MTc2MjI3MjYwM3ww&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Stredoveká pevnosť v krajine',
    description: 'Stredoveká pevnosť v malebnej krajine.',
    location: 'Stredná Európa',
    date: '2013-07-15',
    category: 'vypravy',
    tags: ['Výprava', 'Pevnosť', 'Vikingovia 2013'],
    photographer: 'Expedičný tím',
    width: 1920,
    height: 1080
  },
  {
    id: '11',
    url: 'https://images.unsplash.com/photo-1760637626924-c3d7afbc39e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmNoYWVvbG9naWNhbCUyMG11c2V1bSUyMGRpc3BsYXl8ZW58MXx8fHwxNzYyMjcyNjAzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Múzejná expozícia',
    description: 'Archeologická múzejná expozícia s nálezmi.',
    location: 'Archeologické múzeum',
    date: '2023-08-20',
    category: '3d-modely',
    tags: ['Múzeum', 'Expozícia', '3D'],
    width: 720,
    height: 1080
  },
  {
    id: '12',
    url: 'https://images.unsplash.com/photo-1608717310359-3a1e90a53504?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmNpZW50JTIwY2l2aWxpemF0aW9uJTIwcnVpbnN8ZW58MXx8fHwxNzYyMTkyNjU2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Ruiny antickej civilizácie',
    description: 'Pozostatky starovekej civilizácie.',
    location: 'Južná Európa',
    date: '2012-08-10',
    category: 'vypravy',
    tags: ['Ruiny', 'Antika', 'Arkona 2012'],
    photographer: 'Expedičný tím',
    width: 1920,
    height: 1080
  },
];

export function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'masonry' | 'grid'>('masonry');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const categories = [
    { id: 'all', label: 'Všetko', icon: ImageIcon, count: mockGalleryImages.length },
    { id: 'fotografie', label: 'Fotografie', icon: Camera, count: mockGalleryImages.filter(i => i.category === 'fotografie').length },
    { id: '3d-modely', label: '3D Modely', icon: Boxes, count: mockGalleryImages.filter(i => i.category === '3d-modely').length },
    { id: 'vypravy', label: 'Výpravy', icon: Mountain, count: mockGalleryImages.filter(i => i.category === 'vypravy').length },
  ];

  const filteredImages = useMemo(() => {
    return mockGalleryImages.filter(image => {
      const matchesCategory = selectedCategory === 'all' || image.category === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        image.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const openLightbox = (image: GalleryImage) => {
    setSelectedImage(image);
    setCurrentImageIndex(filteredImages.findIndex(img => img.id === image.id));
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const goToPrevious = () => {
    const newIndex = (currentImageIndex - 1 + filteredImages.length) % filteredImages.length;
    setCurrentImageIndex(newIndex);
    setSelectedImage(filteredImages[newIndex]);
  };

  const goToNext = () => {
    const newIndex = (currentImageIndex + 1) % filteredImages.length;
    setCurrentImageIndex(newIndex);
    setSelectedImage(filteredImages[newIndex]);
  };

  const getImageUrl = (image: GalleryImage) => {
    return `${window.location.origin}/galeria/${image.id}`;
  };

  const handleCopyLink = async () => {
    if (!selectedImage) return;
    const url = getImageUrl(selectedImage);
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link bol skopírovaný do schránky');
      setShowShareMenu(false);
    } catch (err) {
      toast.error('Nepodarilo sa skopírovať link');
    }
  };

  const handleShareFacebook = () => {
    if (!selectedImage) return;
    const url = getImageUrl(selectedImage);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  const handleShareTwitter = () => {
    if (!selectedImage) return;
    const url = getImageUrl(selectedImage);
    const text = `${selectedImage.title} - ${selectedImage.location}`;
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  const handleShareLinkedIn = () => {
    if (!selectedImage) return;
    const url = getImageUrl(selectedImage);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  const handleShareEmail = () => {
    if (!selectedImage) return;
    const url = getImageUrl(selectedImage);
    const subject = `Fotogaléria Hradísk - ${selectedImage.title}`;
    const body = `Pozrite si túto fotografiu: ${selectedImage.title}\n\nLokalita: ${selectedImage.location}\n\n${url}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setShowShareMenu(false);
  };

  const isHorizontal = (image: GalleryImage) => {
    return image.width && image.height && image.width > image.height;
  };

  return (
    <div className="min-h-screen parchment">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b-4 border-double border-amber-800/30">
        {/* Background Image */}
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1605376286538-057633a2f7d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpZXZhbCUyMGNhc3RsZSUyMGZvcnRyZXNzfGVufDF8fHx8MTc2MjI0NjQ4NHww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Hradisko - archeologická lokalita"
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80"></div>
        </div>

        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%23ffffff' fill-opacity='0.3'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        <div className="container relative z-10 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Decorative icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 mb-6 shadow-2xl"
            >
              <Camera className="w-10 h-10 text-amber-50" />
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-white mb-6"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Foto
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-amber-50/90 mb-8 leading-relaxed"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Objavte úchvatnú zbierku fotografií slovanských a keltských hradísk, archeologických výskumov 
              a expedičných výprav. Vizuálna cesta históriou a kultúrou našich predkov.
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-8"
            >
              <div className="text-center">
                <div className="text-4xl text-amber-300 mb-1" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  {mockGalleryImages.length}
                </div>
                <div className="text-sm text-amber-100/80 uppercase tracking-wider">
                  Fotografií
                </div>
              </div>
              <div className="w-px h-12 bg-amber-300/40"></div>
              <div className="text-center">
                <div className="text-4xl text-amber-300 mb-1" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  35+
                </div>
                <div className="text-sm text-amber-100/80 uppercase tracking-wider">
                  Lokalít
                </div>
              </div>
              <div className="w-px h-12 bg-amber-300/40"></div>
              <div className="text-center">
                <div className="text-4xl text-amber-300 mb-1" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  3
                </div>
                <div className="text-sm text-amber-100/80 uppercase tracking-wider">
                  Expedície
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Decorative wave separator */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-repeat-x" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 16 Q25 0, 50 16 T100 16 V32 H0 Z' fill='%23faf9f7'/%3E%3C/svg%3E")`,
          backgroundSize: '100px 32px'
        }}></div>
      </div>

      {/* Filters and Controls */}
      <div className="sticky top-20 z-40 bg-white/95 dark:bg-stone-950/95 backdrop-blur-lg border-b border-amber-800/20 shadow-lg">
        <div className="container py-6">
          <div className="flex flex-col gap-6">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full max-w-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-700 dark:text-amber-500" />
                <input
                  type="text"
                  placeholder="Hľadať fotografie..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3.5 w-full rounded-xl border-2 border-amber-800/30 focus:border-amber-600 focus:ring-4 focus:ring-amber-600/20 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm outline-none transition-all"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-amber-50 dark:bg-stone-800 p-1.5 rounded-xl border-2 border-amber-800/20 shadow-sm">
                <button
                  onClick={() => setViewMode('masonry')}
                  className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 ${
                    viewMode === 'masonry'
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md'
                      : 'text-stone-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-stone-700'
                  }`}
                  title="Masonry zobrazenie"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Masonry</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 ${
                    viewMode === 'grid'
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md'
                      : 'text-stone-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-stone-700'
                  }`}
                  title="Grid zobrazenie"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  <Grid3x3 className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Grid</span>
                </button>
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2.5">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-5 py-3 rounded-xl border-2 transition-all duration-300 flex items-center gap-2.5 shadow-sm ${
                      selectedCategory === category.id
                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-700 shadow-lg scale-105'
                        : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-amber-800/30 hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-stone-800 hover:shadow-md'
                    }`}
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{category.label}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full ${
                      selectedCategory === category.id
                        ? 'bg-white/30 text-white'
                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400'
                    }`}>
                      {category.count}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Grid/Masonry */}
      <div className="container py-12">
        <AnimatePresence mode="wait">
          {filteredImages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-20"
            >
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-100 dark:bg-amber-900/20 mb-6">
                <ImageIcon className="w-12 h-12 text-amber-700 dark:text-amber-500" />
              </div>
              <h3 className="text-2xl text-amber-950 dark:text-amber-50 mb-3" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Žiadne fotografie
              </h3>
              <p className="text-stone-600 dark:text-stone-400" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Skúste zmeniť filter alebo vyhľadávací dotaz.
              </p>
            </motion.div>
          ) : viewMode === 'masonry' ? (
            <Masonry columnsCount={3} gutter="1.5rem">
              {filteredImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="group relative cursor-pointer"
                  onClick={() => openLightbox(image)}
                >
                  <div className="relative overflow-hidden rounded-2xl border-4 border-amber-800/20 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-amber-50 to-stone-100 dark:from-stone-900 dark:to-amber-950 p-2">
                    <div className="relative overflow-hidden rounded-lg">
                      <ImageWithFallback
                        src={image.url}
                        alt={image.title}
                        className="w-full h-auto transition-transform duration-700 group-hover:scale-110 brightness-105"
                      />
                      
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <h3 className="text-lg mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                            {image.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {image.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(image.date).toLocaleDateString('sk-SK')}
                            </div>
                          </div>
                        </div>
                        
                        {/* Zoom icon */}
                        <div className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <ZoomIn className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {image.tags.slice(0, 2).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 rounded-full"
                          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </Masonry>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="group relative cursor-pointer"
                  onClick={() => openLightbox(image)}
                >
                  <div className="relative overflow-hidden rounded-2xl border-4 border-amber-800/20 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-amber-50 to-stone-100 dark:from-stone-900 dark:to-amber-950 p-2">
                    <div className="relative overflow-hidden rounded-lg aspect-[4/3]">
                      <ImageWithFallback
                        src={image.url}
                        alt={image.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 brightness-105"
                      />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <h3 className="text-lg mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                            {image.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {image.location}
                            </div>
                          </div>
                        </div>
                        
                        <div className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <ZoomIn className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {image.tags.slice(0, 2).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 rounded-full"
                          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation arrows */}
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Image and details container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full h-full flex items-center justify-center p-20"
            >
              <div className="relative w-full h-full flex flex-col">
                {/* Image - full size */}
                <div className="flex-1 flex items-center justify-center mb-6">
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.title}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                {/* Details overlay at bottom */}
                {isHorizontal(selectedImage) && (
                  <div className="bg-gradient-to-br from-amber-50/95 to-stone-100/95 dark:from-stone-900/95 dark:to-amber-950/95 backdrop-blur-md rounded-2xl p-6 md:p-8 border-2 border-amber-600/30 shadow-2xl max-w-6xl mx-auto w-full">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Left: Title and description */}
                      <div className="flex-1">
                        <h2 className="text-2xl md:text-3xl text-amber-950 dark:text-amber-50 mb-3" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                          {selectedImage.title}
                        </h2>

                        <p className="text-stone-700 dark:text-stone-300 leading-relaxed mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                          {selectedImage.description}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                        {selectedImage.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-amber-600/20 text-amber-800 dark:text-amber-300 rounded-lg text-sm"
                            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right: Metadata and actions */}
                    <div className="md:w-80 flex flex-col gap-4">
                      {/* Metadata grid */}
                      <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-amber-700 dark:text-amber-500 mt-1" />
                          <div>
                            <div className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider">Lokalita</div>
                            <div className="text-sm text-stone-800 dark:text-stone-200" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                              {selectedImage.location}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-amber-700 dark:text-amber-500 mt-1" />
                          <div>
                            <div className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider">Dátum</div>
                            <div className="text-sm text-stone-800 dark:text-stone-200" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                              {new Date(selectedImage.date).toLocaleDateString('sk-SK', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>

                        {selectedImage.photographer && (
                          <div className="flex items-start gap-2">
                            <Camera className="w-4 h-4 text-amber-700 dark:text-amber-500 mt-1" />
                            <div>
                              <div className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider">Fotograf</div>
                              <div className="text-sm text-stone-800 dark:text-stone-200" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                                {selectedImage.photographer}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <button
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg"
                          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                        >
                          <Download className="w-4 h-4" />
                          Stiahnuť
                        </button>

                        {/* Share button with menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowShareMenu(!showShareMenu); }}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
                            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                          >
                            <Share2 className="w-4 h-4" />
                            Zdieľať
                          </button>

                          {/* Share dropdown menu */}
                          <AnimatePresence>
                            {showShareMenu && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute bottom-full mb-2 right-0 bg-white dark:bg-stone-800 rounded-xl shadow-2xl border-2 border-amber-600/30 overflow-hidden min-w-[200px]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={handleCopyLink}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 dark:hover:bg-stone-700 transition-colors text-left"
                                >
                                  <LinkIcon className="w-4 h-4 text-amber-700 dark:text-amber-500" />
                                  <span className="text-sm text-stone-800 dark:text-stone-200" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                                    Kopírovať link
                                  </span>
                                </button>
                                <button
                                  onClick={handleShareFacebook}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 dark:hover:bg-stone-700 transition-colors text-left border-t border-amber-600/10"
                                >
                                  <Facebook className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm text-stone-800 dark:text-stone-200" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                                    Facebook
                                  </span>
                                </button>
                                <button
                                  onClick={handleShareTwitter}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 dark:hover:bg-stone-700 transition-colors text-left border-t border-amber-600/10"
                                >
                                  <Twitter className="w-4 h-4 text-sky-500" />
                                  <span className="text-sm text-stone-800 dark:text-stone-200" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                                    Twitter
                                  </span>
                                </button>
                                <button
                                  onClick={handleShareLinkedIn}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 dark:hover:bg-stone-700 transition-colors text-left border-t border-amber-600/10"
                                >
                                  <Linkedin className="w-4 h-4 text-blue-700" />
                                  <span className="text-sm text-stone-800 dark:text-stone-200" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                                    LinkedIn
                                  </span>
                                </button>
                                <button
                                  onClick={handleShareEmail}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 dark:hover:bg-stone-700 transition-colors text-left border-t border-amber-600/10"
                                >
                                  <Mail className="w-4 h-4 text-amber-700 dark:text-amber-500" />
                                  <span className="text-sm text-stone-800 dark:text-stone-200" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                                    E-mail
                                  </span>
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        
                        {/* Counter */}
                        <div className="px-4 py-2.5 bg-amber-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl text-sm border-2 border-amber-600/30 flex items-center justify-center min-w-[80px]">
                          {currentImageIndex + 1} / {filteredImages.length}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
