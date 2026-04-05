'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserProfile {
  email: string;
  displayName: string;
  photoURL: string;
  uid: string;
}

interface HistoryItem {
  id: string;
  name: string;
  thumbnail: string;
  params: any;
  createdAt: number;
}

interface PresetItem {
  id: string;
  name: string;
  params: any;
  createdAt: number;
}

const FREE_DAILY_LIMIT = 10;
const FREE_HISTORY_DAYS = 7;

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'presets' | 'settings'>('history');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [nickname, setNickname] = useState('');
  const [todayUses, setTodayUses] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [proType, setProType] = useState('');
  const [expireAt, setExpireAt] = useState(0);
  const [savingNickname, setSavingNickname] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('google_access_token');
    if (!token) {
      router.push('/');
      return;
    }

    // 获取用户信息
    const storedUser = localStorage.getItem('user_profile');
    let storedIsPro = localStorage.getItem('is_pro') === 'true';
    const storedProType = localStorage.getItem('pro_type');
    const storedExpireAt = localStorage.getItem('pro_expire_at');
    const storedTodayUses = parseInt(localStorage.getItem('today_uses') || '0');
    const lastUseDate = localStorage.getItem('last_use_date');

    // 检查 Pro 是否过期
    if (storedIsPro && storedExpireAt && Date.now() > parseInt(storedExpireAt)) {
      storedIsPro = false;
      localStorage.setItem('is_pro', 'false');
      localStorage.removeItem('pro_type');
      localStorage.removeItem('pro_expire_at');
    }

    // 检查是否是今天
    const today = new Date().toDateString();
    if (lastUseDate !== today) {
      localStorage.setItem('today_uses', '0');
      setTodayUses(0);
    } else {
      setTodayUses(storedTodayUses);
    }

    if (storedUser) {
      const profile = JSON.parse(storedUser);
      setUser(profile);
      setNickname(profile.displayName || '');
      setIsPro(storedIsPro);
      setProType(storedProType || '');
      setExpireAt(storedExpireAt ? parseInt(storedExpireAt) : 0);
    }

    // 加载历史记录
    const storedHistory = localStorage.getItem('user_history');
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }

    // 加载预设
    const storedPresets = localStorage.getItem('user_presets');
    if (storedPresets) {
      setPresets(JSON.parse(storedPresets));
    }

    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('user_profile');
    router.push('/');
  };

  const handleSaveNickname = () => {
    if (!user) return;
    setSavingNickname(true);
    const updated = { ...user, displayName: nickname };
    localStorage.setItem('user_profile', JSON.stringify(updated));
    setUser(updated);
    setTimeout(() => setSavingNickname(false), 500);
  };

  const handleDeleteHistory = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('user_history', JSON.stringify(updated));
  };

  const handleDeletePreset = (id: string) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    localStorage.setItem('user_presets', JSON.stringify(updated));
  };

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-white to-pink-200 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-pink-300 border-t-pink-600 rounded-full animate-spin mb-4"></div>
          <p className="text-pink-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-pink-400 hover:text-pink-600 transition-colors">← 返回</Link>
            <h1 className="text-lg font-bold text-gray-800">个人中心</h1>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              {!isPro && (
                <button
                  onClick={handleUpgrade}
                  className="px-4 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm rounded-full font-medium hover:shadow-lg hover:shadow-pink-200 transition-all"
                >
                  ⭐ 升级 Pro
                </button>
              )}
              <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full" />
              <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600">退出</button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* User Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <img src={user?.photoURL} alt={user?.displayName} className="w-20 h-20 rounded-full border-4 border-pink-100" />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800 mb-1">{user?.displayName}</h2>
              <p className="text-gray-500 text-sm mb-3">{user?.email}</p>
              <div className="flex items-center gap-4">
                {isPro ? (
                  <span className="px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs rounded-full font-medium">
                    ⭐ {proType === 'daily' ? '日卡' : proType === 'monthly' ? '月卡' : '年卡'} Pro
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                    免费用户
                  </span>
                )}
                <span className="text-sm text-gray-500">
                  注册于 {user ? new Date().toLocaleDateString('zh-CN') : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          {!isPro && (
            <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">今日使用次数</span>
                <span className="text-sm text-gray-500">{todayUses} / {FREE_DAILY_LIMIT}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className="bg-gradient-to-r from-pink-400 to-rose-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((todayUses / FREE_DAILY_LIMIT) * 100, 100)}%` }}
                />
              </div>
              <button
                onClick={handleUpgrade}
                className="w-full py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
              >
                升级 Pro 解锁无限次数 →
              </button>
            </div>
          )}

          {isPro && (
            <div className="mt-6 p-4 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl text-white">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⭐</span>
                <span className="font-bold">
                  {proType === 'daily' ? '日卡' : proType === 'monthly' ? '月卡' : '年卡'} Pro 用户
                </span>
              </div>
              <p className="text-pink-100 text-sm">
                {expireAt > 0
                  ? `到期时间：${new Date(expireAt).toLocaleString('zh-CN')}`
                  : '无限次使用，无水印，专属批量处理'}
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b">
            {[
              { key: 'history', label: '历史记录', count: history.length },
              { key: 'presets', label: '收藏预设', count: presets.length },
              { key: 'settings', label: '账户设置', count: null },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-pink-600 border-b-2 border-pink-500 bg-pink-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label} {tab.count !== null ? `(${tab.count})` : ''}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                {history.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">📷</div>
                    <p className="text-gray-500 mb-4">还没有处理记录</p>
                    <Link href="/" className="inline-block px-6 py-2 bg-pink-500 text-white rounded-full text-sm font-medium hover:bg-pink-600 transition-colors">
                      开始使用 →
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {history.map(item => (
                      <div key={item.id} className="relative group border border-gray-100 rounded-xl overflow-hidden">
                        <img src={item.thumbnail} alt={item.name} className="w-full aspect-square object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                          <div className="p-2 w-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleDeleteHistory(item.id)}
                              className="w-full py-1 bg-white/90 text-red-500 text-xs rounded-lg"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                        <div className="p-2">
                          <p className="text-xs text-gray-600 truncate">{item.name}</p>
                          <p className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString('zh-CN')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Presets Tab */}
            {activeTab === 'presets' && (
              <div>
                {presets.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">⭐</div>
                    <p className="text-gray-500 mb-4">还没有收藏的预设</p>
                    <p className="text-gray-400 text-sm">处理图片时可以保存当前参数为预设</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {presets.map(preset => (
                      <div key={preset.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-pink-200 transition-colors">
                        <div>
                          <p className="font-medium text-gray-800">{preset.name}</p>
                          <p className="text-xs text-gray-400">{new Date(preset.createdAt).toLocaleDateString('zh-CN')}</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-3 py-1 bg-pink-50 text-pink-600 text-xs rounded-lg">应用</button>
                          <button
                            onClick={() => handleDeletePreset(preset.id)}
                            className="px-3 py-1 bg-gray-50 text-gray-400 text-xs rounded-lg hover:text-red-500"
                          >删除</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!isPro && presets.length >= 5 && (
                  <div className="mt-4 p-4 bg-pink-50 rounded-xl text-center">
                    <p className="text-pink-600 text-sm mb-2">免费用户最多保存 5 个预设</p>
                    <button onClick={handleUpgrade} className="text-pink-500 text-sm font-medium hover:underline">
                      升级 Pro 解锁无限预设 →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">昵称</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={nickname}
                      onChange={e => setNickname(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-pink-400"
                      placeholder="设置你的昵称"
                    />
                    <button
                      onClick={handleSaveNickname}
                      disabled={savingNickname}
                      className="px-6 py-2 bg-pink-500 text-white rounded-xl text-sm font-medium hover:bg-pink-600 transition-colors disabled:opacity-50"
                    >
                      {savingNickname ? '保存中...' : '保存'}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">登录方式</p>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <img src={user?.photoURL} alt="" className="w-8 h-8 rounded-full" />
                    <span className="text-sm text-gray-700">{user?.email}</span>
                    <span className="text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded-full ml-auto">Google</span>
                  </div>
                </div>

                {!isPro && (
                  <div className="pt-4 border-t">
                    <button
                      onClick={handleUpgrade}
                      className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                    >
                      ⭐ 升级 Pro — 解锁全部功能
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
