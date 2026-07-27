# Deploy Docker + Nginx

Ngay cap nhat: 2026-07-16

Tai lieu nay mo ta quy trinh deploy production/staging tren mot VPS Linux dung Docker Compose va Nginx terminate HTTPS.

## 1. Kien truc

Nginx chay tren host va proxy vao cac port Docker expose noi bo tren server:

| Thanh phan | Host port | Container port | Ghi chu |
|---|---:|---:|---|
| Shop | `31080` | `3000` | Buyer storefront |
| Admin portal | `31081` | `3001` | Quan tri |
| API | `31082` | `4000` | NestJS `/api/v1` |
| PostgreSQL | `5432` hoac doi thanh `55432` | `5432` | Nen chan public bang firewall |

Khuyen nghi domain:

- `shop.example.com` -> shop.
- `admin.example.com` -> admin portal.
- API di qua cung domain bang path `/api/v1` tren ca shop/admin.

Voi cach nay, frontend build voi:

```env
NEXT_PUBLIC_API_BASE_URL=/api/v1
NEXT_PUBLIC_ADMIN_API_BASE_URL=/api/v1
```

## 2. Chuan bi server

Dang nhap server:

```bash
ssh <user>@<server-ip>
```

Cai Docker, Compose plugin, Nginx va Certbot:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg nginx certbot python3-certbot-nginx
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
```

Dang xuat/dang nhap lai de nhan quyen Docker.

Mo firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Khong mo public cac port `31080`, `31081`, `31082`, `5432` neu khong can debug tu ben ngoai.

## 3. Dua source len server

Vi du deploy vao `/opt/ecommerce`:

```bash
sudo mkdir -p /opt/ecommerce
sudo chown "$USER":"$USER" /opt/ecommerce
cd /opt/ecommerce
git clone <repo-url> .
git checkout main
```

Tao file `.env` tu mau:

```bash
cp .env.example .env
nano .env
```

Cac bien toi thieu can sua:

```env
NODE_ENV=production

WEB_PORT=31080
ADMIN_PORT=31081
API_PORT=31082
NEXT_PUBLIC_API_BASE_URL=/api/v1
NEXT_PUBLIC_ADMIN_API_BASE_URL=/api/v1
API_CORS_ORIGINS=https://shop.example.com,https://admin.example.com

POSTGRES_DB=ecommerce
POSTGRES_USER=ecommerce
POSTGRES_PASSWORD=<strong-password>
POSTGRES_PORT=5432

API_AUTH_SECRET=<random-32-bytes-or-longer>
API_SWAGGER_ENABLED=false

CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

GOOGLE_SERVICE_ACCOUNT_KEY_FILE=/run/secrets/google-service-account.json
API_ORDER_INTEGRATIONS=sheet
```

Dat Google service account key vao:

```bash
mkdir -p secrets
nano secrets/google-service-account.json
chmod 600 secrets/google-service-account.json
```

Khong commit `.env` hoac file trong `secrets/`.

Kiem tra lockfile phu thuoc co trong source truoc khi build:

```bash
test -f package-lock.json
git ls-files package-lock.json
```

Dockerfile dang dung `npm ci`, vi vay `package-lock.json` bat buoc phai duoc commit len repo. Neu lenh `git ls-files package-lock.json` khong in ra gi, chay tren may dev:

```bash
git add package-lock.json .gitignore
git commit -m "chore: commit npm lockfile for docker builds"
git push
```

## 4. Build image va khoi dong database

Kiem tra compose:

```bash
docker compose config
```

### 4.1. Server dung PostgreSQL ngoai/host DB

Neu server da co PostgreSQL host dang chay tren port `5432`, dung file override `docker-compose.host-db.yml`. Service buyer web trong compose ten la `web`, khong phai `shop`.

Voi che do host DB, khong start container `postgres`. Khi `up` app, luon dung `--no-deps` de compose khong keo `postgres` noi bo len:

```bash
docker compose -f docker-compose.yml -f docker-compose.host-db.yml config
docker compose -f docker-compose.yml -f docker-compose.host-db.yml build api worker web admin-portal
docker compose -f docker-compose.yml -f docker-compose.host-db.yml run --rm --no-deps api npm run db:migrate:deploy
docker compose -f docker-compose.yml -f docker-compose.host-db.yml up -d --no-deps api worker web admin-portal caddy
```

Voi che do nay, `.env` can co:

```env
DATABASE_URL=postgresql://ecommerce:<password>@host.docker.internal:5432/ecommerce?schema=public
API_CORS_ORIGINS=https://shop.example.com,https://admin.example.com
NEXT_PUBLIC_API_BASE_URL=https://shop.example.com/api/v1
```

Neu tung start nham container `postgres` noi bo va bi loi bind port `5432`, xoa container do:

```bash
docker rm -f runtime-postgres-1
```

Neu PostgreSQL host chi listen `127.0.0.1:5432`, container co the chua ket noi duoc. Khi do can cau hinh PostgreSQL listen them Docker bridge va mo `pg_hba.conf` cho subnet Docker. Trieu chung thuong gap:

```text
P1010: User was denied access on the database `172.21.0.2`
```

Tren server DB, mo file `pg_hba.conf`:

```bash
sudo -u postgres psql -c "SHOW hba_file;"
sudo nano /path/to/pg_hba.conf
```

Them mot trong hai dong sau vao cuoi file, tuy theo phuong thuc password cua PostgreSQL:

```conf
host    ecommerce    ecommerce    172.16.0.0/12    md5
host    ecommerce    ecommerce    172.16.0.0/12    scram-sha-256
```

Reload PostgreSQL:

```bash
sudo systemctl reload postgresql
```

Dam bao user app co quyen tren database/schema:

```sql
ALTER DATABASE ecommerce OWNER TO ecommerce;
\connect ecommerce
ALTER SCHEMA public OWNER TO ecommerce;
GRANT ALL PRIVILEGES ON DATABASE ecommerce TO ecommerce;
GRANT ALL ON SCHEMA public TO ecommerce;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO ecommerce', r.tablename);
  END LOOP;

  FOR r IN SELECT sequencename FROM pg_sequences WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO ecommerce', r.sequencename);
  END LOOP;
