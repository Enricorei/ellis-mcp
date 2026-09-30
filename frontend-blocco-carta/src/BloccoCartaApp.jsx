import React, { useState, useEffect } from 'react'
import ISLogoSVG from './ISLogoSVG.jsx'

const FALLBACK_DATA = {
  prodotti_in_possesso: [
    { id: 'xme-debit',    nome: 'XME Debit',    tipo: 'carta', numero: '•••• •••• •••• 4321', stato: 'ATTIVA' },
    { id: 'xme-card-plus',nome: 'XME Card Plus', tipo: 'carta', numero: '•••• •••• •••• 8765', stato: 'ATTIVA' },
  ],
}

const MOTIVI = [
  { id: 'smarrimento',    label: 'Smarrimento',     desc: 'Ho perso la carta' },
  { id: 'furto',          label: 'Furto',            desc: 'La carta mi è stata rubata' },
  { id: 'sospetto_frode', label: 'Sospetto frode',  desc: 'Movimenti non autorizzati' },
]

const Icon = {
  Lock: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Card: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  Check: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  CheckLg: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  X: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  Warning: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
}

function Stepper({ step }) {
  const steps = ['Seleziona', 'Motivo', 'Conferma']
  return (
    <div className="bc-stepper">
      {steps.map((label, i) => {
        const n = i + 1
        const isActive = step === n
        const isDone   = step > n
        return (
          <React.Fragment key={n}>
            {i > 0 && <div className="bc-step-line" />}
            <div className={`bc-step ${isActive ? 'bc-step--active' : ''} ${isDone ? 'bc-step--done' : ''}`}>
              <div className="bc-step-dot">
                {isDone ? <Icon.Check /> : n}
              </div>
              <span>{label}</span>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

function FinalState({ confermata, carta, motivo }) {
  const motivoLabel = MOTIVI.find(m => m.id === motivo)?.label || motivo
  return (
    <div className="bc-final">
      <div className={`bc-final-icon ${confermata ? 'bc-final-icon--ok' : 'bc-final-icon--cancel'}`}>
        {confermata ? <Icon.CheckLg /> : <Icon.X />}
      </div>
      <p className="bc-final-title">
        {confermata ? 'Carta bloccata' : 'Operazione annullata'}
      </p>
      <p className="bc-final-sub">
        {confermata
          ? `La carta ${carta?.nome} (${carta?.numero}) è stata bloccata per ${motivoLabel.toLowerCase()}.`
          : 'Nessuna modifica è stata effettuata.'}
      </p>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bc-root">
      <div className="bc-card">
        <div className="bc-skeleton-strip" />
        <div className="bc-body">
          <div className="bc-skeleton-block" style={{ height: 14, width: '50%', borderRadius: 6 }} />
          <div className="bc-skeleton-block" style={{ height: 64, borderRadius: 10 }} />
          <div className="bc-skeleton-block" style={{ height: 64, borderRadius: 10 }} />
        </div>
        <div className="bc-actions">
          <div className="bc-skeleton-block" style={{ flex: 1, height: 46, borderRadius: 8 }} />
        </div>
      </div>
    </div>
  )
}

export default function BloccoCartaApp() {
  const [data, setData]         = useState(null)
  const [step, setStep]         = useState(1)
  const [cartaId, setCartaId]   = useState(null)
  const [motivo, setMotivo]     = useState(null)
  const [esito, setEsito]       = useState(null)
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    let received = false

    function applyData(payload) {
      if (received) return
      const d = payload?.structuredContent ?? payload?.result ?? payload
      if (Array.isArray(d?.prodotti_in_possesso)) {
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

    const fallback = setTimeout(() => {
      if (!received) { received = true; setData(FALLBACK_DATA) }
    }, 2000)

    return () => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('openai-set-globals', onOpenAIGlobals)
      clearInterval(poll)
      clearTimeout(fallback)
    }
  }, [])

  if (!data) return <SkeletonCard />

  const carte = (data.prodotti_in_possesso || []).filter(p => p.tipo === 'carta')
  const cartaSelezionata = carte.find(c => c.id === cartaId)

  const handleConferma = async (confermata) => {
    setLoading(true)
    const carta = cartaSelezionata
    const motivoLabel = MOTIVI.find(m => m.id === motivo)?.label || motivo

    try {
      if (window.openai?.sendFollowUpMessage) {
        const prompt = confermata
          ? `Confermato. Procedi a bloccare la carta ${carta.nome} (ID: ${carta.id}) per motivo: ${motivoLabel}. Token conferma: ${Math.random().toString(36).slice(2,10)}`
          : `Ho annullato il blocco carta. Non procedere con nessuna modifica.`
        await window.openai.sendFollowUpMessage({ prompt, scrollToBottom: true })
      }
    } catch {}

    setEsito(confermata ? 'confermata' : 'annullata')
    setLoading(false)
  }

  if (esito) {
    return (
      <div className="bc-root">
        <div className="bc-card">
          <div className="bc-header">
            <div className="bc-header-icon"><Icon.Lock /></div>
            <div>
              <p className="bc-header-title">Blocco carta</p>
              <div className="bc-header-sub">
                <ISLogoSVG height={12} white />
                <span>Operazione sicura</span>
              </div>
            </div>
          </div>
          <FinalState confermata={esito === 'confermata'} carta={cartaSelezionata} motivo={motivo} />
        </div>
      </div>
    )
  }

  return (
    <div className="bc-root">
      <div className="bc-card">

        {/* Header */}
        <div className="bc-header">
          <div className="bc-header-icon"><Icon.Lock /></div>
          <div>
            <p className="bc-header-title">Blocco carta</p>
            <div className="bc-header-sub">
              <ISLogoSVG height={12} white />
              <span>Operazione sicura</span>
            </div>
          </div>
        </div>

        <Stepper step={step} />

        {/* ── Step 1: Selezione carta ── */}
        {step === 1 && (
          <>
            <div className="bc-body">
              <p className="bc-section-title">Quale carta vuoi bloccare?</p>
              <div className="bc-cards-list">
                {carte.map(carta => {
                  const bloccata = carta.stato === 'BLOCCATA'
                  const selected = cartaId === carta.id
                  return (
                    <div
                      key={carta.id}
                      className={`bc-card-item ${selected ? 'bc-card-item--selected' : ''} ${bloccata ? 'bc-card-item--blocked' : ''}`}
                      onClick={() => !bloccata && setCartaId(carta.id)}
                    >
                      <div className="bc-card-art"><Icon.Card /></div>
                      <div className="bc-card-info">
                        <p className="bc-card-name">{carta.nome}</p>
                        <p className="bc-card-number">{carta.numero}</p>
                      </div>
                      <span className={`bc-card-badge ${bloccata ? 'bc-card-badge--bloccata' : 'bc-card-badge--attiva'}`}>
                        {bloccata ? 'Bloccata' : 'Attiva'}
                      </span>
                      {selected && (
                        <div className="bc-check"><Icon.Check /></div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="bc-actions">
              <button
                className="btn-primary"
                disabled={!cartaId}
                onClick={() => setStep(2)}
              >
                Continua
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Motivo ── */}
        {step === 2 && (
          <>
            <div className="bc-body">
              <p className="bc-section-title">Qual è il motivo del blocco?</p>
              <div className="bc-motivi">
                {MOTIVI.map(m => (
                  <div
                    key={m.id}
                    className={`bc-motivo-item ${motivo === m.id ? 'bc-motivo-item--selected' : ''}`}
                    onClick={() => setMotivo(m.id)}
                  >
                    <div className="bc-motivo-radio">
                      {motivo === m.id && <div className="bc-motivo-dot" />}
                    </div>
                    <div>
                      <p className="bc-motivo-label">{m.label}</p>
                      <p className="bc-motivo-desc">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bc-actions">
              <button className="btn-back" onClick={() => setStep(1)}>
                <Icon.ChevronLeft /> Indietro
              </button>
              <button
                className="btn-primary"
                disabled={!motivo}
                onClick={() => setStep(3)}
              >
                Continua
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Conferma ── */}
        {step === 3 && (
          <>
            <div className="bc-body">
              <p className="bc-section-title">Conferma il blocco</p>
              <div className="bc-riepilogo">
                <div className="bc-riepilogo-row">
                  <span className="bc-riepilogo-label">Carta</span>
                  <span className="bc-riepilogo-value">{cartaSelezionata?.nome}</span>
                </div>
                <div className="bc-riepilogo-divider" />
                <div className="bc-riepilogo-row">
                  <span className="bc-riepilogo-label">Numero</span>
                  <span className="bc-riepilogo-value" style={{letterSpacing:'1px'}}>{cartaSelezionata?.numero}</span>
                </div>
                <div className="bc-riepilogo-divider" />
                <div className="bc-riepilogo-row">
                  <span className="bc-riepilogo-label">Motivo</span>
                  <span className="bc-riepilogo-value">{MOTIVI.find(m => m.id === motivo)?.label}</span>
                </div>
                <div className="bc-riepilogo-divider" />
                <div className="bc-riepilogo-row">
                  <span className="bc-riepilogo-label">Stato dopo</span>
                  <span className="bc-riepilogo-value bc-value-danger">BLOCCATA</span>
                </div>
              </div>
              <div className="bc-warning">
                <Icon.Warning />
                <span>Questa operazione è <strong>irreversibile</strong>. La carta non potrà essere utilizzata dopo il blocco.</span>
              </div>
            </div>
            <div className="bc-actions">
              <button className="btn-back" onClick={() => setStep(2)} disabled={loading}>
                <Icon.ChevronLeft /> Indietro
              </button>
              <button
                className="btn-primary"
                onClick={() => handleConferma(true)}
                disabled={loading}
              >
                {loading ? <span className="btn-spinner" /> : 'Sì, blocca carta'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
