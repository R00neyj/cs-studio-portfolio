(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return ESC_MAP[c]; }); };
  var won = function (n) { return n.toLocaleString('ko-KR') + '원'; };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Theme ---------------- */
  var root = document.documentElement;
  var THEME_KEY = 'csas-theme';
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function storedTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    $('#themeToggleLabel').textContent = theme === 'dark' ? '라이트 모드' : '다크 모드';
    $('#themeIconSun').toggleAttribute('hidden', theme !== 'dark');
    $('#themeIconMoon').toggleAttribute('hidden', theme === 'dark');
  }

  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  $('#themeToggleBtn').addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  });

  if (mq) {
    var onScheme = function (e) {
      var saved = storedTheme();
      if (saved !== 'dark' && saved !== 'light') applyTheme(e.matches ? 'dark' : 'light');
    };
    if (mq.addEventListener) mq.addEventListener('change', onScheme);
    else if (mq.addListener) mq.addListener(onScheme);
  }

  /* ---------------- Clipboard ---------------- */
  function copyText(text) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallback(); });
    }
    return Promise.resolve(fallback());
  }

  function setBtnLabel(btn, label) {
    var el = btn.querySelector('.btn-label');
    (el || btn).textContent = label;
  }

  function resetCopyBtn(btn, label) {
    clearTimeout(btn._copyTimer);
    btn.classList.remove('btn-copied');
    setBtnLabel(btn, label);
  }

  function flashCopied(btn, restoreLabel) {
    clearTimeout(btn._copyTimer);
    btn.classList.add('btn-copied');
    setBtnLabel(btn, '복사함');
    btn._copyTimer = setTimeout(function () {
      btn.classList.remove('btn-copied');
      setBtnLabel(btn, restoreLabel());
    }, 2000);
  }

  /* ---------------- Undo Toast ---------------- */
  var toastEl = $('#undoToast');
  var toastMsg = $('#undoToastMsg');
  var undoBtn = $('#undoBtn');
  var toast = { timer: null, deadline: 0, onUndo: null, onCommit: null, returnFocus: null };

  function toastTick() {
    var left = Math.max(0, Math.ceil((toast.deadline - Date.now()) / 1000));
    undoBtn.textContent = '되돌리기 (' + left + '초)';
    if (left <= 0) finishToast(true);
  }

  function finishToast(commit) {
    if (!toast.timer) return;
    clearInterval(toast.timer);
    toast.timer = null;
    var cb = commit ? toast.onCommit : toast.onUndo;
    var focusTarget = toast.returnFocus;
    var hadFocus = toastEl.contains(document.activeElement);
    toast.onUndo = null;
    toast.onCommit = null;
    toast.returnFocus = null;
    toastEl.classList.remove('visible');
    toastEl.setAttribute('aria-hidden', 'true');
    toastEl.setAttribute('inert', '');
    if (typeof cb === 'function') cb();
    if (hadFocus && focusTarget && !focusTarget.disabled) focusTarget.focus();
  }

  function showToast(message, onUndo, onCommit, returnFocus) {
    if (toast.timer) finishToast(true);
    toast.onUndo = onUndo;
    toast.onCommit = onCommit || null;
    toast.returnFocus = returnFocus || null;
    toast.deadline = Date.now() + 10000;
    toastMsg.textContent = message;
    toastEl.removeAttribute('inert');
    toastEl.setAttribute('aria-hidden', 'false');
    toastEl.classList.add('visible');
    toastTick();
    toast.timer = setInterval(toastTick, 250);
  }

  undoBtn.addEventListener('click', function () { finishToast(false); });

  /* ---------------- Data ---------------- */
  var INQUIRIES = [
    {
      id: 'q1',
      roles: ['dev'],
      room: '스튜디오 아크 (박민수 팀장)',
      company: '스튜디오 아크',
      person: '박민수',
      stage: '운영 · 퍼블리싱 완료',
      domain: 'studio-ark.co.kr',
      phone: '010-4821-9034',
      account: '110-492-883920 (신한)',
      accountNo: '110-492-883920',
      message: '안녕하세요! 저희 studio-ark.co.kr 메인 팝업 이미지랑 연혁 글자 수정하려고 하는데요, 박민수(010-4821-9034) 앞으로 진행 절차 안내 부탁드립니다.',
      templates: [
        {
          id: 'q1t1',
          score: 94,
          category: '운영 · 수정',
          title: '운영 — 자료 접수 후 수정 일정 안내',
          vars: { '고객사명': '스튜디오 아크', '도메인': 'studio-ark.co.kr', '소요기간': '영업일 기준 1~2일' },
          draft: '안녕하세요, {{고객사명}} 담당자님.\n요청해 주신 {{도메인}} 사이트 수정 건 확인했습니다.\n\n보내주신 팝업 이미지와 연혁 문구 반영은 {{소요기간}} 안으로 마친 뒤 다시 안내해 드리겠습니다.\n더 바꿀 곳이 있으시면 편하게 말씀해 주세요.',
          polished: '안녕하세요, {{고객사명}} 담당자님.\n말씀해 주신 {{도메인}} 사이트의 메인 팝업 이미지 교체와 연혁 문구 수정 요청을 확인했습니다.\n\n보내주신 자료대로 {{소요기간}} 안에 반영하고 다시 연락드리겠습니다.\n추가로 고칠 부분이 있으시면 언제든 말씀해 주세요. 감사합니다.'
        },
        {
          id: 'q1t2',
          score: 68,
          category: '운영 · 견적',
          title: '운영 — 유상 수정 입금 계좌 안내',
          vars: { '고객사명': '스튜디오 아크', '도메인': 'studio-ark.co.kr', '계좌정보': '110-492-883920 (신한)' },
          draft: '안녕하세요, {{고객사명}} 담당자님.\n문의하신 {{도메인}} 수정 범위 확인 후 안내드립니다.\n\n안내드린 내역으로 진행하시려면 {{계좌정보}}로 입금하신 뒤 말씀 부탁드립니다.',
          polished: '안녕하세요, {{고객사명}} 담당자님.\n요청하신 {{도메인}} 사이트의 작업 범위를 확인해 안내해 드립니다.\n\n안내드린 내용으로 진행을 원하시면 {{계좌정보}}로 입금하신 뒤 알려주시기 바랍니다. 확인하는 대로 바로 작업에 들어가겠습니다.'
        }
      ]
    },
    {
      id: 'q2',
      roles: ['dev', 'design'],
      room: '루멘 로보틱스 (최유진 선임)',
      company: '루멘 로보틱스',
      person: '최유진',
      stage: '디자인 시안 단계',
      domain: 'lumenrobotics.kr',
      phone: '010-7712-3309',
      account: '110-492-883920 (신한)',
      accountNo: '110-492-883920',
      message: '최유진(010-7712-3309)입니다. lumenrobotics.kr 서브 페이지 시안 확인했습니다! 레이아웃 컨펌 완료했고 다음 일정이 어떻게 되는지 궁금합니다.',
      templates: [
        {
          id: 'q2t1',
          score: 88,
          category: '제작 · 일정',
          title: '제작 — 디자인 컨펌 확인 및 퍼블리싱 일정 안내',
          vars: { '고객사명': '루멘 로보틱스', '도메인': 'lumenrobotics.kr', '소요기간': '영업일 기준 5~7일' },
          draft: '안녕하세요, {{고객사명}} 담당자님.\n{{도메인}} 서브 페이지 디자인 컨펌 확인했습니다.\n\n오늘부터 퍼블리싱 작업을 시작하며, 테스트 서버 반영까지 {{소요기간}} 걸릴 예정입니다.\n작업이 끝나는 대로 확인 주소를 전달드리겠습니다.',
          polished: '안녕하세요, {{고객사명}} 담당자님.\n{{도메인}} 서브 페이지의 디자인 시안 컨펌 내용을 확인했습니다.\n\n오늘 바로 퍼블리싱 작업에 들어가며, 테스트 서버에서 보실 수 있기까지 {{소요기간}} 정도 걸립니다.\n준비가 끝나는 대로 확인 링크를 보내드리겠습니다. 감사합니다.'
        }
      ]
    }
  ];

  var ROLE_NOTICE = {
    dev: '개발·퍼블리셔 보기: 퍼블리싱 완료 이후 사이트의 수정 문의와 견적 내기, 만료 안내를 모두 보여 줍니다.',
    design: '디자이너 보기: 견적 내기를 숨기고 시안·기획서 단계 문의와 디자이너 전달 건만 보여 줍니다.'
  };

  var QUOTE = {
    company: '스튜디오 아크',
    domain: 'studio-ark.co.kr',
    account: '110-492-883920 (신한)',
    items: [
      { name: '메인 팝업 이미지 교체', count: 1 },
      { name: '연혁 문구 수정', count: 2 },
      { name: '하단 배너 링크 변경', count: 1 }
    ]
  };

  var CHOICES = {
    '45000': { label: '4만5천원 (부가세 별도)', supply: 45000, vat: 4500 },
    '27500': { label: '2만5천원 (부가세 별도)', supply: 25000, vat: 2500 },
    '0': { label: '무상 처리 (퍼블리싱 마감 1개월 안)', supply: 0, vat: 0 }
  };

  var SUB_STATUS = {
    need: { label: '안내 필요', cls: 'badge badge-primary' },
    done: { label: '입금 대기 (안내 완료)', cls: 'badge badge-copied' },
    declined: { label: '연장 안 함 (모든 PC에서 숨김)', cls: 'badge' }
  };

  var SUBS = [
    {
      id: 's1', client: '스튜디오 아크', domain: 'studio-ark.co.kr', initialStatus: 'need', status: 'need',
      items: [
        { kind: '호스팅', plan: '비즈니스 호스팅 1년', price: 118000, dday: 'D-9' },
        { kind: 'SSL', plan: 'SSL 인증서 1년', price: 46000, dday: 'D-12' }
      ]
    },
    {
      id: 's2', client: '루멘 로보틱스', domain: 'lumenrobotics.kr', initialStatus: 'need', status: 'need',
      items: [
        { kind: '문자', plan: '홈페이지 문자 기능 1년 갱신', price: 93000, dday: 'D-5' }
      ]
    },
    {
      id: 's3', client: '한결 법률사무소', domain: 'hangyeol-law.kr', initialStatus: 'need', status: 'need',
      items: [
        { kind: '호스팅', plan: '기본 호스팅 1년', price: 84000, dday: 'D-13' },
        { kind: '문자', plan: '홈페이지 문자 기능 1년 갱신', price: 93000, dday: 'D-6' }
      ]
    }
  ];
  var ACCOUNT = '110-492-883920 (신한)';

  /* ---------------- State ---------------- */
  var state = {
    role: 'dev',
    tab: 'answer',
    inquiryId: 'q1',
    templateId: 'q1t1',
    vars: {},
    polished: false,
    maskOpen: true,
    answerStep: 1,
    quoteStep: 1,
    quotePrice: '45000',
    quoteDone: false,
    subId: 's1'
  };

  /* ---------------- Answer Tab ---------------- */
  function visibleInquiries() {
    return INQUIRIES.filter(function (q) { return q.roles.indexOf(state.role) !== -1; });
  }
  function curInquiry() {
    return INQUIRIES.filter(function (q) { return q.id === state.inquiryId; })[0];
  }
  function curTemplate() {
    var q = curInquiry();
    return q.templates.filter(function (t) { return t.id === state.templateId; })[0] || q.templates[0];
  }
  function fill(tpl, vars) {
    return tpl.replace(/\{\{([^}]+)\}\}/g, function (m, key) {
      return (vars[key] !== undefined && vars[key] !== '') ? vars[key] : m;
    });
  }

  function maskHTML(text, q) {
    var pairs = [
      [q.company, '[고객사1]'],
      [q.person, '[고객1]'],
      [q.domain, '[도메인1]'],
      [q.phone, '[연락처1]'],
      [q.accountNo, '[번호1]']
    ];
    if (state.vars['고객사명']) pairs.push([state.vars['고객사명'], '[고객사1]']);
    if (state.vars['도메인']) pairs.push([state.vars['도메인'], '[도메인1]']);
    pairs.sort(function (a, b) { return b[0].length - a[0].length; });

    var tokens = [];
    var out = text;
    pairs.forEach(function (p) {
      var raw = p[0], tok = p[1];
      if (!raw || raw.length < 2) return;
      var idx = tokens.indexOf(tok);
      if (idx < 0) { tokens.push(tok); idx = tokens.length - 1; }
      out = out.split(raw).join('\u0000' + idx + '\u0000');
    });
    // 정규식 보강: 사전에 없는 연락처/긴 번호
    out = out.replace(/01[0-9]-?\d{3,4}-?\d{4}/g, function () {
      var idx = tokens.indexOf('[연락처1]');
      if (idx < 0) { tokens.push('[연락처1]'); idx = tokens.length - 1; }
      return '\u0000' + idx + '\u0000';
    });
    out = esc(out);
    return out.replace(/\u0000(\d+)\u0000/g, function (m, i) {
      return '<span class="mask-token">' + esc(tokens[+i]) + '</span>';
    });
  }

  function renderGuide() {
    $$('#answerGuide .ux-guide-step').forEach(function (li) {
      var n = +li.getAttribute('data-step');
      li.classList.toggle('is-done', n < state.answerStep);
      li.classList.toggle('is-current', n === state.answerStep);
      if (n === state.answerStep) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
  }
  function setAnswerStep(n) {
    state.answerStep = n;
    renderGuide();
  }

  function renderInquiries() {
    $('#inquiryList').innerHTML = visibleInquiries().map(function (q) {
      var on = q.id === state.inquiryId;
      return '<button type="button" class="item-row' + (on ? ' active' : '') + '" data-inquiry="' + q.id + '"' + (on ? ' aria-current="true"' : '') + '>' +
        '<span class="item-row-head"><span class="item-title">' + esc(q.room) + '</span><span class="badge">' + esc(q.stage) + '</span></span>' +
        '<span class="item-sub">' + esc(q.message) + '</span>' +
        '<span class="item-meta font-mono">' + esc(q.domain) + ' · ' + esc(q.phone) + '</span>' +
        '</button>';
    }).join('');
  }

  function renderTemplates() {
    var q = curInquiry();
    $('#templateList').innerHTML = q.templates.map(function (t) {
      var on = t.id === state.templateId;
      return '<button type="button" class="item-row' + (on ? ' active' : '') + '" data-template="' + t.id + '"' + (on ? ' aria-current="true"' : '') + '>' +
        '<span class="item-row-head"><span class="item-title">' + esc(t.title) + '</span><span class="badge badge-primary">' + t.score + '점</span></span>' +
        '<span class="item-sub">' + esc(t.category) + '</span>' +
        '</button>';
    }).join('');
    var t = curTemplate();
    $('#matchScoreBadge').textContent = '대표 매칭 ' + t.score + '점';
    $('#answerTemplateTitle').textContent = t.title;
  }

  function renderFields() {
    var t = curTemplate();
    $('#varFields').innerHTML = Object.keys(t.vars).map(function (k, i) {
      var id = 'var-' + t.id + '-' + i;
      return '<div class="field-box"><label class="field-label" for="' + id + '">' + esc(k) + '</label>' +
        '<input class="input" id="' + id + '" data-var="' + esc(k) + '" value="' + esc(state.vars[k] || '') + '" autocomplete="off"></div>';
    }).join('');
  }

  function renderDraft() {
    var t = curTemplate();
    $('#answerDraftArea').value = fill(state.polished ? t.polished : t.draft, state.vars);
    var status = $('#draftStatus');
    status.textContent = state.polished ? 'AI로 다듬은 초안 (원래 값 복원 · 도메인·번호 확인)' : '템플릿으로 만든 초안';
    status.classList.toggle('is-polished', state.polished);
    $('#runPolishBtn').textContent = state.polished ? '원래 초안으로 되돌리기' : '초안 AI로 다듬기';
    resetCopyBtn($('#copyAnswerBtn'), '답변 복사');
  }

  function renderMask() {
    var q = curInquiry();
    var t = curTemplate();
    var draft = fill(t.draft, state.vars);
    $('#maskPrompt').innerHTML =
      esc('지시: 아래 초안을 마크다운 없이 합쇼체로 다듬고, 대괄호 자리표시는 그대로 두세요.') + '\n\n' +
      esc('고객 문의:') + '\n' + maskHTML(q.message, q) + '\n\n' +
      esc('다듬을 초안:') + '\n' + maskHTML(draft, q);
  }

  function renderMaskToggle() {
    $('#maskInspector').hidden = !state.maskOpen;
    var btn = $('#toggleMaskViewBtn');
    btn.textContent = state.maskOpen ? '가린 프롬프트 숨기기' : '가린 프롬프트 보기';
    btn.setAttribute('aria-expanded', String(state.maskOpen));
  }

  function selectTemplate(id) {
    state.templateId = id;
    var t = curTemplate();
    state.vars = {};
    Object.keys(t.vars).forEach(function (k) { state.vars[k] = t.vars[k]; });
    state.polished = false;
    renderTemplates();
    renderFields();
    renderDraft();
    renderMask();
  }

  function selectInquiry(id) {
    state.inquiryId = id;
    renderInquiries();
    selectTemplate(curInquiry().templates[0].id);
  }

  $('#inquiryList').addEventListener('click', function (e) {
    var row = e.target.closest('[data-inquiry]');
    if (!row) return;
    selectInquiry(row.getAttribute('data-inquiry'));
    setAnswerStep(2);
    var again = $('#inquiryList [data-inquiry="' + row.getAttribute('data-inquiry') + '"]');
    if (again) again.focus();
  });

  $('#templateList').addEventListener('click', function (e) {
    var row = e.target.closest('[data-template]');
    if (!row) return;
    var id = row.getAttribute('data-template');
    selectTemplate(id);
    setAnswerStep(2);
    var again = $('#templateList [data-template="' + id + '"]');
    if (again) again.focus();
  });

  $('#varFields').addEventListener('input', function (e) {
    var input = e.target.closest('[data-var]');
    if (!input) return;
    state.vars[input.getAttribute('data-var')] = input.value;
    renderDraft();
    renderMask();
    if (state.answerStep < 2) setAnswerStep(2);
  });

  $('#toggleMaskViewBtn').addEventListener('click', function () {
    state.maskOpen = !state.maskOpen;
    renderMaskToggle();
    if (state.answerStep < 2) setAnswerStep(2);
  });

  $('#runPolishBtn').addEventListener('click', function () {
    state.polished = !state.polished;
    renderDraft();
    setAnswerStep(state.polished ? 3 : 2);
  });

  $('#copyAnswerBtn').addEventListener('click', function () {
    var btn = this;
    copyText($('#answerDraftArea').value).then(function (ok) {
      if (!ok) return;
      flashCopied(btn, function () { return '답변 복사'; });
      setAnswerStep(4);
    });
  });

  /* ---------------- Quote Tab ---------------- */
  function quoteKinds() {
    return QUOTE.items.length;
  }
  function quoteCount() {
    return QUOTE.items.reduce(function (sum, it) { return sum + it.count; }, 0);
  }

  function renderQuoteItems() {
    var rows = QUOTE.items.map(function (it) {
      return '<div class="item-row item-row--static">' +
        '<div class="item-row-head"><span class="item-title">' + esc(it.name) + '</span><span class="badge">' + it.count + '건</span></div>' +
        '</div>';
    }).join('');
    rows += '<div class="item-row item-row--static price-total">' +
      '<div class="item-row-head"><span class="item-title">합계</span><span class="badge badge-primary">' + quoteCount() + '건</span></div>' +
      '<span class="item-sub">금액은 2단계에서 이사님 답으로 정합니다</span>' +
      '</div>';
    $('#quoteItemList').innerHTML = rows;
  }

  function quoteText(step) {
    var c = CHOICES[state.quotePrice];
    var total = c.supply + c.vat;
    var lines;
    if (step === 1) {
      lines = ['[수정 견적 보고] ' + QUOTE.company + ' · ' + QUOTE.domain,
        '첨부 사진 빨간 표시 기준 ' + quoteKinds() + '개 항목, 총 ' + quoteCount() + '건', ''];
      QUOTE.items.forEach(function (it) {
        lines.push('- ' + it.name + ' ' + it.count + '건');
      });
      lines.push('', '진행 금액 확인 부탁드립니다.');
      return lines.join('\n');
    }
    if (step === 2) {
      lines = ['이사님 답: ' + c.label];
      if (total === 0) lines.push('청구 금액: 0원 (퍼블리싱 마감 1개월 안 무상 처리)');
      else lines.push('청구 금액: ' + won(total) + ' (공급가 ' + won(c.supply) + ' + 부가세 ' + won(c.vat) + ')');
      return lines.join('\n');
    }
    lines = ['안녕하세요, ' + QUOTE.company + ' 담당자님.',
      '요청하신 ' + QUOTE.domain + ' 사이트 수정 건의 견적을 안내해 드립니다.', ''];
    QUOTE.items.forEach(function (it) { lines.push('- ' + it.name + ' ' + it.count + '건'); });
    lines.push('');
    if (total === 0) {
      lines.push('이번 수정은 퍼블리싱 마감 1개월 안에 요청해 주신 건이라 무상으로 처리해 드립니다.');
    } else {
      lines.push('견적 금액: ' + won(total) + ' (공급가 ' + won(c.supply) + ' + 부가세 ' + won(c.vat) + ')');
      lines.push('입금 계좌: ' + QUOTE.account);
    }
    lines.push('', '진행 여부를 알려주시면 일정을 맞춰 바로 반영해 드리겠습니다.');
    return lines.join('\n');
  }

  var QUOTE_COPY_LABEL = { 1: '보고 복사', 2: '이사님 답 복사', 3: '견적 안내 복사' };
  var QUOTE_BLOCK_LABEL = { 1: '이사님께 보내는 보고', 2: '이사님 답', 3: '고객에게 보내는 견적 안내' };

  function renderQuote() {
    var step = state.quoteStep;
    $$('#quoteStepTabs [data-qstep]').forEach(function (b) {
      var on = +b.getAttribute('data-qstep') === step;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      b.disabled = state.quoteDone && !on;
    });
    $('#quoteStepPanel').setAttribute('aria-labelledby', 'quoteStepTab' + step);

    $('#quoteChoiceBox').hidden = step !== 2;
    $$('#quoteChoiceRow [data-price]').forEach(function (chip) {
      var on = chip.getAttribute('data-price') === state.quotePrice;
      chip.setAttribute('aria-checked', String(on));
      chip.tabIndex = on ? 0 : -1;
      chip.disabled = state.quoteDone;
    });
    $('#warrantyNote').hidden = state.quotePrice !== '0';

    $('#quoteBlockLabel').textContent = QUOTE_BLOCK_LABEL[step];
    $('#quoteBlock').textContent = quoteText(step);

    var prev = $('#prevQuoteStepBtn');
    var next = $('#nextQuoteStepBtn');
    prev.disabled = step === 1 || state.quoteDone;
    next.textContent = step === 3 ? '완료' : '다음';
    next.disabled = state.quoteDone;

    resetCopyBtn($('#copyQuoteBlockBtn'), QUOTE_COPY_LABEL[step]);
  }

  $$('#quoteStepTabs [data-qstep]').forEach(function (b) {
    b.id = 'quoteStepTab' + b.getAttribute('data-qstep');
    b.addEventListener('click', function () {
      if (state.quoteDone) return;
      state.quoteStep = +b.getAttribute('data-qstep');
      renderQuote();
    });
  });

  $('#prevQuoteStepBtn').addEventListener('click', function () {
    if (state.quoteStep > 1) { state.quoteStep -= 1; renderQuote(); }
  });

  $('#nextQuoteStepBtn').addEventListener('click', function () {
    if (state.quoteStep < 3) {
      state.quoteStep += 1;
      renderQuote();
      return;
    }
    state.quoteDone = true;
    renderQuote();
    showToast(QUOTE.company + ' 견적 안내를 완료 처리했습니다.',
      function () { state.quoteDone = false; state.quoteStep = 3; renderQuote(); },
      function () { state.quoteDone = false; state.quoteStep = 1; state.quotePrice = '45000'; renderQuote(); },
      $('#nextQuoteStepBtn'));
  });

  function selectChip(chip, focus) {
    if (state.quoteDone) return;
    state.quotePrice = chip.getAttribute('data-price');
    renderQuote();
    if (focus) chip.focus();
  }

  $('#quoteChoiceRow').addEventListener('click', function (e) {
    var chip = e.target.closest('[data-price]');
    if (chip) selectChip(chip, false);
  });

  $('#quoteChoiceRow').addEventListener('keydown', function (e) {
    var keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
    if (keys.indexOf(e.key) === -1) return;
    e.preventDefault();
    var chips = $$('#quoteChoiceRow [data-price]');
    var i = chips.indexOf(document.activeElement);
    if (i < 0) i = 0;
    var dir = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
    selectChip(chips[(i + dir + chips.length) % chips.length], true);
  });

  $('#copyQuoteBlockBtn').addEventListener('click', function () {
    var btn = this;
    copyText($('#quoteBlock').textContent).then(function (ok) {
      if (!ok) return;
      flashCopied(btn, function () { return QUOTE_COPY_LABEL[state.quoteStep]; });
    });
  });

  /* ---------------- Subscription Tab ---------------- */
  function curSub() {
    return SUBS.filter(function (s) { return s.id === state.subId; })[0];
  }
  function subTotal(s) {
    return s.items.reduce(function (sum, it) { return sum + it.price; }, 0);
  }

  function subMessage(s) {
    var lines = ['안녕하세요, ' + s.client + ' 담당자님.',
      s.domain + ' 사이트에서 쓰고 계신 서비스 가운데 2주 안에 만료되는 항목을 함께 안내해 드립니다.', ''];
    s.items.forEach(function (it) {
      lines.push('- ' + it.kind + ': ' + it.plan + ' · ' + won(it.price) + ' (' + it.dday + ')');
    });
    lines.push('', '합계: ' + won(subTotal(s)) + ' (부가세 포함)', '입금 계좌: ' + ACCOUNT, '',
      '연장을 원하시면 입금 후 알려주세요. 만료일 전에 바로 연장해 드리겠습니다.');
    return lines.join('\n');
  }

  function renderSubs() {
    $('#subList').innerHTML = SUBS.map(function (s) {
      var on = s.id === state.subId;
      var st = SUB_STATUS[s.status];
      var summary = s.items.map(function (it) { return it.kind + ' ' + it.dday; }).join(' · ');
      return '<button type="button" class="item-row' + (on ? ' active' : '') + (s.status === 'declined' ? ' is-muted' : '') + '" data-sub="' + s.id + '"' + (on ? ' aria-current="true"' : '') + '>' +
        '<span class="item-row-head"><span class="item-title">' + esc(s.client) + '</span><span class="' + st.cls + '">' + esc(st.label) + '</span></span>' +
        '<span class="item-sub">' + esc(summary) + '</span>' +
        '<span class="item-meta font-mono">' + esc(s.domain) + '</span>' +
        '</button>';
    }).join('');

    var s = curSub();
    var st = SUB_STATUS[s.status];
    $('#subDetailTitle').textContent = s.client + ' · ' + s.domain;
    var badge = $('#subStatusBadge');
    badge.className = st.cls;
    badge.textContent = st.label;

    $('#subItemList').innerHTML = s.items.map(function (it) {
      return '<div class="item-row item-row--static">' +
        '<div class="item-row-head"><span class="item-title">' + esc(it.kind) + ' · ' + esc(it.plan) + '</span><span class="badge badge-warning">' + esc(it.dday) + '</span></div>' +
        '<span class="item-sub">' + won(it.price) + ' (부가세 포함)</span>' +
        '</div>';
    }).join('');

    $('#subMessage').textContent = subMessage(s);
    $('#subRecordDoneBtn').disabled = s.status === 'done';
    $('#subDeclineBtn').disabled = s.status === 'declined';
  }

  $('#subList').addEventListener('click', function (e) {
    var row = e.target.closest('[data-sub]');
    if (!row) return;
    state.subId = row.getAttribute('data-sub');
    renderSubs();
    var again = $('#subList [data-sub="' + state.subId + '"]');
    if (again) again.focus();
  });

  function setSubStatus(next, triggerBtn) {
    var s = curSub();
    if (!s || s.status === next) return;
    s.status = next;
    renderSubs();
    var label = SUB_STATUS[next].label;
    var particle = next === 'declined' ? '으로' : '로';
    showToast(s.client + ' 상태를 \'' + label + '\'' + particle + ' 바꿨습니다.', function () {
      s.status = s.initialStatus;
      state.subId = s.id;
      renderSubs();
    }, null, triggerBtn);
    if (triggerBtn.disabled) undoBtn.focus();
  }

  $('#subRecordDoneBtn').addEventListener('click', function () { setSubStatus('done', this); });
  $('#subDeclineBtn').addEventListener('click', function () { setSubStatus('declined', this); });

  /* ---------------- CLI Terminal ---------------- */
  var terminalPlayed = false;
  function playTerminal() {
    if (terminalPlayed) return;
    terminalPlayed = true;
    if (reduceMotion) return;
    var lines = $$('#cliTerminal .term-line');
    lines.forEach(function (l) { l.classList.add('is-pending'); });
    lines.forEach(function (l, i) {
      setTimeout(function () { l.classList.remove('is-pending'); }, 200 + i * 380);
    });
  }

  /* ---------------- Main Tabs ---------------- */
  var mainTabs = $$('.app-tabbar [role="tab"][data-tab]');

  function activateTab(name, focus) {
    mainTabs.forEach(function (b) {
      var on = b.getAttribute('data-tab') === name;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    $$('.workspace-body > .tab-panel').forEach(function (p) {
      p.hidden = p.id !== 'panel-' + name;
    });
    state.tab = name;
    if (name === 'cli') playTerminal();
  }

  mainTabs.forEach(function (b) {
    b.addEventListener('click', function () { activateTab(b.getAttribute('data-tab'), false); });
  });

  function tablistKeys(listEl, onPick) {
    listEl.addEventListener('keydown', function (e) {
      var keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
      if (keys.indexOf(e.key) === -1) return;
      var tabs = $$('[role="tab"]', listEl).filter(function (t) { return !t.hidden && !t.disabled; });
      if (!tabs.length) return;
      e.preventDefault();
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) i = 0;
      var n;
      if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = tabs.length - 1;
      else n = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      onPick(tabs[n]);
    });
  }

  tablistKeys($('.app-tabbar [role="tablist"]'), function (t) { activateTab(t.getAttribute('data-tab'), true); });
  tablistKeys($('#quoteStepTabs'), function (t) {
    state.quoteStep = +t.getAttribute('data-qstep');
    renderQuote();
    t.focus();
  });

  /* ---------------- Role ---------------- */
  function setRole(role) {
    state.role = role;
    $$('[data-role]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-role') === role));
    });
    $('#roleNoticeBadge').textContent = ROLE_NOTICE[role];
    var quoteTab = $('#tab-quote');
    quoteTab.hidden = role === 'design';
    if (role === 'design' && state.tab === 'quote') activateTab('answer', false);
    var list = visibleInquiries();
    selectInquiry(list[0].id);
    setAnswerStep(1);
  }

  $$('[data-role]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (state.role !== b.getAttribute('data-role')) setRole(b.getAttribute('data-role'));
    });
  });

  /* ---------------- Nav active link ---------------- */
  var navLinks = $$('.nav-link');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (l) {
          l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['flow', 'ipc', 'runtime', 'demo', 'engineering', 'specs'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  /* ---------------- Init ---------------- */
  setRole('dev');
  renderMaskToggle();
  renderGuide();
  renderQuoteItems();
  renderQuote();
  renderSubs();
  activateTab('answer', false);
})();
