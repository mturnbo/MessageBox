# MessageBox API (Node Express)
Node Express API for simple user messaging system

## Features

1. ES6+ features
2. SQL database implementation with **[Sequelize v6](https://sequelize.org/docs/v6/)** for **mysql dialect** (you can change anytime).
4. Including authentication system with rest api endpoints.
5. Test cases written with sinon and sandbox.
6. Api documentation with [swagger](https://swagger.io/).

## Authentication Endpoints

| Route | HTTP Verb | Request Body                                          | Description                   |
| --- | --- |-------------------------------------------------------|-------------------------------|
| /auth/ | `POST` | {"username": "testuser1", "password": "password123" } | Login and get user JWT token. |

## User Endpoints
| Route             | HTTP Verb | Request Body                                    | Description                |
|-------------------|-----------|-------------------------------------------------|----------------------------|
| /users/           | `GET`     |                                                 | Get all users paginated    |
| /users/:id        | `GET`     |                                                 | Get user by id             |
| /users/update     | `POST`    | { "id": "1234", "userUpdate": { `NEW ATTRIBUTES` } | Update user attributes by id |
| /users/delete/:id | `POST`    |  | Delete user by id |


## Message Endpoints
## User Endpoints
| Route         | HTTP Verb | Request Body                                    | Description       |
|---------------|-----------|-------------------------------------------------|-------------------|
| /messages/:id | `GET`     |                                                 | Get message by id |


## Database Selection
This project is designed for SQL databases. You can change default dialect (mysql).
To do this, firstly select your database from the table below.
Modify `DB_TYPE` in environment variables which is used for the `dialect` property in `src/config/database.js` and install required npm package(s) for this database.

For more info, visit [sequelize docs](https://sequelize.org/docs/v6/other-topics/dialect-specific-things/)

**Note:** The default and active database is mysql.

| Database | Dialect | Required npm Package(s) |
| --- | --- |-------------------------|
| MySQL | mysql | `npm install mysql2`    |
| MariaDB | mariadb | `npm install mariadb`      |
| PostgreSQL | postgres | `npm install pg pg-hstore` |
| SQLite | sqlite | `npm install sqlite3`      |
| Microsoft SQL Server | mssql | `npm install tedious`      |