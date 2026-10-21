import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  QrCode,
  Utensils,
  Plus,
  Trash2,
  Download,
  Copy,
  ExternalLink,
  Sparkles,
  FileText,
  Eye,
  Check,
  RefreshCw,
  Palette,
  Store,
  DollarSign,
  Phone,
  Tag,
  AlertCircle,
  HelpCircle,
  UploadCloud,
  MapPin,
} from 'lucide-react';
import {
  RestaurantMenuData,
  MenuItem,
  SAMPLE_MENU,
  EMPTY_MENU,
  compressMenuData,
  parseMenuText,
} from '../../../utils/menuDataHelper';
import { ToastMessage } from '../../common/Toast';

interface QrMenuWorkspaceProps {
  onShowToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

const CATEGORY_PRESETS = [
  'Starters',
  'Main Course',
  'Breads',
  'Rice & Biryani',
  'Chinese & Fast Food',
  'Snacks & Pizza',
  'Beverages & Shakes',
  'Desserts & Sweets',
  'Breakfast',
  'Combos & Thali',
  'Soups & Salads',
];

const THEME_OPTIONS: { id: RestaurantMenuData['theme']; name: string; bg: string; border: string; accent: string }[] = [
  { id: 'gold', name: 'Royal Gold & Dark', bg: 'bg-slate-900', border: 'border-amber-400', accent: 'text-amber-400' },
  { id: 'emerald', name: 'Fresh Cafe & Mint', bg: 'bg-emerald-950', border: 'border-emerald-400', accent: 'text-emerald-400' },
  { id: 'blue', name: 'Modern Sapphire', bg: 'bg-blue-950', border: 'border-blue-400', accent: 'text-blue-400' },
  { id: 'rose', name: 'Bistro Coral', bg: 'bg-rose-950', border: 'border-rose-400', accent: 'text-rose-400' },
  { id: 'minimal', name: 'Minimal White (Print Friendly)', bg: 'bg-white', border: 'border-slate-800', accent: 'text-slate-900' },
];

export const QrMenuWorkspace: React.FC<QrMenuWorkspaceProps> = ({ onShowToast }) => {
  // Menu State (Clean & Fresh by default, zero dummy data)
  const [menu, setMenu] = useState<RestaurantMenuData>(() => {
    return EMPTY_MENU;
  });

  // Active view tab in workspace: 'editor' | 'preview'
  const [activeTab, setActiveTab] = useState<'editor' | 'standee'>('editor');

  // New item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Starters');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('All');
  const [newItemVeg, setNewItemVeg] = useState<boolean>(true);
  const [newItemBadge, setNewItemBadge] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');

  // Available categories: presets + any categories already in current menu
  const allAvailableCategories = React.useMemo(() => {
    const set = new Set<string>(CATEGORY_PRESETS);
    menu.items.forEach((item) => {
      if (item.category && item.category.trim()) {
        set.add(item.category.trim());
      }
    });
    return Array.from(set);
  }, [menu.items]);

  // Distinct categories present in current menu items
  const categoriesInMenu = React.useMemo(() => {
    const set = new Set<string>();
    menu.items.forEach((item) => {
      if (item.category && item.category.trim()) {
        set.add(item.category.trim());
      }
    });
    return Array.from(set);
  }, [menu.items]);

  // Filtered dishes for Section 3
  const displayedDishes = React.useMemo(() => {
    if (selectedCategoryTab === 'All') return menu.items;
    return menu.items.filter((item) => (item.category || '').toLowerCase() === selectedCategoryTab.toLowerCase());
  }, [menu.items, selectedCategoryTab]);

  // Clean table badge display
  const displayTableBadge = React.useMemo(() => {
    if (!menu.tableNo || !menu.tableNo.trim()) return 'DIGITAL MENU';
    const val = menu.tableNo.trim();
    if (/^\d+$/.test(val)) return `TABLE ${val}`;
    return val.toUpperCase();
  }, [menu.tableNo]);

  // Reset tab if selected category was deleted
  useEffect(() => {
    if (selectedCategoryTab !== 'All' && !categoriesInMenu.includes(selectedCategoryTab)) {
      setSelectedCategoryTab('All');
    }
  }, [categoriesInMenu, selectedCategoryTab]);

  // Batch Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');

  // Generated QR Code Data URL
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [menuShareUrl, setMenuShareUrl] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Ref to the Standee element for html2canvas
  const standeeRef = useRef<HTMLDivElement>(null);

  // Generate QR code whenever menu changes
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.quickvero.in';
    const compressed = compressMenuData(menu);
    const fullMenuUrl = compressed ? `${origin}/menu?d=${compressed}` : `${origin}/menu`;
    setMenuShareUrl(fullMenuUrl);

    // Persist menu in localStorage so PublicMenuPage can always load customer view
    if (menu && menu.items && menu.items.length > 0) {
      try {
        localStorage.setItem('quickvero_last_menu', JSON.stringify(menu));
      } catch (e) {
        // ignore
      }
    }

    // Generate high resolution QR code using 'L' for high data density
    QRCode.toDataURL(
      fullMenuUrl,
      {
        width: 600,
        margin: 2,
        errorCorrectionLevel: 'L',
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrCodeDataUrl(url);
        } else {
          // If error occurs, fallback with base URL so QR is ALWAYS immediately displayed!
          QRCode.toDataURL(
            `${origin}/menu`,
            { width: 600, margin: 2, errorCorrectionLevel: 'L' },
            (_, fallbackUrl) => {
              if (fallbackUrl) setQrCodeDataUrl(fallbackUrl);
            }
          );
        }
      }
    );
  }, [menu]);

  // Add Item handler
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      onShowToast({ type: 'error', message: 'Please enter a dish name.' });
      return;
    }

    const priceNum = parseFloat(newItemPrice) || 0;
    const finalCategory = (isCustomCategory ? customCategoryInput.trim() : newItemCategory.trim()) || 'Main Course';

    const item: MenuItem = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      price: priceNum,
      category: finalCategory,
      isVeg: newItemVeg,
      badge: newItemBadge.trim() || undefined,
      description: newItemDesc.trim() || undefined,
    };

    setMenu((prev) => ({
      ...prev,
      items: [item, ...prev.items],
    }));

    // If custom category was used, save as current category and exit custom input
    if (isCustomCategory && customCategoryInput.trim()) {
      setNewItemCategory(customCategoryInput.trim());
      setIsCustomCategory(false);
      setCustomCategoryInput('');
    }

    // Reset inputs
    setNewItemName('');
    setNewItemPrice('');
    setNewItemDesc('');
    setNewItemBadge('');

    onShowToast({ type: 'success', message: `Added "${item.name}" under ${finalCategory}!` });
  };

  // Remove Item
  const handleRemoveItem = (id: string) => {
    setMenu((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  // Load Sample Menu
  const handleLoadSample = () => {
    setMenu(SAMPLE_MENU);
    onShowToast({ type: 'success', message: 'Sample cafe menu loaded with 12 items!' });
  };

  // Clear All Dishes
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to remove all dishes from this menu?')) {
      setMenu((prev) => ({ ...prev, items: [] }));
      onShowToast({ type: 'info', message: 'Menu cleared. You can now add your own dishes.' });
    }
  };

  // Batch Import handler
  const handleBatchImport = () => {
    if (!importText.trim()) return;
    const parsed = parseMenuText(importText, menu.currency);
    if (parsed.length === 0) {
      onShowToast({ type: 'error', message: 'No valid dishes detected in the text.' });
      return;
    }

    setMenu((prev) => ({
      ...prev,
      items: [...prev.items, ...parsed],
    }));

    setIsImportModalOpen(false);
    setImportText('');
    onShowToast({ type: 'success', message: `Successfully imported ${parsed.length} dishes!` });
  };

  // Copy Menu Link
  const handleCopyLink = () => {
    if (navigator.clipboard && menuShareUrl) {
      navigator.clipboard.writeText(menuShareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      onShowToast({ type: 'success', message: 'Digital Menu link copied to clipboard!' });
    }
  };

  // Download Pure QR Code PNG
  const handleDownloadQrPng = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `${menu.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-qr-menu.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast({ type: 'success', message: 'QR Code image downloaded!' });
  };

  // Download Standee as Print-Ready PDF
  const handleDownloadStandeePdf = async () => {
    if (!standeeRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const element = standeeRef.current;
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL('image/png');
      // A5 portrait dimensions in mm: 148 x 210
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 148mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm

      // Generous 12mm print margins to ensure 0% clipping on all printers
      const maxPrintWidth = pdfWidth - 24; // 124mm
      const maxPrintHeight = pdfHeight - 24; // 186mm
      const aspect = canvas.width / canvas.height;

      let printWidth = maxPrintWidth;
      let printHeight = printWidth / aspect;

      if (printHeight > maxPrintHeight) {
        printHeight = maxPrintHeight;
        printWidth = printHeight * aspect;
      }

      // Perfectly center horizontally & vertically on A5 sheet
      const posX = (pdfWidth - printWidth) / 2;
      const posY = (pdfHeight - printHeight) / 2;

      pdf.addImage(imgData, 'PNG', posX, posY, printWidth, printHeight);
      pdf.save(`${(menu.name || 'restaurant').toLowerCase().replace(/[^a-z0-9]/g, '-')}-table-standee.pdf`);

      onShowToast({ type: 'success', message: 'Print-Ready Table Standee PDF generated!' });
    } catch (err: any) {
      console.error(err);
      onShowToast({ type: 'error', message: 'Failed to generate PDF. Please try again.' });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Download Standee as High-Res Image
  const handleDownloadStandeeImage = async () => {
    if (!standeeRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const element = standeeRef.current;
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
        scrollX: 0,
        scrollY: 0,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${(menu.name || 'restaurant').toLowerCase().replace(/[^a-z0-9]/g, '-')}-table-standee.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      onShowToast({ type: 'success', message: 'Table Standee image downloaded!' });
    } catch (err) {
      onShowToast({ type: 'error', message: 'Failed to export image.' });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Style classes based on selected theme
  const getThemeStyles = () => {
    switch (menu.theme) {
      case 'emerald':
        return {
          wrapper: 'bg-emerald-950 text-white border-emerald-500/40',
          accent: 'text-emerald-400',
          border: 'border-emerald-500/30',
          badge: 'bg-emerald-900/80 text-emerald-300 border-emerald-500/40',
          qrBorder: 'border-emerald-400/50 shadow-emerald-900/40',
          taglineColor: 'text-emerald-200/80',
        };
      case 'blue':
        return {
          wrapper: 'bg-slate-950 text-white border-blue-500/40',
          accent: 'text-blue-400',
          border: 'border-blue-500/30',
          badge: 'bg-blue-900/80 text-blue-300 border-blue-500/40',
          qrBorder: 'border-blue-400/50 shadow-blue-900/40',
          taglineColor: 'text-blue-200/80',
        };
      case 'rose':
        return {
          wrapper: 'bg-rose-950 text-white border-rose-500/40',
          accent: 'text-rose-400',
          border: 'border-rose-500/30',
          badge: 'bg-rose-900/80 text-rose-300 border-rose-500/40',
          qrBorder: 'border-rose-400/50 shadow-rose-900/40',
          taglineColor: 'text-rose-200/80',
        };
      case 'minimal':
        return {
          wrapper: 'bg-white text-slate-900 border-slate-300 shadow-lg',
          accent: 'text-slate-900',
          border: 'border-slate-200',
          badge: 'bg-slate-100 text-slate-800 border-slate-300',
          qrBorder: 'border-slate-800 shadow-slate-200',
          taglineColor: 'text-slate-600',
        };
      case 'gold':
      default:
        return {
          wrapper: 'bg-[#111625] text-white border-amber-500/40',
          accent: 'text-amber-400',
          border: 'border-amber-500/30',
          badge: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
          qrBorder: 'border-amber-400/60 shadow-amber-900/50',
          taglineColor: 'text-amber-200/80',
        };
    }
  };

  const themeStyle = getThemeStyles();

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner & Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-950/30 dark:to-slate-900 border border-blue-200/80 dark:border-blue-800/60 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Digital QR Menu & Standee Generator</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                100% Free
              </span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              No login required. Add dishes, generate instant QR code & download ready-to-print table standees.
            </p>
          </div>
        </div>

        {/* Action Toggle: Edit Menu vs View Standee */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'editor'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>1. Edit Menu ({menu.items.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('standee')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'standee'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>2. QR & Table Standee</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Configuration & Right Standee Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT COLUMN: CONFIGURATION ================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Business Details Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-surface-cardDark border border-slate-200/90 dark:border-slate-800 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-blue-600" />
                <span>Restaurant / Cafe Details</span>
              </h3>
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold inline-flex items-center gap-1"
                title="Fill with sample dishes and restaurant name"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample Cafe</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Business / Hotel Name *
                </label>
                <input
                  type="text"
                  value={menu.name}
                  onChange={(e) => setMenu((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. The Rustic Bistro & Cafe"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={menu.tagline || ''}
                  onChange={(e) => setMenu((prev) => ({ ...prev, tagline: e.target.value }))}
                  placeholder="e.g. Artisanal Coffee & Fresh Food"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Address / City (Optional)
                </label>
                <input
                  type="text"
                  value={menu.address || ''}
                  onChange={(e) => setMenu((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g. Connaught Place, New Delhi"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact / WhatsApp No. (Optional)
                </label>
                <input
                  type="tel"
                  value={menu.phone || ''}
                  onChange={(e) => setMenu((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Currency Symbol
                </label>
                <select
                  value={menu.currency}
                  onChange={(e) => setMenu((prev) => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="₹">₹ (INR)</option>
                  <option value="$">$ (USD)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                  <option value="AED">AED</option>
                  <option value="C$">C$ (CAD)</option>
                  <option value="A$">A$ (AUD)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Table / Counter No. (Optional)
                </label>
                <input
                  type="text"
                  value={menu.tableNo || ''}
                  onChange={(e) => setMenu((prev) => ({ ...prev, tableNo: e.target.value }))}
                  placeholder="e.g. Table 1"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Standee Theme Selector */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-blue-500" />
                <span>Standee Theme Style</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {THEME_OPTIONS.map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setMenu((prev) => ({ ...prev, theme: th.id }))}
                    className={`p-2.5 rounded-xl border text-left transition-all text-xs font-medium flex items-center gap-2 ${
                      menu.theme === th.id
                        ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${th.bg} border ${th.border} shrink-0`} />
                    <span className="truncate">{th.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Add Dish Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-surface-cardDark border border-slate-200/90 dark:border-slate-800 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Add Dish / Item</span>
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Batch Import (CSV/Text)</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Dish Name */}
                <div className="sm:col-span-8">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Paneer Butter Masala"
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Price */}
                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Price ({menu.currency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="e.g. 290"
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Category Selection */}
                <div className="sm:col-span-6">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Category *
                    </label>
                    {!isCustomCategory ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(true);
                          setCustomCategoryInput('');
                        }}
                        className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
                      >
                        + Custom Category
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsCustomCategory(false)}
                        className="text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400 font-medium"
                      >
                        Choose Preset
                      </button>
                    )}
                  </div>

                  {!isCustomCategory ? (
                    <select
                      value={newItemCategory}
                      onChange={(e) => {
                        if (e.target.value === '__CUSTOM__') {
                          setIsCustomCategory(true);
                          setCustomCategoryInput('');
                        } else {
                          setNewItemCategory(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                    >
                      {allAvailableCategories.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                      <option value="__CUSTOM__">+ Type Custom Category...</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        autoFocus
                        value={customCategoryInput}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        placeholder="e.g. Mocktails, Tandoor Special..."
                        className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-blue-500 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setIsCustomCategory(false)}
                        className="px-2.5 py-2 text-xs rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold shrink-0"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* 1-Click Quick Category Badges */}
                  <div className="flex flex-wrap items-center gap-1 pt-1.5">
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">Quick Pick:</span>
                    {CATEGORY_PRESETS.slice(0, 6).map((preset) => {
                      const shortLabel = preset.split('/')[0].split('&')[0].trim();
                      const isActive = !isCustomCategory && newItemCategory === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setNewItemCategory(preset);
                            setIsCustomCategory(false);
                          }}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                            isActive
                              ? 'bg-blue-600 text-white font-bold shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {shortLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Veg / Non-Veg Toggle */}
                <div className="sm:col-span-6">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Food Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewItemVeg(true)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                        newItemVeg
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-sm border border-emerald-600 bg-white flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      </span>
                      <span>Veg</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewItemVeg(false)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                        !newItemVeg
                          ? 'bg-red-50 dark:bg-red-950/60 border-red-500 text-red-700 dark:text-red-300 ring-2 ring-red-500/20'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-sm border border-red-600 bg-white flex items-center justify-center">
                        <span className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-red-600" />
                      </span>
                      <span>Non-Veg</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Description & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Short Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    placeholder="e.g. Rich creamy cashew gravy with butter glaze"
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Badge (Optional)
                  </label>
                  <select
                    value={newItemBadge}
                    onChange={(e) => setNewItemBadge(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    <option value="Bestseller">Bestseller</option>
                    <option value="Chef Special">Chef Special</option>
                    <option value="Recommended">Recommended</option>
                    <option value="Spicy 🌶️">Spicy 🌶️</option>
                    <option value="Must Try">Must Try</option>
                    <option value="New">New</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Dish to Menu</span>
              </button>
            </form>
          </div>

          {/* Section 3: Current Dishes List */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-surface-cardDark border border-slate-200/90 dark:border-slate-800 shadow-subtle space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Menu Dishes ({menu.items.length})
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Auto-updates QR Code
                </span>
              </div>

              {menu.items.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            {categoriesInMenu.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none border-b border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryTab('All')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategoryTab === 'All'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  All ({menu.items.length})
                </button>
                {categoriesInMenu.map((cat) => {
                  const count = menu.items.filter((i) => i.category === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategoryTab(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        selectedCategoryTab === cat
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {menu.items.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No dishes in menu yet. Use the form above or click "Load Sample Cafe" to test.
              </div>
            ) : displayedDishes.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No dishes found under "{selectedCategoryTab}".
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                {displayedDishes.map((item) => (
                  <div
                    key={item.id}
                    className="pt-2 pb-2 first:pt-0 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.isVeg === true ? (
                        <span className="w-3.5 h-3.5 rounded-xs border border-emerald-600 bg-white flex items-center justify-center shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        </span>
                      ) : item.isVeg === false ? (
                        <span className="w-3.5 h-3.5 rounded-xs border border-red-600 bg-white flex items-center justify-center shrink-0">
                          <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-red-600" />
                        </span>
                      ) : null}

                      <div className="truncate">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                          <span className="truncate">{item.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                            {item.category}
                          </span>
                          {item.badge && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <div className="text-slate-400 text-[11px] truncate mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {menu.currency}
                        {item.price}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Delete Dish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: QR & STANDEE PREVIEW ================= */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          {/* Action Download Buttons Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-surface-cardDark border border-slate-200/90 dark:border-slate-800 shadow-subtle space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Print &amp; Share Menu
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadStandeePdf}
                disabled={isGeneratingPdf || !qrCodeDataUrl}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Standee (PDF)'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadStandeeImage}
                disabled={isGeneratingPdf || !qrCodeDataUrl}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Card (PNG)</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadQrPng}
                disabled={!qrCodeDataUrl}
                className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Only (PNG)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Menu URL'}</span>
              </button>
            </div>

            {/* Test Scan Link */}
            <div className="pt-2">
              <a
                href={menuShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 hover:bg-blue-100 flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open &amp; Test Customer Menu View &rarr;</span>
              </a>
            </div>
          </div>

          {/* Table Standee Visual Card Preview */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[11px] font-semibold text-slate-400">
                Live Table Standee Preview (A5 / 4x6" Table Top)
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                v2.1
              </span>
            </div>

            {/* The Actual Standee Component captured by html2canvas */}
            <div
              ref={standeeRef}
              className={`w-full max-w-[360px] min-h-[530px] rounded-[24px] pt-7 pb-6 px-6 flex flex-col justify-between items-center text-center border-2 transition-all duration-300 shadow-2xl relative overflow-hidden ${themeStyle.wrapper}`}
              style={{ boxSizing: 'border-box' }}
            >
              {/* Standee Header */}
              <div className="w-full space-y-2 relative z-10 pt-1">
                <div className="flex justify-center w-full">
                  <span className={`inline-block px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest border shadow-xs text-center leading-none select-none ${themeStyle.badge}`}>
                    {displayTableBadge}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug break-words px-2">
                  {menu.name || 'Your Restaurant'}
                </h2>

                {menu.tagline && (
                  <p className={`text-xs font-semibold leading-normal break-words px-2 ${themeStyle.taglineColor}`}>
                    {menu.tagline}
                  </p>
                )}

                {menu.address && (
                  <p className={`text-[11px] font-medium leading-normal break-words px-2 opacity-90 text-center ${themeStyle.taglineColor}`}>
                    {menu.address}
                  </p>
                )}
              </div>

              {/* QR Code Centerpiece */}
              <div className="my-auto py-3 relative z-10 flex flex-col items-center">
                <div className={`p-3.5 bg-white rounded-2xl border-2 shadow-xl ${themeStyle.qrBorder}`}>
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="Scan for Menu QR Code"
                      className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg block"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-slate-400 text-xs">
                      Generating QR...
                    </div>
                  )}
                </div>

                <div className="mt-3 space-y-1">
                  <span className={`text-xs font-black tracking-wider uppercase block ${themeStyle.accent}`}>
                    SCAN FOR DIGITAL MENU
                  </span>
                  <p className="text-[10px] text-slate-300/80 font-medium">
                    Point camera or Google Lens to view dishes &amp; prices
                  </p>
                </div>
              </div>

              {/* Standee Footer - INSET Capsule so phone number is safely away from round corners */}
              <div className="w-full mt-3 py-2.5 px-4 rounded-xl bg-white/10 dark:bg-black/25 border border-white/15 relative z-10 flex items-center justify-between text-xs text-slate-200">
                <div className="flex items-center gap-1.5 font-bold text-xs shrink-0 leading-normal">
                  <span className="text-amber-400">Call:</span>
                  <span className="text-white tracking-wide">{menu.phone ? menu.phone : 'Contactless Ordering'}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 font-medium text-[11px] text-slate-300 leading-normal">
                  <span>Powered by</span>
                  <strong className="text-white font-black tracking-wide">QuickVero.in</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Batch Import Dishes */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-600" />
                <span>Batch Import Menu Dishes</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Paste your list of dishes below. Each line can be:
              <br />
              <code className="text-blue-600 dark:text-blue-400 font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                Dish Name, Price, Category, veg/nonveg, Description
              </code>
            </p>

            <textarea
              rows={8}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`Example:\nPaneer Butter Masala, 290, Main Course, veg, Creamy tomato gravy\nChicken Biryani, 380, Main Course, nonveg, Royal fragrant rice\nCold Coffee, 150, Beverages, veg\nChocolate Brownie, 180, Desserts, veg`}
              className="w-full p-3 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBatchImport}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
              >
                Import Dishes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
