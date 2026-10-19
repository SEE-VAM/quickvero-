import React, { useState, useEffect, useMemo } from 'react';
import { Search, Phone, MapPin, Sparkles, Utensils, ArrowLeft, Share2, Check, ExternalLink } from 'lucide-react';
import { RestaurantMenuData, SAMPLE_MENU, decompressMenuData } from '../utils/menuDataHelper';

interface PublicMenuPageProps {
  onNavigate?: (path: string) => void;
}

export const PublicMenuPage: React.FC<PublicMenuPageProps> = ({ onNavigate }) => {
  const [menuData, setMenuData] = useState<RestaurantMenuData>(SAMPLE_MENU);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [vegOnlyFilter, setVegOnlyFilter] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSample, setIsSample] = useState(false);

  useEffect(() => {
    // Check URL parameters for menu data: ?d=... or #data=...
    const urlParams = new URLSearchParams(window.location.search);
    const queryData = urlParams.get('d');
    let hashData = '';
    if (window.location.hash) {
      const match = window.location.hash.match(/[#&]data=([^&]+)/);
      if (match) hashData = match[1];
    }

    const encoded = queryData || hashData;
    if (encoded) {
      const decoded = decompressMenuData(encoded);
      if (decoded && decoded.items.length > 0) {
        setMenuData(decoded);
        setIsSample(false);
        // Set document title
        document.title = `${decoded.name} — Digital Menu | QuickVero`;
        return;
      }
    }

    // Fallback: Check localStorage for recently generated menu
    const saved = localStorage.getItem('quickvero_last_menu');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.items?.length > 0) {
          setMenuData(parsed);
          setIsSample(false);
          document.title = `${parsed.name} — Digital Menu | QuickVero`;
          return;
        }
      } catch (e) {
        // ignore
      }
    }

    // Default sample demo
    setMenuData(SAMPLE_MENU);
    setIsSample(true);
    document.title = `${SAMPLE_MENU.name} — Digital Menu Demo | QuickVero`;
  }, []);

  // Extract distinct categories in the order they appear
  const categories = useMemo(() => {
    const set = new Set<string>();
    menuData.items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ['All', ...Array.from(set)];
  }, [menuData]);

  // Filtered dishes
  const filteredItems = useMemo(() => {
    return menuData.items.filter((item) => {
      // Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      // Veg-only filter
      if (vegOnlyFilter && item.isVeg !== true) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = (item.description || '').toLowerCase().includes(q);
        const matchCat = (item.category || '').toLowerCase().includes(q);
        return matchName || matchDesc || matchCat;
      }
      return true;
    });
  }, [menuData, selectedCategory, vegOnlyFilter, searchQuery]);

  // Group filtered items by category for pleasant sectioning when "All" is selected
  const groupedItems = useMemo(() => {
    if (selectedCategory !== 'All') {
      return { [selectedCategory]: filteredItems };
    }
    const groups: Record<string, typeof filteredItems> = {};
    filteredItems.forEach((item) => {
      const cat = item.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filteredItems, selectedCategory]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${menuData.name} — Digital Menu`,
        text: `View the digital food menu for ${menuData.name}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24 google-anno-skip">
      {/* Top Banner if Demo */}
      {isSample && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>Demo Menu View — Create a custom QR menu for your restaurant in 60 seconds!</span>
          {onNavigate && (
            <button
              onClick={() => onNavigate('/tools/qr-menu-maker')}
              className="ml-2 underline font-bold hover:text-white transition-colors"
            >
              Create Now &rarr;
            </button>
          )}
        </div>
      )}

      {/* Hero Header Card */}
      <header className="relative bg-gradient-to-b from-slate-900 to-slate-800 text-white pt-8 pb-10 px-4 sm:px-6 shadow-md border-b border-slate-700/50">
        <div className="max-w-2xl mx-auto">
          {/* Top Bar with Navigation / Share */}
          <div className="flex items-center justify-between mb-6">
            {onNavigate ? (
              <button
                onClick={() => onNavigate('/tools/qr-menu-maker')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium backdrop-blur-sm transition-colors"
                title="Open QR Menu Maker"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Menu Maker</span>
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium backdrop-blur-sm transition-colors"
              title="Share Digital Menu Link"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Menu</span>
                </>
              )}
            </button>
          </div>

          {/* Restaurant Branding */}
          <div className="text-center">
            {menuData.tableNo && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-2">
                {menuData.tableNo}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
              {menuData.name}
            </h1>
            {menuData.tagline && (
              <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto mb-3 font-normal">
                {menuData.tagline}
              </p>
            )}

            {/* Address & Phone */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 mt-3">
              {menuData.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{menuData.address}</span>
                </div>
              )}
              {menuData.phone && (
                <a
                  href={`tel:${menuData.phone}`}
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 underline font-medium"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{menuData.phone}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sticky Filter & Search Bar */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="max-w-2xl mx-auto px-4 py-3 space-y-3">
          {/* Search Box & Veg Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food, drinks, desserts..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Pure Veg Filter Toggle Button */}
            <button
              onClick={() => setVegOnlyFilter(!vegOnlyFilter)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
                vegOnlyFilter
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Toggle Vegetarian Only"
            >
              <span className="w-3.5 h-3.5 rounded border border-emerald-500 bg-white flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
              </span>
              <span>Veg Only</span>
            </button>
          </div>

          {/* Category Chips Scrollbar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Dish List */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <Utensils className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No dishes found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              {vegOnlyFilter
                ? 'No vegetarian items matched your current search. Try unchecking "Veg Only".'
                : 'Try searching for something else or pick another category.'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setVegOnlyFilter(false);
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedItems).map(([category, items]) => {
              if (items.length === 0) return null;
              return (
                <section key={category} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{category}</span>
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                        ({items.length})
                      </span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-start justify-between gap-4"
                      >
                        <div className="flex-1 space-y-1">
                          {/* Indicator & Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {item.isVeg === true ? (
                              <span
                                className="w-4 h-4 rounded-sm border border-emerald-600 bg-white flex items-center justify-center shrink-0"
                                title="Pure Vegetarian"
                              >
                                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                              </span>
                            ) : item.isVeg === false ? (
                              <span
                                className="w-4 h-4 rounded-sm border border-red-600 bg-white flex items-center justify-center shrink-0"
                                title="Non-Vegetarian"
                              >
                                <span className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[7px] border-b-red-600" />
                              </span>
                            ) : null}

                            <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-snug">
                              {item.name}
                            </h3>

                            {item.badge && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                {item.badge}
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          {item.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-0.5 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Price */}
                        <div className="text-right shrink-0">
                          <span className="text-base font-bold text-slate-900 dark:text-white">
                            {menuData.currency}
                            {item.price}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Viral Brand Tag & Footer Promotion */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <span>Powered by</span>
            <strong className="text-blue-600 dark:text-blue-400 font-bold">QuickVero.in</strong>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Need a contactless digital QR code menu for your restaurant, cafe, or food truck?
          </p>

          <div>
            <a
              href="https://www.quickvero.in/tools/qr-menu-maker"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              <span>Create Your Free QR Menu in 60 Seconds</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};
