const fs = require('fs');
const path = require('path');

const mediaPath = './src/screenshots';
const outputPath = './src/data/gallery.json';

function formatName(fileName) {
    return fileName
        .replace(/\.[^/.]+$/, '')
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

const files = fs.readdirSync(mediaPath);

const images = files
    .filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file))
    .map(file => ({
        file,
        title: formatName(file)
    }));

fs.writeFileSync(outputPath, JSON.stringify(images, null, 2));

console.log('Gallery generated:', images.length);
