import expressApp from "./app.js"
import { port } from "./config.js"

expressApp.listen(port)
console.log(`Servidor levantando en puerto ${port}`)