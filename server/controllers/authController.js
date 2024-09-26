const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const validator = require("validator");
const CryptoJS = require("crypto-js");
require("dotenv").config();

// Decrypt data function
const decryptData = (encryptedData) => {
	const bytes = CryptoJS.AES.decrypt(encryptedData, "3b8e2");
	const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
	return JSON.parse(decryptedData);
};

// Generate JWT Token
const generateToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// Send Email Function
const sendEmail = async (options) => {
	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.EMAIL_USERNAME,
			pass: process.env.EMAIL_PASSWORD,
		},
	});

	const mailOptions = {
		from: process.env.EMAIL_USERNAME,
		to: options.email,
		subject: options.subject,
		html: options.message,
	};

	await transporter.sendMail(mailOptions);
};

// Register User
const registerUser = async (req, res) => {
	const { data } = req.body;
	const { username, email, password } = decryptData(data);

	// Validate inputs
	if (!username || !email || !password) {
		return res.status(400).json({ message: "Please provide all fields" });
	}

	if (!validator.isEmail(email)) {
		return res.status(400).json({ message: "Invalid email format" });
	}

	if (!validator.isAlphanumeric(username)) {
		return res.status(400).json({ message: "Username must be alphanumeric" });
	}

	try {
		const userExists = await User.findOne({ $or: [{ username }, { email }] });

		if (userExists) {
			return res.status(400).json({ message: "User already exists" });
		}

		const verificationToken = crypto.randomBytes(6).toString("hex");

		const user = await User.create({
			username: validator.escape(username),
			email: validator.normalizeEmail(email),
			password,
			verificationToken,
		});

		if (user) {
			const message = `
        <h1>Verify Your Email</h1>
        <p>Your verification token is:</p>
        <h2>${verificationToken}</h2>
        <p>Please use this token to verify your email address.Goto Link.</p>
        <a href="${process.env.FRONTEND_URL}/verify-email">Verify Email</a>
      `;

			await sendEmail({ email, subject: "Verify Your Email", message });

			return res.status(201).json({
				message:
					"User registered successfully. Please check your email for the verification token.",
				userId: user._id,
			});
		} else {
			return res.status(400).json({ message: "Invalid user data" });
		}
	} catch (error) {
		res.status(500).json({ message: "Server error" });
	}
};

// Login User
const loginUser = async (req, res) => {
	const { data } = req.body;
	const { username, password } = decryptData(data);

	// Validate inputs
	if (!username || !password) {
		return res.status(400).json({ message: "Please provide all fields" });
	}

	if (!validator.isAlphanumeric(username)) {
		return res.status(400).json({ message: "Username must be alphanumeric" });
	}

	try {
		const user = await User.findOne({ username: validator.escape(username) });

		if (user && (await user.matchPassword(password))) {
			if (!user.isVerified) {
				return res
					.status(401)
					.json({ message: "Please verify your email before logging in" });
			}

			return res.json({
				_id: user.id,
				username: user.username,
				token: generateToken(user._id),
			});
		}

		return res.status(401).json({ message: "Invalid credentials" });
	} catch (error) {
		res.status(500).json({ message: "Server error" });
	}
};

// Verify Email
const verifyEmail = async (req, res) => {
	const { userId, token } = req.body;

	try {
		const user = await User.findOne({ verificationToken: token });

		if (!user) {
			return res.status(400).json({ message: "Invalid user" });
		}

		if (user.isVerified) {
			return res.status(400).json({ message: "Email already verified" });
		}

		if (user.verificationToken !== token) {
			return res.status(400).json({ message: "Invalid verification token" });
		}

		user.isVerified = true;
		user.verificationToken = undefined;
		await user.save();

		res.status(200).json({ message: "Email verified successfully" });
	} catch (error) {
		console.error("Server error:", error);
		res.status(500).json({ message: "Server error" });
	}
};

// Forgot Password
const forgotPassword = async (req, res) => {
	const { data } = req.body;
	const { email } = decryptData(data);

	// Validate input
	if (!validator.isEmail(email)) {
		return res.status(400).json({ message: "Invalid email format" });
	}

	try {
		const user = await User.findOne({ email: validator.normalizeEmail(email) });

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const resetToken = crypto.randomBytes(20).toString("hex");
		user.resetPasswordToken = crypto
			.createHash("sha256")
			.update(resetToken)
			.digest("hex");
		user.resetPasswordExpire = Date.now() + 10 * (60 * 1000);
		await user.save();

		const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
		const message = `
      <h1>Password Reset Request</h1>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
    `;

		await sendEmail({ email, subject: "Password Reset Request", message });

		res.status(200).json({ message: "Email sent" });
	} catch (error) {
		res.status(500).json({ message: "Email could not be sent" });
	}
};

// Reset Password
const resetPassword = async (req, res) => {
	const resetPasswordToken = crypto
		.createHash("sha256")
		.update(req.params.token)
		.digest("hex");

	try {
		const user = await User.findOne({
			resetPasswordToken,
			resetPasswordExpire: { $gt: Date.now() },
		});

		if (!user) {
			return res.status(400).json({ message: "Invalid or expired token" });
		}

		user.password = req.body.password;
		user.resetPasswordToken = undefined;
		user.resetPasswordExpire = undefined;
		await user.save();

		res.status(200).json({ message: "Password reset successful" });
	} catch (error) {
		res.status(500).json({ message: "Server error" });
	}
};

module.exports = {
	registerUser,
	loginUser,
	verifyEmail,
	forgotPassword,
	resetPassword,
};
