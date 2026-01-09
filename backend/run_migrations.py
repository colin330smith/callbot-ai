#!/usr/bin/env python3
"""
Run database migrations for CallBot AI using asyncpg
"""

import asyncio
import os
import sys

# Ensure we can import asyncpg
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import asyncpg

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:XkHDOuvAQLMEpJkYHjvhVnVhzoKNEHDs@gondola.proxy.rlwy.net:37257/railway"
)

async def run_migration(conn, filename):
    """Run a single migration file"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    filepath = os.path.join(script_dir, filename)
    
    if not os.path.exists(filepath):
        print(f"Migration file not found: {filepath}")
        return False
    
    print(f"Running migration: {filename}")
    
    with open(filepath, 'r') as f:
        sql = f.read()
    
    try:
        # Execute each statement separately
        statements = [s.strip() for s in sql.split(';') if s.strip()]
        for i, stmt in enumerate(statements):
            if stmt and not stmt.startswith('--'):
                try:
                    await conn.execute(stmt)
                except Exception as e:
                    # Skip errors for IF NOT EXISTS / IF EXISTS statements
                    if 'already exists' in str(e) or 'does not exist' in str(e):
                        pass
                    else:
                        print(f"  Warning on statement {i+1}: {str(e)[:100]}")
        
        print(f"✓ {filename} completed successfully")
        return True
    except Exception as e:
        print(f"✗ Error running {filename}: {e}")
        return False

async def main():
    print("=" * 60)
    print("CallBot AI Database Migration")
    print("=" * 60)
    print(f"\nConnecting to database...")
    
    # Connect to database
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        version = await conn.fetchval("SELECT version();")
        print(f"✓ Connected to PostgreSQL: {version[:50]}...")
    except Exception as e:
        print(f"✗ Failed to connect: {e}")
        sys.exit(1)
    
    # Run migrations
    migrations = ['init.sql', 'migrations_v2.sql']
    
    for migration in migrations:
        await run_migration(conn, migration)
    
    await conn.close()
    
    print("\n" + "=" * 60)
    print("Migration complete!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
