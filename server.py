import json
import os
import secrets
from datetime import datetime
from functools import lru_cache
from typing import Optional
import mcp.types as types
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel


class CaroselloProdotto(BaseModel):
    id: str
    nome: str
    personalizzato: bool
    immagine_url: str = ""
    utilita_per_cliente: Optional[str] = None
    descrizione_breve: Optional[str] = None
    benefici_chiave: list[str] = []
    costi: dict = {}
    adatto_se: str = ""


class RisultatoCarosello(BaseModel):
    prodotti_consigliati_per_te: list[CaroselloProdotto]
    altri_prodotti_catalogo: list[CaroselloProdotto]


# ── outputSchema: Login ───────────────────────────────────────────────────────
class RisultatoLogin(BaseModel):
    status: str
    message: str
    cliente_nome: str = ""
    cliente_cognome: str = ""


# ── outputSchema: Dashboard ───────────────────────────────────────────────────
class ProssimaScadenza(BaseModel):
    destinatario: str
    importo: float
    data_scadenza: str
    giorni_mancanti: int


class RisultatoDashboard(BaseModel):
    cliente_nome: str
    cliente_cognome: str
    saldo: float
    conto_numero: str
    prodotti_in_possesso: int
    prossima_scadenza: Optional[ProssimaScadenza]
    spesa_mese_corrente: float
    num_promemoria_attivi: int


# ── outputSchema: Spesa ───────────────────────────────────────────────────────
class SintesiSpesa(BaseModel):
    totale_entrate: float
    totale_uscite: float
    periodo: str


class CategoriaSpesa(BaseModel):
    categoria: str
    totale_speso: float
    conteggio_transazioni: int
    percentuale: float


class Transazione(BaseModel):
    id: str
    data: str
    esercente: str
    categoria: str
    importo: float
    modalita: Optional[str] = None
    descrizione: Optional[str] = None


class RisultatoSpesa(BaseModel):
    sintesi: SintesiSpesa
    riepilogo_per_categoria: list[CategoriaSpesa]
    ultime_transazioni: list[Transazione]


# ── outputSchema: Conferma ────────────────────────────────────────────────────
class RisultatoConferma(BaseModel):
    tipo_azione: str
    token_conferma: str
    card_id: Optional[str] = None
    card_nome: Optional[str] = None
    card_numero: Optional[str] = None
    motivo: Optional[str] = None
    limite_giornaliero_attuale: Optional[float] = None
    limite_mensile_attuale: Optional[float] = None
    limite_giornaliero_nuovo: Optional[float] = None
    limite_mensile_nuovo: Optional[float] = None


class ProdottoInPossesso(BaseModel):
    id: str
    nome: str
    tipo: str
    numero: Optional[str] = None
    stato: Optional[str] = None
    sottocategoria: Optional[str] = None


class RisultatoBloccoCartaWidget(BaseModel):
    prodotti_in_possesso: list[ProdottoInPossesso]

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PRODUCTS_FILE = os.path.join(BASE_DIR, "data", "products.json")
LEADS_FILE = os.path.join(BASE_DIR, "data", "leads.json")
CLIENT_FILE = os.path.join(BASE_DIR, "data", "client.json")
WIDGET_FILE = os.path.join(BASE_DIR, "frontend", "dist", "index.html")
LOGIN_WIDGET_FILE     = os.path.join(BASE_DIR, "frontend-login",     "dist", "index.html")
DASHBOARD_WIDGET_FILE = os.path.join(BASE_DIR, "frontend-dashboard", "dist", "index.html")
SPESA_WIDGET_FILE     = os.path.join(BASE_DIR, "frontend-spesa",    "dist", "index.html")
CONFERMA_WIDGET_FILE      = os.path.join(BASE_DIR, "frontend-conferma",     "dist", "index.html")
BLOCCO_CARTA_WIDGET_FILE  = os.path.join(BASE_DIR, "frontend-blocco-carta", "dist", "index.html")
WIDGET_URI                = "ui://widget/ellis-carousel.html"
LOGIN_WIDGET_URI          = "ui://widget/ellis-login.html"
DASHBOARD_WIDGET_URI      = "ui://widget/ellis-dashboard.html"
SPESA_WIDGET_URI          = "ui://widget/ellis-spesa.html"
CONFERMA_WIDGET_URI       = "ui://widget/ellis-conferma.html"
BLOCCO_CARTA_WIDGET_URI   = "ui://widget/ellis-blocco-carta.html"
WIDGET_MIME           = "text/html;profile=mcp-app"

# Detected public base URL (set from Host header of first tunnel request)
_public_base_url: str = os.environ.get("ELLIS_PUBLIC_BASE_URL", "")

# In-memory session store: token -> {cliente_nome, codice_titolare}
_sessions: dict = {}


@lru_cache(maxsize=1)
def _load_widget_html() -> str:
    with open(WIDGET_FILE, "r", encoding="utf-8") as f:
        return f.read()


