'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

declare global {
  interface Window {
    paypal?: any;
  }
}

const PAYPAL_CLIENT_ID = 'ATdCfgFHkoQzMXaY_yVmHAXMCLPe_HcpK0O7_gg3Ys6aDzUx-RxKg33791GG5zP9IKyqMxp5UUmIz18Q';

// PayPal Billing Plan IDs (正式环境)
const BILLING_PLAN_DAILY = 'P-13K78363HU487850SNHJIL5Y';
const BILLING_PLAN_MONTHLY = 'P-17A9610673729182RNHJIGVY';
const BILLING_PLAN_YEARLY = 'P-64M55248BS962763LNHJIMAI';

export default function PricingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activePlan, setActivePlan] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [paypalError, setPaypalError] = useState(false);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const subscribed = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('google_access_token');
    setIsLoggedIn(!!token);
  }, []);

  // 加载 PayPal SDK
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&vault=true&intent=subscription`;
    script.async = true;
    script.onload = () => setPaypalLoaded(true);
    script.onerror = () => setPaypalError(true);
    document.body.appendChild(script);
    return () => {
      const existingScript = document.querySelector(`script[src*="paypal.com/sdk"]`);
      if (existingScript) existingScript.remove();
    };
  }, []);

  // 渲染 PayPal 按钮
  useEffect(() => {
    if (!paypalLoaded || subscribed.current || !window.paypal || !paypalContainerRef.current) return;

    const planId = activePlan === 'daily' ? BILLING_PLAN_DAILY
      : activePlan === 'monthly' ? BILLING_PLAN_MONTHLY
      : BILLING_PLAN_YEARLY;

    const container = paypalContainerRef.current;
    container.innerHTML = '';

    try {
      window.paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'subscribe' },
        createSubscription: (data: any, actions: any) => {
          return actions.subscription.create({ plan_id: planId });
        },
        onApprove: (data: any) => {
          subscribed.current = true;
          const returnUrl = `${window.location.origin}/paypal/success?subscription_id=${data.subscriptionID}&status=ACTIVE&plan=${activePlan}`;
          window.location.href = returnUrl;
        },
        onError: (err: any) => {
          console.error('PayPal error:', err);
          alert('支付出错，请重试。');
        },
      }).render(container);
    } catch (e) {
      console.error('PayPal render error:', e);
    }
  }, [paypalLoaded, activePlan]);

  const FAQS = [
    { q: '日卡和月卡/年卡有什么区别？', a: '日卡是 24 小时无限使用，到期后自动降级为免费用户，不自动续费。月卡和年卡是订阅制，到期前会自动续费，可随时取消。' },
    { q: '水印是什么样的？', a: '免费版本输出的图片右下角会有一个小的粉色文字水印。升级到 Pro 后，输出图片完全无水印。' },
    { q: '如何取消订阅？', a: '登录后进入「个人中心」→「账户设置」，可以随时取消订阅。取消后当前付费周期内仍可使用 Pro 功能。' },
    { q: '我的图片会被保存吗？', a: '所有图片处理都在您的浏览器本地完成（使用 Canvas API），我们服务器不会上传或存储您的任何原始图片。' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-pink-400 hover:text-pink-600 transition-colors">← 返回</Link>
            <h1 className="text-lg font-bold text-gray-800">定价方案</h1>
          </div>
          {isLoggedIn && (
            <Link href="/profile" className="text-sm text-pink-500 hover:text-pink-600 font-medium">个人中心 →</Link>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">🌸 选择适合你的方案</h2>
          <p className="text-gray-500 text-lg">按需选择，灵活订阅</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">

          {/* Free */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-1">免费版</h3>
            <p className="text-gray-400 text-sm mb-4">适合体验</p>
            <div className="text-3xl font-bold text-gray-800 mb-1">$0</div>
            <p className="text-gray-400 text-sm mb-5">永久</p>
            <ul className="space-y-2 mb-6 text-sm">
              <li className="flex items-center gap-2"><span className="text-pink-500">✓</span><span className="text-gray-700">每天 3 次免费</span></li>
              <li className="flex items-center gap-2"><span className="text-pink-500">✓</span><span className="text-gray-700">有水印</span></li>
              <li className="flex items-center gap-2"><span className="text-gray-300">×</span><span className="text-gray-400">无历史记录</span></li>
              <li className="flex items-center gap-2"><span className="text-gray-300">×</span><span className="text-gray-400">无预设收藏</span></li>
            </ul>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
            >
              免费开始
            </button>
          </div>

          {/* Daily */}
          <div className="bg-white border-2 border-pink-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-800">日卡</h3>
              <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">限时特惠</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">24小时无限</p>
            <div className="text-3xl font-bold text-gray-800 mb-1">$0.99</div>
            <p className="text-gray-400 text-sm mb-5">/ 24小时</p>
            <ul className="space-y-2 mb-6 text-sm">
              <li className="flex items-center gap-2"><span className="text-pink-500">✓</span><span className="text-gray-700">24小时无限使用</span></li>
              <li className="flex items-center gap-2"><span className="text-pink-500">✓</span><span className="text-gray-700">无水印</span></li>
              <li className="flex items-center gap-2"><span className="text-pink-500">✓</span><span className="text-gray-700">批量处理</span></li>
              <li className="flex items-center gap-2"><span className="text-gray-300">×</span><span className="text-gray-400">到期自动降级</span></li>
            </ul>
            {isLoggedIn ? (
              !paypalLoaded ? (
                <div className="flex justify-center py-2"><div className="w-6 h-6 border-2 border-pink-300 border-t-pink-500 rounded-full animate-spin" /></div>
              ) : (
                <div ref={paypalContainerRef} className="min-h-[45px]" />
              )
            ) : (
              <button disabled className="w-full py-2.5 rounded-xl text-sm font-medium bg-pink-100 text-pink-400 cursor-not-allowed">
                请先登录
              </button>
            )}
          </div>

          {/* Monthly */}
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-300 rounded-2xl p-5 shadow-lg shadow-pink-100 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-medium rounded-full">
                最受欢迎
              </span>
            </div>
            <h3 className="text-lg font-bold text-pink-800 mb-1 mt-2">月卡</h3>
            <p className="text-pink-400 text-sm mb-4">每月无限</p>
            <div className="text-3xl font-bold text-gray-800 mb-1">$19.9</div>
            <p className="text-gray-400 text-sm mb-5">/ 月</p>
            <ul className="space-y-2 mb-6 text-sm">
              <li className="flex items-center gap-2"><span className="text-pink-500">✓</span><span className="text-gray-700">每月无限使用</span></li>
              <li className="flex items-center gap-2"><span className="text-pink-500">✓</span><span className="text-gray-700">无水印</span></li>
              <li className="flex items-center gap-2"><span className="text-pink-500">✓</span><span className="text-gray-700">批量处理</span></li>
              <li className="flex items-center gap-2"><span className="text-pink-500">✓</span><span className="text-gray-700">自动续费</span></li>
            </ul>
            {isLoggedIn ? (
              !paypalLoaded ? (
                <div className="flex justify-center py-2"><div className="w-6 h-6 border-2 border-pink-300 border-t-pink-500 rounded-full animate-spin" /></div>
              ) : (
                <div ref={paypalContainerRef} className="min-h-[45px]" />
              )
            ) : (
              <button disabled className="w-full py-2.5 rounded-xl text-sm font-medium bg-pink-100 text-pink-400 cursor-not-allowed">
                请先登录
              </button>
            )}
          </div>

          {/* Yearly */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-1">年卡</h3>
            <p className="text-gray-400 text-sm mb-4">每年无限</p>
            <div className="text-3xl font-bold text-gray-800 mb-1">$99</div>
            <p className="text-gray-400 text-sm mb-1">/ 年</p>
            <p className="text-green-500 text-xs mb-5">相当于 $8.25/月</p>
            <ul className="space-y-2 mb-6 text-sm">
              <li className="flex items-center gap-2"><span className="text-pink-500">✓</span><span className="text-gray-700">每年无限使用</span></li>
              <li className="flex items-center gap-2"><span className="text-pink-500">✓</span><span className="text-gray-700">无水印</span></li>
              <li className="flex items-center gap-2"><span className="text-pink-500">✓</span><span className="text-gray-700">批量处理</span></li>
              <li className="flex items-center gap-2"><span className="text-pink-500">✓</span><span className="text-gray-700">自动续费</span></li>
            </ul>
            {isLoggedIn ? (
              !paypalLoaded ? (
                <div className="flex justify-center py-2"><div className="w-6 h-6 border-2 border-pink-300 border-t-pink-500 rounded-full animate-spin" /></div>
              ) : (
                <div ref={paypalContainerRef} className="min-h-[45px]" />
              )
            ) : (
              <button disabled className="w-full py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed">
                请先登录
              </button>
            )}
          </div>
        </div>

        {paypalError && (
          <div className="text-center text-red-400 text-sm mb-4">⚠️ PayPal 加载失败，请检查网络后刷新页面重试</div>
        )}

        {isLoggedIn && paypalLoaded && (
          <p className="text-center text-gray-400 text-sm mb-8">🔒 安全支付 via PayPal · 随时可在个人中心取消订阅</p>
        )}

        {!isLoggedIn && (
          <p className="text-center text-gray-400 text-sm mb-8">登录后即可订阅 Pro，畅享无限使用 →</p>
        )}

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-800 text-center mb-8">常见问题</h3>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-medium text-gray-800">{faq.q}</span>
                  <span className={`text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-gray-500 text-sm leading-relaxed border-t border-gray-50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <Link href="/faq" className="text-pink-500 font-medium hover:text-pink-600">查看完整 FAQ →</Link>
        </div>
      </div>
    </div>
  );
}
