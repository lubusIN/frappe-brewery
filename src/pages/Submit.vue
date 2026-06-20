<script setup lang="ts">
import { FeatherIcon, Button } from 'frappe-ui'

const steps = [
  {
    title: 'Fork the repository',
    desc: 'Fork lubusIN/frappe-brewery on GitHub and clone it locally.',
    code: 'git clone https://github.com/your-username/frappe-brewery',
    icon: 'git-branch',
  },
  {
    title: 'Create your app JSON',
    desc: 'Copy apps/_example-app.json to apps/your-app-slug.json and fill in your details.',
    code: 'cp apps/_example-app.json apps/my-app.json',
    icon: 'file-plus',
  },
  {
    title: 'Validate locally',
    desc: 'Run the validator to catch any schema errors before submitting.',
    code: 'npm install && npm run brewery:validate',
    icon: 'check-square',
  },
  {
    title: 'Open a Pull Request',
    desc: 'Push your branch and open a PR. GitHub Actions CI validates automatically.',
    code: null,
    icon: 'git-pull-request',
  },
]

const requiredFields = [
  { name: 'slug', type: 'string', desc: 'URL-safe ID matching the filename (e.g. my-app)' },
  { name: 'name', type: 'string', desc: 'Python package name in snake_case' },
  { name: 'title', type: 'string', desc: 'Human-readable display name' },
  { name: 'description', type: 'string', desc: 'Short description (10–500 characters)' },
  { name: 'repository', type: 'uri', desc: 'Public GitHub repository URL' },
  { name: 'license', type: 'string', desc: 'SPDX identifier (MIT, GPL-3.0, AGPL-3.0…)' },
  { name: 'frappe_versions', type: 'string[]', desc: 'Supported versions: "14", "15", "16"' },
  { name: 'required_apps', type: 'string[]', desc: 'Must include "frappe"; add "erpnext" if needed' },
  { name: 'categories', type: 'string[]', desc: 'From allowed list (CRM, HR, Accounting…) (max 4)' },
  { name: 'tags', type: 'string[]', desc: 'Free-form tags (max 4) to describe the app.' },
  { name: 'install_commands', type: 'string[]', desc: 'List of bench installation commands' },
  { name: 'min_frappe_version', type: 'string', desc: 'Minimum Frappe version required (e.g., "14.0.0")' },
  { name: 'install_branches', type: 'object', desc: 'Maps Frappe versions to specific installation branches' },
]