END $$;
```

Test connection tu container API:

```bash
docker compose -f docker-compose.yml -f docker-compose.host-db.yml run --rm --no-deps api node -e "const {Client}=require('pg'); const c=new Client({connectionString:process.env.DATABASE_URL}); c.connect().then(()=>c.query('select current_user,current_database()')).then(r=>console.log(r.rows)).finally(()=>c.end()).catch(e=>{console.error(e.message); process.exit(1)})"
```

Seed demo/staging voi host DB:

```bash
docker compose -f docker-compose.yml -f docker-compose.host-db.yml run --rm --no-deps api npm run db:seed
```

Canh bao: `db:seed` xoa du lieu cu va tao lai seed product/order/customer demo. Khong chay tren production co du lieu that neu chua backup va chua chap nhan reset.

### 4.2. Server dung PostgreSQL container noi bo

Build image:

```bash
docker compose build api worker web admin-portal
```

Start PostgreSQL:

```bash
docker compose up -d postgres
docker compose ps postgres
```

Chay migration an toan:

```bash
docker compose --profile migration run --rm migrate
```

Neu can seed du lieu demo/staging, chi chay tren moi truong khong phai production:

```bash
docker compose run --rm --no-deps api npm run db:seed
```

## 5. Start app

```bash
docker compose up -d api worker web admin-portal
docker compose ps
```

Neu dang dung host DB override:

```bash
docker compose -f docker-compose.yml -f docker-compose.host-db.yml up -d --no-deps api worker web admin-portal caddy
docker compose -f docker-compose.yml -f docker-compose.host-db.yml ps
```

Health check noi bo tren server:

```bash
curl -fsS http://127.0.0.1:31082/api/v1/health/live
curl -fsS http://127.0.0.1:31082/api/v1/health/ready
curl -fsS http://127.0.0.1:31080/api/health
curl -fsS http://127.0.0.1:31081/api/health
```

Xem logs:

```bash
docker compose logs --tail=200 api
docker compose logs --tail=200 worker
docker compose logs --tail=200 web
docker compose logs --tail=200 admin-portal
```

## 6. Cau hinh Nginx

Tao file:

```bash
sudo nano /etc/nginx/sites-available/ecommerce
```

Noi dung mau:

```nginx
server {
    listen 80;
    server_name shop.example.com admin.example.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name shop.example.com;

    ssl_certificate /etc/letsencrypt/live/shop.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/shop.example.com/privkey.pem;

    client_max_body_size 20m;

    location /api/v1/ {
        proxy_pass http://127.0.0.1:31082/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Request-ID $request_id;
        proxy_read_timeout 60s;
    }

    location / {
        proxy_pass http://127.0.0.1:31080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Request-ID $request_id;
        proxy_read_timeout 60s;
    }
}

server {
    listen 443 ssl http2;
    server_name admin.example.com;

    ssl_certificate /etc/letsencrypt/live/admin.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.example.com/privkey.pem;

    client_max_body_size 20m;

    location /api/v1/ {
        proxy_pass http://127.0.0.1:31082/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Request-ID $request_id;
        proxy_read_timeout 60s;
    }

    location / {
        proxy_pass http://127.0.0.1:31081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Request-ID $request_id;
        proxy_read_timeout 60s;
    }
}
```

Bat site:

```bash
sudo ln -s /etc/nginx/sites-available/ecommerce /etc/nginx/sites-enabled/ecommerce
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Cap SSL

