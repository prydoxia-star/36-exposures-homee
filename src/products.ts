type FilmViewportState = {
  viewport: HTMLDivElement
  track: HTMLDivElement
  firstStrip: HTMLDivElement
  direction: 1 | -1
  speed: number
  offset: number
  width: number
  dragging: boolean
  moved: boolean
  startX: number
  startOffset: number
  suppressClickUntil: number
  resizeObserver: ResizeObserver
}

const states: FilmViewportState[] = []

function normaliseOffset(state: FilmViewportState, next: number): number {
  if (!state.width) return next
  if (state.direction > 0) {
    while (next >= 0) next -= state.width
    while (next < -state.width) next += state.width
  } else {
    while (next <= -state.width) next += state.width
    while (next > 0) next -= state.width
  }
  return next
}

function setOffset(state: FilmViewportState, next: number) {
  state.offset = normaliseOffset(state, next)
  state.track.style.transform = `translate3d(${state.offset}px, 0, 0)`
}

function setupFilmRow(row: HTMLElement) {
  const viewport = row.querySelector<HTMLDivElement>('[data-film-viewport]')
  const track = row.querySelector<HTMLDivElement>('[data-film-track]')
  const firstStrip = row.querySelector<HTMLDivElement>('[data-film-strip="0"]')
  if (!viewport || !track || !firstStrip) return

  const state: FilmViewportState = {
    viewport,
    track,
    firstStrip,
    direction: row.dataset.direction === 'right' ? 1 : -1,
    speed: Number(row.dataset.speed) || 28,
    offset: 0,
    width: 0,
    dragging: false,
    moved: false,
    startX: 0,
    startOffset: 0,
    suppressClickUntil: 0,
    resizeObserver: new ResizeObserver(() => measure()),
  }
  function measure() {
    state.width = state.firstStrip.getBoundingClientRect().width
    setOffset(state, state.direction > 0 ? -state.width : 0)
  }
  measure()
  state.resizeObserver.observe(state.firstStrip)
  state.resizeObserver.observe(viewport)
  states.push(state)

  viewport.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return
    state.dragging = true
    state.moved = false
    state.startX = event.clientX
    state.startOffset = state.offset
    viewport.classList.add('is-dragging')
  })
  viewport.addEventListener('pointermove', (event) => {
    if (!state.dragging) return
    const delta = event.clientX - state.startX
    if (Math.abs(delta) > 4 && !state.moved) {
      state.moved = true
      viewport.setPointerCapture(event.pointerId)
    }
    setOffset(state, state.startOffset + delta)
  })
  const finishDrag = (event: PointerEvent) => {
    if (!state.dragging) return
    state.dragging = false
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId)
    viewport.classList.remove('is-dragging')
    if (state.moved) state.suppressClickUntil = performance.now() + 320
  }
  viewport.addEventListener('pointerup', finishDrag)
  viewport.addEventListener('pointercancel', finishDrag)
  viewport.addEventListener('lostpointercapture', () => {
    state.dragging = false
    viewport.classList.remove('is-dragging')
  })
  viewport.addEventListener('wheel', (event) => {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
    if (!delta) return
    event.preventDefault()
    setOffset(state, state.offset - delta * 0.8)
  }, { passive: false })
}

document.querySelectorAll<HTMLElement>('[data-catalogue-row]').forEach(setupFilmRow)

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
let previousTime = performance.now()
function animateFilm(now: number) {
  const delta = Math.min((now - previousTime) / 1000, 0.05)
  previousTime = now
  if (!reduceMotion && !document.hidden) {
    states.forEach((state) => {
      if (!state.dragging && state.width > 0) setOffset(state, state.offset + state.direction * state.speed * delta)
    })
  }
  requestAnimationFrame(animateFilm)
}
requestAnimationFrame(animateFilm)

function closeModal(modal: HTMLElement, previousOverflow: string, previousFocus: HTMLElement | null, escapeHandler: (event: KeyboardEvent) => void) {
  modal.remove()
  document.body.style.overflow = previousOverflow
  window.removeEventListener('keydown', escapeHandler)
  previousFocus?.focus()
}

function openProduct(card: HTMLButtonElement) {
  if (performance.now() < (Number(card.dataset.suppressClickUntil) || 0)) return
  const row = card.closest('[data-catalogue-row]')
  const viewport = row?.querySelector<HTMLElement>('[data-film-viewport]')
  const state = states.find((candidate) => candidate.viewport === viewport)
  if (state && performance.now() < state.suppressClickUntil) return

  const previousOverflow = document.body.style.overflow
  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const modal = document.createElement('div')
  modal.className = 'product-modal-backdrop'
  modal.innerHTML = `
    <section class="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
      <button class="product-modal-close" type="button" aria-label="Close product details">×</button>
      <div class="product-modal-image"><img src="${card.dataset.image}" alt="${card.dataset.alt}"></div>
      <div class="product-modal-copy">
        <p class="products-eyebrow">${card.dataset.type}</p>
        <h2 id="product-modal-title">${card.dataset.name}</h2>
        <p>${card.dataset.description}</p>
        <span class="product-modal-note">36 EXPOSURES · SINGAPORE</span>
      </div>
    </section>`
  document.body.append(modal)
  document.body.style.overflow = 'hidden'
  const closeButton = modal.querySelector<HTMLButtonElement>('.product-modal-close')
  const escape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close()
  }
  const close = () => closeModal(modal, previousOverflow, previousFocus, escape)
  closeButton?.focus()
  closeButton?.addEventListener('click', close)
  modal.addEventListener('mousedown', (event) => { if (event.target === modal) close() })
  window.addEventListener('keydown', escape)
}

document.addEventListener('click', (event) => {
  const target = event.target
  if (!(target instanceof Element)) return
  const card = target.closest<HTMLButtonElement>('.film-product-card')
  if (card) openProduct(card)
})
