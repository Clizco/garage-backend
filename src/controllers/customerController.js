import { pool } from "../db.js"


// Encargada de listar los usuarios dentro de la base de datos 
export const renderCustomers = async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM customer");
    res.render("customers", { customers: rows })
        
};

// Encargada de guardar los nuevos usuarios dentro de la base de datos
export const createCustomers = async (req, res) => {
    const newCustomer = req.body;
    await pool.query("INSERT INTO customer set ?", [newCustomer]);
    res.redirect("/");
   
} 
 
// Encargada de editar los usuarios dentro de la base de datos
export const editCustomer = async(req, res) => {
    const { id } = req.params;
    const [result] = await pool.query("SELECT * FROM customer WHERE id = ?", [
        id,
    ]);
    res.render("customer_edit", { customer: result[0] })
}

// Encargada de actualizar los usuarios dentro de la base de datos
export const updateCustomer = async (req, res) => {
    const { id } = req.params;
    const newCustomer = req.body;
    await pool.query("UPDATE customer set ? WHERE id = ?", [newCustomer, id])
    res.redirect("/")
};



// Encargada de eliminar a los usuarios dentro de la base de datos
export const deleteCustomer = async (req, res) => {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM customer WHERE id = ?", [id]);
    if (result.affectedRows === 1) {
        res.json({ message: "Customer deleted" });
    }
    res.redirect("/");
    
};

// Encargada de logear a los usuarios
export const loginCustomer = async (req, res) => {
   const {email, password} = req.body;

   const session = req.params('void')

   if ( email, password ) {
    
   }
}
