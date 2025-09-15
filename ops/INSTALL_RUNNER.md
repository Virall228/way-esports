# Установка self-hosted GitHub Actions Runner на Ubuntu

## 1. Создание пользователя deploy (если не существует)
```bash
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG sudo,docker deploy
```

## 2. Установка Docker и Docker Compose v2
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker

# Добавить пользователя deploy в группу docker
sudo usermod -aG docker deploy
```

## 3. Установка GitHub self-hosted runner
```bash
# Переключиться на пользователя deploy
sudo su - deploy

# Создать директорию для runner
mkdir actions-runner && cd actions-runner

# Скачать последнюю версию runner (пример для Linux x64)
curl -O -L https://github.com/actions/runner/releases/latest/download/actions-runner-linux-x64.tar.gz
tar xzf ./actions-runner-linux-x64.tar.gz

# Получить URL и токен для регистрации runner из настроек репозитория GitHub (Settings -> Actions -> Runners)

# Зарегистрировать runner (замените URL и TOKEN на свои)
./config.sh --url https://github.com/your-org/your-repo --token YOUR_TOKEN --labels prod --unattended

# Запустить runner как сервис
sudo ./svc.sh install
sudo ./svc.sh start
```

## 4. Проверка
```bash
# Проверить статус runner
sudo ./svc.sh status

# Проверить, что docker доступен без sudo
docker ps
```

## 5. Опционально: настройка systemd для docker-compose (если нужно)
Создайте сервис `docker-compose@way-esports.service` для управления проектом.

---

После установки runner с лейблом `prod`, GitHub Actions workflow с `runs-on: [self-hosted, prod]` будет запускаться на вашем сервере.