def _load_login_widget_html() -> str:
    with open(LOGIN_WIDGET_FILE, "r", encoding="utf-8") as f:
        return f.read()


def _load_dashboard_widget_html() -> str:
    with open(DASHBOARD_WIDGET_FILE, "r", encoding="utf-8") as f:
        return f.read()


def _load_spesa_widget_html() -> str:
    with open(SPESA_WIDGET_FILE, "r", encoding="utf-8") as f:
        return f.read()


def _load_conferma_widget_html() -> str:
    with open(CONFERMA_WIDGET_FILE, "r", encoding="utf-8") as f:
        return f.read()


def _load_blocco_carta_widget_html() -> str:
    with open(BLOCCO_CARTA_WIDGET_FILE, "r", encoding="utf-8") as f:
        return f.read()


def _load_client_db():
    if not os.path.exists(CLIENT_FILE):
        return {}
    with open(CLIENT_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_client_db(db):
    with open(CLIENT_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)


with open(PRODUCTS_FILE, encoding="utf-8") as f:
    DB = json.load(f)

PRODOTTI = DB["prodotti"]
ESCALATION = DB["flusso_escalation"]

mcp = FastMCP("Ellis - Intesa Sanpaolo")


@mcp.resource(WIDGET_URI, name="Ellis Carousel Widget", mime_type=WIDGET_MIME)
def ellis_carousel_widget() -> str:
    return _load_widget_html()


@mcp.resource(LOGIN_WIDGET_URI, name="Ellis Login Widget", mime_type=WIDGET_MIME)
def ellis_login_widget() -> str:
    html = _load_login_widget_html()
    base = _public_base_url or "http://localhost:8080"
    injection = f'<script>window.ELLIS_BASE_URL="{base}"</script>'
    return html.replace('</head>', injection + '</head>', 1)


@mcp.resource(DASHBOARD_WIDGET_URI, name="Ellis Dashboard Widget", mime_type=WIDGET_MIME)
def ellis_dashboard_widget() -> str:
    return _load_dashboard_widget_html()


@mcp.resource(SPESA_WIDGET_URI, name="Ellis Spesa Widget", mime_type=WIDGET_MIME)
def ellis_spesa_widget() -> str:
    return _load_spesa_widget_html()


@mcp.resource(CONFERMA_WIDGET_URI, name="Ellis Conferma Widget", mime_type=WIDGET_MIME)
def ellis_conferma_widget() -> str:
    return _load_conferma_widget_html()


@mcp.resource(BLOCCO_CARTA_WIDGET_URI, name="Ellis Blocco Carta Widget", mime_type=WIDGET_MIME)
def ellis_blocco_carta_widget() -> str:
    return _load_blocco_carta_widget_html()


@mcp.custom_route("/widget", methods=["GET"])
async def serve_widget(request) -> "Response":
    from starlette.responses import Response
    return Response(content=_load_widget_html(), media_type="text/html;profile=mcp-app")


@mcp.custom_route("/auth", methods=["POST", "OPTIONS"])
async def handle_auth(request) -> "Response":
    from starlette.responses import JSONResponse, Response

    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if request.method == "OPTIONS":
        return Response(status_code=204, headers=cors_headers)

    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"success": False, "message": "Richiesta non valida."}, status_code=400, headers=cors_headers)

    codice = (body.get("codice_titolare") or "").strip()
    pin    = (body.get("pin") or "").strip()

    if not codice or not pin:
        return JSONResponse({"success": False, "message": "Credenziali mancanti."}, status_code=400, headers=cors_headers)

    db      = _load_client_db()
    cliente = db.get("cliente", {})
    nome    = f"{cliente.get('nome', '')} {cliente.get('cognome', '')}".strip()
    token   = secrets.token_hex(16)
    _sessions[token] = {"cliente_nome": nome, "codice_titolare": codice}
    return JSONResponse({"success": True, "cliente_nome": nome, "session_token": token}, headers=cors_headers)


@mcp.tool(
    meta={"ui": {"resourceUri": LOGIN_WIDGET_URI}, "openai/outputTemplate": LOGIN_WIDGET_URI}
)
def show_login_widget() -> RisultatoLogin:
    """
    Mostra il widget di login Intesa Sanpaolo per autenticare il cliente.
    CHIAMARE QUESTO TOOL per primo, prima di qualsiasi altra operazione bancaria.
    Il cliente inserirà Codice Titolare e PIN direttamente nel form visivo.
    Non richiede parametri.
    """
    db = _load_client_db()
    cliente = db.get("cliente", {})
    return RisultatoLogin(
        status="awaiting_authentication",
        message="Inserisci le tue credenziali per accedere al conto.",
        cliente_nome=cliente.get("nome", ""),
        cliente_cognome=cliente.get("cognome", ""),
    )


