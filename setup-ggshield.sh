#!/bin/bash

# Script para configurar o GitGuardian Shield (ggshield)

echo "Configurando GitGuardian Shield (ggshield)..."

# Verificar se o pip está instalado
if ! command -v pip &> /dev/null; then
    echo "Erro: pip não está instalado. Por favor, instale o Python e o pip primeiro."
    exit 1
fi

# Instalar ggshield
echo "Instalando ggshield..."
pip install ggshield

# Verificar se a instalação foi bem-sucedida
if ! command -v ggshield &> /dev/null; then
    echo "Erro: Falha ao instalar ggshield. Verifique se o pip está funcionando corretamente."
    exit 1
fi

echo "ggshield instalado com sucesso!"

# Configurar pre-commit hook
echo "Configurando hook de pre-commit..."
ggshield secret scan pre-commit

echo "Configuração concluída!"
echo ""
echo "Para autenticar-se com o GitGuardian, execute:"
echo "ggshield auth login"
echo ""
echo "Para verificar se há segredos no repositório, execute:"
echo "ggshield secret scan repo ."
echo ""
echo "Para manter o ggshield atualizado, execute periodicamente:"
echo "pip upgrade ggshield"
