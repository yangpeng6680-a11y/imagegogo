'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const PLANS = [
  {
    name: '免费版',
    price: '¥0',
    period: '永久',
    tagline: '适合体验和轻度使用',
    color: 'gray',
    colorBg: 'bg-gray-50',
    colorBorder: 'border-gray-200',
    colorText: 'text-gray-800',
    colorBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    features: [
      { text: '每天 20 次免费使用', included: true },
      { text: '输出图片带水印', included: true },
      { text: '7 天历史记录', included: true },
      { text: '最多 5 个收藏预设', included: true },
      { text: '单张图片处理', included: true },
      { text: '批量处理（多张）', included: false },
      { text: '无限使用次数', included: false },
      { text: '永久历史记录', included: false },
    ],
    cta: '免费开始',
    ctaLink: '/',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '¥19.9',
    period: '/月',
    tagline: '适合电商、设计、自媒体',
    color: 'pink',
    colorBg: 'bg-gradient-to-br from-pink-50 to-rose-50',
    colorBorder: 'border-pink-300',
    colorText: 'text-pink-800',
    colorBtn: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg hover:shadow-pink-200',
    badge: '最受欢迎',
    features: [
      { text: '无限次使用', included: true },
      { text: '输出无水印', included: true },
      { text: '永久历史记录', included: true },
      { text: '无限收藏预设', included: true },
      { text: '单张图片处理', included: true },
      { text: '批量处理（最多 50 张）', included: true },
      { text: '优先处理队列', included: true },
      { text: '专属客服支持', included: true },
    ],
    cta: '立即升级',
    ctaLink: '#checkout',
    highlight: true,
    yearlyPrice: '¥99',
    yearlyPeriod: '/年',
    yearlySaving: '省 ¥140',
  },
];

const FAQS = [
  {
    q: '免费次数用完了怎么办？',
    a: '每天凌晨零点会重置免费次数。如果当天的次数已经用完，可以等到第二天继续使用，或者升级到 Pro 版本解锁无限次使用。',
  },
  {
    q: '升级 Pro 后可以开发票吗？',
    a: '目前支持开具普通发票。升级 Pro 后请联系客服，提供您的邮箱和发票抬头，我们会尽快为您处理。',
  },
  {
    q: '水印是什么样的？会影响图片效果吗？',
    a: '免费版本输出的图片右下角会有一个小的粉色文字水印（"图片变形编辑器"）。水印不会影响图片的主体内容，只占很小一块区域。',
  },
  {
    q: '批量处理有什么限制？',
    a: 'Pro 用户每次最多可以同时处理 50 张图片，所有图片会应用相同的变形参数。这对于电商批量修改商品图非常有用。',
  },
  {
    q: '我的图片和数据会被保存吗？',
    a: '所有图片处理都在您的浏览器本地完成，我们不会上传或保存您的原始图片。只有您主动保存的历史记录元数据（参数、缩略图）会存储在本地。',
  },
  {
    q: '如何取消订阅？',
    a: '您可以随时取消订阅，取消后当前付费周期内仍可继续使用 Pro 功能，次月不会自动扣款。取消订阅请在个人中心操作。',
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('google_access_token');
    setIsLoggedIn(!!token);
    setIsPro(localStorage.getItem('is_pro') === 'true');
  }, []);

  const handleCheckout = () => {
    if (!isLoggedIn) {
      // 触发 Google 登录
      const params = new URLSearchParams({
        client_id: '513906618740-1349pr9b405i2ddfmhjr45fimngdta3n.apps.googleusercontent.com',
        redirect_uri: 'https://imagedistortion.shop/api/auth/callback/google',
        response_type: 'token',
        scope: 'email profile openid',
      });
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
      return;
    }
    alert('支付功能即将上线，敬请期待！');
  };

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
            <Link href="/profile" className="text-sm text-pink-500 hover:text-pink-600 font-medium">
              个人中心 →
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            🌸 选择适合你的方案
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            无论你是偶尔使用还是专业设计师，都能找到合适的方案
          </p>

          {/* Billing Toggle */}
          {isLoggedIn && !isPro && (
            <div className="mt-6 inline-flex items-center gap-2 bg-white rounded-full p-1 shadow-sm border border-gray-100">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  billingCycle === 'monthly' ? 'bg-pink-500 text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                月付 ¥19.9
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  billingCycle === 'yearly' ? 'bg-pink-500 text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                年付 ¥99 <span className="text-pink-200">省 ¥140</span>
              </button>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-16 max-w-3xl mx-auto">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 ${
                plan.highlight
                  ? `${plan.colorBg} border-2 ${plan.colorBorder} shadow-xl shadow-pink-100`
                  : 'bg-white border border-gray-100 shadow-sm'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-medium rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className={`text-lg font-bold ${plan.colorText} mb-1`}>{plan.name}</h3>
                <p className="text-gray-400 text-sm">{plan.tagline}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-800">
                    {plan.highlight && billingCycle === 'yearly' ? plan.yearlyPrice : plan.price}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {plan.highlight && billingCycle === 'yearly' ? plan.yearlyPeriod : plan.period}
                  </span>
                </div>
                {plan.highlight && billingCycle === 'yearly' && (
                  <div className="mt-1">
                    <span className="text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded-full">
                      {plan.yearlySaving}
                    </span>
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span className={f.included ? 'text-pink-500' : 'text-gray-300'}>
                      {f.included ? '✓' : '×'}
                    </span>
                    <span className={f.included ? 'text-gray-700' : 'text-gray-400'}>{f.text}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={handleCheckout}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                  plan.highlight
                    ? `${plan.colorBtn} shadow-lg`
                    : `${plan.colorBtn}`
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Feature Comparison Note */}
        <div className="text-center mb-16">
          <p className="text-gray-400 text-sm">
            💡 所有方案均可在处理过程中保存参数为预设，方便下次复用
          </p>
        </div>

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
                  <span className={`text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
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

        {/* CTA Bottom */}
        <div className="text-center mt-16 pt-8">
          <p className="text-gray-400 text-sm mb-4">还有疑问？</p>
          <Link href="/faq" className="text-pink-500 font-medium hover:text-pink-600">
            查看完整 FAQ →
          </Link>
        </div>
      </div>
    </div>
  );
}
