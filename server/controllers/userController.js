const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const cron = require('node-cron');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

let scheduledTasks = {};  // To store scheduled tasks by userId

// @desc Automate login to Codeforces
// @route POST /api/users/automate
// @access Private
const automateLogin = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user || !user.cfHandle || !user.cfPassword) {
        return res.status(400).json({ message: "Please provide valid Codeforces credentials." });
    }

    const { automationPeriod } = req.body;
    if (!automationPeriod) {
        return res.status(400).json({ message: "Please select an automation period." });
    }

    user.automationPeriod = automationPeriod;
    user.isAutomated = true;
    await user.save();

    // Stop any existing tasks for this user
    stopAutomation(user._id);

    // Schedule the automation task
    scheduleAutomation(user);

    res.status(200).json({ message: "Automation scheduled successfully." });
};

// Helper function to schedule the automation
const scheduleAutomation = (user) => {
    console.log('Scheduling automation for:', user.cfHandle);
    let cronExpression;
    switch (user.automationPeriod) {
        case 'daily':
            cronExpression = '* * * * *';  // Run once every day at midnight
            break;
        case 'twice-daily':
            cronExpression = '* * * * *';  // Run at midnight and noon every day
            break;
        case 'weekly':
            cronExpression = '* * * * *';    // Run every Monday at midnight
            break;
        default:
            return;
    }

    // Schedule task and save reference in the scheduledTasks object
    const task = cron.schedule(cronExpression, async () => {
        try {
            await performLoginAutomation(user);
        } catch (error) {
            console.error(`Automation failed for user ${user.cfHandle}:`, error);
        }
    });

    // Store the task by userId to manage it later
    scheduledTasks[user._id] = task;
};

// Helper function to perform login automation
const performLoginAutomation = async (user) => {
    console.log('Performing login automation for:', user.cfHandle);
    const browser = await puppeteer.launch({ 
        headless: false,
		args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();

    try {
        // Set a longer timeout for navigation
        page.setDefaultNavigationTimeout(120000); // 2 minutes

        console.log('Navigating to Codeforces login page...');
        await page.goto('https://codeforces.com/enter', {
            waitUntil: 'networkidle0',
            timeout: 120000 // 2 minutes
        });

        // Wait for Cloudflare challenge to be solved
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 });

        console.log('Waiting for login form...');
        await page.waitForSelector('input[name="handleOrEmail"]', { 
            visible: true,
            timeout: 60000 // 60 seconds
        });

        console.log('Login form found. Entering credentials...');
        await page.type('input[name="handleOrEmail"]', user.cfHandle);
        await page.type('input[name="password"]', user.cfPassword);
        
        console.log('Submitting login form...');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }),
            page.click('input[type="submit"]')
        ]);

        console.log('Checking for login errors...');
        const loginError = await page.$('.error');
        if (loginError) {
            throw new Error("Incorrect Codeforces credentials.");
        }

        console.log('Login successful for:', user.cfHandle);
    } catch (error) {
        console.error(`Error during login for ${user.cfHandle}:`, error);
        
        // Capture and log the page content for debugging
        const pageContent = await page.content();
        console.error('Page content at time of error:', pageContent);
        
        throw error;
    } finally {
        await browser.close();
    }
};

// Helper function to stop automation for a user
const stopAutomation = (userId) => {
    if (scheduledTasks[userId]) {
        console.log('Stopping automation for user:', userId);
        scheduledTasks[userId].stop();  // Stop the cron job
        delete scheduledTasks[userId];  // Remove it from the scheduled tasks list
    }
};

// @desc Stop automation
// @route POST /api/users/stop-automation
// @access Private
const stopUserAutomation = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.isAutomated = false;
        await user.save();

        stopAutomation(user._id);

        res.status(200).json({ message: "Automation stopped successfully." });
    } else {
        res.status(404);
        throw new Error("User not found");
    }
};

// @desc Update user profile
// @route PUT /api/users/profile
// @access Private
const updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        // Check if the new cfHandle is already in use by another user
        if (req.body.handle) {
            const existingUser = await User.findOne({ cfHandle: req.body.handle });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: "Codeforces handle is already in use" });
            }
        }

        user.username = req.body.username || user.username;
        user.cfHandle = req.body.handle || user.cfHandle;
        user.cfPassword = req.body.password || user.cfPassword;
        user.cfApiKey = req.body.APIkey || user.cfApiKey;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            cfHandle: updatedUser.cfHandle,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404);
        throw new Error("User not found");
    }
};

// @desc Get user profile
// @route GET /api/users/profile
// @access Private
const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            username: user.username,
            cfHandle: user.cfHandle,
            cfApiKey: user.cfApiKey,
        });
    } else {
        res.status(404);
        throw new Error("User not found");
    }
};

// Helper function to generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });
};

module.exports = {
    updateUserProfile,
    getUserProfile,
    automateLogin,
    stopUserAutomation,
};
