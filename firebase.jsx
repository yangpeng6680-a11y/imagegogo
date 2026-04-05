// Google Identity Services — 直接使用 Google Cloud OAuth
// 不再依赖 Firebase

export const GOOGLE_CLIENT_ID = '513906618740-1349pr9b405i2ddfmhjr45fimngdta3n.apps.googleusercontent.com';
export const REDIRECT_URI = 'https://imagedistortion.shop/api/auth/callback/google';

// 触发 Google OAuth 弹窗登录
export function googleLogin() {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'token',
    scope: 'email profile openid',
    include_granted_scopes: 'true',
    state: 'google_signin',
  });
  // 直接跳转，不使用 popup（popup 会被拦截）
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// 从 URL hash 中提取 access_token（登录后 Google 会跳转回 Redirect URI 并带 #access_token=xxx）
export function getAccessTokenFromUrl() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return params.get('access_token');
}

// 清除 URL hash（安全清理）
export function clearUrlHash() {
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}
