#!/bin/bash
# Abre o Terminal e inicia o servidor de desenvolvimento
PROJECT_DIR="/Users/urlandipre/Documents/Projetos Ybera/Atlas (registros)/atlas-profissional"

# Mata qualquer instância anterior
pkill -f "next dev" 2>/dev/null
sleep 1

# Abre Terminal com npm run dev
osascript -e "tell application \"Terminal\"
  activate
  do script \"cd '$PROJECT_DIR' && npm run dev\"
end tell"

echo "✓ Terminal aberto com npm run dev em http://localhost:3000"
