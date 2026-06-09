<script setup lang="ts">
// Submit page — guides users to GitHub PR flow
</script>

<template>
  <div class="submit-page">
    <section class="page-header">
      <div class="container">
        <p class="section-eyebrow">Open Source</p>
        <h1 class="section-title">Submit Your App</h1>
        <p class="page-subtitle">
          The registry is GitHub-based. Submit your app by opening a Pull Request with a JSON file.
        </p>
      </div>
    </section>

    <div class="container submit-body">
      <!-- Steps -->
      <section class="steps-section" aria-labelledby="steps-heading">
        <h2 id="steps-heading" class="steps-heading">How to submit</h2>
        <div class="steps">
          <div class="step" v-for="(step, i) in steps" :key="i">
            <div class="step-num" aria-hidden="true">{{ i + 1 }}</div>
            <div class="step-content">
              <h3 class="step-title">{{ step.title }}</h3>
              <p class="step-desc">{{ step.desc }}</p>
              <div v-if="step.code" class="code-block step-code">{{ step.code }}</div>
            </div>
          </div>
        </div>
        <a
          id="open-pr-btn"
          href="https://github.com/frappe/frappe-app-registry/compare"
          target="_blank"
          rel="noopener"
          class="btn btn-primary cta-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0112 6.8c.85.004 1.71.11 2.51.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10.01 10.01 0 0022 12c0-5.52-4.48-10-10-10z"/>
          </svg>
          Open Pull Request on GitHub
        </a>
      </section>

      <!-- Schema preview -->
      <section class="schema-section" aria-labelledby="schema-heading">
        <h2 id="schema-heading" class="schema-heading">Required JSON structure</h2>
        <p class="schema-desc">
          Create <code class="inline-code">apps/your-app-slug.json</code> with this structure.
          Copy the <a href="https://github.com/frappe/frappe-app-registry/blob/main/apps/example-app.json" target="_blank" rel="noopener" class="text-link">example-app.json</a> as a starting point.
        </p>
        <div class="code-block schema-code">{{ schemaExample }}</div>
      </section>

      <!-- Required fields table -->
      <section class="fields-section" aria-labelledby="fields-heading">
        <h2 id="fields-heading" class="fields-heading">Required fields</h2>
        <div class="table-wrap">
          <table class="fields-table" aria-label="Required fields">
            <thead>
              <tr>
                <th>Field</th>
                <th>Type</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="field in requiredFields" :key="field.name">
                <td><code class="inline-code">{{ field.name }}</code></td>
                <td><span class="tag">{{ field.type }}</span></td>
                <td>{{ field.desc }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  data() {
    return {
      steps: [
        {
          title: 'Fork the repository',
          desc: 'Fork frappe/frappe-app-registry on GitHub and clone it locally.',
          code: 'git clone https://github.com/your-username/frappe-app-registry',
        },
        {
          title: 'Create your app JSON',
          desc: 'Copy apps/example-app.json to apps/your-app-slug.json and fill in your details.',
          code: 'cp apps/example-app.json apps/my-app.json',
        },
        {
          title: 'Validate locally',
          desc: 'Run the validator to catch any errors before submitting.',
          code: 'npm install && npm run validate',
        },
        {
          title: 'Open a Pull Request',
          desc: 'Push your branch and open a PR. CI will validate automatically and report any issues.',
          code: null,
        },
      ],
      schemaExample: `{
  "slug": "my-app",
  "name": "my_app",
  "title": "My App",
  "description": "What your app does (10-500 chars).",
  "repository": "https://github.com/your-org/my-app",
  "license": "MIT",
  "frappe_versions": ["15", "16"],
  "required_apps": ["frappe"],
  "categories": ["Utilities"],
  "tags": ["utilities", "tools"],
  "install": {
    "method": "bench",
    "command": "bench get-app my_app",
    "app_name": "my_app"
  },
  "links": {
    "docs": "https://github.com/your-org/my-app#readme"
  },
  "meta": {
    "source": "manual",
    "verified": false,
    "status": "active"
  }
}`,
      requiredFields: [
        { name: 'slug', type: 'string', desc: 'URL-safe ID matching the filename (kebab-case)' },
        { name: 'name', type: 'string', desc: 'Python package name (snake_case)' },
        { name: 'title', type: 'string', desc: 'Human-readable display name' },
        { name: 'description', type: 'string', desc: 'Short description (10–500 characters)' },
        { name: 'repository', type: 'string (URI)', desc: 'Public GitHub repository URL' },
        { name: 'license', type: 'string', desc: 'SPDX license (MIT, GPL-3.0, AGPL-3.0, …)' },
        { name: 'frappe_versions', type: 'string[]', desc: 'Supported versions: "14", "15", "16"' },
        { name: 'required_apps', type: 'string[]', desc: 'Must include "frappe"; add "erpnext" if needed' },
        { name: 'categories', type: 'string[]', desc: 'From allowed list (CRM, HR, Accounting, …)' },
        { name: 'install.method', type: 'string', desc: '"bench", "pip", or "manual"' },
        { name: 'install.command', type: 'string', desc: 'Full installation command' },
        { name: 'install.app_name', type: 'string', desc: 'App name used in the install command' },
      ],
    }
  }
}
</script>

<style scoped>
.submit-page { padding-bottom: 80px; }
.page-header { padding: 48px 0 40px; border-bottom: 1px solid var(--border); }
.page-subtitle { color: var(--text-2); font-size: 16px; margin-top: 8px; max-width: 560px; }
.submit-body { display: flex; flex-direction: column; gap: 60px; padding-top: 56px; max-width: 860px; }

/* Steps */
.steps-heading, .schema-heading, .fields-heading {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.steps { display: flex; flex-direction: column; gap: 28px; }
.step { display: grid; grid-template-columns: 40px 1fr; gap: 16px; align-items: start; }
.step-num {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: hsla(221,80%,55%,0.15);
  border: 1px solid hsla(221,80%,55%,0.3);
  color: var(--brand-400);
  font-size: 14px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.step-content { display: flex; flex-direction: column; gap: 8px; }
.step-title { font-size: 16px; font-weight: 700; }
.step-desc { font-size: 14px; color: var(--text-2); }
.step-code { font-size: 12px; color: var(--accent-400); }
.cta-btn { margin-top: 24px; align-self: flex-start; }

/* Schema */
.schema-desc { font-size: 14px; color: var(--text-2); margin-bottom: 16px; line-height: 1.7; }
.schema-code { font-size: 12px; line-height: 1.7; color: var(--text-2); white-space: pre; overflow-x: auto; }
.text-link { color: var(--brand-400); }
.text-link:hover { text-decoration: underline; }

/* Table */
.table-wrap { overflow-x: auto; }
.fields-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.fields-table th {
  text-align: left;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-3);
}
.fields-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  color: var(--text-2);
  vertical-align: top;
}
.fields-table tr:last-child td { border-bottom: none; }
.fields-table tr:hover td { background: var(--bg-3); }

.inline-code { font-family: var(--font-mono); font-size: 12px; color: var(--accent-400); background: var(--bg-2); padding: 2px 6px; border-radius: 4px; }
</style>
