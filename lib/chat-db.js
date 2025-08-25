// eslint-disable-next-line @typescript-eslint/no-require-imports
const mysql = require("mysql2/promise");

const chat_pool = mysql.createPool({
    host: 'rentalley-db.czaoog62ic33.ap-southeast-1.rds.amazonaws.com',
    user: 'rentalley_admin', // Default value for debugging
    password: 'Rentalleyadmin123456',
    database: 'rentalley_db',
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0
});

module.exports = chat_pool;
