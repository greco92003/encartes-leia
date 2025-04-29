import { NextResponse } from 'next/server';
import { fetchProductsFromGoogleSheet } from '@/lib/excel-utils';

export async function GET() {
  try {
    console.log("API: Iniciando busca de produtos da planilha do Google");
    
    // Buscar produtos da planilha do Google
    const products = await fetchProductsFromGoogleSheet();
    
    console.log(`API: Produtos encontrados: ${products.length}`);
    
    return NextResponse.json({ 
      success: true, 
      products,
      count: products.length
    });
  } catch (error) {
    console.error('Erro ao buscar produtos da planilha do Google:', error);
    return NextResponse.json(
      { success: false, message: 'Falha ao buscar produtos da planilha', error: String(error) },
      { status: 500 }
    );
  }
}
