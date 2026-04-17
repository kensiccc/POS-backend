# House Blend POS

A complete point-of-sale system with a Node.js backend, MySQL persistence, and a Vite/React front-end.

## Project structure

- `backend/` - Express API server and database utilities
- `server.js` - Backend entry point
- `print-server.js` - Thermal receipt PDF print service
- `pos.jsx/` - Vite React POS frontend
- `.env.example` - Example backend environment settings
- `pos.jsx/.env.example` - Example frontend environment settings

## Requirements

- Node.js 18+ / npm
- MySQL running locally or remotely
- Optional: 80mm thermal printer for print server

## Setup

1. Install backend dependencies:
   ```bash
   cd "c:\Users\ADMIN\Desktop\full ordering web"
   npm install
   ```
2. Install frontend dependencies:
   ```bash
   cd "c:\Users\ADMIN\Desktop\full ordering web\pos.jsx"
   npm install
   ```
3. Copy environment files:
   - `cp .env.example .env`
   - `cp pos.jsx/.env.example pos.jsx/.env`

4. Update `.env` with your MySQL credentials.

## Run locally

### Backend
```bash
cd "c:\Users\ADMIN\Desktop\full ordering web"
node server.js
```

### Frontend
```bash
cd "c:\Users\ADMIN\Desktop\full ordering web\pos.jsx"
npm run dev
```

### Print server (optional)
```bash
cd "c:\Users\ADMIN\Desktop\full ordering web"
node print-server.js
```

## Development notes

- Backend API runs on `http://localhost:3000`
- Frontend runs on `http://localhost:5177`
- Use the demo credentials:
  - `admin@houseblend.local` / `Admin123!`
  - `cashier@houseblend.local` / `Cashier123!`

## Git upload

1. Initialize repo if needed:
   ```bash
git init
   ```
2. Add files and commit:
   ```bash
git add .
git commit -m "Clean repo and add README"
   ```
3. Add remote and push:
   ```bash
git remote add origin <your-repo-url>
git push -u origin main
   ```

> Make sure `.env` files are not committed. The `.gitignore` file now excludes sensitive configs, `node_modules`, build output, and temporary files.
