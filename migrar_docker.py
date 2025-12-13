import os
import subprocess
import sys
from urllib.parse import urlparse

# Credenciais do DOCKER (Lidas do docker-compose.yml)
DOCKER_CONTAINER = "saas_mysql"
LOCAL_DB_USER = "root"
LOCAL_DB_PASS = "rootpassword"
LOCAL_DB_NAME = "saas_db"
DUMP_FILE = "saas_backup.sql"

def parse_db_url(url):
    try:
        # Ajusta url se não tiver scheme para facilitar
        if not url.startswith("mysql://") and not url.startswith("mysql://"):
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

def run_migration():
    print("🐳 Migration Tool: Docker -> Railway")
    print("-----------------------------------")
    print(f"Detectei que você usa Docker ({DOCKER_CONTAINER}).")
    print(f"Vou pegar os dados do banco '{LOCAL_DB_NAME}' automaticamente.\n")
    
    # 1. Input da URL
    railway_url = input("👉 Cole a MYSQL_URL do Railway: ").strip()
    if not railway_url:
        print("❌ URL obrigatória.")
        return
    
    remote = parse_db_url(railway_url)
    if not remote or not remote['host']:
        print("❌ URL inválida.")
        return

    # 2. Dump do Docker
    print("\n📦 1. Exportando dados do container Docker...")
    
    # Executa mysqldump dentro do container
    # Atenção: senha colada no -p
    dump_cmd = f"docker exec {DOCKER_CONTAINER} mysqldump -u {LOCAL_DB_USER} -p{LOCAL_DB_PASS} --no-create-info --complete-insert --skip-triggers --ignore-table={LOCAL_DB_NAME}._prisma_migrations {LOCAL_DB_NAME}"
    
    try:
        with open(DUMP_FILE, "w") as f:
            # shell=True para facilitar o pipe se fosse o caso, mas aqui usamos subprocess direto
            # Mas wait, docker exec escreve no stdout. Capturamos no arquivo.
            subprocess.run(dump_cmd, shell=True, stdout=f, check=True)
            
        # Verifica se o arquivo tem conteúdo
        if os.path.getsize(DUMP_FILE) < 100:
            print("⚠️  Aviso: O backup parece vazio. O banco local tem dados?")
        else:
            print("✅ Backup local realizado com sucesso!")
            
    except subprocess.CalledProcessError:
        print("❌ Erro ao exportar do Docker. O container está rodando?")
        return

    # 3. Importação no Railway (Usando o cliente mysql DO DOCKER)
    print("\n📤 2. Enviando dados para o Railway...")
    print(f"   Destino: {remote['host']}")
    
    # Comando para importar: lê o arquivo local e passa via pipe para o docker exec
    # docker exec -i (interactive) lê do stdin
    import_cmd = f"docker exec -i {DOCKER_CONTAINER} mysql -h {remote['host']} -P {remote['port']} -u {remote['user']} -p{remote['password']} -D {remote['database']}"
    
    try:
        with open(DUMP_FILE, "r") as f:
            subprocess.run(import_cmd, shell=True, stdin=f, check=True)
        print("\n🎉 SUCESSO! Migração concluída.")
        print("   Seus dados de teste agora estão na produção!")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Erro ao importar no Railway. Código: {e.returncode}")
        print("   Verifique se a URL está correta e se o banco de destino existe.")
    finally:
        # Limpeza
        if os.path.exists(DUMP_FILE):
             os.remove(DUMP_FILE)
             pass

if __name__ == "__main__":
    run_migration()
