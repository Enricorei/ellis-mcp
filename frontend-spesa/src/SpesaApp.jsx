import React, { useState, useEffect } from 'react'

// ── Palette colori per categoria ─────────────────────────────────────────────
const CAT_COLORS = {
  'Salute e Benessere':     '#00843D',
  'Spesa e Alimentari':     '#2196F3',
  'Utenze e Bollette':      '#FF9800',
  'Casa e Condominio':      '#9C27B0',
  'Prelievi':               '#607D8B',
  'Tempo Libero e Cultura': '#f9a825',
  'Trasporti':              '#E91E63',
  'Altro':                  '#90A4AE',
}

const CAT_EMOJI = {
  'Salute e Benessere':     '💊',
  'Spesa e Alimentari':     '🛒',
  'Utenze e Bollette':      '⚡',
  'Casa e Condominio':      '🏠',
  'Prelievi':               '💵',
  'Tempo Libero e Cultura': '🎭',
  'Trasporti':              '🚌',
  'Altro':                  '📦',
}

const FALLBACK = {
  sintesi: {
    totale_entrate: 3300.00,
    totale_uscite:  695.00,
    periodo:        'Ultimi 2 mesi',
  },
  riepilogo_per_categoria: [
    { categoria: 'Spesa e Alimentari',     totale_speso: 249.90, conteggio_transazioni: 3, percentuale: 35.9 },
    { categoria: 'Salute e Benessere',     totale_speso: 199.60, conteggio_transazioni: 3, percentuale: 28.7 },
    { categoria: 'Utenze e Bollette',      totale_speso: 190.70, conteggio_transazioni: 2, percentuale: 27.4 },
    { categoria: 'Prelievi',              totale_speso: 250.00, conteggio_transazioni: 2, percentuale: 35.9 },
    { categoria: 'Tempo Libero e Cultura', totale_speso:  82.00, conteggio_transazioni: 2, percentuale: 11.8 },
  ],
  ultime_transazioni: [
    { id: 'tx_001', data: '2026-05-24', esercente: 'Farmacia Comunale Milano',    categoria: 'Salute e Benessere',     importo: -34.50 },
    { id: 'tx_002', data: '2026-05-23', esercente: 'Supermercato Esselunga',      categoria: 'Spesa e Alimentari',     importo: -89.40 },
    { id: 'tx_003', data: '2026-05-20', esercente: 'ENEL Energia S.p.A.',         categoria: 'Utenze e Bollette',      importo: -78.20 },
    { id: 'tx_004', data: '2026-05-18', esercente: 'ATM Filiale Intesa Sanpaolo', categoria: 'Prelievi',               importo: -150.00 },
    { id: 'tx_009', data: '2026-05-02', esercente: 'Libreria Feltrinelli',        categoria: 'Tempo Libero e Cultura', importo: -28.00 },
  ],
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatEuro(n) {
  return new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n))
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

function getColor(cat) {
  return CAT_COLORS[cat] || '#90A4AE'
}

function getEmoji(cat) {
  return CAT_EMOJI[cat] || '📦'
}

// ── Donut chart SVG ──────────────────────────────────────────────────────────
const R = 58
const CX = 70
const CY = 70
const CIRCUMFERENCE = 2 * Math.PI * R
const GAP = 3  // gap in px tra segmenti

function DonutChart({ categorie, totale }) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])

  // Calcola i segmenti
  let offset = 0
  // Ruota di -90° (parte dall'alto)
  const startAngle = -90

  const segments = categorie.map((cat) => {
    const pct     = cat.percentuale / 100
    const dash    = Math.max(0, pct * CIRCUMFERENCE - GAP)
    const space   = CIRCUMFERENCE - dash
    const seg     = { ...cat, dash, space, offset }
    offset += pct * CIRCUMFERENCE
    return seg
  })

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 140 140" className="donut-svg">
        {/* Track grigio */}
        <circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke="#f0f0f0"
          strokeWidth="14"
        />
        {/* Segmenti */}
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={getColor(seg.categoria)}
            strokeWidth="14"
            strokeDasharray={`${animated ? seg.dash : 0} ${CIRCUMFERENCE}`}
            strokeDashoffset={-(seg.offset) + CIRCUMFERENCE * 0.25}
            strokeLinecap="butt"
            style={{ transition: `stroke-dasharray 0.8s ease ${i * 0.1}s` }}
          />
        ))}
        {/* Testo centrale */}
        <text x={CX} y={CY - 8} textAnchor="middle" className="donut-label-main">
          € {formatEuro(totale)}
        </text>
        <text x={CX} y={CY + 10} textAnchor="middle" className="donut-label-sub">
          uscite
        </text>
      </svg>
    </div>
  )
}

