# Plano seguro para desativar o Blogger

Só comece depois de cumprir **todos** os itens da lista.

## Antes (checklist)
- [ ] O site está no ar no GitHub Pages e a aba *Actions* está verde.
- [ ] `npm run check` e `npm run build` passam sem erros (ou a publicação do GitHub passou).
- [ ] Você abriu o site e leu pelo menos três textos inteiros, incluindo "Maria, Maria." (tem imagem) e um dos longos ("A geografia do encolhimento").
- [ ] As imagens foram baixadas (`npm run importar -- --baixar-imagens`), estão em `public/images/`, aparecem no site e foram enviadas ao GitHub. **Apagar o blog apaga as imagens hospedadas nele.**
- [ ] `npm run verificar-migracao` passou (7 de 7).
- [ ] Você decidiu o que fazer com os 8 rascunhos e a página (ficam guardados em `conteudo-nao-publicado/`).
- [ ] Você guardou uma segunda cópia do repositório (por exemplo, baixando o ZIP do GitHub) e o arquivo de backup do Blogger em outro lugar (nuvem, pendrive).

## Passo a passo, do mais reversível ao definitivo
1. **Avisar os leitores (opcional, recomendado).** No Blogger, publique um último texto ou edite a descrição do blog com o endereço novo. Deixe assim por algumas semanas: é a única forma de quem tem o link antigo descobrir o novo, já que o Blogger não permite redirecionar para fora.
2. **Fazer um novo backup.** Blogger → *Configurações* → *Gerenciar blog* → *Fazer backup do conteúdo* → *Salvar no computador*. Guarde junto do anterior.
3. **Esconder o blog (reversível).** Em *Configurações*, na parte de permissões / acesso de leitores, torne o blog privado. Se algo faltar no site novo, é só reverter.
4. **Esperar** um período de tranquilidade (sugestão: 30 dias) e conferir que ninguém, inclusive você, sentiu falta de nada.
5. **Excluir o blog (definitivo).** Em *Configurações → Gerenciar blog*, use a opção de excluir. Confira na própria tela, antes de confirmar, se o Blogger permite restaurar blogs excluídos e por quanto tempo; essa regra pode mudar e eu não a verifiquei.

## Depois
- Se quiser guardar o nome `ogritodemeser.blogspot.com` ocupado, não exclua o blog: deixe-o privado (passo 3).
- Atualize os endereços do blog em redes sociais e perfis.
