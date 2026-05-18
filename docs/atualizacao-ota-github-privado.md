# Atualização OTA no Windows com GitHub Privado (Primeiros Princípios)

Este guia parte do mecanismo real de atualização, não só de comandos.

## 1) Modelo mental: como o update funciona

O auto-update do Electron com `electron-updater` depende de 3 fatos:

1. O app instalado tem uma versão local (ex.: `0.1.0`).
2. Existe uma fonte remota com metadados da versão mais nova (ex.: `latest.yml`).
3. Se a versão remota for maior, o app baixa o instalador e troca binários no restart.

No seu caso:

- Fonte remota: GitHub Releases do repo privado `saulocastillos/plano-aula-leve`.
- Formato: release com `latest.yml` + instalador `.exe`.
- Cliente final: app Windows em produção (`app.isPackaged`).

## 2) Por que o `GH_TOKEN` é necessário no cliente

Sem token, um app rodando no computador do usuário não consegue ler assets de um repo privado.

Então o `GH_TOKEN` no Windows do usuário serve para:

- autenticar leitura da release,
- ler `latest.yml`,
- baixar o instalador da versão nova.

Se não houver `GH_TOKEN`, o update privado falha por autenticação.

## 2.1 Dica importante: provider privado do GitHub é exceção, não padrão

O aviso da documentação faz sentido por primeiros princípios:

- o cliente final precisa carregar uma credencial (`GH_TOKEN`),
- credencial em máquina cliente é superfície de risco operacional,
- qualquer problema de token (expiração, revogação, escopo) quebra update.

Por isso, `github private` é adequado como workaround em cenários pequenos (como 1 usuário), mas não escala bem para distribuição ampla.

Resumo prático:

- Hoje (seu cenário): pode usar `github private` com controle manual.
- Futuro (se crescer): migrar para `provider: "generic"` com URL própria de update e sem token no cliente.

## 3) Qual é a responsabilidade de cada lado

### Lado dev (publicador)

Você garante que exista uma release correta para cada versão:

- versão no `package.json` incrementada,
- release publicada,
- assets anexados (`latest.yml` e `.exe`).

### Lado usuário (consumidor)

O usuário só precisa:

- ter `GH_TOKEN` com leitura,
- abrir o app,
- aceitar os diálogos de baixar/reiniciar.

## 4) Setup único no Windows do usuário

### 4.1 Criar token de leitura no GitHub

Crie um Fine-grained PAT com acesso apenas ao repo de update.

Permissões mínimas:

- `Contents: Read`
- `Metadata: Read`

### 4.2 Gravar token no ambiente do usuário

No PowerShell da conta do usuário:

```powershell
[Environment]::SetEnvironmentVariable("GH_TOKEN","SEU_TOKEN_AQUI","User")
```

Depois fazer logoff/login (ou reiniciar) para novos processos herdarem a variável.

### 4.3 Validar

```powershell
[Environment]::GetEnvironmentVariable("GH_TOKEN","User")
```

Valor não vazio = setup ok.

## 5) Publicar uma nova versão (seu fluxo recorrente)

### 5.1 Incrementar versão

No `package.json`, atualizar `version` (ex.: `0.1.0` -> `0.1.1`), depois commit e push.

### 5.2 Definir token de publicação na sua máquina/CI

Token com permissão de escrita no repositório:

```bash
export GITHUB_RELEASE_TOKEN=SEU_TOKEN_COM_WRITE
```

### 5.3 Gerar build e publicar release

```bash
npm run dist -- --publish always
```

### 5.4 Verificação obrigatória

Em GitHub Releases, validar:

- release da versão nova existe,
- `latest.yml` anexado,
- instalador `.exe` anexado,
- release publicada (não deixada em draft, se for o caso).

Sem esses artefatos, o cliente não atualiza.

## 6) Critério de sucesso do ciclo

O ciclo está correto quando:

1. Usuário abre app na versão antiga.
2. App detecta versão remota maior.
3. Mostra diálogo de atualização.
4. Baixa update e pede restart.
5. Reabre já na versão nova.

## 7) Diagnóstico por sintoma

### Não aparece diálogo

- App não está empacotado (rodando dev).
- Não está em Windows.
- `GH_TOKEN` ausente no ambiente.

### Não encontra versão nova

- `version` não foi incrementada.
- release errada.
- `latest.yml` ausente ou inválido.

### Erro de acesso/permissão

- token sem escopo de leitura suficiente.
- token expirado/revogado.
- token não pertence a conta com acesso ao repo.

## Referências

- https://www.electron.build/auto-update.html
- https://www.electron.build/publish.html
