## Tech Stack & Runtime
- **Runtime:** Node.js (CommonJS or ES Modules — match `package.json`)
- **Web Framework:** Express.js (`express`)
- **ORM:** Sequelize (`sequelize`)
- **Database Driver:** MySQL2 (`mysql2`)
- **Environment Management:** `dotenv` (`.env`)

## Build, Run, & Test Commands
- **Start Dev Server:** `npm run dev` (or `npx nodemon server.js`)
- **Start Production Server:** `npm start` (or `node server.js`)
- **Run Tests:** `npm test`
- **Sequelize Migrations (Preferred over `sync()`):**
  - Run migrations: `npx sequelize-cli db:migrate`
  - Undo migration: `npx sequelize-cli db:migrate:undo`
  - Create migration: `npx sequelize-cli migration:generate --name <migration-name>`

## Database & Sequelize Guidelines
- **No `sync({ force: true })` or `sync({ alter: true })`** in production code. Always use `sequelize-cli` migrations for schema changes.
- **Environment Variables:** Load configuration via `process.env` (e.g., `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`).
- **Connection Instance:** Initialize Sequelize inside a dedicated `db.js` or `database.js` file using `new Sequelize(...)` with the `mysql` dialect and `mysql2` module.
- **Queries & Models:**
  - Define models using `sequelize.define()` or class-based models extending `Model`.
  - Always handle async/await try/catch blocks in controllers or wrap route handlers to prevent unhandled promise rejections.
  - Use parameterized queries or Sequelize built-in finders (`findAll`, `findOne`, `create`, `destroy`) to prevent SQL injection.

## Project Structure Conventions
- `server.js` or `app.js` — Entry point setting up Express middleware and starting the server.
- `config/` — Database configuration and Sequelize setup.
- `models/` — Sequelize model definitions and association hooks.
- `controllers/` — Request handling and business/response logic.
- `routes/` — Express router definitions mapped to controllers.
- `middlewares` — Custom middleware functions for request processing.
- `migrations/` — Database migration files managed by Sequelize CLI.

## Code Style & Rules
- Use `async/await` for asynchronous database and middleware operations.
- Always send proper HTTP status codes (`200`, `201`, `400`, `404`, `500`) and JSON error payloads.
- Do not hardcode database credentials or secrets; reference `.env`.
