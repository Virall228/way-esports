#!/bin/bash

# Скрипт для установки и запуска GitHub Actions self-hosted runner на сервере

# Переменные - замените на свои значения
REPO_URL="https://github.com/Virall228/way-esports"
RUNNER_VERSION="2.308.0"
RUNNER_DIR="/home/runner/actions-runner"

# Установка зависимостей
sudo apt-get update
sudo apt-get install -y curl jq git

# Создаем пользователя для раннера
sudo useradd -m -d /home/runner runner || true
sudo chown -R runner:runner /home/runner

# Скачиваем и распаковываем раннер
sudo -u runner bash -c "
cd /home/runner
if [ ! -d \"actions-runner\" ]; then
  curl -o actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz -L https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz
  tar xzf actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz
fi
"

echo "Self-hosted runner setup script created."

echo "Далее вам нужно получить токен регистрации раннера из GitHub и запустить регистрацию вручную."
echo "Для этого выполните на сервере под пользователем runner:"
echo "cd ${RUNNER_DIR}"
echo "curl -X POST -H \"Accept: application/vnd.github+json\" -H \"Authorization: Bearer YOUR_GITHUB_TOKEN\" https://api.github.com/repos/Virall228/way-esports/actions/runners/registration-token"
echo "Замените YOUR_GITHUB_TOKEN на ваш персональный токен GitHub с правами repo и admin:repo_hook."
echo "Затем выполните:"
echo "./config.sh --url ${REPO_URL} --token REGISTRATION_TOKEN"
echo "./run.sh"
