# Contributing to Teacket

Thank you for interest in this project! ❤️

All types of contributions are encouraged and valued. Please make sure to read the relevant section before making your contribution.

# Table of Contents
- [Quick Start](#quick-start)
- [Contribution Types](#contribution-types)
    - [Bug Report](#bug-report)
    - [Suggest a feature](#suggest-a-feature)
    - [Pull Requests](#pull-requests)
        - [PR Requirements](#pr-requirements)
- [Testing](#testing)
    - [Structure](#structure)
    - [Run Tests](#run-tests)
    - [What should be tested](#what-should-be-tested)

# Quick Start

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/teacket.git
cd teacket

# Install dependencies
npm install

# Configure env
cp .env.example .env

# Run migrations
node ace migration:run

# Run in dev mode
npm run dev
```

# Contribution Types
### 🐛 Bug Report
1. Make sure there's no issue that you want to create
2. Create a new issue from the template

### 💡 Suggest a feature
1. Describe your idea. Try to answer yourself:
    - What should it do?
    - Why is it useful?
2. If you can, create concept and attach it

### ⚡ Pull Requests
1. Create a new branch, for example: `git checkout -b feat/new-feature`
2. Make changes
3. Add tests (see [this](#testing))
4. Check code with linter: `npm run lint`
5. Push and open PR

#### PR Requirements
- Description about made changes
- Link to related issue
- Tests are passing locally
- Code follows to the project's code style

# Testing
## Structure
Different kinds of tests are organized in the different directories:
```
tests/
....functional/
....unit/
....integration/
```

## Run Tests
```bash
# Run all
npm test # or "node ace test"
```

## What should be tested
- Auth (Sign In/Sign Out, routing security)
- Ticket's CRUD
- Status transition
- Access rights by roles
- Comments and attachments