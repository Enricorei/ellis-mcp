import React, { useState, useEffect } from 'react'
import ISLogoSVG from './ISLogoSVG.jsx'

// ── Dati di fallback per sviluppo ────────────────────────────────────────────
const FALLBACK = {
  cliente_nome: 'Giuseppe',
  cliente_cognome: 'Russo',
  saldo: 1450.20,
  conto_numero: '•••• •••• •••• 4321',
  prodotti_in_possesso: 3,
  prossima_scadenza: {
    destinatario: 'Assicurazione Auto',
    importo: 320.00,
    data_scadenza: '2026-06-05',
    giorni_mancanti: 0,
  },
  spesa_mese_corrente: 695.00,
  num_promemoria_attivi: 3,
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatEuro(n) {
  return new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buongiorno'
  if (h < 18) return 'Buon pomeriggio'
  return 'Buonasera'
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })
}


// ── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="db-root">
      <div className="db-header">
        <ISLogoSVG height={22} white />
      </div>
      <div className="db-body">
        <div className="skeleton-block" style={{ height: 120, borderRadius: 16, marginBottom: 12 }} />
        <div className="skeleton-block" style={{ height: 80, borderRadius: 16, marginBottom: 12 }} />
        <div className="skeleton-block" style={{ height: 56, borderRadius: 12 }} />
      </div>
    </div>
  )
}

// ── Icone SVG inline ─────────────────────────────────────────────────────────
const Icon = {
  Bell: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  Wallet: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Grid: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Warning: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
}

// ── Azione rapida ─────────────────────────────────────────────────────────────
function QuickAction({ icon: Ic, label, prompt }) {
  const handleClick = async () => {
    try {
      if (window.openai?.sendFollowUpMessage) {
        await window.openai.sendFollowUpMessage({ prompt, scrollToBottom: true })
      }
    } catch {}
  }
  return (
    <button className="quick-action" onClick={handleClick}>
      <span className="quick-action-icon"><Ic /></span>
      <span className="quick-action-label">{label}</span>
    </button>
  )
}

// ── App principale ────────────────────────────────────────────────────────────
export default function DashboardApp() {
  const [data, setData] = useState(null)

  useEffect(() => {
    let received = false

    function applyData(payload) {
      if (received) return
      const d = payload?.structuredContent ?? payload?.result ?? payload
      if (d?.saldo !== undefined) {
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

  if (!data) return <Skeleton />

  const scadenza    = data.prossima_scadenza
  const isUrgente   = scadenza && scadenza.giorni_mancanti <= 3
  const dataOggi    = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="db-root">

      {/* ── Header ── */}
      <div className="db-header">
        <div className="db-header-left">
          <div>
            <ISLogoSVG height={20} white />
            <p className="db-greeting">{getGreeting()}, {data.cliente_nome}</p>
            <p className="db-date">{dataOggi}</p>
          </div>
        </div>
        {data.num_promemoria_attivi > 0 && (
          <div className="db-bell">
            <Icon.Bell />
            <span className="db-bell-badge">{data.num_promemoria_attivi}</span>
          </div>
        )}
      </div>

      <div className="db-body">

        {/* ── Card Saldo ── */}
        <div className="saldo-card">
          <div className="saldo-card-top">
            <div>
              <p className="saldo-label">Saldo disponibile</p>
              <p className="saldo-amount">€ {formatEuro(data.saldo)}</p>
            </div>
            <div className="saldo-wallet-icon"><Icon.Wallet /></div>
          </div>
          <div className="saldo-card-bottom">
            <span className="saldo-conto">Conto corrente {data.conto_numero}</span>
            <span className="saldo-spesa">Speso questo mese: <strong>€ {formatEuro(data.spesa_mese_corrente)}</strong></span>
          </div>
        </div>

        {/* ── Alert scadenza ── */}
        {scadenza && (
          <div className={`scadenza-card ${isUrgente ? 'scadenza-card--urgente' : ''}`}>
            <div className="scadenza-icon">
              {isUrgente ? <Icon.Warning /> : <Icon.Calendar />}
            </div>
            <div className="scadenza-body">
              <p className="scadenza-label">
                {isUrgente
                  ? scadenza.giorni_mancanti === 0 ? 'Scade oggi' : `Scade tra ${scadenza.giorni_mancanti} giorni`
                  : `Prossima scadenza · ${formatDate(scadenza.data_scadenza)}`}
              </p>
              <p className="scadenza-dest">{scadenza.destinatario}</p>
            </div>
            <div className="scadenza-importo">€ {formatEuro(scadenza.importo)}</div>
          </div>
        )}

        {/* ── Azioni rapide ── */}
        <div className="quick-actions-section">
          <p className="quick-actions-title">Cosa vuoi fare?</p>
          <div className="quick-actions-row">
            <QuickAction
              icon={Icon.Grid}
              label="Prodotti"
              prompt="Mostrami i prodotti consigliati per me."
            />
            <QuickAction
              icon={Icon.Calendar}
              label="Pagamenti"
              prompt="Mostrami i miei prossimi pagamenti in scadenza."
            />
            <QuickAction
              icon={Icon.User}
              label="Consulente"
              prompt="Vorrei essere contattato da un consulente Intesa Sanpaolo."
            />
          </div>
        </div>

      </div>
    </div>
  )
}
