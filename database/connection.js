import mysql from 'mysql';

const connection = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  database: 'users',
  password: "Legolas*27!",
  
});

connection.connect((error) => {
    if (error) {
      console.error('Error connecting to MySQL database:', error);
    } else {
      console.log('Connected to MySQL database!');
    }
  });


  connection.query('Select first_name from users', function(error, results, fields){
    if(error)
    throw error;

    results.forEach(result => {
        console.log(result);
    });
  })
  connection.end()

export {connection} 
  