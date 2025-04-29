import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  try {
    // Path to the Excel file
    const filePath = path.join(process.cwd(), 'public', 'produtos.xlsx');
    
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Parse the Excel file
    const workbook = XLSX.read(fileBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<{ nome: string }>(worksheet);
    
    return NextResponse.json({ products: jsonData });
  } catch (error) {
    console.error('Error reading products Excel file:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to read products' },
      { status: 500 }
    );
  }
}
