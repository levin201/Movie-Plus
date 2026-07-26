/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { Blend, Cat, Clover, Container, Film, Globe, Home, Menu, Search, Star, Tv, TvMinimalPlay, Users, Bell, Heart, Settings, Shield, Monitor, LogOut, LogIn } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';

import { getAuthInfoFromBrowserCookie } from '@/lib/auth';

import { useSite } from './SiteProvider';
import { useWatchRoomContextSafe } from './WatchRoomProvider';
import { UserMenu } from './UserMenu';

interface SidebarContextType {
  isCollapsed: boolean;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
});

export const useSidebar = () => useContext(SidebarContext);

// 可替换为你自己的 logo 图片
const Logo = () => {
  const { siteName } = useSite();
  return (
    <Link
      href='/'
      className='flex items-center justify-center h-16 select-none hover:opacity-80 transition-opacity duration-200'
    >
      <span className='text-2xl font-bold text-green-600 tracking-tight'>
        {siteName}
      </span>
    </Link>
  );
};

interface SidebarProps {
  onToggle?: (collapsed: boolean) => void;
  activePath?: string;
}

// 在浏览器环境下通过全局变量缓存折叠状态，避免组件重新挂载时出现初始值闪烁
declare global {
  interface Window {
    __sidebarCollapsed?: boolean;
    RUNTIME_CONFIG?: {
      EnableComments?: boolean;
      RecommendationDataSource?: string;
      [key: string]: any;
    };
  }
}

