import subprocess
import sys
from urllib.parse import urlparse

# Mesmas configurações do ambiente Docker
DOCKER_CONTAINER = "saas_mysql"
LOCAL_DB_USER = "root"
LOCAL_DB_PASS = "rootpassword"
LOCAL_DB_NAME = "saas_db"

# Tabelas principais para verificar
TABLES = ["users", "tenants", "assessment_models", "connections", "assessment_assignments"]

def parse_db_url(url):
    try:
        if not url.startswith("mysql://"):
            url = "mysql://" + url
        parsed = urlparse(url)
        return {
            'host': parsed.hostname,
            'user': parsed.username,
            'password': parsed.password,
            'port': parsed.port or 3306,
            'database': parsed.path.lstrip('/')
        }
    except:
        return None

def get_local_count(table):
    try:
        cmd = f"docker exec {DOCKER_CONTAINER} mysql -u {LOCAL_DB_USER} -p{LOCAL_DB_PASS} -D {LOCAL_DB_NAME} -N -e 'SELECT COUNT(*) FROM {table}'"
        result = subprocess.check_output(cmd, shell=True)
        return int(result.strip())
    except Exception as e:
        return -1

def get_remote_count(remote, table):
    try:
        cmd = f"docker exec {DOCKER_CONTAINER} mysql -h {remote['host']} -P {remote['port']} -u {remote['user']} -p{remote['password']} -D {remote['database']} -N -e 'SELECT COUNT(*) FROM {table}'"
        result = subprocess.check_output(cmd, shell=True)
        return int(result.strip())
    except Exception as e:
        # Se der erro, pode ser que a tabela nao exista
        return -1

def run_verification():
    print("🕵️‍♂️  Verificador de Integridade de Dados")
    print("---------------------------------------")
    
    railway_url = input("👉 Cole a MYSQL_URL do Railway: ").strip()
    remote = parse_db_url(railway_url)
    if not remote:
        print("❌ URL Inválida")
        return

    print("\n🔍 Comparando contagem de registros...")
    print(f"{'TABELA':<25} | {'LOCAL':<10} | {'REMOTO (RAILWAY)':<15} | {'STATUS'}")
    print("-" * 65)

    all_match = True

    for table in TABLES:
        local = get_local_count(table)
        remote_cnt = get_remote_count(remote, table)
        
        status = "✅ OK"
        if local != remote_cnt:
            status = "❌ DIFERENTE" if remote_cnt != -1 else "❌ NÃO EXISTE"
            all_match = False
            
        print(f"{table:<25} | {local:<10} | {remote_cnt:<15} | {status}")

    print("-" * 65)
    if all_match:
        print("\n✨ TUDO CERTO! Todos os dados conferem.")
    else:
        print("\n⚠️  ATENÇÃO: Algumas tabelas estão diferentes.")
        print("   - Se o remoto for -1 ou 0, certifique-se de rodar a migracao.")

if __name__ == "__main__":
    run_verification()
