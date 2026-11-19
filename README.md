# 📚 SIGAA+ (UNIFEI)

Extensão de navegador que transforma o SIGAA da UNIFEI num painel moderno, rápido e organizado — com notas por avaliação, simulador, faltas, horário, agenda e integração com o Google Agenda.

> Roda 100% no seu navegador, usando o login que você já fez no SIGAA. Não pede senha e não envia seus dados para nenhum servidor além do próprio SIGAA.

## ⬇️ Instalar

1. Baixe o **[sigaa-plus.zip da última versão](https://github.com/otaviozordan/sigaa-plus/releases/latest/download/sigaa-plus.zip)** e extraia numa pasta que você não vá apagar.
2. Abra `chrome://extensions` (Edge: `edge://extensions`) e ative o **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação** e escolha a pasta `extensao`.
4. Entre no SIGAA. O botão **📚 SIGAA+** aparece no canto inferior direito (atalho **Alt+S**).

Firefox: `about:debugging#/runtime/this-firefox` → *Carregar extensão temporária* → `extensao/manifest.json`.

## 🔄 Atualizar

A extensão avisa sozinha quando sai uma versão nova (faixa verde no painel e selo "atualizar" no botão). Para atualizar:

1. Baixe o .zip novo e extraia **por cima** da mesma pasta (substituir arquivos).
2. Em `chrome://extensions`, clique no **↻** do SIGAA+ e recarregue o SIGAA.

Suas tarefas, anotações e ajustes continuam salvos.

## ✨ O que tem

| Tela | O que faz |
|---|---|
| **Início** | aulas de hoje (destaca a de agora), próximas provas, alertas de falta/nota, novidades da semana, IRA e % do curso |
| **Turmas** | notas por avaliação e método do professor, faltas, anotações pessoais, abrir turma virtual, adicionar ao Google Agenda |
| **Agenda** | provas do SIGAA + aulas práticas + suas tarefas, com botão "Google Agenda" em cada item |
| **Horário** | grade com os horários da UNIFEI, aula atual em destaque, laboratórios por data, exportação `.ics` |
| **Faltas** | quanto ainda pode faltar (em aulas e em dias), % de presença, mapa aula por aula |
| **Notas** | todos os semestres, filtro, "novo" em notas recém-lançadas, exportar CSV |
| **Simulador** | quanto precisa tirar, usando os pesos de cada avaliação |
| **Desempenho** | gráfico da média por semestre, aprovações e melhores notas |
| **Funções do SIGAA** | busca em todo o menu do SIGAA, com favoritos |

Busca rápida com **Ctrl+K**, teclas **1–9** trocam de tela, **R** atualiza. Cartões podem ser reorganizados arrastando pela alça **⠿**.

## 🛠️ Para quem desenvolve

- Código em `extensao/` (Manifest V3, sem dependências nem build):
  `parsers.js` lê as páginas do SIGAA · `nucleo.js` busca e cálculos · `telas.js` as telas · `estilo.js` o visual · `content.js` o painel.
- **Publicar uma versão:** aumente `"version"` em `extensao/manifest.json` e rode `.\publicar.ps1 "o que mudou"` (commit, push, `.zip` e Release). Com o GitHub Actions ativo, basta o push na `main`. As extensões instaladas passam a mostrar o aviso de atualização.

## Autor

**Otávio Zordan Alves** — [LinkedIn](https://www.linkedin.com/in/otavio-zordan/)
