'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PayPalSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subscriptionId = params.get('subscription_id');
    const status = params.get('status');
    const plan = params.get('plan') || 'monthly';

    if (subscriptionId && status === 'ACTIVE') {
      const now = Date.now();

      if (plan === 'daily') {
        // 日卡：24小时后过期
        const expireAt = now + 24 * 60 * 60 * 1000;
        localStorage.setItem('is_pro', 'true');
        localStorage.setItem('pro_type', 'daily');
        localStorage.setItem('pro_expire_at', String(expireAt));
        localStorage.setItem('pro_subscription_id', subscriptionId);
        alert('🎉 日卡激活成功！24小时内无限使用。');
      } else {
        // 月卡/年卡：设置过期时间
        let expireAt: number;
        if (plan === 'monthly') {
          expireAt = now + 30 * 24 * 60 * 60 * 1000; // 30天
        } else {
          expireAt = now + 365 * 24 * 60 * 60 * 1000; // 365天
        }
        localStorage.setItem('is_pro', 'true');
        localStorage.setItem('pro_type', plan);
        localStorage.setItem('pro_expire_at', String(expireAt));
        localStorage.setItem('pro_subscription_id', subscriptionId);
        localStorage.setItem('pro_activated_at', String(now));
        alert(`🎉 升级成功！您现在是 ${plan === 'monthly' ? '月卡' : '年卡'} Pro 用户了。`);
      }

      router.push('/profile');
    } else if (subscriptionId) {
      alert('订阅处理中，稍后将激活。');
      router.push('/pricing');
    } else {
      alert('订阅未完成，请重试。');
      router.push('/pricing');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-white to-pink-200 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-16 h-16 border-4 border-pink-300 border-t-pink-600 rounded-full animate-spin mb-4"></div>
        <p className="text-pink-600 text-lg">正在激活您的订阅...</p>
      </div>
    </div>
  );
}
