/* SIGAA+ — leitura das páginas do SIGAA (funções puras, sem rede). */
var SM = (() => {
  const clean = s => (s || '').replace(/\s+/g, ' ').trim();
  const HOR = /\b[2-7]+[MTN][1-9]+\b/g;

  /** Extrai {formId, params} de um onclick do tipo jsfcljs(document.getElementById('f'),{'k':'v'},'') */
  function jsfParams(onclick) {
    const m = /getElementById\('([^']+)'\)\s*,\s*\{([^}]*)\}/.exec(onclick || '');
    if (!m) return null;
    return { formId: m[1], params: [...m[2].matchAll(/'([^']*)'\s*:\s*'([^']*)'/g)].map(x => [x[1], x[2]]) };
  }

  /** Campos que o navegador enviaria ao submeter o form. */
  function formFields(form) {
    return [...form.querySelectorAll('input, select, textarea')].filter(i => {
      if (!i.name || i.disabled) return false;
      const t = (i.type || '').toLowerCase();
      if (/^(submit|button|image|file|reset)$/.test(t)) return false;
      if (/^(checkbox|radio)$/.test(t) && !i.checked) return false;
      return true;
    }).map(i => [i.name, i.value || '']);
  }

  /** Link (por texto) dentro de um form, devolvendo os parâmetros JSF. */
  function findLink(doc, formId, texto) {
    const form = doc.getElementById(formId);
    if (!form) return null;
    const norm = s => clean(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const a = [...form.querySelectorAll('a[onclick]')].find(a => norm(a.textContent) === norm(texto));
    return a ? jsfParams(a.getAttribute('onclick')) : null;
  }

  function parsePerfil(doc) {
    const nomeEl = doc.querySelector('#perfil-docente .info-docente .nome, #perfil-docente .nome');
    const agendas = [...doc.querySelectorAll('[id="agenda-docente"]')];
    const box = agendas.find(a => a.querySelector('table')) || null;
    const campos = [], indices = [], integ = [];
    let pctInteg = null;
    if (box) {
      box.querySelectorAll('tr').forEach(tr => {
        const tds = [...tr.children].filter(x => x.tagName === 'TD');
        for (let i = 0; i < tds.length - 1; i++) {
          const k = clean(tds[i].textContent), v = clean(tds[i + 1].textContent);
          if (!k || !v) continue;
          const acr = tds[i].querySelector('acronym');
          if (acr) { indices.push({ k: k.replace(/:$/, ''), v, t: acr.getAttribute('title') || '' }); i++; continue; }
          if (/:$/.test(k) && k.length < 40) { campos.push([k.slice(0, -1), v]); i++; continue; }
          if (/^CH\b/i.test(k) && /^\d+$/.test(v)) { integ.push([k, +v]); i++; }
        }
      });
      const m = clean(box.textContent).match(/(\d+)%\s*Integralizado/i);
      if (m) pctInteg = +m[1];
    }
    const get = n => (campos.find(c => c[0].toLowerCase().startsWith(n)) || [])[1] || '';
    return { nome: nomeEl ? clean(nomeEl.textContent) : '', matricula: get('matr'), campos, indices, integ, pctInteg };
  }

  function parseTurmas(doc) {
    const box = doc.querySelector('#turmas-portal');
    if (!box) return { periodo: '', lista: [] };
    let periodo = '';
    const lista = [];
    box.querySelectorAll('tr').forEach(tr => {
      const tds = [...tr.children].filter(x => x.tagName === 'TD');
      if (tds.length === 1 && /^\d{4}\.\d$/.test(clean(tds[0].textContent))) { periodo = clean(tds[0].textContent); return; }
      const d = tr.querySelector(':scope > td.descricao');
      if (!d) return;
      const a = d.querySelector('a[onclick]');
      if (!a) return;
      const nome = clean(a.textContent);
      const infos = [...tr.querySelectorAll(':scope > td.info')].map(t => clean(t.textContent));
      const horTxt = infos.find(i => /\b[2-7]+[MTN][1-9]+\b/.test(i)) || '';
      const local = infos.find(i => i && i !== horTxt) || '';
      const horarios = [...new Set(horTxt.match(HOR) || [])];
      const faixas = [...horTxt.matchAll(/([2-7]+[MTN][1-9]+)\s*\((\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})\)/g)];
      const aulasData = faixas.filter(x => x[2] === x[3]).map(x => ({ code: x[1], data: x[2] }));
      const datas = aulasData.map(x => x.data);
      const comFaixa = new Set(faixas.filter(x => x[2] !== x[3]).map(x => x[1]));
      const soData = new Set(aulasData.map(x => x.code).filter(c => !comFaixa.has(c)));
      const fixos = horarios.filter(c => !soData.has(c));
      const ymd = s => s.split('/').reverse().join('');
      let inicio = '', fim = '';
      faixas.filter(x => x[2] !== x[3]).forEach(x => {
        if (!inicio || ymd(x[2]) < ymd(inicio)) inicio = x[2];
        if (!fim || ymd(x[3]) > ymd(fim)) fim = x[3];
      });
      const chat = tr.querySelector('a[onclick*="acessarChatTurma"]');
      const idTurma = chat ? ((/'id':'(\d+)'/.exec(chat.getAttribute('onclick')) || [])[1] || '') : '';
      lista.push({ nome, local, horarios, fixos, datas, aulasData, inicio, fim, idTurma, jsf: jsfParams(a.getAttribute('onclick')), periodo });
    });
    if (!periodo) periodo = (clean(box.textContent).match(/\b\d{4}\.\d\b/) || [''])[0];
    return { periodo, lista };
  }

  function parseAtividades(doc) {
    const out = [];
    doc.querySelectorAll('#avaliacao-portal tbody tr').forEach(tr => {
      const tds = [...tr.children].filter(x => x.tagName === 'TD');
      if (tds.length < 3) return;
      const dataTxt = clean(tds[1].textContent);
      const small = tds[2].querySelector('small') || tds[2];
      const disciplina = clean((small.childNodes[0] || {}).textContent || '');
      const tipo = clean((small.querySelector('strong') || {}).textContent || '').replace(/:$/, '');
      const titulo = clean((small.querySelector('a') || {}).textContent || '') || clean(small.textContent);
      const data = (dataTxt.match(/\d{2}\/\d{2}\/\d{4}/) || [''])[0];
      const hora = (dataTxt.match(/\d{2}:\d{2}/) || [''])[0];
      out.push({ data, hora, disciplina, tipo, titulo });
    });
    return out;
  }

  function parseAtualizacoes(doc) {
    const out = [];
    doc.querySelectorAll('#atualizacoes-turma .rotator > table').forEach(t => {
      const tds = [...t.querySelectorAll('td')].map(x => clean(x.textContent));
      if (!tds.length) return;
      const m = /^(\d{2}\/\d{2}\/\d{4})\s*-\s*(.*)$/.exec(tds[0]);
      out.push({ data: m ? m[1] : '', turma: (m ? m[2] : tds[0]).replace(/\s*\(\d{4}\.\d\)$/, ''), texto: tds[1] || '' });
    });
    return out;
  }

  function decodeEnt(doc, s) { const p = doc.createElement('textarea'); p.innerHTML = s; return clean(p.value); }

  function parseMenu(doc, html) {
    const re = /\[\s*(?:null|'[^']*'|"[^"]*")\s*,\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'/g;
    const seen = new Set(), out = []; let m;
    while ((m = re.exec(html))) {
      const label = decodeEnt(doc, m[1]), act = m[2];
      if (!label || !act || act === '#' || !/#\{|\/sigaa\/|\.jsf|\.do/.test(act)) continue;
      const key = label + '|' + act; if (seen.has(key)) continue; seen.add(key);
      out.push({ label, act, hint: (act.match(/#\{\s*([\w.]+)/) || [, ''])[1] });
    }
    return out;
  }

  function parseNotas(doc) {
    let tables = [...doc.querySelectorAll('table.tabelaRelatorio')];
    const sems = [];
    for (const t of tables) {
      const headers = [...t.querySelectorAll('thead th')].map(th => clean(th.textContent));
      if (!headers.some(h => /disciplina|componente/i.test(h))) continue;
      const titulo = clean((t.querySelector('caption') || {}).textContent || '') || 'Notas';
      const linhas = [...t.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => clean(td.textContent)))
        .filter(c => c.length >= 3 && c.some(Boolean));
      if (linhas.length) sems.push({ titulo, headers, linhas });
    }
    return sems;
  }

  function parseFrequencia(doc) {
    const registros = [];
    const t = [...doc.querySelectorAll('table.listing, table')].find(t =>
      /data/i.test(clean((t.querySelector('th') || {}).textContent || '')) && /situa/i.test(clean(t.textContent).slice(0, 200)));
    if (t) t.querySelectorAll('tr').forEach(tr => {
      const tds = [...tr.querySelectorAll('td')].map(x => clean(x.textContent));
      if (tds.length < 2 || !/^\d{2}\/\d{2}\/\d{4}$/.test(tds[0])) return;
      const sit = tds[1];
      let faltas = null;
      if (/presente/i.test(sit)) faltas = 0;
      else { const m = /(\d+)\s*falta/i.exec(sit); if (m) faltas = +m[1]; }
      registros.push({ data: tds[0], sit, faltas });
    });
    const txt = clean((doc.body || doc).textContent);
    const num = re => { const m = re.exec(txt); return m ? +m[1] : null; };
    return {
      registros,
      presencas: num(/Presen[çc]as Registradas:\s*(\d+)/i),
      aulasRegistradas: num(/Aulas com Registro de Frequ[êe]ncia:\s*(\d+)/i),
      aulasCH: num(/Aulas definidas pela CH do Componente:\s*(\d+)/i),
      pctMin: num(/igual ou superior a\s*(\d+)/i) || 75,
    };
  }

  /** Link do formMenu cujo texto casa com a regex. */
  function findLinkRe(doc, formId, re) {
    const form = doc.getElementById(formId);
    if (!form) return null;
    const norm = s => clean(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const a = [...form.querySelectorAll('a[onclick]')].find(a => re.test(norm(a.textContent)));
    return a ? jsfParams(a.getAttribute('onclick')) : null;
  }

  /** Todos os links JSF de um form de menu: [{texto (normalizado), onclick, jsf}] */
  function linksMenu(doc, formId) {
    const form = doc.getElementById(formId);
    if (!form) return [];
    const norm = s => clean(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    return [...form.querySelectorAll('a[onclick]')].map(a => ({ texto: norm(a.textContent), onclick: a.getAttribute('onclick') || '', jsf: jsfParams(a.getAttribute('onclick')) })).filter(x => x.jsf && x.texto);
  }

  /** Linhas de cabeçalho (com colspan/rowspan) -> um rótulo por coluna: {grupo, h, title}. */
  function cabecalhos(rows) {
    const grid = [];
    rows.forEach((tr, r) => {
      grid[r] = grid[r] || [];
      let c = 0;
      [...tr.cells].forEach(cell => {
        while (grid[r][c]) c++;
        const cs = +cell.getAttribute('colspan') || 1, rs = +cell.getAttribute('rowspan') || 1;
        const info = { t: clean(cell.textContent), title: clean(cell.getAttribute('title') || '') };
        for (let i = 0; i < rs; i++) for (let j = 0; j < cs; j++) { grid[r + i] = grid[r + i] || []; grid[r + i][c + j] = info; }
        c += cs;
      });
    });
    const n = Math.max(0, ...grid.map(g => g.length));
    return Array.from({ length: n }, (_, c) => {
      const parts = []; let title = '';
      grid.forEach(g => { const x = g[c]; if (x && x.t && parts[parts.length - 1] !== x.t) parts.push(x.t); if (x && x.title) title = x.title; });
      return { grupo: parts.length > 1 ? parts.slice(0, -1).join(' › ') : '', h: parts[parts.length - 1] || '', title };
    });
  }

  /** Linha do aluno: a que começa com a matrícula (6+ dígitos). */
  const ehLinhaAluno = tr => [...tr.cells].some(c => /^\d{6,}\b/.test(clean(c.textContent)));
  /** Separa a tabela de notas em linhas de cabeçalho e a linha do aluno, aceitando th ou td, com ou sem thead. */
  function partesTabela(table) {
    const rows = [...table.rows];
    let di = rows.findIndex(ehLinhaAluno);
    if (di < 0) di = rows.findIndex(tr => !tr.closest('thead') && [...tr.cells].filter(c => c.tagName === 'TD').length >= 3);
    // linhas de título ("Alunos Matriculados") têm uma célula só: não são cabeçalho de coluna
    const hdr = rows.slice(0, di < 0 ? rows.length : di).filter(tr => tr.cells.length > 1 && clean(tr.textContent));
    return { hdr, linha: di >= 0 ? rows[di] : null };
  }

  /** Página "Ver Notas" da turma virtual: avaliações, pesos, notas e textos sobre o método. */
  function parseNotasTurma(doc) {
    const val = id => { const e = doc.getElementById(id); return e ? clean(e.value != null ? e.value : e.textContent) : ''; };
    const avals = [...doc.querySelectorAll('[id^="denAval_"]')].map(i => {
      const id = i.id.slice('denAval_'.length);
      return { id, nome: clean(i.value != null ? i.value : i.textContent), abrev: val('abrevAval_' + id), peso: val('pesoAval_' + id), nota: val('notaAval_' + id), unidade: val('unidAval_' + id) };
    }).filter(a => a.nome || a.abrev);

    // candidatas: tabelas com "Unid"/"Resultado"/"Nota" e uma linha de aluno; fica a mais interna
    let tabs = [...doc.querySelectorAll('table')].filter(t => /unid|resultado|nota|m[ée]dia|aval/i.test(clean(t.textContent).slice(0, 800)) && [...t.rows].some(tr => ehLinhaAluno(tr) || [...tr.cells].filter(c => c.tagName === 'TD').length >= 3));
    tabs = tabs.filter(t => !tabs.some(o => o !== t && t.contains(o)));
    const tabela = tabs.sort((x, y) => (+[...y.rows].some(ehLinhaAluno) - +[...x.rows].some(ehLinhaAluno)) || (y.querySelectorAll('th').length - x.querySelectorAll('th').length))[0];
    let colunas = [];
    if (tabela) {
      const { hdr, linha } = partesTabela(tabela);
      const cab = cabecalhos(hdr);
      // expande colspan das células para alinhar com o cabeçalho
      const tds = [];
      if (linha) [...linha.cells].forEach(td => { const cs = +td.getAttribute('colspan') || 1; for (let k = 0; k < cs; k++) tds.push(k ? null : td); });
      colunas = cab.map((c, j) => ({ ...c, v: tds[j] ? clean(tds[j].textContent) : '', vt: tds[j] ? clean(tds[j].getAttribute('title') || '') : '' }))
        .filter(c => c.h && !/matr[íi]cula|^nome$|discente|^aluno/i.test(c.h));
    }

    const infos = [], vistos = new Set();
    doc.querySelectorAll('p, li, span, div, td, legend, h3, h4').forEach(e => {
      if (tabela && tabela.contains(e)) return;
      if (e.children.length > 3) return;
      const t = clean(e.textContent);
      if (t.length < 8 || t.length > 400 || vistos.has(t)) return;
      if (/m[ée]todo de avalia|f[óo]rmula|m[ée]dia (ponderada|aritm)|peso|crit[ée]rio|forma de avalia|c[áa]lculo da m[ée]dia/i.test(t)) { vistos.add(t); infos.push(t); }
    });
    const enxuto = infos.filter(t => !infos.some(o => o !== t && o.length < t.length && t.includes(o) && o.length > 20)).slice(0, 8);
    return { avals, colunas, infos: enxuto, vazio: !avals.length && !colunas.length && !enxuto.length };
  }

  /** Página atual é login / aviso / vínculo? */
  function estadoPagina(url, doc) {
    if (/verTelaLogin|logar\.do|expirad|public\//i.test(url) || doc.querySelector('form[name=loginForm]')) return 'login';
    if (/telaAvisoLogon/i.test(url)) return 'aviso';
    if (/vinculos/i.test(url)) return 'vinculo';
    return 'ok';
  }

  return { clean, jsfParams, formFields, findLink, parsePerfil, parseTurmas, parseAtividades, parseAtualizacoes, parseMenu, parseNotas, parseFrequencia, estadoPagina, findLinkRe, linksMenu, cabecalhos, partesTabela, parseNotasTurma };
})();
if (typeof module !== 'undefined') module.exports = SM;
