import mysql2 from "mysql2"

const db = mysql2.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'eco_clothes'
})

db.connect((err) => {
    if(err) {
        console.error("Erro de conexão: ", err)
        return
    }
    console.log("Conectado ao MySQL")
})

export default db