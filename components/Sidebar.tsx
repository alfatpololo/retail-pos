'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { logoutUser } from '@/utils/storage';

interface MenuItem {
  icon: string;
  label: string;
  path: string;
  children?: MenuItem[];
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const sections: MenuSection[] = [
  {
    title: 'POS Kasir',
    items: [{ icon: 'ri-shopping-cart-2-line', label: 'POS', path: '/' }],
  },
  {
    title: 'Manajemen',
    items: [
      {
        icon: 'ri-price-tag-3-line',
        label: 'Kategori Produk',
        path: '/categories',
      },
      {
        icon: 'ri-box-3-line',
        label: 'Produk',
        path: '/products',
      },
      {
        icon: 'ri-exchange-dollar-line',
        label: 'Piutang',
        path: '/debts',
      },
      {
        icon: 'ri-user-line',
        label: 'Pelanggan',
        path: '/customers',
      },
    ],
  },
  {
    title: 'Transaksi',
    items: [
      {
        icon: 'ri-time-line',
        label: 'History Penjualan',
        path: '/transactions?tab=history',
      },
    ],
  },
  {
    title: 'Setting',
    items: [
      {
        icon: 'ri-printer-line',
        label: 'Setting Printer',
        path: '/settings',
      },
    ],
  },
  {
    title: 'Profile',
    items: [
      {
        icon: 'ri-hand-coin-line',
        label: 'Tutup Kasir',
        path: '/close-cashier',
      },
      {
        icon: 'ri-user-3-line',
        label: 'Profile',
            path: '/profile-detail',
      },
    ],
  },
];

interface SidebarProps {
  isOverlay?: boolean;
  theme?: 'blue' | 'green' | 'pink' | 'purple';
}

export default function Sidebar({ isOverlay = false, theme = 'green' }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userLevel, setUserLevel] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const currentUserStr = localStorage.getItem('currentUser');
        if (currentUserStr) {
          const currentUser = JSON.parse(currentUserStr);
          setUserLevel(currentUser.level || '');
        }
      } catch (error) {
        console.error('Error reading user level:', error);
      }
    }
  }, []);

  // Helper function to get theme classes
  const getThemeClasses = (themeName: 'blue' | 'green' | 'pink' | 'purple') => {
    const themes = {
      blue: {
        bgGradient: 'from-blue-600 via-blue-500 to-blue-600',
        border: 'border-blue-400/30',
        activeGradient: 'from-blue-400 to-blue-500',
        activeShadow: 'shadow-blue-400/50',
        text: 'text-blue-100',
        hoverGradient: 'from-blue-500/60 to-blue-600/60',
        activeChild: 'from-blue-500 to-blue-600',
        hoverChild: 'from-blue-500/50 to-blue-600/50',
        textChild: 'text-blue-200',
      },
      green: {
        bgGradient: 'from-emerald-600 via-emerald-500 to-emerald-600',
        border: 'border-emerald-400/30',
        activeGradient: 'from-emerald-400 to-emerald-500',
        activeShadow: 'shadow-emerald-400/50',
        text: 'text-emerald-100',
        hoverGradient: 'from-emerald-500/60 to-emerald-600/60',
        activeChild: 'from-emerald-500 to-emerald-600',
        hoverChild: 'from-emerald-500/50 to-emerald-600/50',
        textChild: 'text-emerald-200',
      },
      pink: {
        bgGradient: 'from-pink-600 via-pink-500 to-pink-600',
        border: 'border-pink-400/30',
        activeGradient: 'from-pink-400 to-pink-500',
        activeShadow: 'shadow-pink-400/50',
        text: 'text-pink-100',
        hoverGradient: 'from-pink-500/60 to-pink-600/60',
        activeChild: 'from-pink-500 to-pink-600',
        hoverChild: 'from-pink-500/50 to-pink-600/50',
        textChild: 'text-pink-200',
      },
      purple: {
        bgGradient: 'from-purple-600 via-purple-500 to-purple-600',
        border: 'border-purple-400/30',
        activeGradient: 'from-purple-400 to-purple-500',
        activeShadow: 'shadow-purple-400/50',
        text: 'text-purple-100',
        hoverGradient: 'from-purple-500/60 to-purple-600/60',
        activeChild: 'from-purple-500 to-purple-600',
        hoverChild: 'from-purple-500/50 to-purple-600/50',
        textChild: 'text-purple-200',
      },
    };
    return themes[themeName];
  };

  const themeClasses = getThemeClasses(theme);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    // handle paths with query params by matching pathname part
    const basePath = path.split('?')[0];
    return pathname === basePath;
  };

  const handleLogout = () => {
    // Hapus semua session/storage terkait user & kasir
    logoutUser();
    // Redirect ke halaman login
    router.push('/login');
  };

  return (
    <aside className={`${isOverlay ? 'w-64' : 'w-64'} bg-white ${isOverlay ? '' : 'border-r border-gray-200'} flex flex-col py-4 md:py-5 lg:py-6 px-4 md:px-4 ${isOverlay ? 'relative h-full' : 'fixed left-0 top-0 bottom-0 z-50'} shadow-2xl`}>
      {/* Logo */}
      <div className="mb-4 md:mb-5 lg:mb-6">
        <div className={`flex items-center gap-3 w-full px-4 py-4 rounded-xl bg-gradient-to-br ${themeClasses.activeGradient} shadow-lg ${themeClasses.activeShadow} justify-center relative`}>
          <span className="text-white font-bold text-xl">Your Kasir</span>
          {/* Badge PRO */}
          {userLevel && userLevel.toLowerCase().includes('pro') && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
              PRO
            </div>
          )}
        </div>
      </div>
      
      <nav className="flex-1 space-y-6 md:space-y-6 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.title} className="space-y-2">
            <div className="px-4 mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{section.title}</h3>
            </div>
            {section.items.map((item) => (
              <div key={item.path}>
                <Link
                  href={item.path}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all cursor-pointer group ${
                    isActive(item.path)
                      ? `bg-gradient-to-br ${themeClasses.activeGradient} text-white shadow-lg ${themeClasses.activeShadow}`
                      : `text-gray-700 ${
                          theme === 'blue' ? 'hover:bg-blue-50 hover:text-blue-600' :
                          theme === 'green' ? 'hover:bg-emerald-50 hover:text-emerald-600' :
                          theme === 'pink' ? 'hover:bg-pink-50 hover:text-pink-600' :
                          'hover:bg-purple-50 hover:text-purple-600'
                        }`
                  }`}
                >
                  <span className={`${item.icon} text-xl flex-shrink-0`}></span>
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                </Link>
                {item.children && (
                  <div className="mt-1 space-y-1 pl-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        href={child.path}
                        className={`flex items-center gap-3 w-full px-4 py-2.5 pl-8 rounded-lg transition-all cursor-pointer group ${
                          isActive(child.path)
                            ? `bg-gradient-to-br ${themeClasses.activeChild} text-white`
                            : `text-gray-600 ${
                                theme === 'blue' ? 'hover:bg-blue-50 hover:text-blue-600' :
                                theme === 'green' ? 'hover:bg-emerald-50 hover:text-emerald-600' :
                                theme === 'pink' ? 'hover:bg-pink-50 hover:text-pink-600' :
                                'hover:bg-purple-50 hover:text-purple-600'
                              }`
                        }`}
                      >
                        <span className={`${child.icon} text-lg flex-shrink-0`}></span>
                        <span className="text-xs font-medium whitespace-nowrap">{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="pt-3 md:pt-4 border-t border-gray-200 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
        >
          <span className="ri-logout-box-line text-xl flex-shrink-0"></span>
          <span className="text-sm font-medium whitespace-nowrap">Logout</span>
        </button>
      </div>
    </aside>
  );
}
