## 🛡️ Description & Motivation
Provide a summary of the changes made and the motivation behind this Pull Request.

- Related Issue: #
- Component(s) Impacted: [ ] UI / Components  [ ] Security / Firewall  [ ] State Storage  [ ] Operations / CI-CD

---

## 🔒 Security & Quality Verification Checklist

Please verify that the PR adheres to StudyFlow security standards:

- [ ] **Input Sanitization & Firewall**: All user inputs (tasks, quick notes, URLs, prompts) are inspected against XSS and script injection.
- [ ] **URL Handling**: Any outbound or user-supplied link uses `safeUrl` validation and `rel="noopener noreferrer"`.
- [ ] **Data Schema Integrity**: Zod schemas are updated if state structures change.
- [ ] **No Secret Leakage**: No hardcoded API keys or credentials added.
- [ ] **TypeScript Check**: `npx tsc --noEmit` passes with 0 errors.
- [ ] **ESLint & Formatting**: `npm run lint` passes cleanly.

---

## 🧪 How Has This Been Tested?
Describe the tests executed to verify your changes:

- [ ] Local dev server (`npm run dev`) verified visually.
- [ ] Security test payload / XSS test strings executed.
- [ ] Production build (`npm run build`) verified clean compile.
