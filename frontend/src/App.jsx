import React, { useState, useEffect, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import ProductCard from './ProductCard.jsx'

const FALLBACK = {
  prodotti_consigliati_per_te: [
    {
      id: 'xme-credit-card',
      nome: 'XME Carta di Credito',
      personalizzato: true,
      immagine_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
      utilita_per_cliente: 'Paghi oggi, addebito il mese successivo. Perfetto per le spese importanti come assicurazioni e bollette.',
      benefici_chiave: ['Addebito posticipato al mese successivo', 'Rateizza le spese grandi', 'Protegge il saldo del conto'],
      costi: { canone: 'Gratuito il primo anno' },
    },
    {
      id: 'xme-prestito',
      nome: 'XME Prestito Personale',
      personalizzato: true,
      immagine_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
      utilita_per_cliente: 'Liquidità immediata con rata mensile fissa. Nessuna sorpresa, tutto pianificato.',
      benefici_chiave: ['Da 1.000€ a 30.000€', 'Rata fissa mensile', 'Risposta in pochi minuti'],
      costi: { tasso: 'Tasso fisso personalizzato' },
    },
  ],
  altri_prodotti_catalogo: [],
}

export default function App() {
  const [data, setData] = useState(null)
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    containScroll: 'trimSnaps',
    dragFree: false,
  })
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  useEffect(() => {
    let received = false

    function applyData(payload) {
      if (received) return
      received = true
      // payload può essere il structuredContent direttamente o wrappato
      const d = payload?.structuredContent ?? payload?.result ?? payload
      if (d?.prodotti_consigliati_per_te !== undefined) {
        setData(d)
      }
    }

    // 1. MCP Apps bridge: ui/notifications/tool-result via postMessage
    function onMessage(event) {
      try {
        const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        if (msg?.method === 'ui/notifications/tool-result') {
          applyData(msg.params)
        }
        // Alcune versioni usano notifications/message
        if (msg?.method === 'notifications/message' && msg?.params?.structuredContent) {
          applyData(msg.params)
        }
      } catch {}
    }
    window.addEventListener('message', onMessage)

    // 2. Evento custom OpenAI SDK (vecchio)
    function onOpenAIGlobals(e) {
      const g = e?.detail?.globals
      if (g?.toolOutput) applyData(g.toolOutput)
    }
    window.addEventListener('openai-set-globals', onOpenAIGlobals, { passive: true })

    // 3. Polling window.openai.toolOutput (fallback legacy)
    const poll = setInterval(() => {
      try {
        const out = window?.openai?.toolOutput
        if (out) applyData(out)
      } catch {}
    }, 200)

    // 4. Fallback dev dopo 2s
    const fallbackTimer = setTimeout(() => {
      if (!received) setData(FALLBACK)
    }, 2000)

    return () => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('openai-set-globals', onOpenAIGlobals)
      clearInterval(poll)
      clearTimeout(fallbackTimer)
    }
  }, [])

  const updateButtons = useCallback(() => {
    if (!emblaApi) return
    setCanPrev(emblaApi.canScrollPrev())
    setCanNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    updateButtons()
    emblaApi.on('select', updateButtons)
    emblaApi.on('reInit', updateButtons)
    return () => { emblaApi.off('select', updateButtons); emblaApi.off('reInit', updateButtons) }
  }, [emblaApi, updateButtons])

  const products = [
    ...(data?.prodotti_consigliati_per_te ?? []),
    ...(data?.altri_prodotti_catalogo ?? []),
  ]

  if (!data) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        <span>Caricamento prodotti...</span>
      </div>
    )
  }

  return (
    <div className="carousel-root">
      <div className="carousel-header">
        <span className="carousel-title">Prodotti selezionati per te</span>
        <span className="carousel-subtitle">{products.length} proposte personalizzate</span>
      </div>
      <div className="carousel-wrap">
        <div className="carousel-viewport" ref={emblaRef}>
          <div className="carousel-track">
            {products.map((p, i) => (
              <div className="carousel-slide" key={p.id || i}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
        {canPrev && (
          <button className="carousel-arrow carousel-arrow-left" onClick={() => emblaApi?.scrollPrev()} aria-label="Precedente">
            ‹
          </button>
        )}
        {canNext && (
          <button className="carousel-arrow carousel-arrow-right" onClick={() => emblaApi?.scrollNext()} aria-label="Successivo">
            ›
          </button>
        )}
      </div>
    </div>
  )
}
