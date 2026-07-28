/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { Blend, Cat, Clover, Container, Film, Globe, Home, LayoutGrid, Link as LinkIcon, ListVideo, LogOut, Menu, Monitor, Shield, Star, Tv, TvMinimalPlay, User, Users } from 'lucide-react';
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

import { useSite } from './SiteProvider';
import { useWatchRoomContextSafe } from './WatchRoomProvider';
import { getAuthInfoFromBrowserCookie } from '@/lib/auth';

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

  // 首次挂载时读取 localStorage，以便刷新后仍保持上次的折叠状态
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

  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [userColor, setUserColor] = useState('');

  useEffect(() => {
    const auth = getAuthInfoFromBrowserCookie();
    if (auth) {
      setIsLoggedIn(true);
      setUsername(auth.username || '');
      if (auth.role === 'owner' || auth.role === 'admin') {
        setIsAdmin(true);
      }
      // Generate random color based on username for consistency
      const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
      const index = (auth.username || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
      setUserColor(colors[index]);
    }
  }, []);

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

    setMenuItems(items);
  }, [watchRoomContext?.isEnabled]);

  return (
    <SidebarContext.Provider value={contextValue}>
      {/* 在移动端隐藏侧边栏 */}
      <div className='hidden md:flex'>
        <aside
          data-sidebar
          className={`fixed top-0 left-0 h-screen bg-white/75 backdrop-blur-2xl transition-all duration-300 border-r border-white/40 z-10 shadow-xl dark:bg-gray-950/85 dark:border-white/10 ${isCollapsed ? 'w-16' : 'w-64'
            }`}
          style={{
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
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

            {/* 首页导航 */}
            <nav className='px-2 mt-4 space-y-1'>
              <Link
                href='/'
                prefetch={false}
                onClick={(e) => {
                  e.currentTarget.blur();
                }}
                data-active={active === '/'}
                className={`group flex items-center rounded-lg px-2 py-2 pl-4 text-gray-700 hover:bg-gray-100/30 hover:text-gray-800 dark:hover:text-gray-100 data-[active=true]:bg-gray-200/70 dark:data-[active=true]:bg-gray-700/50 data-[active=true]:text-gray-800 dark:data-[active=true]:text-gray-100 font-medium transition-colors duration-200 min-h-[40px] dark:text-gray-300 dark:hover:text-gray-100 dark:data-[active=true]:bg-gray-700/50 dark:data-[active=true]:text-gray-100 ${isCollapsed ? 'w-full max-w-none mx-0' : 'mx-0'
                  } gap-3 justify-start`}
              >
                <div className='w-4 h-4 flex items-center justify-center'>
                  <Home className='h-4 w-4 text-gray-500 group-hover:text-gray-800 dark:hover:text-gray-100 data-[active=true]:text-gray-800 dark:data-[active=true]:text-gray-100 dark:text-gray-400 dark:group-hover:text-gray-200 dark:data-[active=true]:text-gray-100' />
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
              <div className='space-y-1'>
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
                      className={`group flex items-center rounded-lg px-2 py-2 pl-4 text-sm text-gray-700 hover:bg-gray-100/30 hover:text-gray-800 dark:hover:text-gray-100 data-[active=true]:bg-gray-200/70 dark:data-[active=true]:bg-gray-700/50 data-[active=true]:text-gray-800 dark:data-[active=true]:text-gray-100 transition-colors duration-200 min-h-[40px] dark:text-gray-300 dark:hover:text-gray-100 dark:data-[active=true]:bg-gray-700/50 dark:data-[active=true]:text-gray-100 ${isCollapsed ? 'w-full max-w-none mx-0' : 'mx-0'
                        } gap-3 justify-start`}
                    >
                      <div className='w-4 h-4 flex items-center justify-center'>
                        <Icon className='h-4 w-4 text-gray-500 group-hover:text-gray-800 dark:hover:text-gray-100 data-[active=true]:text-gray-800 dark:data-[active=true]:text-gray-100 dark:text-gray-400 dark:group-hover:text-gray-200 dark:data-[active=true]:text-gray-100' />
                      </div>
                      {!isCollapsed && (
                        <span className='whitespace-nowrap transition-opacity duration-200 opacity-100'>
                          {item.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 用户菜单项 */}
            {isLoggedIn ? (
            <div className='px-2 pb-3 pt-2 border-t border-gray-200/50 dark:border-gray-700/50'>
              <div className='space-y-1'>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('openUserPanel', { detail: 'direct-play' }))}
                  className={`group flex items-center rounded-lg px-2 py-2 pl-4 text-sm text-gray-700 hover:bg-gray-100/30 hover:text-gray-800 dark:hover:text-gray-100 transition-colors duration-200 min-h-[40px] dark:text-gray-300 dark:hover:text-gray-100 ${isCollapsed ? 'w-full max-w-none mx-0' : 'mx-0'
                    } gap-3 justify-start`}
                >
                  <div className='w-4 h-4 flex items-center justify-center'>
                    <LinkIcon className='h-4 w-4 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200' />
                  </div>
                  {!isCollapsed && (
                    <span className='whitespace-nowrap transition-opacity duration-200 opacity-100'>
                      直链播放
                    </span>
                  )}
                </button>
                <Link
                  href='/source-search'
                  className={`group flex items-center rounded-lg px-2 py-2 pl-4 text-sm text-gray-700 hover:bg-gray-100/30 hover:text-gray-800 dark:hover:text-gray-100 transition-colors duration-200 min-h-[40px] dark:text-gray-300 dark:hover:text-gray-100 ${isCollapsed ? 'w-full max-w-none mx-0' : 'mx-0'
                    } gap-3 justify-start`}
                >
                  <div className='w-4 h-4 flex items-center justify-center'>
                    <ListVideo className='h-4 w-4 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200' />
                  </div>
                  {!isCollapsed && (
                    <span className='whitespace-nowrap transition-opacity duration-200 opacity-100'>
                      源站寻片
                    </span>
                  )}
                </Link>
                {isAdmin && (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('openUserPanel', { detail: 'tv-access' }))}
                  className={`group flex items-center rounded-lg px-2 py-2 pl-4 text-sm text-gray-700 hover:bg-gray-100/30 hover:text-gray-800 dark:hover:text-gray-100 transition-colors duration-200 min-h-[40px] dark:text-gray-300 dark:hover:text-gray-100 ${isCollapsed ? 'w-full max-w-none mx-0' : 'mx-0'
                    } gap-3 justify-start`}
                >
                  <div className='w-4 h-4 flex items-center justify-center'>
                    <Monitor className='h-4 w-4 text-gray-500 group-hover:text-gray-800 dark:hover:text-gray-100 dark:text-gray-400 dark:group-hover:text-gray-200' />
                  </div>
                  {!isCollapsed && (
                    <span className='whitespace-nowrap transition-opacity duration-200 opacity-100'>
                      电视访问
                    </span>
                  )}
                </button>
                )}
                {isAdmin && (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('openUserPanel', { detail: 'admin' }))}
                  className={`group flex items-center rounded-lg px-2 py-2 pl-4 text-sm text-gray-700 hover:bg-gray-100/30 hover:text-gray-800 dark:hover:text-gray-100 transition-colors duration-200 min-h-[40px] dark:text-gray-300 dark:hover:text-gray-100 ${isCollapsed ? 'w-full max-w-none mx-0' : 'mx-0'
                    } gap-3 justify-start`}
                >
                  <div className='w-4 h-4 flex items-center justify-center'>
                    <Shield className='h-4 w-4 text-gray-500 group-hover:text-gray-800 dark:hover:text-gray-100 dark:text-gray-400 dark:group-hover:text-gray-200' />
                  </div>
                  {!isCollapsed && (
                    <span className='whitespace-nowrap transition-opacity duration-200 opacity-100'>
                      管理面板
                    </span>
                  )}
                </button>
                )}
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('openUserPanel', { detail: 'eco-apps' }))}
                  className={`group flex items-center rounded-lg px-2 py-2 pl-4 text-sm text-gray-700 hover:bg-gray-100/30 hover:text-gray-800 dark:hover:text-gray-100 transition-colors duration-200 min-h-[40px] dark:text-gray-300 dark:hover:text-gray-100 ${isCollapsed ? 'w-full max-w-none mx-0' : 'mx-0'
                    } gap-3 justify-start`}
                >
                  <div className='w-4 h-4 flex items-center justify-center'>
                    <LayoutGrid className='h-4 w-4 text-gray-500 group-hover:text-gray-800 dark:hover:text-gray-100 dark:text-gray-400 dark:group-hover:text-gray-200' />
                  </div>
                  {!isCollapsed && (
                    <span className='whitespace-nowrap transition-opacity duration-200 opacity-100'>
                      平台应用
                    </span>
                  )}
                </button>

                <div className='my-1 border-t border-gray-200/50 dark:border-gray-700/50'></div>

                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-2 pt-1`}>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('openUserPanel', { detail: 'profile' }))}
                    className='flex items-center gap-2 hover:opacity-70 transition-opacity'
                  >
                    {!isCollapsed && (
                      <span className='text-sm font-medium truncate max-w-[120px]' style={{ color: userColor }} title={username}>
                        <User className='h-4 w-4 inline mr-1' />
                        {username}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('openUserPanel', { detail: 'logout' }))}
                    className='flex items-center justify-center p-1.5 rounded-lg text-red-500 hover:bg-red-50/70 dark:hover:bg-red-900/20 transition-colors'
                    title='退出'
                  >
                    <LogOut className='h-4 w-4' />
                  </button>
                </div>
              </div>
            </div>
            ) : (
            <div className='px-2 pb-3 pt-2 border-t border-gray-200/50 dark:border-gray-700/50'>
              <Link
                href='/login'
                className={`group flex items-center rounded-lg px-2 py-2 pl-4 text-sm text-gray-700 hover:bg-gray-100/30 hover:text-gray-800 dark:hover:text-gray-100 transition-colors duration-200 min-h-[40px] dark:text-gray-300 dark:hover:text-gray-100 ${isCollapsed ? 'w-full max-w-none mx-0' : 'mx-0'
                  } gap-3 justify-start`}
              >
                <div className='w-4 h-4 flex items-center justify-center'>
                  <User className='h-4 w-4 text-gray-500 group-hover:text-gray-800 dark:hover:text-gray-100 dark:text-gray-400 dark:group-hover:text-gray-200' />
                </div>
                {!isCollapsed && (
                  <span className='whitespace-nowrap transition-opacity duration-200 opacity-100'>
                    登录
                  </span>
                )}
              </Link>
            </div>
            )}
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
