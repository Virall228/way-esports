# Установка и регистрация self-hosted runner с лейблами self-hosted и prod

1. Перейдите в настройки вашего репозитория на GitHub:
   - Откройте вкладку **Settings**.
   - В меню слева выберите **Actions** → **Runners**.

2. Нажмите **New self-hosted runner**.

3. Выберите операционную систему вашего сервера (например, Linux).

4. Скопируйте команды для скачивания и установки runner на сервер.

5. Запустите команды на сервере по очереди:
   - Скачайте архив с runner.
   - Распакуйте архив.
   - Запустите скрипт конфигурации:
     ```
     ./config.sh --url https://github.com/your-username/your-repo --token YOUR_TOKEN --labels self-hosted,prod
     ```
     Замените `your-username/your-repo` на ваш репозиторий, а `YOUR_TOKEN` на токен из GitHub.

6. Запустите runner:
   ```
   ./run.sh
   ```

7. Убедитесь, что runner отображается в GitHub как **online** с лейблами `self-hosted` и `prod`.

8. Теперь workflow с `runs-on: [self-hosted, prod]` сможет запуститься на этом runner.

---

Если хотите, могу помочь с написанием скрипта автоматической установки и запуска runner на вашем сервере.
