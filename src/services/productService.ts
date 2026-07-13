import { demoMenuItems, imageForProduct, type MenuItem } from '../data/menu';
import { request } from '../lib/api';
import { type ProdutoRequest, type ProdutoResponse } from '../types/api';

function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

export function produtoToMenuItem(produto: ProdutoResponse): MenuItem {
  return {
    id: produto.id,
    name: produto.nome,
    description: produto.descricao || 'Produto disponível no cardápio da casa.',
    price: toNumber(produto.preco),
    category: produto.categoria,
    rating: 5,
    image: produto.imagemBase64 || produto.imagemUrl || imageForProduct(produto.nome, produto.categoria),
    tag: produto.categoria === 'HAMBURGUER' ? 'Artesanal' : undefined,
    fromBackend: true
  };
}

export async function listarProdutosApi(): Promise<ProdutoResponse[]> {
  return request<ProdutoResponse[]>('/produtos');
}

export async function listarProdutos(): Promise<MenuItem[]> {
  const produtos = await listarProdutosApi();
  return produtos.map(produtoToMenuItem);
}

function produtoKey(nome: string, categoria: string): string {
  return `${nome.trim().toLowerCase()}::${categoria}`;
}

export async function garantirProdutosDeAmostra(): Promise<{ produtos: MenuItem[]; cadastrados: number }> {
  const produtosAtuais = await listarProdutosApi();
  const existentes = new Set(produtosAtuais.map((produto) => produtoKey(produto.nome, produto.categoria)));

  const produtosFaltando = demoMenuItems.filter(
    (item) => !existentes.has(produtoKey(item.name, item.category))
  );

  for (const item of produtosFaltando) {
    await cadastrarProduto({
      nome: item.name,
      descricao: item.description,
      preco: item.price,
      categoria: item.category,
      imagemUrl: item.image
    });
  }

  const produtosAtualizados = produtosFaltando.length > 0 ? await listarProdutosApi() : produtosAtuais;

  return {
    produtos: produtosAtualizados.map(produtoToMenuItem),
    cadastrados: produtosFaltando.length
  };
}

export async function cadastrarProduto(payload: ProdutoRequest): Promise<ProdutoResponse> {
  return request<ProdutoResponse>('/produtos', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function atualizarProduto(id: number, payload: ProdutoRequest): Promise<ProdutoResponse> {
  return request<ProdutoResponse>(`/produtos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function inativarProduto(id: number): Promise<void> {
  await request<void>(`/produtos/${id}/inativar`, {
    method: 'PATCH'
  });
}

export async function salvarProdutoSemDuplicar(payload: ProdutoRequest): Promise<ProdutoResponse> {
  const produtos = await listarProdutosApi();
  const existente = produtos.find(
    (produto) =>
      produto.nome.trim().toLowerCase() === payload.nome.trim().toLowerCase() &&
      produto.categoria === payload.categoria
  );

  if (existente) {
    return atualizarProduto(existente.id, payload);
  }

  return cadastrarProduto(payload);
}

export async function cadastrarCardapioDemo(): Promise<void> {
  for (const item of demoMenuItems) {
    await salvarProdutoSemDuplicar({
      nome: item.name,
      descricao: item.description,
      preco: item.price,
      categoria: item.category,
      imagemUrl: item.image
    });
  }
}
