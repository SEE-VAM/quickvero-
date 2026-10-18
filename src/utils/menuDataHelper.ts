export interface MenuItem {
  id: string;
  name: string;
  price: number | string;
  category: string;
  description?: string;
  isVeg?: boolean; // true = Veg, false = Non-Veg, undefined = neutral
  badge?: string; // 'Bestseller' | 'Chef Special' | 'Recommended' | 'Spicy' | 'New'
}

export interface RestaurantMenuData {
  name: string;
  tagline?: string;
  address?: string;
  phone?: string;
  currency: string;
  tableNo?: string;
  theme: 'gold' | 'emerald' | 'blue' | 'minimal' | 'rose';
  items: MenuItem[];
}

export const SAMPLE_MENU: RestaurantMenuData = {
  name: 'The Rustic Bistro & Cafe',
  tagline: 'Artisanal Coffee, Gourmet Pizzas & Fresh Delights',
  address: 'Connaught Place, New Delhi',
  phone: '+91 98765 43210',
  currency: '₹',
  tableNo: 'Table 1',
  theme: 'gold',
  items: [
    // Starters
    {
      id: '1',
      name: 'Crispy Peri-Peri Paneer Bites',
      price: 240,
      category: 'Starters',
      description: 'Cottage cheese cubes tossed in spicy African peri-peri glaze with mint dip.',
      isVeg: true,
      badge: 'Bestseller',
    },
    {
      id: '2',
      name: 'Smoked Chicken Wings (6 Pcs)',
      price: 320,
      category: 'Starters',
      description: 'Slow-smoked chicken wings glazed in smokey hickory BBQ sauce.',
      isVeg: false,
      badge: 'Chef Special',
    },
    {
      id: '3',
      name: 'Truffle Parmesan French Fries',
      price: 180,
      category: 'Starters',
      description: 'Golden potato fries drizzled with aromatic white truffle oil and aged parmesan.',
      isVeg: true,
    },
    // Main Course
    {
      id: '4',
      name: 'Paneer Butter Masala',
      price: 290,
      category: 'Main Course',
      description: 'Fresh cottage cheese simmered in rich creamy tomato and cashew gravy.',
      isVeg: true,
      badge: 'Popular',
    },
    {
      id: '5',
      name: 'Dum Handi Chicken Biryani',
      price: 380,
      category: 'Main Course',
      description: 'Fragrant basmati rice layered with spiced tender chicken and royal herbs.',
      isVeg: false,
      badge: 'Bestseller',
    },
    {
      id: '6',
      name: 'Dal Makhani Bukhara',
      price: 260,
      category: 'Main Course',
      description: 'Slow-cooked black lentils simmered overnight with fresh cream and butter.',
      isVeg: true,
    },
    // Breads
    {
      id: '7',
      name: 'Butter Garlic Naan',
      price: 65,
      category: 'Breads',
      description: 'Traditional clay oven flatbread topped with minced garlic and melted butter.',
      isVeg: true,
    },
    {
      id: '8',
      name: 'Tandoori Roti (Butter)',
      price: 35,
      category: 'Breads',
      description: 'Whole wheat flatbread cooked crisp in traditional tandoor clay oven.',
      isVeg: true,
    },
    // Beverages
    {
      id: '9',
      name: 'Cold Brew Hazelnut Frappe',
      price: 190,
      category: 'Beverages',
      description: 'Double shot espresso blended with hazelnut cream, cold milk, and crushed ice.',
      isVeg: true,
      badge: 'Recommended',
    },
    {
      id: '10',
      name: 'Fresh Mint Virgin Mojito',
      price: 150,
      category: 'Beverages',
      description: 'Crushed garden mint leaves, fresh lime wedges, simple syrup, and sparkling soda.',
      isVeg: true,
    },
    // Desserts
    {
      id: '11',
      name: 'Molten Lava Cake with Ice Cream',
      price: 210,
      category: 'Desserts',
      description: 'Warm Belgian chocolate cake with a gooey molten heart, served with vanilla scoop.',
      isVeg: true,
      badge: 'Bestseller',
    },
    {
      id: '12',
      name: 'Royal Saffron Gulab Jamun (2 Pcs)',
      price: 120,
      category: 'Desserts',
      description: 'Soft cottage cheese dumplings soaked in warm saffron and cardamom syrup.',
      isVeg: true,
    },
  ],
};

