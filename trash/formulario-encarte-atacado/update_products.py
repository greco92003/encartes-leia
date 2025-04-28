import pandas as pd

# Ler o arquivo Excel
df = pd.read_excel('produtos.xlsx')

# Encontrar e corrigir os nomes duplicados
# Corrigir "Filé De Pescada Marpex 800g]"
pescada_indices = df[df['nome'] == 'Filé De Pescada Marpex 800g]'].index
if len(pescada_indices) >= 2:
    df.loc[pescada_indices[0], 'nome'] = 'Filé De Pescada Marpex 800g'
    df.loc[pescada_indices[1], 'nome'] = 'Filé De Pescada Marpex 800g-2'

# Corrigir "Sardinha Pescador"
sardinha_indices = df[df['nome'] == 'Sardinha Pescador'].index
if len(sardinha_indices) >= 2:
    df.loc[sardinha_indices[1], 'nome'] = 'Sardinha Pescador-2'

# Salvar o arquivo atualizado
df.to_excel('produtos.xlsx', index=False)

print('Arquivo atualizado com sucesso!')
print('Registros atualizados:')
print(df[df['nome'].str.contains('Sardinha Pescador|Filé De Pescada Marpex', case=False)])
