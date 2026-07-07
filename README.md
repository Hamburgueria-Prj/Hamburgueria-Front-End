# Boca de Brasa - Frontend sem fluxo de Cliente do backend

Frontend React/Vite ajustado para trabalhar com o backend refatorado, onde o pedido pertence diretamente ao `Usuario` logado.

## Principais ajustes desta versão

- Removidas chamadas para `/clientes`.
- Removida a dependência do antigo `Cliente Balcão`.
- Finalização de pedido agora envia apenas `usuarioId`, `tipoPedido`, `desconto`, `observacao` e `itens`.
- O cliente continua acompanhando o último pedido salvo por usuário no navegador.
- Área admin ganhou aba **Pedidos**, mostrando os itens comprados para preparo.
- O admin pode alterar o status direto no card do pedido: Em preparo, Pronto, Entregue ou Cancelado.
- A aba **Pagamentos** permanece como conferência financeira.

## Rodar

```bash
npm install
npm run dev -- --host 0.0.0.0
```

## Variáveis de ambiente

```env
VITE_API_URL=http://192.168.15.107:8080
VITE_AUTO_SEED=false
```

## Backend necessário

O backend precisa expor estes endpoints:

```txt
POST  /auth/register
POST  /auth/login
GET   /produtos
POST  /produtos
PUT   /produtos/{id}
PATCH /produtos/{id}/inativar
GET   /usuario
POST  /usuario
PUT   /usuario/{id}
PATCH /usuario/{id}/inativar
GET   /pedidos
GET   /pedidos/{id}
GET   /pedidos/usuario/{usuarioId}
POST  /pedidos
PATCH /pedidos/{id}/status?status=...
GET   /pagamentos
POST  /pagamentos
```

## Novo payload de pedido

```json
{
  "usuarioId": 2,
  "tipoPedido": "DELIVERY",
  "desconto": 0,
  "observacao": "Pedido criado pela área do cliente Boca de Brasa",
  "itens": [
    {
      "produtoId": 1,
      "quantidade": 2
    }
  ]
}
```

Não é mais enviado `clienteId`.
