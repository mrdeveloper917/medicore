// ============================================
// ROLE AUTHORIZATION MIDDLEWARE
// ============================================

const authorize = (...roles) => {

    return (req, res, next) => {

        try {

            // User authentication check
            // protect middleware should run before authorize
            if (!req.user) {

                return res.status(401).send("Unauthorized");
            }

            // User role check
            if (!req.user.role) {

                return res.status(403).send("User role not found");
            }

            // Normalize roles for safe comparison
            const userRole = String(req.user.role).toLowerCase();

            const allowedRoles = roles.map(role =>
                String(role).toLowerCase()
            );

            // Check whether user's role is allowed
            if (!allowedRoles.includes(userRole)) {

                return res.status(403).send("Access Denied");
            }

            // User is authorized
            next();

        } catch (error) {

            console.error("Role Authorization Error:", error);

            return res.status(500).send("Authorization Error");
        }
    };
};


// ============================================
// EXPORT
// ============================================

module.exports = authorize;