// Compact serialization for QR code URLs
// Schema: [version, name, tagline, address, phone, currency, tableNo, theme, [ [name, price, category, isVeg, badge, desc] ]]
export function compressMenuData(data: RestaurantMenuData): string {
  try {
    const compact = {
      v: 1,
      n: data.name || '',
      t: data.tagline || '',
      a: data.address || '',
      p: data.phone || '',
      c: data.currency || '₹',
      tb: data.tableNo || '',
      th: data.theme || 'gold',
      items: data.items.map((item) => [
        item.name,
        item.price,
        item.category,
        item.isVeg === true ? 1 : item.isVeg === false ? 0 : 2,
        item.badge || '',
        item.description || '',
      ]),
    };

    const jsonStr = JSON.stringify(compact);
    // URL-safe Base64 encoding supporting Unicode characters
    const encoded = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
    return encoded;
  } catch (err) {
    console.error('Failed to compress menu data', err);
    return '';
  }
}

export function decompressMenuData(encodedStr: string): RestaurantMenuData | null {
  try {
    if (!encodedStr) return null;
    const decodedJson = decodeURIComponent(
      Array.prototype.map
        .call(atob(encodedStr), (c: string) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );

    const parsed = JSON.parse(decodedJson);

    // Reconstruct full RestaurantMenuData
    const items: MenuItem[] = (parsed.items || []).map((row: any, index: number) => {
      const [name, price, category, vegCode, badge, description] = row;
      return {
        id: `item-${index + 1}`,
        name: name || 'Dish Item',
        price: price ?? 0,
        category: category || 'General',
        isVeg: vegCode === 1 ? true : vegCode === 0 ? false : undefined,
        badge: badge || undefined,
        description: description || undefined,
      };
    });

    return {
      name: parsed.n || 'Restaurant Menu',
      tagline: parsed.t || '',
      address: parsed.a || '',
      phone: parsed.p || '',
      currency: parsed.c || '₹',
      tableNo: parsed.tb || '',
      theme: parsed.th || 'gold',
      items,
    };
  } catch (err) {
    console.error('Failed to decompress menu data', err);
    return null;
  }
}

// Simple CSV / Text batch parser
export function parseMenuText(rawText: string, defaultCurrency: string = '₹'): MenuItem[] {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items: MenuItem[] = [];
  let currentCategory = 'Main Course';

  lines.forEach((line, index) => {
    // Check if line is a category header like "# Starters" or "[Beverages]"
    if (line.startsWith('#') || line.startsWith('[') || line.endsWith(':')) {
      const catClean = line.replace(/^[#\[\s]+|[\]:\s]+$/g, '').trim();
      if (catClean) {
        currentCategory = catClean;
        return;
      }
    }

    // Try comma or dash or tab separation:
    // Formats supported:
    // Name, Price, Category, veg/nonveg, description
    // Name - Price (Category)
    const parts = line.split(/[,;\t|]/).map((p) => p.trim());

    if (parts.length >= 2) {
      const name = parts[0];
      const priceStr = parts[1].replace(/[^0-9.]/g, '');
      const price = priceStr ? Number(priceStr) : 0;
      const category = parts[2] ? parts[2] : currentCategory;
      const vegNonVegStr = (parts[3] || '').toLowerCase();
      const isVeg = vegNonVegStr.includes('veg') && !vegNonVegStr.includes('non') ? true : vegNonVegStr.includes('non') ? false : undefined;
      const description = parts[4] || '';

      if (name) {
        items.push({
          id: `imported-${Date.now()}-${index}`,
          name,
          price,
          category,
          isVeg,
          description,
        });
      }
    } else if (line.length > 0) {
      // Just name or single string
      items.push({
        id: `imported-${Date.now()}-${index}`,
        name: line,
        price: 0,
        category: currentCategory,
        isVeg: true,
      });
    }
  });

  return items;
}
