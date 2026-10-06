(() => {
  const config = window.MOBIIS_EDU_CONFIG || {};
  const form = document.querySelector('#loginForm');
  const nameInput = document.querySelector('#employeeName');
  const birthInput = document.querySelector('#birthDate');
  const loginButton = document.querySelector('#loginButton');
  const message = document.querySelector('#loginMessage');
  const stateText = document.querySelector('#loginStateText');
  const courseButtons = [...document.querySelectorAll('.course-button')];

  birthInput.addEventListener('input', () => {
    birthInput.value = birthInput.value.replace(/\D/g, '').slice(0, 6);
  });

  function setMessage(text, kind = '') {
    message.textContent = text;
    message.className = `form-message ${kind ? `is-${kind}` : ''}`;
  }

  function setLoading(on) {
    loginButton.disabled = on;
    loginButton.textContent = on ? '확인 중…' : '확인';
  }

  async function sha256(text) {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const jsonp = window.MobiisAuth.api;

  function applyLogin(employee) {
    document.querySelector('#logoutButton').hidden = false;
    sessionStorage.setItem('mobiisEduSession', JSON.stringify(employee));
    nameInput.value = employee.name || nameInput.value;
    nameInput.disabled = true;
    birthInput.value = '••••••';
    birthInput.disabled = true;
    loginButton.textContent = '확인 완료';
    loginButton.disabled = true;
    stateText.textContent = `${employee.name} 님 (${employee.dept}) · 수강할 강의를 선택해 주시기 바랍니다.`;
    setMessage('직원 명단과 일치하였습니다.', 'success');

    courseButtons.forEach(btn => {
      const course = btn.dataset.course;
      const allowed = course !== 'privacy' || !!employee.privacyEligible;
      btn.disabled = !allowed;
      if (employee.completed && employee.completed[course]) btn.classList.add('is-completed');
      if (course === 'privacy' && !allowed) {
        const small = btn.querySelector('small');
        if (small) small.textContent = '경영기획 대상자만 수강 가능';
      }
    });
  }

  document.querySelector('#logoutButton').addEventListener('click', () => window.MobiisAuth.logout());
  window.MobiisAuth.validate().then(employee => { if (employee) applyLogin(employee); }).catch(() => sessionStorage.removeItem('mobiisEduSession'));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = nameInput.value.trim().replace(/\s+/g, '');
    const birth = birthInput.value.trim();

    if (!name) return setMessage('이름을 입력해 주시기 바랍니다.', 'error');
    if (!/^\d{6}$/.test(birth)) return setMessage('생년월일 6자리를 숫자로 입력해 주시기 바랍니다.', 'error');

    setLoading(true);
    setMessage('직원 명단을 확인하고 있습니다.');

    try {
      const authKey = await sha256(`${name}|${birth}`);
      const result = await jsonp({ action: 'login', authKey });
      if (!result || !result.ok) {
        setMessage(result?.message || '이름 또는 생년월일이 직원 명단과 일치하지 않습니다.', 'error');
        return;
      }
      applyLogin(result.employee);
    } catch (err) {
      if (err.message === 'API_URL_NOT_CONFIGURED') {
        setMessage('본인 확인 서비스가 아직 연결되지 않았습니다. 교육 담당자에게 문의해 주시기 바랍니다.', 'error');
      } else {
        setMessage('직원 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주시기 바랍니다.', 'error');
      }
    } finally {
      if (!nameInput.disabled) setLoading(false);
    }
  });

  courseButtons.forEach(btn => btn.addEventListener('click', () => {
    if (btn.disabled) return;
    const session = sessionStorage.getItem('mobiisEduSession');
    if (!session) {
      setMessage('먼저 이름과 생년월일을 확인해 주시기 바랍니다.', 'error');
      return;
    }
    window.location.href = btn.dataset.href;
  }));
})();
