import { NextRequest, NextResponse } from 'next/server';
import { getAuthInfoFromCookie } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo?.username) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const userInfo = await db.getUserInfoV2(authInfo.username);
    const expiry = userInfo?.subscription_expiry || 0;
    const now = Date.now();
    const remaining = expiry > 0 ? Math.max(0, Math.ceil((expiry - now) / (24 * 60 * 60 * 1000))) : -1;

    return NextResponse.json({
      username: authInfo.username,
      subscription_expiry: expiry,
      remaining_days: remaining,
    });
  } catch (error) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
