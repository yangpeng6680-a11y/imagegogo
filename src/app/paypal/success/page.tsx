'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PayPalSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // PayPal redirects here with ?subscription_id=XXX&status=ACTIVE
    const params = new URLSearchParams(window.location.search);
    const subscriptionId = params.get('subscription_id');
    const status = params.get('status');

    if (subscriptionId && status === 'ACTIVE') {
      // 订阅成功，激活 Pro
      localStorage.setItem('is_pro', 'true');
      localStorage.setItem('pro_subscription_id', subscriptionId);
      localStorage.setItem('pro_activated_at', String(Date.now()));
      alert('🎉 升级成功！您现在是 Pro 用户了。');
      router.push('/profile');
    } else if (subscriptionId) {
      // 有 subscription ID 但状态不是 ACTIVE（可能是待处理）
      alert('订阅处理中，稍后将激活。');
      router.push('/pricing');
    } else {
      // 没有 subscription ID（用户直接访问或取消）
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