const Sidebar = ({ onToggle, activePath = '/' }: SidebarProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const watchRoomContext = useWatchRoomContextSafe();

  if (pathname === '/watch-room/screen') {
    return null;
  }
  // 若同一次 SPA 会话中已经读取过折叠状态，则直接复用，避免闪烁
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (
      typeof window !== 'undefined' &&
      typeof window.__sidebarCollapsed === 'boolean'
    ) {
      return window.__sidebarCollapsed;
    }
    return false; // 默认展开
  });

  const [loggedIn, setLoggedIn] = useState(false);

  // 监听登录状态变化
  useEffect(() => {
    const check = () => setLoggedIn(!!getAuthInfoFromBrowserCookie()?.username);
    check();
    const id = setInterval(check, 1000);
    window.addEventListener('focus', check);
    return () => { clearInterval(id); window.removeEventListener('focus', check); };
  }, []);
  useLayoutEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
      const val = JSON.parse(saved);
      setIsCollapsed(val);
      window.__sidebarCollapsed = val;
    }
  }, []);

  // 当折叠状态变化时，同步到 <html> data 属性，供首屏 CSS 使用
  useLayoutEffect(() => {
    if (typeof document !== 'undefined') {
      if (isCollapsed) {
        document.documentElement.dataset.sidebarCollapsed = 'true';
      } else {
        delete document.documentElement.dataset.sidebarCollapsed;
      }
    }
  }, [isCollapsed]);

  const [active, setActive] = useState(activePath);

  useEffect(() => {
    // 立即根据当前路径更新状态，不等待页面加载
    const getCurrentFullPath = () => {
      const queryString = searchParams.toString();
      return queryString ? `${pathname}?${queryString}` : pathname;
    };
    const fullPath = getCurrentFullPath();
    setActive(fullPath);
  }, [pathname, searchParams]);

  const handleToggle = useCallback(() => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
    if (typeof window !== 'undefined') {
      window.__sidebarCollapsed = newState;
    }
    onToggle?.(newState);
  }, [isCollapsed, onToggle]);

  const contextValue = {
    isCollapsed,
  };

  const [menuItems, setMenuItems] = useState([
    {
      icon: Film,
      label: '电影',
      href: '/douban?type=movie',
    },
    {
      icon: Tv,
      label: '剧集',
      href: '/douban?type=tv',
    },
    {
      icon: Cat,
      label: '动漫',
      href: '/douban?type=anime',
    },
    {
      icon: Clover,
      label: '综艺',
      href: '/douban?type=show',
    },
    {
      icon: TvMinimalPlay,
      label: '电视直播',
      href: '/live',
    },
  ]);

  useEffect(() => {
    const runtimeConfig = (window as any).RUNTIME_CONFIG;

    // 基础菜单项（不包括观影室）
    const items = [
      {
        icon: Film,
        label: '电影',
        href: '/douban?type=movie',
      },
      {
        icon: Tv,
        label: '剧集',
        href: '/douban?type=tv',
      },
      {
        icon: Cat,
        label: '动漫',
        href: '/douban?type=anime',
      },
      {
        icon: Clover,
        label: '综艺',
        href: '/douban?type=show',
      },
      ...(runtimeConfig?.LIVE_ENABLED
        ? [
            {
              icon: TvMinimalPlay,
              label: '电视直播',
              href: '/live',
            },
          ]
        : []),
    ];

    // 如果启用网络直播，添加网络直播入口
    if (runtimeConfig?.WEB_LIVE_ENABLED) {
      items.push({
        icon: Globe,
        label: '网络直播',
        href: '/web-live',
      });
    }

    // 如果配置了 OpenList 或 Emby，添加私人影库入口
    if (runtimeConfig?.PRIVATE_LIBRARY_ENABLED) {
      items.push({
        icon: Container,
        label: '私人影库',
        href: '/private-library',
      });
    }

    if (runtimeConfig?.ADVANCED_RECOMMENDATION_ENABLED) {
      items.push({
        icon: Blend,
        label: '高级推荐',
        href: '/advanced-recommendation',
      });
    }

    // 如果启用观影室，添加观影室入口
    if (watchRoomContext?.isEnabled) {
      items.push({
        icon: Users,
        label: '观影室',
        href: '/watch-room',
      });
    }

    // 添加自定义分类（如果有）
    if (runtimeConfig?.CUSTOM_CATEGORIES?.length > 0) {
      items.push({
        icon: Star,
        label: '自定义',
        href: '/douban?type=custom',
      });
    }

    // 用户功能入口 - 根据登录状态变化（每次渲染检查cookie）
    const auth = getAuthInfoFromBrowserCookie();
    if (auth?.username) {
      items.push(
        { icon: Bell, label: '通知中心', href: '#notifications' },
        { icon: Heart, label: '我的收藏', href: '#favorites' },
        { icon: Settings, label: '个人中心', href: '#settings' },
        { icon: Monitor, label: '电视访问', href: '/tv' },
        { icon: Shield, label: '管理面板', href: '/admin' },
        { icon: Globe, label: '平台应用', href: '#eco' },
      );
    } else {
      items.push(
        { icon: LogIn, label: '登入', href: '/login' },
      );
    }

    setMenuItems(items);
  }, [watchRoomContext?.isEnabled, loggedIn]);

  // Handle hash-link clicks for UserMenu panels
  useEffect(() => {
    const handleHashClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href^="#"]');
      if (!link) return;
      const hash = link.getAttribute('href');
      const win = window as any;
      if (hash === '#notifications') { e.preventDefault(); win.__openNotifications?.(); }
      if (hash === '#favorites') { e.preventDefault(); win.__openFavorites?.(); }
      if (hash === '#settings') { e.preventDefault(); win.__openSettings?.(); }
      if (hash === '#eco') { e.preventDefault(); win.__openEcoApps?.(); }
    };
    document.addEventListener('click', handleHashClick);
    return () => document.removeEventListener('click', handleHashClick);
  }, []);

  return (
    <SidebarContext.Provider value={contextValue}>
      {/* 在移动端隐藏侧边栏 */}
      <div className='hidden md:flex'>
        <aside
          data-sidebar
          className={`fixed top-0 left-0 h-screen bg-white/95 backdrop-blur-xl transition-all duration-300 border-r border-gray-200 z-10 shadow-xl dark:bg-black/90 dark:border-white/10 ${isCollapsed ? 'w-16' : 'w-64'
            }`}
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div className='flex h-full flex-col'>
            {/* 顶部 Logo 区域 */}
            <div className='relative h-16'>
              <div
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'
                  }`}
              >
                <div className='w-[calc(100%-4rem)] flex justify-center'>
                  {!isCollapsed && <Logo />}
                </div>
              </div>
              <button
                onClick={handleToggle}
                className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 transition-colors duration-200 z-10 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/50 ${isCollapsed ? 'left-1/2 -translate-x-1/2' : 'right-2'
                  }`}
              >
                <Menu className='h-4 w-4' />
              </button>
            </div>

            {/* 首页和搜索导航 */}
            <nav className='px-2 mt-4 space-y-1'>
              <Link
                href='/'
                prefetch={false}
                onClick={(e) => {
                  // 确保点击事件立即生效，不被其他状态更新阻塞
                  e.currentTarget.blur();
                }}
                data-active={active === '/'}
                className={`group flex items-center rounded-lg px-2 py-2 pl-4 text-gray-700 hover:bg-gray-100 hover:text-black data-[active=true]:bg-gray-100 data-[active=true]:text-black font-medium transition-colors duration-200 min-h-[40px] dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white dark:data-[active=true]:bg-white/10 dark:data-[active=true]:text-white ${isCollapsed ? 'w-full max-w-none mx-0' : 'mx-0'
                  } gap-3 justify-start`}
              >
                <div className='w-4 h-4 flex items-center justify-center'>
                  <Home className='h-4 w-4 text-gray-400 group-hover:text-black data-[active=true]:text-black dark:text-gray-500 dark:group-hover:text-white dark:data-[active=true]:text-white' />
                </div>
                {!isCollapsed && (
                  <span className='whitespace-nowrap transition-opacity duration-200 opacity-100'>
                    首页
                  </span>
                )}
              </Link>
            </nav>

            {/* 菜单项 */}
            <div className='flex-1 overflow-y-auto px-2 pt-4'>
              <div className='space-y-3'>
                {menuItems.map((item) => {
                  // 检查当前路径是否匹配这个菜单项
                  const typeMatch = item.href.match(/type=([^&]+)/)?.[1];

                  // 解码URL以进行正确的比较
                  const decodedActive = decodeURIComponent(active);
                  const decodedItemHref = decodeURIComponent(item.href);

                  // 提取路径名（不包含查询参数）
                  const activePathname = decodedActive.split('?')[0];
                  const itemPathname = decodedItemHref.split('?')[0];

                  const isActive =
                    decodedActive === decodedItemHref ||
                    (decodedActive.startsWith('/douban') &&
                      decodedActive.includes(`type=${typeMatch}`)) ||
                    // 对于没有type参数的路径，只比较路径名
                    (!typeMatch && activePathname === itemPathname);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      data-active={isActive}
                      onClick={(e) => {
                        if (item.href.startsWith('#')) {
                          e.preventDefault();
                          const win = window as any;
                          if (item.href === '#notifications') win.__openNotifications?.();
                          if (item.href === '#favorites') win.__openFavorites?.();
                          if (item.href === '#settings') win.__openSettings?.();
                          if (item.href === '#eco') win.__openEcoApps?.();
                        }
                        if (item.href === '/api/logout') {
                          e.preventDefault();
                          fetch('/api/logout', { method: 'POST' }).then(() => {
                            window.location.href = '/';
                          });
                        }
                      }}
                      className={`group flex items-center rounded-lg px-2 py-2.5 pl-4 text-[15px] text-gray-700 hover:bg-gray-100 hover:text-black data-[active=true]:bg-gray-100 data-[active=true]:text-black transition-colors duration-200 min-h-[44px] dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white dark:data-[active=true]:bg-white/10 dark:data-[active=true]:text-white ${isCollapsed ? 'w-full max-w-none mx-0' : 'mx-0'
                        } gap-3.5 justify-start`}
                    >
                      <div className='w-5 h-5 flex items-center justify-center'>
                        <Icon className='h-5 w-5 text-gray-400 group-hover:text-black data-[active=true]:text-black dark:text-gray-500 dark:group-hover:text-white dark:data-[active=true]:text-white' />
                      </div>
                      {!isCollapsed && (
                        <span className='whitespace-nowrap transition-opacity duration-200 opacity-100 tracking-wider'>
                          {item.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
            {/* 底部退出登入 */}
            {loggedIn && (
              <div className='mt-auto border-t border-gray-200 dark:border-gray-700 px-2 pb-4'>
                <Link
                  href='/api/logout'
                  onClick={(e) => {
                    e.preventDefault();
                    fetch('/api/logout', { method: 'POST' }).then(() => {
                      window.location.href = '/';
                    });
                  }}
                  className={`group flex items-center rounded-lg px-2 py-2.5 pl-4 text-[15px] text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors duration-200 min-h-[44px] dark:text-gray-500 dark:hover:bg-white/5 dark:hover:text-red-400 ${isCollapsed ? 'w-full max-w-none mx-0 justify-center' : 'mx-0 justify-start'
                    } gap-3.5`}
                >
                  <LogOut className='h-5 w-5' />
                  {!isCollapsed && (
                    <span className='whitespace-nowrap tracking-wider'>退出</span>
                  )}
                </Link>
              </div>
            )}
            {/* 隐藏的UserMenu - 提供面板功能 */}
            <div className='border-t border-gray-200 dark:border-gray-700 pt-3 pb-3 hidden'>
              <div className='flex justify-center'>
                <UserMenu />
              </div>
            </div>
          </div>
        </aside>
        <div
          className={`transition-all duration-300 sidebar-offset ${isCollapsed ? 'w-16' : 'w-64'
            }`}
        ></div>
      </div>
    </SidebarContext.Provider>
  );
};

export default Sidebar;
