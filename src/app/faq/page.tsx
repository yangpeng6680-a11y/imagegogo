'use client';

import { useState } from 'react';
import Link from 'next/link';

const FAQS = [
  {
    category: '基础问题',
    items: [
      {
        q: '图片变形编辑器是什么？',
        a: '图片变形编辑器是一款在线图片拉伸工具，支持四角透视变换。你可以通过拖动四个角点，把一张图片从一种形状调整为另一种形状。比如把一张正面拍的建筑照片，调整成倾斜透视的效果。适合电商商品图、PPT配图、设计素材等场景。',
      },
      {
        q: '支持哪些图片格式？',
        a: '目前支持 JPEG 和 PNG 格式。建议上传 PNG 格式以获得最佳画质。图片大小建议不超过 10MB。',
      },
      {
        q: '处理后的图片分辨率是多少？',
        a: '处理后的图片分辨率与背景图一致（如果您使用了背景图模式）。如果没有使用背景图，分辨率与第一张上传图片一致。我们保证输出高清原图，不压缩画质。',
      },
    ],
  },
  {
    category: '使用限制',
    items: [
      {
        q: '免费用户每天有多少次使用次数？',
        a: '未登录用户每天有 3 次免费使用次数。登录后的免费用户每天有 10 次免费使用次数。每天凌晨零点会重置免费次数。如果当天的次数已经用完，可以等到第二天继续使用，或者升级到 Pro 版本解锁无限次使用。',
      },
      {
        q: '免费版本输出的图片有水印吗？',
        a: '有的。免费版本输出的图片右下角会有一个小的粉色文字水印（"图片变形编辑器"）。水印不会影响图片的主体内容，只占很小一块区域。升级到 Pro 后，输出图片完全无水印。',
      },
      {
        q: '批量处理有什么限制？',
        a: '免费用户每次最多可以处理 20 张图片。Pro 用户每次最多可以同时处理 50 张图片，所有图片会应用相同的变形参数。这对于电商批量修改商品图非常有用。',
      },
      {
        q: '日卡、月卡、年卡有什么区别？',
        a: '日卡是 24 小时无限使用，到期后自动降级为免费用户，不自动续费。月卡和年卡是订阅制，到期前会自动续费，可随时取消。',
      },
    ],
  },
  {
    category: '账户与订阅',
    items: [
      {
        q: '为什么要登录 Google？',
        a: '登录后可以保存您的处理历史记录、收藏的预设，方便下次继续使用未完成的编辑工作。登录也是统计每日使用次数的方式。',
      },
      {
        q: '如何取消订阅？',
        a: '您可以随时取消订阅。登录后进入「个人中心」→「账户设置」，点击「取消订阅（前往 PayPal）」按钮，会跳转到 PayPal 进行取消。取消后当前付费周期内仍可继续使用 Pro 功能，次月不会自动扣款。',
      },

    ],
  },
  {
    category: '隐私安全',
    items: [
      {
        q: '我的图片会被保存吗？',
        a: '不会。所有图片处理都在您的浏览器本地完成（使用 Canvas API），我们服务器不会上传或保存您的任何原始图片。只有您主动保存的历史记录元数据（参数、缩略图）会存储在本地。您的隐私安全有保障。',
      },
      {
        q: '在中国大陆访问速度如何？',
        a: '网站部署在 Cloudflare 全球 CDN 上，中国大陆访问速度良好。如果 Google 登录在部分地区无法加载，可以稍后重试或联系客服。',
      },
    ],
  },
];

export default function FAQPage() {
  const [openItem, setOpenItem] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-pink-400 hover:text-pink-600 transition-colors">← 返回</Link>
          <h1 className="text-lg font-bold text-gray-800">常见问题</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">有疑问？这里有答案</h2>
          <p className="text-gray-500">如果没有找到你想要的答案，欢迎联系我们</p>
        </div>

        <div className="space-y-8">
          {FAQS.map((category, ci) => (
            <div key={ci}>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">{category.category}</h3>
              <div className="space-y-2">
                {category.items.map((item, ii) => {
                  const globalIndex = ci * 100 + ii;
                  return (
                    <div key={ii} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <button
                        onClick={() => setOpenItem(openItem === globalIndex ? null : globalIndex)}
                        className="w-full px-5 py-4 flex items-center justify-between text-left"
                      >
                        <span className="font-medium text-gray-800 pr-4">{item.q}</span>
                        <span className={`text-pink-400 text-sm transition-transform flex-shrink-0 ${openItem === globalIndex ? 'rotate-180' : ''}`}>
                          ▾
                        </span>
                      </button>
                      {openItem === globalIndex && (
                        <div className="px-5 pb-4 text-gray-500 text-sm leading-relaxed border-t border-gray-50 pt-3">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-12 p-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl text-center">
          <div className="text-3xl mb-3">💬</div>
          <h3 className="font-bold text-gray-800 mb-1">还有其他问题？</h3>
          <p className="text-gray-500 text-sm mb-4">我们很乐意帮助你解决任何疑问</p>
          <a
            href="mailto:support@imagedistortion.shop"
            className="inline-block px-6 py-2 bg-pink-500 text-white rounded-full text-sm font-medium hover:bg-pink-600 transition-colors"
          >
            联系客服
          </a>
        </div>
      </div>
    </div>
  );
}
