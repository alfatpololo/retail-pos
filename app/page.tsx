'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddToCartModal from '@/components/AddToCartModal';
import Sidebar from '@/components/Sidebar';
import { API_BASE_URL } from '@/utils/api';
import { usePrinter } from '@/components/PrinterProvider';
import {
  shouldShowBukaKasir,
  bukaKasirApi,
  fetchTutupKasirData,
  getStatusUangBukakasir,
  TutupKasirData,
} from '@/utils/cashierSession';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  unit: string;
  placeholderText?: string;
  isCustom?: boolean;
  stock: number;
}

interface CurrentCashier {
  id: string;
  name: string;
  initials: string;
  level: string;
}

interface CartItem extends Product {
  quantity: number;
  subtotal: number;
  negotiatedPrice?: number;
  note?: string;
}

interface ApiProductCategory {
  id: number;
  nama: string;
}

interface ApiProduct {
  id: number;
  stall_id: number;
  product_category_id: number;
  product_sub_category_id?: number;
  sku: string;
  barcode: string;
  nama: string;
  deskripsi: string;
  satuan: string | null;
  gambar: string;
  gambar_url: string;
  harga: number;
  harga_modal: number;
  stok: number;
  stok_minimum: number;
  akses_custom: boolean;
  aktif: boolean;
  urutan: number;
  tipe_produk: string;
  tampil: number;
  created_at: string;
  updated_at: string;
  stall_nama: string;
  product_category?: ApiProductCategory;
}

interface ApiProductsResponse {
  success: boolean;
  message: string;
  data: {
    data: ApiProduct[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

interface ApiCategory {
  id: number;
  stall_id: number;
  nama: string;
  deskripsi: string;
  gambar: string | null;
  gambar_url?: string;
  urutan: number;
  status: number;
  product_count: number;
  created_at: string;
  updated_at: string;
}

interface ApiProductCategoriesResponse {
  success: boolean;
  message: string;
  data: {
    data: ApiCategory[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

interface PosCategory {
  id: string;
  name: string;
}

export default function POSPage() {
  const router = useRouter();
  const printer = usePrinter();
  const [isChecking, setIsChecking] = useState(true);
  // State buka/tutup kasir
  const [showBukaKasirModal, setShowBukaKasirModal] = useState(false);
  const [saldoAwalInput, setSaldoAwalInput] = useState('');
  const [catatanBuka, setCatatanBuka] = useState('');
  const [loadingKasir, setLoadingKasir] = useState(false);
  const [showRingkasanTutup, setShowRingkasanTutup] = useState(false);
  const [tutupKasirData, setTutupKasirData] = useState<TutupKasirData | null>(null);
  
  // Color theme state - load from localStorage
  const [selectedTheme, setSelectedTheme] = useState<'blue' | 'green' | 'pink' | 'purple'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mk-selected-theme');
      if (stored && ['blue', 'green', 'pink', 'purple'].includes(stored)) {
        return stored as 'blue' | 'green' | 'pink' | 'purple';
      }
    }
    return 'green';
  });
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Save theme to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mk-selected-theme', selectedTheme);
    }
  }, [selectedTheme]);

  // Helper function to get theme classes
  const getThemeClasses = (theme: 'blue' | 'green' | 'pink' | 'purple') => {
    const themes = {
      blue: {
        headerGradient: 'from-blue-500 via-blue-400 to-blue-300',
        categoryActive: 'from-blue-400 via-blue-300 to-blue-200',
        text: 'text-blue-600',
        text700: 'text-blue-700',
        text500: 'text-blue-500',
        bg: 'bg-blue-500',
        bg100: 'bg-blue-100',
        bg50: 'bg-blue-50',
        border: 'border-blue-200',
        border300: 'border-blue-300',
        border400: 'border-blue-400',
        shadow: 'shadow-blue-500/30',
        shadow20: 'shadow-blue-500/20',
        hover: 'hover:bg-blue-50',
        hoverText: 'hover:text-blue-600',
        hoverBorder: 'hover:border-blue-400',
        hoverBorder300: 'hover:border-blue-300',
      },
      green: {
        headerGradient: 'from-emerald-500 via-emerald-400 to-emerald-300',
        categoryActive: 'from-emerald-400 via-emerald-300 to-emerald-200',
        text: 'text-emerald-600',
        text700: 'text-emerald-700',
        text500: 'text-emerald-500',
        bg: 'bg-emerald-500',
        bg100: 'bg-emerald-100',
        bg50: 'bg-emerald-50',
        border: 'border-emerald-200',
        border300: 'border-emerald-300',
        border400: 'border-emerald-400',
        shadow: 'shadow-emerald-500/30',
        shadow20: 'shadow-emerald-500/20',
        hover: 'hover:bg-emerald-50',
        hoverText: 'hover:text-emerald-600',
        hoverBorder: 'hover:border-emerald-400',
        hoverBorder300: 'hover:border-emerald-300',
      },
      pink: {
        headerGradient: 'from-pink-500 via-pink-400 to-pink-300',
        categoryActive: 'from-pink-400 via-pink-300 to-pink-200',
        text: 'text-pink-600',
        text700: 'text-pink-700',
        text500: 'text-pink-500',
        bg: 'bg-pink-500',
        bg100: 'bg-pink-100',
        bg50: 'bg-pink-50',
        border: 'border-pink-200',
        border300: 'border-pink-300',
        border400: 'border-pink-400',
        shadow: 'shadow-pink-500/30',
        shadow20: 'shadow-pink-500/20',
        hover: 'hover:bg-pink-50',
        hoverText: 'hover:text-pink-600',
        hoverBorder: 'hover:border-pink-400',
        hoverBorder300: 'hover:border-pink-300',
      },
      purple: {
        headerGradient: 'from-purple-500 via-purple-400 to-purple-300',
        categoryActive: 'from-purple-400 via-purple-300 to-purple-200',
        text: 'text-purple-600',
        text700: 'text-purple-700',
        text500: 'text-purple-500',
        bg: 'bg-purple-500',
        bg100: 'bg-purple-100',
        bg50: 'bg-purple-50',
        border: 'border-purple-200',
        border300: 'border-purple-300',
        border400: 'border-purple-400',
        shadow: 'shadow-purple-500/30',
        shadow20: 'shadow-purple-500/20',
        hover: 'hover:bg-purple-50',
        hoverText: 'hover:text-purple-600',
        hoverBorder: 'hover:border-purple-400',
        hoverBorder300: 'hover:border-purple-300',
      },
    };
    return themes[theme];
  };

  const theme = getThemeClasses(selectedTheme);
  
