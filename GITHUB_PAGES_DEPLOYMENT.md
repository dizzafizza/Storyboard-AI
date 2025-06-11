# 🚀 GitHub Pages Deployment Guide for Storyboard AI

This guide will help you deploy Storyboard AI to GitHub Pages with full Safari compatibility.

## 📋 Prerequisites

- GitHub account
- Repository forked or cloned from the main project
- Basic understanding of Git and GitHub

## 🛠️ Quick Setup

### 1. Configure Your Repository

1. **Update Package.json**
   - The repository is configured for GitHub username `dizzafizza`:
   ```json
   "homepage": "https://dizzafizza.github.io/Storyboard-AI"
   ```

2. **Update Web Manifest**
   - The `public/site.webmanifest` is configured with the correct URLs:
   ```json
   "start_url": "/Storyboard-AI/",
   "scope": "/Storyboard-AI/"
   ```

### 2. Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select "GitHub Actions"
4. The workflow will automatically deploy when you push to the `main` branch

### 3. Deployment Process

The deployment happens automatically via GitHub Actions when you:
- Push to the `main` branch
- Manually trigger the workflow from the Actions tab

## 🍎 Safari Compatibility Features

This deployment includes several Safari-specific optimizations:

### Core Compatibility
- **ES2019 Target**: Compatible with Safari 13+
- **Webkit Prefixes**: All CSS properties include `-webkit-` prefixes
- **Polyfills**: ResizeObserver and IntersectionObserver polyfills for older Safari versions
- **Viewport Fixes**: iOS Safari viewport height handling
- **Touch Events**: Enhanced touch event handling for iOS

### Progressive Web App Support
- **Web App Manifest**: Full PWA support for Safari
- **Service Worker**: Offline functionality (limited on Safari)
- **Apple Touch Icons**: Proper iOS home screen integration
- **Safe Area Support**: iPhone X+ notch handling

### Performance Optimizations
- **Code Splitting**: Reduced bundle sizes for faster loading
- **Terser Minification**: Safari-compatible code minification
- **Asset Optimization**: Optimized for Safari's rendering engine

## 🔧 Configuration Files

### Key Files for GitHub Pages:
- `.github/workflows/pages.yml` - Deployment workflow
- `vite.config.ts` - Build configuration with Safari targets
- `public/site.webmanifest` - PWA manifest
- `public/sw.js` - Service worker for offline support

### Build Configuration:
```typescript
// vite.config.ts
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/Storyboard-AI/' : '/',
  build: {
    target: ['es2019', 'safari13'],
    // ... other Safari optimizations
  }
})
```

## 📱 Testing Safari Compatibility

### Desktop Safari
1. Open Safari on macOS
2. Navigate to your GitHub Pages URL
3. Test all functionality including:
   - AI image generation
   - Drag and drop
   - File exports
   - Responsive design

### iOS Safari
1. Open Safari on iPhone/iPad
2. Test PWA functionality:
   - Add to Home Screen
   - Offline functionality
   - Touch interactions
   - Viewport handling

### Safari Developer Tools
1. Enable Developer menu in Safari
2. Use Responsive Design Mode
3. Test different iOS devices and orientations

## 🚀 Deployment Commands

### Automatic Deployment
Simply push to main branch:
```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

### Manual Deployment (if needed)
```bash
# Build locally
npm run build

# Deploy using gh-pages (if configured)
npm run deploy
```

## 🔍 Troubleshooting

### Common Issues:

1. **Base Path Issues**
   - Ensure `base` in `vite.config.ts` matches your repository name
   - Update all absolute paths to use the base path

2. **Safari-Specific Problems**
   - Check browser console for compatibility errors
   - Verify polyfills are loading correctly
   - Test on actual Safari, not just Chrome dev tools

3. **PWA Issues**
   - Verify service worker registration
   - Check manifest file syntax
   - Ensure HTTPS is working (GitHub Pages provides this)

### Debugging Steps:
1. Check GitHub Actions logs for build errors
2. Test build locally: `npm run build && npm run preview`
3. Use Safari Web Inspector for debugging
4. Verify all assets load correctly with the base path

## 🌟 Features Verified for Safari

✅ **Core Functionality**
- Storyboard creation and editing
- AI image generation
- Project management
- File import/export

✅ **PWA Features**
- Add to Home Screen
- Offline functionality
- App-like experience

✅ **Mobile Experience**
- Touch interactions
- Responsive design
- iOS Safari viewport handling
- Safe area support

✅ **Performance**
- Fast loading on Safari
- Smooth animations
- Efficient rendering

## 📝 Additional Notes

- The app is fully client-side and doesn't require server configuration
- All user data is stored locally in the browser
- No backend dependencies or API keys are exposed
- Compatible with Safari 13+ and all modern iOS versions

## 🔗 Useful Links

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Safari Web Inspector Guide](https://developer.apple.com/safari/tools/)
- [PWA Safari Support](https://developer.apple.com/documentation/safari-release-notes)
- [iOS Safari Compatibility](https://caniuse.com/?cats=iOS_Safari)

---

For issues specific to GitHub Pages deployment, check the repository's Issues tab or GitHub Actions logs. 