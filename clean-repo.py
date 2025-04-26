#!/usr/bin/env python3

import re
import sys
import subprocess
import os

# Create a git-filter-repo script
with open('filter-repo-script.py', 'w') as f:
    f.write("""
import re
import sys
from git_filter_repo import FilteringOptions, RepoFilter

patterns = [
    # Google API Keys
    re.compile(r'AIza[0-9A-Za-z\-_]{35}'),
    # Google OAuth
    re.compile(r'[0-9]+-[0-9A-Za-z_]{32}\\.apps\\.googleusercontent\\.com'),
    # Google Private Key
    re.compile(r'-----BEGIN PRIVATE KEY-----[^\\-]+-----END PRIVATE KEY-----'),
    # Supabase URLs
    re.compile(r'https://[a-z0-9]+\\.supabase\\.co'),
    # Supabase Keys
    re.compile(r'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\\.[a-zA-Z0-9_-]+\\.[a-zA-Z0-9_-]+')
]

def clean_message(message):
    for pattern in patterns:
        message = pattern.sub('[REDACTED]', message)
    return message

def clean_content(blob):
    try:
        content = blob.data.decode('utf-8', errors='replace')
        original_content = content

        for pattern in patterns:
            content = pattern.sub('[REDACTED]', content)

        if content != original_content:
            blob.data = content.encode('utf-8')
            return True
    except:
        pass
    return False

def check_blob(blob, callback_metadata):
    clean_content(blob)
""")

print("Created filter-repo-script.py")
print("Running git-filter-repo...")

# Run git-filter-repo
try:
    subprocess.run(["git-filter-repo", "--force", "--python-callback", "filter-repo-script.py"], check=True)
    print("Successfully cleaned repository history!")
    print("Next steps:")
    print("1. Verify that sensitive information has been removed")
    print("2. Force push to remote repository with: git push origin --force")
except subprocess.CalledProcessError as e:
    print(f"Error running git-filter-repo: {e}")
    sys.exit(1)
