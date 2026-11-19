/* SIGAA+ — painel injetado nas páginas do SIGAA. Usa a sessão já logada; nada sai do navegador. */
(() => {
  if (window.__sigaaMelhor) return;
  window.__sigaaMelhor = true;
  if (/verTelaLogin|logar\.do|\/public\//i.test(location.pathname) || document.querySelector('form[name=loginForm]')) return;

  const N = SMN, T = SMT, { esc, store } = N;
  const S = {
    dados: null, modelo: null, cfg: { ...N.CFG_PADRAO }, pessoal: { anot: {}, tarefas: [], favs: [], sim: {} },
    view: 'inicio', filtroNotas: '', buscaFuncoes: '', turmaTarefa: '', novas: 0,
    versao: (() => { try { return chrome.runtime.getManifest().version; } catch { return ''; } })(),
  };
  let host = null, root = null, buscouNaRede = false, carregando = false;

  /* ---------------- persistência ---------------- */
  const chaveP = () => 'pessoal:' + ((S.dados && S.dados.perfil.matricula) || 'anon');
  const salvarPessoal = (() => { let t; return () => { clearTimeout(t); t = setTimeout(() => store.set(chaveP(), S.pessoal), 300); }; })();
  const salvarCfg = () => store.set('cfg', S.cfg);
  async function carregarPessoal() {
    const p = await store.get(chaveP());
    S.pessoal = { anot: {}, tarefas: [], favs: [], sim: {}, ...(p || {}) };
    if (!S.pessoal.inicioV3) { if (S.pessoal.ordem) { delete S.pessoal.ordem['inicio:a']; delete S.pessoal.ordem['inicio:b']; } S.pessoal.inicioV3 = true; }
  }

  /* ---------------- botão flutuante ---------------- */
  let fab = null, fabUpd = null;
  function botaoFlutuante() {
    const b = document.createElement('div');
    b.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:2147483646';
    const sr = b.attachShadow({ mode: 'open' });
    sr.innerHTML = `<style>
      button{all:initial;cursor:pointer;font:600 14px system-ui,-apple-system,"Segoe UI",sans-serif;background:linear-gradient(135deg,#2457d6,#6a4fe0);color:#fff;padding:11px 17px;border-radius:999px;box-shadow:0 6px 20px rgba(36,87,214,.35);display:flex;gap:8px;align-items:center;transition:transform .15s}
      button:hover{transform:translateY(-2px)}
      .b{background:#ff5a36;border-radius:99px;font-size:11px;padding:0 6px;line-height:18px;display:none}
      .u{background:#16a34a;border-radius:99px;font-size:11px;padding:0 7px;line-height:18px;display:none}
    </style><button title="Abrir SIGAA+ (Alt+S)">📚 SIGAA+ <span class="b"></span><span class="u">atualizar</span></button>`;
    sr.querySelector('button').onclick = abrir;
    fab = sr.querySelector('.b'); fabUpd = sr.querySelector('.u');
    document.body.appendChild(b);
    document.addEventListener('keydown', e => { if (e.altKey && !e.ctrlKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); host ? fechar() : abrir(); } }, true);
  }
  /* ---------------- aviso de versão nova (GitHub) ---------------- */
  async function checarUpd(forcar) {
    if (S.cfg.checarAtualizacao === false && !forcar) return;
    S.upd = await N.verificarAtualizacao(S.versao, forcar);
    if (fabUpd) { const mostra = S.upd.nova && S.cfg.updIgnorada !== S.upd.remota; fabUpd.style.display = mostra ? 'inline-block' : 'none'; fabUpd.title = mostra ? 'Versão ' + S.upd.remota + ' disponível' : ''; }
    renderUpd();
  }
  function renderUpd() { const s = $('.updslot'); if (s) s.innerHTML = T.faixaAtualizacao(S); }
  function badge(n) { if (fab) { fab.textContent = n > 9 ? '9+' : n; fab.style.display = n ? 'inline-block' : 'none'; } }

  /* ---------------- abrir / fechar ---------------- */
  async function abrir() {
    if (host) return;
    document.documentElement.style.overflow = 'hidden';
    host = document.createElement('div');
    host.style.cssText = 'position:fixed;inset:0;z-index:2147483647';
    document.body.appendChild(host);
    root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${SMCSS}</style><div class="app" data-tema="${esc(S.cfg.tema)}" tabindex="-1">
      <aside>
        <div class="logo"><span class="m" style="font-size:13px">S+</span><div>SIGAA+<small>painel do estudante</small></div></div>
        ${T.VIEWS.map(([k, l], i) => ({ faltas: '<div class="sec">Acompanhamento</div>', funcoes: '<div class="sec">Mais</div>' }[k] || '') + `<button class="nv" data-v="${k}" title="${esc(l)}${i < 9 ? ` (tecla ${i + 1})` : ''}">${T.ic(k)}<span>${esc(l)}</span>${k === 'inicio' ? '<span class="bdg" hidden></span>' : i < 9 ? `<kbd>${i + 1}</kbd>` : ''}</button>`).join('')}
        <div class="foot">Feito por <a href="#" data-a="linkedin" title="Ver perfil no LinkedIn">${esc(N.AUTOR.nome)}</a> · <a href="#" data-v="sobre">Sobre</a></div>
      </aside>
      <div class="main">
        <div class="top"><h1></h1>
          <button class="srch" data-a="paleta">${T.ic('search')}<span>Buscar…</span><kbd>Ctrl K</kbd></button>
          <span class="sync"></span>
          <button class="ib" data-a="atualizar" title="Atualizar dados (R)">${T.ic('refresh')}</button>
          <button class="ib" data-a="tema" title="Alternar tema">${T.ic('lua')}</button>
          <button class="ib" data-a="fechar" title="Fechar (Esc)">${T.ic('x')}</button>
          <i class="pbar" style="width:0;opacity:0"></i>
        </div>
        <div class="updslot"></div>
        <div class="scroll"><main></main></div>
      </div></div>`;
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('change', onChange);
    root.addEventListener('keydown', onKey);
    ligarArrastar();
    root.querySelector('.app').focus();
    badge(0);
    renderUpd();
    if (!S.upd) checarUpd(false);

    // convite para o LinkedIn: sempre visível no Início
    S.cfg.aberturas = (S.cfg.aberturas || 0) + 1;
    const atualizou = S.cfg.ultimaVersao && S.versao && N.versaoMaior(S.versao, S.cfg.ultimaVersao);
    if (S.versao) S.cfg.ultimaVersao = S.versao;
    S.convite = !!N.AUTOR.linkedin; // convite fixo no Início
    salvarCfg();

    const cache = await store.get('ultimo');
    if (cache && cache.dados) {
      S.dados = cache.dados;
      await carregarPessoal();
      await prepararModelo(false);
      ir(S.view);
      if (Date.now() - new Date(S.dados.atualizadoEm) > (S.cfg.cacheMin || 30) * 6e4) atualizar(true);
    } else {
      setMain(T.esqueleto('Conectando ao SIGAA…', 0));
      atualizar(false);
    }
  }

  function fechar() {
    if (!host) return;
    host.remove(); host = null; root = null;
    document.documentElement.style.overflow = '';
    // Buscar dados mudou o estado da sessão JSF; recarrega o portal para os links do SIGAA não darem erro.
    if (buscouNaRede) location.href = N.portalUrl();
  }

  const $ = s => root && root.querySelector(s);
  const setMain = html => { const m = $('main'); if (m) { m.innerHTML = html; m.style.animation = 'none'; void m.offsetWidth; m.style.animation = ''; prepararArrastar(m); } };

  /* ---------------- arrastar para organizar ---------------- */
  // Contêineres com data-ordem="grupo:nome"; filhos com data-id. Pode mover entre contêineres do mesmo grupo.
  const grupoDe = c => c.dataset.ordem.split(':')[0];
  function prepararArrastar(m) {
    const ordem = S.pessoal.ordem || {};
    const conts = [...m.querySelectorAll('[data-ordem]')];
    // aplica a ordem salva
    const porGrupo = {};
    conts.forEach(c => (porGrupo[grupoDe(c)] = porGrupo[grupoDe(c)] || []).push(c));
    Object.values(porGrupo).forEach(cs => {
      const todos = new Map(cs.flatMap(c => [...c.children].filter(x => x.dataset.id).map(x => [x.dataset.id, x])));
      const salvos = new Set(cs.flatMap(c => ordem[c.dataset.ordem] || []));
      // primeiro os itens na ordem salva; depois os novos, no contêiner e ordem originais
      const plano = cs.map(c => [...(ordem[c.dataset.ordem] || []).map(id => todos.get(id)).filter(Boolean),
        ...[...c.children].filter(x => x.dataset.id && !salvos.has(x.dataset.id))]);
      cs.forEach((c, i) => plano[i].forEach(el => c.appendChild(el)));
    });
    conts.forEach(c => [...c.children].forEach(x => {
      if (!x.dataset.id || x.querySelector(':scope > .grip')) return;
      const g = document.createElement('button'); g.className = 'grip'; g.type = 'button'; g.title = 'Arraste para reorganizar'; g.textContent = '⠿';
      x.classList.add('dnd'); x.prepend(g);
    }));
  }
  let arrastando = null;
  function salvarOrdem(grupo) {
    S.pessoal.ordem = S.pessoal.ordem || {};
    root.querySelectorAll('[data-ordem]').forEach(c => { if (grupoDe(c) === grupo) S.pessoal.ordem[c.dataset.ordem] = [...c.children].map(x => x.dataset.id).filter(Boolean); });
    salvarPessoal();
  }
  function ligarArrastar() {
    root.addEventListener('pointerdown', e => { const g = e.target.closest('.grip'); if (g) g.parentElement.draggable = true; });
    root.addEventListener('dragstart', e => {
      const el = e.target.closest && e.target.closest('.dnd');
      if (!el || !el.draggable) { e.preventDefault(); return; }
      arrastando = el; el.classList.add('arr-on');
      e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', el.dataset.id); } catch { }
    });
    root.addEventListener('dragover', e => {
      if (!arrastando) return;
      const cont = e.target.closest && e.target.closest('[data-ordem]');
      if (!cont || grupoDe(cont) !== grupoDe(arrastando.parentElement)) return;
      e.preventDefault(); e.dataTransfer.dropEffect = 'move';
      const grade = getComputedStyle(cont).gridTemplateColumns.split(' ').filter(Boolean).length > 1;
      const alvo = [...cont.children].filter(x => x !== arrastando && x.dataset.id).find(x => {
        const r = x.getBoundingClientRect();
        return grade ? (e.clientY < r.bottom && (e.clientY < r.top || e.clientX < r.left + r.width / 2)) : e.clientY < r.top + r.height / 2;
      });
      if (alvo) { if (alvo.previousElementSibling !== arrastando) cont.insertBefore(arrastando, alvo); }
      else if (cont.lastElementChild !== arrastando) cont.appendChild(arrastando);
    });
    root.addEventListener('drop', e => { if (arrastando) e.preventDefault(); });
    root.addEventListener('pointerup', () => { if (!arrastando) root.querySelectorAll('.dnd[draggable="true"]').forEach(x => { x.draggable = false; }); });
    root.addEventListener('dragend', () => {
      if (!arrastando) return;
      const el = arrastando; arrastando = null;
      el.classList.remove('arr-on'); el.draggable = false;
      if (el.parentElement && el.parentElement.dataset.ordem) salvarOrdem(grupoDe(el.parentElement));
    });
  }

  async function prepararModelo(salvarHist) {
    const chave = 'hist:' + (S.dados.perfil.matricula || 'anon');
    let hist = await store.get(chave);
    if (salvarHist) { const r = N.atualizarHistorico(hist, S.dados); hist = r.hist; S.novas = r.novas; await store.set(chave, hist); }
    S.modelo = N.montarModelo(S.dados, hist || { inicio: N.isoDia(N.hoje()), notas: {}, faltas: {} }, S.cfg);
    marcarSync();
    const nov = T.novidades(S, 7).length, bd = $('.nv .bdg');
    if (bd) { bd.textContent = nov; bd.hidden = !nov; }
  }
  function marcarSync(msg) { const u = $('.sync'); if (u) u.textContent = msg || (S.dados ? 'Atualizado ' + N.atras(S.dados.atualizadoEm) : ''); }
  function progresso(p) { const b = $('.pbar'); if (b) { b.style.width = Math.round(p * 100) + '%'; b.style.opacity = p > 0 && p < 1 ? 1 : 0; } }

  /** Atualiza do SIGAA. emSegundoPlano = já tem dados na tela, só mostra progresso no topo. */
  async function atualizar(emSegundoPlano) {
    if (carregando) return;
    carregando = true;
    const btn = $('[data-a="atualizar"]'); if (btn) btn.classList.add('spin');
    const temTela = emSegundoPlano && S.dados;
    try {
      const novo = await N.coletar((msg, p) => {
        if (!root) return;
        progresso(p); marcarSync(msg);
        if (!temTela) { const m = $('.load .msg'), i = $('.load .pg i'); if (m) m.textContent = msg; if (i) i.style.width = Math.round(p * 100) + '%'; }
      }, async parcial => {
        // primeira vez: mostra o que já tem (turmas, atividades) enquanto o resto carrega
        if (temTela || !root) return;
        S.dados = parcial; await carregarPessoal(); await prepararModelo(false);
        if (S.view !== 'inicio' && S.view !== 'turmas' && S.view !== 'agenda' && S.view !== 'horario') return;
        ir(S.view, true);
      });
      buscouNaRede = true;
      S.dados = novo;
      await store.set('ultimo', { dados: novo });
      await carregarPessoal();
      await prepararModelo(true);
      if (root) {
        ir(S.view, true);
        if (S.novas) toast(`${S.novas} novidade(s) desde a última vez! Veja em Início.`);
        else if (emSegundoPlano) toast('Dados atualizados.');
      }
    } catch (e) {
      console.error('[SIGAA+]', e);
      const msgs = {
        login: ['Você não está logado', 'Entre no SIGAA com seu usuário e senha e abra o painel de novo.'],
        aviso: ['O SIGAA está mostrando um aviso', 'Feche este painel, clique em "Continuar" no aviso do SIGAA e abra o painel de novo.'],
        vinculo: ['Escolha seu vínculo', 'Selecione o vínculo de discente (aluno) no SIGAA e abra o painel de novo.'],
        portal: ['Não consegui abrir o Portal do Discente', 'Entre no "Portal do Discente" pelo SIGAA e tente de novo.'],
      };
      const [t, d] = msgs[e.estado] || ['Algo deu errado', e.message];
      if (temTela) { toast(`${t}. Mostrando os dados salvos.`); marcarSync(); }
      else if (root) setMain(`<div class="card" style="max-width:560px;margin:40px auto"><h3 class="err">${esc(t)}</h3><p>${esc(d)}</p><button class="btn pri" data-a="atualizar">Tentar de novo</button></div>`);
    } finally {
      carregando = false; progresso(0);
      const b = $('[data-a="atualizar"]'); if (b) b.classList.remove('spin');
    }
  }

  /* ---------------- navegação ---------------- */
  function ir(v, manterScroll) {
    if (!T.TELAS[v]) v = 'inicio';
    S.view = v;
    if (!root) return;
    root.querySelectorAll('.nv').forEach(b => b.classList.toggle('on', b.dataset.v === v));
    $('.top h1').textContent = T.nomeView(v);
    if (!S.dados || !S.modelo) return;
    const sc = $('.scroll'), y = sc.scrollTop;
    try { setMain(T.TELAS[v](S)); }
    catch (err) { console.error(err); setMain(`<div class="card err">Erro ao montar esta tela: ${esc(err.message)}</div>`); }
    sc.scrollTop = manterScroll ? y : 0;
    if (v === 'funcoes') { const q = $('#qf'); if (q) q.focus(); }
  }

  /* ---------------- toast ---------------- */
  function toast(msg) {
    if (!root) return;
    const app = $('.app'); const t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); t.textContent = msg; app.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  /* ---------------- ações ---------------- */
  async function onClick(e) {
    const el = e.target.closest('[data-v],[data-a]');
    if (!el) return;
    if (el.tagName === 'A') e.preventDefault();
    if (el.dataset.v) { fecharPaleta(); ir(el.dataset.v); return; }
    const a = el.dataset.a, d = S.dados;
    try {
      switch (a) {
        case 'fechar': fechar(); break;
        case 'atualizar': atualizar(!!S.dados); break;
        case 'tema': {
          const escuro = S.cfg.tema === 'escuro' || (S.cfg.tema === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
          S.cfg.tema = escuro ? 'claro' : 'escuro'; $('.app').dataset.tema = S.cfg.tema; salvarCfg();
          if (S.view === 'ajustes') ir('ajustes', true);
          break;
        }
        case 'paleta': abrirPaleta(); break;
        case 'menu': fecharPaleta(); toast('Abrindo no SIGAA…'); await N.abrirMenuNoSigaa(el.dataset.act); buscouNaRede = true; break;
        case 'turma': toast('Abrindo a turma virtual em nova aba…'); await N.abrirTurmaNoSigaa(d.turmas[+el.dataset.i]); buscouNaRede = true; break;
        case 'fav': {
          const f = new Set(S.pessoal.favs); f.has(el.dataset.act) ? f.delete(el.dataset.act) : f.add(el.dataset.act);
          S.pessoal.favs = [...f]; salvarPessoal(); $('#lista-func').innerHTML = T.listaFuncoes(S); break;
        }
        case 'csv': N.baixar(`notas-${d.perfil.matricula || 'sigaa'}.csv`, N.csvNotas(d), 'text/csv;charset=utf-8'); toast('Planilha baixada.'); break;
        case 'ics-aulas': N.baixar(`aulas-${d.periodo || 'sigaa'}.ics`, N.gerarICS(N.eventosAulas(d, S.modelo, S.cfg)), 'text/calendar'); toast('Arquivo .ics baixado — importe no Google Agenda (Configurações › Importar).'); break;
        case 'cal-mes': {
          const [y, m] = (S.mesCal || N.isoDia(N.hoje()).slice(0, 7)).split('-').map(Number);
          const d2 = new Date(y, m - 1 + +el.dataset.n, 1); S.mesCal = N.isoDia(d2).slice(0, 7); S.diaCal = N.isoDia(d2); ir('agenda', true); break;
        }
        case 'f-tipo': {
          const f = filtroTela(el.dataset.tela);
          f.ocultos = f.ocultos.includes(el.dataset.t) ? f.ocultos.filter(x => x !== el.dataset.t) : [...f.ocultos, el.dataset.t];
          salvarPessoal(); ir(el.dataset.tela, true); break;
        }
        case 'f-limpar': filtroTela(el.dataset.tela); S.pessoal.filtros[el.dataset.tela] = {}; salvarPessoal(); ir(el.dataset.tela, true); break;
        case 'cal-hoje': S.mesCal = ''; S.diaCal = ''; ir('agenda', true); break;
        case 'cal-dia': S.diaCal = el.dataset.d; S.mesCal = el.dataset.d.slice(0, 7); ir('agenda', true); break;
        case 'cal-nova': S.novaData = el.dataset.d; ir('agenda', true); setTimeout(() => { const i = $('#nt-txt'); if (i) { i.scrollIntoView({ block: 'center' }); i.focus(); } }, 0); break;
        case 'gcal-todos': {
          const ts = el.dataset.i != null ? [d.turmas[+el.dataset.i]] : d.turmas;
          N.baixar('aulas-praticas.ics', N.gerarICS(N.eventosAulas(d, S.modelo, S.cfg, { soDatas: true, futuras: true, turmas: ts })), 'text/calendar');
          window.open(N.LINKS.importarGoogle, '_blank', 'noopener');
          toast('No Google Agenda: "Selecionar arquivo do computador" → aulas-praticas.ics → Importar.');
          break;
        }
        case 'ics-datas': {
          const ts = el.dataset.i != null ? [d.turmas[+el.dataset.i]] : d.turmas;
          N.baixar(ts.length === 1 ? 'aulas-praticas-' + (ts[0].codigo || 'turma') + '.ics' : 'aulas-praticas.ics', N.gerarICS(N.eventosAulas(d, S.modelo, S.cfg, { soDatas: true, turmas: ts })), 'text/calendar');
          toast('Arquivo .ics baixado — abra-o ou importe no Google Agenda.'); break;
        }
        case 'ics-agenda': N.baixar('agenda-sigaa.ics', N.gerarICS(N.eventosAgenda(d, S.pessoal)), 'text/calendar'); toast('Agenda exportada.'); break;
        case 'ir-nota': { const x = [...root.querySelectorAll('main .stack > [data-id]')].find(y => y.dataset.id === el.dataset.id); if (x) { x.scrollIntoView({ block: 'start', behavior: 'smooth' }); x.classList.add('pisca'); setTimeout(() => x.classList.remove('pisca'), 1200); } break; }
        case 'tarefa-turma': S.turmaTarefa = d.turmas[+el.dataset.i].nome; ir('agenda'); setTimeout(() => { const i = $('#nt-txt'); i && i.focus(); }, 0); break;
        case 'add-tarefa': {
          const txt = $('#nt-txt').value.trim(); if (!txt) { $('#nt-txt').focus(); return; }
          S.pessoal.tarefas.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), txt, data: $('#nt-data').value || '', turma: $('#nt-turma').value || '', feito: false });
          S.turmaTarefa = $('#nt-turma').value; salvarPessoal(); ir('agenda', true); toast('Tarefa adicionada.'); break;
        }
        case 'checar-upd': toast('Verificando no GitHub…'); await checarUpd(true); if (S.view === 'sobre') ir('sobre', true); toast(S.upd.nova ? 'Versão ' + S.upd.remota + ' disponível!' : S.upd.erro ? 'Não consegui verificar: ' + S.upd.erro : 'Você já está na versão mais recente.'); break;
        case 'linkedin':
          window.open(N.AUTOR.linkedin, '_blank', 'noopener');
          S.cfg.linkedinVisto = true; salvarCfg();
          break;
        case 'upd-depois': S.cfg.updIgnorada = S.upd && S.upd.remota; salvarCfg(); renderUpd(); break;
        case 'ini-personalizar': S.personalizando = !S.personalizando; ir('inicio', true); break;
        case 'ini-tudo': S.pessoal.inicioOcultos = []; salvarPessoal(); ir('inicio', true); break;
        case 'ordem-reset': S.pessoal.ordem = {}; salvarPessoal(); toast('Organização original restaurada.'); if (S.view === 'inicio') ir('inicio', true); break;
        case 'del-tarefa': S.pessoal.tarefas = S.pessoal.tarefas.filter(t => t.id !== el.dataset.id); salvarPessoal(); ir('agenda', true); break;
        case 'horas-padrao': S.cfg.horas = { ...N.HORAS_PADRAO }; salvarCfg(); await prepararModelo(false); ir('ajustes', true); toast('Horários restaurados.'); break;
        case 'backup': {
          const mat = d.perfil.matricula || 'anon';
          N.baixar(`sigaa-plus-backup-${N.isoDia(new Date())}.json`, JSON.stringify({ app: 'sigaa-plus', versao: 2, matricula: mat, cfg: S.cfg, pessoal: S.pessoal, hist: await store.get('hist:' + mat) }, null, 1), 'application/json');
          break;
        }
        case 'diag-notas': {
          const diag = { versao: S.versao, periodo: d.periodo, gerado: new Date().toISOString(), turmas: d.turmas.map(t => ({
            nome: t.nome, codigo: t.codigo, erro: t.avalErro || null, infos: t.aval ? t.aval.infos : null,
            colunas: t.aval ? t.aval.colunas.map(x => ({ grupo: x.grupo, h: x.h, v: x.v, title: x.title })) : null,
            avals: t.aval ? t.aval.avals : null, relatorio: (t.unidades || []).map(u => [u.h, u.v]), resultado: t.resultado,
            plano: N.planoAvaliacao(t), })) };
          const txt = JSON.stringify(diag, null, 1);
          try { await navigator.clipboard.writeText(txt); toast('Diagnóstico copiado! Cole na conversa com o desenvolvedor.'); }
          catch { N.baixar('diagnostico-notas.json', txt, 'application/json'); toast('Diagnóstico baixado como arquivo.'); }
          break;
        }
        case 'limpar':
          if (!confirm('Apagar tarefas, anotações, favoritos, histórico de notas/faltas e o cache deste navegador?')) return;
          try { await chrome.storage.local.clear(); } catch { }
          S.pessoal = { anot: {}, tarefas: [], favs: [], sim: {} }; S.cfg = { ...N.CFG_PADRAO };
          toast('Dados apagados.'); atualizar(false); break;
        case 'pal-ir': executarOpcao(+el.dataset.i); break;
      }
    } catch (err) { console.error(err); toast('Erro: ' + err.message); }
  }

  /** Filtros da tela (agenda, semanas), criados sob demanda em S.pessoal.filtros. */
  function filtroTela(tela) {
    S.pessoal.filtros = S.pessoal.filtros || {};
    return (S.pessoal.filtros[tela] = { ocultos: [], turma: '', semFeitas: false, ...(S.pessoal.filtros[tela] || {}) });
  }
  /** Dispara uma ação data-a sem precisar de um botão na tela. */
  function acionar(a) { const b = document.createElement('button'); b.dataset.a = a; return onClick({ target: b, preventDefault() { } }); }

  function onInput(e) {
    const el = e.target, k = el.dataset.in;
    if (!k) return;
    if (k === 'q-func') { S.buscaFuncoes = el.value; $('#lista-func').innerHTML = T.listaFuncoes(S); }
    else if (k === 'q-notas') { S.filtroNotas = el.value; $('#lista-notas').innerHTML = T.listaNotas(S); }
    else if (k === 'anot') { S.pessoal.anot[el.dataset.k] = el.value; salvarPessoal(); }
    else if (k === 'pal') filtrarPaleta(el.value);
    else if (k === 'ini-bloco') {
      const o = new Set(S.pessoal.inicioOcultos || []); if (el.checked) o.delete(el.dataset.k); else o.add(el.dataset.k);
      S.pessoal.inicioOcultos = [...o]; salvarPessoal(); ir('inicio', true);
    }
    else if (k === 'f-turma' || k === 'f-feitas') {
      const f = filtroTela(el.dataset.tela);
      if (k === 'f-turma') f.turma = el.value; else f.semFeitas = el.checked;
      salvarPessoal(); ir(el.dataset.tela, true);
    }
  }

  async function onChange(e) {
    const el = e.target;
    if (el.dataset.in === 'feito') {
      const t = S.pessoal.tarefas.find(x => x.id === el.dataset.id); if (t) { t.feito = el.checked; salvarPessoal(); setTimeout(() => ir('agenda', true), 250); }
    } else if (el.dataset.in === 'importar' && el.files[0]) {
      try {
        const b = JSON.parse(await el.files[0].text());
        if (b.app !== 'sigaa-plus' && b.app !== 'sigaa-melhor') throw new Error('arquivo não é um backup do SIGAA+');
        if (b.cfg) S.cfg = { ...N.CFG_PADRAO, ...b.cfg };
        if (b.pessoal) S.pessoal = { anot: {}, tarefas: [], favs: [], sim: {}, ...b.pessoal };
        if (b.hist) await store.set('hist:' + (S.dados.perfil.matricula || b.matricula || 'anon'), b.hist);
        salvarCfg(); store.set(chaveP(), S.pessoal); await prepararModelo(false);
        $('.app').dataset.tema = S.cfg.tema; ir('ajustes', true); toast('Backup restaurado.');
      } catch (err) { toast('Não consegui restaurar: ' + err.message); }
    } else if (el.dataset.cfg) {
      const k = el.dataset.cfg;
      let v = el.type === 'checkbox' ? el.checked : el.value;
      if (k === 'mediaAprov' || k === 'unidadesPadrao') { v = N.num(v); if (v == null) return; }
      S.cfg[k] = v; salvarCfg();
      if (k === 'tema') $('.app').dataset.tema = v;
      if (k === 'inicio' || k === 'fim') { await prepararModelo(false); ir('ajustes', true); }
      toast('Ajuste salvo.');
    } else if (el.dataset.hora) {
      if (!/^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/.test(el.value.trim())) { toast('Use o formato HH:MM-HH:MM'); return; }
      S.cfg.horas = { ...(S.cfg.horas || N.HORAS_PADRAO), [el.dataset.hora]: el.value.trim() }; salvarCfg(); toast('Horário salvo.');
    }
  }

  function onKey(e) {
    const emCampo = /^(INPUT|TEXTAREA|SELECT)$/.test((e.composedPath()[0] || {}).tagName || '');
    if (palAberta()) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fecharPaleta(); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); moverSel(e.key === 'ArrowDown' ? 1 : -1); }
      else if (e.key === 'Enter') { e.preventDefault(); executarOpcao(palSel); }
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); abrirPaleta(); return; }
    if (e.key === 'Escape') { if (emCampo) { e.composedPath()[0].blur(); return; } fechar(); return; }
    if (emCampo || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === '/') { e.preventDefault(); abrirPaleta(); }
    else if (e.key === 'r' || e.key === 'R') atualizar(!!S.dados);
    else if (/^[1-9]$/.test(e.key)) { const v = T.VIEWS[+e.key - 1]; if (v) ir(v[0]); }
  }

  /* ---------------- paleta de comandos (Ctrl+K) ---------------- */
  let palOps = [], palSel = 0;
  const palAberta = () => !!$('.pal');
  function abrirPaleta() {
    if (!root || palAberta() || !S.dados) return;
    const d = document.createElement('div'); d.className = 'pal';
    d.innerHTML = `<div class="bx"><input data-in="pal" placeholder="Buscar telas, turmas, funções do SIGAA, ações…" autocomplete="off"><div class="ls"></div><div class="ft"><span><kbd>↑</kbd><kbd>↓</kbd> navegar</span><span><kbd>Enter</kbd> abrir</span><span><kbd>Esc</kbd> fechar</span></div></div>`;
    d.addEventListener('mousedown', e => { if (e.target === d) fecharPaleta(); });
    $('.app').appendChild(d);
    filtrarPaleta('');
    d.querySelector('input').focus();
  }
  function fecharPaleta() { const p = $('.pal'); if (p) { p.remove(); $('.app').focus(); } }
  function filtrarPaleta(q) {
    const nq = N.busca(q);
    const todas = [
      ...T.VIEWS.map(([k, l]) => ({ ic: k, label: 'Ir para ' + l, tag: 'tela', run: () => ir(k) })),
      ...S.dados.turmas.map((t, i) => ({ ic: 'turmas', label: N.titulo(t.nome), tag: t.codigo || 'turma', run: () => { ir('turmas'); setTimeout(() => { const c = $('#t' + i); c && c.scrollIntoView({ block: 'start' }); }, 30); } })),
      ...S.dados.turmas.map((t, i) => ({ ic: 'ext', label: 'Abrir turma virtual: ' + N.titulo(t.nome), tag: 'SIGAA', run: async () => { toast('Abrindo…'); await N.abrirTurmaNoSigaa(S.dados.turmas[i]); buscouNaRede = true; } })),
      { ic: 'refresh', label: 'Atualizar dados do SIGAA', tag: 'ação', run: () => atualizar(true) },
      { ic: 'lua', label: 'Alternar tema claro/escuro', tag: 'ação', run: () => acionar('tema') },
      { ic: 'down', label: 'Exportar aulas para Google Agenda (.ics)', tag: 'ação', run: () => acionar('ics-aulas') },
      { ic: 'down', label: 'Exportar aulas práticas (.ics)', tag: 'ação', run: () => acionar('ics-datas') },
      { ic: 'down', label: 'Exportar agenda/provas (.ics)', tag: 'ação', run: () => acionar('ics-agenda') },
      { ic: 'down', label: 'Exportar notas (CSV)', tag: 'ação', run: () => acionar('csv') },
      { ic: 'down', label: 'Baixar backup dos meus dados', tag: 'ação', run: () => acionar('backup') },
      { ic: 'mais', label: 'Nova tarefa', tag: 'ação', run: () => { ir('agenda'); setTimeout(() => { const i = $('#nt-txt'); i && i.focus(); }, 0); } },
      ...S.dados.menu.map(m => ({ ic: 'funcoes', label: m.label, tag: 'função SIGAA', run: async () => { toast('Abrindo no SIGAA…'); await N.abrirMenuNoSigaa(m.act); buscouNaRede = true; } })),
    ];
    palOps = (nq ? todas.filter(o => N.busca(o.label + ' ' + o.tag).includes(nq)) : todas.slice(0, T.VIEWS.length + S.dados.turmas.length + 5)).slice(0, 60);
    palSel = 0;
    const ls = $('.pal .ls');
    ls.innerHTML = palOps.length ? palOps.map((o, i) => `<button class="op ${i === 0 ? 'sel' : ''}" data-a="pal-ir" data-i="${i}">${T.ic(o.ic)}<span>${esc(o.label)}</span><small>${esc(o.tag)}</small></button>`).join('') : '<p class="empty" style="padding:12px">Nada encontrado.</p>';
  }
  function moverSel(dlt) {
    if (!palOps.length) return;
    palSel = (palSel + dlt + palOps.length) % palOps.length;
    root.querySelectorAll('.pal .op').forEach((b, i) => { b.classList.toggle('sel', i === palSel); if (i === palSel) b.scrollIntoView({ block: 'nearest' }); });
  }
  async function executarOpcao(i) {
    const o = palOps[i]; if (!o) return;
    fecharPaleta();
    try { await o.run(); } catch (err) { toast('Erro: ' + err.message); }
  }

  /* ---------------- início ---------------- */
  (async () => {
    const cfg = await store.get('cfg');
    if (cfg) {
      const horas = { ...N.HORAS_PADRAO, ...(cfg.horas || {}) };
      // migração: troca os horários genéricos antigos pelos da UNIFEI (mantém o que a pessoa editou)
      if (!cfg.horasVer || cfg.horasVer < 2) for (const k of Object.keys(horas)) if (horas[k] === N.HORAS_ANTIGAS[k]) horas[k] = N.HORAS_PADRAO[k];
      S.cfg = { ...N.CFG_PADRAO, ...cfg, horas, horasVer: 2 };
      if (!cfg.horasVer) salvarCfg();
    }
    botaoFlutuante();
    checarUpd(false);
    // badge com novidades da última semana (a partir do cache)
    const c = await store.get('ultimo');
    if (c && c.dados) {
      const h = await store.get('hist:' + (c.dados.perfil.matricula || 'anon'));
      if (h) { const lim = N.isoDia(new Date(N.hoje() - 3 * N.DIA_MS)); badge(Object.values(h.notas || {}).concat(Object.values(h.faltas || {}).filter(x => x.f)).filter(x => x.visto && x.visto >= lim).length); }
    }
    if (S.cfg.autoAbrir && /portais\/discente\/discente\.jsf/i.test(location.pathname) && !sessionStorage.getItem('sm-auto')) {
      sessionStorage.setItem('sm-auto', '1'); abrir();
    }
  })();
})();