  useEffect(() => {
    // Skip authentication - langsung ke dashboard
    const currentUserStr = localStorage.getItem('currentUser');
    
    // Set dummy user data jika belum ada
    if (!currentUserStr) {
      const dummyUser = {
        id: '1',
        name: 'Kasir',
        phone: '081234567890',
        loggedIn: true,
        pinVerified: true,
        level: 'Kasir',
        stall_id: 1,
        nama_kios: 'Toko',
        permissions: [],
      };
      localStorage.setItem('currentUser', JSON.stringify(dummyUser));
      
      setSelectedCashier({
        id: '1',
        name: 'Kasir',
        initials: 'KA',
        level: 'Kasir',
      });
      
      setIsChecking(false);
      return;
    }

    try {
      const currentUser = JSON.parse(currentUserStr);
      
      // Pastikan user sudah verified
      if (!currentUser.pinVerified) {
        currentUser.pinVerified = true;
        currentUser.loggedIn = true;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      }
      
      const name: string = currentUser.name || 'Kasir';
      const level: string = currentUser.level || 'Kasir';
      const words = name.trim().split(/\s+/);
      const initials =
        words.length >= 2
          ? `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase()
          : name.slice(0, 2).toUpperCase();

      setSelectedCashier({
        id: String(currentUser.id ?? currentUser.user_id ?? '1'),
        name,
        initials,
        level,
      });

      setIsChecking(false);
    } catch (error) {
      console.error('Error checking auth:', error);
      // Set dummy user jika error
      const dummyUser = {
        id: '1',
        name: 'Kasir',
        phone: '081234567890',
        loggedIn: true,
        pinVerified: true,
        level: 'Kasir',
        stall_id: 1,
        nama_kios: 'Toko',
        permissions: [],
      };
      localStorage.setItem('currentUser', JSON.stringify(dummyUser));
      
      setSelectedCashier({
        id: '1',
        name: 'Kasir',
        initials: 'KA',
        level: 'Kasir',
      });
      
      setIsChecking(false);
    }
  }, [router]);

  // Reset sidebar state saat window resize untuk memastikan konsistensi
  useEffect(() => {
    const handleResize = () => {
      // Jika window menjadi 2xl atau lebih besar, reset tablet sidebar
      if (window.innerWidth >= 1536) {
        setSidebarCollapsed(true);
      }
      // Jika window menjadi lg atau lebih kecil, reset mobile sidebar
      if (window.innerWidth < 1024) {
        setShowSidebar(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Setelah cek login & PIN selesai, cek status buka/tutup kasir
  useEffect(() => {
    if (isChecking) return;

    const initKasir = async () => {
      try {
        const { needOpen, needClose } = await shouldShowBukaKasir();

        // Jika perlu tutup dulu (karena lewat hari), ambil ringkasan dan tampilkan
        if (needClose) {
          try {
            const data = await fetchTutupKasirData();
            if (data) {
              setTutupKasirData(data);
              setShowRingkasanTutup(true);
              return;
            }
          } catch (e) {
            console.error('Gagal mengambil ringkasan tutup kasir:', e);
          }
        }

        // Jika belum ada bukakas aktif, cek status_uang_bukakasir
        if (needOpen) {
          const status = getStatusUangBukakasir(); // 1 = auto, selain itu wajib popup
          if (status === 1) {
            try {
              setLoadingKasir(true);
              // Auto buka kasir dengan saldo 0 dan catatan default
              await bukaKasirApi({
                saldoAwal: 0,
                catatan: 'Auto buka kasir',
                permanen: true,
              });
            } catch (e) {
              console.error('Gagal auto buka kasir:', e);
              // Kalau auto gagal, fallback ke popup manual
              setShowBukaKasirModal(true);
            } finally {
              setLoadingKasir(false);
            }
          } else {
            // status_uang_bukakasir != 1 -> wajib popup buka kasir
            setShowBukaKasirModal(true);
          }
        }
      } catch (e) {
        console.error('Gagal cek status kasir:', e);
      }
    };

    void initKasir();
  }, [isChecking]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'barcode' | 'search'>('barcode');
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState<'cash' | 'digital' | 'qris'>('cash');
  const [digitalMethod, setDigitalMethod] = useState('OVO');
  const [paidAmount, setPaidAmount] = useState<string>('0');
  const [isDebt, setIsDebt] = useState(false);
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualCustomerPhone, setManualCustomerPhone] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false); // mobile (< md)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // tablet (md, lg, xl, but not 2xl)
  const [showCashierDropdown, setShowCashierDropdown] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState<CurrentCashier | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionData, setTransactionData] = useState<{
    id: string;
    total: number;
    paid: number;
    change: number;
    paymentMethod?: string;
    customerName?: string;
    isDebt?: boolean;
  } | null>(null);
  const [categories, setCategories] = useState<PosCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [errorProducts, setErrorProducts] = useState<string | null>(null);
  const [errorCategories, setErrorCategories] = useState<string | null>(null);
  const [processingTransaction, setProcessingTransaction] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const getPlaceholderText = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return 'PR';
    const words = trimmed.split(/\s+/);
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    const first = words[0][0] || '';
    const second = words[1][0] || '';
    return `${first}${second}`.toUpperCase();
  };
  
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      setErrorCategories(null);

      const jwtPin = typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;
      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
      }

      const response = await fetch(
        `${API_BASE_URL}/master/product-categories?page=1&limit=100`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwtPin}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const json: ApiProductCategoriesResponse = await response.json();

      const mapped: PosCategory[] = [
    { id: 'all', name: 'All Product' },
        ...json.data.data.map((item) => ({
          id: String(item.id),
          name: item.nama,
        })),
      ];

      setCategories(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat kategori produk';
      setErrorCategories(message);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchProducts = async (search?: string) => {
    try {
      setLoadingProducts(true);
      setErrorProducts(null);

      const jwtPin = typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;
      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
      }

      let url = `${API_BASE_URL}/master/products?page=1&limit=100`;
      if (search && search.trim() !== '') {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }

      const response = await fetch(
        url,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwtPin}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const json: ApiProductsResponse = await response.json();

      const mapped: Product[] = json.data.data.map((item) => ({
        id: String(item.id),
        name: item.nama,
        price: item.harga,
        originalPrice: item.harga_modal || item.harga,
        image: item.gambar_url || '',
        placeholderText: getPlaceholderText(item.nama),
        category: item.product_category?.nama || '-',
        unit: `Sisa ${item.stok}`,
        isCustom: item.akses_custom,
        stock: item.stok,
      }));

      setProducts(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat produk';
      setErrorProducts(message);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProducts(searchQuery);
    }, 400);

    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Helper function to get quantity from cart
  const getProductQuantity = (productId: string): number => {
    const item = cartItems.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };

  // Handle increase quantity
  const handleIncreaseQuantity = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (product.stock <= 0) return;
    
    if (product.isCustom) {
      setSelectedProduct(product);
      setShowAddModal(true);
      return;
    }

    const currentQuantity = getProductQuantity(product.id);
    
    if (currentQuantity === 0) {
      // Add new item
      const directItem = {
        productId: product.id,
        name: product.name,
        unit: 'pcs',
        quantity: 1,
        price: product.price,
      };
      handleAddToCart(directItem);
    } else {
      // Increase existing quantity
      const item = cartItems.find((item) => item.id === product.id);
      if (item && currentQuantity < product.stock) {
        const updatedItems = cartItems.map((cartItem) =>
          cartItem.id === product.id
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
                subtotal: (cartItem.quantity + 1) * (cartItem.negotiatedPrice ?? cartItem.price),
              }
            : cartItem
        );
        setCartItems(updatedItems);
      }
    }
  };

  // Handle decrease quantity
  const handleDecreaseQuantity = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    const currentQuantity = getProductQuantity(product.id);
    if (currentQuantity <= 1) {
      // Remove from cart
      setCartItems(cartItems.filter((item) => item.id !== product.id));
    } else {
      // Decrease quantity
      const updatedItems = cartItems.map((cartItem) => {
        if (cartItem.id === product.id) {
          const newQuantity = cartItem.quantity - 1;
          const priceToUse = cartItem.negotiatedPrice ?? cartItem.price;
          return {
            ...cartItem,
            quantity: newQuantity,
            subtotal: newQuantity * priceToUse,
          };
        }
        return cartItem;
      });
      setCartItems(updatedItems);
    }
  };

  const handleProductClick = (product: Product) => {
    if (product.stock <= 0) {
      return;
    }

    if (product.isCustom) {
    setSelectedProduct(product);
    setShowAddModal(true);
    } else {
      // If not in cart, add it
      const currentQuantity = getProductQuantity(product.id);
      if (currentQuantity === 0) {
      const directItem = {
        productId: product.id,
        name: product.name,
        unit: 'pcs',
        quantity: 1,
        price: product.price,
      };
      handleAddToCart(directItem);
      }
      // If already in cart, do nothing (use + - buttons instead)
    }
  };

  const handleAddToCart = (item: {
    productId: string;
    name: string;
    unit: string;
    quantity: number;
    price: number;
    negotiatedPrice?: number;
    note?: string;
  }) => {
    const productData = products.find((p) => p.id === item.productId) || selectedProduct;
    const priceToUse = item.negotiatedPrice ?? item.price;

    const maxStock = productData?.stock ?? Infinity;
    const existingItem = cartItems.find((c) => c.id === item.productId);
    const currentQty = existingItem ? existingItem.quantity : 0;
    const requestedQty = Math.min(item.quantity, Math.max(0, maxStock - currentQty));

    if (requestedQty <= 0) {
      // stok habis atau sudah mencapai batas stok
      return;
    }

    const newItem = {
      id: item.productId,
      name: item.name,
      unit: item.unit,
      quantity: requestedQty,
      price: priceToUse,
      originalPrice: productData?.originalPrice ?? item.price,
      image: productData?.image ?? '',
      category: productData?.category ?? '',
      stock: maxStock,
      negotiatedPrice: item.negotiatedPrice,
      note: item.note,
      subtotal: priceToUse * requestedQty,
    };

    if (existingItem) {
      setCartItems(
        cartItems.map((c) =>
          c.id === newItem.id
            ? {
                ...c,
                quantity: c.quantity + newItem.quantity,
                subtotal: (c.quantity + newItem.quantity) * c.price,
                note: newItem.note ?? c.note,
              }
            : c
        )
      );
    } else {
      setCartItems([...cartItems, newItem]);
    }

    setShowAddModal(false);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(
      cartItems
        .map(item => {
          if (item.id === id) {
            const maxStock = item.stock ?? Infinity;
            const nextQty = Math.min(Math.max(1, item.quantity + delta), maxStock);
            return { ...item, quantity: nextQty, subtotal: nextQty * item.price };
          }
          return item;
        })
        .filter(item => item.quantity > 0)
    );
  };

  const setQuantityValue = (id: string, value: number) => {
    const raw = value || 1;
    setCartItems(
      cartItems.map(item => {
        if (item.id === id) {
          const maxStock = item.stock ?? Infinity;
          const qty = Math.min(Math.max(1, raw), maxStock);
          return { ...item, quantity: qty, subtotal: qty * item.price };
        }
        return item;
      })
    );
  };

  const removeItem = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const clearAll = () => {
    setCartItems([]);
  };

  const saveToLocalList = <T,>(key: string, item: T) => {
    try {
      const stored = localStorage.getItem(key);
      const arr = stored ? (JSON.parse(stored) as T[]) : [];
      const next = Array.isArray(arr) ? [...arr, item] : [item];
      localStorage.setItem(key, JSON.stringify(next));
    } catch (err) {
      console.error('Failed to persist data', err);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyInput = (value: number | string): string => {
    const num = typeof value === 'string' ? parseCurrencyInput(value) : value;
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const parseCurrencyInput = (value: string): number => {
    // Hapus semua karakter non-digit
    const cleaned = value.replace(/[^\d]/g, '');
    return cleaned ? parseInt(cleaned, 10) : 0;
  };

  const handleProcessPayment = async () => {
    try {
      setProcessingTransaction(true);
      setTransactionError(null);

      // Validasi jika piutang, nama pelanggan wajib
      if (isDebt && !manualCustomerName.trim()) {
        setTransactionError('Nama pelanggan wajib diisi untuk transaksi piutang');
        setProcessingTransaction(false);
        return;
      }

      // Validasi jika cash dan tidak piutang, jumlah bayar harus >= total
      const parsedPaidAmount = parseCurrencyInput(paidAmount);
      if (!isDebt && payMethod === 'cash' && parsedPaidAmount < total) {
        setTransactionError('Jumlah bayar kurang dari total');
        setProcessingTransaction(false);
        return;
      }

      const jwtPin = typeof window !== 'undefined' ? localStorage.getItem('jwt_pin') : null;
      if (!jwtPin) {
        throw new Error('JWT PIN tidak ditemukan. Silakan login PIN terlebih dahulu.');
      }

      const currentUserStr = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
      const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

      if (!currentUser) {
        throw new Error('Data user tidak ditemukan. Silakan login ulang.');
      }

      // Mapping payment method ke transaction_method_id
      // cash = 1, digital = 2, qris = 3 (sesuaikan dengan API Anda)
      const methodLabel = payMethod === 'digital' ? digitalMethod : payMethod;
      let transactionMethodId = 1; // default cash
      if (payMethod === 'cash') {
        transactionMethodId = 1;
      } else if (payMethod === 'digital') {
        transactionMethodId = 2;
      } else if (payMethod === 'qris') {
        transactionMethodId = 3;
      }
      const finalPaidAmount = payMethod === 'cash' ? parsedPaidAmount : total;
      const customerName = manualCustomerName.trim() || 'Tidak ada nama pelanggan';
      const finalChange = isDebt ? 0 : Math.max(0, finalPaidAmount - total);

      // Siapkan payload sesuai format API
      const payload = {
        bukakas_id: 1, // Default, sesuaikan jika ada API untuk mendapatkan bukakas aktif
        nama_customer: customerName,
        no_tlpn: manualCustomerPhone || '',
        transaction_method_id: transactionMethodId,
        user_id_tenant: currentUser.id,
        nomor_meja: '',
        tipe: 'dine_in', // atau 'take_away', sesuaikan dengan kebutuhan
        status: '',
        dibayar: true,
        pembayaran_melalui: 'cashier',
        // Untuk sementara, matikan diskon, pajak, dan biaya lainnya (semua 0)
        diskon: 0,
        pajak: 0,
        biaya_lainnya: 0,
        nominal_bayar: finalPaidAmount,
        catatan: '',
        nama_pelanggan: customerName,
        piutang: isDebt,
        details: cartItems.map((item) => {
          const hargaJual = item.negotiatedPrice || item.price;
          const subtotalCalc = hargaJual * item.quantity;
          const keuntungan = (hargaJual - (item.originalPrice || hargaJual)) * item.quantity;

          return {
            product_id: Number(item.id),
            nama_produk: item.name,
            nama_varian: '',
            qty: item.quantity,
            qty_awal: 0,
            stok_sebelum_transaksi: item.stock || 0,
            harga_modal: item.originalPrice || hargaJual,
            harga_jual: hargaJual,
            diskon: 0,
            subtotal: subtotalCalc,
            keuntungan: keuntungan > 0 ? keuntungan : 0,
            aktif: true,
          };
        }),
      };

      // Panggil API insert transaksi
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtPin}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const json = await response.json();

      // Set transaction data untuk modal sukses
      const transactionId = json.data?.nomor_transaksi || json.data?.id || `TRX${Date.now()}`;
    setTransactionData({
      id: transactionId,
      total,
      paid: finalPaidAmount,
      change: finalChange,
        paymentMethod: methodLabel,
        customerName,
        isDebt,
      });

    // Close payment modal and show success modal
    setShowPayModal(false);
    setShowSuccessModal(true);

      // Reset form
      setCartItems([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memproses transaksi';
      setTransactionError(message);
      console.error('Transaction error:', err);
    } finally {
      setProcessingTransaction(false);
    }
  };

  const handleCloseSuccessModal = async () => {
    // Cek auto_print, jika 1 maka auto print dulu
    const autoPrint = typeof window !== 'undefined' 
      ? localStorage.getItem('auto_print') || '0'
      : '0';
    
    if (autoPrint === '1') {
      await handlePrintReceipt();
    }

    setShowSuccessModal(false);
    setCartItems([]);
    setShowCart(false);
    setIsDebt(false);
    setManualCustomerName('');
    setManualCustomerPhone('');
    setPaidAmount('0');
    setDigitalMethod('OVO');
    setPayMethod('cash');
    setTransactionData(null);
    setTransactionError(null);

    // Refresh section1 (Products Section) saja untuk update stok
    // Section2 (Cart Sidebar) tidak perlu di-refresh karena sudah di-reset dengan setCartItems([])
    await fetchProducts(searchQuery);
  };

  const handlePrintReceipt = async () => {
    // Print receipt functionality
    try {
    window.print();
    } catch (err) {
      console.error('Print error:', err);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  // Untuk sementara, diskon dan pajak tidak digunakan di POS, set ke 0
  const discount = 0;
  const tax = 0;
  const total = subtotal;
  const parsedPaidAmount = parseCurrencyInput(paidAmount);
  const change = Math.max(0, parsedPaidAmount - total);

  const filteredProducts = products.filter((product) => {
    const matchCategory =
      selectedCategory === 'all' || product.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 relative overflow-hidden">
      {/* Desktop Sidebar (2xl up - very large screens) */}
      <div className="hidden 2xl:block fixed left-0 top-0 bottom-0 w-64 z-50">
        <Sidebar theme={selectedTheme} />
      </div>

      {/* Tablet Sidebar Overlay (lg to xl - when expanded) */}
      {!sidebarCollapsed && (
        <div className="hidden lg:block 2xl:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarCollapsed(true)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl z-50 overflow-y-auto">
            <Sidebar isOverlay={true} theme={selectedTheme} />
          </div>
        </div>
      )}

      {/* Show Sidebar Indicator for Tablet (lg to xl - when collapsed) */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="hidden lg:flex 2xl:hidden fixed left-0 top-1/2 -translate-y-1/2 z-50 w-12 h-20 bg-white rounded-r-full items-center justify-center shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-300 group"
          aria-label="Show sidebar"
        >
          <div className="flex items-center -space-x-3">
            <i 
              className="ri-arrow-right-s-line text-emerald-400 text-2xl group-hover:text-emerald-500 transition-colors" 
              style={{ 
                animation: 'arrowGlow 1.5s ease-in-out infinite',
                animationDelay: '0s'
              }}
            ></i>
            <i 
              className="ri-arrow-right-s-line text-emerald-400 text-2xl group-hover:text-emerald-500 transition-colors" 
              style={{ 
                animation: 'arrowGlow 1.5s ease-in-out infinite',
                animationDelay: '0.3s'
              }}
            ></i>
          </div>
        </button>
      )}
      
      {/* Mobile Sidebar Overlay (< lg) */}
      {showSidebar && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSidebar(false)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-white z-50 overflow-y-auto shadow-xl">
            <Sidebar isOverlay={true} theme={selectedTheme} />
          </div>
        </div>
      )}

      {/* Show Sidebar Indicator for Mobile (< lg - when collapsed) */}
      {!showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          className="lg:hidden fixed left-0 top-1/2 -translate-y-1/2 z-50 w-12 h-20 bg-white rounded-r-full items-center justify-center shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-300 group flex"
          aria-label="Show sidebar"
        >
          <div className="flex items-center -space-x-3">
            <i 
              className="ri-arrow-right-s-line text-emerald-400 text-2xl group-hover:text-emerald-500 transition-colors" 
              style={{ 
                animation: 'arrowGlow 1.5s ease-in-out infinite',
                animationDelay: '0s'
              }}
            ></i>
            <i 
              className="ri-arrow-right-s-line text-emerald-400 text-2xl group-hover:text-emerald-500 transition-colors" 
              style={{ 
                animation: 'arrowGlow 1.5s ease-in-out infinite',
                animationDelay: '0.3s'
              }}
            ></i>
          </div>
        </button>
      )}

      {/* Desktop Layout: New Structure - Header Top | Categories Bar | Split Content */}
      <div className="hidden lg:flex flex-col h-full w-full 2xl:pl-64 bg-gradient-to-br from-gray-50 to-gray-100/50">

        {/* Search and Actions Bar */}
        <div className="flex-shrink-0 z-40 relative px-8 pt-4 pr-[440px] xl:pr-[500px]">
          <div className={`bg-gradient-to-r ${theme.headerGradient} shadow-md rounded-xl py-4 px-8 relative`}>
            <div className="flex items-center gap-6">
              {/* Left: Search */}
              <div className="relative flex-1 max-w-xl">
                <div className="relative">
            <input
              type="text"
                    placeholder="Scan barcode atau ketik nama produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-20 py-3.5 bg-white/95 backdrop-blur-sm border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white shadow-lg transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <button
                    type="button"
                      onClick={() => setSearchMode(searchMode === 'barcode' ? 'search' : 'barcode')}
                      className={`group relative w-8 h-8 rounded-lg ${theme.bg} flex items-center justify-center transition-all hover:scale-110 hover:shadow-lg active:scale-95`}
                      title={`Mode ${searchMode === 'barcode' ? 'Barcode' : 'Search'} - Klik untuk ganti ke ${searchMode === 'barcode' ? 'Search' : 'Barcode'}`}
                    >
                      {searchMode === 'barcode' ? (
                        <i className="ri-barcode-line text-base text-white transition-transform group-hover:scale-110"></i>
                      ) : (
                        <i className="ri-search-line text-base text-white transition-transform group-hover:scale-110"></i>
                      )}
                      {/* Indicator dot kuning dengan icon switch */}
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                        <i className="ri-swap-line text-[8px] text-yellow-900"></i>
                    </span>
                  </button>
              </div>
              </div>
              {searchQuery && filteredProducts.filter(p => p.stock > 0).length > 0 && (
                  <div className="absolute z-40 mt-2 left-0 right-0 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-80 overflow-y-auto">
                  {filteredProducts.filter(p => p.stock > 0).slice(0, 10).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        handleProductClick(p);
                      }}
                        className={`w-full px-4 py-3 text-left text-sm text-gray-700 ${theme.hover} cursor-pointer flex items-center gap-3 border-b border-gray-100 last:border-0 transition-colors`}
                    >
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-200">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                            {p.placeholderText}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                          <p className="truncate font-semibold text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Stok: {p.stock} • {p.category}</p>
                      </div>
                        <span className={`text-sm ${theme.text} font-bold whitespace-nowrap`}>
                          Rp {p.price.toLocaleString('id-ID')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            </div>
            
            {/* Right: Status & Actions - Fixed to Right Corner (above cart sidebar) */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2 z-50">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-sm ${
                printer.isConnected 
                  ? 'border-white/30 bg-white/20 text-white' 
                  : 'border-red-300/50 bg-red-500/90 text-white'
              }`}>
                <i className={`ri-printer-line text-base ${printer.isConnected ? '' : 'opacity-80'}`}></i>
                <span
                  className={`w-2 h-2 rounded-full ${
                    printer.isConnected ? 'bg-white' : 'bg-white'
                  } ${printer.isConnected ? 'animate-pulse' : ''}`}
                ></span>
                <span className="text-xs font-medium whitespace-nowrap">
                  {printer.isConnected
                    ? `${printer.deviceName || 'Printer'}`
                    : 'Offline'}
                </span>
              </div>
              {/* Color Picker Button */}
              <div className="relative">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/30 transition-all text-white"
                  title="Ubah Tema Warna"
                >
                  <i className="ri-palette-line text-lg"></i>
              </button>
                
                {/* Color Picker Dropdown */}
                {showColorPicker && (
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-3 z-50 min-w-[180px]">
                    <div className="text-xs font-semibold text-gray-700 mb-2 px-2">Pilih Tema</div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'blue', name: 'Biru', gradient: 'from-blue-500 via-blue-400 to-blue-300' },
                        { id: 'green', name: 'Hijau', gradient: 'from-emerald-500 via-emerald-400 to-emerald-300' },
                        { id: 'pink', name: 'Pink', gradient: 'from-pink-500 via-pink-400 to-pink-300' },
                        { id: 'purple', name: 'Ungu', gradient: 'from-purple-500 via-purple-400 to-purple-300' },
                      ].map((color) => (
                        <button
                          key={color.id}
                          onClick={() => {
                            setSelectedTheme(color.id as 'blue' | 'green' | 'pink' | 'purple');
                            setShowColorPicker(false);
                          }}
                          className={`relative p-3 rounded-lg border-2 transition-all ${
                            selectedTheme === color.id
                              ? 'border-gray-900 shadow-lg scale-105'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`w-full h-12 rounded-md bg-gradient-to-r ${color.gradient} mb-2`}></div>
                          <div className="text-xs font-medium text-gray-700 text-center">{color.name}</div>
                          {selectedTheme === color.id && (
                            <div className="absolute top-1 right-1 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                              <i className="ri-check-line text-white text-xs"></i>
            </div>
                          )}
                        </button>
                      ))}
          </div>
        </div>
                )}
              </div>
              <button className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/30 transition-all text-white" title="Kamera">
                <i className="ri-camera-line text-lg"></i>
              </button>
            </div>
          </div>
            </div>

        {/* Category Bar - Horizontal Sticky */}
        <div className="bg-transparent border-b border-gray-200/50 flex-shrink-0 sticky top-0 z-20">
          <div className="px-8 py-3 pr-[440px] xl:pr-[500px]">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <span className="text-sm font-bold text-gray-700 whitespace-nowrap mr-2">Kategori:</span>
              {loadingCategories && (
                <span className="text-sm text-gray-500">Memuat kategori...</span>
              )}
              {errorCategories && !loadingCategories && (
                <span className="text-sm text-red-500">{errorCategories}</span>
              )}
              {!loadingCategories && !errorCategories && categories.map((cat) => {
                const isActive = (cat.id === 'all' && selectedCategory === 'all') || selectedCategory === cat.name;
                return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id === 'all' ? 'all' : cat.name)}
                  title={cat.name}
                    className={`flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? `bg-gradient-to-r ${theme.categoryActive} text-white shadow-lg ${theme.shadow}`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                  {cat.name}
                </button>
                );
              })}
            </div>
            </div>
          </div>

        {/* Main Content Area - Split Layout: Products Left | Cart Right */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Products Section - Left Side */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0 pr-[424px] xl:pr-[484px]">

            {/* Products Grid - Full Height Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5 pt-12">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">Produk</h3>
                  <span className={`px-2.5 py-0.5 ${theme.bg100} ${theme.text700} text-xs font-bold rounded-full`}>
                    {filteredProducts.length}
                  </span>
                </div>
                <button className={`text-sm text-gray-600 ${theme.hoverText} font-semibold flex items-center gap-1.5 transition-colors px-3 py-1.5 hover:bg-gray-100 rounded-lg`}>
                  <i className="ri-sort-asc text-base"></i>
                  Sort A-Z
                </button>
            </div>

            {/* Desktop: 3-4 kolom grid - Modern Product Cards */}
            <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
            {loadingProducts && (
              <div className="col-span-full text-center text-gray-500 text-sm py-8">
                Memuat produk...
              </div>
            )}
            {errorProducts && !loadingProducts && (
              <div className="col-span-full text-center text-red-500 text-sm py-8">
                {errorProducts}
              </div>
            )}
            {!loadingProducts && !errorProducts && filteredProducts.length === 0 && (
              <div className="col-span-full text-center text-gray-500 text-sm py-8">
                Tidak ada produk.
              </div>
            )}
            {!loadingProducts && !errorProducts && filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => product.stock > 0 && handleProductClick(product)}
                className={`bg-white rounded-xl border-2 overflow-hidden transition-all duration-300 text-left group relative ${
                  product.stock > 0
                    ? `hover:shadow-xl ${theme.shadow20} ${theme.hoverBorder} hover:-translate-y-0.5 cursor-pointer border-gray-200`
                    : 'opacity-60 cursor-not-allowed border-gray-200'
                }`}
              >
                {/* Desktop Layout: Modern Retail Product Card */}
                <div className="flex flex-col">
                  <div className="relative w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                      {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                      ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-3xl font-bold text-gray-400">
                          {product.placeholderText}
                        </span>
                    </div>
                    )}
                    {/* Stock Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2.5 py-1.5 text-xs font-bold rounded-full shadow-lg backdrop-blur-sm ${
                          product.stock > 0
                            ? `${theme.bg} text-white border border-white/30`
                            : `bg-red-400 text-white border border-white/30`
                        }`}
                      >
                        {product.stock > 0 ? `Stok ${product.stock}` : 'Habis'}
                      </span>
                    </div>
                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg ${theme.bg50} backdrop-blur-sm ${theme.text700} border ${theme.border300}`}>
                        {product.category}
                      </span>
                  </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-2.5 p-4">
                    <h4 className={`font-bold text-gray-900 text-sm line-clamp-2 ${theme.hoverText} transition-colors min-h-[2.75rem] leading-tight group`}>
                        {product.name}
                      </h4>
                    <div className="flex items-baseline gap-2">
                      <p className={`text-lg font-black ${theme.text}`}>Rp {product.price.toLocaleString('id-ID')}</p>
                      {product.originalPrice !== product.price && (
                        <p className="text-xs text-gray-400 line-through">Rp {product.originalPrice.toLocaleString('id-ID')}</p>
                      )}
                      </div>
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                      {product.stock > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 ${theme.bg} rounded-full animate-pulse`}></span>
                          <span className={`text-xs ${theme.text700} font-medium`}>
                            Tersedia
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                          <span className="text-xs text-red-500 font-medium">
                            Stok habis
                          </span>
                        </div>
                      )}
                      {/* Quantity Control - Desktop */}
                      {getProductQuantity(product.id) > 0 ? (
                        <div className="flex items-center gap-1.5 bg-white border-2 border-gray-200 rounded-lg">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDecreaseQuantity(product, e);
                            }}
                            className={`px-2 py-1 ${theme.text} hover:bg-gray-50 transition-colors rounded-l-lg`}
                            disabled={product.stock <= 0}
                          >
                            <i className="ri-subtract-line text-base font-bold"></i>
                          </button>
                          <span className={`px-2.5 py-1 text-xs font-bold ${theme.text} min-w-[1.75rem] text-center`}>
                            {getProductQuantity(product.id)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleIncreaseQuantity(product, e);
                            }}
                            className={`px-2 py-1 ${theme.text} hover:bg-gray-50 transition-colors rounded-r-lg`}
                            disabled={product.stock <= 0 || getProductQuantity(product.id) >= product.stock}
                          >
                            <i className="ri-add-line text-base font-bold"></i>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIncreaseQuantity(product, e);
                          }}
                          className={`px-2.5 py-1 ${theme.bg50} rounded-lg hover:bg-gray-100 transition-colors`}
                          disabled={product.stock <= 0}
                        >
                          <i className={`ri-add-circle-fill ${theme.text} text-lg`}></i>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Cart Sidebar (lg and up) - Right Side */}
      <div className="hidden lg:flex fixed right-0 top-0 bottom-0 w-[420px] xl:w-[480px] bg-white border-l-2 border-gray-200 flex-col shadow-2xl z-50">
        {/* Cart Header - Modern Style */}
        <div className="bg-white border-b-2 border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 ${theme.bg} rounded-xl flex items-center justify-center`}>
                <i className="ri-shopping-cart-2-fill text-white text-lg"></i>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Keranjang</h2>
                <p className="text-xs text-gray-500">Item dalam keranjang</p>
              </div>
            </div>
            {cartItems.length > 0 && (
              <span className={`px-3 py-1 ${theme.bg100} ${theme.text700} text-xs font-bold rounded-full border ${theme.border}`}>
                {cartItems.length}
              </span>
            )}
          </div>
          
          <div className="relative">
            {selectedCashier && (
            <button
              onClick={() => setShowCashierDropdown(!showCashierDropdown)}
                className="w-full flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all cursor-pointer border border-gray-200"
            >
                <div className={`w-9 h-9 bg-white rounded-full flex items-center justify-center ${theme.text} text-sm font-bold flex-shrink-0 border-2 ${theme.border300}`}>
                {selectedCashier.initials}
              </div>
              <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900 text-sm">{selectedCashier.name}</p>
                  <p className="text-xs text-gray-500">{selectedCashier.level}</p>
              </div>
                <i className={`ri-arrow-down-s-line text-base text-gray-600 transition-transform ${showCashierDropdown ? 'rotate-180' : ''}`}></i>
            </button>
            )}

            {showCashierDropdown && selectedCashier && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl z-20">
                <div className="w-full flex items-center gap-3 px-4 py-3">
                  <div className={`w-9 h-9 ${theme.bg} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                    {selectedCashier.initials}
                    </div>
                    <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900 text-sm">{selectedCashier.name}</p>
                    <p className="text-xs text-gray-500">{selectedCashier.level}</p>
                    </div>
                  <i className={`ri-check-line ${theme.text} text-lg`}></i>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cart Items - Modern Style */}
        <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">Item di Keranjang</span>
              {cartItems.length > 0 && (
                <span className={`px-2.5 py-0.5 ${theme.bg100} ${theme.text700} text-xs font-bold rounded-full border ${theme.border}`}>
                {cartItems.length}
              </span>
              )}
            </div>
            {cartItems.length > 0 && (
              <button onClick={clearAll} className="text-sm text-red-600 hover:text-red-700 font-semibold flex items-center gap-1.5 transition-colors px-2 py-1 hover:bg-red-50 rounded-lg">
                <i className="ri-delete-bin-6-line"></i>
                Hapus Semua
              </button>
            )}
          </div>

          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className={`w-24 h-24 bg-gradient-to-br ${theme.bg100} ${theme.bg50} rounded-2xl flex items-center justify-center mb-4 border-2 ${theme.border}`}>
                <i className={`ri-shopping-cart-2-line text-4xl ${theme.text500}`}></i>
              </div>
              <p className="text-gray-700 font-bold text-base mb-1">Keranjang kosong</p>
              <p className="text-sm text-gray-500">Tambahkan produk untuk memulai transaksi</p>
            </div>
          ) : (
            <div className="space-y-3">
            {cartItems.map((item) => (
                <div key={item.id} className={`flex gap-2.5 p-3 bg-white rounded-xl border-2 border-gray-200 ${theme.hoverBorder300} shadow-sm hover:shadow-md transition-all`}>
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center border-2 border-gray-200">
                  {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                      <span className="text-xs font-bold text-gray-500">
                      {getPlaceholderText(item.name)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 text-xs line-clamp-2 flex-1">
                      {item.name}
                    </h4>
                      <span className={`text-xs font-black ${theme.text} whitespace-nowrap`}>
                        Rp {item.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                    <p className="text-[10px] text-gray-500 mb-2 font-medium">{item.unit}</p>
                  <div className="flex items-center justify-between">
                      <div className="flex items-center bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                          className="w-9 h-9 flex items-center justify-center hover:bg-red-50 active:scale-95 text-gray-700 hover:text-red-600 transition-all"
                      >
                          <i className="ri-subtract-line text-base font-bold"></i>
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => setQuantityValue(item.id, parseInt(e.target.value || '0', 10))}
                          className="w-14 h-9 text-center text-sm font-black border-0 border-x-2 border-gray-200 focus:ring-0 focus:outline-none appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-transparent text-gray-900"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                          className="w-9 h-9 flex items-center justify-center text-white btn-orange-gradient active:scale-95 transition-all"
                      >
                          <i className="ri-add-line text-base font-bold"></i>
                      </button>
                    </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-0.5">Subtotal</p>
                        <span className={`text-base font-black ${theme.text}`}>
                          Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                        </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Cart Footer - Modern Style */}
        <div className="border-t-2 border-gray-200 p-5 space-y-4 sticky bottom-0 bg-white shadow-lg">
          <div className="flex justify-between items-center pb-3 border-b-2 border-gray-100">
            <span className="text-lg font-bold text-gray-700">Total Pembayaran</span>
            <span className={`text-3xl font-black ${theme.text}`}>Rp {total.toLocaleString('id-ID')}</span>
          </div>

          <button
            className={`w-full py-4 bg-gradient-to-r ${theme.headerGradient} text-white font-bold rounded-xl transition-all text-base shadow-xl hover:shadow-2xl ${theme.shadow} active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            onClick={() => {
              setShowPayModal(true);
              setPayMethod('cash');
              setIsDebt(false);
              setManualCustomerName('');
              setManualCustomerPhone('');
              setPaidAmount('0');
            }}
            disabled={cartItems.length === 0}
          >
            <i className="ri-wallet-3-fill text-xl"></i>
            Bayar Sekarang
          </button>
        </div>
      </div>
        </div>
      </div>

      {/* Mobile Layout: Vertical (< lg) - New Structure */}
      <div className="lg:hidden flex flex-col h-full w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100/50">
        {/* Mobile Header - Top */}
        <div className={`bg-gradient-to-r ${theme.headerGradient} shadow-xl px-4 py-3.5 flex items-center gap-3 flex-shrink-0`}>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Scan barcode atau cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white/95 backdrop-blur-sm border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white shadow-md"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <i className={`ri-barcode-line text-lg ${theme.text}`}></i>
            </div>
            {searchQuery && filteredProducts.filter(p => p.stock > 0).length > 0 && (
              <div className="absolute z-30 mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredProducts.filter(p => p.stock > 0).slice(0, 8).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      handleProductClick(p);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs text-gray-700 ${theme.hover} cursor-pointer flex items-center gap-2`}
                  >
                    <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-50 flex-shrink-0">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">
                          {p.placeholderText}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="text-[10px] text-gray-500">Stok: {p.stock}</p>
                    </div>
                    <span className="text-[10px] text-gray-600 font-semibold whitespace-nowrap">
                      Rp {p.price.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowCart(!showCart)}
            className="relative w-12 h-12 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all border border-white/30 text-white"
          >
            <i className="ri-shopping-cart-2-fill text-xl"></i>
            {cartItems.length > 0 && (
              <span className={`absolute -top-1 -right-1 w-6 h-6 bg-white ${theme.text} text-xs font-black rounded-full flex items-center justify-center shadow-lg`}>
                {cartItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Category Bar - Sticky Horizontal */}
        <div className="bg-transparent border-b border-gray-200/50 flex-shrink-0 sticky top-0 z-20">
          <div className="px-4 py-2.5">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <span className="text-xs font-bold text-gray-700 whitespace-nowrap mr-1">Kategori:</span>
              {loadingCategories && (
                <span className="text-xs text-gray-500">Memuat...</span>
              )}
              {errorCategories && !loadingCategories && (
                <span className="text-xs text-red-500">{errorCategories}</span>
              )}
              {!loadingCategories && !errorCategories && categories.map((cat) => {
                const isActive = (cat.id === 'all' && selectedCategory === 'all') || selectedCategory === cat.name;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id === 'all' ? 'all' : cat.name)}
                    title={cat.name}
                    className={`flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? `bg-gradient-to-r ${theme.categoryActive} text-white shadow-md`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Products Section - Mobile */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">

          {/* Products List - Mobile */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900">Produk</h3>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                {filteredProducts.length}
              </span>
            </div>
          </div>

          {/* Mobile: 1 kolom horizontal cards */}
          <div className="grid grid-cols-1 gap-3">
              {loadingProducts && (
                <div className="col-span-full text-center text-gray-500 text-sm py-8">
                  Memuat produk...
                </div>
              )}
              {errorProducts && !loadingProducts && (
                <div className="col-span-full text-center text-red-500 text-sm py-8">
                  {errorProducts}
                </div>
              )}
              {!loadingProducts && !errorProducts && filteredProducts.length === 0 && (
                <div className="col-span-full text-center text-gray-500 text-sm py-8">
                  Tidak ada produk.
                </div>
              )}
              {!loadingProducts && !errorProducts && filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => product.stock > 0 && handleProductClick(product)}
                  className={`bg-white rounded-2xl border-2 overflow-hidden transition-all duration-300 text-left active:scale-[0.98] group ${
                    product.stock > 0
                      ? 'hover:shadow-xl hover:border-emerald-400 cursor-pointer border-gray-200 shadow-sm'
                      : 'opacity-60 cursor-not-allowed border-gray-200'
                  }`}
                >
                  {/* Mobile Layout: Horizontal - Modern Style */}
                  <div className="flex gap-3 p-3.5">
                    <div className="relative flex-shrink-0">
                      <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden flex items-center justify-center border-2 border-gray-200">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span className="text-base font-bold text-gray-400">
                            {product.placeholderText}
                          </span>
                        )}
                      </div>
                      <div className="absolute -top-1.5 -right-1.5">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-black rounded-full shadow-lg ${
                            product.stock > 0
                              ? `${theme.bg} text-white border-2 border-white`
                              : 'bg-gray-400 text-white border-2 border-white'
                          }`}
                        >
                          {product.stock > 0 ? `Stok ${product.stock}` : 'Habis'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1.5 text-sm line-clamp-2 leading-tight">
                          {product.name}
                        </h4>
                        <div className="flex items-baseline gap-2 mb-2">
                          <p className={`text-lg font-black ${theme.text}`}>Rp {product.price.toLocaleString('id-ID')}</p>
                          {product.originalPrice !== product.price && (
                            <p className="text-xs text-gray-400 line-through">Rp {product.originalPrice.toLocaleString('id-ID')}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
                        <div className="flex items-center gap-1.5">
                          {product.stock > 0 ? (
                            <>
                              <span className={`w-2 h-2 ${theme.bg} rounded-full animate-pulse`}></span>
                              <span className={`text-xs ${theme.text700} font-semibold`}>
                                Tersedia
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                              <span className="text-xs text-red-500 font-semibold">
                                Stok habis
                              </span>
                            </>
                          )}
                        </div>
                        {/* Quantity Control - Mobile */}
                        {getProductQuantity(product.id) > 0 ? (
                          <div className="flex items-center gap-1.5 bg-white border-2 border-gray-200 rounded-lg">
                            <button
                              onClick={(e) => handleDecreaseQuantity(product, e)}
                              className={`px-1.5 py-1 ${theme.text} hover:bg-gray-50 transition-colors rounded-l-lg`}
                              disabled={product.stock <= 0}
                            >
                              <i className="ri-subtract-line text-base font-bold"></i>
                            </button>
                            <span className={`px-2 py-1 text-xs font-bold ${theme.text} min-w-[1.5rem] text-center`}>
                              {getProductQuantity(product.id)}
                            </span>
                            <button
                              onClick={(e) => handleIncreaseQuantity(product, e)}
                              className={`px-1.5 py-1 ${theme.text} hover:bg-gray-50 transition-colors rounded-r-lg`}
                              disabled={product.stock <= 0 || getProductQuantity(product.id) >= product.stock}
                            >
                              <i className="ri-add-line text-base font-bold"></i>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => handleIncreaseQuantity(product, e)}
                            className={`px-3 py-1.5 ${theme.bg50} rounded-lg hover:bg-gray-100 transition-colors`}
                            disabled={product.stock <= 0}
                          >
                            <i className={`ri-add-circle-fill ${theme.text} text-lg`}></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
      {showCart && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)}></div>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">Bills</h2>
                <span className={`w-5 h-5 ${theme.bg} text-white text-[11px] font-bold rounded-full flex items-center justify-center`}>
                  {cartItems.length}
                </span>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                <i className="ri-close-line text-xl text-gray-600"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-gray-900">Product Added</span>
                {cartItems.length > 0 && (
                  <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                    <i className="ri-close-line"></i>
                    Clear all
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50 flex items-center justify-center">
                      {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-gray-600">
                          {getPlaceholderText(item.name)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">{item.name}</h4>
                      <p className="text-xs text-gray-500 mb-2">{item.unit}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center bg-white rounded-full border border-gray-200 shadow-sm overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 active:scale-95 text-gray-700 transition-colors"
                          >
                            <i className="ri-subtract-line text-sm"></i>
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => setQuantityValue(item.id, parseInt(e.target.value || '0', 10))}
                            className="w-12 h-8 text-center text-sm font-semibold border-0 border-x border-gray-200 focus:ring-0 focus:outline-none appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-transparent"
                          />
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center text-white btn-orange-gradient active:scale-95 transition-colors"
                          >
                            <i className="ri-add-line text-sm"></i>
                          </button>
                        </div>
                        <p className="text-sm font-bold text-gray-900">Rp {item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-base font-bold text-gray-900">Rp {total.toLocaleString()}</span>
              </div>

              <button
                className={`w-full py-3 bg-gradient-to-r ${theme.headerGradient} text-white font-semibold rounded-xl transition-all shadow-lg`}
                onClick={() => {
                  setShowCart(false);
                  setShowPayModal(true);
                  setPayMethod('cash');
                  setIsDebt(false);
                  setManualCustomerName('');
                  setManualCustomerPhone('');
                  setPaidAmount(formatCurrencyInput(total));
                }}
              >
                Bayar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Pay Button (< lg) */}
      {cartItems.length > 0 && !showSidebar && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-gradient-to-r from-emerald-900 via-emerald-700 to-emerald-500 text-white font-bold rounded-2xl py-4 px-6 shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 flex items-center justify-between active:scale-95"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <i className="ri-shopping-cart-2-fill text-2xl"></i>
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartItems.length}
                </span>
              </div>
              <div className="text-left">
                <p className="text-xs text-white/80 font-medium">Total</p>
                <p className="text-lg font-bold">Rp {total.toLocaleString()}</p>
              </div>
            </div>
            <span className="text-base font-semibold">Bayar</span>
          </button>
        </div>
      )}

      {showAddModal && selectedProduct && (
        <AddToCartModal
          product={selectedProduct}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddToCart}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && transactionData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              {/* Success indicator */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                  <i className="ri-checkbox-circle-fill text-4xl text-emerald-500"></i>
                </div>
              </div>
              
              {/* Title */}
              <h2 className="text-lg font-bold text-gray-900 text-center mb-1">
                Transaksi Berhasil!
              </h2>
              
              {/* Transaction ID */}
              <p className="text-xs text-gray-600 text-center mb-4">
                ID: {transactionData.id}
              </p>
              
              {/* Transaction Summary */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-5">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Total Tagihan</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(transactionData.total)}
                    </span>
                </div>
                
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Pembayaran</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(transactionData.paid)}
                    </span>
                </div>
                
                  <div className="border-t border-gray-200 pt-2 mt-2"></div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900">Kembalian</span>
                    <span className="text-sm font-bold text-emerald-600">
                      {formatCurrency(transactionData.isDebt ? 0 : transactionData.change)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
              <div className="flex gap-3">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-900 via-emerald-700 to-emerald-500 text-white rounded-xl font-semibold hover:from-emerald-800 hover:via-emerald-600 hover:to-emerald-400 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <i className="ri-printer-line text-lg"></i>
                Cetak Struk
              </button>
              <button
                onClick={handleCloseSuccessModal}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-900 via-emerald-700 to-emerald-500 text-white rounded-xl font-semibold hover:from-emerald-800 hover:via-emerald-600 hover:to-emerald-400 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <i className="ri-check-line text-lg"></i>
                Selesai
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 md:p-4 lg:p-4">
          <div className="bg-white rounded-xl md:rounded-2xl w-full max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
            <div className="p-3 md:p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-base md:text-lg lg:text-xl font-bold text-gray-900">Pembayaran</h3>
                <p className="text-[10px] md:text-xs lg:text-sm text-gray-500">Selesaikan transaksi</p>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer active:scale-95"
              >
                <span className="ri-close-line w-5 h-5 flex items-center justify-center text-gray-600"></span>
              </button>
            </div>

            <div className="p-3 md:p-4 lg:p-6 space-y-3 md:space-y-4 lg:space-y-6">
              <div className="bg-gray-50 rounded-lg md:rounded-xl p-2.5 md:p-3 lg:p-4 flex items-center justify-between">
                <span className="text-[10px] md:text-xs lg:text-sm font-medium text-gray-600">Total Bayar</span>
                <span className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">Rp {total.toLocaleString()}</span>
              </div>

              <div className="flex gap-2 md:gap-2.5 lg:gap-3">
                {(['cash', 'digital', 'qris'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setPayMethod(m);
                      if (m === 'cash') {
                        setPaidAmount('0');
                      } else {
                        setPaidAmount(formatCurrencyInput(total));
                        if (m === 'digital') {
                          setDigitalMethod('OVO');
                        }
                      }
                    }}
                    className={`flex-1 py-2 md:py-2.5 lg:py-3 rounded-lg font-semibold text-[10px] md:text-xs lg:text-sm border transition-all active:scale-95 ${
                      payMethod === m
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {m === 'cash' ? 'Cash' : m === 'digital' ? 'Digital' : 'QRIS'}
                  </button>
                ))}
              </div>

              {payMethod === 'cash' && (
                <div className="space-y-2.5 md:space-y-3 lg:space-y-4">
                  <p className="text-[10px] md:text-xs lg:text-sm font-semibold text-gray-700">Nominal Cepat</p>
                  <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                    {(() => {
                      const allAmounts = [5000, 10000, 20000, 50000, 100000];
                      const quickAmounts = allAmounts.filter((amount) => amount > total);
                      const displayAmounts = quickAmounts.length > 0 ? quickAmounts : allAmounts;
                      
                      return displayAmounts.map((nominal) => {
                        const currentPaid = parseCurrencyInput(paidAmount);
                        const isSelected = currentPaid === nominal;
                        return (
                      <button
                        key={nominal}
                            onClick={() => setPaidAmount(formatCurrencyInput(nominal))}
                            className={`px-1.5 md:px-2 lg:px-4 py-2 md:py-2.5 lg:py-3 rounded-lg text-[10px] md:text-xs lg:text-sm font-semibold active:scale-95 transition-all ${
                              isSelected
                                ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-600'
                                : 'bg-gray-100 hover:bg-gray-200 border-2 border-transparent text-gray-800'
                            }`}
                          >
                            Rp {nominal.toLocaleString('id-ID')}
                      </button>
                        );
                      });
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 md:gap-3 lg:gap-4">
                    <div>
                      <label className="block text-[10px] md:text-xs lg:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Jumlah Dibayar</label>
                      <input
                        type="text"
                        value={paidAmount}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/[^\d]/g, '');
                          if (cleaned === '') {
                            setPaidAmount('0');
                          } else {
                            setPaidAmount(formatCurrencyInput(parseInt(cleaned, 10)));
                          }
                        }}
                        className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-300 rounded-lg text-[10px] md:text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs lg:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Kembalian</label>
                      <div className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-[10px] md:text-xs lg:text-sm font-bold text-gray-900">
                        {formatCurrency(change)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {payMethod === 'digital' && (
                <div className="space-y-2.5 md:space-y-3 lg:space-y-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <p className="text-[10px] md:text-xs lg:text-sm font-semibold text-gray-700">Pilih metode digital</p>
                    <div className="grid grid-cols-2 gap-1.5 md:gap-2 lg:gap-3">
                      {['OVO', 'DANA', 'GoPay', 'LinkAja', 'm-Banking', 'Transfer Bank'].map((method) => (
                        <button
                          key={method}
                          onClick={() => setDigitalMethod(method)}
                          className={`w-full py-2 md:py-2.5 lg:py-3 rounded-lg text-[10px] md:text-xs lg:text-sm font-semibold border transition-all active:scale-95 ${
                            digitalMethod === method
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 md:gap-3 lg:gap-4">
                    <div>
                      <label className="block text-[10px] md:text-xs lg:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Jumlah Dibayar</label>
                      <input
                        type="text"
                        value={paidAmount}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/[^\d]/g, '');
                          if (cleaned === '') {
                            setPaidAmount('0');
                          } else {
                            setPaidAmount(formatCurrencyInput(parseInt(cleaned, 10)));
                          }
                        }}
                        className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-300 rounded-lg text-[10px] md:text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs lg:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Kembalian</label>
                      <div className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-[10px] md:text-xs lg:text-sm font-bold text-gray-900">
                        {formatCurrency(Math.max(0, parseCurrencyInput(paidAmount) - total))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {payMethod === 'qris' && (
                <div className="space-y-2.5 md:space-y-3">
                  <div className="bg-gray-50 rounded-lg p-2.5 md:p-3">
                  <p className="text-[10px] md:text-xs lg:text-sm text-gray-600">Pembayaran non-tunai akan otomatis disamakan dengan total.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 md:gap-3 lg:gap-4">
                    <div>
                      <label className="block text-[10px] md:text-xs lg:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Jumlah Dibayar</label>
                      <input
                        type="text"
                        value={paidAmount}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/[^\d]/g, '');
                          if (cleaned === '') {
                            setPaidAmount('0');
                          } else {
                            setPaidAmount(formatCurrencyInput(parseInt(cleaned, 10)));
                          }
                        }}
                        className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-300 rounded-lg text-[10px] md:text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs lg:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Kembalian</label>
                      <div className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-[10px] md:text-xs lg:text-sm font-bold text-gray-900">
                        {formatCurrency(Math.max(0, parseCurrencyInput(paidAmount) - total))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2.5 md:space-y-3">
                <label className="flex items-center gap-2.5 md:gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isDebt}
                    onChange={(e) => setIsDebt(e.target.checked)}
                    className="w-4 h-4 md:w-5 md:h-5 rounded border-gray-300 text-emerald-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-[10px] md:text-xs lg:text-sm text-gray-800 font-medium">Tandai sebagai piutang</span>
                </label>
              </div>

              <div className="space-y-2.5 md:space-y-3">
                <div>
                    <label className="block text-[10px] md:text-xs lg:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Nama Pelanggan</label>
                    <input
                      type="text"
                      value={manualCustomerName}
                      onChange={(e) => setManualCustomerName(e.target.value)}
                      placeholder="Masukkan nama pelanggan"
                    className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-300 rounded-lg text-[10px] md:text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                <div>
                    <label className="block text-[10px] md:text-xs lg:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Nomor Telepon (opsional)</label>
                    <input
                      type="tel"
                      value={manualCustomerPhone}
                      onChange={(e) => setManualCustomerPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                    className="w-full px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-2.5 border border-gray-300 rounded-lg text-[10px] md:text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
              </div>

              {transactionError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{transactionError}</p>
                </div>
              )}

              <div className="flex gap-2 md:gap-2.5 lg:gap-3 pt-2">
                <button
                  className="flex-1 py-2 md:py-2.5 lg:py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer text-xs md:text-sm lg:text-base active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    setShowPayModal(false);
                    setTransactionError(null);
                  }}
                  disabled={processingTransaction}
                >
                  Batal
                </button>
                <button
                  className="flex-1 py-2 md:py-2.5 lg:py-3 bg-gradient-to-r from-emerald-900 via-emerald-700 to-emerald-500 text-white rounded-lg font-bold hover:from-emerald-800 hover:via-emerald-600 hover:to-emerald-400 transition-all shadow-lg cursor-pointer text-xs md:text-sm lg:text-base active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  onClick={handleProcessPayment}
                  disabled={processingTransaction}
                >
                  {processingTransaction ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Memproses...
                    </>
                  ) : (
                    'Proses Pembayaran'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buka Kasir */}
      {showBukaKasirModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Buka Kasir</h2>
            <p className="text-sm text-gray-600">
              Masukkan kas awal / uang kembalian sebelum mulai menerima pesanan.
            </p>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Kas Awal / Uang Kembalian
              </label>
              <input
                type="number"
                value={saldoAwalInput}
                onChange={(e) => setSaldoAwalInput(e.target.value)}
                placeholder="Contoh: 10000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Catatan (opsional)
              </label>
              <textarea
                value={catatanBuka}
                onChange={(e) => setCatatanBuka(e.target.value)}
                placeholder="Contoh: Shift pagi"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[72px]"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowBukaKasirModal(false)}
                disabled={loadingKasir}
                className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={loadingKasir}
                onClick={async () => {
                  const saldo = Number(saldoAwalInput || '0');
                  if (Number.isNaN(saldo) || saldo < 0) {
                    return;
                  }
                  try {
                    setLoadingKasir(true);
                    await bukaKasirApi({
                      saldoAwal: saldo,
                      catatan: catatanBuka,
                      permanen: false,
                    });
                    setShowBukaKasirModal(false);
                  } catch (e) {
                    console.error('Gagal buka kasir:', e);
                  } finally {
                    setLoadingKasir(false);
                  }
                }}
              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-emerald-900 via-emerald-700 to-emerald-500 text-white text-sm font-semibold hover:from-emerald-800 hover:via-emerald-600 hover:to-emerald-400 disabled:opacity-60 transition-all shadow-lg"
              >
                {loadingKasir ? 'Menyimpan...' : 'Simpan & Buka Kasir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* (Opsional) Modal Ringkasan Tutup Kasir jika hari berganti */}
      {showRingkasanTutup && tutupKasirData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowRingkasanTutup(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
            {/* Header dengan gradient */}
            <div className="bg-gradient-to-br from-emerald-900 via-emerald-700 to-emerald-500 px-6 py-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <i className="ri-bar-chart-box-line text-3xl"></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Ringkasan Penjualan</h2>
                    <p className="text-emerald-50 text-sm">Hari sebelumnya</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 gap-3">
                {/* Total Transaksi */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 border border-emerald-200/50 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                      <i className="ri-receipt-line text-white text-lg"></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-emerald-700">Total Transaksi</p>
                      <p className="text-xl font-bold text-emerald-900">{tutupKasirData.total_transaksi}</p>
                    </div>
                  </div>
                </div>

                {/* Total Pendapatan */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 border border-emerald-200/50 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                      <i className="ri-money-dollar-circle-line text-white text-lg"></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-emerald-700">Total Pendapatan</p>
                      <p className="text-lg font-bold text-emerald-900">Rp {tutupKasirData.total.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detail Breakdown */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <i className="ri-file-list-3-line text-emerald-600"></i>
                  Rincian Transaksi
                </h3>
                
                <div className="space-y-2.5">
                  {tutupKasirData.diskon > 0 && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <i className="ri-price-tag-3-line text-red-500"></i>
                        Diskon
                      </span>
                      <span className="text-sm font-semibold text-red-600">
                        -Rp {tutupKasirData.diskon.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  
                  {tutupKasirData.pajak > 0 && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <i className="ri-file-paper-2-line text-amber-500"></i>
                        Pajak
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        Rp {tutupKasirData.pajak.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  
                  {tutupKasirData.biaya_lainnya > 0 && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <i className="ri-wallet-3-line text-purple-500"></i>
                        Biaya Lainnya
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        Rp {tutupKasirData.biaya_lainnya.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  
                  {tutupKasirData.tunai > 0 && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <i className="ri-money-cny-circle-line text-emerald-500"></i>
                        Tunai
                      </span>
                      <span className="text-sm font-semibold text-emerald-600">
                        Rp {tutupKasirData.tunai.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  
                  {tutupKasirData.nontunai > 0 && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <i className="ri-bank-card-line text-emerald-500"></i>
                        Non-Tunai
                      </span>
                      <span className="text-sm font-semibold text-emerald-600">
                        Rp {tutupKasirData.nontunai.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Grand Total */}
                <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <i className="ri-wallet-line text-emerald-600"></i>
                      Grand Total
                    </span>
                    <span className="text-xl font-bold bg-gradient-to-r from-emerald-900 via-emerald-700 to-emerald-500 bg-clip-text text-transparent">
                      Rp {tutupKasirData.total.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Saldo Kas */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shadow-md">
                      <i className="ri-safe-line text-white text-xl"></i>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-amber-700">Saldo Kas</p>
                      <p className="text-lg font-bold text-amber-900">Rp {tutupKasirData.saldo_kas.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Button */}
            <div className="px-6 py-5 bg-gray-50 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowRingkasanTutup(false)}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-900 via-emerald-700 to-emerald-500 text-white rounded-xl font-semibold hover:from-emerald-800 hover:via-emerald-600 hover:to-emerald-400 active:scale-[0.98] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
              >
                <i className="ri-check-line text-lg"></i>
                Tutup Ringkasan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
