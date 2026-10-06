(async () => {
  const requiredCourse = document.body.dataset.course || '';
  const state = document.querySelector('#sessionState');
  const content = document.querySelector('#courseContent');
  content.classList.add('is-locked');
  state.textContent = '본인 확인 정보를 확인하고 있습니다.';
  try {
    const session = await window.MobiisAuth.validate();
    if (!session) { state.textContent = '로그인이 만료되었거나 본인 확인 정보가 없습니다. 첫 페이지에서 다시 확인해 주시기 바랍니다.'; return; }
    if (requiredCourse === 'privacy' && !session.privacyEligible) { state.textContent = '개인정보보호 교육 대상자가 아닙니다.'; return; }
    state.textContent = `${session.name} 님 / ${session.dept} · 본인 확인 완료`;
    content.classList.remove('is-locked');
  } catch (_) { state.textContent = '본인 확인 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주시기 바랍니다.'; }
})();
