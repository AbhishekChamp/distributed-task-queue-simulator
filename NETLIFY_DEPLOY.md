# Deploy to Netlify

This guide covers deploying the Distributed Task Queue Simulator to [Netlify](https://www.netlify.com/).

## Prerequisites

- A [Netlify](https://app.netlify.com/) account (free tier works fine)
- Node.js 20+ and pnpm installed locally
- Your project pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Option 1: Deploy via Git (Recommended)

1. **Push your code to a Git repository**

   ```bash
   git push origin main
   ```

2. **Log in to Netlify** and click **"Add new site" → "Import an existing project"**

3. **Connect your Git provider** and select the `distributed-task-queue-simulator` repository

4. **Configure build settings**:
   - **Build command:** `pnpm run build`
   - **Publish directory:** `dist`
   - **Node version:** `20` (set in environment variables or `.nvmrc`)

5. **Click "Deploy site"**

Netlify will automatically build and deploy your site. Future pushes to `main` will trigger automatic rebuilds.

## Option 2: Deploy via Netlify CLI

1. **Install the Netlify CLI**

   ```bash
   npm install -g netlify-cli
   ```

2. **Log in to Netlify**

   ```bash
   netlify login
   ```

3. **Initialize your site**

   ```bash
   cd distributed-task-queue-simulator
   netlify init
   ```

   - Choose "Create & configure a new site"
   - Select your team and site name

4. **Build and deploy**
   ```bash
   pnpm run build
   netlify deploy --prod --dir=dist
   ```

## Option 3: Drag & Drop Deploy

1. **Build the project locally**

   ```bash
   cd distributed-task-queue-simulator
   pnpm install
   pnpm run build
   ```

2. **Go to Netlify Dashboard** → **Sites** → **Drag and drop your site folder**

3. **Drop the `dist/` folder** into the upload area

Netlify will instantly publish the site and give you a live URL.

## Build Configuration

The project uses **Vite**, which outputs static files to the `dist/` directory. No special server-side rendering is required.

### `_redirects` file (SPA support)

Create `public/_redirects` (or `dist/_redirects` after build) with the following content to support client-side routing:

```
/*    /index.html   200
```

Or add a `netlify.toml` in the project root:

```toml
[build]
  command = "pnpm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Environment Variables

No environment variables are required for the basic build. If you add analytics or API keys later, set them in:

- **Netlify Dashboard** → **Site settings** → **Environment variables**

## Custom Domain

1. Go to **Netlify Dashboard** → **Domain settings** → **Add custom domain**
2. Enter your domain and follow DNS configuration instructions
3. Enable HTTPS (Netlify provisions Let's Encrypt certificates automatically)

## Troubleshooting

| Issue                             | Solution                                                              |
| --------------------------------- | --------------------------------------------------------------------- |
| Build fails with "pnpm not found" | Set `NODE_VERSION=20` and `PNPM_VERSION=9` in environment variables   |
| 404 on page refresh               | Add the `_redirects` or `netlify.toml` SPA fallback rule              |
| Large bundle size                 | Enable Vite manual chunks or code-splitting in `vite.config.ts`       |
| Web Worker fails in production    | Ensure the worker file path is relative and Vite bundles it correctly |

## Continuous Deployment

With Git integration, every push to `main` (or your configured production branch) triggers a new build. Pull requests generate **Deploy Previews** so you can review changes before merging.

---

For more details, visit the [Netlify Docs](https://docs.netlify.com/).