Lan dau, co the de Certbot tu sua Nginx:

```bash
sudo certbot --nginx -d shop.example.com -d admin.example.com
```

Sau khi Certbot tao certificate, kiem tra:

```bash
sudo certbot renew --dry-run
sudo nginx -t
sudo systemctl reload nginx
```

Neu dung Cloudflare/Load Balancer terminate TLS, co the bo Certbot tren server va de Nginx listen HTTP noi bo theo yeu cau ha tang.

## 8. Smoke test sau deploy

```bash
curl -fsS https://shop.example.com/api/health
curl -fsS https://admin.example.com/api/health
curl -fsS https://shop.example.com/api/v1/health/ready
curl -fsS https://admin.example.com/api/v1/health/ready
```

Kiem tra bang trinh duyet:

1. Mo `https://shop.example.com`.
2. Nhap so dien thoai.
3. Xem san pham.
4. Tao don test.
5. Vao `https://admin.example.com`.
6. Dang nhap admin.
7. Kiem tra don hang va integration job.
8. Kiem tra Google Sheet co dong don moi.

## 9. Quy trinh deploy phien ban moi

```bash
cd /opt/ecommerce
git fetch origin
git checkout main
git pull --ff-only

docker compose build api worker web admin-portal
docker compose up -d postgres
docker compose --profile migration run --rm migrate
docker compose up -d api worker web admin-portal

curl -fsS http://127.0.0.1:31082/api/v1/health/ready
curl -fsS http://127.0.0.1:31080/api/health
curl -fsS http://127.0.0.1:31081/api/health
sudo nginx -t
sudo systemctl reload nginx
```

Neu deploy tren server dung host DB override:

```bash
cd /opt/ecommerce
git fetch origin
git checkout main
git pull --ff-only

docker compose -f docker-compose.yml -f docker-compose.host-db.yml build api worker web admin-portal
docker compose -f docker-compose.yml -f docker-compose.host-db.yml run --rm --no-deps api npm run db:migrate:deploy
docker compose -f docker-compose.yml -f docker-compose.host-db.yml up -d --no-deps api worker web admin-portal caddy

curl -fsS http://127.0.0.1:31082/api/v1/health/ready
curl -fsS http://127.0.0.1:31080/api/health
curl -fsS http://127.0.0.1:31081/api/health
```

Neu chi sua `.env` CORS/API URL:

```bash
docker compose -f docker-compose.yml -f docker-compose.host-db.yml up -d --no-deps api
docker compose -f docker-compose.yml -f docker-compose.host-db.yml exec api node -e "console.log(process.env.API_CORS_ORIGINS)"
```

Neu sua `NEXT_PUBLIC_API_BASE_URL`, can rebuild frontend vi day la bien build-time:

```bash
docker compose -f docker-compose.yml -f docker-compose.host-db.yml build web admin-portal
docker compose -f docker-compose.yml -f docker-compose.host-db.yml up -d --no-deps web admin-portal
```

## 10. Rollback

Rollback app khi migration khong doi schema phuc tap:

```bash
cd /opt/ecommerce
git checkout <previous-good-sha>
docker compose build api worker web admin-portal
docker compose up -d api worker web admin-portal
```

Neu migration da apply va can rollback database:

1. Dung traffic ghi moi neu can.
2. Backup trang thai hien tai.
3. Restore PostgreSQL theo `documents/BACKUP_RESTORE.md`.
4. Checkout app version tuong ung schema da restore.
5. Start lai app va chay smoke test.

## 11. Lenh van hanh nhanh

```bash
docker compose ps
docker compose logs --tail=200 api
docker compose logs --tail=200 worker
docker compose restart api
docker compose restart worker
docker compose exec postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"
df -h
free -m
```

Don Docker cache/unused artifacts:

```bash
docker system df
docker builder prune -f
docker image prune -f
docker container prune -f
docker network prune -f
docker system df
```

Chi chay cac lenh manh hon sau khi chac khong can image/cache cu:

```bash
docker image prune -a -f
docker builder prune -a -f
```

Khong chay `docker volume prune` neu chua chac chan, vi co the xoa volume du lieu PostgreSQL/Caddy.

## 12. Luu y bao mat

- Khong public port PostgreSQL ra Internet.
- Khong log token, password, authorization header, promotion token, so dien thoai day du.
- `.env` va `secrets/google-service-account.json` phai nam ngoai Git.
- `API_AUTH_SECRET`, PostgreSQL password, Cloudinary secret va Google key phai luu trong secret manager hoac file server co permission han che.
- Tat Swagger production public bang `API_SWAGGER_ENABLED=false`.
- Dat `API_CORS_ORIGINS` dung domain that, khong dung wildcard.
