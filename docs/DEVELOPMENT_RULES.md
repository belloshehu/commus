# Commus Repository Development Policy

This document is the official source of truth for repository management, Git workflow, commit conventions, branch strategy, code quality standards, and development practices for the **Commus** project.

---

## 1. Repository Management

The project exists within an initialized Git repository.

### Rules & Mandates:
* **DO NOT** create a new Git repository.
* **DO NOT** remove or delete the existing `.git` directory.
* **DO NOT** change configured remote repositories.
* **DO NOT** force-push (`git push --force`).
* **DO NOT** rewrite Git history.
* **DO NOT** delete branches on remote unless explicitly instructed by the developer.
* **DO NOT** modify GitHub repository settings.

### Pre-Change Verification:
Before performing file or repository changes, always inspect state:
```bash
git status
git branch -a
git remote -v
```
*Never assume the repository working tree is clean.*

---

## 2. Branching Strategy

The repository follows a structured branch model:

* `main`: Production-ready, stable codebase.
* `develop`: Integration branch for active feature development.
* `feature/<short-description>`: New feature implementations (e.g., `feature/incident-reporting`, `feature/community-discovery`).
* `fix/<short-description>`: Bug fixes and patches (e.g., `fix/evidence-upload`, `fix/storage-rules`).
* `refactor/<short-description>`: Code structure or architectural improvements without behavior changes.
* `chore/<short-description>`: Maintenance tasks, dependency updates, build tooling updates.
* `docs/<short-description>`: Documentation additions and revisions.

*Do not create unnecessary branches for trivial single-file edits unless explicitly requested.*

---

## 3. Main Branch Protection

* **Never commit directly to `main` for normal feature development.**
* All changes must adhere to the workflow:
  $$\text{Feature Branch} \longrightarrow \text{Verification} \longrightarrow \text{Commit} \longrightarrow \text{Review} \longrightarrow \text{Merge to Develop/Main}$$
* Do not merge automatically without explicit user instruction.

---

## 4. Commit Message Convention

Commits must follow the **Conventional Commits** format:

$$\langle\text{type}\rangle: \langle\text{description}\rangle$$

### Allowed Commit Types:
* `feat:` A new feature or user-facing capability.
* `fix:` A bug fix or patch.
* `refactor:` Code changes that neither fix a bug nor add a feature.
* `docs:` Documentation updates.
* `test:` Adding or modifying automated unit/integration tests.
* `chore:` Build processes, configuration, or dependency updates.
* `perf:` A code change that improves performance.
* `build:` Changes that affect the build system or external dependencies.
* `ci:` Changes to continuous integration configurations.

### Examples:
* `feat: add community incident reporting`
* `feat: add high risk incident classification`
* `fix: prevent unauthorized incident access`
* `fix: secure evidence storage rules`
* `refactor: separate authority notification service`
* `test: add incident authorization tests`
* `docs: document reporting workflow`
* `chore: update dependencies`

### Guidelines:
* Use concise, imperative language ("add", "fix", "update", not "added" or "adding").
* Describe the actual change clearly.
* **Forbidden vague messages**: "updates", "changes", "fixed stuff", "work", "final", "misc".

---

## 5. Commit Granularity & Size

* Prefer small, logically grouped commits representing one coherent change.
* **Do NOT combine unrelated changes** (e.g., authentication logic, UI styling, database security rules, and notification engine) into a single commit.

---

## 6. Pre-Commit Verification Requirements

Before creating any commit, run mandatory verification checks.

### Mandatory Verification:
1. **Linting**: `npm run lint`
2. **Type Checking**: `npm run type-check` (or `npx tsc --noEmit`)
3. **Automated Tests**: `npm run test` (or `npx vitest run`)
4. **Production Build** (for large changes): `npm run build`

*Do not commit code containing known TypeScript errors, lint violations, or failing tests.*

---

## 7. Secrets & Credential Protection

