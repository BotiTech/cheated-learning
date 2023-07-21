const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('src/static/db/files.db');

let argv = process.argv;

const pname = argv[0] + " " + argv[1];

let db_name;

if(argv[2] == "--login" || argv[2] == "-l") {
	db_name = "files_login";
	 argv = argv.slice(3);
} else {
	db_name = "files";
	argv = argv.slice(2);
}

db.run(`
  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT UNIQUE,
    admin_req BIT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS files_login (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT UNIQUE
  )
`);

const cols = {
	/* I had to look these up becuse I can't learn the order :C */
	reset: "\x1b[0m",
	red: "\x1b[1;31m",
	green: "\x1b[1;32m",
	yellow:  "\x1b[1;33m",
	blue: "\x1b[1;34m",
	white: "\x1b[1;37m"
	
}

let cprint = (msg, col = cols.white) => {
	console.log(col + msg + cols.reset);
}

let rowprint = row => {
	if(row.admin_req == 1) 
		row.admin_req = cols.red + row.admin_req + cols.reset;
	else
		row.admin_req = cols.green + row.admin_req + cols.reset;
	console.log(cols.blue + row.id + cols.reset + ":\t" + cols.yellow + row.path + cols.reset + '\t\t\t' + row.admin_req);
}

let e = err => {
	if(err) {
		cprint(err, cols.red);
		process.exit(1);	
	}
}

let isindb = (key, val) => {
	/* TODO: fix this */
	return true;
	db.get('SELECT * FROM ' + db_name + '  WHERE ' + key + ' = ?', val, (err, data) => {
		e(err)
		if(data) {
			return true;
		}
		return false;
//		return Boolean(data);
	});
}

let ladd = () => {
		if(!argv[1]) {
		e("At least 1 argument is required");
	}
	argv = argv.slice(1);
	argv.forEach( x => {
		if(!x.startsWith('/')) {
			x = '/' + x;
		}
		db.run('INSERT INTO files_login (path) VALUES (?)', [x], e);
		cprint("Inserted: " + x, cols.green);	
	});
}
let llist = () => {
	db.all('SELECT * FROM files_login ORDER BY id ASC', (err, data) => {
		e(err);
		data.forEach( x => {
			console.log(cols.blue + x.id + cols.reset + ":\t" + cols.yellow + x.path + cols.reset);
		});
	});	
}

if(argv[0] == "list" || argv[0] == "l") {
	if(db_name == "files_login") {
		llist();
		return 0;
	}
	db.all('SELECT * FROM ' + db_name + ' ORDER BY id ASC', (err, data) => {
		e(err);
		data.forEach( x => {
			rowprint(x);
		});
	});	
/*	process.exit(0); */

} else if(argv[0] == "remove" || argv[0] == "r" || argv[0] == "rm") {
	if(!argv[1])
		e("At least 1 argument is required for remove");
	argv = argv.slice(1);
	let key;
	argv.forEach( x => {
		if(isNaN(x))
			key = "path";
		 else 
			key = "id";
		if(!isindb(key, x))
			e("Failed removing: " + x);
		db.run('DELETE FROM ' + db_name + '  WHERE ' + key + ' = ?', x, e);
		cprint("Removed: " + x, cols.green);	
	});
				
} else if (argv[0] == "help" || argv[0] == "h" || argv[0] == "?") {
	console.log("Usage:", pname, "[<option>] [<command>] [<arg1>] ... [<argN>]\n");
	cprint("<commands> (also can be invoked by their first letter)", cols.yellow);
	console.log("list| <NULL>: list all files by their id in ascendeing order.");
	console.log("add | insert: adds file to the database. arg1 = path of the file, arg2 = is admin needed?");
	console.log("remove | rm: removes file from the databse. arg1,argN = id of the file.\n");
	cprint("<option>", cols.yellow);
	console.log("--login | -l: work with the login files table.\n");
} else if(argv[0] == "add" || argv[0] == "a" || argv[0] == "insert" || argv[0] == "i" || argv[0] == "") {

	/* manually insert multiple entries HERE */
	const paths = ["src/admin.html", "admin.css", "index.html", "Wuf.png", "login.css", "orli.png", "index.css",
	"src/login.html", "src/main.html", "src/fonts/Bahiana-Regular.ttf"];
	const admin_reqs = [1, 1, 0, 0, 0, 0, 0, 0, 0, 0];
	if(db_name == "files_login") {
		ladd();
		return 0;
	}
	if(argv[1]) {
		if(argv[2] != 1 || argv[2] != 0) {
			argv[2] = 1;
		}
	if(!argv[1].startsWith('/'))
		argv[1] = '/' + argv[1];
	db.run('INSERT INTO files (path, admin_req) VALUES (?, ?)', [argv[1], argv[2]], e);
	cprint("Inserted: " + argv[1], cols.green);
	} else {
		if(paths.lenght != admin_reqs.lenght) 
			e("Array lenghts differ!");
		paths.forEach( (x, i) => {
			if(!x.startsWith('/')) 
				x = '/' + x;
			try {
				db.run('INSERT INTO files (path, admin_req) VALUES (?, ?)', [x, admin_reqs[i]]);
			} catch(err) {
				cprint("Failed: " + x, cols.red); /* somehow this doesn't work TODO */
			} finally {
				cprint("Inserted: " + x, cols.green);

			}
		});
	}
} else {
	e("Command: " + argv[0] + " not recognised");
}