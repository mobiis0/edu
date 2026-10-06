(() => {
  const key = 'mobiisEduSession';
  const config = window.MOBIIS_EDU_CONFIG || {};
  function request(params) {
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(config.API_URL || '')) return Promise.reject(new Error('API_URL_NOT_CONFIGURED'));
    return new Promise((resolve, reject) => {
      const callback = `mobiisEdu_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const script = document.createElement('script');
      let finished = false;
      const clean = (error, data) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        if (error) {
          window[callback] = () => {};
          setTimeout(() => delete window[callback], 120000);
        } else {
          delete window[callback];
        }
        script.remove();
        error ? reject(error) : resolve(data);
      };
      const timer = setTimeout(() => clean(new Error('TIMEOUT')), 90000);
      window[callback] = data => clean(null, data);
      script.onerror = () => clean(new Error('NETWORK_ERROR'));
      script.referrerPolicy = 'no-referrer';
      script.src = `${config.API_URL}?${new URLSearchParams({...params, callback, year: String(config.YEAR || 2026)})}`;
      document.head.appendChild(script);
    });
  }
  async function api(params) {
    try {
      return await request(params);
    } catch (error) {
      if (params.action !== 'login' || !['TIMEOUT', 'NETWORK_ERROR'].includes(error.message)) throw error;
      return request(params);
    }
  }
  function read() { try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch (_) { sessionStorage.removeItem(key); return null; } }
  async function validate() {
    const session = read();
    if (!session?.token) return null;
    const result = await api({action:'status', token:session.token});
    if (!result?.ok || !result.employee) { sessionStorage.removeItem(key); return null; }
    sessionStorage.setItem(key, JSON.stringify(result.employee));
    return result.employee;
  }
  async function logout() {
    const session = read();
    sessionStorage.removeItem(key);
    try { if (session?.token) await api({action:'logout', token:session.token}); } finally { location.href = 'index.html'; }
  }
  window.MobiisAuth = {api, read, validate, logout};
})();
