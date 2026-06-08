import React, { useState, useMemo, useEffect } from "react";
import {
  BarChart3,
  ArrowDown,
  Megaphone,
  ShieldCheck,
  TriangleAlert,
  Clock,
  Search,
  Share2,
  MessageCircle,
  Facebook,
  Instagram,
} from "lucide-react";

// ===========================================================================
// CONFIGURAÇÃO SUPABASE
// Forma recomendada: defina as variáveis de ambiente na Vercel (ou em um
// arquivo .env.local para testar localmente):
//   VITE_SUPABASE_URL   = a "Project URL" (ex: https://xxxx.supabase.co)
//   VITE_SUPABASE_ANON  = a "Publishable key" (sb_publishable_... ou anon eyJ...)
// Ambas são seguras no navegador. NUNCA use a "Secret key" (sb_secret_...).
//
// Alternativa rápida: cole os valores direto entre as aspas abaixo (fallback).
// ===========================================================================
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ""; // <-- ou cole aqui
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON || ""; // <-- ou cole aqui
const SUPABASE_ATIVO = Boolean(SUPABASE_URL && SUPABASE_ANON);

// Insere uma assinatura na tabela `assinaturas` via API REST.
async function supabaseInsert(payload) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/assinaturas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error("Falha ao gravar assinatura");
}

// Lê o total chamando a função SQL `total_assinaturas` (RPC).
async function supabaseTotal() {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/total_assinaturas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
    },
    body: "{}",
  });
  if (!resp.ok) throw new Error("Falha ao ler total");
  return await resp.json(); // retorna um número
}

