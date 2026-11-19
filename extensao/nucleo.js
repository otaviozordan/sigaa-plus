/* SIGAA+ — núcleo: rede, coleta, histórico e cálculos. Nada sai do navegador. */
var SMN = (() => {
  const { clean } = SM;
  const CORES = ['#4f7cff', '#e8833a', '#2fa36b', '#c9479b', '#8a5cf6', '#d9a400', '#1fa5b8', '#e0524d', '#6b8e23', '#b06c3a', '#3d6db5', '#a0522d'];
  const DIAS = { 2: 'Seg', 3: 'Ter', 4: 'Qua', 5: 'Qui', 6: 'Sex', 7: 'Sáb' };
  const DIAS_LONGOS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const DIA_MS = 864e5;
  /** Horários da UNIFEI (tabela de horários do SIGAA). Editáveis em Ajustes. M6, T6 e noite não aparecem na tabela: estimados. */
  const HORAS_PADRAO = {
    M1: '07:00-07:55', M2: '07:55-08:50', M3: '08:50-09:45', M4: '10:10-11:05', M5: '11:05-12:00', M6: '12:00-12:55',
    T1: '13:30-14:25', T2: '14:25-15:20', T3: '15:45-16:40', T4: '16:40-17:35', T5: '17:35-18:30', T6: '18:30-19:25',
    N1: '19:00-19:50', N2: '19:50-20:40', N3: '20:50-21:40', N4: '21:40-22:30',
  };
  /** Padrão antigo (genérico do SIGAA), para migrar quem já usava a versão anterior. */
  const HORAS_ANTIGAS = {
    M1: '07:00-07:50', M2: '07:50-08:40', M3: '08:55-09:45', M4: '09:45-10:35', M5: '10:50-11:40', M6: '11:40-12:30',
    T1: '13:00-13:50', T2: '13:50-14:40', T3: '14:55-15:45', T4: '15:45-16:35', T5: '16:50-17:40', T6: '17:40-18:30',
    N1: '18:45-19:35', N2: '19:35-20:25', N3: '20:35-21:25', N4: '21:25-22:15',
  };
  const CFG_PADRAO = { tema: 'auto', mediaAprov: 6, unidadesPadrao: 2, horas: HORAS_PADRAO, horasVer: 2, inicio: '', fim: '', autoAbrir: false, cacheMin: 30, checarAtualizacao: true };
  /** Repositório oficial: usado para avisar quando há versão nova. */
  const REPO = 'otaviozordan/sigaa-plus';
  const LINKS = {
    repo: `https://github.com/${REPO}`,
    manifest: `https://raw.githubusercontent.com/${REPO}/main/extensao/manifest.json`,
    download: `https://github.com/${REPO}/releases/latest/download/sigaa-plus.zip`,
    novidades: `https://github.com/${REPO}/releases/latest`,
    importarGoogle: 'https://calendar.google.com/calendar/r/settings/export',
  };
  /** "2.10.0" > "2.9.1" ? */
  const versaoMaior = (a, b) => {
    const x = String(a || '').split('.').map(Number), y = String(b || '').split('.').map(Number);
    for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d > 0; }
    return false;
  };
  /** Consulta a versão publicada no GitHub (no máximo a cada 6 h, a não ser que forcar). */
  async function verificarAtualizacao(atual, forcar) {
    const c = await store.get('upd');
    if (!forcar && c && c.remota && Date.now() - c.em < 6 * 36e5) return { ...c, atual, nova: versaoMaior(c.remota, atual) };
    try {
      const r = await fetch(LINKS.manifest + '?t=' + Date.now(), { cache: 'no-store', credentials: 'omit' });
      if (!r.ok) throw new Error('GitHub respondeu ' + r.status);
      const m = await r.json();
      const res = { em: Date.now(), remota: m.version };
      await store.set('upd', res);
      return { ...res, atual, nova: versaoMaior(m.version, atual) };
    } catch (e) { return { ...(c || {}), atual, nova: c ? versaoMaior(c.remota, atual) : false, erro: e.message }; }
  }

  /** Autor (tela Sobre). */
  const AUTOR = { nome: 'Otávio Zordan Alves', linkedin: 'https://www.linkedin.com/in/otavio-zordan/' };

  /* ---------------- utilidades ---------------- */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const semAcento = s => clean(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const norm = s => semAcento(s).toUpperCase();
  const busca = s => semAcento(s).toLowerCase();
  const PEQ = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'a', 'o', 'com', 'na', 'no']);
  const titulo = s => clean(s).toLowerCase().split(' ').map((w, i) =>
    /^(i|ii|iii|iv|v|vi|vii|viii|ix|x)$/.test(w) ? w.toUpperCase() : (i > 0 && PEQ.has(w)) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const parseData = s => { const m = /(\d{2})\/(\d{2})\/(\d{4})/.exec(s || ''); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; };
  const fmt = d => d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` : '';
  const segunda = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const hoje = () => new Date(new Date().toDateString());
  const isoDia = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const deIso = s => s ? new Date(s + 'T00:00:00') : null;
  const atras = iso => { const m = Math.round((Date.now() - new Date(iso)) / 6e4); return m < 1 ? 'agora' : m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.round(m / 60)} h` : `há ${Math.round(m / 1440)} dia(s)`; };
  const dataLonga = d => `${DIAS_LONGOS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
  const diasAte = d => Math.round((d - hoje()) / DIA_MS);
  const quando = d => { const n = diasAte(d); return n === 0 ? 'hoje' : n === 1 ? 'amanhã' : n === -1 ? 'ontem' : n < 0 ? `há ${-n} dias` : n < 7 ? `em ${n} dias` : `em ${Math.round(n / 7)} sem.`; };
  /** "7,5" -> 7.5 ; "-" -> null */
  const num = v => { const m = /^-?\d+(?:[.,]\d+)?$/.exec(clean(String(v ?? ''))); return m ? +m[0].replace(',', '.') : null; };
  const f1 = n => n == null || isNaN(n) ? '–' : (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');
  const f2 = n => n == null || isNaN(n) ? '–' : n.toFixed(2).replace('.', ',');
  const minutos = hhmm => { const m = /(\d{1,2}):(\d{2})/.exec(hhmm || ''); return m ? +m[1] * 60 + +m[2] : null; };

  const store = {
    async get(k) { try { return (await chrome.storage.local.get(k))[k]; } catch { return undefined; } },
    async set(k, v) { try { await chrome.storage.local.set({ [k]: v }); } catch { } },
    async del(k) { try { await chrome.storage.local.remove(k); } catch { } },
  };

  /* ---------------- rede ---------------- */
  const origem = () => location.origin;
  const portalUrl = () => origem() + '/sigaa/portais/discente/discente.jsf';

  async function fetchDoc(url, opts = {}) {
    const r = await fetch(url, { credentials: 'include', ...opts });
    const buf = await r.arrayBuffer();
    const cs = ((/charset=([^;]+)/i.exec(r.headers.get('content-type') || '') || [])[1] || 'iso-8859-1').trim();
    let html; try { html = new TextDecoder(cs).decode(buf); } catch { html = new TextDecoder('iso-8859-1').decode(buf); }
    return { url: r.url, html, doc: new DOMParser().parseFromString(html, 'text/html') };
  }

  function camposDoForm(page, formId, extra) {
    const form = page.doc.getElementById(formId);
    if (!form) throw new Error(`formulário ${formId} não encontrado`);
    const campos = SM.formFields(form);
    for (const [k, v] of extra) { const i = campos.findIndex(c => c[0] === k); if (i >= 0) campos[i][1] = v; else campos.push([k, v]); }
    if (!campos.some(c => c[0] === 'javax.faces.ViewState')) {
      const vs = page.doc.querySelector('input[name="javax.faces.ViewState"]'); if (vs) campos.push(['javax.faces.ViewState', vs.value]);
    }
    return { campos, action: new URL(form.getAttribute('action') || page.url, page.url).href };
  }

  /** Submete um form JSF de uma página já buscada, com parâmetros extras. */
  async function postForm(page, formId, extra) {
    const { campos, action } = camposDoForm(page, formId, extra);
    return fetchDoc(action, { method: 'POST', body: new URLSearchParams(campos), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  }

  /** Mesmo POST, mas como navegação real numa nova aba. */
  function postNovaAba(page, formId, extra) {
    const { campos, action } = camposDoForm(page, formId, extra);
    const f = document.createElement('form');
    f.method = 'post'; f.target = '_blank'; f.action = action; f.style.display = 'none';
    campos.forEach(([n, v]) => { const i = document.createElement('input'); i.type = 'hidden'; i.name = n; i.value = v; f.appendChild(i); });
    document.body.appendChild(f); f.submit(); f.remove();
  }

  async function abrirPortal() {
    const p = await fetchDoc(portalUrl());
    const e = SM.estadoPagina(p.url, p.doc);
    if (e !== 'ok') throw Object.assign(new Error(e), { estado: e });
    if (!p.doc.querySelector('#turmas-portal, [id="menu:form_menu_discente"]')) throw Object.assign(new Error('portal'), { estado: 'portal' });
    return p;
  }

  /* ---------------- coleta ---------------- */
  async function coletar(progresso, parcial) {
    progresso('Abrindo o Portal do Discente…', 0.02);
    const portal = await abrirPortal();
    const perfil = SM.parsePerfil(portal.doc);
    const turmas = SM.parseTurmas(portal.doc);
    const dados = {
      versao: 2, atualizadoEm: new Date().toISOString(), perfil, periodo: turmas.periodo,
      turmas: turmas.lista.map((t, i) => ({ ...t, cor: CORES[i % CORES.length] })),
      atividades: SM.parseAtividades(portal.doc), atualizacoes: SM.parseAtualizacoes(portal.doc),
      menu: SM.parseMenu(portal.doc, portal.html), notas: [], erros: [], parcial: true,
    };
    const total = dados.turmas.length + 2;
    parcial && parcial(dados);

    progresso('Buscando notas de todos os semestres…', 1 / total);
    try {
      const item = dados.menu.find(m => /relatorioNotasAluno/i.test(m.act)) || dados.menu.find(m => /minhas notas/i.test(m.label));
      if (!item) throw new Error('item "Consultar Minhas Notas" não encontrado');
      const r = await postForm(portal, 'menu:form_menu_discente', [['jscook_action', item.act]]);
      dados.notas = SM.parseNotas(r.doc);
      if (!dados.notas.length) throw new Error('relatório de notas veio vazio');
    } catch (e) { dados.erros.push('Notas: ' + e.message); }
    parcial && parcial(dados);

    for (let i = 0; i < dados.turmas.length; i++) {
      const t = dados.turmas[i];
      progresso(`Frequência ${i + 1}/${dados.turmas.length}: ${titulo(t.nome)}`, (i + 2) / total);
      try {
        const p = await abrirPortal();
        const lista = SM.parseTurmas(p.doc).lista;
        const atual = lista.find(x => x.nome === t.nome && x.idTurma === t.idTurma) || lista[i];
        if (!atual || !atual.jsf) throw new Error('link da turma não encontrado');
        const ava = await postForm(p, atual.jsf.formId, atual.jsf.params);
        if (!ava.doc.getElementById('formMenu')) throw new Error('não entrou na turma virtual');
        let pag = ava;
        try {
          const link = SM.findLink(ava.doc, 'formMenu', 'Frequência');
          if (!link) throw new Error('menu "Frequência" não encontrado');
          const fr = await postForm(ava, link.formId, link.params);
          t.freq = SM.parseFrequencia(fr.doc);
          if (fr.doc.getElementById('formMenu')) pag = fr;
        } catch (e) { t.freqErro = e.message; dados.erros.push(`Frequência de ${titulo(t.nome)}: ${e.message}`); }
        // notas da turma (avaliações, pesos e método) — usa o menu da última página aberta
        progresso(`Notas da turma ${i + 1}/${dados.turmas.length}: ${titulo(t.nome)}`, (i + 2.5) / total);
        delete t.aval; delete t.avalErro;
        for (const base of (pag === ava ? [ava] : [pag, ava])) {
          try {
            const links = SM.linksMenu(base.doc, 'formMenu');
            const ln = links.find(l => /^(ver )?notas$|minhas notas|notas da turma|ver nota/.test(l.texto))
              || links.find(l => /nota/.test(l.texto) && !/notic/.test(l.texto))
              || links.find(l => /nota/i.test(l.onclick) && !/notic/i.test(l.onclick));
            if (!ln) throw new Error('item "Ver Notas" não encontrado no menu da turma. Itens vistos: ' + (links.map(l => l.texto).slice(0, 30).join(' · ') || 'nenhum'));
            const nt = await postForm(base, ln.jsf.formId, ln.jsf.params);
            const av = SM.parseNotasTurma(nt.doc);
            if (av.vazio) {
              const tit = clean((nt.doc.querySelector('h2, h3, .descricaoOperacao, title') || {}).textContent || '').slice(0, 120);
              throw new Error(`a página "${ln.texto}" abriu, mas sem tabela de notas${tit ? ` (título: ${tit})` : ''}`);
            }
            t.aval = av; delete t.avalErro; break;
          } catch (e) { t.avalErro = e.message; }
        }
      } catch (e) { t.freqErro = e.message; t.avalErro = e.message; dados.erros.push(`Turma ${titulo(t.nome)}: ${e.message}`); }
    }
    try { await fetchDoc(portalUrl()); } catch { }
    delete dados.parcial;
    progresso('Pronto!', 1);
    return dados;
  }

  /** Abre a turma virtual (ou um item do menu) numa nova aba, como se clicasse no SIGAA. */
  async function abrirTurmaNoSigaa(t) {
    const p = await abrirPortal();
    const lista = SM.parseTurmas(p.doc).lista;
    const atual = lista.find(x => x.nome === t.nome && x.idTurma === t.idTurma) || lista.find(x => x.nome === t.nome);
    if (!atual || !atual.jsf) throw new Error('turma não encontrada no portal');
    postNovaAba(p, atual.jsf.formId, atual.jsf.params);
  }
  async function abrirMenuNoSigaa(act) {
    if (!/#\{/.test(act)) { window.open(new URL(act, origem()).href, '_blank'); return; }
    const p = await abrirPortal();
    postNovaAba(p, 'menu:form_menu_discente', [['jscook_action', act]]);
  }

  /* ---------------- histórico (quando cada nota/falta apareceu) ---------------- */
  const ehCampoNota = h => /unid|nota|recup|reposi|resultado|prova|^av|média|media/i.test(h);
  function atualizarHistorico(hist, dados) {
    const primeira = !hist;
    hist = hist || { inicio: isoDia(hoje()), notas: {}, faltas: {} };
    const hj = isoDia(hoje());
    let novas = 0;
    for (const s of dados.notas) {
      s.linhas.forEach(c => {
        s.headers.forEach((h, j) => {
          if (!ehCampoNota(h) || /resultado/i.test(h)) return;
          const v = c[j];
          if (!v || !/\d/.test(v)) return;
          const k = `${s.titulo}|${c[0]}|${h}`;
          const ant = hist.notas[k];
          if (!ant) { hist.notas[k] = { v, visto: primeira ? null : hj }; if (!primeira) novas++; }
          else if (ant.v !== v) { hist.notas[k] = { v, visto: hj, antes: ant.v }; novas++; }
        });
      });
    }
    for (const t of dados.turmas) {
      (t.freq?.registros || []).forEach(r => {
        if (r.faltas == null) return;
        const k = `${t.idTurma || t.nome}|${r.data}`;
        const ant = hist.faltas[k];
        if (!ant) { hist.faltas[k] = { f: r.faltas, visto: primeira ? null : hj }; if (!primeira && r.faltas) novas++; }
        else if (ant.f !== r.faltas) { hist.faltas[k] = { f: r.faltas, visto: hj, antes: ant.f }; novas++; }
      });
    }
    return { hist, novas };
  }

  /* ---------------- derivados ---------------- */
  function colunas(headers) {
    const idx = re => headers.findIndex(h => re.test(h));
    return {
      cod: idx(/c[óo]digo/i), disc: idx(/disciplina|componente/i), fal: idx(/falta/i), sit: idx(/situa/i),
      res: idx(/resultado|m[ée]dia\s*final/i), rec: idx(/recup|reposi/i),
      unid: headers.map((h, j) => (/unid|^n\.?\s*\d|^nota\s*\d|^av\.?\s*\d|^p\d/i.test(h) && !/recup|reposi|resultado|m[ée]dia|final/i.test(h)) ? j : -1).filter(j => j >= 0),
    };
  }

  function resumoFaltas(t, notaLinha, idxFaltas) {
    const f = t.freq;
    let faltas = null, limite = null; const aulasCH = f?.aulasCH ?? null;
    if (f && f.registros.length) faltas = f.registros.reduce((a, r) => a + (r.faltas || 0), 0);
    else if (f && f.aulasRegistradas != null && f.presencas != null) faltas = f.aulasRegistradas - f.presencas;
    else if (notaLinha && idxFaltas >= 0 && /^\d+$/.test(notaLinha[idxFaltas])) faltas = +notaLinha[idxFaltas];
    if (aulasCH) limite = Math.floor(aulasCH * (100 - (f.pctMin || 75)) / 100);
    // aulas por dia de aula (para converter "aulas" em "dias")
    const porDia = []; (t.fixos || t.horarios || []).forEach(c => { const m = /^([2-7]+)[MTN]([1-9]+)$/.exec(c); if (m) for (const _ of m[1]) porDia.push(m[2].length); });
    const aulasDia = porDia.length ? porDia.reduce((a, b) => a + b, 0) / porDia.length : null;
    const restam = limite != null && faltas != null ? limite - faltas : null;
    const nivel = restam == null ? 'na' : restam < 0 ? 'bad' : restam <= Math.max(2, limite * 0.25) ? 'warn' : 'ok';
    return { faltas, limite, aulasCH, restam, aulasDia, nivel, diasRestam: restam != null && aulasDia ? Math.floor(Math.max(0, restam) / aulasDia) : null };
  }

  function montarModelo(dados, hist, cfg) {
    const semAtual = dados.notas.find(s => s.titulo === dados.periodo) || dados.notas[0];
    const col = semAtual ? colunas(semAtual.headers) : colunas([]);
    for (const t of dados.turmas) {
      const linha = semAtual && col.disc >= 0 ? semAtual.linhas.find(c => norm(c[col.disc]) === norm(t.nome)) : null;
      t.codigo = linha && col.cod >= 0 ? linha[col.cod] : (t.codigo || '');
      t.notaLinha = linha || null;
      t.resumo = resumoFaltas(t, linha, col.fal);
      t.unidades = col.unid.map(j => ({ h: semAtual.headers[j], v: linha ? num(linha[j]) : null }));
      t.resultado = linha && col.res >= 0 ? num(linha[col.res]) : null;
      t.situacao = linha && col.sit >= 0 ? linha[col.sit] : '';
      const lanc = t.unidades.filter(u => u.v != null);
      t.mediaParcial = lanc.length ? lanc.reduce((a, u) => a + u.v, 0) / lanc.length : null;
    }
    const datas = dados.turmas.flatMap(t => (t.freq?.registros || []).map(r => parseData(r.data))).filter(Boolean);
    const lim = limitesSemestre(dados, cfg);
    const base = lim.ini || (datas.length ? new Date(Math.min(...datas)) : hoje());
    const ini = segunda(base);
    const semanaDe = d => Math.floor((segunda(d) - ini) / (7 * DIA_MS) + 0.5) + 1;
    return { semAtual, col, ini, semanaDe, hist, lim };
  }

  function limitesSemestre(dados, cfg) {
    let ini = cfg && cfg.inicio ? deIso(cfg.inicio) : null, fim = cfg && cfg.fim ? deIso(cfg.fim) : null;
    if (!ini) { const xs = dados.turmas.map(t => parseData(t.inicio)).filter(Boolean); if (xs.length) ini = new Date(Math.min(...xs)); }
    if (!fim) { const xs = dados.turmas.map(t => parseData(t.fim)).filter(Boolean); if (xs.length) fim = new Date(Math.max(...xs)); }
    if (!ini) { const xs = dados.turmas.flatMap(t => (t.freq?.registros || []).map(r => parseData(r.data))).filter(Boolean); if (xs.length) ini = new Date(Math.min(...xs)); }
    if (ini && !fim) fim = new Date(+ini + 18 * 7 * DIA_MS);
    return { ini, fim };
  }

  /** Simulação: valores (null = ainda não lançada) -> média e quanto falta. */
  function simular(valores, meta) {
    const n = valores.length;
    const lanc = valores.filter(v => v != null);
    const soma = lanc.reduce((a, b) => a + b, 0);
    const faltam = n - lanc.length;
    const media = lanc.length ? soma / lanc.length : null;
    if (!n) return { n, media: null, faltam: 0, precisa: null, estado: 'vazio' };
    if (!faltam) return { n, media: soma / n, faltam, precisa: null, estado: soma / n >= meta - 1e-9 ? 'aprovado' : 'abaixo' };
    const precisa = (meta * n - soma) / faltam;
    return { n, media, faltam, precisa, estado: precisa <= 0 ? 'garantido' : precisa > 10 ? 'impossivel' : 'possivel' };
  }

  /** Avaliações da turma (da página "Ver Notas") -> [{nome, abrev, peso, nota, unid}] */
  function planoAvaliacao(t) {
    const a = t && t.aval; if (!a) return null;
    const pesoDe = s => num((/peso\D{0,4}(\d+(?:[.,]\d+)?)/i.exec(s || '') || [])[1]);
    const avals = (a.avals || []).map(x => ({ nome: x.nome || x.abrev, abrev: x.abrev || x.nome, peso: num(x.peso) ?? 1, nota: num(x.nota), unid: x.unidade || '' }));
    const ehNotaUnid = h => /^(nota|m[ée]dia|total)$/i.test(h);
    // Caminho principal: colunas agrupadas por unidade ("Unid. 1" > R1, R2, Nota ; "Unid. 2" > Nota)
    const cols = (a.colunas || []).filter(c => /unid/i.test(c.grupo) && c.h);
    if (cols.length) {
      const itens = [];
      for (const g of [...new Set(cols.map(c => c.grupo))]) {
        const doGrupo = cols.filter(c => c.grupo === g), notaU = doGrupo.find(c => ehNotaUnid(c.h)), avs = doGrupo.filter(c => !ehNotaUnid(c.h));
        if (!avs.length) { itens.push({ nome: g, abrev: g.replace(/unid(ade)?\.?\s*/i, 'U'), peso: 1, nota: notaU ? num(notaU.v) : null, unid: g, notaUnid: true }); continue; }
        avs.forEach(c => {
          const av = avals.find(x => x.abrev === c.h || x.nome === c.h);
          itens.push({ nome: av ? av.nome : (c.title || c.h), abrev: c.h, peso: av ? av.peso : pesoDe(c.title) ?? 1, nota: num(c.v) ?? (av ? av.nota : null), unid: g });
        });
        // nota da unidade já lançada pelo professor vale mais que a nossa conta
        const nu = notaU ? num(notaU.v) : null;
        if (nu != null) itens.filter(x => x.unid === g).forEach(x => { x.fixaUnid = nu; });
      }
      return itens;
    }
    return avals.length ? avals : null;
  }

  /** Média final pelo plano: média ponderada dentro de cada unidade, depois média das unidades. */
  function simularPlano(itens, meta) {
    const media = vals => {
      const g = new Map();
      itens.forEach((x, j) => {
        const k = x.unid || ''; const s = g.get(k) || { s: 0, p: 0, fixa: null }; g.set(k, s);
        if (x.fixaUnid != null) s.fixa = x.fixaUnid;
        const v = vals[j]; if (v == null) return; s.s += v * x.peso; s.p += x.peso;
      });
      const us = [...g.values()].filter(s => s.fixa != null || s.p > 0).map(s => s.fixa != null ? s.fixa : s.s / s.p);
      return us.length ? us.reduce((a, b) => a + b, 0) / us.length : null;
    };
    // avaliações de unidade já fechada não "faltam"
    const vals = itens.map(x => x.v != null ? x.v : x.fixaUnid != null ? x.fixaUnid : null);
    const faltam = vals.filter(v => v == null).length;
    const atual = media(vals);
    if (!faltam) { const m = media(vals); return { media: m, faltam, precisa: null, estado: m == null ? 'vazio' : m >= meta - 1e-9 ? 'aprovado' : 'abaixo' }; }
    const f0 = media(vals.map(v => v ?? 0)), f10 = media(vals.map(v => v ?? 10));
    const precisa = f10 === f0 ? null : 10 * (meta - f0) / (f10 - f0);
    return { media: atual, faltam, precisa, estado: precisa == null ? 'vazio' : precisa <= 0 ? 'garantido' : precisa > 10 ? 'impossivel' : 'possivel' };
  }

  /* ---------------- horários ---------------- */
  const horaDo = (cfg, slot) => { const s = ((cfg && cfg.horas) || HORAS_PADRAO)[slot] || HORAS_PADRAO[slot] || ''; const [a, b] = s.split('-'); return { ini: a || '', fim: b || '' }; };
  /** "246M12" -> [{dia:2, turno:'M', slots:[1,2]}...] agrupando aulas seguidas. */
  function blocos(code) {
    const m = /^([2-7]+)([MTN])([1-9]+)$/.exec(code); if (!m) return [];
    const nums = [...m[3]].map(Number).sort((a, b) => a - b);
    const runs = []; nums.forEach(n => { const r = runs[runs.length - 1]; if (r && n === r[r.length - 1] + 1) r.push(n); else runs.push([n]); });
    return [...m[1]].flatMap(d => runs.map(r => ({ dia: +d, turno: m[2], slots: r })));
  }
  const textoHorario = (code, cfg) => blocos(code).map(b => { const a = horaDo(cfg, b.turno + b.slots[0]).ini, z = horaDo(cfg, b.turno + b.slots[b.slots.length - 1]).fim; return `${DIAS[b.dia]} ${a}–${z}`; }).join(', ');

  /** Aulas de um dia (Date), com hora de início/fim, ordenadas. */
  function aulasDoDia(turmas, d, cfg) {
    const dia = d.getDay() + 1, dStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const out = [];
    for (const t of turmas) {
      const codes = (t.fixos || (t.datas && t.datas.length ? [] : t.horarios) || []).map(c => ({ c, lab: false }))
        .concat((t.aulasData || []).filter(a => a.data === dStr).map(a => ({ c: a.code, lab: true })));
      for (const { c, lab } of codes) for (const b of blocos(c)) {
        if (b.dia !== dia) continue;
        const ini = horaDo(cfg, b.turno + b.slots[0]).ini, fim = horaDo(cfg, b.turno + b.slots[b.slots.length - 1]).fim;
        if (!out.some(x => x.t === t && x.ini === ini)) out.push({ t, ini, fim, lab, slots: b.turno + b.slots.join(''), qtd: b.slots.length });
      }
    }
    return out.sort((a, b) => (minutos(a.ini) ?? 0) - (minutos(b.ini) ?? 0));
  }

  /* ---------------- exportação ---------------- */
  const icsTxt = s => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  const icsData = (d, hhmm) => { const p = n => String(n).padStart(2, '0'); const base = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`; if (!hhmm) return base; const m = minutos(hhmm); return `${base}T${p(Math.floor(m / 60))}${p(m % 60)}00`; };
  function gerarICS(eventos) {
    const agora = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SIGAA+//PT-BR', 'CALSCALE:GREGORIAN', 'X-WR-TIMEZONE:America/Sao_Paulo', 'X-WR-CALNAME:SIGAA'];
    eventos.forEach((e, i) => {
      L.push('BEGIN:VEVENT', `UID:sigaa-plus-${i}-${icsData(e.dia, e.ini)}@local`, `DTSTAMP:${agora}`);
      if (e.ini) L.push(`DTSTART:${icsData(e.dia, e.ini)}`, `DTEND:${icsData(e.dia, e.fim || e.ini)}`);
      else L.push(`DTSTART;VALUE=DATE:${icsData(e.dia)}`, `DTEND;VALUE=DATE:${icsData(new Date(+e.dia + DIA_MS))}`);
      if (e.ate) L.push(`RRULE:FREQ=WEEKLY;UNTIL=${icsData(e.ate)}T235959`);
      L.push(`SUMMARY:${icsTxt(e.titulo)}`);
      if (e.local) L.push(`LOCATION:${icsTxt(e.local)}`);
      if (e.desc) L.push(`DESCRIPTION:${icsTxt(e.desc)}`);
      if (e.alarme) L.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsTxt(e.titulo)}`, `TRIGGER:-PT${e.alarme}M`, 'END:VALARM');
      L.push('END:VEVENT');
    });
    L.push('END:VCALENDAR');
    return L.map(l => l.length > 74 ? l.match(/.{1,73}/g).join('\r\n ') : l).join('\r\n');
  }

  /** Aulas em datas específicas (laboratórios/práticas) com horário. */
  function aulasEmDatas(turmas, cfg) {
    const out = [];
    turmas.forEach(t => (t.aulasData || []).forEach(a => {
      const d = parseData(a.data); if (!d) return;
      const bs = blocos(a.code).filter(b => b.dia === d.getDay() + 1);
      (bs.length ? bs : [null]).forEach(b => out.push({ t, d, data: a.data, code: a.code,
        ini: b ? horaDo(cfg, b.turno + b.slots[0]).ini : '', fim: b ? horaDo(cfg, b.turno + b.slots[b.slots.length - 1]).fim : '' }));
    }));
    return out.sort((a, b) => a.d - b.d || (minutos(a.ini) ?? 0) - (minutos(b.ini) ?? 0));
  }

  /**
   * Agrupa as aulas em datas específicas de uma turma em eventos do Google Agenda.
   * Datas futuras com mesmo horário e intervalo fixo (ex.: a cada 2 semanas) viram UM evento repetido
   * (1 clique salva todas). Datas soltas viram eventos individuais.
   */
  function labsParaGoogle(t, cfg) {
    const futuras = aulasEmDatas([t], cfg).filter(a => a.d >= hoje());
    const grupos = new Map();
    futuras.forEach(a => { const k = `${a.ini}-${a.fim}-${a.d.getDay()}`; (grupos.get(k) || grupos.set(k, []).get(k)).push(a); });
    const base = a => ({ titulo: titulo(t.nome) + ' (aula prática)', local: t.local, desc: `${t.codigo || ''} ${a.code}`.trim(), ini: a.ini, fim: a.fim });
    const out = [];
    for (const xs of grupos.values()) {
      xs.sort((a, b) => a.d - b.d);
      const gaps = xs.slice(1).map((a, i) => Math.round((a.d - xs[i].d) / DIA_MS));
      const regular = xs.length >= 2 && gaps.every(g => g === gaps[0]) && gaps[0] % 7 === 0;
      if (regular) out.push({ ...base(xs[0]), dia: xs[0].d, rrule: `FREQ=WEEKLY;INTERVAL=${gaps[0] / 7};COUNT=${xs.length}`, qtd: xs.length, datas: xs.map(a => a.d) });
      else xs.forEach(a => out.push({ ...base(a), dia: a.d, qtd: 1, datas: [a.d] }));
    }
    return out.sort((a, b) => a.dia - b.dia);
  }

  /** op.soDatas = só as aulas em datas específicas ; op.turmas = filtra turmas */
  function eventosAulas(dados, modelo, cfg, op = {}) {
    const turmas = op.turmas || dados.turmas;
    const ev = [];
    if (op.soDatas) {
      aulasEmDatas(turmas, cfg).filter(a => !op.futuras || a.d >= hoje()).forEach(a => ev.push({ dia: a.d, ini: a.ini, fim: a.fim, titulo: titulo(a.t.nome) + ' (aula prática)', local: a.t.local, desc: `${a.t.codigo || ''} ${a.code}`.trim(), alarme: a.ini ? 60 : 0 }));
      if (!ev.length) throw new Error('nenhuma aula em data específica encontrada');
      return ev;
    }
    const { ini, fim } = modelo.lim;
    if (!ini || !fim) throw new Error('não sei quando o semestre começa/termina — preencha em Ajustes');
    for (const t of turmas) {
      for (const c of (t.fixos || t.horarios || [])) for (const b of blocos(c)) {
        const d = new Date(ini); while (d.getDay() + 1 !== b.dia) d.setDate(d.getDate() + 1);
        ev.push({ dia: new Date(d), ini: horaDo(cfg, b.turno + b.slots[0]).ini, fim: horaDo(cfg, b.turno + b.slots[b.slots.length - 1]).fim, ate: fim, titulo: titulo(t.nome), local: t.local, desc: `${t.codigo || ''} ${c}`.trim(), alarme: 10 });
      }
      for (const a of (t.aulasData || [])) for (const b of blocos(a.code)) {
        const d = parseData(a.data); if (!d || d.getDay() + 1 !== b.dia) continue;
        ev.push({ dia: d, ini: horaDo(cfg, b.turno + b.slots[0]).ini, fim: horaDo(cfg, b.turno + b.slots[b.slots.length - 1]).fim, titulo: titulo(t.nome) + ' (aula prática)', local: t.local, alarme: 30 });
      }
    }
    return ev;
  }

  function eventosAgenda(dados, pessoal) {
    const ev = [];
    for (const a of dados.atividades) {
      const d = parseData(a.data); if (!d) continue;
      const fimH = a.hora ? `${String(Math.min(23, Math.floor(minutos(a.hora) / 60) + 1)).padStart(2, '0')}:${a.hora.slice(3)}` : '';
      ev.push({ dia: d, ini: a.hora || '', fim: fimH, titulo: `${a.tipo ? a.tipo + ': ' : ''}${a.titulo}`, desc: titulo(a.disciplina), alarme: a.hora ? 24 * 60 : 0 });
    }
    for (const t of (pessoal.tarefas || [])) if (t.data && !t.feito) ev.push({ dia: deIso(t.data), titulo: t.txt, desc: t.turma || '' });
    return ev;
  }

  /** Link "adicionar ao Google Agenda" já preenchido (abre a tela de criar evento do Google). */
  function linkGoogle(e) {
    const datas = e.ini ? `${icsData(e.dia, e.ini)}/${icsData(e.dia, e.fim || e.ini)}` : `${icsData(e.dia)}/${icsData(new Date(+e.dia + DIA_MS))}`;
    const p = new URLSearchParams({ action: 'TEMPLATE', text: e.titulo || '', dates: datas, ctz: 'America/Sao_Paulo' });
    if (e.local) p.set('location', e.local);
    if (e.desc) p.set('details', e.desc);
    if (e.rrule) p.set('recur', 'RRULE:' + e.rrule);
    return 'https://calendar.google.com/calendar/render?' + p.toString();
  }
  const BYDAY = { 2: 'MO', 3: 'TU', 4: 'WE', 5: 'TH', 6: 'FR', 7: 'SA' };
  /** Aulas semanais de uma turma agrupadas por horário -> eventos recorrentes. */
  function eventosSemanais(t, modelo, cfg) {
    const { ini, fim } = modelo.lim, grupos = new Map();
    for (const c of (t.fixos || t.horarios || [])) for (const b of blocos(c)) {
      const a = horaDo(cfg, b.turno + b.slots[0]).ini, z = horaDo(cfg, b.turno + b.slots[b.slots.length - 1]).fim, k = a + '-' + z;
      const g = grupos.get(k) || { ini: a, fim: z, dias: [] }; if (!g.dias.includes(b.dia)) g.dias.push(b.dia); grupos.set(k, g);
    }
    return [...grupos.values()].map(g => {
      g.dias.sort();
      const d = new Date(ini || hoje()); while (!g.dias.includes(d.getDay() + 1)) d.setDate(d.getDate() + 1);
      return { rotulo: `${g.dias.map(x => DIAS[x]).join(', ')} ${g.ini}–${g.fim}`, dia: d, ini: g.ini, fim: g.fim, titulo: titulo(t.nome), local: t.local, desc: t.codigo || '',
        rrule: `FREQ=WEEKLY;BYDAY=${g.dias.map(x => BYDAY[x]).join(',')}${fim ? `;UNTIL=${icsData(fim)}T235959` : ''}` };
    });
  }

  function csvNotas(dados) {
    const q = v => /[";\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : v;
    const L = [];
    for (const s of dados.notas) { L.push(['Semestre', ...s.headers].map(q).join(';')); s.linhas.forEach(c => L.push([s.titulo, ...c].map(q).join(';'))); L.push(''); }
    return '\ufeff' + L.join('\r\n');
  }

  function baixar(nome, conteudo, tipo) {
    const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
    const a = document.createElement('a'); a.href = url; a.download = nome; a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  /** Médias por semestre a partir do relatório de notas. */
  function desempenho(dados, sitClass) {
    const sems = [...dados.notas].map(s => {
      const c = colunas(s.headers);
      const linhas = s.linhas.map(l => ({ cod: c.cod >= 0 ? l[c.cod] : l[0], nome: c.disc >= 0 ? l[c.disc] : l[1], nota: c.res >= 0 ? num(l[c.res]) : null, sit: c.sit >= 0 ? l[c.sit] : '' }));
      const ns = linhas.map(l => l.nota).filter(n => n != null);
      return {
        titulo: s.titulo, linhas, media: ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : null,
        aprov: linhas.filter(l => sitClass(l.sit) === 's-ok').length, reprov: linhas.filter(l => sitClass(l.sit) === 's-bad').length,
        andamento: linhas.filter(l => sitClass(l.sit) === 's-inf').length,
      };
    });
    sems.sort((a, b) => a.titulo.localeCompare(b.titulo));
    const todas = sems.flatMap(s => s.linhas.filter(l => l.nota != null).map(l => ({ ...l, sem: s.titulo })));
    return { sems, todas, mediaGeral: todas.length ? todas.reduce((a, l) => a + l.nota, 0) / todas.length : null };
  }

  return {
    CORES, DIAS, DIA_MS, HORAS_PADRAO, HORAS_ANTIGAS, CFG_PADRAO, AUTOR, LINKS, versaoMaior, verificarAtualizacao, clean, esc, norm, busca, titulo, parseData, fmt, segunda, hoje, isoDia, deIso, atras, dataLonga,
    diasAte, quando, num, f1, f2, minutos, store, portalUrl, fetchDoc, postForm, abrirPortal, coletar, abrirTurmaNoSigaa, abrirMenuNoSigaa,
    ehCampoNota, atualizarHistorico, colunas, montarModelo, limitesSemestre, simular, planoAvaliacao, simularPlano, aulasEmDatas, labsParaGoogle, horaDo, blocos, textoHorario, aulasDoDia,
    gerarICS, linkGoogle, eventosSemanais, eventosAulas, eventosAgenda, csvNotas, baixar, desempenho,
  };
})();
if (typeof module !== 'undefined') module.exports = SMN;