@mcp.tool(
    meta={"ui": {"resourceUri": DASHBOARD_WIDGET_URI}, "openai/outputTemplate": DASHBOARD_WIDGET_URI}
)
def show_dashboard() -> RisultatoDashboard:
    """
    Mostra la dashboard visiva post-login con saldo, prossima scadenza e azioni rapide.
    CHIAMARE QUESTO TOOL subito dopo l'autenticazione riuscita.
    Carica automaticamente i dati del cliente (saldo, pagamenti, promemoria).
    Non richiede parametri.
    """
    db = _load_client_db()
    cliente = db.get("cliente", {})
    pagamenti = db.get("prossimi_pagamenti", [])
    promemoria = [p for p in db.get("promemoria_impostati", []) if p.get("stato") == "attivo"]

    # Calcola spesa mese corrente (transazioni negative del mese in corso)
    oggi = datetime.now()
    spesa_mese = sum(
        abs(t["importo"])
        for t in db.get("transazioni", [])
        if t.get("importo", 0) < 0
        and t.get("data", "").startswith(oggi.strftime("%Y-%m"))
    )

    # Prossima scadenza più imminente
    prossima_scadenza = None
    if pagamenti:
        prossimo = sorted(pagamenti, key=lambda p: p.get("data_scadenza", ""))[0]
        try:
            data_scad = datetime.strptime(prossimo["data_scadenza"], "%Y-%m-%d")
            giorni    = max(0, (data_scad.date() - oggi.date()).days)
        except Exception:
            giorni = 99
        prossima_scadenza = ProssimaScadenza(
            destinatario=prossimo.get("destinatario", ""),
            importo=prossimo.get("importo", 0),
            data_scadenza=prossimo.get("data_scadenza", ""),
            giorni_mancanti=giorni,
        )

    # Numero carta mascherato dal primo prodotto di tipo carta
    conto_numero = "•••• •••• •••• ––––"
    for p in cliente.get("prodotti_in_possesso", []):
        if p.get("tipo") == "carta" and p.get("numero"):
            conto_numero = p["numero"]
            break

    return RisultatoDashboard(
        cliente_nome=cliente.get("nome", ""),
        cliente_cognome=cliente.get("cognome", ""),
        saldo=cliente.get("saldo", 0),
        conto_numero=conto_numero,
        prodotti_in_possesso=len(cliente.get("prodotti_in_possesso", [])),
        prossima_scadenza=prossima_scadenza,
        spesa_mese_corrente=round(spesa_mese, 2),
        num_promemoria_attivi=len(promemoria),
    )


@mcp.tool(
    meta={"ui": {"resourceUri": SPESA_WIDGET_URI}, "openai/outputTemplate": SPESA_WIDGET_URI}
)
def show_spesa_widget() -> RisultatoSpesa:
    """
    Mostra il widget visivo con il riepilogo delle spese del cliente: grafico a ciambella
    per categoria, barre proporzionali e ultime transazioni con tab navigabile.
    USA QUESTO TOOL quando il cliente chiede: 'quanto ho speso', 'le mie spese',
    'a cosa vanno i miei soldi', 'riepilogo movimenti'.
    Non richiede parametri.
    """
    db = _load_client_db()
    transazioni = db.get("transazioni", [])

    oggi = datetime.now()
    categorie: dict = {}
    totale_entrate = 0.0
    totale_uscite  = 0.0

    for tx in transazioni:
        importo = tx.get("importo", 0.0)
        cat     = tx.get("categoria", "Altro")
        if importo > 0:
            totale_entrate += importo
        else:
            totale_uscite += abs(importo)
            if cat not in categorie:
                categorie[cat] = {"totale_speso": 0.0, "conteggio": 0}
            categorie[cat]["totale_speso"] += abs(importo)
            categorie[cat]["conteggio"]    += 1

    riepilogo = []
    for nome_cat, dati in categorie.items():
        pct = round(dati["totale_speso"] / totale_uscite * 100, 1) if totale_uscite > 0 else 0
        riepilogo.append({
            "categoria":              nome_cat,
            "totale_speso":           round(dati["totale_speso"], 2),
            "conteggio_transazioni":  dati["conteggio"],
            "percentuale":            pct,
        })
    riepilogo.sort(key=lambda x: x["totale_speso"], reverse=True)

    ultime_uscite = [t for t in transazioni if t.get("importo", 0) < 0][:8]

    return RisultatoSpesa(
        sintesi=SintesiSpesa(
            totale_entrate=round(totale_entrate, 2),
            totale_uscite=round(totale_uscite, 2),
            periodo="Ultimi 2 mesi",
        ),
        riepilogo_per_categoria=[CategoriaSpesa(**r) for r in riepilogo],
        ultime_transazioni=[
            Transazione(
                id=t.get("id", ""),
                data=t.get("data", ""),
                esercente=t.get("esercente", ""),
                categoria=t.get("categoria", ""),
                importo=t.get("importo", 0),
                modalita=t.get("modalita"),
                descrizione=t.get("descrizione"),
            )
            for t in ultime_uscite
        ],
    )


