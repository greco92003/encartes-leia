import { NextResponse } from 'next/server';
import { fetchProductsFromGoogleSheet } from '@/lib/excel-utils';

export async function GET() {
  try {
    console.log("API: Iniciando atualização de produtos da planilha do Google");
    
    // Forçar uma nova busca de produtos da planilha do Google
    // Adicionando um parâmetro de timestamp para evitar cache
    const timestamp = new Date().getTime();
    const products = await fetchProductsFromGoogleSheet(true);
    
    console.log(`API: Produtos atualizados: ${products.length}`);
    
    return NextResponse.json({ 
      success: true, 
      products,
      count: products.length,
      timestamp
    });
  } catch (error) {
    console.error('Erro ao atualizar produtos da planilha do Google:', error);
    return NextResponse.json(
      { success: false, message: 'Falha ao atualizar produtos da planilha', error: String(error) },
      { status: 500 }
    );
  }
}