// Lê a lista de vereadores do banco, ordenada.
async function supabaseVereadores() {
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/vereadores?select=nome,partido,status,whatsapp&order=ordem.asc`,
    {
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
      },
    }
  );
  if (!resp.ok) throw new Error("Falha ao ler vereadores");
  return await resp.json(); // array de vereadores
}

// Grava uma adesão pendente (entra como aprovado=false; não afeta o painel).
async function supabaseAdesao(payload) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/adesoes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error("Falha ao registrar adesão");
}

// ---------------------------------------------------------------------------
// DADOS — edite o campo `status` de cada vereador conforme as manifestações.
// status: "signed" | "refused" | "no-response" | "waiting"
// daysWaiting: número de dias sem resposta (0 = contato não iniciado)
// whatsapp (opcional): número do gabinete só com dígitos e DDI 55, ex: "5541999999999".
//   Quando preenchido, o botão "Cobrar no WhatsApp" abre direto a conversa do gabinete.
//   Quando vazio/ausente, abre a tela de escolher contato (genérico).
// ---------------------------------------------------------------------------
const VEREADORES_INICIAIS = [
  { nome: "Andressa Bianchessi", partido: "União", status: "waiting", daysWaiting: 0 },
  { nome: "Angelo Vanhoni", partido: "PT", status: "waiting", daysWaiting: 0 },
  { nome: "Beto Moraes", partido: "PSD", status: "waiting", daysWaiting: 0 },
  { nome: "Bruno Rossi", partido: "Agir", status: "waiting", daysWaiting: 0 },
  { nome: "Bruno Secco", partido: "PMB", status: "waiting", daysWaiting: 0 },
  { nome: "Camilla Gonda", partido: "PSB", status: "waiting", daysWaiting: 0 },
  { nome: "Carlise Kwiatkowski", partido: "PL", status: "waiting", daysWaiting: 0 },
  { nome: "Da Costa", partido: "União", status: "waiting", daysWaiting: 0 },
  { nome: "Delegada Tathiana Guzella", partido: "União", status: "waiting", daysWaiting: 0 },
  { nome: "Eder Borges", partido: "PL", status: "waiting", daysWaiting: 0 },
  { nome: "Fernando Klinger", partido: "PL", status: "waiting", daysWaiting: 0 },
  { nome: "Giorgia Prates (Mandata Preta)", partido: "PT", status: "waiting", daysWaiting: 0 },
  { nome: "Guilherme Kilter", partido: "Novo", status: "waiting", daysWaiting: 0 },
  { nome: "Hernani", partido: "Republicanos", status: "waiting", daysWaiting: 0 },
  { nome: "Indiara Barbosa", partido: "Novo", status: "waiting", daysWaiting: 0 },
  { nome: "Jasson Goulart", partido: "Republicanos", status: "waiting", daysWaiting: 0 },
  { nome: "João Bettega", partido: "União", status: "waiting", daysWaiting: 0 },
  { nome: "João 5 Irmãos", partido: "MDB", status: "waiting", daysWaiting: 0 },
  { nome: "Laís Leão", partido: "PDT", status: "waiting", daysWaiting: 0 },
  { nome: "Leonidas Dias", partido: "Pode", status: "waiting", daysWaiting: 0 },
  { nome: "Lórens Nogueira", partido: "PP", status: "waiting", daysWaiting: 0 },
  { nome: "Marcos Vieira", partido: "PDT", status: "waiting", daysWaiting: 0 },
  { nome: "Meri Martins", partido: "Republicanos", status: "waiting", daysWaiting: 0 },
  { nome: "Nori Seto", partido: "PP", status: "waiting", daysWaiting: 0 },
  { nome: "Olimpio Araujo Junior", partido: "PL", status: "waiting", daysWaiting: 0 },
  { nome: "Pier Petruzziello", partido: "PP", status: "waiting", daysWaiting: 0 },
  { nome: "Professora Angela", partido: "PSOL", status: "waiting", daysWaiting: 0 },
  { nome: "Rafaela Lupion", partido: "PSD", status: "waiting", daysWaiting: 0 },
  { nome: "Renan Ceschin", partido: "Pode", status: "waiting", daysWaiting: 0 },
  { nome: "Rodrigo Marcial", partido: "Novo", status: "waiting", daysWaiting: 0 },
  { nome: "Sargento Tânia Guerreiro", partido: "Pode", status: "waiting", daysWaiting: 0 },
  { nome: "Serginho do Posto", partido: "PSD", status: "waiting", daysWaiting: 0 },
  { nome: "Sidnei Toaldo", partido: "PRD", status: "waiting", daysWaiting: 0 },
  { nome: "Tiago Zeglin", partido: "MDB", status: "waiting", daysWaiting: 0 },
  { nome: "Tico Kuzma", partido: "PSD", status: "waiting", daysWaiting: 0 },
  { nome: "Toninho da Farmácia", partido: "PSD", status: "waiting", daysWaiting: 0 },
  { nome: "Vanda de Assis", partido: "PT", status: "waiting", daysWaiting: 0 },
  { nome: "Zezinho Sabará", partido: "PSD", status: "waiting", daysWaiting: 0 },
];

const STATUS = {
  signed: { label: "Compromisso assinado", color: "#22c55e", short: "Assinado" },
  refused: { label: "Recusou assinar", color: "#ef4444", short: "Recusou" },
  "no-response": { label: "Não respondeu", color: "#eab308", short: "Não respondeu" },
  waiting: { label: "Aguardando", color: "#6b7280", short: "Aguardando" },
};

const iniciais = (nome) =>
  nome
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

export default function RachadometroCuritiba() {
  // Detecta tela estreita para empilhar layouts no mobile.
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 820 : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 820);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [vereadores, setVereadores] = useState(VEREADORES_INICIAIS);
  const [busca, setBusca] = useState("");
  const [partido, setPartido] = useState("all");
  const [filtroStatus, setFiltroStatus] = useState("all");
  const [copiado, setCopiado] = useState(false);

  // --- Abaixo-assinado (captação de lead) ---
  const [totalReal, setTotalReal] = useState(null); // total vindo do Supabase
  const [assinaturasSessao, setAssinaturasSessao] = useState(0); // fallback demonstração
  const [leadForm, setLeadForm] = useState({ nome: "", email: "", telefone: "", bairro: "", mensagem: "", consentimento: false });
  const [leadEnviado, setLeadEnviado] = useState(false);
  const [leadErro, setLeadErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  // --- Formulário do vereador ---
  const [verForm, setVerForm] = useState({ nome: "", partido: "", email: "" });
  const [verEnviado, setVerEnviado] = useState(false);

  // Total exibido: do banco quando ligado; senão, contagem da sessão (demo).
  const totalAssinaturas = SUPABASE_ATIVO
    ? (totalReal ?? 0)
    : assinaturasSessao;

  // Ao abrir a página, busca o total real e a lista de vereadores do banco.
  useEffect(() => {
    if (!SUPABASE_ATIVO) return;
    supabaseTotal()
      .then((n) => setTotalReal(typeof n === "number" ? n : 0))
      .catch(() => setTotalReal(0));
    supabaseVereadores()
      .then((lista) => {
        if (Array.isArray(lista) && lista.length > 0) setVereadores(lista);
      })
      .catch(() => {
        /* mantém a lista de fallback se a leitura falhar */
      });
  }, []);

  const enviarLead = async () => {
    if (!leadForm.nome.trim() || !leadForm.email.trim()) {
      setLeadErro("Informe seu nome e e-mail.");
      return;
    }
    if (!leadForm.consentimento) {
      setLeadErro("É necessário autorizar o uso dos seus dados para assinar.");
      return;
    }
    setLeadErro("");
    setEnviando(true);
    try {
      if (SUPABASE_ATIVO) {
        await supabaseInsert({
          nome: leadForm.nome.trim(),
          email: leadForm.email.trim(),
          whatsapp: leadForm.telefone.trim() || null,
          cidade_bairro: leadForm.bairro.trim() || null,
          mensagem: leadForm.mensagem.trim() || null,
          consentimento: true,
        });
        const n = await supabaseTotal();
        setTotalReal(typeof n === "number" ? n : (totalReal ?? 0) + 1);
      } else {
        // Modo demonstração: conta só na sessão.
        setAssinaturasSessao((n) => n + 1);
      }
      setLeadEnviado(true);
    } catch (e) {
      setLeadErro("Não foi possível registrar agora. Tente novamente em instantes.");
    } finally {
      setEnviando(false);
    }
  };

  const [verEnviando, setVerEnviando] = useState(false);
  const [verErro, setVerErro] = useState("");

  const enviarVereador = async () => {
    if (!verForm.nome.trim()) {
      setVerErro("Informe o nome do parlamentar.");
      return;
    }
    setVerErro("");
    setVerEnviando(true);
    try {
      if (SUPABASE_ATIVO) {
        await supabaseAdesao({
          vereador_nome: verForm.nome.trim(),
          partido: verForm.partido.trim() || null,
          email: verForm.email.trim() || null,
        });
      }
      setVerEnviado(true);
    } catch (e) {
      setVerErro("Não foi possível registrar a adesão agora. Tente novamente.");
    } finally {
      setVerEnviando(false);
    }
  };

  const total = vereadores.length;

  const counts = useMemo(() => {
    const c = { signed: 0, refused: 0, "no-response": 0, waiting: 0 };
    vereadores.forEach((v) => (c[v.status] += 1));
    return c;
  }, [vereadores]);

  const indice = Math.round((counts.signed / total) * 100);

  const partidos = useMemo(
    () => [...new Set(vereadores.map((v) => v.partido))].sort(),
    [vereadores]
  );

  const filtrados = useMemo(() => {
    return vereadores.filter((v) => {
      const okBusca = v.nome.toLowerCase().includes(busca.toLowerCase());
      const okPartido = partido === "all" || v.partido === partido;
      const okStatus = filtroStatus === "all" || v.status === filtroStatus;
      return okBusca && okPartido && okStatus;
    });
  }, [vereadores, busca, partido, filtroStatus]);

  // ângulo do ponteiro: 0% => -90deg (esquerda), 100% => +90deg (direita)
  const ponteiroAng = -90 + (indice / 100) * 180;

  const corIndice =
    indice <= 30 ? STATUS.refused.color : indice <= 70 ? STATUS["no-response"].color : STATUS.signed.color;

  const compartilharTexto = `Rachadômetro Curitiba: ${counts.signed} de ${total} vereadores assinaram o compromisso contra a rachadinha.`;
  const url = "https://www.rachadometrocuritiba.com.br";

  const copiarLink = () => {
    navigator.clipboard?.writeText(url).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  const filtrosStatus = [
    { key: "all", label: "Todos" },
    { key: "signed", label: "Compromisso assinado" },
    { key: "no-response", label: "Não respondeu" },
    { key: "refused", label: "Recusou assinar" },
    { key: "waiting", label: "Aguardando" },
  ];

  return (
    <div
      style={{
        background: "#0a0c10",
        color: "#e7e9ee",
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        html, body { margin: 0; overflow-x: hidden; max-width: 100%; }
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        .mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
        .fade-up { animation: fadeUp .6s ease both; }
        .card-hover { transition: transform .2s ease, border-color .2s ease; }
        .card-hover:hover { transform: translateY(-4px); border-color: rgba(255,255,255,.3) !important; }
        .rdm-input::placeholder { color: #6b7280; }
      `}</style>

      {/* Ticker */}
      <div
        style={{
          overflow: "hidden",
          borderBottom: "1px solid #1c2230",
          background: "rgba(20,24,34,.6)",
          padding: "8px 0",
          fontSize: 11,
          letterSpacing: ".15em",
          textTransform: "uppercase",
          color: "#8a91a3",
        }}
        className="mono"
      >
        <div style={{ display: "flex", whiteSpace: "nowrap", animation: "ticker 30s linear infinite" }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ display: "flex", gap: 48, flexShrink: 0, paddingRight: 48 }}>
              <span>⚪ Painel de transparência cidadã</span>
              <span>● Câmara Municipal de Curitiba — 19ª Legislatura (2025–2028)</span>
              <span>▲ 38 vereadores monitorados</span>
              <span>◆ Atualização contínua</span>
              <span>★ Compromisso público contra rachadinha e nepotismo</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero */}
      <header style={{ position: "relative", borderBottom: "1px solid #1c2230", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 20% 0%, rgba(34,197,94,.12), transparent 40%), radial-gradient(circle at 80% 30%, rgba(239,68,68,.10), transparent 45%)",
          }}
        />
        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "64px 24px" }}>
          <div
            className="mono fade-up"
            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, letterSpacing: ".3em", textTransform: "uppercase", color: "#8a91a3" }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
            Painel cidadão · ao vivo
          </div>
          <h1 className="fade-up" style={{ marginTop: 24, fontSize: "clamp(44px, 8vw, 96px)", fontWeight: 700, lineHeight: 0.95, letterSpacing: "-0.02em" }}>
            RACHADÔ<span style={{ color: "#22c55e" }}>METRO</span>
            <br />
            <span style={{ color: "#8a91a3" }}>CURITIBA</span>
          </h1>
          <p className="fade-up" style={{ marginTop: 24, maxWidth: 620, fontSize: 19, color: "#a7adbb" }}>
            Dos <strong style={{ color: "#e7e9ee" }}>38 vereadores</strong> de Curitiba, quantos assumem{" "}
            <strong style={{ color: "#e7e9ee" }}>publicamente</strong> compromisso contra a{" "}
            <strong style={{ color: "#ef4444" }}>rachadinha</strong>?
          </p>
          <div className="fade-up" style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 12 }}>
            <a href="#painel" style={btnPrimary}>
              <BarChart3 size={16} /> Ver painel completo <ArrowDown size={16} />
            </a>
            <a href="#vereadores" style={btnGhost}>
              Conhecer os 38 vereadores
            </a>
          </div>

          {/* KPIs */}
          <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <Kpi label="Total vereadores" value={total} color="#e7e9ee" border="#1c2230" />
            <Kpi label="Compromisso assinado" value={counts.signed} color={STATUS.signed.color} border="rgba(34,197,94,.4)" />
            <Kpi label="Não responderam" value={counts["no-response"]} color={STATUS["no-response"].color} border="rgba(234,179,8,.4)" />
            <Kpi label="Recusaram assinar" value={counts.refused} color={STATUS.refused.color} border="rgba(239,68,68,.4)" />
          </div>
        </div>
      </header>

      {/* 01 — Caso em destaque: abaixo-assinado + cobrança */}
      <section style={{ borderBottom: "1px solid #1c2230" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 24px" }}>
          <SectionHead num="01 — Mobilização cidadã" titulo="Caso em destaque" icon={<TriangleAlert size={16} />}>
            Acompanhamento de processo disciplinar em andamento na Câmara Municipal de Curitiba.
          </SectionHead>

          {/* Aviso factual — presunção de inocência (discreto) */}
          <p style={{ marginTop: 16, fontSize: 12, color: "#8a91a3", lineHeight: 1.6, maxWidth: 820 }}>
            <span className="mono" style={{ textTransform: "uppercase", letterSpacing: ".1em", color: "#6b7280" }}>Fato público · em apuração — </span>
            Em 1º de junho de 2026, a Câmara Municipal de Curitiba aprovou a abertura de processo de cassação contra o
            vereador Lórens Nogueira (PP), investigado pelo MPPR (Operação Déjà-vu, Gaeco) por suspeita de rachadinha e
            peculato; a denúncia foi aceita por 35 votos a 1. O parlamentar nega irregularidades e o caso segue em
            apuração — vale a presunção de inocência até decisão final. Fontes: Câmara de Curitiba · MPPR/Gaeco ·
            noticiário local (jun/2026).
          </p>

          <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1fr) minmax(0,1fr)", gap: 32, alignItems: "start" }}>
            {/* Coluna esquerda: título + texto + contador */}
            <div>
              <h3 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 700, lineHeight: 1.05, margin: 0, letterSpacing: "-0.02em" }}>
                Você apoia o processo de cassação do{" "}
                <span style={{ color: STATUS.refused.color }}>vereador Lórens Nogueira</span>?
              </h3>
              <p style={{ marginTop: 16, fontSize: 15, color: "#a7adbb", lineHeight: 1.6, maxWidth: 460 }}>
                Assine este abaixo-assinado público e some sua voz à mobilização cidadã pela responsabilização e
                investigação de irregularidades na Câmara Municipal de Curitiba.
              </p>

              {/* Contador */}
              <div style={{ ...cardGrad, marginTop: 28, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="mono" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, letterSpacing: ".2em", textTransform: "uppercase", color: "#8a91a3" }}>
                    <ShieldCheck size={16} /> Assinaturas
                  </span>
                  <span className="mono" style={{ fontSize: 36, fontWeight: 700, color: STATUS.refused.color }}>
                    {totalAssinaturas.toLocaleString("pt-BR")}
                  </span>
                </div>
                <div style={{ marginTop: 16, height: 8, borderRadius: 999, background: "#1c2230", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min((totalAssinaturas / 10000) * 100, 100)}%`, background: STATUS.refused.color, transition: "width .6s ease" }} />
                </div>
                <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8a91a3" }}>
                  <span>{Math.min(Math.round((totalAssinaturas / 10000) * 100), 100)}% da meta</span>
                  <span>Meta: 10.000</span>
                </div>
              </div>
            </div>

            {/* Coluna direita: formulário */}
            <div style={{ ...cardGrad, padding: 28 }}>
              <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Assine agora</h3>

              {leadEnviado ? (
                <div style={{ marginTop: 20, borderRadius: 12, border: "1px solid rgba(34,197,94,.4)", background: "rgba(34,197,94,.08)", padding: 24, textAlign: "center" }}>
                  <ShieldCheck size={28} style={{ color: STATUS.signed.color }} />
                  <p style={{ marginTop: 8, fontWeight: 600 }}>Assinatura registrada. Obrigado!</p>
                  <p style={{ marginTop: 4, fontSize: 13, color: "#a7adbb" }}>
                    Compartilhe para ampliar a pressão cidadã.
                  </p>
                </div>
              ) : (
                <div style={{ marginTop: 20, display: "grid", gap: 16 }}>
                  <label style={labelStyle}>
                    Nome completo *
                    <input style={{ ...inputStyle, marginTop: 6 }} value={leadForm.nome} onChange={(e) => setLeadForm({ ...leadForm, nome: e.target.value })} />
                  </label>
                  <label style={labelStyle}>
                    E-mail *
                    <input style={{ ...inputStyle, marginTop: 6 }} type="email" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} />
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <label style={labelStyle}>
                      WhatsApp
                      <input style={{ ...inputStyle, marginTop: 6 }} placeholder="(41) 9 …" value={leadForm.telefone} onChange={(e) => setLeadForm({ ...leadForm, telefone: e.target.value })} />
                    </label>
                    <label style={labelStyle}>
                      Cidade / Bairro
                      <input style={{ ...inputStyle, marginTop: 6 }} value={leadForm.bairro} onChange={(e) => setLeadForm({ ...leadForm, bairro: e.target.value })} />
                    </label>
                  </div>
                  <label style={labelStyle}>
                    Mensagem (opcional)
                    <textarea style={{ ...inputStyle, marginTop: 6, minHeight: 80, resize: "vertical" }} value={leadForm.mensagem} onChange={(e) => setLeadForm({ ...leadForm, mensagem: e.target.value })} />
                  </label>
                  {leadErro && <p style={{ fontSize: 12, color: STATUS.refused.color, margin: 0 }}>{leadErro}</p>}
                  <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12, color: "#a7adbb", cursor: "pointer", lineHeight: 1.5 }}>
                    <input
                      type="checkbox"
                      checked={leadForm.consentimento}
                      onChange={(e) => setLeadForm({ ...leadForm, consentimento: e.target.checked })}
                      style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0, accentColor: STATUS.refused.color }}
                    />
                    <span>
                      Autorizo o uso dos meus dados para esta campanha de mobilização cidadã, conforme a{" "}
                      <a href="#privacidade" style={{ color: "#cfd3dc", textDecoration: "underline" }}>política de privacidade</a>. *
                    </span>
                  </label>
                  <button style={{ ...btnPrimary, background: STATUS.refused.color, color: "#fff", justifyContent: "center", width: "100%", opacity: enviando ? 0.6 : 1, cursor: enviando ? "wait" : "pointer" }} onClick={enviarLead} disabled={enviando}>
                    <ShieldCheck size={16} /> {enviando ? "Enviando…" : "Assinar pela apuração"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Adesão do vereador */}
          <div id="adesao-vereador" style={{ ...cardGrad, marginTop: 24, padding: 28, borderColor: "rgba(34,197,94,.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldCheck size={18} style={{ color: STATUS.signed.color }} />
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Sou vereador(a) e assino o compromisso</h3>
            </div>
            <p style={{ marginTop: 8, fontSize: 14, color: "#a7adbb", maxWidth: 640 }}>
              Parlamentares da Câmara de Curitiba podem assumir publicamente o compromisso contra rachadinha e nepotismo.
              Após a validação e o retorno do termo de compromisso enviado por e-mail, o ranking é atualizado.
            </p>
            {verEnviado ? (
              <div style={{ marginTop: 16, fontSize: 14, color: STATUS.signed.color, fontWeight: 600 }}>
                ✓ Adesão recebida. Após a validação e o retorno do termo de compromisso assinado (enviado ao seu e-mail), o ranking será atualizado.
              </div>
            ) : (
              <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                <input autoComplete="off" name="ver_nome_rdm" style={{ ...inputStyle, flex: "1 1 200px" }} placeholder="Nome parlamentar *" value={verForm.nome} onChange={(e) => setVerForm({ ...verForm, nome: e.target.value })} />
                <input autoComplete="off" name="ver_partido_rdm" style={{ ...inputStyle, flex: "1 1 120px" }} placeholder="Partido" value={verForm.partido} onChange={(e) => setVerForm({ ...verForm, partido: e.target.value })} />
                <input autoComplete="off" name="ver_email_rdm" style={{ ...inputStyle, flex: "1 1 200px" }} placeholder="E-mail oficial" type="email" value={verForm.email} onChange={(e) => setVerForm({ ...verForm, email: e.target.value })} />
                <button style={{ ...btnPrimary, opacity: verEnviando ? 0.6 : 1, cursor: verEnviando ? "wait" : "pointer" }} onClick={enviarVereador} disabled={verEnviando}>
                  <ShieldCheck size={16} /> {verEnviando ? "Enviando…" : "Assinar compromisso"}
                </button>
                {verErro && <p style={{ width: "100%", fontSize: 12, color: STATUS.refused.color, margin: 0 }}>{verErro}</p>}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 02 — Painel completo */}
      <section id="vereadores" style={{ borderBottom: "1px solid #1c2230" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 24px" }}>
          <SectionHead num="02 — Painel completo" titulo="Os 38 vereadores">
            Posicionamento individual de cada parlamentar. Atualizado conforme manifestações oficiais.
          </SectionHead>

          {/* Controles */}
          <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", background: "rgba(20,24,34,.6)", border: "1px solid #1c2230", borderRadius: 16, padding: 16 }}>
            <div style={{ position: "relative", flex: "1 1 220px" }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#6b7280" }} />
              <input
                className="rdm-input mono"
                placeholder="Buscar por nome…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                style={{ width: "100%", borderRadius: 8, border: "1px solid #1c2230", background: "rgba(10,12,16,.6)", padding: "10px 12px 10px 36px", fontSize: 13, color: "#e7e9ee", outline: "none" }}
              />
            </div>
            <select
              value={partido}
              onChange={(e) => setPartido(e.target.value)}
              style={{ borderRadius: 8, border: "1px solid #1c2230", background: "rgba(10,12,16,.6)", padding: "10px 12px", fontSize: 13, color: "#e7e9ee", outline: "none" }}
            >
              <option value="all">Todos os partidos</option>
              {partidos.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {filtrosStatus.map((f) => {
                const ativo = filtroStatus === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFiltroStatus(f.key)}
                    style={{
                      borderRadius: 999,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      border: `1px solid ${ativo ? "#22c55e" : "#1c2230"}`,
                      background: ativo ? "#22c55e" : "rgba(10,12,16,.4)",
                      color: ativo ? "#06210f" : "#8a91a3",
                      transition: "all .2s",
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mono" style={{ marginTop: 12, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "#8a91a3" }}>
            Exibindo {filtrados.length} de {total}
          </div>

          {/* Grade */}
          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: 16 }}>
            {filtrados.map((v, i) => {
              const s = STATUS[v.status];
              return (
                <article
                  key={v.nome}
                  className="card-hover fade-up"
                  style={{ ...cardGrad, padding: 16, border: `1px solid ${s.color}33`, animationDelay: `${Math.min(i * 18, 600)}ms` }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ position: "relative", display: "grid", placeItems: "center", height: 56, width: 56, flexShrink: 0, borderRadius: "50%", background: `${s.color}26`, color: "#cfd3dc", fontWeight: 700, border: `2px solid ${s.color}4d` }}>
                      {iniciais(v.nome)}
                      <span style={{ position: "absolute", bottom: -2, right: -2, height: 16, width: 16, borderRadius: "50%", background: s.color, boxShadow: "0 0 0 2px #0a0c10" }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 style={{ fontWeight: 600, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>{v.nome}</h3>
                      <p className="mono" style={{ fontSize: 12, color: "#8a91a3", marginTop: 2 }}>{v.partido}</p>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#a7adbb" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                    <span style={{ fontWeight: 500 }}>{s.short}</span>
                  </div>
                  {v.status === "waiting" && v.daysWaiting > 0 && (
                    <div className="mono" style={{ marginTop: 8, fontSize: 10, letterSpacing: ".05em", textTransform: "uppercase", color: "#6b7280" }}>
                      {v.daysWaiting} dias sem resposta
                    </div>
                  )}
                  <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                    <button style={btnCardGhost} onClick={() => { setVerForm({ nome: v.nome, partido: v.partido, email: "" }); setVerEnviado(false); document.getElementById("adesao-vereador")?.scrollIntoView({ behavior: "smooth" }); }}>
                      <ShieldCheck size={14} /> Assinar compromisso
                    </button>
                    <a
                      style={btnCardWhats}
                      href={`https://wa.me/${v.whatsapp || ""}?text=${encodeURIComponent(
                        v.status === "signed"
                          ? `Olá, vereador(a) ${v.nome}! Sou eleitor(a) de Curitiba e vi no Rachadômetro Curitiba (${url}) que você assinou o compromisso público contra a rachadinha e o nepotismo. Obrigado(a) pelo posicionamento — conte com a fiscalização cidadã para que ele seja cumprido.`
                          : `Olá, vereador(a) ${v.nome}! Sou eleitor(a) de Curitiba e vi no Rachadômetro Curitiba (${url}) que você ainda não assinou o compromisso público contra a rachadinha e o nepotismo. Peço que se posicione publicamente e assine o compromisso. Aguardo retorno.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle size={14} /> Cobrar no WhatsApp
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 03 — Indicador */}
      <section id="painel" style={{ borderBottom: "1px solid #1c2230" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 24px" }}>
          <SectionHead num="03 — Indicador principal" titulo="Índice Anti-Rachadinha" icon={<Megaphone size={16} />}>
            Percentual de vereadores que assumiram compromisso público contra rachadinha e nepotismo.
          </SectionHead>

          <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0,2fr) minmax(0,3fr)", gap: 32 }}>
            {/* Medidor */}
            <div style={{ ...cardGrad, padding: 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ position: "relative", width: "100%", maxWidth: 320 }}>
                <svg viewBox="0 0 200 130" style={{ width: "100%" }}>
                  <path d="M 20 100 A 80 80 0 0 1 52.98 35.28" stroke={STATUS.refused.color} strokeWidth="18" fill="none" strokeLinecap="round" opacity="0.85" />
                  <path d="M 52.98 35.28 A 80 80 0 0 1 147.02 35.28" stroke={STATUS["no-response"].color} strokeWidth="18" fill="none" opacity="0.85" />
                  <path d="M 147.02 35.28 A 80 80 0 0 1 180 100" stroke={STATUS.signed.color} strokeWidth="18" fill="none" strokeLinecap="round" opacity="0.85" />
                  <g style={{ transform: `rotate(${ponteiroAng}deg)`, transformOrigin: "100px 100px", transition: "transform 1.4s cubic-bezier(.2,.7,.2,1)" }}>
                    <line x1="100" y1="100" x2="100" y2="30" stroke="#e7e9ee" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="100" cy="30" r="4" fill={corIndice} />
                  </g>
                  <circle cx="100" cy="100" r="8" fill="#0a0c10" stroke="#e7e9ee" strokeWidth="2" />
                </svg>
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, textAlign: "center" }}>
                  <div className="mono" style={{ fontSize: 48, fontWeight: 700, color: corIndice }}>{indice}%</div>
                  <div style={{ fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: "#8a91a3", marginTop: 4 }}>
                    Índice Anti-Rachadinha
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, width: "100%", textAlign: "center", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase" }}>
                <Faixa color={STATUS.refused.color} txt="0–30%" sub="Crítico" />
                <Faixa color={STATUS["no-response"].color} txt="31–70%" sub="Insuficiente" />
                <Faixa color={STATUS.signed.color} txt="71–100%" sub="Transparente" />
              </div>
            </div>

            {/* Métricas */}
            <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
              <div style={{ ...cardGrad, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span className="mono" style={{ fontSize: 11, letterSpacing: ".25em", textTransform: "uppercase", color: "#8a91a3" }}>
                    Transparência da Câmara
                  </span>
                  <span className="mono" style={{ fontSize: 32, fontWeight: 700, color: STATUS.signed.color }}>{indice}%</span>
                </div>
                <div style={{ marginTop: 16, height: 12, borderRadius: 999, background: "#1c2230", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${indice}%`, borderRadius: 999, background: STATUS.signed.color, transition: "width 1s ease" }} />
                </div>
                <p style={{ marginTop: 12, fontSize: 12, color: "#8a91a3" }}>
                  Percentual calculado automaticamente sobre o total de {total} vereadores.
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <MiniStat icon={<ShieldCheck size={16} />} label="Compromisso assinado" value={counts.signed} color={STATUS.signed.color} />
                <MiniStat icon={<TriangleAlert size={16} />} label="Recusaram assinar" value={counts.refused} color={STATUS.refused.color} />
                <MiniStat icon={<Clock size={16} />} label="Não responderam" value={counts["no-response"]} color={STATUS["no-response"].color} />
                <MiniStat icon={<BarChart3 size={16} />} label="Aguardando manifestação" value={counts.waiting} color="#8a91a3" />
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* 05 — Compartilhe */}
      <section style={{ borderBottom: "1px solid #1c2230", background: "rgba(20,24,34,.4)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 24px", display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div className="mono" style={{ fontSize: 11, letterSpacing: ".3em", textTransform: "uppercase", color: "#8a91a3" }}>04 — Espalhe</div>
            <h2 style={{ marginTop: 8, fontSize: "clamp(26px,4vw,38px)", fontWeight: 700 }}>Quanto mais pressão, mais transparência.</h2>
            <p style={{ marginTop: 8, maxWidth: 520, color: "#a7adbb" }}>Compartilhe o Rachadômetro e ajude a manter o tema na agenda pública.</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <a style={btnPrimary} href={`https://wa.me/?text=${encodeURIComponent(compartilharTexto + " " + url)}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> WhatsApp</a>
            <a style={btnPrimary} href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer"><Facebook size={16} /> Facebook</a>
            <a style={btnPrimary} href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer"><Instagram size={16} /> Instagram</a>
            <button style={btnGhost} onClick={copiarLink}><Share2 size={16} /> {copiado ? "Copiado!" : "Copiar link"}</button>
          </div>
        </div>
      </section>

      {/* Política de privacidade */}
      <section id="privacidade" style={{ borderTop: "1px solid #1c2230" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px", fontSize: 13, color: "#8a91a3", lineHeight: 1.7 }}>
          <h3 className="mono" style={{ fontSize: 12, letterSpacing: ".2em", textTransform: "uppercase", color: "#cfd3dc", margin: 0 }}>
            Política de privacidade
          </h3>
          <p style={{ marginTop: 12 }}>
            Coletamos nome, e-mail e, opcionalmente, telefone/WhatsApp e bairro com a única finalidade de registrar sua
            assinatura no abaixo-assinado e mantê-lo(a) informado(a) sobre esta campanha de mobilização cidadã. A base
            legal é o seu consentimento (art. 7º, I, da LGPD), manifestado ao marcar a caixa de autorização.
          </p>
          <p style={{ marginTop: 10 }}>
            Seus dados não são vendidos nem compartilhados com terceiros para fins comerciais. Você pode solicitar acesso,
            correção ou exclusão dos seus dados a qualquer momento pelo e-mail de contato da campanha; nesse caso, sua
            assinatura é removida. Mantemos os registros apenas enquanto a campanha estiver ativa.
          </p>
          <p style={{ marginTop: 10 }}>
            Contato para solicitações de privacidade (LGPD): <a href="mailto:minhamissaoparana@gmail.com" style={{ color: "#cfd3dc", textDecoration: "underline" }}>minhamissaoparana@gmail.com</a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px", fontSize: 13, color: "#8a91a3", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 600, color: "#e7e9ee" }}>Rachadômetro Curitiba</div>
          <div style={{ fontSize: 12 }}>Fiscalização cidadã · 19ª Legislatura (2025–2028)</div>
        </div>
        <div className="mono" style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase" }}>Dados públicos · Câmara Municipal de Curitiba</div>
      </footer>
    </div>
  );
}

// --- Subcomponentes ---------------------------------------------------------
const cardGrad = {
  borderRadius: 16,
  border: "1px solid #1c2230",
  background: "linear-gradient(180deg, rgba(28,34,48,.5), rgba(16,20,28,.5))",
  boxShadow: "0 10px 30px -15px rgba(0,0,0,.6)",
};
const btnPrimary = {
  display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999, background: "#22c55e",
  padding: "12px 24px", fontSize: 13, fontWeight: 600, color: "#06210f", textDecoration: "none",
  border: "none", cursor: "pointer",
};
const btnGhost = {
  display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999, border: "1px solid #1c2230",
  background: "rgba(20,24,34,.5)", padding: "12px 24px", fontSize: 13, fontWeight: 600, color: "#e7e9ee",
  textDecoration: "none", cursor: "pointer",
};
const inputStyle = {
  borderRadius: 8, border: "1px solid #1c2230", background: "rgba(10,12,16,.6)",
  padding: "11px 14px", fontSize: 14, color: "#e7e9ee", outline: "none", width: "100%", boxSizing: "border-box",
  fontFamily: "'Space Grotesk', system-ui, sans-serif",
};
const labelStyle = {
  display: "block", fontSize: 13, fontWeight: 500, color: "#cfd3dc",
};
const btnCardGhost = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%",
  borderRadius: 8, border: "1px solid #1c2230", background: "rgba(10,12,16,.4)", padding: "8px 10px",
  fontSize: 12, fontWeight: 500, color: "#cfd3dc", cursor: "pointer", textDecoration: "none",
  fontFamily: "'Space Grotesk', system-ui, sans-serif", transition: "all .2s",
};
const btnCardWhats = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%",
  borderRadius: 8, border: "1px solid rgba(34,197,94,.4)", background: "rgba(34,197,94,.1)", padding: "8px 10px",
  fontSize: 12, fontWeight: 600, color: "#22c55e", cursor: "pointer", textDecoration: "none",
  fontFamily: "'Space Grotesk', system-ui, sans-serif", transition: "all .2s",
};

function Kpi({ label, value, color, border }) {
  return (
    <div style={{ borderRadius: 12, border: `1px solid ${border}`, background: "rgba(20,24,34,.6)", padding: 20 }}>
      <div className="mono" style={{ fontSize: 10, letterSpacing: ".25em", textTransform: "uppercase", color: "#8a91a3" }}>{label}</div>
      <div className="mono" style={{ marginTop: 8, fontSize: 36, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function SectionHead({ num, titulo, children, icon }) {
  return (
    <div style={{ maxWidth: 720 }}>
      <div className="mono" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, letterSpacing: ".3em", textTransform: "uppercase", color: "#8a91a3" }}>
        {icon} {num}
      </div>
      <h2 style={{ marginTop: 12, fontSize: "clamp(30px,5vw,46px)", fontWeight: 700, letterSpacing: "-0.02em" }}>{titulo}</h2>
      <p style={{ marginTop: 12, color: "#a7adbb" }}>{children}</p>
    </div>
  );
}

function MiniStat({ icon, label, value, color }) {
  return (
    <div style={{ borderRadius: 12, border: "1px solid #1c2230", background: "rgba(20,24,34,.5)", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color }}>
        {icon} {label}
      </div>
      <div className="mono" style={{ marginTop: 8, fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Faixa({ color, txt, sub }) {
  return (
    <div style={{ borderRadius: 6, background: `${color}26`, padding: "8px 4px", color }}>
      {txt}
      <br />
      <span style={{ fontSize: 9, opacity: 0.8 }}>{sub}</span>
    </div>
  );
}