@mcp.tool(
    meta={"ui": {"resourceUri": WIDGET_URI}, "openai/outputTemplate": WIDGET_URI}
)
def show_products_carousel() -> RisultatoCarosello:
    """
    Mostra un carosello visivo interattivo con i prodotti consigliati per il cliente.
    USA QUESTO TOOL SOLO per richieste esplicitamente legate a prodotti bancari, offerte o consigli finanziari.
    Non richiede parametri: carica automaticamente i prodotti personalizzati dalla posizione del cliente
    e li integra con il catalogo generale.

    Esempi di frasi che devono innescare questo tool:
    - "mostrami i prodotti", "cosa mi consigli", "quali prodotti hai"
    - "sulla base della mia situazione economica, c'è qualche prodotto che mi potresti suggerire?"
    - "cosa potrebbe fare al caso mio", "hai qualcosa di adatto a me"
    - "prodotti consigliati", "offerte per me", "cosa mi conviene"
    - "in base al mio profilo cosa mi suggerisci", "guardando i miei dati cosa consiglieresti"

    NON usare questo tool per: blocco carta, modifica limiti, pagamenti, spese, login, dashboard.
    """
    db = _load_client_db()
    consigliati_raw = db.get("cliente", {}).get("prodotti_consigliati_upselling", []) if db else []

    ids_personalizzati = set()
    prodotti_per_te = []
    for rec in consigliati_raw:
        pid = rec.get("id")
        ids_personalizzati.add(pid)
        dettagli = next((p for p in PRODOTTI if p["id"] == pid), {})
        prodotti_per_te.append(CaroselloProdotto(
            id=pid,
            nome=rec.get("nome", ""),
            personalizzato=True,
            immagine_url=rec.get("immagine_url", ""),
            utilita_per_cliente=rec.get("utilita_per_cliente"),
            benefici_chiave=rec.get("benefici_chiave", []),
            costi=dettagli.get("costi", {}),
            adatto_se=dettagli.get("adatto_se", ""),
        ))

    altri = []
    for p in PRODOTTI:
        if p["id"] in ids_personalizzati:
            continue
        if p.get("immagine_url"):
            altri.append(CaroselloProdotto(
                id=p["id"],
                nome=p["nome"],
                personalizzato=False,
                immagine_url=p.get("immagine_url", ""),
                descrizione_breve=p.get("descrizione_breve"),
                benefici_chiave=p.get("features", [])[:3],
                costi=p.get("costi", {}),
                adatto_se=p.get("adatto_se", ""),
            ))

    return RisultatoCarosello(
        prodotti_consigliati_per_te=prodotti_per_te,
        altri_prodotti_catalogo=altri[:4],
    )


def _score(prodotto: dict, query: str, profilo: str) -> int:
    testo = query.lower() + " " + profilo.lower()
    score = 0
    for tag in prodotto.get("tags", []):
        if tag.lower() in testo:
            score += 2
    for bisogno in prodotto.get("bisogni", []):
        if any(parola in bisogno.lower() for parola in testo.split()):
            score += 2
    for t in prodotto.get("target", []):
        if any(parola in t.lower() for parola in testo.split()):
            score += 1
    if any(parola in prodotto["descrizione_breve"].lower() for parola in testo.split()):
        score += 1
    return score