const schemaExample = `{
  "slug": "my-app",
  "name": "my_app",
  "title": "My App",
  "description": "What your app does.",
  "repository": "https://github.com/your-org/my-app",
  "license": "MIT",
  "frappe_versions": ["15", "16"],
  "min_frappe_version": "15.0.0",
  "install_branches": {
    "15": "version-15",
    "16": "version-16"
  },
  "required_apps": ["frappe"],
  "categories": ["Utilities"],
  "tags": ["awesome", "tool"],
  "install_commands": [
    "bench get-app https://github.com/your-org/my-app",
    "bench --site [site-name] install-app my_app",
    "bench --site [site-name] migrate",
    "bench restart"
  ],
  "meta": {
    "source": "manual",
    "verified": false,
    "status": "active"
  }
}`
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-10">
    <!-- Header -->
    <div class="mb-10 pb-8 border-b border-outline-gray-1">
      <p class="text-xs font-semibold uppercase tracking-widest text-ink-gray-4 mb-2">Open Source</p>
      <h1 class="text-3xl font-bold text-ink-gray-9">Submit Your App</h1>
      <p class="mt-3 text-base text-ink-gray-5 leading-relaxed">
        The easiest way to submit your app is by opening an Issue. Our automated bot will extract your details and create a PR for you! Alternatively, you can open a Pull Request manually.
      </p>
      <div class="mt-4 p-4 rounded-lg bg-surface-gray-1 border border-outline-gray-2">
        <p class="text-sm text-ink-gray-6 leading-relaxed">
          <strong class="text-ink-gray-8">Review Process:</strong> <br/>
          Each submission will go through automated checks and manual review. Acceptance of an app is at the sole discretion of the maintainers. Maintainers will perform thorough checks for AI slop, UI/UX quality, and code standards.
        </p>
      </div>
      <div class="flex gap-3 mt-5">
        <Button
          id="open-issue-btn"
          link="https://github.com/lubusIN/frappe-brewery/issues/new?template=submit-app.yml"
          variant="solid"
          theme="gray"
          icon-left="github"
        >
          Submit via Issue (Fastest)
        </Button>
        <Button
          id="open-pr-btn"
          link="https://github.com/lubusIN/frappe-brewery/compare"
          variant="subtle"
          theme="gray"
        >
          Submit via PR
        </Button>
      </div>
    </div>

    <!-- Option 1: Issue -->
    <section class="mb-12" aria-labelledby="issue-heading">
      <h2 id="issue-heading" class="text-lg font-semibold text-ink-gray-8 mb-4">Option 1: Automated Issue (Recommended)</h2>
      <p class="text-sm text-ink-gray-6 leading-relaxed mb-4">
        Simply click the <strong>Submit via Issue</strong> button above and fill out the short form with your repository URL. Our automated pipeline will clone your repository, extract your app's supported versions, license, and installation branches, and instantly generate a Pull Request on your behalf!
      </p>
    </section>

    <!-- Option 2: PR -->
    <section class="mb-12" aria-labelledby="steps-heading">
      <h2 id="steps-heading" class="text-lg font-semibold text-ink-gray-8 mb-6">Option 2: Manual Pull Request</h2>
      <div class="flex flex-col">
        <div v-for="(step, i) in steps" :key="i" class="flex gap-4 py-6 border-b border-outline-gray-1 last:border-b-0">
          <div class="w-7 h-7 rounded-full bg-surface-gray-2 flex items-center justify-center shrink-0 mt-0.5">
            <span class="text-sm font-medium text-ink-gray-9">{{ i + 1 }}</span>
          </div>
          <div class="flex-1">
            <h3 class="text-base font-semibold text-ink-gray-9 mb-1.5">{{ step.title }}</h3>
            <p class="text-sm text-ink-gray-6 leading-relaxed">{{ step.desc }}</p>
            <div v-if="step.code" class="mt-4 rounded-lg overflow-hidden border border-outline-gray-2">
              <div class="px-4 py-3 text-xs font-mono text-ink-gray-6 bg-surface-gray-1 overflow-x-auto">{{ step.code }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Schema -->
    <section class="mb-12" aria-labelledby="schema-heading">
      <h2 id="schema-heading" class="text-lg font-semibold text-ink-gray-8 mb-2">Required JSON structure</h2>
      <p class="text-sm text-ink-gray-5 mb-4">
        Create <code class="font-mono text-xs bg-surface-gray-2 px-1.5 py-0.5 rounded border border-outline-gray-1">apps/your-app-slug.json</code> with this structure. Copy
        <a href="https://github.com/lubusIN/frappe-brewery/blob/main/apps/_example-app.json" target="_blank" rel="noopener" class="text-ink-blue-2 hover:underline">apps/_example-app.json</a> as a starting point.
      </p>
      <div class="rounded-lg border border-outline-gray-2 overflow-hidden">
        <div class="flex items-center gap-2 px-4 py-2.5 bg-surface-gray-1 border-b border-outline-gray-1">
          <span class="w-2.5 h-2.5 rounded-full bg-red-300"></span>
          <span class="w-2.5 h-2.5 rounded-full bg-yellow-300"></span>
          <span class="w-2.5 h-2.5 rounded-full bg-green-300"></span>
          <span class="ml-2 text-xs text-ink-gray-3 font-mono">apps/my-app.json</span>
        </div>
        <pre class="p-5 font-mono text-xs text-ink-gray-6 leading-relaxed overflow-x-auto bg-surface-white">{{ schemaExample }}</pre>
      </div>
    </section>

    <!-- Required fields table -->
    <section aria-labelledby="fields-heading">
      <h2 id="fields-heading" class="text-lg font-semibold text-ink-gray-8 mb-4">Required fields</h2>
      <div class="rounded-lg border border-outline-gray-1 overflow-hidden">
        <table class="w-full text-sm" aria-label="Required fields">
          <thead>
            <tr class="bg-surface-gray-1 border-b border-outline-gray-1">
              <th class="text-left px-4 py-2.5 text-xs font-semibold text-ink-gray-4 uppercase tracking-wider">Field</th>
              <th class="text-left px-4 py-2.5 text-xs font-semibold text-ink-gray-4 uppercase tracking-wider">Type</th>
              <th class="text-left px-4 py-2.5 text-xs font-semibold text-ink-gray-4 uppercase tracking-wider">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-gray-1">
            <tr v-for="field in requiredFields" :key="field.name" class="hover:bg-surface-gray-1 transition-colors">
              <td class="px-4 py-3">
                <code class="font-mono text-xs text-ink-gray-7 bg-surface-gray-2 px-1.5 py-0.5 rounded border border-outline-gray-1">{{ field.name }}</code>
              </td>
              <td class="px-4 py-3">
                <span class="text-xs font-medium text-ink-blue-2 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">{{ field.type }}</span>
              </td>
              <td class="px-4 py-3 text-ink-gray-5 text-xs leading-relaxed">{{ field.desc }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
