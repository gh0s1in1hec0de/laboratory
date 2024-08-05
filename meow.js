const fs = require('fs');

const baseText = '5362428013561489|10|26|';
const filePath = 'output.txt';
let data = '';

for (let i = 0; i <= 999; i++) {
    let num = i.toString().padStart(3, '0');
    data += `${baseText}${num}\n`;
}

fs.writeFile(filePath, data, (err) => {
    if (err) throw err;
    console.log('File has been saved!');
});
