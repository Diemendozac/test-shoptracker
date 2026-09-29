// HTML de las cuatro superficies del prototipo 2B: landing, registro, wizard y pantalla final.
// Los componentes de datos (ScoreRing, PhaseBadge, gráfico de rank) replican el marcado y las
// reglas de components/dashboard/score-ring.tsx, components/tracker/phase-badge.tsx y
// components/tracker/rank-chart.tsx. En la fase 3 el mock tiene que importar esos componentes.

export function makeViews({ icon, logo }) {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

  // ─── Réplicas de componentes de la app ─────────────────────────────────────
  const PHASES = {
    Despegue: { cls: 'ph-despegue', icon: 'rocket' },
    Meseta: { cls: 'ph-meseta', icon: 'minus' },
    'Caída': { cls: 'ph-caida', icon: 'trending-down' },
    Rebote: { cls: 'ph-rebote', icon: 'refresh-cw' },
  }
  // PhaseBadge size="md": inline-flex items-center gap-1 rounded-full border font-medium px-2 py-0.5 text-xs, ícono h-3 w-3
  const phaseBadge = (phase, attrs = '') => `<span class="phase ${PHASES[phase].cls}" ${attrs}>${icon(PHASES[phase].icon, 'ph-ico')}<span>${phase}</span></span>`
  // ScoreRing size="md" (72 px): pista score-track, arco verde desde 65 y amarillo debajo (regla actual, D-1 pendiente)
  const R = 40, CIRC = 2 * Math.PI * R
  const scoreRing = (score, { id = '', size = 72 } = {}) => {
    const arc = (CIRC * score) / 100
    return `<span class="ring" style="--size:${size}px" ${id ? `id="${id}"` : ''} role="img" aria-label="Puntaje ${score} de 100">
      <svg viewBox="0 0 100 100" aria-hidden="true"><circle class="ring-track" cx="50" cy="50" r="${R}"/><circle class="ring-arc ${score >= 65 ? 'is-green' : ''}" cx="50" cy="50" r="${R}" stroke-dasharray="${arc.toFixed(1)} ${CIRC.toFixed(1)}"/></svg>
      <span class="ring-num">${score}</span></span>`
  }
  const sampleTag = (txt = 'Datos de ejemplo') => `<span class="sample-tag">${txt}</span>`
  const pending = (title, body, extra = '') => `<div class="pending" role="note" ${extra}><b>DATO REAL PENDIENTE</b>${body}</div>`

  // Ilustraciones de producto (stand-in hasta tener las fotos de Unframed, C1 del diagnóstico)
  const PRODUCT = {
    licuadora: '<rect x="30" y="14" width="40" height="12" rx="4" fill="#3F3A55"/><rect x="26" y="24" width="48" height="60" rx="14" fill="#D9E6F2"/><rect x="26" y="24" width="48" height="60" rx="14" fill="none" stroke="#B6C7D9" stroke-width="2"/><rect x="30" y="80" width="40" height="10" rx="3" fill="#3F3A55"/><path d="M40 60h20" stroke="#9BB3CB" stroke-width="3" stroke-linecap="round"/>',
    masajeador: '<path d="M22 60c0-22 12-36 28-36s28 14 28 36" fill="none" stroke="#C9CCD6" stroke-width="12" stroke-linecap="round"/><circle cx="22" cy="64" r="9" fill="#E8E2D6"/><circle cx="78" cy="64" r="9" fill="#E8E2D6"/>',
    soporte: '<circle cx="50" cy="44" r="20" fill="#2F3440"/><circle cx="50" cy="44" r="10" fill="#5B8DEF"/><rect x="46" y="62" width="8" height="22" rx="3" fill="#2F3440"/>',
    bandas: '<rect x="18" y="32" width="64" height="12" rx="6" fill="#A7B8A0"/><rect x="18" y="48" width="64" height="12" rx="6" fill="#D6C7A8"/><rect x="18" y="64" width="64" height="12" rx="6" fill="#4B4F58"/>',
  }
  const thumb = (key, cls = 'thumb') => `<span class="${cls}" aria-hidden="true"><svg viewBox="0 0 100 100">${PRODUCT[key]}</svg></span>`

  // ─── Mock del producto vivo (hero) ─────────────────────────────────────────
  const mock = `
  <figure class="mock" aria-labelledby="mock-cap">
    <div class="panel-bar mono">
      <span class="panel-title"><span class="live" aria-hidden="true"></span>seguimiento</span>
      ${sampleTag()}
    </div>
    <figcaption class="sr" id="mock-cap">Ejemplo con datos de ejemplo: una licuadora portátil que en 14 días pasa del puesto 38 al 6 del ranking de más vendidos de su tienda, con puntaje 73 y fase Despegue.</figcaption>
    <div class="mock-body" aria-hidden="true">
      <div class="m-head">
        ${thumb('licuadora')}
        <div class="m-title"><strong>Licuadora portátil recargable</strong><span>Tienda de ejemplo · <span class="tnum" id="m-day">día 1</span> de seguimiento</span></div>
      </div>
      <div class="chart" id="m-chart">
        <svg viewBox="0 0 300 120" preserveAspectRatio="none" class="chart-svg">
          <defs>
            <linearGradient id="m-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stop-color="var(--primary)" stop-opacity=".18"/><stop offset="95%" stop-color="var(--primary)" stop-opacity="0"/></linearGradient>
            <clipPath id="m-clip"><rect id="m-cliprect" x="0" y="-10" width="0" height="140"/></clipPath>
          </defs>
          <g clip-path="url(#m-clip)"><path id="m-area" fill="url(#m-grad)"/><path id="m-line" class="chart-line"/></g>
        </svg>
        <span class="chart-dot entry" id="m-entry"></span>
        <span class="chart-dot best" id="m-best"></span>
        <div class="y-ticks"><span>#1</span><span>#20</span><span>#40</span></div>
        <div class="x-ticks"><span id="m-x0"></span><span id="m-x1"></span></div>
      </div>
      <div class="m-stats">
        <div class="stat"><small>Rank hoy</small><b class="tnum" id="m-rank">#38</b><span class="from">entró en #38</span></div>
        ${scoreRing(18, { id: 'm-ring' })}
        <span id="m-phase">${phaseBadge('Meseta')}</span>
      </div>
    </div>
    <div class="panel-bar panel-foot mono" aria-hidden="true"><span>una foto del ranking por día</span><span class="tnum" id="m-count">01/14</span></div>
  </figure>`

  const DETECTIONS = [
    ['masajeador', 'Masajeador de cuello', 'Tienda de ejemplo C'],
    ['soporte', 'Soporte magnético para auto', 'Tienda de ejemplo D'],
    ['bandas', 'Bandas de resistencia', 'Tienda de ejemplo A'],
  ]
  const detections = `
  <div class="detections" aria-label="Detecciones de hoy, datos de ejemplo">
    <div class="panel-bar mono"><span class="panel-title">productos nuevos · hoy</span>${sampleTag('Ejemplo')}</div>
    <ul class="det-list" id="det-list">
      ${DETECTIONS.map(([k, n, s]) => `<li class="det-row">${thumb(k, 'thumb thumb-sm')}<span class="det-txt"><b>${n}</b><span>${s}</span></span><span class="new-chip">Nuevo</span></li>`).join('')}
    </ul>
  </div>`

  // ─── Landing ───────────────────────────────────────────────────────────────
  const nav = `
  <header class="nav">
    <div class="wrap nav-in">
      <a class="brand" href="#/" aria-label="Dropspy, inicio">${logo(26)}<span>dropspy</span></a>
      <nav class="nav-links" aria-label="Principal">
        <a href="#/" data-scroll="funciones">Cómo funciona</a>
        <a href="#/" data-scroll="planes">Planes</a>
      </nav>
      <div class="nav-cta">
        <a class="link-quiet" href="#/ingresar">Ingresar</a>
        <a class="btn btn-primary btn-sm" href="#/registro">Empieza gratis</a>
      </div>
    </div>
  </header>`

  const landing = `
  <div class="view" data-view="landing" hidden>
    <div class="grid-bg" aria-hidden="true"></div>
    ${nav}
    <main>
      <section class="hero">
        <div class="wrap hero-in">
          <div class="hero-copy">
            <span class="eyebrow mono"><span class="dot" aria-hidden="true"></span>Para dropshippers en LATAM · Shopify</span>
            <h1 tabindex="-1">Deja que <span class="hl">otros testeen</span> por ti.</h1>
            <p class="lead">Dropspy revisa cada día el ranking de más vendidos de las tiendas Shopify que sigues. Cuando un producto nuevo empieza a subir, lo ves: cuánto subió, su puntaje y en qué fase va.</p>
            <div class="cta-row">
              <a class="btn btn-primary" href="#/registro">Empieza gratis ${icon('arrow-right', 'arrow')}</a>
              <a class="btn btn-ghost" href="#/" data-scroll="funciones">Ver cómo funciona</a>
            </div>
            <p class="micro mono">7 días gratis · sin tarjeta de crédito</p>
          </div>
          <div class="hero-demo">
            <div class="radar" aria-hidden="true"><div class="sweep"></div></div>
            ${mock}
            ${detections}
          </div>
          <div class="hero-pending">${pending('', 'Cuántas tiendas sigue Dropspy hoy: un conteo fechado de la base de datos. Hasta tenerlo, no se publica ningún número de escala.')}</div>
        </div>
      </section>

      <section class="section" id="funciones" aria-labelledby="h-funciones">
        <div class="wrap">
          <span class="kicker mono reveal">// cómo funciona</span>
          <h2 id="h-funciones" class="reveal" style="--d:1">Cada mañana, lo que se movió en tus tiendas.</h2>
          <p class="sub reveal" style="--d:2">Sigues las tiendas que compiten contigo. Dropspy guarda una foto diaria de su ranking de más vendidos y te muestra qué productos nuevos están subiendo.</p>
          <div class="cards">
            <article class="card reveal" style="--d:0">
              <div class="card-top"><span class="idx mono">01 · tiendas</span>${sampleTag('Ejemplo')}</div>
              <div class="viz" aria-hidden="true">
                <div class="store-row"><span class="favicon">T</span><span class="store-txt"><b>tienda-de-ejemplo.com</b><span>48 productos · seguida desde hoy</span></span></div>
              </div>
              <h3>Sigues las tiendas que compiten contigo</h3>
              <p>Agregas su dominio y Dropspy empieza a revisarlas. De 15 a 100 tiendas, según el plan.</p>
            </article>
            <article class="card reveal" style="--d:1">
              <div class="card-top"><span class="idx mono">02 · ranking</span>${sampleTag('Ejemplo')}</div>
              <div class="viz" aria-hidden="true">
                <svg class="spark" viewBox="0 0 200 64" preserveAspectRatio="none"><polyline points="0,58 16,56 32,59 48,50 64,45 80,40 96,33 112,27 128,22 144,17 160,13 176,10 200,7"/></svg>
                <span class="spark-lbl mono">#38 → #6 en 14 días</span>
              </div>
              <h3>Una foto diaria del ranking</h3>
              <p>Cada día se guarda el ranking de más vendidos de cada tienda: ves si un producto sube, se estanca o cae.</p>
            </article>
            <article class="card reveal" style="--d:2">
              <div class="card-top"><span class="idx mono">03 · puntaje</span>${sampleTag('Ejemplo')}</div>
              <div class="viz viz-score" aria-hidden="true">
                ${scoreRing(73, { size: 56 })}
                <div class="bars">
                  <div class="bar"><span>Crecimiento</span><span>50 %</span><b class="track"><i style="--w:.5"></i></b></div>
                  <div class="bar"><span>Posición</span><span>30 %</span><b class="track"><i style="--w:.3"></i></b></div>
                  <div class="bar"><span>Constancia</span><span>20 %</span><b class="track"><i style="--w:.2"></i></b></div>
                </div>
              </div>
              <h3>Un puntaje que se explica</h3>
              <p>De 0 a 100, con los pesos a la vista: cuánto creció, en qué puesto está y si mejora de forma constante.</p>
            </article>
            <article class="card reveal" style="--d:3">
              <div class="card-top"><span class="idx mono">04 · fase</span></div>
              <div class="viz viz-phases" aria-hidden="true">
                ${phaseBadge('Despegue')}${phaseBadge('Meseta')}${phaseBadge('Caída')}${phaseBadge('Rebote')}
              </div>
              <h3>La fase del ciclo</h3>
              <p>Despegue, meseta, caída o rebote: sabes si todavía hay ventana para entrar.</p>
            </article>
          </div>
        </div>
      </section>

      <section class="section section-plans" id="planes" aria-labelledby="h-planes">
        <div class="wrap">
          <span class="kicker mono reveal">// planes</span>
          <h2 id="h-planes" class="reveal" style="--d:1">Empieza con 7 días gratis.</h2>
          <p class="sub reveal" style="--d:2">Sin tarjeta de crédito. Después eliges el plan según cuántas tiendas quieres seguir.</p>
          <div class="plans">
            ${[
              ['Básico', '15 tiendas', '150 testeos', '30 días de historial', 'Tus tiendas suman al pool de la comunidad'],
              ['Pro', '40 tiendas', '500 testeos', '90 días de historial', 'Tus tiendas son privadas'],
              ['Agency', '100 tiendas', 'Testeos ilimitados', '1 año de historial', 'Tus tiendas son privadas'],
            ].map(([n, a, b, c, d], i) => `
            <article class="plan reveal" style="--d:${i}">
              <h3>${n}</h3>
              <ul><li><b>${a}</b></li><li>${b}</li><li>${c}</li><li class="plan-priv">${d}</li></ul>
            </article>`).join('')}
          </div>
          <p class="plans-foot reveal"><a class="link" href="#/" data-external="/pricing">Ver precios</a> <span class="subtle">· precios en COP, pago con Mercado Pago</span></p>
        </div>
      </section>

      <section class="section section-cta" aria-labelledby="h-cta">
        <div class="wrap cta-band reveal">
          <h2 id="h-cta">Empieza a seguir tus tiendas hoy.</h2>
          <a class="btn btn-primary" href="#/registro">Empieza gratis ${icon('arrow-right', 'arrow')}</a>
          <p class="micro mono">7 días gratis · sin tarjeta de crédito</p>
        </div>
      </section>
    </main>
    <footer class="footer">
      <div class="wrap footer-in">
        <span class="brand brand-sm">${logo(20)}<span>dropspy</span></span>
        ${pending('', 'Privacidad, términos y contacto: faltan los textos reales. Hasta tenerlos no se enlazan.')}
      </div>
    </footer>
  </div>`

  // ─── Registro e ingreso ────────────────────────────────────────────────────
  const field = (id, label, type, ph, auto, hint = '') => `
    <div class="field" id="f-${id}">
      <label for="${id}">${label}</label>
      <div class="input-wrap">
        <input id="${id}" name="${id}" type="${type}" placeholder="${ph}" autocomplete="${auto}" aria-describedby="${id}-err${hint ? ` ${id}-hint` : ''}">
        ${type === 'password' ? `<button type="button" class="eye" aria-label="Mostrar contraseña" aria-pressed="false" data-eye="${id}">${icon('eye')}</button>` : ''}
      </div>
      ${hint ? `<small class="hint" id="${id}-hint">${hint}</small>` : ''}
      <small class="err" id="${id}-err" aria-live="polite"></small>
    </div>`

  const auth = `
  <div class="view" data-view="auth" hidden>
    <div class="grid-bg" aria-hidden="true"></div>
    <header class="nav nav-min">
      <div class="wrap nav-in">
        <a class="brand" href="#/" aria-label="Dropspy, inicio">${logo(26)}<span>dropspy</span></a>
        <a class="link-quiet" href="#/">${icon('arrow-left', 'arrow-l')} Volver al inicio</a>
      </div>
    </header>
    <main class="wrap auth-in">
      <div class="auth-side">
        <span class="kicker mono">// tu cuenta</span>
        <h2 class="auth-side-h">Tu radar empieza con la primera tienda que agregues.</h2>
        <ul class="facts">
          <li>${icon('check', 'fact-ico')}7 días gratis, sin tarjeta de crédito</li>
          <li>${icon('check', 'fact-ico')}Una foto diaria del ranking de cada tienda</li>
          <li>${icon('check', 'fact-ico')}De 15 a 100 tiendas, según el plan</li>
        </ul>
        <div class="side-mock" aria-hidden="true">
          <div class="panel-bar mono"><span class="panel-title">seguimiento</span>${sampleTag()}</div>
          <div class="side-row">${thumb('licuadora')}<span class="det-txt"><b>Licuadora portátil recargable</b><span>#38 → #6 en 14 días</span></span></div>
          <div class="side-stats">${scoreRing(73, { size: 48 })}${phaseBadge('Despegue')}</div>
        </div>
      </div>
      <div class="auth-card">
        <div class="tabs" role="tablist" aria-label="Cuenta">
          <button type="button" role="tab" id="tab-signup" aria-selected="true" aria-controls="auth-form">Crear cuenta</button>
          <button type="button" role="tab" id="tab-login" aria-selected="false" aria-controls="auth-form" tabindex="-1">Iniciar sesión</button>
        </div>
        <form id="auth-form" role="tabpanel" aria-labelledby="tab-signup" novalidate>
          <h1 id="auth-title" tabindex="-1">Crea tu cuenta</h1>
          <p class="hint-lead" id="auth-lead">7 días gratis. Sin tarjeta de crédito.</p>
          ${field('name', 'Nombre completo', 'text', 'Cómo te llamas', 'name')}
          ${field('email', 'Correo electrónico', 'email', 'tu@correo.com', 'email')}
          ${field('password', 'Contraseña', 'password', 'Mínimo 8 caracteres', 'new-password', 'Al menos 8 caracteres.')}
          <button class="btn btn-primary w-full" type="submit" id="auth-submit"><span id="auth-submit-txt">Crear cuenta</span> ${icon('arrow-right', 'arrow')}</button>
          <p class="auth-note" id="auth-note" hidden>En la app, esto abre tu dashboard. El recorrido del prototipo sigue por <a href="#/registro">Crear cuenta</a>.</p>
          <div id="auth-pending">${pending('', 'Términos de servicio y política de privacidad (textos reales). Sin ellos, el registro no puede decir "aceptas nuestros términos".')}</div>
        </form>
      </div>
    </main>
  </div>`

  // ─── Wizard ────────────────────────────────────────────────────────────────
  const COUNTRIES = [['Colombia', '+57'], ['México', '+52'], ['Chile', '+56'], ['Perú', '+51'], ['Ecuador', '+593'], ['Paraguay', '+595'], ['Panamá', '+507'], ['Otro', '']]
  const NICHES = ['Belleza & Cuidado', 'Hogar & Cocina', 'Mascotas', 'Deportes & Fitness', 'Tecnología & Gadgets', 'Moda & Accesorios', 'Jardín & Exterior', 'Bebés & Niños', 'Herramientas & Auto', 'Salud & Bienestar', 'Joyería & Relojes', 'Juguetes & Entretenimiento', 'Otro']
  const PLATFORMS = ['Shopify', 'TikTok Shop', 'WooCommerce', 'Amazon', 'Otro']
  const OBJECTIVES = [['scale', 'Escalar lo que ya funciona'], ['reduce_losses', 'Reducir pérdidas al testear productos malos'], ['start', 'Recién estoy empezando'], ['diversify', 'Diversificar hacia nuevos nichos']]

  // Grupo de opciones: radio (una) o multi (varias, con aria-pressed)
  const group = (key, label, options, { multi = false, cols = '', hint = '' } = {}) => `
    <fieldset class="q stagger" data-key="${key}" data-multi="${multi}">
      <legend>${label}</legend>
      ${hint ? `<p class="q-hint" id="${key}-hint">${hint}</p>` : ''}
      <div class="opts ${cols}" ${multi ? '' : `role="radiogroup" aria-label="${esc(label)}"`}>
        ${options.map(([v, l]) => multi
          ? `<button type="button" class="opt chip" aria-pressed="false" data-value="${esc(v)}">${esc(l)}</button>`
          : `<button type="button" class="opt" role="radio" aria-checked="false" tabindex="-1" data-value="${esc(v)}">${esc(l)}</button>`).join('')}
      </div>
      <small class="err" id="${key}-err" aria-live="polite"></small>
    </fieldset>`

  const steps = [
    {
      title: 'Cuéntanos de ti',
      lead: 'Cuatro pasos cortos para configurar tu cuenta.',
      body: group('country', '¿Desde qué país vendes?', COUNTRIES.map(([c]) => [c, c]), { cols: 'opts-2' }) +
        group('soloOrTeam', '¿Operas solo o con un equipo?', [['solo', 'Solo'], ['equipo', 'Con un equipo']], { cols: 'opts-2' }),
    },
    {
      title: 'Tu negocio',
      lead: 'Así te mostramos primero lo que te sirve.',
      body: group('businessModel', '¿Cómo vendes?', [['pago_anticipado', 'Pago anticipado'], ['contra_entrega', 'Contra entrega']], { cols: 'opts-2' }) +
        group('objective', 'Objetivo principal ahora mismo', OBJECTIVES),
    },
    {
      title: 'Qué vendes',
      lead: 'Elige todos los que apliquen.',
      body: group('niches', 'Nichos en los que operas', NICHES.map(n => [n, n]), { multi: true }) +
        group('platforms', 'Plataformas que usas', PLATFORMS.map(p => [p, p]), { multi: true }),
    },
    {
      title: 'Tu contacto',
      lead: 'El último paso.',
      body: `
      <div class="q stagger field" id="f-phone">
        <label for="phone">Teléfono</label>
        <div class="phone-row"><span class="prefix" id="phone-prefix" aria-hidden="true">+57</span><input id="phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="300 123 4567" aria-describedby="phone-hint phone-err"></div>
        <small class="hint" id="phone-hint">Obligatorio. <span id="phone-prefix-note">Con el indicativo de tu país.</span></small>
        <small class="err" id="phone-err" aria-live="polite"></small>
      </div>
      <label class="q stagger check"><input type="checkbox" id="optin"><span class="check-box" aria-hidden="true">${icon('check')}</span><span>Acepto que me contacten por teléfono o WhatsApp sobre oportunidades de productos.</span></label>
      <div class="q stagger">${pending('', 'Política de tratamiento de datos (Ley 1581 de 2012 y Decreto 1377 de 2013) antes de pedir el teléfono. El texto lo redacta asesoría legal, no el prototipo.')}</div>`,
    },
  ]

  const wizard = `
  <div class="view" data-view="wizard" hidden>
    <header class="wiz-top">
      <div class="wrap-narrow wiz-top-in">
        <span class="brand">${logo(24)}<span>dropspy</span></span>
        <span class="wiz-count mono" id="wiz-count">Paso 1 de 4</span>
      </div>
      <div class="wrap-narrow">
        <div class="progress" role="progressbar" aria-label="Progreso de la configuración" aria-valuemin="1" aria-valuemax="4" aria-valuenow="1"><i id="wiz-bar"></i></div>
      </div>
    </header>
    <main class="wrap-narrow wiz-main">
      <form class="wiz-card" id="wiz-form" novalidate>
        ${steps.map((s, i) => `
        <section class="wiz-step" data-step="${i + 1}" hidden aria-labelledby="wiz-h-${i + 1}">
          <h1 class="stagger" id="wiz-h-${i + 1}" tabindex="-1">${s.title}</h1>
          <p class="wiz-lead stagger">${s.lead}</p>
          ${s.body}
        </section>`).join('')}
        <div class="wiz-actions">
          <button type="button" class="btn btn-ghost" id="wiz-back">${icon('arrow-left', 'arrow-l')} Atrás</button>
          <button type="submit" class="btn btn-primary" id="wiz-next"><span id="wiz-next-txt">Continuar</span> ${icon('arrow-right', 'arrow')}</button>
        </div>
      </form>
    </main>
  </div>`

  // ─── Pantalla final: entrada al dashboard (tema claro) ─────────────────────
  const final = `
  <div class="view" data-view="final" hidden>
    <header class="wiz-top">
      <div class="wrap-narrow wiz-top-in"><span class="brand">${logo(24)}<span>dropspy</span></span><span class="wiz-count mono">Listo</span></div>
      <div class="wrap-narrow"><div class="progress" aria-hidden="true"><i style="transform:scaleX(1)"></i></div></div>
    </header>
    <main class="wrap-narrow final-main">
      <div class="final-head stagger">
        <span class="done-ico" aria-hidden="true">${icon('check')}</span>
        <h1 id="final-title" tabindex="-1">Todo listo.</h1>
        <p class="wiz-lead">Tu cuenta quedó configurada. Tu radar empieza con la primera tienda que agregues.</p>
      </div>
      <section class="final-card stagger" aria-labelledby="h-next">
        <h2 id="h-next">Así empieza tu dashboard</h2>
        <div class="empty-preview" aria-label="Vista previa del dashboard vacío">
          ${icon('store', 'empty-ico')}
          <p>No tienes tiendas registradas aún.</p>
          <span class="btn btn-outline btn-sm" aria-hidden="true">${icon('plus')} Agregar primera tienda</span>
        </div>
      </section>
      <div class="stagger final-cta">
        <button type="button" class="btn btn-primary w-full" id="enter-dash">Entrar al dashboard ${icon('arrow-right', 'arrow')}</button>
        <p class="end-note" id="end-note" hidden>Aquí termina el prototipo. En la app, este botón abre tus tiendas con el formulario para agregar la primera. <a href="#/" data-restart>Ver el recorrido de nuevo</a></p>
      </div>
      <section class="final-card stagger" aria-labelledby="h-sum">
        <h2 id="h-sum">Lo que nos contaste</h2>
        <dl class="summary" id="summary"></dl>
      </section>
    </main>
  </div>`

  return { landing, auth, wizard, final, COUNTRIES }
}
