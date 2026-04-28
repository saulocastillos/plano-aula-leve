# TODOs

## Atualizacoes automaticas

- Deixar a implementacao de auto-update em espera por enquanto.
- Quando retomar, seguir com interface propria no app (modal React via IPC), nao com `dialog` nativo.
- Stack do app permite usar `electron-updater` com `electron-builder`.
- No Windows, o alvo atual `NSIS` e compativel com auto-update.
- No macOS, para auto-update de producao, o app precisa ser assinado.
- No Windows, e possivel atualizar sem assinatura, mas com pior experiencia de confianca/alertas.

## Opcoes de distribuicao avaliadas

- `GitHub Releases`: opcao mais simples para uma V1.
- `Vercel Blob`: opcao valida se quisermos manter a infra na Vercel.
- `Vercel Functions` sozinhas: nao sao boa opcao para servir binarios grandes de update.
- `Google Drive` publico: nao recomendado para producao nesse fluxo.

## Proximo passo quando retomarmos

- Definir onde os artefatos de release vao ficar hospedados.
- Se a escolha for GitHub, configurar `publish.provider = github`.
- Implementar fluxo de update com:
  - checagem de nova versao
  - prompt para baixar
  - progresso no app
  - prompt para reiniciar e instalar
