const verifyRole = (roles) => {
    return (req, res, next) => {
        const token = req.headers['x-access-token'];

        if (!token) {
            return res.status(403).send("No token provided");
        }

        jwt.verify(token, config.secret, (err, decoded) => {
            if (err) {
                return res.status(500).send("Failed to authenticate token");
            }

            if (!roles.includes(decoded.role_id)) {
                return res.status(403).send("You don't have the necessary permissions");
            }

            req.userId = decoded.id;
            req.roleId = decoded.role_id;
            next();
        });
    };
};

// Ejemplo de uso del middleware
userRouter.get("/admin", verifyRole([1]), (req, res) => {
    res.send("Contenido solo para administradores");
});
