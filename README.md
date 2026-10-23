# O Grito de Me Ser

Site estático (um único `index.html`, sem build). Os textos ficam no array `T`, dentro do `<script>`.

## Publicar no GitHub Pages
1. Crie um repositório no GitHub (ex.: `o-grito-de-me-ser`) e envie estes arquivos para a branch `main`.
2. No repositório: Settings → Pages → Source: "Deploy from a branch" → branch `main`, pasta `/ (root)` → Save.
3. Em alguns minutos o site abre em `https://SEU-USUARIO.github.io/o-grito-de-me-ser/`.

## Adicionar um texto
Inclua um objeto no início do array `T` em `index.html`:
`{s:'slug',t:'Título',d:'data por extenso',u:'url do blog original',x:'primeira frase',b:['parágrafo 1','parágrafo 2']}`
Sem o campo `b`, o texto aparece na home com link para o blog original.

## Pendente
Migrar na íntegra: AÇUDE., A geografia do encolhimento, Maria, Maria. Importar o restante do acervo via XML exportado do Blogger.