### FORBIDDEN Files in Git:
* `.env`, `.env.local`, `.env.production`, `.env.development`
* Firebase service-account JSON keys (`service-account.json`)
* Private keys, SSL/TLS certificates, JWT private keys
* API keys, database credentials, OAuth tokens, passwords

### Mandates:
* Ensure `.gitignore` explicitly ignores all sensitive environment files and private credentials.
* Use `.env.example` to document required configuration variables.
* `.env.example` must contain **placeholders only** (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY=mock-api-key`).

---

## 8. Generated Files & Artifacts

* Do not commit build artifacts (`.next/`, `out/`, `dist/`), node modules (`node_modules/`), temporary logs, or OS metadata (`.DS_Store`).
* Always check `git status` before staging files (`git add`).

---

## 9. Dependency Policy

Before introducing a new external package or dependency:
1. Determine whether existing dependencies or standard platform APIs can solve the requirement.
2. Provide explicit justification for why the package is required.
3. Select mature, actively maintained, and audited libraries.
4. Avoid adding packages for trivial utility functions.

---

## 10. Security-Sensitive Files Policy

The following areas are classified as **High-Impact Security Components**:
* Database rules (`database.rules.json`)
* Storage security rules (`storage.rules`)
* Authorization & RBAC logic (`src/lib/auth.ts`)
* Firebase Admin SDK handlers (`src/lib/firebase/admin.ts`)

*Any modification to security-sensitive files requires thorough test verification of authorization boundaries.*

---

## 11. Synthetic Test Data Mandate

* **NEVER** place real incident reports, real citizen identities, real police/authority data, or real evidence files inside the repository.
* All development, testing, and staging environments must exclusively utilize **synthetic test datasets** (e.g., `src/lib/synthetic-data.ts`).

---

## 12. Destructive Git Operations Safety

**NEVER** execute the following commands without explicit developer authorization:
* `git reset --hard`
* `git clean -fd`
* `git push --force` / `git push --force-with-lease`
* `git rebase`

*Never discard uncommitted user changes to force a clean working tree state.*

---

## 13. Preservation of Existing Functionality

Before modifying existing code:
1. Inspect the existing implementation and understand its operational context.
2. Preserve working interfaces, contracts, and functionalities.
3. Apply minimal, surgical edits to achieve requirements rather than rewriting working modules.

---

## 14. Phase-Based Development Workflow

Commus development proceeds in structured phases. Each phase requires:
$$\text{Implementation} \longrightarrow \text{Tests} \longrightarrow \text{Verification} \longrightarrow \text{Documentation} \longrightarrow \text{Git Commit}$$

*Do not silently begin work on unrelated future phases until the active phase is complete and verified.*

---

## 15. Post-Phase Commit Workflow

Upon phase completion:
1. Run `git status` to review changed files.
2. Inspect `git diff` for unintended edits.
3. Run automated tests (`npm run test`).
4. Run linter (`npm run lint`).
5. Run type-checker (`npm run type-check`).
6. Run build (`npm run build`) when applicable.
7. Craft a precise Conventional Commit.

---

## 16. Developer Reporting Standard

At the conclusion of each development phase, provide a structured report detailing:
* **Files Created**
* **Files Modified**
* **Major Functionality Introduced**
* **Tests Executed**
* **Verification Results**
* **Dependencies Added**
* **Git Branch & Commit Hash**
* **Remaining Open Items / Next Steps**

*Never declare a phase complete if verification checks have failed.*

---

## 17. Remote Operations & Ownership

* The developer retains complete ownership of remote repository operations (pushing to GitHub, managing PRs, setting branch protections).
* Antigravity prepares commits locally.
* **Do NOT push commits to remote repositories unless explicitly instructed by the developer.**

---

## 18. Core Golden Rule

$$\text{Small Change} \longrightarrow \text{Verify} \longrightarrow \text{Review} \longrightarrow \text{Commit}$$

*Avoid massive, monolithic implementation chunks that hinder debugging and auditability.*
