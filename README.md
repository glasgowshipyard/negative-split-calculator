# Negative Split Calculator

A clean, modern web calculator for planning progressive pacing splits in running. Helps runners plan negative split race strategies where each segment gets progressively faster.

## Features

- **Progressive Pacing**: Calculate splits that get faster each segment
- **Multiple Units**: Support for miles, kilometers, and meters
- **Mobile Responsive**: Works perfectly on all device sizes
- **Light/Dark Mode**: Automatic theme switching with user preference
- **Export Options**: Copy results to clipboard or share via URL
- **URL Sharing**: Share specific calculations via unique URLs
- **Accessibility**: Full keyboard navigation and screen reader support

## Usage

1. Enter your total distance and preferred unit
2. Set the number of segments to split your run into
3. Input your target average pace in MM:SS format
4. Click "Calculate Splits" to generate your pacing plan

## Example

For a 1-mile run split into 4 segments with a 5:30 target pace:
- Segment 1: 5:40 per mile
- Segment 2: 5:32 per mile  
- Segment 3: 5:24 per mile
- Segment 4: 5:20 per mile

## Technology

- **HTML5** - Semantic, accessible markup
- **Tailwind CSS** - Modern, responsive styling
- **Vanilla JavaScript** - No dependencies, fast loading
- **Progressive Enhancement** - Works without JavaScript for basic functionality

## Deployment

This is a static site that can be deployed to any static hosting service:

- **Cloudflare Pages** - Recommended for performance
- **Netlify** - Alternative hosting option
- **GitHub Pages** - Free option for public repos
- **Any CDN** - Works anywhere static files are served

## Local Development

```bash
# Clone the repository
git clone [your-repo-url]
cd negative-split-calculator

# Serve locally (choose one)
python3 -m http.server 8000
# or
npx serve .
# or
php -S localhost:8000

# Open http://localhost:8000
```

## Browser Support

- Chrome/Chromium 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use for personal or commercial projects.

---

Built for runners who want to race smarter, not just harder.