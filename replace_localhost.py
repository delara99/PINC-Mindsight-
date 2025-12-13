import os
import glob

# Mapeia onde está o config baseado na profundidade do arquivo, ou usa @ absolute path
CONFIG_IMPORT = "import { API_URL } from '@/src/config/api';"

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Ignora o próprio arquivo de config
    if "src/config/api.ts" in filepath:
        return

    # Se não tem localhost, pula
    if "localhost:3000" not in content:
        return

    print(f"🔧 Corrigindo: {filepath}")
    
    lines = content.split('\n')
    new_lines = []
    has_import = False
    
    # Verifica se já tem o import
    if "from '@/src/config/api'" in content or 'from "@/src/config/api"' in content:
        has_import = True
        
    for i, line in enumerate(lines):
        # Adiciona import na primeira linha válida se não tiver
        if not has_import and (line.startswith("import") or line.startswith("'use client'") or i == 0):
             # Se for a primeira linha e não for import, insere antes. 
             # Se for use client, insere depois.
             pass 

    # Estratégia de substituição simples
    # Substitui 'http://localhost:3000' por ' + API_URL + ' (se for string simples concatenada)
    # Ou converte para template literal.
    
    # Maneira mais segura: Replace string literals
    new_content = content.replace("'http://localhost:3000", "`http://localhost:3000") # Start template
    # Wait, simple replace is dangerous.
    
    # Better strategy:
    # 1. Replace `http://localhost:3000` with `${API_URL}` (assuming it's inside backticks)
    # 2. Replace 'http://localhost:3000' with ` + API_URL + ' (assuming string concatenation?) No.
    
    # Let's replace specifically:
    # `http://localhost:3000 -> `${API_URL}
    # 'http://localhost:3000 -> API_URL + ' (If followed by /)
    
    # Most consistent way:
    # Replace all http://localhost:3000 with nothing, and prepend API_URL logic.
    
    # Let's do regex based replacement?
    # Or simple string replace since we know the exact strings from grep?
    
    updated_content = content
    
    # Case 1: Template literal
    updated_content = updated_content.replace('`http://localhost:3000', '`${API_URL}')
    
    # Case 2: Single quotes
    # fetch('http://localhost:3000/api/v1/...')
    # Transforma em: fetch(`${API_URL}/api/v1/...`)
    updated_content = updated_content.replace("'http://localhost:3000", "`http://localhost:3000")
    updated_content = updated_content.replace("`http://localhost:3000", "`${API_URL}")
    
    # Agora precisamos fechar a string. Se abriu com ', user fechou com '.
    # Mas se eu troquei ' por `, preciso trocar o fechamento?
    # Isso é perigoso. Se a linha tem 'http://localhost:3000/foo', eu troco o inicio, mas o fim continua '.
    # Syntax error: `...'.
    
    # Solução Robusta:
    # Itera linha por linha.
    
    final_lines = []
    import_added = False
    
    # Prepara o import para ser adicionado
    # Achar o lugar certo (após 'use client' ou top)
    insertion_index = 0
    if lines[0].strip() == "'use client';" or lines[0].strip() == '"use client";':
        insertion_index = 1
        
    for line in lines:
        if "localhost:3000" in line:
            # Tenta converter para template literal
            if "'" in line and "http://localhost:3000" in line:
                # Troca ' por ` E substitui a URL
                # Cuidado se tiver outros ' na linha
                # Assume que a URL está envolta em quotes
                line = line.replace("'http://localhost:3000", "`${API_URL}")
                # Acha o próximo ' e troca por `?
                # Muito arriscado.
                
                # Vamos usar Replace simples específico para os casos comuns
                pass
            
            # Replace seguro:
            # Case A: Template Literal `http://localhost:3000...`
            line = line.replace("`http://localhost:3000", "`${API_URL}")
            
            # Case B: Single Quotes 'http://localhost:3000...' -> `${API_URL}...`
            # Isso requer trocar o quote de fechamento?
            # Se a linha termina com ', { ... }, ok.
            if "'http://localhost:3000" in line:
                line = line.replace("'http://localhost:3000", "`${API_URL}")
                # Tenta fechar o quote
                # Procura a ocorrência de ' DEPOIS da URL
                # Isso é muito frágil para um script cego.
                
                # Mas espera! Se eu rodar o fix_urls_v3.py que usa regex?
                pass
                
        final_lines.append(line)

    # Melhor abordagem:
    # Usar regex para capturar a string inteira.
    import re
    
    # Regex para capturar 'http://localhost:3000...' ou "http://..." ou `http://...`
    # Grupo 1: Quote start
    # Grupo 2: O resto da URL
    # Grupo 3: Quote end
    
    def replace_match(match):
        quote = match.group(1)
        url_path = match.group(2)
        # Retorna template literal
        return f"`${{API_URL}}{url_path}`"

    # Padrão: Quote + http://localhost:3000 + (qualquer coisa exceto quote) + Quote
    pattern = r"(['\"`])http://localhost:3000([^'\"`]*)\1"
    
    new_content_regex = re.sub(pattern, replace_match, content)
    
    if new_content_regex != content:
        # Adiciona import se mudou
        if not has_import:
            lines = new_content_regex.split('\n')
            if lines[0].strip().startswith(('"use client"', "'use client'")):
                lines.insert(1, CONFIG_IMPORT)
            else:
                lines.insert(0, CONFIG_IMPORT)
            new_content_regex = '\n'.join(lines)
            
        with open(filepath, 'w') as f:
            f.write(new_content_regex)
        print("✅ Fixed")

# A lista de arquivos veio do grep anterior (posso hardcodar ou rodar glob)
# Vou usar glob recursivo
files = glob.glob('**/*.tsx', recursive=True) + glob.glob('**/*.ts', recursive=True) + glob.glob('**/*.js', recursive=True)

for f in files:
    # Skip node_modules, .next, .git
    if "node_modules" in f or ".next" in f or ".git" in f:
        continue
    fix_file(f)
