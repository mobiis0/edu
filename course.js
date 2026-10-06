(async () => {
  const course = document.body.dataset.course || '';
  const state = document.querySelector('#sessionState');
  const content = document.querySelector('#courseContent');
  content.classList.add('is-locked');
  state.textContent = '본인 확인 정보를 확인하고 있습니다.';
  let employee;
  try {
    employee = await window.MobiisAuth.validate();
    if (!employee) { state.textContent = '로그인이 만료되었거나 본인 확인 정보가 없습니다. 첫 페이지에서 다시 확인해 주시기 바랍니다.'; return; }
    if (course === 'privacy' && !employee.privacyEligible) {
      state.textContent = '경영기획 실무자만 해당 교육 이수가 필요합니다.';
      window.alert(state.textContent);
      window.location.replace('index.html');
      return;
    }
    state.textContent = employee.name + ' 님 / ' + employee.dept + ' · 본인 확인 완료';
    content.classList.remove('is-locked');
  } catch (_) { state.textContent = '본인 확인 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주시기 바랍니다.'; return; }
  if (!['sexual','disability','privacy'].includes(course)) return;
  const courseName = {sexual:'성희롱 예방교육',disability:'장애인 인식개선교육',privacy:'개인정보보호교육'}[course];

  const questions = [
    {text:'장난이었고 성희롱을 할 의도가 없었다면 직장 내 성희롱에 해당하지 않는다.', answer:'X', explanation:'행위자의 의도가 없었다는 이유만으로 성희롱이 배제되지 않습니다. 피해자의 사정과 같은 처지의 합리적인 사람이 느낄 성적 굴욕감·혐오감 등을 고려합니다.', time:'7:35~7:56'},
    {text:'회식이나 메신저에서 발생한 성적 언동도 업무와 관련되어 있다면 직장 내 성희롱이 될 수 있다.', answer:'O', explanation:'직장 내 성희롱은 사무실 안에서만 발생하는 것이 아닙니다. 회식·출장·메신저 등에서도 업무 관련성이 있으면 해당할 수 있습니다.', time:'3:24~3:51, 8:29~9:11'},
    {text:'피해자가 그 자리에서 거부 의사를 표현하지 못했다면 성희롱에 동의한 것으로 보아야 한다.', answer:'X', explanation:'상하관계, 당황스러움이나 불이익에 대한 두려움 때문에 거부하지 못할 수 있습니다. 침묵이나 억지로 웃는 반응을 동의로 단정하면 안 됩니다.', time:'10:40~11:26, 17:44~18:17'},
    {text:'직장 내 성희롱 발생 사실을 알게 된 제3자도 회사에 신고할 수 있으며, 회사는 지체 없이 사실 확인을 위한 조사를 해야 한다.', answer:'O', explanation:'신고는 피해자 본인만 할 수 있는 것이 아닙니다. 발생 사실을 알게 된 누구든지 신고할 수 있으며, 회사는 신고를 받거나 사실을 알게 되면 지체 없이 조사해야 합니다.', time:'12:51~13:11'},
    {text:'성희롱 신고로 팀 분위기가 나빠졌다면, 신고자를 프로젝트에서 배제하거나 인사평가에서 불이익을 주어도 된다.', answer:'X', explanation:'성희롱 신고나 피해를 이유로 한 업무 배제, 부당한 인사평가, 따돌림 등 불리한 처우는 금지됩니다.', time:'23:27~26:30'}
  ];
  const $ = id => document.getElementById(id);
  const quizForm = $('quizForm');
  const check = $('completionCheck');
  const submit = $('submitCompletion');
  let passed = course !== 'sexual';
  let submitting = false;
  let saved = !!employee.completed?.[course];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  if (quizForm) $('quizQuestions').innerHTML = questions.map((q,i) =>
    '<fieldset class="question" id="question'+i+'"><legend>'+(i+1)+'. '+escape(q.text)+'</legend><div class="answers">'+
    ['O','X'].map(a=>'<label><input type="radio" name="q'+i+'" value="'+a+'" required>'+a+'</label>').join('')+
    '</div><p class="explanation" id="explanation'+i+'" hidden></p></fieldset>').join('');
  $('confirmationIdentity').textContent = employee.name + ' 님 · ' + employee.dept + ' · 2026년 ' + courseName;

  function show(step) {
    for (const id of ['trainingStep','quizStep','confirmStep','resultStep']) { if ($(id)) $(id).hidden = id !== step; }
    for (const id of ['stepVideo','stepQuiz','stepConfirm']) $(id)?.removeAttribute('aria-current');
    const current = {trainingStep:'stepVideo',quizStep:'stepQuiz',confirmStep:'stepConfirm'}[step];
    if (current) $(current).setAttribute('aria-current','step');
    const heading = {quizStep:'quizHeading',confirmStep:'confirmHeading',resultStep:'resultHeading'}[step];
    if (heading) $(heading).focus();
  }
  function canSubmit() { submit.disabled = !passed || !check.checked || submitting || saved; }
  $('startQuiz').addEventListener('click',()=>show(course === 'sexual' ? 'quizStep' : 'confirmStep'));
  $('backVideo')?.addEventListener('click',()=>show('trainingStep'));
  $('backQuiz').addEventListener('click',()=>show(course === 'sexual' ? 'quizStep' : 'trainingStep'));
  $('reviewVideo').addEventListener('click',()=>show('trainingStep'));
  $('toConfirm')?.addEventListener('click',()=>{ if(passed) show('confirmStep'); });
  check.addEventListener('change',canSubmit);
  if (quizForm) {
  quizForm.addEventListener('change',event=>{
    if (!event.target.matches('input[type="radio"]')) return;
    passed = false;
    $('toConfirm').hidden = true;
    check.checked = false;
    canSubmit();
    const box = event.target.closest('fieldset');
    box.classList.remove('is-wrong','is-right');
    box.querySelector('.explanation').hidden = true;
    $('quizFeedback').textContent = '답안을 변경했습니다. 정답 확인을 다시 눌러 주세요.';
    $('quizFeedback').className = '';
  });
  quizForm.addEventListener('submit',event=>{
    event.preventDefault();
    let correct = 0;
    let firstWrong = null;
    questions.forEach((q,i)=>{
      const inputs = [...quizForm.querySelectorAll('input[name="q'+i+'"]')];
      const selected = inputs.find(input=>input.checked);
      const right = selected?.value === q.answer;
      if (right) correct++;
      const box = $('question'+i);
      box.classList.toggle('is-right',right);
      box.classList.toggle('is-wrong',!right);
      const explanation = $('explanation'+i);
      explanation.textContent = (right?'정답입니다. ':'다시 확인해 주세요. ') + q.explanation + ' (영상 '+q.time+')';
      explanation.hidden = false;
      if (!right) { inputs.forEach(input=>input.checked=false); firstWrong ||= inputs[0]; }
    });
    passed = correct === questions.length;
    $('quizFeedback').textContent = passed ? '5문항 모두 정답입니다. 이수확인으로 이동해 주세요.' : correct+' / 5문항 정답입니다. 해설을 보고 틀린 문항에 다시 답해 주세요.';
    $('quizFeedback').className = passed ? 'success' : 'error';
    $('toConfirm').hidden = !passed;
    check.checked = false;
    canSubmit();
    if(firstWrong) firstWrong.focus();
  });

  }

  function showResult() {
    const courses = [
      {code:'sexual',name:'성희롱 예방교육',url:'sexual-harassment.html'},
      {code:'disability',name:'장애인 인식개선교육',url:'disability-awareness.html'}
    ];
    if(employee.privacyEligible) courses.push({code:'privacy',name:'개인정보보호교육',url:'privacy.html'});
    const missing = courses.filter(c=>!employee.completed?.[c.code]);
    $('resultHeading').textContent = missing.length ? '2026년 법정 의무교육 '+missing.length+'과목이 남았습니다.' : '수고하셨습니다! 2026년 의무교육 수강이 완료되었습니다.';
    $('resultIntro').textContent = missing.length ? employee.name+' 님은 '+missing.map(c=>c.name).join(', ')+'을(를) 이수하지 않았습니다.' : employee.name+' 님의 대상 교육 '+courses.length+'과목이 모두 이수 완료되었습니다.';
    $('resultCourses').innerHTML = courses.map(c=>{
      const done = !!employee.completed?.[c.code];
      return '<div class="course-result"><div><strong>'+c.name+'</strong><span>'+(done?'이수 완료':'미이수')+'</span></div>'+(done?'<span class="primary completed-course">교육 수강 완료</span>':'<a class="primary" href="'+c.url+'">교육 수강하기</a>')+'</div>';
    }).join('');
    $('reminderNotice').hidden = !missing.length;
    show('resultStep');
  }

  $('completionForm').addEventListener('submit',async event=>{
    event.preventDefault();
    if (!passed || !check.checked || submitting || saved) return;
    submitting = true;
    canSubmit();
    submit.textContent = '제출 중…';
    $('submitFeedback').className = '';
    $('submitFeedback').textContent = '본인 확인 정보로 이수기록을 저장하고 있습니다.';
    try {
      const result = await window.MobiisAuth.api({action:'complete',token:employee.token,course,quizScore:course === 'sexual' ? 5 : '',confirmed:'Y'});
      if(!result?.ok) throw new Error(result?.message || '이수기록을 저장하지 못했습니다.');
      saved = true;
      // complete 성공 응답으로 확인한 과목만 갱신합니다.
      employee.completed = {...employee.completed,[course]:true};
      sessionStorage.setItem('mobiisEduSession',JSON.stringify(employee));
      try {
        const latest = await window.MobiisAuth.validate();
        if(latest) employee = latest;
      } catch (_) { /* 성공 응답으로 확인한 이수기록은 유지합니다. */ }
      showResult();
    } catch (err) {
      // 응답이 늦어도 이미 저장된 기록이 있으면 중복 제출 없이 결과를 표시합니다.
      let latest;
      try { latest = await window.MobiisAuth.validate(); } catch (_) {}
      if(latest?.completed?.[course]) {
        employee = latest;
        saved = true;
        showResult();
      } else {
        $('submitFeedback').textContent = err.message === 'TIMEOUT' || err.message === 'NETWORK_ERROR' ? '서버 연결을 확인하지 못했습니다. 잠시 후 제출을 다시 눌러 주세요.' : err.message;
        $('submitFeedback').className = 'error';
      }
    } finally {
      submitting = false;
      submit.textContent = '이수확인 제출';
      canSubmit();
    }
  });
  if(saved) showResult();
})();
