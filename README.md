# kacper-mlodkowski.github.io

A personal website built with Next.js featuring a left sidebar navigation.

## Requirements

- **Node.js**: 20.0.0 or later (required for Supabase compatibility)
- **npm**: 10.0.0 or later

## Getting Started

First, install the dependencies:

```bash
npm install
```

**Note:** Some deprecation warnings may appear from transitive dependencies (dependencies of dependencies). These are being addressed through package updates and npm overrides. The application will function correctly despite these warnings.

Create a `.env.local` file in the root directory with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://hyroenakanqqbeuuajoo.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_ybu7ExAmLklvO_bL_2AX2g_lKlmAIqu
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Pages

- **Home** (`/`) - Welcome page
- **About** (`/about`) - About page
- **Projects** (`/projects`) - Projects showcase
- **Movies** (`/movies`) - Movies from Supabase database
- **Contact** (`/contact`) - Contact information

## Build for Production

To build the static site locally:

```bash
npm run build
```

This will create an `out` folder with static HTML files.

## Deploying to GitHub Pages

### Automatic Deployment (Recommended)

The repository includes a GitHub Actions workflow that automatically builds and deploys your site when you push to the `main` or `master` branch.

**To enable automatic deployment:**

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. Enable GitHub Pages in your repository settings:
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
   - Save the settings

3. The workflow will automatically build and deploy your site. You can check the progress in the **Actions** tab.

Your site will be available at `https://kacpermlodkowski.github.io` (or your GitHub username).

**Note:** The Supabase credentials are already configured in the GitHub Actions workflow. For local development, create a `.env.local` file with your credentials.

### Manual Deployment

If you prefer to deploy manually:

1. Build the site: `npm run build`
2. Copy the contents of the `out` folder to the root of your repository
3. Commit and push the changes

## Project Structure

```
├── components/
│   └── Layout.js          # Layout component with sidebar navigation
├── lib/
│   └── supabase.js        # Supabase client configuration
├── pages/
│   ├── _app.js           # App wrapper with Layout
│   ├── index.js          # Home page
│   ├── about.js          # About page
│   ├── projects.js       # Projects page
│   ├── movies.js         # Movies page (fetches from Supabase)
│   └── contact.js        # Contact page
├── styles/
│   ├── globals.css       # Global styles
│   ├── Layout.module.css # Layout component styles
│   ├── Projects.module.css # Projects page styles
│   ├── Movies.module.css  # Movies page styles
│   └── Contact.module.css  # Contact page styles
└── package.json
```