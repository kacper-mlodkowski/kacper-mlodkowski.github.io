# kacper-mlodkowski.github.io

A personal website built with Next.js featuring a left sidebar navigation.

## Getting Started

First, install the dependencies:

```bash
npm install
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

### Manual Deployment

If you prefer to deploy manually:

1. Build the site: `npm run build`
2. Copy the contents of the `out` folder to the root of your repository
3. Commit and push the changes

## Project Structure

```
├── components/
│   └── Layout.js          # Layout component with sidebar navigation
├── pages/
│   ├── _app.js           # App wrapper with Layout
│   ├── index.js          # Home page
│   ├── about.js          # About page
│   ├── projects.js       # Projects page
│   └── contact.js        # Contact page
├── styles/
│   ├── globals.css       # Global styles
│   ├── Layout.module.css # Layout component styles
│   ├── Projects.module.css # Projects page styles
│   └── Contact.module.css  # Contact page styles
└── package.json
```