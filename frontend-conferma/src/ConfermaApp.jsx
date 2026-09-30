import React, { useState, useEffect } from 'react'
import ISLogoSVG from './ISLogoSVG.jsx'

// ── Fallback per sviluppo ─────────────────────────────────────────────────────
const FALLBACK_BLOCCO = {
  tipo_azione:     'blocco_carta',
  titolo:          'Blocca carta',
  card_id:         'xme-debit',
  card_nome:       'XME Debit',
  card_numero:     '•••• •••• •••• 4321',
  motivo:          'smarrimento',
  token_conferma:  'dev-token-001',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatEuro(n) {
  return new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2 }).format(n)
}

// ── Icone SVG ─────────────────────────────────────────────────────────────────
const Icon = {
  Lock: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Sliders: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
      <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
      <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
      <line x1="17" y1="16" x2="23" y2="16"/>
    </svg>
  ),
  Warning: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Check: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  X: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Card: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
}

// ── Riga dettaglio ────────────────────────────────────────────────────────────
function DetailRow({ label, value, valueClass }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className={`detail-value ${valueClass || ''}`}>{value}</span>
    </div>
  )
}

// ── Riga cambio limite ────────────────────────────────────────────────────────
function LimitRow({ label, da, a }) {
  return (
    <div className="limit-row">
      <span className="limit-label">{label}</span>
      <div className="limit-change">
        <span className="limit-old">€ {formatEuro(da)}</span>
        <span className="limit-arrow"><Icon.ArrowRight /></span>
        <span className="limit-new">€ {formatEuro(a)}</span>
      </div>
    </div>
  )
}

// ── Stato finale ──────────────────────────────────────────────────────────────
function FinalState({ confermata, data }) {
  const isBlocko = data.tipo_azione === 'blocco_carta'
  return (
    <div className="final-state">
      <div className={`final-icon ${confermata ? 'final-icon--ok' : 'final-icon--cancel'}`}>
        {confermata ? <Icon.Check /> : <Icon.X />}
      </div>
      <p className="final-title">
        {confermata ? 'Operazione confermata' : 'Operazione annullata'}
      </p>
      <p className="final-sub">
        {confermata
          ? isBlocko
            ? `La carta ${data.card_nome} è stata bloccata.`
            : 'I limiti operativi sono stati aggiornati.'
          : 'Nessuna modifica è stata effettuata.'}
      </p>
    </div>
  )
}

// ── IS Logo strip ─────────────────────────────────────────────────────────────
function HeaderStrip({ isBlocco }) {
  return (
    <div className={`conf-header ${isBlocco ? 'conf-header--danger' : 'conf-header--default'}`}>
      <div className="conf-header-icon">
        {isBlocco ? <Icon.Lock /> : <Icon.Sliders />}
      </div>
      <div>
        <p className="conf-header-title">
          {isBlocco ? 'Blocco carta' : 'Modifica limiti operativi'}
        </p>
        <div className="conf-header-sub">
          <ISLogoSVG height={12} white />
          <span>Operazione sicura</span>
        </div>
      </div>
    </div>
  )
}

