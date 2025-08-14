// Simple icon generator for PWA
const fs = require('fs');
const path = require('path');

// Create a simple PNG icon using Canvas API fallback
function createPNGIconData(size) {
  // For now, copy the existing PNG file or create a placeholder
  const baseIcon = path.join(__dirname, 'icons', 'icon-72x72.png');
  return baseIcon;
}

// Create a simple SVG icon
function createSVGIcon(size, text = '사주') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#8b4513" rx="${size * 0.1}"/>
    <text x="50%" y="50%" font-family="sans-serif" font-size="${size * 0.3}" fill="white" text-anchor="middle" dominant-baseline="central">${text}</text>
  </svg>`;
}

// Icon sizes needed
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

// Generate placeholder icons
sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`Generated ${filename}`);
});

// Generate shortcut icons
const shortcuts = ['generate', 'fortune', 'check', 'history'];
const shortcutIcons = {
  generate: '생성',
  fortune: '운세', 
  check: '확인',
  history: '기록'
};

shortcuts.forEach(shortcut => {
  const svgContent = createSVGIcon(96, shortcutIcons[shortcut]);
  const filename = `shortcut-${shortcut}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`Generated ${filename}`);
});

console.log('All icons generated successfully!');