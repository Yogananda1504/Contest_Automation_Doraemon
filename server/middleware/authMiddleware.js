//authMiddleWare
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
require("dotenv").config();

const protect = async (req, res, next) => {
	let token;

	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith("Bearer")
	) {
		try {
			token = req.headers.authorization.split(" ")[1];

			// Verify token
			const decoded = jwt.verify(token, process.env.JWT_SECRET);

			// Get user from the token
			req.user = await User.findById(decoded.id).select("-password");

			if (!req.user) {
				return res
					.status(401)
					.json({ message: "Not authorized, user not found" });
			}

			next();
		} catch (error) {
			console.error("Token verification failed:", error);
			return res.status(401).json({ message: "Not authorized" });
		}
	} else {
		console.log("No token provided in headers:", req.headers);
		return res.status(401).json({ message: "Not authorized, no token" });
	}
};

module.exports = { protect };
