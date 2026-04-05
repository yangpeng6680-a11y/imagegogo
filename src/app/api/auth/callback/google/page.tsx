'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GoogleCallback() {
  const router = useRouter();

  useEffect(() => {
    // 从 URL hash 中提取 access_token
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const error = params.get('error');

    if (error) {
      console.error('OAuth error:', error);
      router.replace('/');
      return;
    }

    if (accessToken) {
      // 把 access_token 存到 localStorage
      localStorage.setItem('google_access_token', accessToken);
      // 清除 URL hash
      history.replaceState(null, '', window.location.pathname);
      // 跳回首页
      router.replace('/');
    } else {
      // 没有 token，可能是直接访问，重定向到首页
      router.replace('/');
    }
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #fce7f3 0%, #fff 100%)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, border: '4px solid #f9a8d4',
          borderTopColor: '#ec4899', borderRadius: '50%',
          animation: 'spin 1s linear infinite', margin: '0 auto 16px'
        }} />
        <p style={{ color: '#ec4899', fontSize: 18 }}>正在登录 Google...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
