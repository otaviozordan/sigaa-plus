/* SIGAA+ — telas. Funções puras: recebem o estado e devolvem HTML. */
var SMT = (() => {
  const N = SMN;
  const { esc, titulo, norm, busca, fmt, parseData, hoje, isoDia, deIso, DIA_MS, f1, f2, quando, diasAte } = N;

  /* ---------------- ícones ---------------- */
  const P = {
    inicio: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    turmas: 'M4 19V5a2 2 0 0 1 2-2h14v14H6a2 2 0 0 0-2 2zm0 0a2 2 0 0 0 2 2h14M8 7h8',
    semanas: 'M3 5h18M3 12h18M3 19h11',
    faltas: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9 9l6 6M15 9l-6 6',
    notas: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z',
    simulador: 'M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01M16 18h.01',
    desempenho: 'M4 20V11M10 20V5M16 20v-6M3 20h18',
    horario: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
    agenda: 'M4 5h16v16H4zM4 9h16M9 3v4M15 3v4M8 13h3M8 17h6',
    funcoes: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
    ajustes: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
    refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7', search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5', x: 'M6 6l12 12M18 6L6 18',
    lua: 'M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z', ext: 'M14 4h6v6M20 4l-9 9M19 14v6H4V5h6', down: 'M12 4v12M6 10l6 6 6-6M4 20h16',
    alerta: 'M12 3l10 18H2zM12 10v5M12 18h.01', sobre: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 8h.01',
    link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1', info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 8h.01', mais: 'M12 5v14M5 12h14',
  };
  const ic = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n] || P.info}"/></svg>`;

  const VIEWS = [
    ['inicio', 'Início'], ['turmas', 'Turmas'], ['agenda', 'Agenda'], ['horario', 'Horário'], ['faltas', 'Faltas'],
    ['notas', 'Notas'], ['simulador', 'Simulador'], ['desempenho', 'Desempenho'], ['semanas', 'Semanas'], ['funcoes', 'Funções do SIGAA'], ['ajustes', 'Ajustes'], ['sobre', 'Sobre'],
  ];
  const nomeView = v => (VIEWS.find(x => x[0] === v) || [, ''])[1];

  /* ---------------- auxiliares ---------------- */
  const corDe = (S, x) => (S.dados.turmas.find(t => norm(t.nome) === norm(x) || (t.codigo && t.codigo === x)) || {}).cor || 'var(--fade)';
  const nomeDeCodigo = (S, sem, cod) => { const s = S.dados.notas.find(x => x.titulo === sem); const r = s && s.linhas.find(c => c[0] === cod); return r ? titulo(r[1]) : cod; };
  const chaveT = t => t.idTurma || t.nome;
  const curto = h => h.replace(/Unidade\.?\s*/i, 'U').replace(/Unid\.?\s*/i, 'U');

  function sitClass(s) {
    if (/reprov|tranc|cancel|desist|indef/i.test(s)) return 's-bad';
    if (/aprov|dispens|cumpr|aproveit/i.test(s)) return 's-ok';
    if (/matric|curs|andamento/i.test(s)) return 's-inf';
    if (/exame|recup|pend/i.test(s)) return 's-warn';
    return '';
  }

  function chipFaltas(r) {
    if (!r || r.faltas == null) return '';
    if (r.limite == null) return `<span class="chip gray">${pl(r.faltas, 'falta')}</span>`;
    return `<span class="chip ${r.nivel}">${r.faltas}/${r.limite} faltas</span>`;
  }

  function novidades(S, dias) {
    const lim = isoDia(new Date(hoje() - dias * DIA_MS)), h = S.modelo.hist, out = [];
    for (const [k, x] of Object.entries(h.notas || {})) {
      if (!x.visto || x.visto < lim) continue;
      const [sem, cod, campo] = k.split('|');
      out.push({ visto: x.visto, tipo: 'nota', html: `<b>${esc(nomeDeCodigo(S, sem, cod))}</b> — ${esc(curto(campo))}: <b>${esc(x.v)}</b>${x.antes ? ` <span class="muted">(antes ${esc(x.antes)})</span>` : ''}`, cor: corDe(S, cod) });
    }
    for (const [k, x] of Object.entries(h.faltas || {})) {
      if (!x.visto || x.visto < lim || !x.f) continue;
      const [id, data] = k.split('|');
      const t = S.dados.turmas.find(y => chaveT(y) === id);
      out.push({ visto: x.visto, tipo: 'falta', html: `<b>${esc(t ? titulo(t.nome) : id)}</b> — ${pl(x.f, 'falta')} na aula de ${esc(data.slice(0, 5))}`, cor: t ? t.cor : 'var(--fade)' });
    }
    return out.sort((a, b) => b.visto.localeCompare(a.visto));
  }

  function alertas(S) {
    const out = [];
    for (const t of S.dados.turmas) {
      const r = t.resumo || {};
      if (r.nivel === 'bad') out.push(['bad', `<b>${esc(titulo(t.nome))}</b>: passou ${pl(-r.restam, 'falta')} do limite de ${r.limite}.`]);
      else if (r.nivel === 'warn') out.push(['warn', `<b>${esc(titulo(t.nome))}</b>: só pode faltar mais <b>${r.restam}</b> ${r.restam === 1 ? 'aula' : 'aulas'}${r.diasRestam != null ? ` (≈ ${pl(r.diasRestam, 'dia')} de aula)` : ''}.`]);
      const sim = N.simular((t.unidades || []).map(u => u.v), S.cfg.mediaAprov);
      if (sim.estado === 'impossivel' && t.unidades.some(u => u.v != null)) out.push(['bad', `<b>${esc(titulo(t.nome))}</b>: nem com 10 nas unidades restantes chega a ${f1(S.cfg.mediaAprov)} — confira a recuperação.`]);
      else if (sim.estado === 'possivel' && sim.precisa >= 8) out.push(['warn', `<b>${esc(titulo(t.nome))}</b>: precisa de <b>${f1(sim.precisa)}</b> nas próximas unidades.`]);
    }
    return out;
  }

  /** Itens do SIGAA: prova (avaliação, exame, P1…) ou atividade (tarefa, questionário, trabalho…). */
  const tipoSigaa = a => /prova|avalia|exame|teste|\bp\s?\d\b|recupera|simulado/i.test(`${a.tipo || ''} ${a.titulo || ''}`) ? 'prova' : 'atividade';
  const ehSigaa = x => x.tipo === 'prova' || x.tipo === 'atividade';
  const ROT = { prova: 'Prova', atividade: 'Atividade', lab: 'Aula prática', aula: 'Aula prática', tarefa: 'Minha tarefa' };
  const ICO = { prova: '📝', atividade: '📌', lab: '🧪', aula: '🧪', tarefa: '✓' };
  const CHIP = { prova: 'bad', atividade: '', lab: 'warn', aula: 'warn', tarefa: 'gray' };
  const chipTipo = x => `<span class="chip ${CHIP[x.tipo] || ''}">${ICO[x.tipo] || ''} ${ROT[x.tipo] || esc(x.cat || '')}</span>`;

  /** Itens de agenda: atividades do SIGAA + tarefas pessoais. */
  function itensAgenda(S) {
    const it = S.dados.atividades.map(a => ({ tipo: tipoSigaa(a), d: parseData(a.data), hora: a.hora, titulo: a.titulo, cat: ROT[tipoSigaa(a)], sub: a.tipo, turma: a.disciplina, cor: corDe(S, a.disciplina) }))
      .concat(N.aulasEmDatas(S.dados.turmas, S.cfg).filter(a => a.d >= hoje()).map(a => ({ tipo: 'aula', d: a.d, hora: a.ini, fim: a.fim, local: a.t.local, titulo: `Aula prática — ${titulo(a.t.nome)}`, cat: 'Aula prática', turma: a.t.nome, cor: a.t.cor })))
      .concat((S.pessoal.tarefas || []).map(t => ({ tipo: 'tarefa', id: t.id, d: deIso(t.data), titulo: t.txt, cat: 'Tarefa', turma: t.turma, feito: t.feito, cor: t.turma ? corDe(S, t.turma) : 'var(--fade)' })));
    return it.sort((a, b) => (a.d ? +a.d : 9e15) - (b.d ? +b.d : 9e15) || String(a.hora || '').localeCompare(String(b.hora || '')));
  }

  /** "1 falta" / "3 faltas" */
  const pl = (n, p) => `${n} ${Math.abs(+n) === 1 ? p : p + 's'}`;
  const vazio = msg => `<p class="empty">${msg}</p>`;
  /** Botão que abre o Google Agenda com o evento preenchido. */
  const gbtn = (e, rotulo) => `<a class="btn sm gcal" href="${esc(N.linkGoogle(e))}" target="_blank" rel="noopener" title="Adicionar ao Google Agenda: ${esc(e.titulo)}">${ic('mais')} ${esc(rotulo || 'Google Agenda')}</a>`;
  const umaHoraDepois = h => { const m = N.minutos(h); return m == null ? '' : `${String(Math.min(23, Math.floor(m / 60) + 1)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };

  /* ---------------- INÍCIO ---------------- */
  const BLOCOS_INICIO = [['saudacao', 'Saudação e data'], ['alertas', 'Alertas de faltas e notas'], ['hoje', 'Aulas de hoje'], ['prox', 'Próximas provas e atividades'],
    ['nov', 'Novidades da semana'], ['turmas', 'Resumo das turmas'], ['atual', 'Atualizações das turmas'], ['favs', 'Atalhos favoritos'], ['indices', 'Seus índices (IRA, MC…)']];
  /** Botão "Personalizar" e, quando aberto, os interruptores de cada bloco do Início. */
  function barraPersonalizar(S, ocultos) {
    const n = BLOCOS_INICIO.filter(([k]) => !ocultos.has(k)).length;
    if (!S.personalizando) return `<div class="ini-top"><button class="btn sm" data-a="ini-personalizar" title="Escolher o que aparece no Início">${ic('ajustes')} Personalizar</button></div>`;
    return `<div class="card personalizar"><h3>${ic('ajustes')} Personalizar o Início <span class="r small muted">${n} de ${BLOCOS_INICIO.length} visíveis</span></h3>
      <p class="small muted" style="margin:0 0 10px">Escolha o que aparece. Para mudar a ordem, arraste os cartões pela alça <b>⠿</b>.</p>
      <div class="blocos">${BLOCOS_INICIO.map(([k, l]) => `<label class="bloco"><input type="checkbox" data-in="ini-bloco" data-k="${k}" ${ocultos.has(k) ? '' : 'checked'}> ${esc(l)}</label>`).join('')}</div>
      <div class="acts" style="margin-top:12px"><button class="btn sm pri" data-a="ini-personalizar">Pronto</button><button class="btn sm" data-a="ini-tudo">Mostrar tudo</button><button class="btn sm" data-a="ordem-reset">Ordem original</button></div></div>`;
  }
  function vInicio(S) {
    const { dados, modelo } = S, p = dados.perfil;
    const nome = p.nome ? titulo(p.nome).split(' ')[0] : '';
    const hj = hoje(), sem = modelo.semanaDe(hj);
    const ocultos = new Set(S.pessoal.inicioOcultos || []), vis = k => !ocultos.has(k);
    let h = `<div class="hero"><h2>${nome ? 'Olá, ' + esc(nome) + ' 👋' : 'Olá! 👋'}</h2><p>${esc(N.dataLonga(hj))} · ${esc(dados.periodo || '')}${sem > 0 && sem < 30 ? ` · semana ${sem} do semestre` : ''}</p>
      <div class="pills">${p.matricula ? `<span class="pill">Matrícula ${esc(p.matricula)}</span>` : ''}${(p.campos.find(c => /curso/i.test(c[0])) || [])[1] ? `<span class="pill">${esc(titulo(p.campos.find(c => /curso/i.test(c[0]))[1]))}</span>` : ''}</div></div>`;

    h = barraPersonalizar(S, ocultos) + (vis('saudacao') ? h : '');
    if (dados.erros.length) h += `<div class="alert warn">${ic('alerta')}<div><b>Algumas partes não carregaram</b><br><span class="small">${dados.erros.map(esc).join('<br>')}</span></div></div>`;
    if (dados.parcial) h += `<div class="alert inf">${ic('info')}<div>Carregando notas e frequência das turmas… a tela se completa sozinha.</div></div>`;
    const al = alertas(S);
    if (al.length && vis('alertas')) {
      const pior = al.some(a => a[0] === 'bad') ? 'bad' : 'warn';
      h += `<div class="alert ${pior}">${ic('alerta')}<div style="flex:1"><b>${al.length === 1 ? 'Atenção' : `${al.length} pontos de atenção`}</b>${al.map(([, txt]) => `<div style="margin-top:3px">${txt}</div>`).join('')}</div></div>`;
    }

    const stats = p.indices.filter(i => /^(IRA|MC|IEA|IECH|IEPL|CR)$/i.test(i.k)).map(i => `<div class="stat" title="${esc(i.t)}"><div class="v">${esc(isNaN(+i.v.replace(',', '.')) ? i.v : (+i.v.replace(',', '.')).toFixed(2))}</div><div class="k">${esc(i.t || i.k)}</div></div>`);
    if (p.pctInteg != null) stats.push(`<div class="stat"><div class="v">${p.pctInteg}%</div><div class="k">do curso integralizado</div><div class="bar"><i style="width:${p.pctInteg}%;background:var(--ac)"></i></div></div>`);
    const totF = dados.turmas.reduce((a, t) => a + (t.resumo?.faltas || 0), 0);
    stats.push(`<div class="stat"><div class="v">${totF}</div><div class="k">faltas em ${esc(dados.periodo)}</div></div>`);
    const medias = dados.turmas.map(t => t.mediaParcial).filter(x => x != null);
    if (medias.length) stats.push(`<div class="stat"><div class="v">${f1(medias.reduce((a, b) => a + b, 0) / medias.length)}</div><div class="k">média parcial do semestre</div></div>`);
    h += `<div class="cols"><div data-ordem="inicio:a">`;

    // hoje
    const aulas = N.aulasDoDia(dados.turmas, hj, S.cfg), agoraMin = new Date().getHours() * 60 + new Date().getMinutes();
    let amanha = null;
    if (!aulas.length || aulas.every(a => N.minutos(a.fim) < agoraMin)) { for (let i = 1; i < 7 && !amanha; i++) { const d = new Date(+hj + i * DIA_MS); const x = N.aulasDoDia(dados.turmas, d, S.cfg); if (x.length) amanha = { d, x }; } }
    if (vis('hoje')) h += `<div class="card" data-id="hoje"><h3>${ic('horario')} Aulas de hoje <a class="r small" href="#" data-v="horario">grade completa →</a></h3>${aulas.length ? aulas.map(a => {
      const st = N.minutos(a.fim) < agoraMin ? 'passou' : N.minutos(a.ini) <= agoraMin ? 'agora' : '';
      return `<div class="tl ${st}"><div class="hr"><b>${esc(a.ini)}</b>${esc(a.fim)}</div><div class="bx" style="border-color:${a.t.cor}"><b>${esc(titulo(a.t.nome))}</b>${a.lab ? ' <span class="chip warn">🧪 aula prática</span>' : ''}${st === 'agora' ? ' <span class="chip">agora</span>' : ''}<div class="small muted">${esc(a.t.local)} · ${pl(a.qtd, 'aula')}</div></div></div>`;
    }).join('') : vazio('Sem aulas hoje. 🎉')}
      ${amanha ? `<div class="small muted" style="margin-top:10px">Próximo dia de aula: <b>${esc(N.dataLonga(amanha.d))}</b> — ${amanha.x.map(a => `${esc(a.ini)} ${esc(titulo(a.t.nome))}`).join(' · ')}</div>` : ''}</div>`;

    // próximas atividades
    const prox = itensAgenda(S).filter(i => i.d && diasAte(i.d) >= 0 && !i.feito).slice(0, 6);
    if (vis('prox')) h += `<div class="card" data-id="prox"><h3>${ic('agenda')} Próximas entregas e provas <a class="r small" href="#" data-v="agenda">agenda →</a></h3>${prox.length ? prox.map(a => {
      const n = diasAte(a.d);
      return `<div class="row"><span class="dot" style="background:${a.cor}"></span><div class="grow"><b>${esc(a.titulo)}</b><div class="small muted">${esc(a.cat)}${a.turma ? ' · ' + esc(titulo(a.turma)) : ''}</div></div><div style="text-align:right"><span class="chip ${n <= 1 ? 'bad' : n <= 3 ? 'warn' : 'gray'}">${quando(a.d)}</span><div class="small fade">${fmt(a.d)} ${esc(a.hora || '')}</div></div></div>`;
    }).join('') : vazio('Nada marcado. Adicione suas próprias tarefas na Agenda.')}</div>`;

    // novidades
    const nov = novidades(S, 7);
    const primeiraVez = modelo.hist.inicio === isoDia(hj) && !nov.length;
    if (vis('nov')) h += `<div class="card" data-id="nov"><h3>${ic('notas')} Novidades dos últimos 7 dias</h3>${nov.length ? nov.slice(0, 12).map(n => `<div class="row"><span class="dot" style="background:${n.cor}"></span><div class="grow"><span class="chip ${n.tipo === 'falta' ? 'bad' : 'ok'}">${n.tipo}</span> <span class="small fade">${fmt(deIso(n.visto))}</span><br>${n.html}</div></div>`).join('')
      : vazio(primeiraVez ? 'Primeira vez aqui: a partir de agora o SIGAA+ anota quando cada nota e falta aparece e mostra aqui o que for novo.' : 'Nenhuma nota ou falta nova desde ' + fmt(new Date(hj - 7 * DIA_MS)) + '.')}</div>`;
    if (S.convite) h += conviteLinkedin(S);
    h += `</div><div data-ordem="inicio:b">`;

    if (vis('turmas')) h += `<div class="card" data-id="turmas"><h3>${ic('turmas')} Turmas ${esc(dados.periodo)} <a class="r small" href="#" data-v="turmas">detalhes →</a></h3>${dados.turmas.map(t => {
      const notas = (t.unidades || []).filter(u => u.v != null).map(u => `<span class="chip">${esc(curto(u.h))}: ${f1(u.v)}</span>`).join('');
      return `<div class="row"><span class="dot" style="background:${t.cor}"></span><div class="grow"><div class="b">${esc(titulo(t.nome))} <span class="fade small" style="font-weight:400">${esc(t.codigo)}</span></div><div class="muted small">${esc(t.local)} · ${esc((t.fixos || t.horarios).join(' '))}</div>${chipFaltas(t.resumo)}${notas}</div></div>`;
    }).join('') || vazio('Nenhuma turma encontrada.')}</div>`;
    if (vis('atual') && dados.atualizacoes.length) h += `<div class="card" data-id="atual"><h3>${ic('info')} Atualizações nas turmas</h3>${dados.atualizacoes.slice(0, 8).map(a => `<div class="row"><span class="dot" style="background:${corDe(S, a.turma)}"></span><div class="small grow"><b>${esc(a.data.slice(0, 5))}</b> · ${esc(titulo(a.turma))}<br>${esc(a.texto)}</div></div>`).join('')}</div>`;
    const favs = (S.pessoal.favs || []).map(act => dados.menu.find(m => m.act === act)).filter(Boolean);
    if (vis('favs') && favs.length) h += `<div class="card" data-id="favs"><h3>★ Atalhos favoritos</h3><div class="acts">${favs.map(m => `<button class="btn sm" data-a="menu" data-act="${esc(m.act)}">${esc(m.label)} ${ic('ext')}</button>`).join('')}</div></div>`;
    return h + `</div></div>` + (vis('indices') ? `<h3 style="margin:8px 0 10px;font-size:16px">Seus índices</h3><div class="grid">${stats.join('')}</div>` : '');
  }

  /* ---------------- TURMAS ---------------- */
  /** Média atual e situação da turma (usa as avaliações da turma virtual quando houver). */
  function statusNota(S, t) {
    const meta = S.cfg.mediaAprov, plano = N.planoAvaliacao(t);
    if (t.resultado != null) return { media: t.resultado, txt: t.resultado >= meta ? 'aprovado' : 'abaixo da média', cls: t.resultado >= meta ? 'ok' : 'bad' };
    const r = plano ? N.simularPlano(plano.map(x => ({ ...x, v: x.nota })), meta) : N.simular((t.unidades || []).map(u => u.v), meta);
    const media = r.media != null ? r.media : t.mediaParcial;
    const txt = { possivel: `precisa ${f1(r.precisa)}`, garantido: 'média garantida', aprovado: 'acima da média', abaixo: 'abaixo da média', impossivel: 'só com recuperação' }[r.estado] || (media == null ? 'sem notas ainda' : '');
    const cls = { possivel: r.precisa >= 8 ? 'warn' : '', garantido: 'ok', aprovado: 'ok', abaixo: 'bad', impossivel: 'bad' }[r.estado] || '';
    return { media, txt, cls };
  }
  /** Horários em texto corrido: "Seg, Qua 07:00–08:40 · Sex 13:30–15:20". */
  function horarioCurto(S, t) {
    const sem = N.eventosSemanais(t, S.modelo, S.cfg).map(e => e.rotulo);
    const faltamP = N.aulasEmDatas([t], S.cfg).filter(a => a.d >= hoje()).length;
    if (t.datas.length) sem.push(faltamP ? `${faltamP === 1 ? 'falta 1 aula prática' : `faltam ${faltamP} aulas práticas`}` : 'aulas práticas concluídas');
    return sem.join(' · ') || (t.horarios || []).join(' ');
  }
  function vTurmas(S) {
    const { dados } = S;
    return `<h2>Turmas ${esc(dados.periodo)}</h2><p class="sub">O resumo de cada disciplina. Toque em "Mais detalhes" para ver avaliações, anotações e agenda.</p>
    <div class="cols3" data-ordem="turmas">${dados.turmas.map((t, i) => {
      const r = t.resumo || {}, n = statusNota(S, t), anot = (S.pessoal.anot || {})[chaveT(t)] || '';
      const fTxt = r.restam == null ? '' : r.restam >= 0 ? `pode faltar +${r.restam}` : `passou ${-r.restam} do limite`;
      const sem = N.eventosSemanais(t, S.modelo, S.cfg), labs = N.labsParaGoogle(t, S.cfg);
      return `<div class="card tc" id="t${i}" data-id="${esc(chaveT(t))}" style="border-top:4px solid ${t.cor}">
        <h3 style="margin-bottom:2px">${esc(titulo(t.nome))}</h3>
        <div class="small muted">${[t.codigo, t.local].filter(Boolean).map(esc).join(' · ')}</div>
        ${horarioCurto(S, t) ? `<div class="small" style="margin-top:6px">${ic('horario')} ${esc(horarioCurto(S, t))}</div>` : ''}
        <div class="kpis">
          <div class="kpi"><span class="k">Média</span><b class="v">${n.media != null ? f1(n.media) : '—'}</b><span class="s ${n.cls}">${esc(n.txt)}</span></div>
          <div class="kpi"><span class="k">Faltas</span><b class="v">${r.faltas != null ? r.faltas : '—'}${r.limite != null ? `<small>/${r.limite}</small>` : ''}</b><span class="s ${r.nivel === 'na' ? '' : r.nivel}">${esc(fTxt)}</span></div>
        </div>
        <div class="acts"><button class="btn sm pri" data-a="turma" data-i="${i}">${ic('ext')} Abrir turma virtual</button></div>
        <details class="mais"><summary class="small b">Mais detalhes${anot ? ' · 📝 tem anotação' : ''} <span class="arr">▶</span></summary>
          <div class="sec-t">Avaliações</div>${blocoAvaliacoes(S, t, { semDetails: true })}
          ${sem.length || labs.length ? `<div class="sec-t">Google Agenda</div><div class="acts">${sem.map(e => gbtn(e, 'Toda ' + e.rotulo)).join('')}${labs.map(e => gbtn(e, e.qtd > 1 ? `As ${e.qtd} aulas práticas que faltam` : `Aula prática ${fmt(e.dia)} ${e.ini}`)).join('')}${labs.length > 1 ? `<button class="btn sm" data-a="gcal-todos" data-i="${i}">${ic('down')} Salvar todas (importar)</button>` : ''}</div>` : ''}
          <div class="sec-t">Minhas anotações</div><textarea data-in="anot" data-k="${esc(chaveT(t))}" aria-label="Anotações de ${esc(titulo(t.nome))}" placeholder="Ex.: P2 cai cap. 4–6; lista vale ponto extra">${esc(anot)}</textarea>
          <div class="acts" style="margin-top:10px"><button class="btn sm" data-a="simular-turma" data-i="${i}">${ic('simulador')} Simular notas</button><button class="btn sm" data-a="tarefa-turma" data-i="${i}">${ic('mais')} Nova tarefa</button></div>
        </details>
      </div>`;
    }).join('')}</div>`;
  }

  /** Avaliações, pesos e método lidos da página "Ver Notas" da turma virtual. */
  function blocoAvaliacoes(S, t, op = {}) {
    const a = t.aval;
    if (!a || a.vazio) {
      const msg = t.avalErro || (S.dados.parcial ? 'carregando…' : 'atualize os dados para buscar');
      return `<div class="small fade" style="margin-top:10px"><b class="muted">Avaliações da turma:</b> ${esc(msg)}</div>`;
    }
    const plano = N.planoAvaliacao(t);
    let h = op.semDetails ? `<div class="aval">` : `<details class="aval" open><summary class="small b" style="margin-top:12px">Avaliações da turma <span class="arr">▶</span></summary>`;
    if (a.infos.length) h += `<div class="small" style="margin:6px 0">${a.infos.map(x => `<div class="res inf" style="padding:6px 10px;margin-bottom:4px">${esc(x)}</div>`).join('')}</div>`;
    if (plano) {
      const grupos = [...new Set(plano.map(x => x.unid || ''))];
      const r = N.simularPlano(plano.map(x => ({ ...x, v: x.nota })), S.cfg.mediaAprov);
      h += grupos.map(g => {
        const xs = plano.filter(x => (x.unid || '') === g), sp = xs.reduce((s, x) => s + x.peso, 0);
        return `${g ? `<div class="small muted b" style="margin-top:8px">${esc(g)}</div>` : ''}<table class="mini"><tbody>${xs.map(x => `<tr><td><b>${esc(x.abrev)}</b>${x.nome && x.nome !== x.abrev ? ` <span class="muted">${esc(x.nome)}</span>` : ''}</td>
          <td class="n fade" title="peso">${xs.length > 1 || x.peso !== 1 ? `peso ${esc(String(x.peso).replace('.', ','))}${sp ? ` <span class="small">(${Math.round(100 * x.peso / sp)}%)</span>` : ''}` : ''}</td>
          <td class="n b" ${x.nota != null && x.nota < S.cfg.mediaAprov ? 'style="color:var(--bad)"' : ''}>${x.nota != null ? f1(x.nota) : '<span class="fade">—</span>'}</td></tr>`).join('')}
          ${xs[0].fixaUnid != null && !xs[0].notaUnid ? `<tr><td colspan="2" class="muted">Nota da unidade</td><td class="n b">${f1(xs[0].fixaUnid)}</td></tr>` : ''}</tbody></table>`;
      }).join('');
      if (r.media != null) h += `<div class="small" style="margin-top:6px">Média com as notas já lançadas: <b>${f1(r.media)}</b>${r.estado === 'possivel' ? ` · precisa de <b>${f1(r.precisa)}</b> nas restantes` : ''}</div>`;
    } else if (a.colunas.length) {
      h += `<div class="tw"><table class="mini"><thead><tr>${a.colunas.map(c => `<th title="${esc(c.title)}">${c.grupo ? `<span class="fade">${esc(c.grupo)}</span><br>` : ''}${esc(c.h)}</th>`).join('')}</tr></thead>
        <tbody><tr>${a.colunas.map(c => `<td class="n" title="${esc(c.vt)}">${esc(c.v) || '<span class="fade">—</span>'}</td>`).join('')}</tr></tbody></table></div>`;
    }
    return h + (op.semDetails ? `</div>` : `</details>`);
  }

  /* ---------------- FALTAS ---------------- */
  function vFaltas(S) {
    const { dados, modelo } = S;
    const ts = [...dados.turmas].sort((a, b) => ((a.resumo?.restam ?? 99) - (b.resumo?.restam ?? 99)));
    const total = ts.reduce((a, t) => a + (t.resumo?.faltas || 0), 0);
    const risco = ts.filter(t => ['bad', 'warn'].includes(t.resumo?.nivel)).length;
    const linha = t => {
      const r = t.resumo || {}, f = t.freq;
      const pct = r.limite ? Math.min(100, Math.round(100 * r.faltas / r.limite)) : 0;
      const cor = { bad: 'var(--bad)', warn: 'var(--warn)', ok: 'var(--ok)' }[r.nivel] || 'var(--ac)';
      const status = r.restam == null ? (r.faltas != null ? pl(r.faltas, 'falta') : '—') : r.restam < 0 ? `passou ${-r.restam}` : `pode faltar +${r.restam}`;
      const dias = f && f.registros.length ? `<div class="dias">${f.registros.map(x => {
        const vis = modelo.hist.faltas[`${chaveT(t)}|${x.data}`];
        const tip = `${x.data}: ${x.sit}${vis && vis.visto ? ' (lançada em ' + fmt(deIso(vis.visto)) + ')' : ''}`;
        return x.faltas == null ? `<span class="dia nr" title="${esc(tip)}"></span>` : x.faltas ? `<span class="dia f" title="${esc(tip)}">${x.faltas}</span>` : `<span class="dia" title="${esc(tip)}"></span>`;
      }).join('')}</div>` : '';
      const datasF = f ? f.registros.filter(x => x.faltas).map(x => `${x.data.slice(0, 5)}${x.faltas > 1 ? ` (${x.faltas})` : ''}`).join(', ') : '';
      const det = [
        r.restam != null && r.restam >= 0 && r.diasRestam != null ? `Pode faltar mais <b>${pl(r.restam, 'aula')}</b> — cerca de <b>${pl(r.diasRestam, 'dia')} de aula</b>.` : '',
        f && f.aulasRegistradas ? `Presença: <b>${Math.round(100 * f.presencas / f.aulasRegistradas)}%</b> (${f.presencas} de ${f.aulasRegistradas} aulas registradas${f.aulasCH ? `; ${f.aulasCH} no semestre` : ''}).` : '',
        datasF ? `Faltou em: ${esc(datasF)}.` : (f && f.registros.length ? 'Nenhuma falta até agora. 👏' : ''),
      ].filter(Boolean).map(x => `<div>${x}</div>`).join('');
      return `<details class="frow"><summary>
          <span class="dot" style="background:${t.cor};margin:0"></span>
          <span class="fn">${esc(titulo(t.nome))}</span>
          <span class="fb">${r.limite ? `<span class="bar" style="margin:0"><i style="width:${pct}%;background:${cor}"></i></span>` : ''}</span>
          <span class="fq">${r.faltas != null ? `${r.faltas}${r.limite != null ? `<span class="fade">/${r.limite}</span>` : ''}` : ''}</span>
          <span class="chip ${r.nivel === 'na' ? 'gray' : r.nivel}">${esc(status)}</span>
        </summary>
        <div class="fdet small">${det || `<div class="muted">${esc(t.freqErro || (dados.parcial ? 'Carregando…' : 'Sem registros de frequência ainda.'))}</div>`}${dias}</div></details>`;
    };
    return `<h2>Faltas ${esc(dados.periodo)}</h2><p class="sub">O limite é 25% das aulas de cada disciplina. Toque numa turma para ver aula por aula.</p>
      <div class="grid"><div class="stat"><div class="v">${total}</div><div class="k">${total === 1 ? 'falta' : 'faltas'} no semestre</div></div>
        <div class="stat"><div class="v" ${risco ? 'style="color:var(--warn)"' : ''}>${risco}</div><div class="k">${risco === 1 ? 'turma perto do limite' : 'turmas perto do limite'}</div></div></div>
      <div class="card flist">${ts.map(linha).join('') || vazio('Nenhuma turma.')}</div>
      <p class="small fade"><span class="dia" style="display:inline-block;vertical-align:middle"></span> presente · <span class="dia f" style="display:inline-block;vertical-align:middle">2</span> faltas na aula · <span class="dia nr" style="display:inline-block;vertical-align:middle"></span> ainda sem registro</p>`;
  }

  /* ---------------- SEMANAS ---------------- */
  function vSemanas(S) {
    const { dados } = S, { ini, semanaDe, hist } = S.modelo;
    const sem = new Map();
    const pega = n => { if (!sem.has(n)) sem.set(n, { faltas: [], notas: [], ativ: [], nr: 0, aulas: 0 }); return sem.get(n); };
    for (const t of dados.turmas) for (const r of (t.freq?.registros || [])) {
      const d = parseData(r.data), w = pega(semanaDe(d));
      w.aulas++;
      if (r.faltas == null) w.nr++;
      else if (r.faltas > 0 && passaFiltro(S, { tipo: 'falta', turma: t.nome }, 'semanas')) { const v = hist.faltas[`${chaveT(t)}|${r.data}`]; w.faltas.push({ t, r, visto: v && v.visto }); }
    }
    for (const [k, h] of Object.entries(hist.notas || {})) {
      if (!h.visto) continue;
      const [s, cod, campo] = k.split('|');
      if (s !== dados.periodo) continue;
      const tn = (dados.turmas.find(t => t.codigo === cod) || {}).nome || nomeDeCodigo(S, s, cod);
      if (!passaFiltro(S, { tipo: 'nota', turma: tn }, 'semanas')) continue;
      pega(semanaDe(deIso(h.visto))).notas.push({ cod, campo, ...h });
    }
    for (const a of itensAgenda(S)) if (a.d && passaFiltro(S, a, 'semanas')) pega(semanaDe(a.d)).ativ.push(a);
    const agora = semanaDe(hoje());
    for (let n = 1; n <= agora; n++) pega(n);
    const nums = [...sem.keys()].filter(n => n > 0).sort((a, b) => b - a);
    const semData = n => { const a = new Date(+ini + (n - 1) * 7 * DIA_MS); return `${fmt(a)} – ${fmt(new Date(+a + 6 * DIA_MS))}`; };
    const baseline = Object.values(hist.notas || {}).some(h => !h.visto);
    let h = `<h2>Semana a semana</h2><p class="sub">Faltas aparecem na semana da aula; notas, na semana em que foram lançadas${baseline ? ` (o SIGAA não informa essa data — o SIGAA+ anota quando vê cada nota pela primeira vez, desde ${fmt(deIso(hist.inicio))})` : ''}.</p>${barraFiltros(S, 'semanas')}<div class="card">`;
    h += nums.map(n => {
      const w = sem.get(n);
      const totF = w.faltas.reduce((a, x) => a + x.r.faltas, 0);
      const itens = [];
      w.notas.forEach(x => itens.push(`<div class="it"><span class="chip ok">nota</span> <b style="color:${corDe(S, x.cod)}">●</b> ${esc(nomeDeCodigo(S, dados.periodo, x.cod))} — ${esc(curto(x.campo))}: <b>${esc(x.v)}</b>${x.antes ? ` <span class="muted">(antes ${esc(x.antes)})</span>` : ''} <span class="fade small">lançada ${fmt(deIso(x.visto))}</span></div>`));
      w.faltas.sort((a, b) => parseData(a.r.data) - parseData(b.r.data)).forEach(x => itens.push(`<div class="it"><span class="chip bad">${x.r.faltas} falta${x.r.faltas > 1 ? 's' : ''}</span> <b style="color:${x.t.cor}">●</b> ${esc(titulo(x.t.nome))} <span class="fade small">aula de ${esc(x.r.data.slice(0, 5))}${x.visto ? ` · lançada ${fmt(deIso(x.visto))}` : ''}</span></div>`));
      w.ativ.forEach(a => itens.push(`<div class="it">${chipTipo(a)} ${a.feito ? '<s>' : ''}${esc(a.titulo)}${a.feito ? '</s>' : ''} <span class="fade small">${a.turma ? esc(titulo(a.turma)) + ' · ' : ''}${fmt(a.d)} ${esc(a.hora || '')}</span></div>`));
      const resumo = [totF ? `<span class="chip bad">${pl(totF, 'falta')}</span>` : (w.aulas - w.nr > 0 ? '<span class="chip ok">sem faltas</span>' : ''), w.nr ? `<span class="chip gray">${pl(w.nr, 'aula')} sem registro</span>` : ''].join('');
      return `<div class="wk ${n === agora ? 'cur' : ''}"><h3>Semana ${n} <span class="fade small" style="font-weight:400">${semData(n)}${n === agora ? ' · esta semana' : n > agora ? ' · futura' : ''}</span> ${resumo}</h3>${itens.join('') || (resumo ? '' : '<div class="fade small">Nada nesta semana.</div>')}</div>`;
    }).join('');
    return h + '</div>';
  }

  /* ---------------- NOTAS ---------------- */
  function vNotas(S) {
    const { dados } = S;
    const ts = dados.turmas;
    const anteriores = dados.notas.filter(x => x.titulo !== dados.periodo || !ts.length).length;
    return `<h2>Notas ${esc(dados.periodo)}</h2><p class="sub">Notas de cada turma, avaliação por avaliação, como aparecem na turma virtual. Notas abaixo de ${f1(S.cfg.mediaAprov)} ficam em vermelho.</p>
      <div class="stack" data-ordem="notas">${ts.map(t => cartaoNotaTurma(S, t)).join('') || vazio('Nenhuma turma neste semestre.')}</div>
      ${anteriores ? `<h3 style="margin:22px 0 10px;font-size:15px">Semestres anteriores</h3>
      <div class="acts" style="margin-bottom:12px"><input type="search" data-in="q-notas" placeholder="Filtrar disciplina, código ou situação…" value="${esc(S.filtroNotas || '')}" style="flex:1;min-width:220px"><button class="btn" data-a="csv">${ic('down')} Exportar histórico (CSV)</button></div>
      <div id="lista-notas">${listaNotas(S)}</div>` : ''}`;
  }
  /** Cartão de uma turma na tela Notas: avaliações individuais da turma virtual (ou, na falta delas, as unidades do relatório). */
  /** Tabela no formato da turma virtual: Unid. 1 (P1T, P1E, Nota) | Unid. 2 (…) | Reposição | Resultado… */
  function tabelaSigaa(S, t) {
    const a = t.aval, meta = S.cfg.mediaAprov;
    const cols = (a.colunas || []).filter(c => !/^(faltas?|sit\.?|situa[çc][ãa]o)$/i.test(c.h));
    if (!cols.length) return '';
    const nomeAval = c => { const av = (a.avals || []).find(x => x.abrev === c.h); return (av && av.nome && av.nome !== c.h ? av.nome : '') || c.title || ''; };
    const grupos = []; cols.forEach(c => { const g = grupos[grupos.length - 1]; if (g && c.grupo && g.grupo === c.grupo) g.cols.push(c); else grupos.push({ grupo: c.grupo, cols: [c] }); });
    const ehNota = c => /^(nota|m[ée]dia|resultado)$/i.test(c.h);
    const cel = c => {
      const v = N.num(c.v), baixa = v != null && v < meta;
      return `<td class="n ${ehNota(c) ? 'nu' : ''} ${baixa ? 'baixa' : ''}" title="${esc([nomeAval(c), baixa ? 'abaixo da média' : ''].filter(Boolean).join(' · '))}">${c.v ? esc(c.v) + (baixa ? '<span class="sr"> (abaixo da média)</span>' : '') : '<span class="fade">—</span>'}</td>`;
    };
    return `<div class="tw"><table class="tsig">
      <thead><tr>${grupos.map(g => g.grupo ? `<th colspan="${g.cols.length}" class="g">${esc(g.grupo)}</th>` : `<th rowspan="2" class="g">${esc(g.cols[0].h)}</th>`).join('')}</tr>
        <tr>${grupos.filter(g => g.grupo).flatMap(g => g.cols).map(c => `<th class="${ehNota(c) ? 'nu' : ''}" title="${esc(nomeAval(c))}">${esc(c.h)}</th>`).join('')}</tr></thead>
      <tbody><tr>${grupos.flatMap(g => g.cols).map(cel).join('')}</tr></tbody></table></div>`;
  }
  function cartaoNotaTurma(S, t) {
    const temAval = t.aval && !t.aval.vazio && (t.aval.colunas || []).length;
    const n = statusNota(S, t);
    const sit = t.situacao && !/matric/i.test(t.situacao) ? `<span class="sit ${sitClass(t.situacao)}">${esc(t.situacao)}</span>` : '';
    let corpo;
    if (temAval) {
      const infos = t.aval.infos || [];
      corpo = tabelaSigaa(S, t) + (infos.length ? `<details class="small" style="margin-top:8px"><summary class="muted">Como a média é calculada <span class="arr">▶</span></summary>${infos.map(x => `<div class="res inf" style="padding:6px 10px;margin-top:4px">${esc(x)}</div>`).join('')}</details>` : '');
    } else {
      const un = t.unidades || [];
      corpo = (un.length ? `<div class="tw"><table class="tsig"><thead><tr>${un.map(u => `<th class="g">${esc(u.h)}</th>`).join('')}</tr></thead><tbody><tr>${un.map(u => `<td class="n nu ${u.v != null && u.v < S.cfg.mediaAprov ? 'baixa' : ''}">${u.v != null ? f1(u.v) : '<span class="fade">—</span>'}</td>`).join('')}</tr></tbody></table></div>` : '')
        + `<div class="small fade" style="margin-top:8px">${S.dados.parcial ? 'Carregando as notas da turma…' : `Notas por avaliação indisponíveis${t.avalErro ? ': ' + esc(t.avalErro) : ' — clique em atualizar (R).'}`}</div>`;
    }
    return `<div class="card nt-card" data-id="${esc(chaveT(t))}" style="border-left:4px solid ${t.cor}">
      <div class="nt-h"><div><h3 style="margin:0">${esc(titulo(t.nome))}</h3><div class="small muted">${[t.codigo, t.resumo && t.resumo.faltas != null ? pl(t.resumo.faltas, 'falta') : ''].filter(Boolean).map(esc).join(' · ')} ${sit}</div></div>
        <div class="nt-m"><span class="small muted">Média</span><b>${n.media != null ? f1(n.media) : '—'}</b>${n.txt ? `<span class="chip ${n.cls || 'gray'}">${esc(n.txt)}</span>` : ''}</div></div>
      ${corpo}
      <div class="acts" style="margin-top:10px"><button class="btn sm" data-a="simular-turma" data-i="${S.dados.turmas.indexOf(t)}">${ic('simulador')} Simular</button><button class="btn sm" data-a="turma" data-i="${S.dados.turmas.indexOf(t)}">${ic('ext')} Abrir turma virtual</button></div></div>`;
  }
  function listaNotas(S) {
    const { dados, modelo } = S, q = busca(S.filtroNotas || '');
    const lim = isoDia(new Date(hoje() - 7 * DIA_MS));
    const out = dados.notas.map((s, i) => {
      if (s.titulo === dados.periodo && dados.turmas.length) return '';
      const linhas = q ? s.linhas.filter(c => busca(c.join(' ')).includes(q)) : s.linhas;
      if (!linhas.length) return '';
      const iSit = s.headers.findIndex(h => /situa/i.test(h));
      const sits = iSit >= 0 ? s.linhas.map(c => sitClass(c[iSit])) : [];
      const ok = sits.filter(x => x === 's-ok').length, bad = sits.filter(x => x === 's-bad').length;
      const resumo = [ok && `${pl(ok, 'aprovada')}`, bad && `${pl(bad, 'reprovada')}`, s.titulo === dados.periodo && 'em andamento'].filter(Boolean).join(' · ');
      const body = linhas.map(c => `<tr>${c.map((v, j) => {
        const hd = s.headers[j] || '';
        if (j === iSit) return `<td>${sitClass(v) ? `<span class="sit ${sitClass(v)}">${esc(v)}</span>` : esc(v)}</td>`;
        if (/disciplina|componente/i.test(hd)) return `<td><b style="color:${s.titulo === dados.periodo ? corDe(S, v) : 'var(--fade)'}">●</b> ${esc(titulo(v))}</td>`;
        const hv = modelo.hist.notas[`${s.titulo}|${c[0]}|${hd}`];
        const novo = hv && hv.visto && hv.visto >= lim ? ` <span class="chip new" title="lançada em ${fmt(deIso(hv.visto))}">novo</span>` : '';
        const n = N.num(v), baixa = n != null && N.ehCampoNota(hd) && n < S.cfg.mediaAprov;
        return `<td class="${j > 1 ? 'n' : ''}"${baixa ? ' style="color:var(--bad)"' : ''}>${esc(v)}${novo}</td>`;
      }).join('')}</tr>`).join('');
      return `<details class="card" ${q ? 'open' : ''}><summary class="sem"><h3>${esc(s.titulo)}</h3><span class="muted small">${resumo} <span class="arr">▶</span></span></summary>
        <div class="tw" style="margin-top:10px"><table><thead><tr>${s.headers.map(x => `<th>${esc(curto(x))}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div></details>`;
    }).join('');
    return out || `<div class="card">${vazio('Nada encontrado.')}</div>`;
  }

  /* ---------------- SIMULADOR ---------------- */
  /** Campos do simulador: pelas avaliações da turma (com pesos) quando existirem; senão, pelas unidades. */
  function valoresSim(S, t) {
    const sv = (S.pessoal.sim || {})[chaveT(t)] || {};
    const hip = k => sv[k] !== undefined && sv[k] !== '' ? N.num(sv[k]) : null;
    const plano = N.planoAvaliacao(t);
    if (plano) return { plano, campos: plano.map((a, j) => ({ ...a, k: 'a' + j, h: a.abrev, tip: `${a.nome}${a.peso !== 1 ? ` · peso ${a.peso}` : ''}${a.unid ? ` · ${a.unid}` : ''}`, lan: a.nota, v: a.nota != null ? a.nota : hip('a' + j), raw: a.nota != null ? f1(a.nota) : (sv['a' + j] ?? '') })) };
    let un = t.unidades || [];
    if (!un.length) un = Array.from({ length: S.cfg.unidadesPadrao || 2 }, (_, j) => ({ h: `Unidade ${j + 1}`, v: null }));
    return { plano: null, campos: un.map((u, j) => ({ k: j, h: curto(u.h), tip: u.h, lan: u.v, v: u.v != null ? u.v : hip(j), raw: u.v != null ? f1(u.v) : (sv[j] ?? '') })) };
  }
  function vSimulador(S) {
    return `<h2>Simulador de notas</h2><p class="sub">Notas já lançadas aparecem em cinza. Digite notas hipotéticas nas outras para ver sua média — ou deixe em branco para saber quanto precisa tirar.</p>
      <div class="card acts"><label class="f">Média para aprovação<input type="number" step="0.1" min="0" max="10" data-in="meta" value="${esc(S.cfg.mediaAprov)}" style="width:110px"></label>
      <span class="small muted" style="max-width:560px">Quando o professor cadastrou as avaliações no SIGAA, o cálculo usa os <b>pesos de cada avaliação</b> (média ponderada em cada unidade, depois média das unidades). Senão, média aritmética das unidades. Recuperação não entra na conta.</span></div>
      <div class="cols3" data-ordem="simulador">${S.dados.turmas.map((t, i) => {
        const { plano, campos } = valoresSim(S, t);
        const grupos = [...new Set(campos.map(c => c.unid || ''))];
        const inp = c => `<label title="${esc(c.tip)}">${esc(c.h)}${c.peso != null && c.peso !== 1 ? `<span class="fade">×${esc(String(c.peso).replace('.', ','))}</span>` : ''}<input class="nt ${c.lan != null ? 'lan' : ''}" ${c.lan != null ? 'readonly' : ''} inputmode="decimal" data-in="sim" data-i="${i}" data-u="${c.k}" value="${esc(c.raw)}" placeholder="?"></label>`;
        return `<div class="card sim" data-id="${esc(chaveT(t))}" style="border-top:4px solid ${t.cor}"><h3>${esc(titulo(t.nome))}${plano ? '<span class="r chip">pelas avaliações da turma</span>' : ''}</h3>
          ${plano && grupos.length > 1 ? grupos.map(g => `<div class="small b muted" style="margin-top:6px">${esc(g || 'Outras')}</div><div class="uns">${campos.filter(c => (c.unid || '') === g).map(inp).join('')}</div>`).join('') : `<div class="uns">${campos.map(inp).join('')}</div>`}
          <div id="sr${i}">${resultadoSim(S, i)}</div></div>`;
      }).join('') || vazio('Nenhuma turma.')}</div>`;
  }
  function resultadoSim(S, i) {
    const t = S.dados.turmas[i], meta = S.cfg.mediaAprov;
    const { plano, campos } = valoresSim(S, t);
    const r = plano ? N.simularPlano(campos, meta) : N.simular(campos.map(u => u.v), meta);
    const oque = plano ? (r.faltam > 1 ? `em cada uma das ${r.faltam} avaliações restantes` : 'na avaliação restante') : (r.faltam > 1 ? `em cada uma das ${r.faltam} unidades restantes` : 'na unidade restante');
    if (r.estado === 'vazio') return '';
    if (r.estado === 'aprovado') return `<div class="res ok">Média final <span class="big">${f1(r.media)}</span> — acima de ${f1(meta)} ✔</div>`;
    if (r.estado === 'abaixo') return `<div class="res bad">Média final <span class="big">${f1(r.media)}</span> — abaixo de ${f1(meta)}. Provável recuperação/exame.</div>`;
    const atual = r.media != null ? `Média atual ${f1(r.media)} · ` : '';
    if (r.estado === 'garantido') return `<div class="res ok">${atual}Já garantiu ${f1(meta)} mesmo tirando 0 ${r.faltam > 1 ? 'nas restantes' : 'na restante'}. 🎉</div>`;
    if (r.estado === 'impossivel') return `<div class="res bad">${atual}Precisaria de ${f1(r.precisa)} — acima de 10. Foque na recuperação.</div>`;
    return `<div class="res ${r.precisa >= 8 ? 'warn' : 'inf'}">${atual}Precisa de <span class="big">${f1(r.precisa)}</span> ${oque}.</div>`;
  }

  /* ---------------- DESEMPENHO ---------------- */
  function vDesempenho(S) {
    const d = N.desempenho(S.dados, sitClass), p = S.dados.perfil;
    if (!d.sems.length) return `<h2>Desempenho</h2><div class="card muted">${S.dados.parcial ? 'Carregando notas…' : 'Sem notas para analisar.'}</div>`;
    const pts = d.sems.filter(s => s.media != null);
    const tot = d.sems.reduce((a, s) => ({ ap: a.ap + s.aprov, rp: a.rp + s.reprov, an: a.an + s.andamento }), { ap: 0, rp: 0, an: 0 });
    let h = `<h2>Desempenho</h2><p class="sub">Evolução das suas notas finais ao longo do curso.</p><div class="grid">
      ${p.indices.filter(i => /^(IRA|MC|CR)$/i.test(i.k)).map(i => `<div class="stat"><div class="v">${esc(i.v)}</div><div class="k">${esc(i.t || i.k)}</div></div>`).join('')}
      <div class="stat"><div class="v">${f2(d.mediaGeral)}</div><div class="k">média simples das notas finais</div></div>
      <div class="stat"><div class="v">${tot.ap}</div><div class="k">disciplinas aprovadas</div></div>
      <div class="stat"><div class="v">${tot.rp}</div><div class="k">reprovações/trancamentos</div></div>
      <div class="stat"><div class="v">${d.sems.length}</div><div class="k">semestres cursados</div></div></div>`;
    // gráfico de linha (série única: sem legenda; título nomeia)
    if (pts.length >= 1) {
      const W = 640, H = 220, L = 30, R = 16, T = 18, B = 26, x = i => L + (pts.length === 1 ? (W - L - R) / 2 : i * (W - L - R) / (pts.length - 1)), y = v => T + (10 - v) * (H - T - B) / 10;
      const meta = S.cfg.mediaAprov;
      const linha = pts.map((s, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(s.media).toFixed(1)}`).join('');
      const area = `${linha}L${x(pts.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`;
      const melhor = pts.reduce((a, s) => s.media > a.media ? s : a, pts[0]), ult = pts[pts.length - 1];
      h += `<div class="card chart"><h3>Média das notas finais por semestre</h3><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Média por semestre">
        ${[0, 2, 4, 6, 8, 10].map(v => `<line class="gl" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('')}
        <line class="ref" x1="${L}" x2="${W - R}" y1="${y(meta)}" y2="${y(meta)}"/><text class="ax" x="${W - R}" y="${y(meta) - 5}" text-anchor="end">média ${f1(meta)}</text>
        ${pts.length > 1 ? `<path class="ar" d="${area}"/><path class="ln" d="${linha}"/>` : ''}
        ${pts.map((s, i) => `<g><circle class="hit" cx="${x(i)}" cy="${y(s.media)}" r="16"><title>${esc(s.titulo)}: média ${f2(s.media)} · ${pl(s.aprov, 'aprovada')}, ${pl(s.reprov, 'reprovada')}</title></circle><circle class="pt" cx="${x(i)}" cy="${y(s.media)}" r="4.5" pointer-events="none"/>
          <text class="ax" x="${x(i)}" y="${H - 6}" text-anchor="middle">${esc(s.titulo)}</text></g>`).join('')}
        ${[...new Set([melhor, ult])].map(s => { const i = pts.indexOf(s); return `<text class="lb" x="${x(i)}" y="${y(s.media) - 11}" text-anchor="middle">${f1(s.media)}</text>`; }).join('')}
      </svg><p class="small fade" style="margin:6px 0 0">Passe o mouse nos pontos para ver detalhes. Rótulos: melhor semestre e o mais recente.</p></div>`;
    }
    // barras empilhadas de situação por semestre
    const maxN = Math.max(1, ...d.sems.map(s => s.aprov + s.reprov + s.andamento));
    h += `<div class="cols"><div class="card"><h3>Situação das disciplinas por semestre</h3>${d.sems.map(s => `<div class="hb" title="${esc(s.titulo)}: ${pl(s.aprov, 'aprovada')}, ${pl(s.reprov, 'reprovada')}, ${s.andamento} em andamento"><span class="nm">${esc(s.titulo)}</span><span class="tr">
        ${s.aprov ? `<i style="width:${100 * s.aprov / maxN}%;background:var(--ok)"></i>` : ''}${s.reprov ? `<i style="width:${100 * s.reprov / maxN}%;background:var(--bad)"></i>` : ''}${s.andamento ? `<i style="width:${100 * s.andamento / maxN}%;background:var(--ac)"></i>` : ''}</span><span class="small muted" style="width:26px;text-align:right">${s.aprov + s.reprov + s.andamento}</span></div>`).join('')}
      <div class="leg"><span><i style="background:var(--ok)"></i>aprovadas</span><span><i style="background:var(--bad)"></i>reprovadas/trancadas</span><span><i style="background:var(--ac)"></i>em andamento</span></div></div>`;
    const top = [...d.todas].sort((a, b) => b.nota - a.nota).slice(0, 6);
    const rep = d.sems.flatMap(s => s.linhas.filter(l => sitClass(l.sit) === 's-bad').map(l => ({ ...l, sem: s.titulo })));
    h += `<div class="card"><h3>Melhores notas</h3>${top.map(l => `<div class="row"><div class="grow">${esc(titulo(l.nome))} <span class="fade small">${esc(l.sem)}</span></div><b>${f1(l.nota)}</b></div>`).join('') || vazio('—')}
      ${rep.length ? `<h3 style="margin-top:14px">Reprovações / trancamentos</h3>${rep.map(l => `<div class="row"><div class="grow">${esc(titulo(l.nome))} <span class="fade small">${esc(l.sem)}</span></div><span class="sit s-bad">${esc(l.sit)}</span></div>`).join('')}` : ''}</div></div>`;
    if (p.integ && p.integ.length) h += `<div class="card"><h3>Carga horária</h3><div class="tw"><table><tbody>${p.integ.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="n">${v} h</td></tr>`).join('')}</tbody></table></div></div>`;
    return h;
  }

  /* ---------------- HORÁRIO ---------------- */
  function vHorario(S) {
    const { dados, cfg } = S;
    const cells = {}, slots = new Set();
    for (const t of dados.turmas) for (const code of t.horarios) {
      const m = /^([2-7]+)([MTN])([1-9]+)$/.exec(code); if (!m) continue;
      const lab = t.fixos ? !t.fixos.includes(code) : t.datas.length > 0;
      for (const d of m[1]) for (const s of m[3]) { slots.add(m[2] + s); (cells[m[2] + s + d] = cells[m[2] + s + d] || []).push({ t, lab }); }
    }
    if (!slots.size) return `<h2>Horário</h2><div class="card muted">Não encontrei horários.</div>`;
    const ord = { M: 0, T: 1, N: 2 };
    const sl = [...slots].sort((a, b) => ord[a[0]] - ord[b[0]] || a.slice(1) - b.slice(1));
    const dias = Object.keys(N.DIAS).filter(d => d !== '7' || sl.some(s => cells[s + 7]));
    const agora = new Date(), diaHj = String(agora.getDay() + 1), minA = agora.getHours() * 60 + agora.getMinutes();
    let g = `<div class="sched" style="grid-template-columns:62px repeat(${dias.length},minmax(96px,1fr))"><div></div>${dias.map(d => `<div class="h ${d === diaHj ? 'hj' : ''}">${N.DIAS[d]}</div>`).join('')}`;
    for (const s of sl) {
      const hr = N.horaDo(cfg, s);
      g += `<div class="slot"><b>${s}</b>${esc(hr.ini)}</div>`;
      for (const d of dias) {
        const ts = cells[s + d] || [];
        const now = d === diaHj && N.minutos(hr.ini) <= minA && minA < N.minutos(hr.fim);
        g += ts.length ? `<div class="c f ${now ? 'agora' : ''}" style="background:${ts[0].t.cor}" title="${esc(ts.map(x => titulo(x.t.nome) + ' — ' + x.t.local + ` (${hr.ini}–${hr.fim})` + (x.lab ? ' · só em ' + x.t.datas.map(y => y.slice(0, 5)).join(', ') : '')).join('\n'))}">${esc(ts.map(x => titulo(x.t.nome) + (x.lab ? ' *' : '')).join(' / '))}${ts[0].t.local ? `<div style="font-weight:400;opacity:.85;font-size:11px">${esc(ts[0].t.local)}</div>` : ''}</div>` : `<div class="c ${now ? 'agora' : ''}"></div>`;
      }
    }
    g += '</div>';
    const labs = dados.turmas.filter(t => t.datas.length);
    return `<h2>Horário ${esc(dados.periodo)}</h2><p class="sub">Horários da UNIFEI — se algum mudar, ajuste em <a href="#" data-v="ajustes">Ajustes</a> se sua universidade usa outros.</p>
      <div class="acts" style="margin-bottom:14px"><button class="btn pri" data-a="ics-aulas">${ic('down')} Exportar aulas para Google Agenda / Outlook (.ics)</button></div>
      <div class="card tw">${g}</div>
      ${labs.length ? blocoDatas(S, labs, true) : ''}
      <p class="small fade">Código SIGAA: dígitos = dias (2=Seg … 7=Sáb), letra = turno (M manhã, T tarde, N noite), números = aulas do turno.</p>`;
  }

  /** Aulas práticas (datas específicas): as que faltam em destaque; as que já passaram ficam recolhidas. */
  function blocoDatas(S, turmas, comTitulo) {
    const aulas = N.aulasEmDatas(turmas, S.cfg), prox = aulas.filter(a => a.d >= hoje()), pass = aulas.filter(a => a.d < hoje()).reverse();
    const linha = a => `<div class="row" style="${a.d < hoje() ? 'opacity:.5' : ''}"><span class="dot" style="background:${a.t.cor}"></span><div class="grow"><b>${esc(N.dataLonga(a.d))}</b>${a.ini ? ` · ${esc(a.ini)}–${esc(a.fim)}` : ''}<div class="small muted">${comTitulo ? esc(titulo(a.t.nome)) + ' · ' : ''}${esc(a.t.local)} · ${esc(a.code)}</div></div><div style="text-align:right"><span class="chip ${a.d < hoje() ? 'gray' : diasAte(a.d) <= 7 ? 'warn' : ''}">${quando(a.d)}</span>${a.d >= hoje() ? `<div style="margin-top:4px">${gbtn({ dia: a.d, ini: a.ini, fim: a.fim, titulo: titulo(a.t.nome) + ' (aula prática)', local: a.t.local, desc: `${a.t.codigo || ''} ${a.code}`.trim() })}</div>` : ''}</div></div>`;
    const idx = turmas.length === 1 ? S.dados.turmas.indexOf(turmas[0]) : -1;
    const atalhos = turmas.flatMap(t => N.labsParaGoogle(t, S.cfg).filter(e => e.qtd > 1).map(e => gbtn(e, `${comTitulo ? titulo(t.nome) + ': ' : ''}as ${e.qtd} que faltam (${N.DIAS[e.dia.getDay() + 1]} ${e.ini})`)));
    return `<div class="card"><h3>🧪 ${comTitulo ? '* ' : ''}Aulas práticas<span class="r small muted">${prox.length ? `${prox.length === 1 ? 'falta 1' : `faltam ${prox.length}`} de ${aulas.length}` : 'todas concluídas'}</span></h3>
      ${prox.length ? `<div class="res inf" style="margin-bottom:10px"><b>Salvar todas no Google Agenda</b>
        <div class="acts" style="margin-top:8px"><button class="btn sm pri" data-a="gcal-todos" ${idx >= 0 ? `data-i="${idx}"` : ''}>${ic('agenda')} Salvar ${prox.length > 1 ? `as ${prox.length} aulas práticas que faltam` : 'a aula prática que falta'} no Google Agenda</button>${atalhos.join('')}</div>
        <div class="small" style="margin-top:6px">${atalhos.length ? 'Os botões "as N que faltam" criam um evento repetido com 1 clique. ' : ''}"Salvar" baixa o arquivo e abre o Google Agenda em <b>Importar</b>: é só escolher o arquivo <b>aulas-praticas.ics</b> e clicar em Importar.</div></div>` : ''}
      ${prox.map(linha).join('') || (aulas.length ? '' : vazio('Nenhuma aula prática encontrada.'))}
      ${pass.length ? `<details class="passadas"><summary class="small b muted">Já passaram (${pass.length}) <span class="arr">▶</span></summary>${pass.map(linha).join('')}</details>` : ''}</div>`;
  }

  /* ---------------- FILTROS DA AGENDA ---------------- */
  // Cada tela (agenda, semanas) guarda seus filtros em S.pessoal.filtros[tela].
  const TIPOS_FILTRO = {
    agenda: [['prova', '📝 Provas'], ['atividade', '📌 Atividades'], ['lab', '🧪 Aulas práticas'], ['tarefa', '✓ Minhas tarefas']],
    semanas: [['falta', '✕ Faltas'], ['nota', '★ Notas'], ['prova', '📝 Provas'], ['atividade', '📌 Atividades'], ['lab', '🧪 Aulas práticas'], ['tarefa', '✓ Minhas tarefas']],
  };
  const filtroDe = (S, tela) => ({ ocultos: [], turma: '', semFeitas: false, ...(((S.pessoal || {}).filtros || {})[tela] || {}) });
  /** x.tipo: 'lab' | 'aula' (= lab) | 'prova' | 'atividade' | 'tarefa' | 'falta' | 'nota' ; x.turma = nome da turma */
  function passaFiltro(S, x, tela = 'agenda') {
    const f = filtroDe(S, tela), tipo = x.tipo === 'aula' ? 'lab' : x.tipo;
    if (f.ocultos.includes(tipo)) return false;
    if (f.turma && norm(x.turma || '') !== norm(f.turma)) return false;
    if (f.semFeitas && x.feito) return false;
    return true;
  }
  function barraFiltros(S, tela = 'agenda') {
    const f = filtroDe(S, tela), ativos = f.ocultos.length + (f.turma ? 1 : 0) + (f.semFeitas ? 1 : 0);
    return `<div class="card filtros"><span class="small b muted">Filtrar</span>
      ${TIPOS_FILTRO[tela].map(([k, l]) => `<button class="fchip ${f.ocultos.includes(k) ? '' : 'on'}" data-a="f-tipo" data-tela="${tela}" data-t="${k}" aria-pressed="${!f.ocultos.includes(k)}">${l}</button>`).join('')}
      <select data-in="f-turma" data-tela="${tela}" aria-label="Filtrar por turma"><option value="">Todas as turmas</option>${S.dados.turmas.map(t => `<option value="${esc(t.nome)}" ${norm(f.turma) === norm(t.nome) ? 'selected' : ''}>${esc(titulo(t.nome))}</option>`).join('')}</select>
      <label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-in="f-feitas" data-tela="${tela}" ${f.semFeitas ? 'checked' : ''}> Esconder tarefas concluídas</label>
      ${ativos ? `<button class="btn sm" data-a="f-limpar" data-tela="${tela}">Limpar filtros (${ativos})</button>` : ''}</div>`;
  }

  /* ---------------- CALENDÁRIO MENSAL ---------------- */
  const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  /** Todos os compromissos com data (inclui labs passados), indexados por dia ISO. */
  function compromissosPorDia(S) {
    const m = new Map(), add = (d, x) => { if (!d) return; const k = isoDia(d); (m.get(k) || m.set(k, []).get(k)).push(x); };
    S.dados.atividades.forEach(a => add(parseData(a.data), { tipo: tipoSigaa(a), hora: a.hora, titulo: a.titulo, cat: ROT[tipoSigaa(a)], turma: a.disciplina, cor: corDe(S, a.disciplina) }));
    N.aulasEmDatas(S.dados.turmas, S.cfg).forEach(a => add(a.d, { tipo: 'lab', hora: a.ini, fim: a.fim, titulo: titulo(a.t.nome), cat: 'Aula prática', turma: a.t.nome, local: a.t.local, cor: a.t.cor, code: a.code }));
    (S.pessoal.tarefas || []).forEach(t => add(deIso(t.data), { tipo: 'tarefa', titulo: t.txt, cat: 'Tarefa', turma: t.turma, feito: t.feito, cor: t.turma ? corDe(S, t.turma) : 'var(--fade)' }));
    m.forEach((xs, k) => { const f = xs.filter(x => passaFiltro(S, x, 'agenda')); if (f.length) m.set(k, f.sort((a, b) => String(a.hora || '99').localeCompare(String(b.hora || '99')))); else m.delete(k); });
    return m;
  }
  function calendarioMes(S) {
    const hj = hoje();
    const [ano, mes] = (S.mesCal || isoDia(hj).slice(0, 7)).split('-').map(Number);
    const prim = new Date(ano, mes - 1, 1), ini = new Date(prim); ini.setDate(1 - prim.getDay());
    const semanas = Math.ceil((prim.getDay() + new Date(ano, mes, 0).getDate()) / 7);
    const porDia = compromissosPorDia(S), sel = S.diaCal || isoDia(hj);
    let cel = '';
    for (let i = 0; i < semanas * 7; i++) {
      const d = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + i), k = isoDia(d), xs = porDia.get(k) || [];
      const cls = ['cd', d.getMonth() !== mes - 1 ? 'fora' : '', k === isoDia(hj) ? 'hj' : '', k === sel ? 'sel' : '', d < hj ? 'pass' : ''].join(' ');
      cel += `<button class="${cls}" data-a="cal-dia" data-d="${k}" title="${esc(xs.map(x => `${x.hora ? x.hora + ' ' : ''}${x.cat}: ${x.titulo}`).join('\n'))}"><span class="nd">${d.getDate()}</span>
        ${xs.slice(0, 3).map(x => `<span class="ev ${x.tipo} ${x.feito ? 'ok' : ''}" style="--c:${x.cor}"><i></i><span>${ICO[x.tipo]} ${esc(x.hora ? x.hora + ' ' : '')}${esc(x.titulo)}</span></span>`).join('')}
        ${xs.length > 3 ? `<span class="mais">+${xs.length - 3}</span>` : ''}</button>`;
    }
    const doDia = porDia.get(sel) || [], dSel = deIso(sel);
    const total = [...porDia.entries()].filter(([k]) => k.startsWith(`${ano}-${String(mes).padStart(2, '0')}`)).reduce((a, [, xs]) => a + xs.length, 0);
    return `<div class="card cal"><div class="calh"><h3 style="margin:0">${MESES[mes - 1]} ${ano}</h3><span class="small muted">${pl(total, 'compromisso')}</span>
        <div class="acts" style="margin-left:auto"><button class="btn sm" data-a="cal-mes" data-n="-1" title="Mês anterior">‹</button><button class="btn sm" data-a="cal-hoje">Hoje</button><button class="btn sm" data-a="cal-mes" data-n="1" title="Próximo mês">›</button></div></div>
      <div class="calg">${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(x => `<div class="dsem">${x}</div>`).join('')}${cel}</div>
      <div class="leg"><span>📝 prova</span><span>📌 atividade</span><span>🧪 aula prática</span><span>✓ minha tarefa</span></div>
      <div class="caldia"><div class="b" style="margin-bottom:4px">${esc(N.dataLonga(dSel))} <span class="fade small" style="font-weight:400">· ${quando(dSel)}</span></div>
        ${doDia.length ? doDia.map(x => `<div class="row"><span class="dot" style="background:${x.cor}"></span><div class="grow"><b>${esc(x.titulo)}</b><div class="small muted">${chipTipo(x)}${x.hora ? ` · ${esc(x.hora)}${x.fim ? '–' + esc(x.fim) : ''}` : ''}${x.local ? ' · ' + esc(x.local) : ''}${x.turma && x.tipo !== 'lab' ? ' · ' + esc(titulo(x.turma)) : ''}</div></div>
          ${dSel >= hj && !x.feito ? gbtn({ dia: dSel, ini: x.hora || '', fim: x.hora ? (x.fim || umaHoraDepois(x.hora)) : '', titulo: x.tipo === 'lab' ? x.titulo + ' (aula prática)' : ehSigaa(x) ? `${x.cat}: ${x.titulo}` : x.titulo, local: x.local || '', desc: x.turma ? titulo(x.turma) : '' }) : ''}</div>`).join('')
          : `<p class="empty">Nada marcado. <a href="#" data-a="cal-nova" data-d="${sel}">Adicionar tarefa neste dia</a></p>`}</div></div>`;
  }

  /* ---------------- AGENDA ---------------- */
  function vAgenda(S) {
    const it = itensAgenda(S).filter(x => passaFiltro(S, x, 'agenda')), hj = hoje();
    const grupos = [['Atrasadas', i => i.tipo === 'tarefa' && !i.feito && i.d && diasAte(i.d) < 0], ['Hoje', i => i.d && diasAte(i.d) === 0], ['Amanhã', i => i.d && diasAte(i.d) === 1],
      ['Próximos 7 dias', i => i.d && diasAte(i.d) > 1 && diasAte(i.d) <= 7], ['Mais adiante', i => i.d && diasAte(i.d) > 7], ['Sem data', i => !i.d], ['Já passaram', i => i.d && diasAte(i.d) < 0 && !(i.tipo === 'tarefa' && !i.feito)]];
    const usado = new Set();
    const linha = i => `<div class="task ${i.feito ? 'feito' : ''}">${i.tipo === 'tarefa' ? `<input type="checkbox" data-in="feito" data-id="${esc(i.id)}" ${i.feito ? 'checked' : ''}>` : `<span class="dot" style="background:${i.cor};margin:6px 4px 0"></span>`}
      <div class="grow" style="flex:1"><div class="tx b">${esc(i.titulo)}</div><div class="small muted">${chipTipo(i)} ${i.turma ? esc(titulo(i.turma)) : ''}</div></div>
      <div style="text-align:right" class="small">${i.d ? `<b>${fmt(i.d)}</b> ${esc(i.hora || '')}<div class="fade">${quando(i.d)}</div>` : ''}${i.d && diasAte(i.d) >= 0 && !i.feito ? `<div style="margin-top:4px">${gbtn({ dia: i.d, ini: i.hora || '', fim: i.hora ? (i.tipo === 'aula' ? i.fim : umaHoraDepois(i.hora)) : '', titulo: ehSigaa(i) ? `${i.cat}: ${i.titulo}` : i.titulo, local: i.local || '', desc: i.turma ? titulo(i.turma) : '' })}</div>` : ''}</div>${i.tipo === 'tarefa' ? `<button class="del" data-a="del-tarefa" data-id="${esc(i.id)}" title="Excluir">${ic('x')}</button>` : ''}</div>`;
    const corpo = grupos.map(([nome, f]) => { const xs = it.filter(i => !usado.has(i) && f(i)); xs.forEach(i => usado.add(i)); if (!xs.length) return ''; return nome === 'Já passaram' ? `<details class="passadas"><summary class="grp" style="cursor:pointer">Já passaram (${xs.length}) <span class="arr">▶</span></summary>${xs.map(linha).join('')}</details>` : `<div class="grp">${nome}</div>${xs.map(linha).join('')}`; }).join('');
    return `<h2>Agenda</h2><p class="sub">Provas, atividades, aulas práticas e as suas tarefas — no calendário e em lista. O que já passou fica recolhido no fim.</p>
      ${barraFiltros(S, 'agenda')}
      ${calendarioMes(S)}
      <div class="card"><h3>${ic('mais')} Nova tarefa</h3><div class="addf"><input id="nt-txt" placeholder="Ex.: estudar para P2 de Cálculo" maxlength="200"><input id="nt-data" type="date" value="${esc(S.novaData || isoDia(new Date(+hj + DIA_MS)))}"><select id="nt-turma"><option value="">(sem disciplina)</option>${S.dados.turmas.map(t => `<option value="${esc(t.nome)}" ${S.turmaTarefa === t.nome ? 'selected' : ''}>${esc(titulo(t.nome))}</option>`).join('')}</select><button class="btn pri" data-a="add-tarefa">Adicionar</button></div></div>
      <div class="acts" style="margin-bottom:14px"><button class="btn" data-a="ics-agenda">${ic('down')} Exportar agenda (.ics)</button></div>
      <div class="card">${corpo || vazio('Nenhuma atividade. Use o campo acima para criar a primeira tarefa.')}</div>`;
  }

  /* ---------------- FUNÇÕES ---------------- */
  function vFuncoes(S) {
    return `<h2>Funções do SIGAA</h2><p class="sub">Todos os itens do menu do SIGAA, pesquisáveis. Marque ★ para fixar no Início. Abre em nova aba.</p>
      <input type="search" data-in="q-func" id="qf" placeholder="Buscar (ex.: histórico, declaração, matrícula, trancamento…)" value="${esc(S.buscaFuncoes || '')}" style="margin-bottom:14px">
      <div class="card" id="lista-func" style="padding:4px 12px">${listaFuncoes(S)}</div>`;
  }
  function listaFuncoes(S) {
    const q = busca(S.buscaFuncoes || ''), favs = new Set(S.pessoal.favs || []);
    const it = S.dados.menu.filter(m => !q || busca(m.label + ' ' + m.hint).includes(q)).sort((a, b) => (favs.has(b.act) - favs.has(a.act)));
    return it.length ? it.map(m => `<div class="mi"><button class="star ${favs.has(m.act) ? 'on' : ''}" data-a="fav" data-act="${esc(m.act)}" title="Favoritar">${favs.has(m.act) ? '★' : '☆'}</button><button class="mi" style="border:0;padding:0" data-a="menu" data-act="${esc(m.act)}"><span class="lb">${esc(m.label)}</span><small>${esc(m.hint)}</small>${ic('ext')}</button></div>`).join('') : vazio('Nada encontrado.');
  }

  /* ---------------- AJUSTES ---------------- */
  function vAjustes(S) {
    const c = S.cfg, slots = Object.keys(N.HORAS_PADRAO);
    return `<h2>Ajustes</h2><p class="sub">Tudo fica salvo só neste navegador.</p>
    <div class="cols"><div>
      <div class="card"><h3>Aparência</h3><label class="f">Tema<select data-cfg="tema"><option value="auto" ${c.tema === 'auto' ? 'selected' : ''}>Automático (do sistema)</option><option value="claro" ${c.tema === 'claro' ? 'selected' : ''}>Claro</option><option value="escuro" ${c.tema === 'escuro' ? 'selected' : ''}>Escuro</option></select></label>
        <label class="small" style="display:flex;gap:8px;align-items:center;margin-top:12px"><input type="checkbox" data-cfg="autoAbrir" ${c.autoAbrir ? 'checked' : ''}> Abrir o painel automaticamente ao entrar no Portal do Discente</label>
        <label class="small" style="display:flex;gap:8px;align-items:center;margin-top:8px"><input type="checkbox" data-cfg="checarAtualizacao" ${c.checarAtualizacao !== false ? 'checked' : ''}> Avisar quando houver versão nova no GitHub</label>
        <p class="small muted" style="margin:12px 0 6px">Arraste os cartões pela alça <b>⠿</b> (Início, Turmas, Faltas e Simulador) para organizar do seu jeito.</p><button class="btn sm" data-a="ordem-reset">Restaurar organização original</button></div>
      <div class="card"><h3>Notas</h3><div class="acts"><label class="f">Média para aprovação<input type="number" step="0.1" min="0" max="10" data-cfg="mediaAprov" value="${esc(c.mediaAprov)}" style="width:110px"></label>
        <label class="f">Unidades por disciplina (quando o SIGAA não mostra)<input type="number" min="1" max="6" data-cfg="unidadesPadrao" value="${esc(c.unidadesPadrao)}" style="width:110px"></label></div></div>
      <div class="card"><h3>Semestre</h3><p class="small muted" style="margin-top:0">Usado na exportação para o Google Agenda e na contagem de semanas. Em branco = detectar pelo SIGAA${S.modelo.lim.ini ? ` (detectado: ${fmt(S.modelo.lim.ini)} a ${fmt(S.modelo.lim.fim)})` : ''}.</p>
        <div class="acts"><label class="f">Início<input type="date" data-cfg="inicio" value="${esc(c.inicio)}"></label><label class="f">Fim<input type="date" data-cfg="fim" value="${esc(c.fim)}"></label></div></div>
      <div class="card"><h3>Dados</h3><p class="small muted" style="margin-top:0">Faça backup das suas tarefas, anotações, favoritos e do histórico de notas/faltas.</p>
        <div class="acts"><button class="btn" data-a="backup">${ic('down')} Baixar backup</button><label class="btn">Restaurar backup<input type="file" accept=".json,application/json" data-in="importar" style="display:none"></label><button class="btn dng" data-a="limpar">Apagar dados locais</button></div></div>
    </div><div>
      <div class="card"><h3>Horário das aulas <button class="btn sm r" data-a="horas-padrao">Restaurar padrão</button></h3><p class="small muted" style="margin-top:0">Formato HH:MM-HH:MM.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px">${slots.map(s => `<label class="f">${s}<input data-hora="${s}" value="${esc((c.horas || {})[s] || N.HORAS_PADRAO[s])}" pattern="\\d{1,2}:\\d{2}-\\d{1,2}:\\d{2}"></label>`).join('')}</div></div>
      <div class="card"><h3>Atalhos de teclado</h3><div class="small">
        <div class="row"><span class="grow">Abrir/fechar o painel</span><kbd>Alt</kbd> <kbd>S</kbd></div>
        <div class="row"><span class="grow">Busca rápida</span><kbd>Ctrl</kbd> <kbd>K</kbd> ou <kbd>/</kbd></div>
        <div class="row"><span class="grow">Trocar de tela</span><kbd>1</kbd>…<kbd>9</kbd></div>
        <div class="row"><span class="grow">Atualizar dados</span><kbd>R</kbd></div>
        <div class="row"><span class="grow">Fechar</span><kbd>Esc</kbd></div></div></div>
    </div></div>`;
  }

  const passosAtualizar = `<ol class="small" style="margin:8px 0 0;padding-left:18px">
      <li>Clique em <b>Baixar versão nova</b> e extraia o .zip <b>por cima da pasta da extensão</b> (substituir arquivos).</li>
      <li>Abra <b>chrome://extensions</b> e clique no <b>↻</b> do SIGAA+.</li>
      <li>Recarregue o SIGAA (F5). Seus dados, tarefas e ajustes continuam salvos.</li></ol>`;
  /** Situação da versão (tela Sobre). */
  function blocoAtualizacao(S) {
    const u = S.upd || {}, L = N.LINKS;
    const status = u.nova ? `<div class="res warn"><b>Versão ${esc(u.remota)} disponível</b> — você está na ${esc(S.versao)}.</div>`
      : u.remota ? `<div class="res ok">Você está na versão mais recente (${esc(S.versao)}).</div>`
      : u.erro ? `<div class="res bad">Não consegui verificar agora (${esc(u.erro)}).</div>` : `<div class="res inf">Ainda não verificado.</div>`;
    return `${status}${u.em ? `<div class="small fade" style="margin-top:4px">Última verificação: ${esc(N.atras(new Date(u.em).toISOString()))}</div>` : ''}
      ${u.nova ? passosAtualizar : ''}
      <div class="acts" style="margin-top:10px">${u.nova ? `<a class="btn pri" href="${esc(L.download)}" target="_blank" rel="noopener" style="text-decoration:none">${ic('down')} Baixar versão nova</a><a class="btn" href="${esc(L.novidades)}" target="_blank" rel="noopener" style="text-decoration:none">O que mudou</a>` : ''}
      <button class="btn" data-a="checar-upd">${ic('refresh')} Verificar agora</button><a class="btn" href="${esc(L.repo)}" target="_blank" rel="noopener" style="text-decoration:none">${ic('ext')} GitHub</a></div>`;
  }
  /** Faixa no topo quando há versão nova (some se a pessoa clicar em "depois" para aquela versão). */
  function faixaAtualizacao(S) {
    const u = S.upd;
    if (!u || !u.nova || S.cfg.updIgnorada === u.remota) return '';
    return `<div class="updbar">${ic('down')}<span><b>Nova versão ${esc(u.remota)}</b> do SIGAA+ disponível.</span>
      <a class="btn sm pri" href="${esc(N.LINKS.download)}" target="_blank" rel="noopener" style="text-decoration:none">Baixar</a>
      <button class="btn sm" data-v="sobre">Como atualizar</button><button class="ib" data-a="upd-depois" title="Lembrar depois">${ic('x')}</button></div>`;
  }

  /** Convite discreto para conhecer o autor (aparece depois de algumas aberturas ou após atualizar). */
  function conviteLinkedin(S) {
    const A = N.AUTOR, nome = A.nome.split(' ')[0];
    const txt = S.convite === 'atualizou'
      ? `O SIGAA+ foi atualizado para a versão ${esc(S.versao)}. Ele é feito por ${esc(nome)}, estudante da UNIFEI.`
      : `O SIGAA+ é gratuito e feito por ${esc(nome)}, estudante da UNIFEI. Se ele está ajudando, que tal se conectar?`;
    return `<div class="card convite" data-id="convite"><h3>💙 Curtiu o SIGAA+?</h3><p class="small" style="margin:0 0 10px">${txt}</p>
      <div class="acts"><button class="btn li" data-a="linkedin">${ic('link')} Conectar no LinkedIn</button><button class="btn sm" data-a="convite-depois">Agora não</button></div></div>`;
  }

  /* ---------------- SOBRE ---------------- */
  function vSobre(S) {
    const A = N.AUTOR;
    const recursos = [
      ['Início', 'aulas de hoje, próximas provas, alertas de falta e nota, novidades'],
      ['Turmas', 'notas por avaliação, método do professor, anotações, Google Agenda'],
      ['Simulador', 'quanto precisa tirar, com os pesos de cada avaliação'],
      ['Horário', 'grade com os horários da UNIFEI e exportação .ics'],
      ['Agenda', 'provas, aulas práticas e suas próprias tarefas'],
      ['Desempenho', 'gráfico da média por semestre'],
      ['Organização', 'arraste os cartões pela alça ⠿'],
    ];
    return `<div class="hero"><h2>📚 SIGAA+</h2><p>${S.versao ? 'Versão ' + esc(S.versao) + ' · ' : ''}painel do estudante para o SIGAA da UNIFEI</p>
        <div class="pills"><span class="pill">Feito por ${esc(A.nome)}</span></div></div>
      <div class="cols"><div>
        <div class="card"><h3>${ic('sobre')} Autor</h3>
          <div class="row"><span class="logo" style="padding:0"><span class="m" style="width:46px;height:46px;font-size:16px;border-radius:12px">OZ</span></span>
          <div class="grow"><div class="b" style="font-size:16px">${esc(A.nome)}</div><div class="small muted">Criador e desenvolvedor do SIGAA+</div>
          <p class="small" style="margin:8px 0 0">Estudante da UNIFEI. Fiz o SIGAA+ para deixar o dia a dia da faculdade mais simples. Sugestões são bem-vindas!</p>
          ${A.linkedin ? `<div class="acts" style="margin-top:10px"><button class="btn li" data-a="linkedin">${ic('link')} Ver meu perfil no LinkedIn</button></div>` : ''}</div></div></div>
        <div class="card"><h3>${ic('refresh')} Atualizações</h3>${blocoAtualizacao(S)}</div>
        <div class="card"><h3>${ic('info')} Privacidade</h3><p class="small" style="margin:0">Tudo roda no seu navegador, com o login que você já fez no SIGAA. A extensão não pede senha e não envia seus dados para nenhum servidor além do próprio SIGAA. Os botões "Google Agenda" só abrem o Google quando você clica. A checagem de versão nova só lê o número da versão no GitHub (dá para desligar em Ajustes).</p></div>
      </div><div>
        <div class="card"><h3>${ic('funcoes')} O que dá para fazer</h3><div class="small">${recursos.map(([a, b]) => `<div class="row"><b style="width:100px;flex:none">${a}</b><span class="muted">${b}</span></div>`).join('')}</div></div>
      </div></div>`;
  }

  const TELAS = { inicio: vInicio, turmas: vTurmas, semanas: vSemanas, faltas: vFaltas, notas: vNotas, simulador: vSimulador, desempenho: vDesempenho, horario: vHorario, agenda: vAgenda, funcoes: vFuncoes, ajustes: vAjustes, sobre: vSobre };

  /** Esqueleto mostrado enquanto não há nenhum dado. */
  const esqueleto = (msg, p) => `<div class="load"><div class="msg b">${esc(msg)}</div><div class="pg"><i style="width:${Math.round((p || 0) * 100)}%"></i></div><div class="small">Na primeira vez leva uns segundos: o SIGAA só mostra a frequência entrando em cada turma.<br>Depois disso o painel abre na hora.</div></div>
    <div class="grid">${'<div class="sk" style="height:76px"></div>'.repeat(4)}</div><div class="cols"><div class="sk" style="height:260px"></div><div class="sk" style="height:260px"></div></div>`;

  return { faixaAtualizacao, blocoAtualizacao, ic, VIEWS, nomeView, TELAS, listaNotas, listaFuncoes, resultadoSim, novidades, sitClass, esqueleto, itensAgenda, chaveT };
})();
if (typeof module !== 'undefined') module.exports = SMT;
