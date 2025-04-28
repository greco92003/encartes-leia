import pandas as pd

# Read the exemplo.xlsx file
print("Reading exemplo.xlsx...")
exemplo_df = pd.read_excel('exemplo.xlsx')
print("Columns in exemplo.xlsx:")
print(exemplo_df.columns.tolist())
print("\nFirst 5 rows of exemplo.xlsx:")
print(exemplo_df.head())

# Read the produtos.xlsx file
print("\n\nReading produtos.xlsx...")
produtos_df = pd.read_excel('produtos.xlsx')
print("Columns in produtos.xlsx:")
print(produtos_df.columns.tolist())
print("\nFirst 5 rows of produtos.xlsx:")
print(produtos_df.head())
