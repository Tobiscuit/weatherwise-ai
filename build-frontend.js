const fs = require('fs');
const path = require('path');

// Function to copy all SVG files from a source directory to a destination directory
function copySvgs(sourceDir, destDir) {
  if (fs.existsSync(sourceDir)) {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const files = fs.readdirSync(sourceDir);
    files.forEach(file => {
      if (path.extname(file) === '.svg') {
        const srcFile = path.join(sourceDir, file);
        const destFile = path.join(destDir, file);
        fs.copyFileSync(srcFile, destFile);
        console.log(`copy '${path.relative(__dirname, srcFile)}' -> '${path.relative(__dirname, destFile)}'`);
      }
    });
  }
}

// build all the frontend files
try {
  // This copies the main static assets
  copySvgs(path.join('assets', 'static', 'img'), path.join('dist', 'static', 'img'));
  // This copies the weather icons to the correct location
  copySvgs(path.join('assets', 'static', 'weather-icons', 'reshot'), path.join('dist', 'static', 'weather-icons'));
} catch (e) {
  console.error(e);
} 