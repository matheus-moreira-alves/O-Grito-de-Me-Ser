# Relatório de migração e testes — O Grito de Me Ser

Gerado em 23/10/2026, a partir de `backup/blogger/feed.atom` (exportação oficial do Blogger).

## Inventário
| | Quantidade |
|---|---|
| Entradas na exportação | 33 |
| Textos publicados (POST / LIVE) → `src/content/escritos/` | 24 |
| Rascunhos (POST / DRAFT) → `conteudo-nao-publicado/` | 8 |
| Páginas (PAGE) → `conteudo-nao-publicado/` | 1 |
| Comentários na exportação | 0 |

O marcador "Todos os gritos intimistas" tem 21 textos publicados no feed, o mesmo número exibido no blog. Os outros 3 publicados (Maria, Maria.; Irmana, acontecer-te-ias.; AÇUDE.) não têm marcador.
Lista completa, com id, data e arquivo de cada entrada: `migracao/inventario.json`.

## Testes executados (automáticos: `npm run verificar-migracao`) — 7 de 7 passaram
1. Número de arquivos importados = número de entradas do feed (24 + 9 = 33).
2. Nenhum rascunho ou página está na pasta publicada; todos os rascunhos têm `draft: true`.
3. Título, data de publicação (precisão de segundos) e marcadores iguais aos do feed, nas 33 entradas.
4. **Texto visível idêntico ao do feed original, nas 33 entradas** (palavras, pontuação, ordem e quebras). Verificado também que o teste detecta uma letra trocada.
5. Slugs únicos, sem HTML de estilo (`style`, `span`, `div`, `data-*`) e com tags balanceadas.
6. URL antiga gravada em `originalUrl` e presente em `migracao/mapa-urls.json` para os 24 textos.
7. Imagens: verifica que as baixadas existem em `public/images/` (ver pendência abaixo).
Conferência manual adicional: frases de "AÇUDE." copiadas da página ao vivo do Blogger estão presentes no arquivo importado.

## O que NÃO foi verificado (pendente, precisa de internet / do seu GitHub)
- **Construção do site (`astro build`) e verificação de tipos (`astro check`)**: o ambiente em que o projeto foi escrito não tem acesso à internet e não pôde instalar o Astro. O código das páginas **ainda não foi compilado**; pode haver erros a corrigir na primeira execução. É a prova que falta antes de tudo.
- Página inicial, arquivo, marcadores, busca, links internos com endereço-base `/REPOSITORIO/`, layout em celular/tablet/computador: dependem do build.
- Publicação automática pelo GitHub Actions e endereço público: dependem do envio ao GitHub.
- **Imagens**: 4 imagens (1 em texto publicado: "Maria, Maria."; 3 em rascunhos/página) ainda apontam para o servidor do Blogger. Rode `npm run importar -- --baixar-imagens` com internet antes de desativar o blog.
- Rascunhos sem título (4) e a página "Para acompanhar quaisquer das escritas…" foram preservados, mas não revisados; decida o que fazer com eles.

## Pontos de atenção encontrados na exportação
- Dois textos têm data de publicação diferente do mês do endereço antigo ("Libertemo-nos, finalmente.": publicado em 27/01/2024, endereço `/2024/10/`; "Eu sei que eu me salvo.": 14/08/2022, endereço `/2022/05/`). Mantive os dois valores como estavam: a data no campo `date`, o endereço em `originalUrl`.
- Precisão das datas: o Blogger guarda milissegundos; os arquivos guardam até o segundo, no fuso do blog (America/Fortaleza, -03:00).
- O rascunho "Solidão imaginária." e "Minhas considerações sobre 'O Quinze'." têm endereço registrado no Blogger, mas estão com status de rascunho na exportação; seguem não publicados.
