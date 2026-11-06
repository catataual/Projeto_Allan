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

- `src/routes/+page.svelte`: telas e interface do jogo
- `src/routes/game.css`: estilos
- `src/lib/game.ts`: baralho, combate, efeitos das cartas e progressão das fases
- `src/lib/i18n.ts`: textos da interface em português e inglês

## Alterações recentes

- Adicionadas telas de início e “Sobre”, com navegação para o combate.
- Incluída troca de idioma entre português e inglês, inclusive durante uma partida.
- Expandido o jogo para três fases com inimigos e dificuldade crescentes.
- Adicionadas cartas de veneno, compra de cartas e dreno de vida.
- Organizados os estilos em arquivo CSS separado e removido código de template não utilizado.

## Versão

A versão declarada atualmente em `package.json` é `0.0.1`. Atualize-a junto com o `package-lock.json` quando preparar uma nova versão.
