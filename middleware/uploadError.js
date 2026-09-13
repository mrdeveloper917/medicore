module.exports = (err, req, res, next) => {

    if (err.code === "LIMIT_FILE_SIZE") {

        return res.status(400).json({

            success: false,

            message: "Image size should not exceed 2 MB."

        });

    }

    if (err) {

        return res.status(400).json({

            success: false,

            message: err.message

        });

    }

    next();

};