@mcp.tool()
def search_products(bisogno: str, profilo_cliente: str = "") -> str:
    """
    Cerca prodotti Intesa Sanpaolo adatti al cliente.
    Restituisce prima i prodotti personalizzati dalla posizione del cliente (consigliati_upselling),
    poi i prodotti del catalogo generale più pertinenti alla ricerca.
    bisogno: cosa cerca il cliente (es. 'conto gratuito', 'mutuo prima casa', 'prestito studio')
    profilo_cliente: chi è il cliente (es. 'studente', 'pensionato', 'lavoratore dipendente under 35')
    """
    # Prodotti personalizzati dalla posizione del cliente (priorità massima)
    db = _load_client_db()
    consigliati_raw = db.get("cliente", {}).get("prodotti_consigliati_upselling", []) if db else []

    prodotti_personalizzati = []
    ids_personalizzati = set()
    for raccomandazione in consigliati_raw:
        pid = raccomandazione.get("id")
        ids_personalizzati.add(pid)
        dettagli_catalogo = next((p for p in PRODOTTI if p["id"] == pid), {})
        prodotti_personalizzati.append({
            "id": pid,
            "nome": raccomandazione.get("nome"),
            "categoria": raccomandazione.get("categoria"),
            "immagine_url": raccomandazione.get("immagine_url"),
            "descrizione_breve": dettagli_catalogo.get("descrizione_breve", ""),
            "utilita_per_cliente": raccomandazione.get("utilita_per_cliente"),
            "benefici_chiave": raccomandazione.get("benefici_chiave", []),
            "costi": dettagli_catalogo.get("costi", {}),
            "adatto_se": dettagli_catalogo.get("adatto_se", ""),
            "personalizzato": True,
            "etichetta": "⭐ Consigliato per te"
        })

    # Prodotti dal catalogo generale (escludi già presenti tra i personalizzati)
    risultati_catalogo = []
    for p in PRODOTTI:
        if p["id"] in ids_personalizzati:
            continue
        score = _score(p, bisogno, profilo_cliente)
        if score > 0:
            risultati_catalogo.append((score, p))

    risultati_catalogo.sort(key=lambda x: x[0], reverse=True)
    top_catalogo = risultati_catalogo[:3]

    output_catalogo = []
    for score, p in top_catalogo:
        output_catalogo.append({
            "id": p["id"],
            "nome": p["nome"],
            "categoria": p["categoria"],
            "immagine_url": p.get("immagine_url", ""),
            "descrizione_breve": p["descrizione_breve"],
            "adatto_se": p["adatto_se"],
            "costi": p.get("costi", {}),
            "personalizzato": False,
            "etichetta": "Dal catalogo"
        })

    if not prodotti_personalizzati and not output_catalogo:
        return json.dumps({
            "trovati": 0,
            "messaggio": "Nessun prodotto trovato. Prova a riformulare o proponi il ricontatto.",
            "suggerimento_escalation": ESCALATION["messaggio_standard"]
        }, ensure_ascii=False)

    return json.dumps({
        "trovati": len(prodotti_personalizzati) + len(output_catalogo),
        "istruzioni_rendering": "Presenta i prodotti come carosello visivo: per ogni prodotto mostra immagine (immagine_url), etichetta, nome, utilita_per_cliente o descrizione_breve, benefici_chiave o adatto_se, e costi. Separa ogni scheda con ---",
        "prodotti_consigliati_per_te": prodotti_personalizzati,
        "altri_prodotti_catalogo": output_catalogo
    }, ensure_ascii=False, indent=2)


@mcp.tool()
def get_product_details(product_id: str) -> str:
    """
    Restituisce tutti i dettagli di un prodotto specifico.
    product_id: l'id del prodotto (es. 'xme-conto-gold', 'xme-prestito', 'xme-mutuo-acquisto')
    """
    for p in PRODOTTI:
        if p["id"] == product_id:
            return json.dumps(p, ensure_ascii=False, indent=2)

    ids_disponibili = [p["id"] for p in PRODOTTI]
    return json.dumps({
        "errore": f"Prodotto '{product_id}' non trovato.",
        "ids_disponibili": ids_disponibili
    }, ensure_ascii=False)


@mcp.tool()
def compare_products(product_ids: list) -> str:
    """
    Confronta due o più prodotti fianco a fianco.
    product_ids: lista di id prodotti da confrontare (es. ['xme-conto-silver', 'xme-conto-gold'])
    """
    trovati = []
    non_trovati = []

    for pid in product_ids:
        match = next((p for p in PRODOTTI if p["id"] == pid), None)
        if match:
            trovati.append(match)
        else:
            non_trovati.append(pid)

    if len(trovati) < 2:
        return json.dumps({
            "errore": "Servono almeno 2 prodotti validi per il confronto.",
            "non_trovati": non_trovati
        }, ensure_ascii=False)

    confronto = []
    for p in trovati:
        confronto.append({
            "nome": p["nome"],
            "categoria": p["categoria"],
            "costi": p.get("costi", {}),
            "features_principali": p.get("features", [])[:4],
            "adatto_se": p["adatto_se"],
            "non_adatto_se": p["non_adatto_se"],
            "target": p.get("target", [])
        })

    return json.dumps({
        "confronto": confronto,
        "non_trovati": non_trovati
    }, ensure_ascii=False, indent=2)


@mcp.tool()
def request_callback(
    nome: str,
    cognome: str,
    telefono: str,
    prodotto_interesse: str,
    fascia_oraria: str = "qualsiasi"
) -> str:
    """
    Registra una richiesta di ricontatto da parte di un consulente Intesa Sanpaolo.
    Usa questa funzione quando il cliente vuole essere ricontattato.
    nome: nome del cliente
    cognome: cognome del cliente
    telefono: numero di telefono
    prodotto_interesse: prodotto o argomento per cui vuole essere contattato
    fascia_oraria: fascia oraria preferita per il ricontatto (es. 'mattina', 'pomeriggio', 'qualsiasi')
    """
    lead = {
        "timestamp": datetime.now().isoformat(),
        "nome": nome,
        "cognome": cognome,
        "telefono": telefono,
        "prodotto_interesse": prodotto_interesse,
        "fascia_oraria": fascia_oraria,
        "stato": "da_contattare"
    }

    leads = []
    if os.path.exists(LEADS_FILE):
        with open(LEADS_FILE, encoding="utf-8") as f:
            try:
                leads = json.load(f)
            except json.JSONDecodeError:
                leads = []

    leads.append(lead)

    with open(LEADS_FILE, "w", encoding="utf-8") as f:
        json.dump(leads, f, ensure_ascii=False, indent=2)

    return json.dumps({
        "successo": True,
        "messaggio": f"Perfetto {nome}, un nostro consulente ti contatterà al {telefono} entro 24 ore lavorative.",
        "riepilogo": {
            "nome": f"{nome} {cognome}",
            "telefono": telefono,
            "interesse": prodotto_interesse,
            "fascia_preferita": fascia_oraria
        }
    }, ensure_ascii=False, indent=2)


