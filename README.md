# Véu de Cinzas

Um RPG original de cartas por turnos, ambientado em um mundo de fantasia sombria. O jogo tem menu inicial, tela “Sobre”, combate com cartas e três fases. A interface pode ser alternada entre português e inglês. O menu e a tela “Sobre” têm trilha própria; o combate conta com efeitos sonoros e uma trilha que se repete até a luta terminar.

## Tecnologias

- SvelteKit e Svelte para a interface
- TypeScript para as regras e interações do jogo
- CSS para os estilos

## Áudio do combate

- `menu.mp3` toca em loop no menu e na tela “Sobre”, nunca durante o combate.
- `fight.mp3` toca em loop durante a luta e para quando ela termina.
- `phase.mp3` toca quando uma fase é vencida.
- Os demais arquivos em `static/audio/` são efeitos das cartas: ataques, veneno, cura, bloqueio e compra de cartas.
- O controle de música no cabeçalho permite silenciar ou ajustar o volume sem alterar os efeitos das cartas.

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

- `src/routes/+layout.svelte`: estrutura compartilhada, navegação, idioma, estado e CSS base
- `src/routes/+page.svelte`: menu inicial (`/`) e seus estilos
- `src/routes/jogar/+layout.svelte`: estilos carregados somente na rota de combate
- `src/routes/sobre/+page.svelte`: informações sobre o jogo (`/sobre`)
- `src/routes/jogar/+page.svelte`: partida e combate (`/jogar`)
- `src/styles/base.css`: fundo, cabeçalho, tipografia e rodapé compartilhados
- `src/styles/menu.css`: tela inicial e ilustração da floresta
- `src/styles/jogo.css`: tabuleiro, inimigos, cartas e combate
- `src/styles/sobre.css`: estilos exclusivos da página “Sobre”
- `src/lib/app-state.svelte.ts`: estado compartilhado entre rotas
- `src/lib/game.ts`: baralho, combate, efeitos das cartas e progressão das fases
- `src/lib/sounds.ts`: reprodução de efeitos sonoros e trilhas de menu, combate e vitória
- `src/lib/i18n.ts`: textos da interface em português e inglês
- `static/audio/`: arquivos de áudio usados nas trilhas e nos efeitos sonoros

### Como as ilustrações são feitas

- A floresta do menu é desenhada com elementos HTML, gradientes e formas CSS (`clip-path`); não é um arquivo de imagem.
- Os inimigos também são montados com camadas CSS para o manto, a máscara, o brilho e os chifres ou galhos. As classes de cada fase mudam suas formas e cores.
- Os comentários em `src/styles/menu.css` e `src/styles/jogo.css` explicam essas partes junto ao código.

## Histórico de versões

### v0.7.0 — feedback de combate e áudio

- Adicionados indicadores visuais de dano, cura e bloqueio, com animações para as ações do combate.
- Integradas trilhas separadas para menu, luta e vitória, além de efeitos sonoros das cartas.
- Incluídos controles para silenciar e ajustar o volume da música.
- Separado o carregamento dos estilos para as rotas do menu e do combate.

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

A versão atual do projeto é **v0.7.0**; a anterior era **v0.6.2**. A versão do pacote em `package.json` e `package-lock.json` acompanha o histórico do projeto.