// ── App principale ────────────────────────────────────────────────────────────
export default function ConfermaApp() {
  const [data, setData]       = useState(null)
  const [esito, setEsito]     = useState(null)   // null | 'confermata' | 'annullata'
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let received = false

    function applyData(payload) {
      if (received) return
      const d = payload?.structuredContent ?? payload?.result ?? payload
      if (d?.tipo_azione !== undefined) {
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

    const fallback = setTimeout(() => { if (!received) { received = true; setData(FALLBACK_BLOCCO) } }, 2000)

    return () => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('openai-set-globals', onOpenAIGlobals)
      clearInterval(poll)
      clearTimeout(fallback)
    }
  }, [])

  const handleScelta = async (confermata) => {
    setLoading(true)
    const prompt = confermata
      ? buildPromptConferma(data)
      : `Ho annullato l'operazione. Non procedere con nessuna modifica. Token: ${data.token_conferma}`

    try {
      if (window.openai?.sendFollowUpMessage) {
        await window.openai.sendFollowUpMessage({ prompt, scrollToBottom: true })
      }
    } catch {}

    setEsito(confermata ? 'confermata' : 'annullata')
    setLoading(false)
  }

  if (!data) return <SkeletonCard />

  const isBlocco   = data.tipo_azione === 'blocco_carta'
  const isLimiti   = data.tipo_azione === 'modifica_limiti'
  const isDangerous = isBlocco

  if (esito) {
    return (
      <div className="conf-root">
        <div className="conf-card">
          <HeaderStrip isBlocco={isBlocco} />
          <FinalState confermata={esito === 'confermata'} data={data} />
        </div>
      </div>
    )
  }

  return (
    <div className="conf-root">
      <div className="conf-card">

        {/* ── Header ── */}
        <HeaderStrip isBlocco={isBlocco} />

        {/* ── Body ── */}
        <div className="conf-body">
          <p className="conf-question">Vuoi procedere con questa operazione?</p>

          {/* Riepilogo azione */}
          <div className="detail-box">
            {isBlocco && (
              <>
                <div className="detail-card-preview">
                  <div className="detail-card-icon"><Icon.Card /></div>
                  <div>
                    <p className="detail-card-nome">{data.card_nome}</p>
                    <p className="detail-card-numero">{data.card_numero}</p>
                  </div>
                </div>
                <div className="detail-divider" />
                <DetailRow label="Motivo blocco" value={data.motivo} />
                <DetailRow label="Stato dopo" value="BLOCCATA" valueClass="value--danger" />
              </>
            )}

            {isLimiti && (
              <>
                <LimitRow
                  label="Limite giornaliero"
                  da={data.limite_giornaliero_attuale}
                  a={data.limite_giornaliero_nuovo}
                />
                <div className="detail-divider" />
                <LimitRow
                  label="Limite mensile"
                  da={data.limite_mensile_attuale}
                  a={data.limite_mensile_nuovo}
                />
              </>
            )}
          </div>

          {/* Warning per azioni irreversibili */}
          {isDangerous && (
            <div className="warning-banner">
              <span className="warning-icon"><Icon.Warning /></span>
              <span>Questa operazione è <strong>irreversibile</strong>. La carta non potrà essere usata dopo il blocco.</span>
            </div>
          )}
        </div>

        {/* ── Bottoni ── */}
        <div className="conf-actions">
          <button
            className="btn-annulla"
            onClick={() => handleScelta(false)}
            disabled={loading}
          >
            Annulla
          </button>
          <button
            className={`btn-conferma ${isDangerous ? 'btn-conferma--danger' : ''}`}
            onClick={() => handleScelta(true)}
            disabled={loading}
          >
            {loading
              ? <span className="btn-spinner" />
              : isDangerous ? 'Sì, blocca carta' : 'Conferma'
            }
          </button>
        </div>

      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="conf-root">
      <div className="conf-card">
        <div className="skeleton-strip" />
        <div className="conf-body">
          <div className="skeleton-block" style={{ height: 16, width: '60%', borderRadius: 6, marginBottom: 16 }} />
          <div className="skeleton-block" style={{ height: 110, borderRadius: 12, marginBottom: 12 }} />
          <div className="skeleton-block" style={{ height: 40, borderRadius: 8 }} />
        </div>
        <div className="conf-actions">
          <div className="skeleton-block" style={{ height: 44, flex: 1, borderRadius: 8 }} />
          <div className="skeleton-block" style={{ height: 44, flex: 1, borderRadius: 8 }} />
        </div>
      </div>
    </div>
  )
}

// ── Costruisce il prompt di conferma per ChatGPT ──────────────────────────────
function buildPromptConferma(data) {
  if (data.tipo_azione === 'blocco_carta') {
    return `Confermato. Procedi a bloccare la carta ${data.card_nome} (ID: ${data.card_id}) per motivo: ${data.motivo}. Token conferma: ${data.token_conferma}`
  }
  if (data.tipo_azione === 'modifica_limiti') {
    return `Confermato. Aggiorna i limiti operativi: limite giornaliero ${data.limite_giornaliero_nuovo}€, limite mensile ${data.limite_mensile_nuovo}€. Token conferma: ${data.token_conferma}`
  }
  return `Operazione confermata. Token: ${data.token_conferma}`
}
