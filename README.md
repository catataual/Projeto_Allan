# Véu de Cinzas

Um RPG original de cartas por turnos, ambientado em um mundo de fantasia sombria. O jogo tem menu inicial, tela “Sobre”, combate com cartas e três fases. A interface pode ser alternada entre português e inglês.

## Tecnologias

- SvelteKit e Svelte para a interface
- TypeScript para as regras e interações do jogo
- CSS para os estilos

## Executar localmente

Requer Node.js e npm.

```sh
npm install
npm run dev
```

Para validar os tipos e os componentes Svelte:

```sh
npm run check
```

Para gerar e visualizar a versão de produção:

```sh
npm run build
npm run preview
```

## Estrutura

- `src/routes/+layout.svelte`: estrutura compartilhada, navegação, idioma e estado da sessão
- `src/routes/+page.svelte`: menu inicial (`/`)
- `src/routes/sobre/+page.svelte`: informações sobre o jogo (`/sobre`)
- `src/routes/jogar/+page.svelte`: partida e combate (`/jogar`)
- `src/styles/global.css`: estilos compartilhados das páginas
- `src/lib/app-state.svelte.ts`: estado compartilhado entre rotas
- `src/lib/game.ts`: baralho, combate, efeitos das cartas e progressão das fases
- `src/lib/i18n.ts`: textos da interface em português e inglês

## Histórico de versões

### v0.6.2 — organização e navegação

- Separadas as páginas do menu, “Sobre” e partida em rotas próprias.
- Adicionada uma estrutura compartilhada para navegação, idioma e estado da partida.
- Reorganizados os estilos compartilhados sem alterar o visual ou as regras do jogo.

### v0.6.1 — atualização visual e otimização

- Redesenhada a ilustração da tela inicial para mostrar com mais clareza a floresta, a lua e a trilha.
- Criadas silhuetas distintas para os inimigos das três fases: o Vigia, a Bruxa do Brejo e o Cervo de Cinzas.
- Consolidado o CSS, removendo regras duplicadas e estilos de elementos que já não eram usados.
- Mantidas as regras de combate e a interface responsiva.

### v0.6.0 — jogo e recursos principais

- Adicionadas telas de início e “Sobre”, com navegação para o combate.
- Incluída troca de idioma entre português e inglês, inclusive durante uma partida.
- Expandido o jogo para três fases com inimigos e dificuldade crescentes.
- Adicionadas cartas com efeitos de veneno, compra de cartas, dreno de vida, cura e bloqueio.
- Separados os estilos da interface em arquivo CSS próprio.

## Versão

A versão atual do projeto é **v0.6.2**; a anterior era **v0.6.1**. A versão do pacote em `package.json` e `package-lock.json` acompanha o histórico do projeto.
