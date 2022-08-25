const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./db.sqlite", (error) => {
  if (error) {
    console.error(error.message);
    throw error;
  }

  // Här kan vi anta att vi är anslutna
  console.log("Ansluten till vår databas");

  const statement = `CREATE TABLE messages
  ( id INTEGER PRIMARY KEY AUTOINCREMENT,
    userID TEXT,
    room TEXT,
    name TEXT, 
    message TEXT,
    timestamp TEXT )`

  db.run(statement, (error) => {
    if (error) {
      // Om tabellen redan finns
      console.error(error.message);
      return;
    }

  })
});

module.exports = db;