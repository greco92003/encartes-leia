#!/bin/bash

# Create a file with patterns to replace
cat > sensitive-patterns.txt << EOL
AIza[0-9A-Za-z\-_]{35}
[0-9]+-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com
-----BEGIN PRIVATE KEY-----[^\-]+-----END PRIVATE KEY-----
https://[a-z0-9]+\.supabase\.co
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+
EOL

# Download BFG Repo-Cleaner if not already present
if [ ! -f bfg.jar ]; then
    echo "Downloading BFG Repo-Cleaner..."
    curl -L -o bfg.jar https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
fi

# Create a backup of the repository
echo "Creating backup of the repository..."
cp -r . ../formulario-encarte-atacado-backup-bfg

# Run BFG to replace sensitive information
echo "Running BFG to clean repository..."
java -jar bfg.jar --replace-text sensitive-patterns.txt .

# Clean up refs and run garbage collection
echo "Cleaning up repository..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "Repository cleaned successfully!"
echo "Next steps:"
echo "1. Verify that sensitive information has been removed"
echo "2. Force push to remote repository with: git push origin --force"
