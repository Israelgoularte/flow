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
