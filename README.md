# SSO_Check

Separated stack:

- Frontend: React + TailwindCSS + Vite, base path `/SSO_Check/`, dev port `3000`
- Backend: Go API, default port `10100`
- API Gateway default: `http://<hostname>:8000/api/SSO_Check`
- Production backend can serve the built frontend at `/SSO_Check/`

## Windows Dev

Start both backend and frontend:

```bat
start.bat
```

Stop services started by the scripts:

```bat
stop.bat
```

Open:

```text
http://localhost:3000/SSO_Check/
http://localhost:3000/SSO_Check/?userCheck=T9058
http://localhost:3000/SSO_Check/index.php?userCheck=T9058
```

## Windows Build EXE

Build frontend and Windows backend executable:

```bat
build.bat
```

Output:

```text
dist/windows/sso-check-backend.exe
dist/windows/start-production.bat
```

Run the built package from this workspace:

```bat
start_exe.bat
```

Or run the packaged production script:

```bat
dist\windows\start-production.bat
```

Production URL:

```text
http://localhost:10100/SSO_Check/
```

## Linux Deploy

Build a Linux amd64 package:

```bash
./build-linux.sh
```

From Windows, build the same Linux amd64 package with:

```bat
build-linux.bat
```

Output:

```text
dist/linux/sso-check-backend
dist/linux/start-production.sh
```

Run in this workspace:

```bash
./start-linux.sh
```

Stop:

```bash
./stop-linux.sh
```

Or copy `dist/linux` to a server and run:

```bash
./start-production.sh
```

## Environment

Defaults are compatible with the original PHP system. Override as needed:

```text
PORT=10100
DB_SERVER=10.0.32.165
DB_NAME=SSO_Agent_tnlx
DB_USER=sa
DB_PASS=Thanulux2569
CORS_ORIGIN=http://localhost:3000
APP_ROOT=/path/to/SSO_Check
FRONTEND_DIR=/path/to/frontend/dist
UPLOAD_DIR=/path/to/SSO_Check/uploads/imgs
UPLOAD_URL=uploads/imgs/
```

## Backend Package Folders

Production backend needs these folders/files:

- `sso-check-backend` or `sso-check-backend.exe`
- `frontend/dist` for the React app served at `/SSO_Check/`
- `uploads/imgs` for uploaded images
- `start-production.sh` or `start-production.bat`

By default uploads are saved under `APP_ROOT/uploads/imgs` and served as `/uploads/imgs/...`.

## API

Frontend calls the API Gateway by default:

- `GET http://<hostname>:8000/api/SSO_Check/agents?action=read`
- `GET http://<hostname>:8000/api/SSO_Check/agents?action=get&id=1`
- `GET http://<hostname>:8000/api/SSO_Check/export?all=1`
- `POST http://<hostname>:8000/api/SSO_Check/agents`
- Static uploads: `http://<hostname>:8000/api/SSO_Check/uploads/...`

Set `VITE_API_BASE` at build time to override the gateway base.

Backend direct endpoints are still available:

- `GET /api/agents?action=read`
- `GET /api/agents?action=read&Status_mac=C`
- `GET /api/agents?action=get&id=1`
- `GET /api/export?all=1` exports all `Agent_TNLX` rows.
- `GET /api/export?userCheck=T9058&userCheck=T1234` exports selected `user_check` values.
- `POST /api/agents` with `action=create|update|delete`
- Static uploads: `/uploads/...`