@mcp.tool()
def get_client_profile() -> str:
    """
    Restituisce le informazioni del profilo del cliente correntemente loggato (Giuseppe Russo).
    Usa questa funzione all'avvio o quando hai bisogno dei dettagli anagrafici, del saldo o dei prodotti posseduti.
    """
    db = _load_client_db()
    if not db:
        return json.dumps({"errore": "Impossibile caricare il database del cliente."}, ensure_ascii=False)
    return json.dumps(db.get("cliente", {}), ensure_ascii=False, indent=2)


@mcp.tool()
def get_transaction_summary() -> str:
    """
    Elabora e restituisce un riepilogo strutturato delle transazioni storiche del cliente.
    Raggruppa le spese per categoria (calcolando totale speso, numero transazioni e percentuale)
    e fornisce lo storico recente. Utile per visualizzare una panoramica finanziaria (es. widget spesa).
    """
    db = _load_client_db()
    if not db:
        return json.dumps({"errore": "Impossibile caricare le transazioni."}, ensure_ascii=False)
    
    transazioni = db.get("transazioni", [])
    
    categorie = {}
    totale_entrate = 0.0
    totale_uscite = 0.0
    
    for tx in transazioni:
        importo = tx.get("importo", 0.0)
        cat = tx.get("categoria", "Altro")
        
        if importo > 0:
            totale_entrate += importo
        else:
            totale_uscite += abs(importo)
            if cat not in categorie:
                categorie[cat] = {"totale_speso": 0.0, "conteggio": 0}
            categorie[cat]["totale_speso"] += abs(importo)
            categorie[cat]["conteggio"] += 1

    riepilogo_categorie = []
    for nome_cat, dati in categorie.items():
        percentuale = (dati["totale_speso"] / totale_uscite * 100) if totale_uscite > 0 else 0
        riepilogo_categorie.append({
            "categoria": nome_cat,
            "totale_speso": round(dati["totale_speso"], 2),
            "conteggio_transazioni": dati["conteggio"],
            "percentuale": round(percentuale, 1)
        })
    
    riepilogo_categorie.sort(key=lambda x: x["totale_speso"], reverse=True)
    
    risultato = {
        "sintesi": {
            "totale_entrate": round(totale_entrate, 2),
            "totale_uscite": round(totale_uscite, 2),
            "periodo": "Ultimi 2 mesi"
        },
        "riepilogo_per_categoria": riepilogo_categorie,
        "ultime_transazioni": transazioni[:10]
    }
    
    return json.dumps(risultato, ensure_ascii=False, indent=2)


@mcp.tool()
def get_upcoming_payments() -> str:
    """
    Restituisce la lista dei prossimi pagamenti in scadenza per il cliente.
    Fornisce dettagli sull'importo, la scadenza, lo stato e include suggerimenti su prodotti
    bancari/assicurativi Intesa Sanpaolo adatti a ottimizzare o dilazionare quel pagamento specifico.
    """
    db = _load_client_db()
    if not db:
        return json.dumps({"errore": "Impossibile caricare i pagamenti in scadenza."}, ensure_ascii=False)
    return json.dumps(db.get("prossimi_pagamenti", []), ensure_ascii=False, indent=2)


@mcp.tool()
def set_payment_reminder(payment_id: str, data_promemoria: str, nota: str) -> str:
    """
    Imposta un promemoria conversazionale per un pagamento in scadenza.
    payment_id: ID del pagamento per cui si vuole impostare il promemoria (es. 'pay_001')
    data_promemoria: Data in cui si desidera ricevere l'avviso (formato YYYY-MM-DD)
    nota: Nota di testo personalizzata per il promemoria
    """
    db = _load_client_db()
    if not db:
        return json.dumps({"successo": False, "messaggio": "Impossibile caricare il database."}, ensure_ascii=False)
        
    pagamenti = db.get("prossimi_pagamenti", [])
    pagamento_selezionato = next((p for p in pagamenti if p["id"] == payment_id), None)
    
    destinatario = pagamento_selezionato["destinatario"] if pagamento_selezionato else "Pagamento generico"
    importo = pagamento_selezionato["importo"] if pagamento_selezionato else 0.0
    
    nuovo_promemoria = {
        "id": f"rem_{int(datetime.now().timestamp())}",
        "timestamp_creazione": datetime.now().isoformat(),
        "payment_id": payment_id,
        "destinatario": destinatario,
        "importo": importo,
        "data_promemoria": data_promemoria,
        "nota": nota,
        "stato": "attivo"
    }
    
    if "promemoria_impostati" not in db:
        db["promemoria_impostati"] = []
        
    db["promemoria_impostati"].append(nuovo_promemoria)
    _save_client_db(db)
    
    return json.dumps({
        "successo": True,
        "messaggio": f"Promemoria impostato con successo per il giorno {data_promemoria}!",
        "dettagli": nuovo_promemoria
    }, ensure_ascii=False, indent=2)


