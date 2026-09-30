import React, { useState, useEffect } from 'react'
import ISLogoSVG from './ISLogoSVG.jsx'

// ── Icona occhio (mostra/nascondi PIN) ──────────────────────────────────────
function EyeIcon({ open }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function ISLogo() {
  return <ISLogoSVG height={30} white />
}

function SuccessState({ clienteNome }) {
  return (
    <div className="success-state">
      <div className="success-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <p className="success-title">Accesso effettuato</p>
      <p className="success-sub">Benvenuto, <strong>{clienteNome}</strong></p>
    </div>
  )
}

// ── Componente principale ────────────────────────────────────────────────────
export default function LoginApp() {
  const [codice, setCodice]           = useState('')
  const [pin, setPin]                 = useState('')
  const [showPin, setShowPin]         = useState(false)
  const [status, setStatus]           = useState('idle')
  const [errorMsg, setErrorMsg]       = useState('')
  const [clienteNome, setClienteNome] = useState('')
  const [toolData, setToolData]       = useState(null)

  // Legge il nome cliente dal tool output (come gli altri widget)
  useEffect(() => {
    function applyData(payload) {
      const d = payload?.structuredContent ?? payload?.result ?? payload
      if (d?.cliente_nome) setToolData(d)
    }

    function onMessage(event) {
      try {
        const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        if (msg?.method === 'ui/notifications/tool-result') applyData(msg.params)
        if (msg?.method === 'notifications/message' && msg?.params?.structuredContent) applyData(msg.params)
      } catch {}
    }
    window.addEventListener('message', onMessage)

    const poll = setInterval(() => {
      try { const out = window?.openai?.toolOutput; if (out) applyData(out) } catch {}
    }, 200)

    return () => {
      window.removeEventListener('message', onMessage)
      clearInterval(poll)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!codice.trim() || !pin.trim()) {
      setErrorMsg('Inserisci Codice Titolare e PIN per continuare.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMsg('')

    // Auth mockata: nessuna chiamata di rete, accetta qualsiasi credenziale
    const nome = toolData?.cliente_nome
      ? `${toolData.cliente_nome} ${toolData.cliente_cognome || ''}`.trim()
      : 'Cliente'

    const token = Math.random().toString(36).slice(2, 18)

    try {
      if (window.openai?.sendFollowUpMessage) {
        await window.openai.sendFollowUpMessage({
          prompt: `Autenticazione completata con successo. Il cliente ${nome} ha effettuato il login con Codice Titolare. Session token: ${token}. Prosegui ad assistere il cliente.`,
          scrollToBottom: true,
        })
      }
    } catch {}

    setClienteNome(nome)
    setStatus('success')
  }

  const isLoading = status === 'loading'
  const isError   = status === 'error'
  const isSuccess = status === 'success'

  return (
    <div className="login-root">
      <div className="login-card">

        <div className="login-header">
          <ISLogo />
        </div>

        {isSuccess ? (
          <SuccessState clienteNome={clienteNome} />
        ) : (
          <>
            <div className="login-body">
              <h1 className="login-title">Accedi al tuo conto</h1>
              <p className="login-subtitle">Inserisci le tue credenziali per continuare</p>

              <form className="login-form" onSubmit={handleSubmit} noValidate>

                <div className={`field-group ${isError && !codice ? 'field-error' : ''}`}>
                  <label className="field-label" htmlFor="codice">Codice Titolare</label>
                  <input
                    id="codice"
                    className="field-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="username"
                    placeholder="Es. 12345678"
                    maxLength={12}
                    value={codice}
                    onChange={e => { setCodice(e.target.value); setStatus('idle') }}
                    disabled={isLoading}
                    aria-label="Codice Titolare"
                  />
                </div>

                <div className={`field-group ${isError && !pin ? 'field-error' : ''}`}>
                  <label className="field-label" htmlFor="pin">PIN</label>
                  <div className="pin-wrap">
                    <input
                      id="pin"
                      className="field-input pin-input"
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      autoComplete="current-password"
                      placeholder="• • • • •"
                      maxLength={8}
                      value={pin}
                      onChange={e => { setPin(e.target.value); setStatus('idle') }}
                      disabled={isLoading}
                      aria-label="PIN"
                    />
                    <button
                      type="button"
                      className="pin-toggle"
                      onClick={() => setShowPin(v => !v)}
                      aria-label={showPin ? 'Nascondi PIN' : 'Mostra PIN'}
                      tabIndex={-1}
                    >
                      <EyeIcon open={showPin} />
                    </button>
                  </div>
                </div>

                {isError && errorMsg && (
                  <div className="error-banner" role="alert">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className={`login-btn ${isLoading ? 'login-btn--loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? <span className="btn-spinner" /> : 'Accedi'}
                </button>

              </form>
            </div>

            <div className="login-footer">
              <button type="button" className="forgot-link">
                Hai dimenticato le credenziali?
              </button>
              <div className="security-note">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Connessione sicura SSL
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
