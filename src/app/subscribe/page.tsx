'use client';

import { Check, Crown } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SubscribePage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userInfo, setUserInfo] = useState<{ username: string; remaining_days: number } | null>(null);

  useEffect(() => {
    fetch('/api/user/info')
      .then(r => r.json())
      .then(d => setUserInfo(d))
      .catch(() => {});
  }, []);

  const handlePay = async (months: number) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ months }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage(`✅ 支付成功！订阅已延长 ${months} 个月`);
        setUserInfo((prev) => prev ? { ...prev, remaining_days: prev.remaining_days + months * 30 } : null);
        setTimeout(() => window.location.href = '/', 1500);
      } else {
        setMessage(`❌ ${data.error || '支付失败'}`);
      }
    } catch {
      setMessage('❌ 网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4'>
      <div className='w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8'>
        <div className='text-center mb-6'>
          <Crown className='w-12 h-12 text-amber-500 mx-auto mb-3' />
          <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>订阅续费</h1>
          {userInfo && (
            <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
              {userInfo.username} · {userInfo.remaining_days > 0 ? `剩余 ${userInfo.remaining_days} 天` : userInfo.remaining_days === 0 ? '试用已到期' : '永久有效'}
            </p>
          )}
        </div>

        <div className='bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-6'>
          <div className='text-center'>
            <span className='text-3xl font-bold text-amber-600 dark:text-amber-400'>¥388</span>
            <span className='text-gray-500 dark:text-gray-400 text-sm ml-1'>/年</span>
          </div>
          <ul className='mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300'>
            {['全部视频源无限观看', '1080P/4K 高清播放', '弹幕互动', 'AI 影视推荐', '私人影库接入'].map((f) => (
              <li key={f} className='flex items-center gap-2'>
                <Check className='w-4 h-4 text-green-500 flex-shrink-0' />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {message && (
          <div className={`text-center text-sm mb-4 p-3 rounded-lg ${message.startsWith('✅') ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
            {message}
          </div>
        )}

        <button
          onClick={() => handlePay(12)}
          disabled={loading}
          className='w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50'
        >
          {loading ? '处理中...' : `立即支付 ¥388 / 年`}
        </button>

        <p className='mt-4 text-xs text-center text-gray-400'>
          当前为测试模式 · 点击直接生效
        </p>
      </div>
    </div>
  );
}
