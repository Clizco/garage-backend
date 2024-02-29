const controller = {};

// Encargada de listar los usuarios dentro de la base de datos 
controller.list = (req, res) => {
    req.getConnection((err, conn) => {
        conn.query('SELECT * FROM customer', (err, customer) => {
            if (err) {
                res.json(err);
            }
            res.render('customers', {
                data: customer
            })
        })
    })
};

// Encargada de guardar los nuevos usuarios dentro de la base de datos
controller.save = async (req, res) => {
    const data = req.body;

    await req.getConnection((err, conn) => {
        conn.query('INSERT INTO customer set ?', [data])
        if (err) {
            res.json(err);
        }
        res.redirect("/")
        
    })
}
 
// Encargada de editar los usuarios dentro de la base de datos
controller.edit = (req, res) => {
    const { id } = req.params;

    req.getConnection((err, conn)=> {
        conn.query('SELECT * FROM customer WHERE id = ?', [id], (err, customer) => {
            res.render('customer_edit', {
                data: customer[0]
            })
        })
    })
}

controller.update = (req, res) => {
    const { id } = req.params;
    const newCustomer = req.body;
    req.getConnection((err, conn) => {
        conn.query('UPDATE customer set ? WHERE id = ?', [newCustomer, id], (err, rows) => {
            res.redirect('/');
        })
    })
};






// Encargada de eliminar a los usuarios dentro de la base de datos
controller.delete = async (req, res) => {
    const { id } = req.params;

    req.getConnection((err, conn) => {
        conn.query('DELETE FROM users WHERE user_id = ?', [id], (err, rows) => {
            res.redirect('/');
        });
    });
    
};

export default controller;