# teacket — A simple ticketing system for employees

<p align="left">
    <img
        align="right"
        src="assets/logo.png"
        width="200"
        style="margin-left: 40px;"
    />
    <h3>About</h3>
    <b>Simple, intuitive and scalable</b> ticketing system for employees
</p>

### 💪 Features
- ✨ Create and manage tickets
- ⚙ Roles & Permissions
- 💬 Comments and change log
- 📎 Attachments
- 🔎 Search and filters
- 🔔 In-app notifications
- 📊 Analytics

## Stack
- **Backend:** [AdonisJS](https://adonisjs.com/)
- **Frontend:** [Edge.js 6](https://edgejs.dev/docs/introduction), [TailwindCSS](https://tailwindcss.com/)
- **Auth:** Session-based

## ⚡ Quick Start
### Requirements
- Node.js >= 24
- npm >= 11.12

### Installation
```bash
# Clone this repo
git clone https://github.com/shablin/teacket.git

cd teacket

# Install dependencies
npm install

# Configure env
cp .env.example .env

# Run migrations
node ace migration:run

# Run an application
node ace serve # you can use "--hmr" flag to run in hot reload mode

# Visit http://localhost:3333 in browser
```

## Project Structure
```
teacket/
....app/
    ....controllers/        HTTP controllers
    ....models/             Lucid models (see Lucid ORM)
    ....services/           Service layer/business-logic
    ....middleware/
    ....validators/         Data validation (see VineJS)
....database/
    ....migrations/         
    ....seeders/            Initial data
....resources/
    ....views/              HTML templates (see EdgeJS)
....start/
    ....routes.ts           Router/API
....ace.js                  CLI tool (see "node ace" command)
```

## See also
- [Roles & Permissions](https://github.com/shablin/teacket/blob/main/docs/permissions_and_roles.md)