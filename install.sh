#!/bin/bash

set -e

# Ensure script is run as root
if [ "$EUID" -ne 0 ]; then
  echo "Este script precisa ser executado como root" >&2
  exit 1
fi

# Atualiza pacotes e instala dependências
apt-get update
apt-get install -y docker.io docker-compose nodejs npm postgresql postgresql-contrib nginx

# Inicia serviços necessários
systemctl enable --now docker
systemctl enable --now postgresql
systemctl enable --now nginx

# Instala n8n globalmente
npm install -g n8n

# Diretório do projeto
mkdir -p /opt/flow
cd /opt/flow

# Cria arquivo docker-compose.yml
cat <<'COMPOSE' > docker-compose.yml
version: '3'
services:
  postgres:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_USER: chatwoot
      POSTGRES_PASSWORD: chatwoot
      POSTGRES_DB: chatwoot
    volumes:
      - pgdata:/var/lib/postgresql/data
  chatwoot:
    image: chatwoot/chatwoot:latest
    env_file: .env.chatwoot
    depends_on:
      - postgres
    ports:
      - "3000:3000"
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n
  evolution_api:
    image: evolution/evolution-api:latest
    ports:
      - "8081:8080"
volumes:
  pgdata:
  n8n_data:
COMPOSE

# Arquivo de variáveis para o Chatwoot
cat <<'ENV' > .env.chatwoot
RAILS_ENV=production
SECRET_KEY_BASE=$(openssl rand -hex 64)
FRONTEND_URL=https://chat.raelflow.com
PORT=3000
INSTALLATION_ENV=docker
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USERNAME=chatwoot
POSTGRES_PASSWORD=chatwoot
POSTGRES_DATABASE=chatwoot
REDIS_URL=redis://redis:6379
ENV

# Sobe os containers
/usr/bin/docker-compose up -d

# Configura o Nginx para expor cada serviço em um subdomínio
cat <<'NGINX' > /etc/nginx/sites-available/flow.conf
server {
    listen 80;
    server_name chat.raelflow.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name n8n.raelflow.com;
    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name api.raelflow.com;
    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name crm.raelflow.com;
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/flow.conf /etc/nginx/sites-enabled/flow.conf
rm -f /etc/nginx/sites-enabled/default
systemctl reload nginx

cat <<'UPDATE' > /usr/local/bin/update_services.sh
#!/bin/bash
set -e
apt-get update && apt-get upgrade -y
cd /opt/flow
/usr/bin/docker-compose pull
/usr/bin/docker-compose up -d
npm update -g n8n
UPDATE
chmod +x /usr/local/bin/update_services.sh

# Cria tarefa semanal
(crontab -l 2>/dev/null; echo "0 3 * * 0 /usr/local/bin/update_services.sh >> /var/log/update_services.log 2>&1") | crontab -

echo "Instalação concluída."