// ── Riga categoria ────────────────────────────────────────────────────────────
function CatRow({ cat, maxSpeso, index }) {
  const [w, setW] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setW(cat.percentuale), 150 + index * 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="cat-row">
      <div className="cat-row-top">
        <div className="cat-left">
          <span className="cat-dot" style={{ background: getColor(cat.categoria) }} />
          <span className="cat-emoji">{getEmoji(cat.categoria)}</span>
          <span className="cat-name">{cat.categoria}</span>
        </div>
        <div className="cat-right">
          <span className="cat-amount">€ {formatEuro(cat.totale_speso)}</span>
          <span className="cat-pct">{cat.percentuale}%</span>
        </div>
      </div>
      <div className="cat-bar-track">
        <div
          className="cat-bar-fill"
          style={{
            width: `${w}%`,
            background: getColor(cat.categoria),
            transition: `width 0.7s ease ${index * 0.08}s`,
          }}
        />
      </div>
    </div>
  )
}

// ── Riga transazione ─────────────────────────────────────────────────────────
function TxRow({ tx }) {
  return (
    <div className="tx-row">
      <div className="tx-icon" style={{ background: getColor(tx.categoria) + '18', color: getColor(tx.categoria) }}>
        {getEmoji(tx.categoria)}
      </div>
      <div className="tx-body">
        <p className="tx-esercente">{tx.esercente}</p>
        <p className="tx-meta">{tx.categoria} · {formatDate(tx.data)}</p>
      </div>
      <div className="tx-importo">− € {formatEuro(tx.importo)}</div>
    </div>
  )
}

// ── App principale ────────────────────────────────────────────────────────────
export default function SpesaApp() {
  const [data, setData]     = useState(null)
  const [tab, setTab]       = useState('categorie') // categorie | transazioni

  useEffect(() => {
    let received = false

    function applyData(payload) {
      if (received) return
      const d = payload?.structuredContent ?? payload?.result ?? payload
      if (d?.sintesi !== undefined) {
        received = true
        setData(d)
      }
    }

    function onMessage(event) {
      try {
        const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        if (msg?.method === 'ui/notifications/tool-result') applyData(msg.params)
        if (msg?.method === 'notifications/message' && msg?.params?.structuredContent) applyData(msg.params)
      } catch {}
    }
    window.addEventListener('message', onMessage)

    function onOpenAIGlobals(e) {
      const g = e?.detail?.globals
      if (g?.toolOutput) applyData(g.toolOutput)
    }
    window.addEventListener('openai-set-globals', onOpenAIGlobals, { passive: true })

    const poll = setInterval(() => {
      try { const out = window?.openai?.toolOutput; if (out) applyData(out) } catch {}
    }, 200)

    const fallback = setTimeout(() => { if (!received) { received = true; setData(FALLBACK) } }, 2000)

    return () => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('openai-set-globals', onOpenAIGlobals)
      clearInterval(poll)
      clearTimeout(fallback)
    }
  }, [])

  if (!data) {
    return (
      <div className="sp-root">
        <div className="sp-header">
          <span className="sp-title">Le mie spese</span>
          <span className="sp-periodo skeleton-inline" style={{ width: 80 }} />
        </div>
        <div className="sp-body">
          <div className="skeleton-block" style={{ height: 160, borderRadius: 16, marginBottom: 16 }} />
          <div className="skeleton-block" style={{ height: 200, borderRadius: 16 }} />
        </div>
      </div>
    )
  }

  const { sintesi, riepilogo_per_categoria: categorie, ultime_transazioni: transazioni } = data
  const maxSpeso = Math.max(...categorie.map(c => c.totale_speso))

  return (
    <div className="sp-root">

      {/* ── Header ── */}
      <div className="sp-header">
        <div>
          <p className="sp-title">Le mie spese</p>
          <p className="sp-periodo">{sintesi.periodo}</p>
        </div>
        <div className="sp-sintesi-chip">
          <span className="sp-entrate">↑ € {formatEuro(sintesi.totale_entrate)}</span>
          <span className="sp-uscite">↓ € {formatEuro(sintesi.totale_uscite)}</span>
        </div>
      </div>

      <div className="sp-body">

        {/* ── Donut + legenda ── */}
        <div className="donut-section">
          <DonutChart categorie={categorie} totale={sintesi.totale_uscite} />
          <div className="donut-legend">
            {categorie.slice(0, 4).map((c, i) => (
              <div key={i} className="legend-item">
                <span className="legend-dot" style={{ background: getColor(c.categoria) }} />
                <span className="legend-name">{c.categoria.split(' e ')[0]}</span>
                <span className="legend-pct">{c.percentuale}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="tabs">
          <button
            className={`tab ${tab === 'categorie' ? 'tab--active' : ''}`}
            onClick={() => setTab('categorie')}
          >
            Per categoria
          </button>
          <button
            className={`tab ${tab === 'transazioni' ? 'tab--active' : ''}`}
            onClick={() => setTab('transazioni')}
          >
            Ultime operazioni
          </button>
        </div>

        {/* ── Contenuto tab ── */}
        {tab === 'categorie' && (
          <div className="cat-list">
            {categorie.map((cat, i) => (
              <CatRow key={cat.categoria} cat={cat} maxSpeso={maxSpeso} index={i} />
            ))}
          </div>
        )}

        {tab === 'transazioni' && (
          <div className="tx-list">
            {transazioni.filter(t => t.importo < 0).map((tx, i) => (
              <TxRow key={tx.id || i} tx={tx} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
