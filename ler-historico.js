const fs = require('fs');
const path = require('path');

const files = [
  'C:/Users/user/AppData/Local/Google/Chrome/User Data/Default/History',
  'C:/Users/user/AppData/Local/Microsoft/Edge/User Data/Default/History'
];

for (const f of files) {
  try {
    const s = fs.readFileSync(f);
    const str = s.toString('latin1');
    const urls = str.match(/https?:\/\/[^\x00-\x1f\x7f-\xff"\\]+/g) || [];
    console.log('=== ' + path.basename(path.dirname(path.dirname(f))) + ' ===');
    for (const u of urls.slice(-50)) {
      console.log(u);
    }
  } catch (e) {
    console.log('erro ' + f + ': ' + e.message);
  }
}
