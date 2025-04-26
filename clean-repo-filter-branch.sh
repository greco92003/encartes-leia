#!/bin/bash

# Create a backup of the repository
echo "Creating backup of the repository..."
cp -r . ../formulario-encarte-atacado-backup-filter-branch

# Define patterns to replace
GOOGLE_API_KEY_PATTERN="AIza[0-9A-Za-z\-_]{35}"
GOOGLE_OAUTH_PATTERN="[0-9]+-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com"
GOOGLE_PRIVATE_KEY_PATTERN="-----BEGIN PRIVATE KEY-----[^\-]+-----END PRIVATE KEY-----"
SUPABASE_URL_PATTERN="https://[a-z0-9]+\.supabase\.co"
SUPABASE_KEY_PATTERN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+"

# Run git filter-branch to replace sensitive information
echo "Running git filter-branch to clean repository..."
git filter-branch --force --tree-filter '
    find . -type f -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" -o -name "*.env*" -o -name ".env*" | xargs -I{} sed -i -E "s/'"$GOOGLE_API_KEY_PATTERN"'/[REDACTED_API_KEY]/g" {} 2>/dev/null || true
    find . -type f -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" -o -name "*.env*" -o -name ".env*" | xargs -I{} sed -i -E "s/'"$GOOGLE_OAUTH_PATTERN"'/[REDACTED_OAUTH]/g" {} 2>/dev/null || true
    find . -type f -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" -o -name "*.env*" -o -name ".env*" | xargs -I{} sed -i -E "s/'"$GOOGLE_PRIVATE_KEY_PATTERN"'/[REDACTED_PRIVATE_KEY]/g" {} 2>/dev/null || true
    find . -type f -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" -o -name "*.env*" -o -name ".env*" | xargs -I{} sed -i -E "s/'"$SUPABASE_URL_PATTERN"'/[REDACTED_SUPABASE_URL]/g" {} 2>/dev/null || true
    find . -type f -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" -o -name "*.env*" -o -name ".env*" | xargs -I{} sed -i -E "s/'"$SUPABASE_KEY_PATTERN"'/[REDACTED_SUPABASE_KEY]/g" {} 2>/dev/null || true
' --tag-name-filter cat -- --all

# Clean up refs and run garbage collection
echo "Cleaning up repository..."
git for-each-ref --format="%(refname)" refs/original/ | xargs -n 1 git update-ref -d
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "Repository cleaned successfully!"
echo "Next steps:"
echo "1. Verify that sensitive information has been removed"
echo "2. Force push to remote repository with: git push origin --force"
