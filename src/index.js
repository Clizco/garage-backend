import expressApp from "./app.js"
import { port } from "./config.js"

expressApp.listen(port)
console.log(`Servidor levantando en puerto ${port}`)

document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        alert('Inspector deshabilitado');
    }
});