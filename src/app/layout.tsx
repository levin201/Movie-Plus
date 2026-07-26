/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';

import './globals.css';

import { parseAuthInfo } from '@/lib/auth';
import { getConfig } from '@/lib/config';
import { getUserFeatureAccess } from '@/lib/permissions';

import { StartupCacheCleanup } from '../components/DanmakuCacheCleanup';
import { GlobalErrorIndicator } from '../components/GlobalErrorIndicator';
import RouteScrollReset from '../components/RouteScrollReset';
import { SiteProvider } from '../components/SiteProvider';
import { ThemeProvider } from '../components/ThemeProvider';
import { TokenRefreshManager } from '../components/TokenRefreshManager';
import TopProgressBar from '../components/TopProgressBar';
import { DownloadProvider } from '../contexts/DownloadContext';

const inter = Inter({ subsets: ['latin'] });
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage';
  const config = await getConfig();
  let siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Movie';
  if (storageType !== 'localstorage') {
    siteName = config.SiteConfig.SiteName;
  }

  return {
    title: siteName,
    description: '影视聚合',
    manifest: '/manifest.json',
    icons: {
      icon: '/logo.svg',
      shortcut: '/favicon.svg',
      apple: '/logo.svg',
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: siteName,
    },
  };
}

export const viewport: Viewport = {
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage';

  let siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Movie';
  let announcement =
    process.env.ANNOUNCEMENT ||
    '本网站仅提供影视信息搜索服务，所有内容均来自第三方网站。本站不存储任何视频资源，不对任何内容的准确性、合法性、完整性负责。';
  let announcementDisplayMode: 'once' | 'every' =
    process.env.ANNOUNCEMENT_DISPLAY_MODE === 'every' ? 'every' : 'once';

  let doubanProxyType =
    process.env.NEXT_PUBLIC_DOUBAN_PROXY_TYPE || 'cmliussss-cdn-tencent';
  let doubanProxy = process.env.NEXT_PUBLIC_DOUBAN_PROXY || '';
  let doubanImageProxyType =
    process.env.NEXT_PUBLIC_DOUBAN_IMAGE_PROXY_TYPE || 'cmliussss-cdn-tencent';
  let doubanImageProxy = process.env.NEXT_PUBLIC_DOUBAN_IMAGE_PROXY || '';
  let disableYellowFilter =
    process.env.NEXT_PUBLIC_DISABLE_YELLOW_FILTER === 'true';
  let fluidSearch = process.env.NEXT_PUBLIC_FLUID_SEARCH !== 'false';
  let enableComments = false;
  let danmakuAutoLoadDefault = true;
  let tmdbApiKey = '';
  let loginBackgroundImage = '';
  let registerBackgroundImage = '';
  let homeBackgroundImage = '';
  let progressThumbType = 'default';
  let progressThumbPresetId = '';
  let progressThumbCustomUrl = '';
  let enableRegistration = true;
  let requireRegistrationInviteCode = false;
  let loginRequireTurnstile = false;
  let registrationRequireTurnstile = false;
  let turnstileSiteKey = '';
  let enableOIDCLogin = false;
  let enableOIDCRegistration = false;
  let oidcButtonText = '';
  let telegramLoginEnabled = false;
  let telegramBotUsername = '';
  let enableMovieRequest = true;
  let analyticsEnabled = false;

  let userFeatureAccess =
    storageType === 'localstorage'
      ? await getUserFeatureAccess(process.env.USERNAME || 'localstorage-owner')
      : await getUserFeatureAccess(null);

  if (storageType !== 'localstorage') {
    const cookieStore = await cookies();
    const authInfo = parseAuthInfo(cookieStore.get('auth')?.value);
    userFeatureAccess = await getUserFeatureAccess(authInfo?.username);

    const config = await getConfig();
    siteName = config.SiteConfig.SiteName;
    announcement = config.SiteConfig.Announcement || announcement;
    announcementDisplayMode = config.SiteConfig.AnnouncementDisplayMode || announcementDisplayMode;
    doubanProxyType = config.SiteConfig.DoubanProxyType || doubanProxyType;
    doubanProxy = config.SiteConfig.DoubanProxy || doubanProxy;
    doubanImageProxyType = config.SiteConfig.DoubanImageProxyType || doubanImageProxyType;
    doubanImageProxy = config.SiteConfig.DoubanImageProxy || doubanImageProxy;
    disableYellowFilter = config.SiteConfig.DisableYellowFilter || disableYellowFilter;
    fluidSearch = config.SiteConfig.FluidSearch !== false;
    tmdbApiKey = config.SiteConfig.TmdbApiKey || process.env.TMDB_API_KEY || '';
    enableComments = config.SiteConfig.EnableComments || false;
    danmakuAutoLoadDefault = config.SiteConfig.DanmakuAutoLoadDefault !== false;
    loginBackgroundImage = config.ThemeConfig?.loginBackgroundImage || '';
    registerBackgroundImage = config.ThemeConfig?.registerBackgroundImage || '';
    homeBackgroundImage = config.ThemeConfig?.homeBackgroundImage || '';
    progressThumbType = config.ThemeConfig?.progressThumbType || 'default';
    progressThumbPresetId = config.ThemeConfig?.progressThumbPresetId || '';
    progressThumbCustomUrl = config.ThemeConfig?.progressThumbCustomUrl || '';
    enableRegistration = true;
    requireRegistrationInviteCode = config.SiteConfig.RequireRegistrationInviteCode || false;
    loginRequireTurnstile = config.SiteConfig.LoginRequireTurnstile || false;
    registrationRequireTurnstile = config.SiteConfig.RegistrationRequireTurnstile || false;
    turnstileSiteKey = config.SiteConfig.TurnstileSiteKey || '';
    enableOIDCLogin = config.SiteConfig.EnableOIDCLogin || false;
    enableOIDCRegistration = config.SiteConfig.EnableOIDCRegistration || false;
    oidcButtonText = config.SiteConfig.OIDCButtonText || '';
    telegramLoginEnabled = config.TelegramConfig?.enabled && config.TelegramConfig?.loginEnabled || false;
    telegramBotUsername = config.TelegramConfig?.botUsername || process.env.TELEGRAM_BOT_USERNAME || '';
    analyticsEnabled = config.SiteConfig.AnalyticsEnabled || false;
  }

  const runtimeConfig = {
    SITE_NAME: siteName,
    STORAGE_TYPE: storageType,
    ANNOUNCEMENT: announcement,
    ANNOUNCEMENT_DISPLAY_MODE: announcementDisplayMode,
    DOUBAN_PROXY_TYPE: doubanProxyType,
    DOUBAN_PROXY: doubanProxy,
    DOUBAN_IMAGE_PROXY_TYPE: doubanImageProxyType,
    DOUBAN_IMAGE_PROXY: doubanImageProxy,
    DISABLE_YELLOW_FILTER: disableYellowFilter,
    FLUID_SEARCH: fluidSearch,
    ENABLE_COMMENTS: enableComments,
    DANMAKU_AUTO_LOAD_DEFAULT: danmakuAutoLoadDefault,
    TMDB_API_KEY: tmdbApiKey,
    LOGIN_BACKGROUND_IMAGE: loginBackgroundImage,
    REGISTER_BACKGROUND_IMAGE: registerBackgroundImage,
    HOME_BACKGROUND_IMAGE: homeBackgroundImage,
    PROGRESS_THUMB_TYPE: progressThumbType,
    PROGRESS_THUMB_PRESET_ID: progressThumbPresetId,
    PROGRESS_THUMB_CUSTOM_URL: progressThumbCustomUrl,
    ENABLE_REGISTRATION: enableRegistration,
    REQUIRE_REGISTRATION_INVITE_CODE: requireRegistrationInviteCode,
    LOGIN_REQUIRE_TURNSTILE: loginRequireTurnstile,
    REGISTRATION_REQUIRE_TURNSTILE: registrationRequireTurnstile,
    TURNSTILE_SITE_KEY: turnstileSiteKey,
    ENABLE_OIDC_LOGIN: enableOIDCLogin,
    ENABLE_OIDC_REGISTRATION: enableOIDCRegistration,
    OIDC_BUTTON_TEXT: oidcButtonText,
    ENABLE_TELEGRAM_LOGIN: telegramLoginEnabled,
    TELEGRAM_BOT_USERNAME: telegramBotUsername,
    ENABLE_MOVIE_REQUEST: enableMovieRequest,
    FESTIVE_EFFECT_ENABLED: process.env.FESTIVE_EFFECT_ENABLED === 'true',
  };

  return (
    <html lang='zh-CN' suppressHydrationWarning>
      <head>
        <meta name='theme-color' content='#16a34a' />
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1.0, viewport-fit=cover'
        />
        <link rel='apple-touch-icon' href='/icons/icon-192x192.png' />
        <link rel='stylesheet' href='/api/theme/css' />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.RUNTIME_CONFIG = ${JSON.stringify(runtimeConfig)};`,
          }}
        />
      </head>
      <body
        className={`${inter.className} min-h-screen bg-black text-white`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute='class' defaultTheme='dark' enableSystem disableTransitionOnChange>
          <TopProgressBar />
          <RouteScrollReset />
          <TokenRefreshManager />
          <SiteProvider
            siteName={siteName}
            announcement={announcement}
            announcementDisplayMode={announcementDisplayMode}
            tmdbApiKey={tmdbApiKey}
          >
            <DownloadProvider>
              <StartupCacheCleanup />
              {children}
              <GlobalErrorIndicator />
            </DownloadProvider>
          </SiteProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
