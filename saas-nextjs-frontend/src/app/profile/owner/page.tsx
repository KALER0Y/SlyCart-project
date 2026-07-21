'use client';

import React, { useState } from 'react';
import { Store, BarChart3, User, Plus, LogOut, Check } from 'lucide-react';

interface Shop {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

type TabType = 'shops' | 'analytics' | 'profile';

const INITIAL_SHOPS: Shop[] = [
  {
    id: '1',
    name: 'Concept Store No. 5',
    description: 'High-end minimalist apparel and selected interior design objects.',
    is_active: true,
  },
  {
    id: '2',
    name: 'NORDIC Lab',
    description: 'Functional utilitarian outerwear built for northern winters.',
    is_active: false,
  },
  {
    id: '3',
    name: 'ECHO Coffee Roasters',
    description: 'Specialty coffee roastery focus on single-origin micro lots.',
    is_active: false,
  },
];

export default function ShopsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [shops, setShops] = useState<Shop[]>(INITIAL_SHOPS);

  const handleSelectShop = (shopId: string) => {
    setShops((prevShops) =>
      prevShops.map((shop) => ({
        ...shop,
        is_active: shop.id === shopId,
      }))
    );
  };

  const handleDeselectShop = (shopId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShops((prevShops) =>
      prevShops.map((shop) => ({
        ...shop,
        is_active: false,
      }))
    );
  };

  const handleCreateShop = () => {
    const nextId = (shops.length + 1).toString();
    const newShop: Shop = {
      id: nextId,
      name: `Atelier Studio ${nextId}`,
      description: 'Independent designer collaborative collection, curated annually.',
      is_active: false,
    };
    setShops((prevShops) => [...prevShops, newShop]);
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-black text-neutral-100 font-sans overflow-hidden select-none">
      
      {/* 1. Sticky Header */}
      <header className="h-14 shrink-0 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md px-5 flex items-center justify-between z-10">
        <h1 className="text-xs font-semibold tracking-wider uppercase text-neutral-200">
          {activeTab === 'shops' && 'Магазины'}
          {activeTab === 'analytics' && 'Аналитика'}
          {activeTab === 'profile' && 'Профиль'}
        </h1>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-medium">TWA Node</span>
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-100" />
        </div>
      </header>

      {/* 2. Independent Scrolling Viewport */}
      <main className="flex-1 overflow-y-auto [-webkit-overflow-scrolling:touch] bg-black">
        
        {/* TAB 1: SHOPS */}
        {activeTab === 'shops' && (
          <div className="p-4 space-y-4 pb-12">
            <div className="text-xs tracking-wider text-neutral-500 uppercase font-medium px-1">
              Список магазинов ({shops.length})
            </div>

            <div className="space-y-3">
              {shops.map((shop) => {
                const isActive = shop.is_active;

                return (
                  <div
                    key={shop.id}
                    onClick={() => !isActive && handleSelectShop(shop.id)}
                    className={`group relative rounded-xl p-5 border transition-all duration-300 ${
                      isActive
                        ? 'bg-white border-white text-neutral-950 shadow-lg shadow-black/40'
                        : 'bg-neutral-900/40 border-neutral-800 text-neutral-200 hover:border-neutral-700 active:bg-neutral-900/80 cursor-pointer'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm tracking-tight">{shop.name}</h3>
                          {isActive && (
                            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-neutral-950 text-white">
                              <Check size={10} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <p className={`text-xs leading-relaxed ${isActive ? 'text-neutral-600' : 'text-neutral-400'}`}>
                          {shop.description}
                        </p>
                      </div>

                      {/* Exit Button inside Active Card */}
                      {isActive && (
                        <button
                          onClick={(e) => handleDeselectShop(shop.id, e)}
                          className="shrink-0 p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-950 transition-all duration-150 flex items-center justify-center"
                          aria-label="Выйти"
                        >
                          <LogOut size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="p-8 flex flex-col items-center justify-center min-h-[50dvh] text-center space-y-3">
            <BarChart3 size={24} className="text-neutral-600 stroke-[1.5]" />
            <div>
              <h3 className="text-sm font-medium text-neutral-200">Раздел аналитики</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-[240px] leading-relaxed">
                Интеграция систем аналитики и графиков производительности торговых точек.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: PROFILE */}
        {activeTab === 'profile' && (
          <div className="p-8 flex flex-col items-center justify-center min-h-[60dvh] text-center space-y-6">
            <div className="w-16 h-16 rounded-full border border-neutral-800 bg-neutral-900/60 flex items-center justify-center text-neutral-200 font-semibold tracking-wider text-sm shadow-inner">
              M_01
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-neutral-100">Администратор системы</h3>
              <p className="text-xs text-neutral-500">Права доступа: Владелец</p>
            </div>
            <button
              onClick={() => setActiveTab('shops')}
              className="px-6 py-2.5 border border-neutral-700 text-neutral-200 text-xs tracking-wider uppercase font-medium rounded-lg hover:bg-neutral-100 hover:text-neutral-950 active:scale-95 transition-all"
            >
              Управление магазинами
            </button>
          </div>
        )}
      </main>

      {/* 3. Sticky Action Area */}
      {activeTab === 'shops' && (
        <div className="px-4 py-3 bg-neutral-950/80 backdrop-blur-md border-t border-neutral-900 shrink-0">
          <button
            onClick={handleCreateShop}
            className="w-full h-11 bg-white hover:bg-neutral-200 text-neutral-950 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Plus size={14} strokeWidth={2.5} />
            Создать новый магазин
          </button>
        </div>
      )}

      {/* 4. Bottom Tab Navigation */}
      <nav className="shrink-0 border-t border-neutral-900 bg-neutral-950/90 backdrop-blur-md pb-6 pt-3 px-6 flex justify-around items-center z-10">
        
        {/* Shops Tab */}
        <button
          onClick={() => setActiveTab('shops')}
          className={`flex flex-col items-center gap-1 transition-all duration-200 active:scale-95 ${
            activeTab === 'shops' ? 'text-white scale-105' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Store size={18} strokeWidth={activeTab === 'shops' ? 2.5 : 2} />
          <span className="text-[9px] font-medium tracking-wider">Магазины</span>
        </button>

        {/* Analytics Tab */}
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 transition-all duration-200 active:scale-95 ${
            activeTab === 'analytics' ? 'text-white scale-105' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <BarChart3 size={18} strokeWidth={activeTab === 'analytics' ? 2.5 : 2} />
          <span className="text-[9px] font-medium tracking-wider">Аналитика</span>
        </button>

        {/* Profile Tab */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition-all duration-200 active:scale-95 ${
            activeTab === 'profile' ? 'text-white scale-105' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <User size={18} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
          <span className="text-[9px] font-medium tracking-wider">Кабинет</span>
        </button>
      </nav>
      
    </div>
  );
}