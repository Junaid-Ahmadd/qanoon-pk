# Qanoon.pk

**Free legal guides for every Pakistani — ہر پاکستانی کے لیے مفت قانونی رہنمائی**

A community-driven legal resource website focused on tenant and landlord rights in Punjab, Pakistan. Built with Next.js (App Router), Tailwind CSS, and Markdown files — no database required.

---

## What this project is

Qanoon.pk helps ordinary Pakistanis:
- **Understand legal processes** — step-by-step guides in plain language
- **Know the law** — plain-language breakdowns of relevant legislation
- **Use legal documents** — bilingual (English + Urdu) document templates with fillable fields

Starting niche: **Tenant and landlord rights in Punjab under the Rent Restriction Ordinance 1959.**

---

## Tech stack

| Tool | Purpose |
|---|---|
| Next.js 15+ (App Router) | Framework |
| Tailwind CSS | Styling |
| Bun | Package manager & dev server |
| gray-matter | Markdown frontmatter parsing |
| remark + remark-html | Markdown to HTML conversion |
| Vercel | Deployment |

---

## Run locally

```bash
# Install dependencies
bun install

# Start development server
bun dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## How to add new content

All content lives in the `content/` folder as `.md` files. **No code changes needed** — just add a file.

### Add a new guide

1. Create `content/guides/your-guide-slug.md`
2. Add this frontmatter at the top:

```yaml
---
title: "Your Guide Title"
slug: "your-guide-slug"
type: "guide"
category: "tenant-rights"
jurisdiction: "Punjab, Pakistan"
court_or_office: "Rent Controller Court"
related_laws: ["punjab-rent-restriction-ordinance-1959"]
related_templates: []
last_verified: "2024-01-01"
contributor: "Your Name"
disclaimer: "This is legal information, not legal advice. Consult a lawyer for your specific situation."
---
```

3. Write your guide content in Markdown below the `---`
4. The guide automatically appears on the homepage and at `/guides/your-guide-slug`

### Add a new law reference

1. Create `content/laws/law-slug.md`
2. Use this frontmatter:

```yaml
---
title: "Short Law Name"
slug: "law-slug"
type: "law"
full_name: "Full Official Name of the Law, Year"
year: "1959"
jurisdiction: "Punjab, Pakistan"
applies_to: "Who this law applies to"
related_guides: []
last_verified: "2024-01-01"
contributor: "Your Name"
---
```

### Add a new document template

1. Create `content/templates/template-slug.md`
2. Use this frontmatter:

```yaml
---
title: "Template Name"
slug: "template-slug"
type: "template"
category: "tenant-rights"
language: "both"
jurisdiction: "Punjab, Pakistan"
related_guides: []
related_laws: []
last_verified: "2024-01-01"
contributor: "Your Name"
disclaimer: "Review this template with a lawyer before use."
---
```

3. Write the template content in the body. Use `[FIELD NAME]` for fillable fields — they will be automatically highlighted in amber for users.
4. Separate Urdu and English versions with `---\n---` (double horizontal rule).

---

## Push to GitHub

```bash
# Initialize git (already done by create-next-app)
git add .
git commit -m "Initial commit: Qanoon.pk v1.0"

# Create a repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/qanoon-pk.git
git branch -M main
git push -u origin main
```

---

## Deploy to Vercel

### Option 1: Vercel CLI
```bash
bun add -g vercel
vercel
```

### Option 2: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository (`qanoon-pk`)
4. Settings: Framework = **Next.js**, Build command = `bun run build`, Install command = `bun install`
5. Click **Deploy**

Vercel auto-deploys on every push to `main`.

---

## Content guidelines

- All content is **legal information**, not legal advice
- Every guide and template must include a disclaimer
- Cite the specific law and section number when making legal claims
- Get content reviewed by a qualified lawyer before publishing
- Use `last_verified` to track when content was last checked

---

## Contributing

This is a community project. To contribute:
1. Fork the repo
2. Add or improve a content file in `content/`
3. Open a pull request with a brief description and your sources

Please do not submit content without citing your legal sources.

---

## License

Content is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
Code is MIT licensed.
