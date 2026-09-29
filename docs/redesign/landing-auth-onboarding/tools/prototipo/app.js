// Prototipo 2B: rutas, mock del producto vivo, registro y wizard. Sin dependencias.
(() => {
  const root = document.documentElement, body = document.body
  root.classList.add('js')
  const $ = (s, el = document) => el.querySelector(s)
  const $$ = (s, el = document) => [...el.querySelectorAll(s)]
  const T1 = 160, T3 = 240
  let reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

  // ─── Estado del recorrido ───────────────────────────────────────────────────
  const EMPTY = () => ({ country: '', soloOrTeam: '', businessModel: '', objective: '', niches: [], platforms: [], phone: '', phoneOptIn: false })
  const state = { name: '', answers: EMPTY() }
  const EXAMPLE = { country: 'Colombia', soloOrTeam: 'solo', businessModel: 'contra_entrega', objective: 'scale', niches: ['Hogar & Cocina', 'Mascotas'], platforms: ['Shopify'], phone: '300 123 4567', phoneOptIn: true }
  const STEP_KEYS = [['country', 'soloOrTeam'], ['businessModel', 'objective'], ['niches', 'platforms'], ['phone', 'phoneOptIn']]
  const PREFIX = window.__COUNTRIES__
  const LABELS = {
    soloOrTeam: { solo: 'Solo', equipo: 'Con un equipo' },
    businessModel: { pago_anticipado: 'Pago anticipado', contra_entrega: 'Contra entrega' },
    objective: { scale: 'Escalar lo que ya funciona', reduce_losses: 'Reducir pérdidas al testear productos malos', start: 'Recién estoy empezando', diversify: 'Diversificar hacia nuevos nichos' },
  }

  const toast = (msg) => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2600) }

  // ─── Rutas (hash, para que funcione con doble clic) ────────────────────────
  let current = { view: null, step: 0 }
  function parse() {
    const h = location.hash.replace(/^#/, '') || '/'
    let m
    if (h === '/registro') return { view: 'auth', mode: 'signup', stage: 'dark' }
    if (h === '/ingresar') return { view: 'auth', mode: 'login', stage: 'dark' }
    if ((m = h.match(/^\/bienvenida\/([1-4])$/))) return { view: 'wizard', step: +m[1], stage: 'paso-' + m[1] }
    if (h === '/listo') return { view: 'final', stage: 'final' }
    return { view: 'landing', stage: 'dark' }
  }

  function showView(r) {
    $$('.view').forEach(v => { v.hidden = v.dataset.view !== r.view })
    body.dataset.stage = r.stage
    body.classList.toggle('theme-anim', r.view === 'wizard' || r.view === 'final')
  }

  function render() {
    const r = parse(), prev = current
    current = { view: r.view, step: r.step || 0 }
    if (r.view === 'wizard' && prev.view === 'wizard' && prev.step && prev.step !== r.step) return swapStep(prev.step, r.step, r.stage)
    showView(r)
    scrollTo(0, 0)
    if (r.view === 'landing') { mockStart(); $('h1', $('[data-view="landing"]')).focus({ preventScroll: true }) } else mockStop()
    if (r.view === 'auth') { setMode(r.mode); $('#auth-title').focus({ preventScroll: true }) }
    if (r.view === 'wizard') { syncWizard(); showStep(r.step); enter($(`.wiz-step[data-step="${r.step}"]`)); $(`#wiz-h-${r.step}`).focus({ preventScroll: true }) }
    if (r.view === 'final') { renderFinal(); enter($('[data-view="final"] .final-main')); $('#final-title').focus({ preventScroll: true }) }
  }
  addEventListener('hashchange', render)

  // Entrada escalonada: cada .stagger entra 200 ms, 60 ms después del anterior
  function enter(container) {
    if (!container) return
    const items = $$('.stagger', container)
    items.forEach((el, i) => el.style.setProperty('--i', i))
    if (reduced) return
    container.classList.add('is-entering')
    void container.offsetWidth
    requestAnimationFrame(() => container.classList.remove('is-entering'))
  }

  // Cambio de paso: sale el actual (160 ms), el fondo se aclara (240 ms) y entra el siguiente
  function swapStep(from, to, stage) {
    const out = $(`.wiz-step[data-step="${from}"]`), inn = $(`.wiz-step[data-step="${to}"]`)
    syncWizard()
    const go = () => {
      out.classList.remove('is-leaving')
      body.dataset.stage = stage
      showStep(to)
      enter(inn)
      scrollTo(0, 0)
      $(`#wiz-h-${to}`).focus({ preventScroll: true })
    }
    if (reduced) return go()
    out.classList.add('is-leaving')
    setTimeout(go, T1)
  }

  // ─── Mock del producto vivo ────────────────────────────────────────────────
  const RANK = [38, 37, 39, 33, 29, 26, 21, 17, 14, 11, 9, 8, 7, 6]
  const SCORE = [18, 20, 19, 28, 35, 41, 49, 56, 61, 66, 69, 71, 72, 73]
  const N = RANK.length, W = 300, H = 120, MAXR = 40
  const pts = RANK.map((r, i) => [i * (W / (N - 1)), ((r - 1) / (MAXR - 1)) * H])
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic']
  const dayLabel = (i) => { const d = new Date(); d.setDate(d.getDate() - (N - 1 - i)); return `${d.getDate()} ${MESES[d.getMonth()]}` }

  // Curva monótona en X (la misma familia que type="monotone" de Recharts)
  function monotone(p) {
    const n = p.length, dx = [], dy = [], m = [], t = []
    for (let i = 0; i < n - 1; i++) { dx[i] = p[i + 1][0] - p[i][0]; dy[i] = p[i + 1][1] - p[i][1]; m[i] = dy[i] / dx[i] }
    t[0] = m[0]; t[n - 1] = m[n - 2]
    for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i])
    let d = `M${p[0][0]},${p[0][1]}`
    for (let i = 0; i < n - 1; i++) { const h = dx[i] / 3; d += ` C${p[i][0] + h},${p[i][1] + h * t[i]} ${p[i + 1][0] - h},${p[i + 1][1] - h * t[i + 1]} ${p[i + 1][0]},${p[i + 1][1]}` }
    return d
  }
  const linePath = monotone(pts)
  $('#m-line').setAttribute('d', linePath)
  $('#m-area').setAttribute('d', `${linePath} L${W},${H} L0,${H} Z`)
  $('#m-x0').textContent = dayLabel(0); $('#m-x1').textContent = dayLabel(N - 1)

  const CIRC = 2 * Math.PI * 40
  const PH = { Meseta: window.__PHASE__.Meseta, Despegue: window.__PHASE__.Despegue }
  let day = 0, timer = null, shownPhase = 'Meseta'

  function place(el, i) {
    const chart = $('#m-chart').getBoundingClientRect(), svg = $('#m-chart .chart-svg').getBoundingClientRect()
    if (!chart.width) return
    const x = svg.left - chart.left + (pts[i][0] / W) * svg.width, y = svg.top - chart.top + (pts[i][1] / H) * svg.height
    el.style.transform = `translate(${x}px, ${y}px)`
  }
  function draw(d) {
    $('#m-cliprect').setAttribute('width', String((d / (N - 1)) * W + 2))
    place($('#m-entry'), 0)
    let best = 0; for (let i = 0; i <= d; i++) if (RANK[i] < RANK[best]) best = i
    place($('#m-best'), best)
    $('#m-best').style.opacity = best === 0 ? '0' : '1'
    $('#m-day').textContent = `día ${d + 1}`
    $('#m-count').textContent = `${String(d + 1).padStart(2, '0')}/${N}`
    $('#m-rank').textContent = '#' + RANK[d]
    const arc = $('#m-ring .ring-arc'), s = SCORE[d]
    arc.setAttribute('stroke-dasharray', `${((CIRC * s) / 100).toFixed(1)} ${CIRC.toFixed(1)}`)
    arc.classList.toggle('is-green', s >= 65)
    $('#m-ring .ring-num').textContent = s
    $('#m-ring').setAttribute('aria-label', `Puntaje ${s} de 100`)
    const ph = d < 3 ? 'Meseta' : 'Despegue'
    if (ph !== shownPhase) { $('#m-phase').innerHTML = PH[ph]; if (!reduced) $('#m-phase .phase').classList.add('phase-pop'); shownPhase = ph }
  }
  function tick() {
    if (document.hidden || current.view !== 'landing') return
    if (day < N - 1) { day++; draw(day); timer = setTimeout(tick, 900) }
    else timer = setTimeout(() => {
      $('.mock-body').classList.add('fade')
      setTimeout(() => { day = 0; draw(0); $('.mock-body').classList.remove('fade'); timer = setTimeout(tick, 900) }, T3)
    }, 2400)
  }
  function mockStart() { clearTimeout(timer); if (reduced) return mockStatic(); day = 0; draw(0); timer = setTimeout(tick, 900); detStart() }
  function mockStop() { clearTimeout(timer); detStop() }
  function mockStatic() { clearTimeout(timer); detStop(); day = N - 1; draw(day) }
  addEventListener('resize', () => draw(day))
  document.addEventListener('visibilitychange', () => { if (!document.hidden && current.view === 'landing' && !reduced) { clearTimeout(timer); timer = setTimeout(tick, 900) } })

  // Detecciones: cada 3,6 s el último producto vuelve a entrar arriba (solo escritorio)
  let detTimer = null
  function detStart() {
    detStop()
    detTimer = setInterval(() => {
      if (reduced || document.hidden || current.view !== 'landing' || !matchMedia('(min-width: 900px)').matches) return
      const list = $('#det-list'), last = list.lastElementChild
      last.classList.add('enter'); list.prepend(last)
      requestAnimationFrame(() => requestAnimationFrame(() => last.classList.remove('enter')))
    }, 3600)
  }
  function detStop() { clearInterval(detTimer) }

  // Reveal al hacer scroll
  const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { rootMargin: '0px 0px -8% 0px' })
  $$('.reveal').forEach(e => io.observe(e))

  // ─── Bloque de escala ──────────────────────────────────────────────────────
  // window.__SCALE__ viene de build-prototipo.mjs. Mientras una cifra sea null, su casilla dice
  // "DATO REAL PENDIENTE". Con cifras, cuentan de 0 al valor en 700 ms al entrar en pantalla.
  const SCALE = Object.assign({ corte: null, desde: null, tiendas: null, productos: null, dias: null, paises: null }, window.__SCALE__ || {})
  const LATAM = ['AR', 'BO', 'BR', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'GT', 'HN', 'MX', 'NI', 'PA', 'PE', 'PR', 'PY', 'SV', 'UY', 'VE']
  const PRIORITY = ['CO', 'MX', 'CL', 'PE', 'EC'] // mercados que prioriza Dropspy (lista del onboarding), solo mientras no hay conteo
  const regionName = (() => { try { const d = new Intl.DisplayNames(['es'], { type: 'region' }); return c => d.of(c) } catch { return c => c } })()
  const fmtN = n => Math.round(n).toLocaleString('es-CO')
  const fmtDate = iso => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MESES[m - 1]} ${y}` }
  const PENDING_HTML = '<span class="stat-pending">DATO REAL PENDIENTE</span>'
  let scaleShown = false

  function countryRows() {
    if (!Array.isArray(SCALE.paises)) return PRIORITY.map(c => ({ name: regionName(c), n: null })).concat([{ name: 'Otros países', n: null }])
    const latam = SCALE.paises.filter(([c]) => LATAM.includes(c)).sort((a, b) => b[1] - a[1]).map(([c, n]) => ({ name: regionName(c), n }))
    const rest = SCALE.paises.filter(([c]) => !LATAM.includes(c)).reduce((t, [, n]) => t + n, 0)
    return rest ? latam.concat([{ name: 'Otros países', n: rest }]) : latam
  }
  function renderScale() {
    $$('[data-stat]').forEach(el => {
      const v = SCALE[el.dataset.stat]
      if (v == null) { el.innerHTML = PENDING_HTML; el.removeAttribute('data-to'); return }
      el.dataset.to = v
      el.textContent = scaleShown || reduced ? fmtN(v) : '0'
    })
    $('[data-stat-desde]').textContent = SCALE.desde ? `, desde el ${fmtDate(SCALE.desde)}` : ''
    $('#scale-cutoff').textContent = SCALE.corte ? `corte: ${fmtDate(SCALE.corte)}` : 'corte: pendiente'
    const rows = countryRows(), max = Math.max(1, ...rows.map(r => r.n || 0))
    $('#country-list').innerHTML = rows.map(r => `<li class="c-row${r.n == null ? ' is-pending' : ''}"><span class="c-name">${r.name}</span><span class="c-bar"><i style="--w:${r.n == null ? 0 : r.n / max}"></i></span><span class="c-val">${r.n == null ? 'pendiente' : fmtN(r.n)}</span></li>`).join('')
    $('#countries-note').hidden = Array.isArray(SCALE.paises)
    if (scaleShown || reduced) showScale(true)
  }
  function showScale(instant) {
    scaleShown = true
    $$('#country-list .c-bar i').forEach(i => { i.style.transform = `scaleX(${i.style.getPropertyValue('--w')})` })
    $$('[data-to]').forEach(el => {
      const to = +el.dataset.to
      if (instant || reduced) { el.textContent = fmtN(to); return }
      const t0 = performance.now()
      const step = t => { const p = Math.min(1, (t - t0) / 700); el.textContent = fmtN(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step) }
      requestAnimationFrame(step)
    })
  }
  new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { showScale(false); o.disconnect() } }), { rootMargin: '0px 0px -15% 0px' }).observe($('#scale'))
  renderScale()
  // Para probar el contador sin publicar cifras: la verificación llama a esto con valores de prueba
  window.__prototipo = { setScale(v) { Object.assign(SCALE, v); scaleShown = false; renderScale(); showScale(false) } }

  // Links internos de la landing y links fuera del prototipo
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-scroll]')
    if (a) {
      e.preventDefault()
      const go = () => $('#' + a.dataset.scroll).scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
      if (current.view !== 'landing') { location.hash = '#/'; setTimeout(go, 50) } else go()
      return
    }
    const x = e.target.closest('[data-external]')
    if (x) { e.preventDefault(); toast(`En la app abre ${x.dataset.external}`) }
    const sk = e.target.closest('[data-skip]')
    if (sk) { e.preventDefault(); const h = $('.view:not([hidden]) h1'); if (h) h.focus(); return }
    const rs = e.target.closest('[data-restart]')
    if (rs) { state.name = ''; state.answers = EMPTY(); syncWizard() }
  })

  // ─── Registro e ingreso ────────────────────────────────────────────────────
  let mode = 'signup'
  const PENDING = {
    signup: '<b>DATO REAL PENDIENTE</b>Términos de servicio y política de privacidad (textos reales). Sin ellos, el registro no puede decir "aceptas nuestros términos".',
    login: '<b>DATO REAL PENDIENTE</b>Un canal de soporte real para quien olvidó su contraseña: hoy el backend no tiene recuperación.',
  }
  function setMode(m) {
    mode = m
    const signup = m === 'signup'
    $('#tab-signup').setAttribute('aria-selected', String(signup)); $('#tab-signup').tabIndex = signup ? 0 : -1
    $('#tab-login').setAttribute('aria-selected', String(!signup)); $('#tab-login').tabIndex = signup ? -1 : 0
    $('#auth-form').setAttribute('aria-labelledby', signup ? 'tab-signup' : 'tab-login')
    $('#auth-title').textContent = signup ? 'Crea tu cuenta' : 'Bienvenido de vuelta'
    $('#auth-lead').textContent = signup ? '7 días gratis. Sin tarjeta de crédito.' : 'Entra con tu correo y tu contraseña.'
    $('#f-name').hidden = !signup
    $('#password-hint').hidden = !signup
    $('#password').autocomplete = signup ? 'new-password' : 'current-password'
    $('#auth-submit-txt').textContent = signup ? 'Crear cuenta' : 'Iniciar sesión'
    $('#auth-pending .pending').innerHTML = PENDING[m]
    $('#auth-note').hidden = true
    $$('#auth-form .err').forEach(e => (e.textContent = '')); $$('#auth-form input').forEach(i => i.removeAttribute('aria-invalid'))
  }
  $('#tab-signup').addEventListener('click', () => { location.hash = '#/registro' })
  $('#tab-login').addEventListener('click', () => { location.hash = '#/ingresar' })
  $$('[role="tab"]').forEach((t) => t.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const other = t.id === 'tab-signup' ? $('#tab-login') : $('#tab-signup'); other.focus(); other.click()
  }))
  $$('[data-eye]').forEach(b => b.addEventListener('click', () => {
    const inp = $('#' + b.dataset.eye), show = inp.type === 'password'
    inp.type = show ? 'text' : 'password'
    b.setAttribute('aria-pressed', String(show)); b.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña')
  }))
  function fieldError(id, msg) {
    const inp = $('#' + id), err = $('#' + id + '-err')
    err.textContent = msg || ''
    if (inp) msg ? inp.setAttribute('aria-invalid', 'true') : inp.removeAttribute('aria-invalid')
    return !msg
  }
  $('#auth-form').addEventListener('submit', (e) => {
    e.preventDefault()
    const name = $('#name').value.trim(), email = $('#email').value.trim(), pass = $('#password').value
    const checks = [
      mode === 'signup' ? fieldError('name', name ? '' : 'Escribe tu nombre.') : true,
      fieldError('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Escribe un correo válido, por ejemplo tu@correo.com.'),
      fieldError('password', pass.length >= 8 ? '' : mode === 'signup' ? 'La contraseña necesita al menos 8 caracteres.' : 'Escribe tu contraseña.'),
    ]
    const firstBad = ['name', 'email', 'password'].find((id, i) => !checks[i])
    if (firstBad) return $('#' + firstBad).focus()
    if (mode === 'login') { $('#auth-note').hidden = false; return }
    state.name = name
    location.hash = '#/bienvenida/1'
  })

  // ─── Wizard ────────────────────────────────────────────────────────────────
  function showStep(n) {
    $$('.wiz-step').forEach(s => { s.hidden = +s.dataset.step !== n })
    $('#wiz-count').textContent = `Paso ${n} de 4`
    $('#wiz-bar').style.transform = `scaleX(${n / 4})`
    $('.progress[role="progressbar"]').setAttribute('aria-valuenow', String(n))
    $('#wiz-back').hidden = n === 1 // la cuenta ya existe: no se vuelve al registro
    $('#wiz-next-txt').textContent = n === 4 ? 'Terminar' : 'Continuar'
    if (n === 4) updatePrefix()
  }
  function syncWizard() {
    const a = state.answers
    $$('.q[data-key]').forEach(q => {
      const key = q.dataset.key, multi = q.dataset.multi === 'true'
      const opts = $$('.opt', q)
      opts.forEach((o, i) => {
        const on = multi ? a[key].includes(o.dataset.value) : a[key] === o.dataset.value
        o.setAttribute(multi ? 'aria-pressed' : 'aria-checked', String(on))
        if (!multi) o.tabIndex = on || (!a[key] && i === 0) ? 0 : -1
      })
    })
    $('#phone').value = a.phone
    $('#optin').checked = a.phoneOptIn
  }
  function updatePrefix() {
    const p = PREFIX[state.answers.country] ?? '+57'
    $('#phone-prefix').hidden = !p
    $('#phone-prefix').textContent = p
    $('#phone-prefix-note').textContent = p ? `Indicativo de ${state.answers.country || 'Colombia'}: ${p}.` : 'Incluye el indicativo de tu país.'
  }
  $$('.q[data-key]').forEach(q => {
    const key = q.dataset.key, multi = q.dataset.multi === 'true'
    q.addEventListener('click', (e) => {
      const o = e.target.closest('.opt'); if (!o) return
      const v = o.dataset.value, a = state.answers
      if (multi) a[key] = a[key].includes(v) ? a[key].filter(x => x !== v) : [...a[key], v]
      else a[key] = v
      $('#' + key + '-err').textContent = ''
      syncWizard()
      if (!multi) o.focus()
    })
    if (!multi) q.addEventListener('keydown', (e) => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
      if (!(e.key in keys)) return
      e.preventDefault()
      const opts = $$('.opt', q), i = opts.indexOf(document.activeElement)
      const next = opts[(i + keys[e.key] + opts.length) % opts.length]
      next.click()
    })
  })
  $('#phone').addEventListener('input', (e) => { state.answers.phone = e.target.value; fieldError('phone', '') })
  $('#optin').addEventListener('change', (e) => { state.answers.phoneOptIn = e.target.checked })

  const MSG = { country: 'Elige tu país.', soloOrTeam: 'Elige una opción.', businessModel: 'Elige una opción.', objective: 'Elige tu objetivo principal.', niches: 'Elige al menos un nicho.', platforms: 'Elige al menos una plataforma.' }
  function validStep(n) {
    const a = state.answers
    let first = null
    for (const key of STEP_KEYS[n - 1]) {
      if (key === 'phoneOptIn') continue
      if (key === 'phone') {
        const ok = a.phone.replace(/\D/g, '').length >= 7
        fieldError('phone', ok ? '' : 'Escribe tu teléfono (al menos 7 dígitos).')
        if (!ok && !first) first = $('#phone')
        continue
      }
      const empty = Array.isArray(a[key]) ? a[key].length === 0 : !a[key]
      $('#' + key + '-err').textContent = empty ? MSG[key] : ''
      if (empty && !first) first = $(`.q[data-key="${key}"] .opt`)
    }
    if (first) first.focus()
    return !first
  }
  $('#wiz-form').addEventListener('submit', (e) => {
    e.preventDefault()
    const n = current.step
    if (!validStep(n)) return
    location.hash = n < 4 ? `#/bienvenida/${n + 1}` : '#/listo'
  })
  $('#wiz-back').addEventListener('click', () => { if (current.step > 1) location.hash = `#/bienvenida/${current.step - 1}` })

  // ─── Pantalla final ────────────────────────────────────────────────────────
  function renderFinal() {
    const a = state.answers, first = state.name.split(' ')[0]
    $('#final-title').textContent = first ? `Todo listo, ${first}.` : 'Todo listo.'
    const pre = PREFIX[a.country] ?? ''
    const rows = [
      ['País', a.country], ['Operas', LABELS.soloOrTeam[a.soloOrTeam]], ['Vendes', LABELS.businessModel[a.businessModel]],
      ['Objetivo', LABELS.objective[a.objective]], ['Nichos', a.niches.join(', ')], ['Plataformas', a.platforms.join(', ')],
      ['Teléfono', a.phone ? `${pre} ${a.phone}`.trim() : ''], ['WhatsApp', a.phone ? (a.phoneOptIn ? 'Aceptaste que te contacten' : 'No aceptaste que te contacten') : ''],
    ]
    $('#summary').innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v ? String(v).replace(/</g, '&lt;') : '—'}</dd></div>`).join('')
    $('#end-note').hidden = true
  }
  $('#enter-dash').addEventListener('click', () => { const n = $('#end-note'); n.hidden = false; n.setAttribute('tabindex', '-1'); n.focus() })

  // ─── Controles del prototipo ───────────────────────────────────────────────
  $$('[data-jump]').forEach(a => a.addEventListener('click', () => {
    const to = a.dataset.jump, m = to.match(/bienvenida\/(\d)/), upTo = to === '/listo' ? 4 : m ? +m[1] - 1 : 0
    if (upTo || to === '/listo') {
      state.name = state.name || 'Ana Gómez'
      state.answers = EMPTY()
      STEP_KEYS.slice(0, upTo).flat().forEach(k => { state.answers[k] = structuredClone(EXAMPLE[k]) })
    }
    a.closest('details').open = false
  }))
  const setMotion = (r) => {
    reduced = r; root.dataset.motion = r ? 'reduced' : 'full'
    $('#pt-motion').textContent = 'Movimiento: ' + (r ? 'reducido' : 'normal')
    if (r) { $$('.reveal').forEach(e => e.classList.add('in')); mockStatic() } else if (current.view === 'landing') mockStart()
  }
  $('#pt-motion').addEventListener('click', () => setMotion(!reduced))

  root.dataset.motion = reduced ? 'reduced' : 'full'
  if (reduced) $$('.reveal').forEach(e => e.classList.add('in'))
  $('#pt-motion').textContent = 'Movimiento: ' + (reduced ? 'reducido' : 'normal')
  render()
})()
