import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

conn = psycopg2.connect(host='localhost', port=5432, user='postgres', password='postgres', dbname='postgres')
conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
cur = conn.cursor()

cur.execute("SELECT 1 FROM pg_roles WHERE rolname='sena_admin'")
if not cur.fetchone():
    cur.execute("CREATE ROLE sena_admin WITH LOGIN PASSWORD 'sena_classified_secret_2026' SUPERUSER CREATEDB")
    print('Created role sena_admin')
else:
    cur.execute("ALTER ROLE sena_admin WITH LOGIN PASSWORD 'sena_classified_secret_2026' SUPERUSER")
    print('Updated role sena_admin')

cur.execute("SELECT 1 FROM pg_database WHERE datname='sena_aapurti_db'")
if not cur.fetchone():
    cur.execute("CREATE DATABASE sena_aapurti_db OWNER sena_admin")
    print('Created database sena_aapurti_db')
else:
    print('Database sena_aapurti_db already exists')

conn.close()
