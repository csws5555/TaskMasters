const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./tasks.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error("Couldn't open database", err);
    return;
  }

  db.serialize(() => {
    // First get all table names
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
      if (err) {
        console.error("Error getting tables:", err);
        return;
      }

      // Process each table sequentially
      tables.forEach((table, index, array) => {
        db.all(`SELECT * FROM ${table.name}`, [], (err, rows) => {
          console.log(`\n=== ${table.name.toUpperCase()} ===`);
          if (err) {
            console.error(`Error reading ${table.name}:`, err);
          } else {
            console.log(rows.length > 0 ? rows : "Empty table");
          }

          // Close connection after last table
          if (index === array.length - 1) db.close();
        });
      });
    });
  });
});