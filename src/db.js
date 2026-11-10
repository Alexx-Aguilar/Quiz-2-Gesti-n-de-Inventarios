const fs=require('node:fs'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const file=process.env.DATABASE_FILE||'./data/catalog.db';
fs.mkdirSync(path.dirname(path.resolve(file)),{recursive:true});
const db=new DatabaseSync(file);
db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;');
db.exec(fs.readFileSync(path.join(__dirname,'schema.sql'),'utf8'));
module.exports=db;
