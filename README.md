# Automação de Serviços

Este projeto oferece scripts para instalar e manter atualizados os seguintes serviços em um servidor Ubuntu:

- [n8n](https://n8n.io)
- [Chatwoot](https://www.chatwoot.com)
- Evolution API
- PostgreSQL

## Instalação

Execute o script `install.sh` como **root**:

```bash
sudo ./install.sh
```

O script instala Docker, Docker Compose, Node.js, PostgreSQL e configura um ambiente em `/opt/flow` com `docker-compose.yml` para iniciar os serviços.

### Subdomínios padrão

Durante a instalação é configurado o Nginx para expor cada aplicativo em um subdomínio do domínio `raelflow.com`:

- `chat.raelflow.com` → Chatwoot
- `n8n.raelflow.com` → n8n
- `api.raelflow.com` → Evolution API
- `crm.raelflow.com` → CRM de exemplo

Certifique-se de criar os registros DNS correspondentes apontando para o servidor antes de executar o `install.sh`.

## Atualizações semanais

Um cron job é criado automaticamente para rodar `update_services.sh` todo domingo às 3h da manhã. Este script atualiza os pacotes do sistema, baixa versões recentes dos containers e atualiza o n8n instalado via npm.

Para executar manualmente:

```bash
sudo ./update_services.sh
```

## Estrutura

- `install.sh` – prepara o servidor e inicializa os containers.
- `update_services.sh` – atualiza pacotes e containers, utilizado pelo cron.
- `docker-compose.yml` – gerado durante a instalação em `/opt/flow`.

**Observação**: ajuste as configurações do arquivo `docker-compose.yml` conforme sua necessidade, especialmente para `evolution_api`, que utiliza uma imagem genérica `evolution/evolution-api:latest`.

## CRM de Exemplo

Além dos scripts, este repositório contém um pequeno exemplo de CRM com backend em Node.js/Express e frontend estático.

### Executando o servidor

```bash
cd server
npm install
npm start
```

O frontend fica disponível em `http://localhost:3001` e utiliza a API exposta em `/api`.
