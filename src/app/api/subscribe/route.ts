import { NextRequest, NextResponse } from 'next/server';
import { getAuthInfoFromCookie } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

// Simulated payment - in production, integrate Alipay/WeChat Pay
export async function POST(request: NextRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo?.username) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { months } = await request.json();
    const extendMonths = months || 12;

    const userInfo = await db.getUserInfoV2(authInfo.username);
    if (!userInfo) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const now = Date.now();
    const currentExpiry = userInfo.subscription_expiry || 0;
    const baseTime = currentExpiry > now ? currentExpiry : now;
    const newExpiry = baseTime + extendMonths * 30 * 24 * 60 * 60 * 1000;

    if (typeof (db as any).storage?.db?.prepare === 'function') {
      const d1db = (db as any).storage.db;
      await d1db.prepare(
        'UPDATE users SET subscription_expiry = ? WHERE username = ?'
      ).bind(newExpiry, authInfo.username).run();
      // Clear in-memory cache
      try {
        const { userInfoCache } = await import('@/lib/user-cache');
        userInfoCache?.delete(authInfo.username);
      } catch (_) {}
    }

    return NextResponse.json({
      ok: true,
      message: `订阅已延长 ${extendMonths} 个月`,
      expiry: newExpiry,
    });
  } catch (error) {
    console.error('订阅支付失败:', error);
    return NextResponse.json({ error: '支付处理失败' }, { status: 500 });
  }
}