@mcp.tool()
def get_active_reminders() -> str:
    """
    Restituisce la lista di tutti i promemoria impostati dal cliente.
    Consente a ChatGPT di mostrare un riepilogo delle scadenze per le quali il cliente ha chiesto di essere avvisato.
    """
    db = _load_client_db()
    if not db:
        return json.dumps({"errore": "Impossibile caricare i promemoria."}, ensure_ascii=False)
    return json.dumps(db.get("promemoria_impostati", []), ensure_ascii=False, indent=2)


@mcp.tool(
    meta={"ui": {"resourceUri": BLOCCO_CARTA_WIDGET_URI}, "openai/outputTemplate": BLOCCO_CARTA_WIDGET_URI}
)
def show_blocco_carta_widget() -> RisultatoBloccoCartaWidget:
    """
    Mostra il widget interattivo per bloccare una carta del cliente.
    USA QUESTO TOOL ogni volta che il cliente vuole bloccare una carta.
    Il widget mostra tutte le carte del cliente, permette di selezionarne una,
    scegliere il motivo e confermare. Gestisce tutto il flusso internamente.
    Non richiede parametri.

    Esempi di frasi che devono innescare questo tool:
    - "blocca la mia carta", "voglio bloccare la carta", "blocca la XME Debit"
    - "ho perso la carta", "mi hanno rubato la carta", "carta smarrita"
    - "blocco carta", "disattiva la carta"
    """
    db = _load_client_db()
    prodotti = db.get("cliente", {}).get("prodotti_in_possesso", [])
    return RisultatoBloccoCartaWidget(
        prodotti_in_possesso=[
            ProdottoInPossesso(
                id=p.get("id", ""),
                nome=p.get("nome", ""),
                tipo=p.get("tipo", ""),
                numero=p.get("numero"),
                stato=p.get("stato"),
                sottocategoria=p.get("sottocategoria"),
            )
            for p in prodotti
        ]
    )


@mcp.tool(
    meta={"ui": {"resourceUri": CONFERMA_WIDGET_URI}, "openai/outputTemplate": CONFERMA_WIDGET_URI}
)
def show_conferma_widget(
    tipo_azione: str,
    card_id: str = "",
    card_nome: str = "",
    card_numero: str = "",
    motivo: str = "",
    limite_giornaliero_attuale: float = 0,
    limite_mensile_attuale: float = 0,
    limite_giornaliero_nuovo: float = 0,
    limite_mensile_nuovo: float = 0,
) -> RisultatoConferma:
    """
    Mostra il widget visivo di conferma per la modifica dei limiti operativi del conto.
    USARE SEMPRE questo tool al posto di eseguire direttamente update_account_limits.
    Il cliente clicca Conferma o Annulla nel widget, poi ChatGPT riceve la risposta e chiama il tool effettivo.
    NON usare per blocco carta: usare show_blocco_carta_widget.

    Esempi di frasi che devono innescare questo tool:
    - "cambia i limiti del conto", "aumenta il limite giornaliero", "modifica il limite di bonifico"
    - "voglio cambiare i limiti operativi"

    FLUSSO OBBLIGATORIO:
    1. Recupera i limiti attuali con get_client_profile
    2. Chiama IMMEDIATAMENTE show_conferma_widget con tipo_azione='modifica_limiti'
    3. Aspetta conferma nel widget
    4. Solo se confermato, chiama update_account_limits

    tipo_azione: 'modifica_limiti'
    Fornire: limite_giornaliero_attuale, limite_mensile_attuale,
             limite_giornaliero_nuovo, limite_mensile_nuovo
    """
    token = secrets.token_hex(8)

    if tipo_azione == "blocco_carta":
        # Recupera numero carta dal profilo se non fornito
        if not card_numero:
            db = _load_client_db()
            for p in db.get("cliente", {}).get("prodotti_in_possesso", []):
                if p.get("id") == card_id:
                    card_numero = p.get("numero", "•••• •••• •••• ––––")
                    card_nome   = card_nome or p.get("nome", card_id)
                    break
        return RisultatoConferma(
            tipo_azione="blocco_carta",
            card_id=card_id,
            card_nome=card_nome,
            card_numero=card_numero,
            motivo=motivo or "smarrimento",
            token_conferma=token,
        )

    if tipo_azione == "modifica_limiti":
        # Recupera limiti attuali dal profilo se non forniti
        if not limite_giornaliero_attuale and not limite_mensile_attuale:
            db = _load_client_db()
            limiti = db.get("cliente", {}).get("limiti_operativi", {})
            limite_giornaliero_attuale = limiti.get("limite_giornaliero_bonifico", 0)
            limite_mensile_attuale     = limiti.get("limite_mensile_bonifico", 0)
        return RisultatoConferma(
            tipo_azione="modifica_limiti",
            limite_giornaliero_attuale=limite_giornaliero_attuale,
            limite_mensile_attuale=limite_mensile_attuale,
            limite_giornaliero_nuovo=limite_giornaliero_nuovo,
            limite_mensile_nuovo=limite_mensile_nuovo,
            token_conferma=token,
        )

    return RisultatoConferma(
        tipo_azione=tipo_azione,
        token_conferma=token,
    )


