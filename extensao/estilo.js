/* SIGAA+ — estilos do painel (dentro de Shadow DOM, não afeta o SIGAA). */
var SMCSS = `
:host{all:initial}
.app{
 --bg:#f4f6fb;--bg2:#eceff6;--card:#fff;--tx:#161b26;--mut:#4f5a6e;--fade:#677186;--bd:#e2e6ef;--bd2:#d3d9e5;
 --ac:#2457d6;--ac2:#4f7cff;--acs:#e9eefc;--act:#fff;
 --ok:#16803f;--okb:#e2f4e8;--bad:#c4372f;--badb:#fce8e6;--warn:#9a6200;--warnb:#fcf0d7;--inf:#2457d6;--infb:#e9eefc;--nr:#c9cfda;
 --sh:0 1px 2px rgba(16,24,40,.05),0 1px 3px rgba(16,24,40,.06);--shl:0 12px 40px rgba(16,24,40,.18);
 --r:14px;
 position:absolute;inset:0;display:grid;grid-template-columns:232px 1fr;background:var(--bg);color:var(--tx);
 font:15.5px/1.6 "Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased;
}
.app[data-tema=escuro]{
 --bg:#0e1117;--bg2:#151a23;--card:#171c26;--tx:#e7eaf0;--mut:#aab4c5;--fade:#8f9aad;--bd:#252c39;--bd2:#313a4a;
 --ac:#7ea2ff;--ac2:#7ea2ff;--acs:#1c2742;--act:#0e1117;
 --ok:#5ccf8c;--okb:#14301f;--bad:#ff8b80;--badb:#3a1c1a;--warn:#f0c264;--warnb:#382c12;--inf:#8fb0ff;--infb:#1c2742;--nr:#3a4252;
 --sh:0 1px 2px rgba(0,0,0,.3);--shl:0 12px 40px rgba(0,0,0,.55);
}
@media (prefers-color-scheme:dark){.app[data-tema=auto]{
 --bg:#0e1117;--bg2:#151a23;--card:#171c26;--tx:#e7eaf0;--mut:#aab4c5;--fade:#8f9aad;--bd:#252c39;--bd2:#313a4a;
 --ac:#7ea2ff;--ac2:#7ea2ff;--acs:#1c2742;--act:#0e1117;
 --ok:#5ccf8c;--okb:#14301f;--bad:#ff8b80;--badb:#3a1c1a;--warn:#f0c264;--warnb:#382c12;--inf:#8fb0ff;--infb:#1c2742;--nr:#3a4252;
 --sh:0 1px 2px rgba(0,0,0,.3);--shl:0 12px 40px rgba(0,0,0,.55);
}}
*{box-sizing:border-box}
svg.i{width:18px;height:18px;flex:none;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
button{font:inherit;cursor:pointer;color:inherit}
a{color:var(--ac)}
:focus-visible{outline:2px solid var(--ac);outline-offset:2px}

/* barra lateral */
aside{background:var(--card);border-right:1px solid var(--bd);display:flex;flex-direction:column;padding:14px 10px;gap:2px;overflow:auto}
.logo{display:flex;align-items:center;gap:10px;padding:4px 10px 14px;font-weight:700;font-size:15.5px;letter-spacing:-.01em}
.logo .m{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#2457d6,#8a5cf6);color:#fff;display:grid;place-items:center;font-size:15px}
.logo small{display:block;font-weight:500;color:var(--mut);font-size:11.5px;letter-spacing:0}
aside .nv{display:flex;align-items:center;gap:11px;width:100%;border:0;background:none;color:var(--mut);padding:8px 11px;border-radius:9px;text-align:left;font-weight:500;position:relative}
aside .nv:hover{background:var(--bg);color:var(--tx)}
aside .nv.on{background:var(--acs);color:var(--ac);font-weight:600}
aside .nv kbd{margin-left:auto;opacity:0;transition:opacity .15s}aside .nv:hover kbd{opacity:1}
aside .sec{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--fade);padding:14px 11px 4px}
aside .nv .bdg{margin-left:auto;background:#ff5a36;color:#fff;font-size:11px;font-weight:700;border-radius:99px;padding:0 6px;line-height:18px}
aside .sep{height:1px;background:var(--bd);margin:8px 6px}
aside .foot{margin-top:auto;padding:12px 11px 2px;font-size:11.5px;color:var(--fade);text-decoration:none}aside .foot:hover{color:var(--ac)}
kbd{font:600 10.5px ui-monospace,monospace;color:var(--fade);border:1px solid var(--bd2);border-bottom-width:2px;border-radius:5px;padding:0 5px;background:var(--bg)}

/* área principal */
.main{display:flex;flex-direction:column;min-width:0;min-height:0}
.top{display:flex;align-items:center;gap:8px;padding:10px 22px;background:color-mix(in srgb,var(--bg) 85%,transparent);backdrop-filter:blur(8px);border-bottom:1px solid var(--bd);position:relative;z-index:3}
.top h1{font-size:17px;margin:0;font-weight:700;letter-spacing:-.01em;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.srch{display:flex;align-items:center;gap:8px;border:1px solid var(--bd);background:var(--card);color:var(--fade);border-radius:10px;padding:6px 10px;min-width:220px}
.srch:hover{border-color:var(--bd2);color:var(--mut)}
.srch span{flex:1;text-align:left}
.ib{border:1px solid transparent;background:none;color:var(--mut);border-radius:9px;padding:7px;display:inline-flex;align-items:center;gap:6px}
.ib:hover{background:var(--card);border-color:var(--bd);color:var(--tx)}
.ib.spin svg{animation:gira 1s linear infinite}
@keyframes gira{to{transform:rotate(360deg)}}
.sync{font-size:12px;color:var(--fade);white-space:nowrap}
.pbar{position:absolute;left:0;bottom:-1px;height:2px;background:var(--ac);transition:width .4s,opacity .4s}
.updbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 22px;background:var(--okb);color:var(--ok);border-bottom:1px solid var(--bd);font-size:13.5px}
.updbar span{flex:1;min-width:180px}.updbar b{color:inherit}
.scroll{flex:1;overflow:auto;scroll-behavior:smooth}
main{max-width:1180px;margin:0 auto;padding:22px 22px 80px;animation:entra .18s ease-out}
@keyframes entra{from{opacity:0;transform:translateY(4px)}}

/* blocos */
.card{background:var(--card);border:1px solid var(--bd);border-radius:var(--r);padding:16px 18px;margin-bottom:14px;box-shadow:var(--sh)}
.card h3{margin:0 0 12px;font-size:16px;font-weight:650;display:flex;align-items:center;gap:8px}
.card h3 .r{margin-left:auto;font-weight:500}
h2{margin:0 0 6px;font-size:24px;letter-spacing:-.02em}
.sub{color:var(--mut);margin:0 0 18px}
.cols{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));align-items:start}
.cols3{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));align-items:start}
.grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));margin-bottom:16px}
.stat{background:var(--card);border:1px solid var(--bd);border-radius:var(--r);padding:12px 15px;box-shadow:var(--sh)}
.stat .v{font-size:24px;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.stat .k{color:var(--mut);font-size:13px;line-height:1.3}
.hero{background:linear-gradient(120deg,#2457d6,#6a4fe0 60%,#9a4fd0);color:#fff;border-radius:16px;padding:16px 22px;margin-bottom:16px;position:relative;overflow:hidden}
.hero h2{color:#fff;font-size:22px}
.hero p{margin:2px 0 0;opacity:.88}
.hero .pills{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}
.hero .pill{background:rgba(255,255,255,.17);border-radius:99px;padding:3px 11px;font-size:12.5px;font-weight:500}
.hero:after{content:"";position:absolute;right:-60px;top:-60px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,.08)}
.muted{color:var(--mut)}.fade{color:var(--fade)}.small{font-size:13.5px;line-height:1.55}.b{font-weight:650}
.row{display:flex;gap:11px;align-items:flex-start;padding:10px 0;border-top:1px solid var(--bd)}
.row:first-of-type{border-top:0}
.row .grow{flex:1;min-width:0}
.dot{width:10px;height:10px;border-radius:50%;margin-top:6px;flex:none}
.chip{display:inline-flex;align-items:center;gap:4px;font-size:12.5px;font-weight:550;padding:1px 8px;border-radius:999px;background:var(--acs);color:var(--ac);margin:3px 4px 0 0;white-space:nowrap}
.chip.bad{background:var(--badb);color:var(--bad)}.chip.ok{background:var(--okb);color:var(--ok)}.chip.warn{background:var(--warnb);color:var(--warn)}.chip.gray{background:var(--bg2);color:var(--mut)}
.chip.new{background:#d63c1c;color:#fff;font-weight:700}
.alert{display:flex;gap:10px;align-items:flex-start;border-radius:12px;padding:10px 14px;margin-bottom:10px;font-size:13.5px;border:1px solid}
.alert.bad{background:var(--badb);color:var(--bad);border-color:color-mix(in srgb,var(--bad) 25%,transparent)}
.alert.warn{background:var(--warnb);color:var(--warn);border-color:color-mix(in srgb,var(--warn) 25%,transparent)}
.alert.inf{background:var(--infb);color:var(--inf);border-color:color-mix(in srgb,var(--inf) 25%,transparent)}
.alert b{color:inherit}
.tw{overflow-x:auto}
table{border-collapse:collapse;width:100%;font-size:14px}
th,td{padding:8px 9px;border-bottom:1px solid var(--bd);text-align:left;vertical-align:top}
th{color:var(--mut);font-weight:600;font-size:13px;white-space:nowrap;position:sticky;top:0;background:var(--card)}
tr:hover td{background:color-mix(in srgb,var(--acs) 45%,transparent)}
td.n{text-align:center;white-space:nowrap;font-variant-numeric:tabular-nums}
.sit{font-size:11.5px;font-weight:600;padding:2px 8px;border-radius:999px;white-space:nowrap}
.s-ok{background:var(--okb);color:var(--ok)}.s-bad{background:var(--badb);color:var(--bad)}.s-inf{background:var(--infb);color:var(--inf)}.s-warn{background:var(--warnb);color:var(--warn)}
.bar{height:8px;border-radius:99px;background:var(--bg2);overflow:hidden;margin:8px 0 5px}
.bar i{display:block;height:100%;border-radius:99px;transition:width .5s}
.dias{display:flex;flex-wrap:wrap;gap:3px;margin-top:10px}
.dia{width:16px;height:16px;border-radius:4px;background:var(--okb);border:1px solid var(--ok);font-size:9.5px;line-height:14px;text-align:center;color:#fff;font-weight:700}
.dia.f{background:var(--bad);border-color:var(--bad)}.dia.nr{background:transparent;border:1px dashed var(--nr)}
details>summary{list-style:none;cursor:pointer}details>summary::-webkit-details-marker{display:none}
.sem{display:flex;justify-content:space-between;align-items:center;gap:8px}
.sem h3{margin:0}
details[open] .arr{transform:rotate(90deg)}.arr{display:inline-block;transition:.15s;color:var(--fade)}
.wk{border-left:3px solid var(--bd);padding:2px 0 2px 16px;margin-bottom:18px}
.wk.cur{border-left-color:var(--ac)}
.wk h3{margin:0 0 6px;font-size:14.5px}
.wk .it{padding:3px 0;font-size:13.5px}
.btn{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--bd);background:var(--card);color:var(--tx);padding:7px 13px;border-radius:10px;font-weight:550;font-size:13px;white-space:nowrap}
.btn:hover{border-color:var(--bd2);background:var(--bg)}
.btn.pri{background:var(--ac);border-color:var(--ac);color:var(--act)}
.btn.pri:hover{filter:brightness(1.08)}
.btn.sm{padding:6px 12px;font-size:13px;min-height:32px}
.btn.dng{color:var(--bad)}
.acts{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
input,select,textarea{font:inherit;color:var(--tx);background:var(--card);border:1px solid var(--bd2);border-radius:10px;padding:8px 11px}
input:focus,select:focus,textarea:focus{outline:2px solid color-mix(in srgb,var(--ac) 45%,transparent);border-color:var(--ac)}
input[type=search]{width:100%}
textarea{width:100%;min-height:70px;resize:vertical;font-size:13.5px}
input.nt{width:64px;text-align:center;padding:6px 4px;font-variant-numeric:tabular-nums}
input.nt.lan{background:var(--bg2);font-weight:650}
label.f{display:flex;flex-direction:column;gap:4px;font-size:12.5px;color:var(--mut);font-weight:550}
.mi{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:none;border:0;border-top:1px solid var(--bd);padding:9px 6px;border-radius:0}
.mi:first-child{border-top:0}
.mi:hover{background:var(--acs)}
.mi .lb{flex:1}.mi small{color:var(--fade);font-size:11.5px}
.star{border:0;background:none;color:var(--fade);font-size:18px;padding:6px;line-height:1;min-width:32px}
.star.on{color:#e6a700}
.load{padding:70px 0;text-align:center;color:var(--mut)}
.pg{height:6px;max-width:380px;margin:16px auto;border-radius:99px;background:var(--bd);overflow:hidden}.pg i{display:block;height:100%;background:linear-gradient(90deg,var(--ac),#8a5cf6);transition:width .35s}
.sk{background:linear-gradient(90deg,var(--bg2),var(--bd),var(--bg2));background-size:200% 100%;animation:sk 1.2s infinite;border-radius:10px}
@keyframes sk{to{background-position:-200% 0}}
.err{color:var(--bad)}
.empty{color:var(--mut);font-size:13px;margin:0;padding:6px 0}

/* horário */
.sched{display:grid;gap:3px;font-size:12px;min-width:620px}
.sched .h{color:var(--mut);font-weight:650;text-align:center;padding:6px 4px;border-radius:8px}
.sched .h.hj{background:var(--acs);color:var(--ac)}
.sched .slot{color:var(--fade);font-weight:600;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:11px;line-height:1.2}
.sched .slot b{color:var(--mut);font-size:12px}
.sched .c{min-height:44px;border-radius:8px;background:var(--bg);padding:5px 7px;overflow:hidden}
.sched .c.f{color:#fff;font-weight:600;line-height:1.25;box-shadow:inset 0 0 0 1px rgba(0,0,0,.06)}
.sched .c.agora{outline:2px solid var(--tx);outline-offset:1px}
.tl{display:flex;gap:12px;align-items:stretch;padding:8px 0}
.tl .hr{width:84px;flex:none;font-variant-numeric:tabular-nums;font-size:13px;color:var(--mut)}
.tl .hr b{color:var(--tx);display:block;font-size:14px}
.tl .bx{flex:1;border-left:4px solid;border-radius:6px;background:var(--bg);padding:7px 12px}
.tl.agora .bx{background:var(--acs)}
.tl.passou{opacity:.55}

table.mini{font-size:12.5px;margin-top:4px}table.mini td,table.mini th{padding:4px 6px}table.mini th{position:static}
.aval summary{display:flex;gap:6px;align-items:center}
.dnd{position:relative}
.dnd>h3{padding-right:24px}
.dnd:focus-within>.grip,.task:focus-within .del{opacity:1}
@media (hover:none){.task .del{opacity:.7}}
.grip{position:absolute;top:8px;right:8px;border:0;background:none;color:var(--fade);cursor:grab;font-size:15px;line-height:1;padding:3px 4px;border-radius:6px;opacity:0;transition:opacity .15s;touch-action:none}
@media (hover:none){.grip{opacity:.5}}
.dnd:hover>.grip{opacity:1}.grip:hover{background:var(--bg2)}
.grip:active{cursor:grabbing}
.arr-on{opacity:.45;outline:2px dashed var(--ac);outline-offset:2px}
[data-ordem]{min-height:40px}
.gcal{text-decoration:none}
/* simulador */
.sim .uns{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;margin:6px 0 10px}
.sim .uns label{font-size:11.5px;color:var(--mut);display:flex;flex-direction:column;gap:3px;align-items:center}
.res{border-radius:10px;padding:9px 12px;font-size:13.5px}
.res.ok{background:var(--okb);color:var(--ok)}.res.bad{background:var(--badb);color:var(--bad)}.res.warn{background:var(--warnb);color:var(--warn)}.res.inf{background:var(--infb);color:var(--inf)}
.big{font-size:20px;font-weight:750;font-variant-numeric:tabular-nums}

/* gráfico */
.chart svg{width:100%;height:auto;display:block;overflow:visible}
.chart .gl{stroke:var(--bd);stroke-width:1}
.chart .ax{fill:var(--fade);font-size:11px}
.chart .ln{fill:none;stroke:var(--ac);stroke-width:2}
.chart .ar{fill:var(--ac);opacity:.08}
.chart .pt{fill:var(--ac);stroke:var(--card);stroke-width:2}
.chart .hit{fill:transparent;cursor:default}
.chart .hit:hover+.pt{r:6}
.chart .ref{stroke:var(--warn);stroke-dasharray:4 4;stroke-width:1.3}
.chart .lb{fill:var(--tx);font-size:11.5px;font-weight:650}
.hb{display:flex;align-items:center;gap:8px;font-size:12.5px;margin:5px 0}
.hb .nm{width:64px;color:var(--mut);flex:none;font-variant-numeric:tabular-nums}
.hb .tr{flex:1;display:flex;gap:2px;height:14px}
.hb .tr i{display:block;height:100%;border-radius:3px}
.leg{display:flex;gap:14px;font-size:12px;color:var(--mut);margin-top:8px;flex-wrap:wrap}
.leg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}

/* turmas */
.tc .kpis{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}
.kpi{background:var(--bg);border-radius:12px;padding:8px 12px;display:flex;flex-direction:column;line-height:1.25}
.kpi .k{font-size:12.5px;color:var(--mut);font-weight:600}
.kpi .v{font-size:26px;font-weight:750;letter-spacing:-.02em;font-variant-numeric:tabular-nums;margin:2px 0}
.kpi .v small{font-size:15px;color:var(--fade);font-weight:600}
.kpi .s{font-size:13px;font-weight:600;color:var(--mut)}
.kpi .s.ok{color:var(--ok)}.kpi .s.warn{color:var(--warn)}.kpi .s.bad{color:var(--bad)}
.tc .small svg.i{width:15px;height:15px;vertical-align:-3px;color:var(--fade)}
details.mais{margin-top:12px;border-top:1px solid var(--bd);padding-top:10px}
details.mais>summary{color:var(--ac)}
.sec-t{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--fade);margin:14px 0 6px}
/* faltas */
.flist{padding:4px 6px}
.frow{border-top:1px solid var(--bd)}.frow:first-child{border-top:0}
.frow>summary{display:grid;grid-template-columns:12px minmax(0,1fr) minmax(80px,180px) 54px auto;gap:12px;align-items:center;padding:12px 10px;border-radius:10px}
.frow>summary:hover{background:var(--bg)}
.frow .fb,.frow .fb .bar{display:block}
.frow .fn{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.frow .fq{text-align:right;font-weight:700;font-variant-numeric:tabular-nums}
.frow .chip{margin:0;justify-self:end}
.fdet{padding:0 10px 14px 34px;display:flex;flex-direction:column;gap:4px}
@media (max-width:820px){.frow>summary{grid-template-columns:12px minmax(0,1fr) auto;row-gap:6px}.frow .fb{grid-column:2/4}.frow .fq{display:none}.fdet{padding-left:10px}}
.passadas{margin-top:12px;border-top:1px dashed var(--bd2);padding-top:8px}
.passadas>summary{list-style:none;color:var(--mut)}
.passadas .row,.passadas .task{opacity:.65}
/* notas (tabela estilo turma virtual) */
.stack{display:flex;flex-direction:column;gap:0}
.nt-h{display:flex;gap:14px;align-items:flex-start;justify-content:space-between;margin-bottom:12px}
.nt-m{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;text-align:right}
.nt-m b{font-size:26px;font-weight:750;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.nt-m .chip{margin:0}
table.tsig{width:auto;min-width:100%;border-collapse:separate;border-spacing:0;font-size:15px;border:1px solid var(--bd);border-radius:12px;overflow:hidden}
table.tsig th,table.tsig td{border-bottom:1px solid var(--bd);border-left:1px solid var(--bd);padding:8px 14px;text-align:center;vertical-align:middle;white-space:nowrap}
table.tsig tr>*:first-child{border-left:0}
table.tsig thead th{position:static;background:var(--bg);color:var(--mut);font-size:13px;font-weight:650}
table.tsig thead th.g{color:var(--tx);font-size:13.5px}
table.tsig thead tr:first-child th.g[colspan]{background:var(--bg2)}
table.tsig tbody td{border-bottom:0;font-variant-numeric:tabular-nums;font-weight:550;min-width:58px}
table.tsig .nu{font-weight:750;background:color-mix(in srgb,var(--acs) 55%,transparent)}
table.tsig thead .nu{color:var(--ac)}
table.tsig td.baixa{color:var(--bad)}
table.tsig tr:hover td{background:inherit}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
@media (max-width:820px){.nt-h{flex-direction:column}.nt-m{justify-content:flex-start}table.tsig th,table.tsig td{padding:7px 10px}}
.ini-top{display:flex;justify-content:flex-end;margin:-6px 0 8px}
.personalizar{border-color:var(--ac)}
.blocos{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:6px}
.bloco{display:flex;gap:8px;align-items:center;padding:8px 10px;border:1px solid var(--bd);border-radius:10px;cursor:pointer;font-size:14px}
.bloco:hover{background:var(--bg)}
.bloco input{width:17px;height:17px;accent-color:var(--ac)}
/* filtros */
.filtros{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 14px}
.filtros select{padding:5px 9px;font-size:13px}
.fchip{border:1px solid var(--bd2);background:var(--card);color:var(--fade);border-radius:99px;padding:4px 11px;font-size:12.5px;font-weight:550;text-decoration:line-through}
.fchip.on{background:var(--acs);border-color:transparent;color:var(--ac);text-decoration:none}
.fchip:hover{border-color:var(--ac)}
/* convite LinkedIn */
.convite{background:linear-gradient(135deg,color-mix(in srgb,#0a66c2 10%,var(--card)),var(--card));border-color:color-mix(in srgb,#0a66c2 35%,var(--bd))}
.btn.li{background:#0a66c2;border-color:#0a66c2;color:#fff;text-decoration:none}
.btn.li:hover{filter:brightness(1.1)}
aside .foot a{color:inherit;font-weight:600}aside .foot a:hover{color:#0a66c2}
/* calendário */
.calh{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}
.calg{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}
.dsem{font-size:11.5px;font-weight:650;color:var(--fade);text-align:center;padding:2px 0}
.cd{border:1px solid var(--bd);background:var(--card);border-radius:10px;min-height:86px;padding:4px 5px;text-align:left;display:flex;flex-direction:column;gap:2px;overflow:hidden;font-size:11px}
.cd:hover{border-color:var(--bd2);background:var(--bg)}
.cd .nd{font-size:12px;font-weight:650;color:var(--mut);width:22px;height:22px;display:grid;place-items:center;border-radius:50%;flex:none}
.cd.fora{opacity:.4}.cd.pass .ev{opacity:.6}
.cd.hj .nd{background:var(--ac);color:var(--act)}
.cd.sel{border-color:var(--ac);box-shadow:0 0 0 1px var(--ac)}
.ev{display:flex;align-items:center;gap:4px;border-radius:5px;padding:1px 4px;background:color-mix(in srgb,var(--c) 14%,transparent);color:var(--tx);white-space:nowrap;min-width:0}
.ev i{width:3px;align-self:stretch;border-radius:2px;background:var(--c);flex:none}
.ev span{overflow:hidden;text-overflow:ellipsis}
.ev.ok span{text-decoration:line-through;color:var(--fade)}
.cd .mais{font-size:10.5px;color:var(--fade);padding-left:4px}
.caldia{border-top:1px solid var(--bd);margin-top:12px;padding-top:10px}
@media (max-width:820px){.cd{min-height:52px;align-items:center}.ev span{display:none}.ev{width:8px;height:8px;padding:0;border-radius:50%;background:var(--c)}.ev i{display:none}.cd{flex-direction:row;flex-wrap:wrap;align-content:flex-start;justify-content:center}.cd .nd{width:100%;place-items:center}}
/* agenda */
.grp{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--fade);margin:16px 0 4px}
.grp:first-child{margin-top:0}
.task{display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-top:1px solid var(--bd)}
.task input[type=checkbox]{width:17px;height:17px;margin-top:2px;accent-color:var(--ac)}
.task.feito .tx{text-decoration:line-through;color:var(--fade)}
.task .del{border:0;background:none;color:var(--fade);opacity:0;padding:0 4px}
.task:hover .del{opacity:1}
.addf{display:grid;grid-template-columns:1fr 150px 190px auto;gap:8px}

/* paleta */
.pal{position:absolute;inset:0;background:rgba(10,14,22,.45);display:flex;justify-content:center;align-items:flex-start;padding-top:12vh;z-index:10;animation:fd .12s}
@keyframes fd{from{opacity:0}}
.pal .bx{width:min(620px,92vw);background:var(--card);border:1px solid var(--bd);border-radius:16px;box-shadow:var(--shl);overflow:hidden}
.pal input{width:100%;border:0;border-bottom:1px solid var(--bd);border-radius:0;padding:15px 18px;font-size:16px;background:none;outline:none}
.pal .ls{max-height:min(56vh,460px);overflow:auto;padding:6px}
.pal .op{display:flex;gap:10px;align-items:center;width:100%;border:0;background:none;text-align:left;padding:9px 12px;border-radius:9px}
.pal .op.sel{background:var(--acs);color:var(--ac)}
.pal .op small{margin-left:auto;color:var(--fade);font-size:11.5px}
.pal .ft{border-top:1px solid var(--bd);padding:7px 14px;font-size:11.5px;color:var(--fade);display:flex;gap:14px}
.toast{position:absolute;left:50%;bottom:24px;transform:translateX(-50%);background:var(--tx);color:var(--bg);padding:10px 16px;border-radius:12px;font-size:13.5px;box-shadow:var(--shl);z-index:20;animation:sobe .2s}
@keyframes sobe{from{opacity:0;transform:translate(-50%,8px)}}

@media (max-width:820px){
 .app{grid-template-columns:1fr;grid-template-rows:1fr auto}
 aside{grid-row:2;flex-direction:row;border-right:0;border-top:1px solid var(--bd);padding:6px;overflow-x:auto}
 aside .logo,aside .sep,aside .sec,aside .foot,aside .nv kbd{display:none}
 aside .nv{flex-direction:column;gap:2px;font-size:10.5px;padding:6px 9px;width:auto;min-width:62px;align-items:center}
 aside .nv .bdg{position:absolute;top:2px;right:6px}
 .srch{min-width:0}.srch span,.srch kbd,.sync{display:none}
 main{padding:16px 14px 40px}
 .addf{grid-template-columns:1fr}
 .top{padding:8px 12px}
}
`;
if (typeof module !== 'undefined') module.exports = SMCSS;
