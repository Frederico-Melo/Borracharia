# Pneu Pro Gestão

Sistema completo, local e offline para gestão de borracharias. Foi construído para um único proprietário operar rapidamente no Windows: venda, baixa de estoque, caixa, lucro, histórico, relatórios e backup funcionam sem internet.

## Funcionalidades

- Dashboard com vendas do dia/mês, lucro mensal, últimas vendas e alertas de estoque mínimo.
- Resumo de estoque no Dashboard: total geral e total de pneus, rodas e bicos.
- Cadastro de pneus, rodas e bicos sem código de barras, fotos ou fornecedores.
- Pesquisa de pneus por marca, modelo ou medida, incluindo formatos como `205/55 R16`.
- Localização por pneu: Estoque pintura, Estoque ou Loja.
- Opção de privacidade para ocultar os preços de compra nas listagens de estoque.
- Estoque auditável: entrada, saída, ajuste manual e baixa automática ao finalizar uma venda.
- Nova venda com placa, veículo, múltiplos itens, alinhamento, balanceamento, mão de obra livre, descontos e formas de pagamento.
- Histórico permanente de vendas com pesquisa, detalhes, edição apenas das observações e paginação de 10 vendas por vez.
- Caixa com entradas automáticas das vendas e lançamentos manuais de despesas, compras e outras movimentações.
- Relatórios de faturamento/lucro diário, produtos e serviços mais vendidos, exportáveis para PDF e Excel.
- SQLite local com migrations, transações, backup automático diário, exportação e restauração segura.
- Aplicação desktop Electron configurada para gerar instalador `.exe` para Windows.

## Uso no Windows

Após gerar ou receber o instalador, execute `Pneu-Pro-Gestao-Setup-x.y.z.exe`, escolha a pasta de instalação e abra **Pneu Pro Gestão** pelo atalho criado. Não é necessário instalar banco de dados, configurar servidor ou ter conexão com a internet.

Os dados operacionais ficam na pasta de dados do Windows do usuário, separada da instalação. Atualizar ou reinstalar o programa não apaga a operação.

## Desenvolvimento e compilação

Para desenvolver ou gerar o instalador, instale Node.js 20 ou superior. O usuário final do instalador não precisa disso.

```powershell
npm install
npm run dev
```

O comando abre a versão Electron em desenvolvimento. A API local é iniciada apenas em `127.0.0.1` e o banco de desenvolvimento é criado em `data/pneu-pro.db`.

```powershell
npm run typecheck    # valida TypeScript
npm test             # testes unitários
npm run db:seed      # inclui dados de exemplo se o banco estiver vazio
npm run build        # gera a aplicação otimizada
npm run dist         # gera o instalador Windows em release/
```

O instalador final estará em `release/Pneu-Pro-Gestao-Setup-<versão>.exe`.

## Backup e restauração

Na tela **Configurações**, clique em **Exportar banco de dados** e guarde o arquivo `.db` em pendrive, Google Drive, OneDrive ou outro local seguro. Para recuperar uma cópia, clique em **Importar backup** e selecione o `.db` exportado pelo sistema. Antes de substituir os dados, o sistema cria uma cópia de segurança automaticamente.

Com o backup automático ativado, uma cópia diária também é criada na pasta de dados da aplicação. Esse recurso é complementar: mantenha cópias externas periódicas.

## Estrutura

```text
backend/                 API local Express, regras de negócio e acesso a dados
database/migrations/     evolução versionada do SQLite
database/seed/           dados de exemplo opcionais
electron/                inicialização desktop e geração de PDF
frontend/                interface React + TypeScript
docs/                    documentação técnica, dados e APIs
```

O Electron inicia a API local em uma porta aleatória no próprio computador. A interface React conversa somente com essa API. Não há acesso externo, login, contas de usuário ou dependências de nuvem.

## Regras importantes

- Valores são armazenados em centavos no banco para não sofrer erros de arredondamento.
- Uma venda é uma transação única: estoque, itens da venda e caixa são gravados juntos ou nenhuma alteração é feita.
- O lucro de uma venda é `total pago − custo dos produtos`; serviços e mão de obra entram integralmente no lucro.
- Produtos usados em vendas são arquivados, não apagados fisicamente, para preservar o histórico.
- A quantidade só é mudada pela tela Estoque ou por uma venda, mantendo o histórico de cada alteração.
- Ao excluir uma venda pelo Histórico, seus produtos retornam ao estoque e a entrada correspondente é removida do caixa.

Veja [Arquitetura](docs/ARQUITETURA.md), [Modelagem](docs/MODELAGEM.md) e [API local](docs/API.md) para detalhes técnicos.