@mcp.tool()
def block_card(card_id: str, motivo: str = "smarrimento") -> str:
    """
    Blocca in modo definitivo una carta del cliente.
    NON chiamare direttamente: usa sempre show_conferma_widget prima e chiama questo tool
    solo dopo che il cliente ha cliccato Conferma nel widget di conferma.
    card_id: ID della carta da bloccare (es. 'xme-debit' o 'xme-card-plus')
    motivo: Motivo del blocco (es. 'smarrimento', 'furto', 'sospetto_frode')
    """
    db = _load_client_db()
    if not db:
        return json.dumps({"successo": False, "messaggio": "Impossibile caricare il database."}, ensure_ascii=False)
        
    carte = db.get("cliente", {}).get("prodotti_in_possesso", [])
    carta_trovata = None
    
    for prodotto in carte:
        if prodotto.get("id") == card_id and prodotto.get("tipo") == "carta":
            prodotto["stato"] = "BLOCCATA"
            carta_trovata = prodotto
            break
            
    if not carta_trovata:
        return json.dumps({
            "successo": False,
            "messaggio": f"Carta con ID '{card_id}' non trovata tra le carte del cliente."
        }, ensure_ascii=False)
        
    _save_client_db(db)
    
    return json.dumps({
        "successo": True,
        "messaggio": f"La carta {carta_trovata['nome']} ({carta_trovata['numero']}) è stata bloccata con successo per {motivo}.",
        "dettagli": {
            "carta_id": card_id,
            "nome": carta_trovata["nome"],
            "numero": carta_trovata["numero"],
            "stato": "BLOCCATA",
            "motivo": motivo,
            "timestamp": datetime.now().isoformat()
        }
    }, ensure_ascii=False, indent=2)


@mcp.tool()
def update_account_limits(limite_giornaliero: float, limite_mensile: float) -> str:
    """
    Modifica i limiti operativi giornalieri e mensili per i bonifici del conto del cliente.
    Usa questa funzione solo dopo che il cliente ha confermato esplicitamente i nuovi limiti proposti.
    limite_giornaliero: Nuovo limite di bonifico giornaliero (in euro, es. 2000.00)
    limite_mensile: Nuovo limite di bonifico mensile (in euro, es. 5000.00)
    """
    db = _load_client_db()
    if not db:
        return json.dumps({"successo": False, "messaggio": "Impossibile caricare il database."}, ensure_ascii=False)
        
    if "limiti_operativi" not in db.get("cliente", {}):
        db["cliente"]["limiti_operativi"] = {}
        
    db["cliente"]["limiti_operativi"]["limite_giornaliero_bonifico"] = float(limite_giornaliero)
    db["cliente"]["limiti_operativi"]["limite_mensile_bonifico"] = float(limite_mensile)
    
    _save_client_db(db)
    
    return json.dumps({
        "successo": True,
        "messaggio": "Limiti operativi del conto aggiornati con successo!",
        "nuovi_limiti": {
            "limite_giornaliero_bonifico": float(limite_giornaliero),
            "limite_mensile_bonifico": float(limite_mensile),
            "timestamp": datetime.now().isoformat()
        }
    }, ensure_ascii=False, indent=2)


class _HostCaptureMiddleware:
    """Lightweight ASGI middleware: captures public tunnel host from first request."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        global _public_base_url
        if scope["type"] == "http" and not _public_base_url:
            headers = {k: v for k, v in scope.get("headers", [])}
            host = headers.get(b"host", b"").decode()
            proto = headers.get(b"x-forwarded-proto", b"https").decode()
            if host and "localhost" not in host and "127.0.0.1" not in host:
                _public_base_url = f"{proto}://{host}"
        await self.app(scope, receive, send)


if __name__ == "__main__":
    import sys
    mode = sys.argv[1] if len(sys.argv) > 1 else "stdio"
    if mode == "http":
        import anyio
        import uvicorn

        async def _run():
            mcp.settings.host = "0.0.0.0"
            _port = int(os.environ.get("PORT", 8080))
            mcp.settings.port = _port
            mcp.settings.transport_security = None
            starlette_app = mcp.sse_app()
            wrapped = _HostCaptureMiddleware(starlette_app)
            config = uvicorn.Config(wrapped, host="0.0.0.0", port=_port, log_level="info")
            await uvicorn.Server(config).serve()

        anyio.run(_run)
    else:
        mcp.run()
