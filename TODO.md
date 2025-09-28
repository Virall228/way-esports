# TODO: Fix All Errors in WAY-Esports Backend

This file tracks progress on fixing TypeScript compilation errors, import/export issues, path inconsistencies, and Docker build failures as per the approved plan.

## Steps:

1. [ ] Add default export to `backend/src/config/index.ts` to match import expectations.

2. [ ] Update `backend/src/app.ts`: Fix import paths (after migrations), remove unused imports, use environment variable for TELEGRAM_SDK_AUTH_TOKEN, remove mongoose.connect, improve error handler types.

3. [ ] Update `backend/src/index.ts`: Remove duplicate app setup, import and use app from './app', import config, add mongoose.connect, keep server listen and health check.

4. [ ] Migrate `backend/routes/tournaments.ts` to `backend/src/routes/tournaments.ts`: Ensure default export for router, fix any internal imports.

5. [ ] Migrate `backend/middleware/adminAuth.ts` to `backend/src/middleware/adminAuth.ts`: Ensure default export for middleware function.

6. [ ] Migrate other middleware files (auth.ts, mockAuth.ts, subscriptionAuth.ts, tournament-auth.ts) to `backend/src/middleware/`: Add default exports.

7. [ ] Migrate other route files (news.ts, users.ts, withdrawals.ts, auth.js -> auth.ts, etc.) to `backend/src/routes/`: Convert JS to TS where needed, add default exports, fix types.

8. [ ] Migrate model files (Tournament.ts, User.ts, etc.) from root to `backend/src/models/`: Ensure proper exports.

9. [ ] Update all internal imports in app.ts, index.ts, and migrated files to use relative paths within src/ (e.g., './routes/tournaments').

10. [ ] Update `backend/tsconfig.json`: Add "allowJs": true if needed, exclude root routes/middleware/models to avoid duplication.

11. [ ] Run `cd backend && npm run build` to verify no TypeScript errors.

12. [ ] Run `docker-compose up --build` to test Docker build and deployment.

13. [ ] Run `cd backend && npm run dev` to test locally.

14. [ ] Run `cd backend && npm test` if applicable to verify tests pass.

After completing all steps, remove or archive this file.
