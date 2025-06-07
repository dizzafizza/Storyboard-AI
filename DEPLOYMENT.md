# 🚀 Deployment Guide

This guide will help you deploy Storyboard AI to GitHub Pages.

## ✅ Pre-Deployment Checklist

### 1. Repository Setup
- [ ] Repository is public on GitHub
- [ ] All code is committed and pushed to main branch
- [ ] Repository name matches the project (e.g., `storyboard-ai`)

### 2. Configuration Updates
- [ ] Update `package.json` homepage URL:
  ```json
  "homepage": "https://YOUR_USERNAME.github.io/storyboard-ai"
  ```
- [ ] Update `vite.config.ts` base path:
  ```typescript
  base: process.env.NODE_ENV === 'production' ? '/storyboard-ai/' : '/',
  ```
- [ ] Update all README.md URLs with your GitHub username
- [ ] Update `index.html` meta tags with your URLs

### 3. Security & Performance
- [ ] All server dependencies removed
- [ ] Security headers configured in `index.html`
- [ ] Error boundaries implemented
- [ ] Build passes without warnings: `npm run build`
- [ ] No security vulnerabilities: `npm audit`

## 🔧 GitHub Pages Setup

### 1. Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll to **Pages** section
4. Under **Source**, select **GitHub Actions**
5. The workflow will be automatically detected

### 2. GitHub Actions Workflow
The workflow file `.github/workflows/deploy.yml` is already configured to:
- Build the app on push to main branch
- Deploy to GitHub Pages automatically
- Handle permissions correctly

### 3. First Deployment
1. Push your code to the main branch:
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```
2. Go to **Actions** tab to monitor deployment
3. Once complete, visit: `https://YOUR_USERNAME.github.io/storyboard-ai`

## 🔒 Security Configuration

### Content Security Policy
The app includes a strict CSP that:
- Allows connections only to OpenAI API
- Prevents XSS attacks
- Blocks unauthorized frame embedding
- Restricts external resource loading

### Privacy Features
- No analytics or tracking
- No data collection
- All processing client-side
- API keys stored locally only

## 🧪 Testing Your Deployment

### 1. Basic Functionality
- [ ] App loads without errors
- [ ] Can create new projects
- [ ] Can add and edit panels
- [ ] Drag and drop works
- [ ] All modals open/close properly

### 2. Storage Testing
- [ ] Projects save automatically
- [ ] Data persists after page refresh
- [ ] Can export/import projects
- [ ] Settings are remembered

### 3. AI Features (with API key)
- [ ] Can add OpenAI API key
- [ ] AI assistant responds
- [ ] Can generate storyboards
- [ ] Can generate video prompts
- [ ] Error handling works without API key

### 4. Browser Compatibility
- [ ] Works in Chrome/Edge
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Mobile responsive

## 🛠️ Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file to `/public/` directory:
   ```
   your-domain.com
   ```
2. Configure DNS with your domain provider
3. Update URLs in `package.json` and README

## 🔄 Updates and Maintenance

### Updating the App
1. Make changes locally
2. Test with `npm run dev`
3. Build and test with `npm run build && npm run preview`
4. Commit and push to main branch
5. GitHub Actions will auto-deploy

### Dependency Updates
```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Fix security issues
npm audit fix

# Test after updates
npm run build
```

### Monitoring
- Check GitHub Actions for deployment status
- Monitor GitHub Pages analytics (if enabled)
- Watch for security advisories on dependencies

## 🆘 Troubleshooting

### Build Fails
- Check TypeScript errors: `npm run build`
- Fix linting issues: `npm run lint` (if configured)
- Check dependencies: `npm install`

### Pages Not Loading
- Verify base path in `vite.config.ts`
- Check repository is public
- Ensure GitHub Pages is enabled
- Wait a few minutes for DNS propagation

### AI Features Not Working
- Verify CSP allows OpenAI connections
- Check browser console for errors
- Test API key validity
- Check network connectivity

### Data Loss Issues
- LocalStorage quota might be full
- Try exporting data before clearing storage
- Check browser storage settings

## 📞 Support

For deployment issues:
1. Check this troubleshooting guide
2. Review GitHub Actions logs
3. Open a GitHub issue with details
4. Include browser console errors

---

**Happy Deploying! 🎬** 