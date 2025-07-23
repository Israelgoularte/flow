#!/bin/bash
set -e
apt-get update && apt-get upgrade -y
cd /opt/flow
/usr/bin/docker-compose pull
/usr/bin/docker-compose up -d
npm update -g n8n
