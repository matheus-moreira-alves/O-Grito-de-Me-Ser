# O Grito de Me Ser

Site estático (Astro) do blog **O Grito de Me Ser**, publicado pelo GitHub Pages.
Os textos ficam neste repositório, um arquivo por texto, separados do código.
Não há banco de dados, servidor nem serviço pago.

## Onde está cada coisa

| Pasta / arquivo | O que é |
|---|---|
| `src/content/escritos/` | **Os textos.** Um arquivo `.md` por texto. É a única pasta que você precisa mexer para publicar. |
| `conteudo-nao-publicado/` | Rascunhos e página que vieram do Blogger. Ficam guardados, mas **nunca aparecem no site**. |
| `public/images/` | Imagens dos textos. |
| `backup/blogger/` | Cópia intacta da exportação do Blogger (`feed.atom`). Não apague. |
| `migracao/` | Inventário da migração (`inventario.json`), mapa de endereços antigos → novos (`mapa-urls.json`) e relatório de testes. |
| `scripts/import-blogger.mjs` | Importador do Blogger (já executado; pode ser reexecutado). |
| `src/` (o resto) e `astro.config.mjs` | Código do site. |
| `.github/workflows/deploy.yml` | Publicação automática. |

## Primeira publicação (uma vez só)

1. **Crie o repositório** em github.com → *New repository*. Anote o nome de usuário e o nome do repositório.
   Dica: se o repositório se chamar `SEUUSUARIO.github.io`, o endereço fica `https://SEUUSUARIO.github.io/`; com qualquer outro nome, fica `https://SEUUSUARIO.github.io/NOME/`. O site se ajusta sozinho aos dois casos.
2. **(No seu computador, recomendado)** instale o [Node.js](https://nodejs.org) 22 e, dentro desta pasta, rode:
   ```
   npm install
   npm run importar -- --baixar-imagens
   npm run verificar-migracao
   ```
   - `npm install` cria o arquivo `package-lock.json` (mantém as versões fixas; envie-o ao GitHub).
   - O segundo comando baixa as 4 imagens que ainda estão no servidor do Blogger para `public/images/`. **Faça isso antes de desativar o Blogger** — se o blog sumir, as imagens somem junto. Faça antes de editar qualquer texto, pois o comando recria os arquivos a partir do backup.
   - O terceiro confere se tudo foi preservado (veja `migracao/RELATORIO.md`).
3. **Envie a pasta ao GitHub** (use o terminal ou o GitHub Desktop; o envio pelo navegador costuma ignorar a pasta oculta `.github`, que é essencial):
   ```
   git init -b main
   git add .
   git commit -m "Primeira versão"
   git remote add origin https://github.com/SEUUSUARIO/NOMEDOREPOSITORIO.git
   git push -u origin main
   ```
4. **Ative a publicação:** no repositório, *Settings → Pages → Build and deployment → Source: GitHub Actions*.
5. Abra a aba **Actions**. Quando a execução "Publicar no GitHub Pages" ficar verde, o endereço do site aparece nela (e em *Settings → Pages*).
   Se a primeira execução tiver ocorrido antes do passo 4, clique em *Run workflow* nessa aba.

## Publicar um texto novo (sem programar)

### Método A — direto pelo site do GitHub
1. Abra o repositório e entre em `src/content/escritos/`.
2. Clique em **Add file → Create new file**.
3. Dê um nome em letras minúsculas, sem acento nem espaço, terminando em `.md`. Ex.: `meu-novo-texto.md`. Esse nome vira o endereço: `.../escritos/meu-novo-texto/`.
4. Cole o modelo abaixo e preencha. O texto vem **depois** da segunda linha de `---`:
   ```md
   ---
   title: "Título do texto"
   date: 2026-10-23
   tags: ["Todos os gritos intimistas"]
   ---

   Primeiro parágrafo.

   Segundo parágrafo.
   ```
5. Clique em **Commit changes**. Em cerca de um a dois minutos o GitHub constrói e publica o site (acompanhe na aba *Actions*).

### Método B — pelo computador
1. `git clone` do repositório (ou `git pull` se já tiver).
2. Crie o `.md` em `src/content/escritos/` e escreva.
3. Para ver antes de publicar: `npm install` (primeira vez) e `npm run dev`; abra o endereço que o terminal mostrar.
4. `git add .`, `git commit -m "Novo texto"`, `git push`. A publicação é automática.

### Regras dos textos
- Obrigatórios: `title` e `date`. Opcionais: `tags` (lista), `location` (ex.: `"Toulouse, França"`), `description` (resumo para buscadores), `updated`.
- `draft: true` esconde o texto do site (útil para rascunhos). Sem a linha, ele é publicado.
- Em Markdown, **linha em branco separa parágrafos**. Para quebrar linha dentro de um parágrafo (versos), termine a linha com uma barra invertida `\` ou com dois espaços.
- Aspas, reticências e travessões ficam **exatamente como você digitar** (o site não "embeleza" nada).
- Os textos importados do Blogger usam HTML dentro do `.md` para preservar a formatação original (ex.: `<br>`). Pode editá-los normalmente; só não apague as tags.
- Se um texto estiver com erro de formato (por exemplo, sem título), o GitHub Actions falha e **o site anterior continua no ar**; a mensagem de erro aparece na aba *Actions*.

### Imagens em textos novos
1. Em `public/images/`, crie uma pasta com o nome do texto: **Add file → Upload files** (no navegador, o limite é 25 MB por arquivo; reduza fotos grandes).
2. No texto, use: `![descrição da imagem](../../images/meu-novo-texto/foto.jpg)`.
   Os dois `../../` são necessários: fazem o caminho funcionar no endereço de projeto do GitHub Pages.

## Endereços antigos do Blogger e domínio próprio

- O Blogger **não permite** redirecionar `ogritodemeser.blogspot.com` para fora dele, e o GitHub Pages não tem redirecionamento de servidor. Portanto, quem abrir um link antigo do Blogger **não será levado automaticamente** ao novo site.
- O que existe: a URL antiga de cada texto está guardada em `originalUrl`, e `migracao/mapa-urls.json` liga cada endereço antigo ao novo. O site também gera páginas de aviso nos endereços antigos (`/2026/10/acude.html`), que passam a valer se um dia você usar um domínio próprio e o apontar para o novo site.
- Domínio próprio no futuro: *Settings → Pages → Custom domain*. O site se reajusta sozinho na próxima publicação (nada a mudar no código).
- Nota: o `robots.txt` só é lido por buscadores quando o site está na raiz de um domínio (repositório `USUARIO.github.io` ou domínio próprio).

## Desativar o Blogger (só no fim)

Veja `migracao/PLANO-DESATIVACAO-BLOGGER.md`.
