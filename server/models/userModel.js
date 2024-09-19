const mongoose = require("mongoose");

require("dotenv").config();

const userSchema = mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, "Please add a username"],
            unique: true,
        },
        password: {
            type: String,
            required: [true, "Please add a password"],
        },
        cfHandle: {
            type: String,
            required: false,
        },
        cfPassword: {
            type: String,
            required: false,
        },
        cfApiKey: {
            type: String,
            required: false,
        },
        selectedDivisions: {
            type: [String],  // To store selected divisions for contests
            required: false,
        },
		automationPeriod: {
            type: String,  // "daily", "twice-daily", "weekly"
            required: false,
        },
        isAutomated: {
            type: Boolean,
            default: false,
        },
		
    },
    {
        timestamps: true,
    }
);


userSchema.methods.matchPassword = async function (enteredPassword) {
	return enteredPassword === this.password;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
