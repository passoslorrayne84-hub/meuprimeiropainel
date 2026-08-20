// Lê o histórico do navegador (SQLite) e lista as URLs mais recentes com timestamps
// Tenta usar o módulo sqlite3 se disponível; caso contrário, faz leitura binária.
const fs = require('fs');
const path = require('path');

const files = [
  'C:/Users/user/AppData/Local/Google/Chrome/User Data/Default/History',
  'C:/Users/user/AppData/Local/Microsoft/Edge/User Data/Default/History'
];

// Timestamp do Chrome/Edge: microssegundos desde 1601-01-01
// Converter para ms desde epoch: (us / 1000) - 11644473600000
function chromeTimeToMs(us) {
  return Math.floor(us / 1000) - 11644473600000;
}

let sqlite3 = null;
try { sqlite3 = require('sqlite3'); } catch (e) { sqlite3 = null; }

if (sqlite3) {
  for (const f of files) {
    try {
      const db = new sqlite3.Database(f, sqlite3.OPEN_READONLY);
      db.all(
        "SELECT url, title, last_visit_time FROM urls ORDER BY last_visit_time DESC LIMIT 30",
        function (err, rows) {
          if (err) { console.log('erro sqlite ' + f + ': ' + err.message); return; }
          console.log('=== ' + path.basename(path.dirname(path.dirname(f))) + ' ===');
          for (const r of rows) {
            const d = new Date(chromeTimeToMs(r.last_visit_time));
            console.log(d.toISOString() + ' | ' + r.url);
          }
        }
      );
      db.close();
    } catch (e) {
      console.log('erro abrir ' + f + ': ' + e.message);
    }
  }
} else {
  console.log('sqlite3 nao disponivel - usando leitura binaria');
  for (const f of files) {
    try {
      const s = fs.readFileSync(f);
      const str = s.toString('latin1');
      const urls = str.match(/https?:\/\/[^\x00-\x1f\x7f-\xff"\\]+/g) || [];
      console.log('=== ' + path.basename(path.dirname(path.dirname(f))) + ' ===');
      for (const u of urls.slice(-40)) {
        console.log(u);
      }
    } catch (e) {
      console.log('erro ' + f + ': ' + e.message);
    }
  }
}
