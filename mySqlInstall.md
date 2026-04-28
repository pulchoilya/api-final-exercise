# Встановлення MySQL

## macOS

### Варіант 1: Homebrew (рекомендовано)

```bash
# Встановити Homebrew (якщо ще немає)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Встановити MySQL
brew install mysql

# Запустити MySQL як сервіс (автозапуск при перезавантаженні)
brew services start mysql

# Або запустити одноразово (без автозапуску)
mysql.server start
```

### Варіант 2: DMG-інсталятор

1. Завантажте інсталятор з [dev.mysql.com/downloads/mysql](https://dev.mysql.com/downloads/mysql/)
2. Оберіть **macOS** та завантажте `.dmg` файл
3. Відкрийте `.dmg` і запустіть інсталятор
4. Слідуйте інструкціям, запам'ятайте пароль root
5. Після встановлення запустіть MySQL через **System Settings → MySQL → Start**

### Перевірка

```bash
mysql --version
mysql -u root -e "SELECT 1"
```

---

## Windows

### Варіант 1: MySQL Installer (рекомендовано)

1. Завантажте **MySQL Installer** з [dev.mysql.com/downloads/installer](https://dev.mysql.com/downloads/installer/)
2. Запустіть `.msi` файл
3. Оберіть **Custom** або **Developer Default**
4. Обов'язково оберіть **MySQL Server**
5. Натисніть **Execute** для завантаження та встановлення
6. У налаштуваннях:
   - Тип: **Development Computer**
   - Порт: **3306** (за замовчуванням)
   - Встановіть пароль для **root**
   - Увімкніть **Windows Service** (автозапуск)
7. Завершіть встановлення

### Варіант 2: winget

```powershell
winget install Oracle.MySQL
```

### Варіант 3: Chocolatey

```powershell
choco install mysql
```

### Додавання до PATH (якщо `mysql` не розпізнається)

1. Відкрийте **Settings → System → About → Advanced system settings**
2. Натисніть **Environment Variables**
3. У **Path** додайте: `C:\Program Files\MySQL\MySQL Server 8.0\bin`
4. Перезапустіть термінал

### Перевірка

```powershell
mysql --version
mysql -u root -p -e "SELECT 1"
```

---

## Створення бази даних для проєкту

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS dojo_api"
```

## Підключення

Переконайтесь, що у файлі `.env` вказано правильний `DATABASE_URL`:

```
DATABASE_URL="mysql://root@localhost:3306/dojo_api"
```

> Якщо при встановленні задали пароль для root, додайте його:
>
> ```
> DATABASE_URL="mysql://root:ВАШ_ПАРОЛЬ@localhost:3306/dojo_api"
> ```

Після цього виконайте:

```bash
npx prisma db push
```
