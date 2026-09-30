import React, { useState } from 'react'

const PRODUCT_ICONS = {
  'xme-credit-card': '💳',
  'xme-prestito': '💰',
  'xme-conto-silver': '🏦',
  'xme-conto-gold': '🥇',
  'spensierata': '🛡️',
  'xme-mutuo': '🏠',
}

const PRODUCT_GRADIENTS = {
  'xme-credit-card': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
  'xme-prestito':    'linear-gradient(135deg, #00843D 0%, #005a28 100%)',
  'xme-conto-silver':'linear-gradient(135deg, #757575 0%, #424242 100%)',
  'xme-conto-gold':  'linear-gradient(135deg, #f9a825 0%, #e65100 100%)',
  'spensierata':     'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
}

function ImagePlaceholder({ productId, nome }) {
  const icon = PRODUCT_ICONS[productId] || '🏦'
  const gradient = PRODUCT_GRADIENTS[productId] || 'linear-gradient(135deg, #00843D 0%, #005a28 100%)'
  return (
    <div className="card-image-placeholder" style={{ background: gradient }}>
      <span className="card-image-icon">{icon}</span>
      <span className="card-image-label">{nome}</span>
    </div>
  )
}

export default function ProductCard({ product }) {
  const [imgFailed, setImgFailed] = useState(false)

  const handleInterest = async () => {
    try {
      if (window.openai?.sendFollowUpMessage) {
        await window.openai.sendFollowUpMessage({
          prompt: `Sono interessato alla ${product.nome}. Puoi dirmi di più e mettermi in contatto con un consulente della Filiale Digitale?`,
          scrollToBottom: true,
        })
      }
    } catch (e) {
      console.warn('sendFollowUpMessage non disponibile', e)
    }
  }

  const isPersonalizzato = product.personalizzato === true
  const benefici = product.benefici_chiave || []
  const costo = product.costi ? Object.values(product.costi)[0] : null
  const descrizione = product.utilita_per_cliente || product.descrizione_breve || ''
  const hasImage = product.immagine_url && !imgFailed

  return (
    <div className="card">
      {isPersonalizzato && (
        <div className="card-badge">⭐ Consigliato per te</div>
      )}
      <div className="card-image-wrap">
        {hasImage ? (
          <img
            src={product.immagine_url}
            alt={product.nome}
            className="card-image"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <ImagePlaceholder productId={product.id} nome={product.nome} />
        )}
      </div>
      <div className="card-body">
        <h3 className="card-name">{product.nome}</h3>
        <p className="card-desc">{descrizione}</p>
        {benefici.length > 0 && (
          <ul className="card-benefits">
            {benefici.slice(0, 3).map((b, i) => (
              <li key={i}>✅ {b}</li>
            ))}
          </ul>
        )}
        {costo && (
          <div className="card-cost">💰 {costo}</div>
        )}
        <button className="card-cta" onClick={handleInterest}>
          Parla con un esperto →
        </button>
      </div>
    </div>
  )
}
