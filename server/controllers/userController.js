const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const cron = require("node-cron");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const crypto = require("crypto");
const CryptoJS = require("crypto-js");

puppeteer.use(StealthPlugin());

let scheduledTasks = {}; // To store scheduled tasks by userId

// Helper function to encrypt data with a unique IV
const encrypt = (text) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
};

// Helper function to decrypt data with a unique IV
const decrypt = (text, iv) => {
    const encryptedText = Buffer.from(text, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};

// Helper function to decrypt data from the frontend
const decryptData = (encryptedData) => {
    const bytes = CryptoJS.AES.decrypt(encryptedData, process.env.SECRET_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

// @desc Automate login to Codeforces and contest registration
// @route POST /api/users/automate
// @access Private
const automateLogin = async (req, res) => {
    const user = await User.findById(req.user._id);
    console.log("Automating login for:", user);

    if (!user || !user.cfHandle || !user.cfPassword ) {
        return res
            .status(400)
            .json({ message: "Please provide valid Codeforces credentials." });
    }

    const { automationPeriod, selectedDivisions } = decryptData(req.body.data);
    if (!automationPeriod) {
        return res
            .status(400)
            .json({ message: "Please select an automation period." });
    }
    if (!selectedDivisions || selectedDivisions.length === 0) {
        return res
            .status(400)
            .json({
                message: "Please select at least one division for contest registration.",
            });
    }

    user.automationPeriod = automationPeriod;
    user.selectedDivisions = selectedDivisions;
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
    console.log("Scheduling automation for:", user.cfHandle);
    let cronExpression;
    switch (user.automationPeriod) {
        case "daily":
            cronExpression = "* * * * *"; // Run once every day at midnight
            break;
        case "twice-daily":
            cronExpression = "* * * * *"; // Run at midnight and noon every day
            break;
        case "weekly":
            cronExpression = "* * * * *"; // Run every Monday at midnight
            break;
        default:
            return;
    }

    // Schedule task and save reference in the scheduledTasks object
    const task = cron.schedule(cronExpression, async () => {
        try {
            await performLoginAndRegistration(user);
        } catch (error) {
            console.error(`Automation failed for user ${user.cfHandle}:`, error);
        }
    });

    // Store the task by userId to manage it later
    scheduledTasks[user._id] = task;
};

// Function to perform login automation and contest registration
const performLoginAndRegistration = async (user) => {
    console.log("Performing login and contest registration for:", user.cfHandle);
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
        ],
    });
    const page = await browser.newPage();

    try {
        await loginToCodeforces(page, user);
        await registerForContests(page, user);
        console.log(
            "Login and contest registration completed successfully for:",
            user.cfHandle
        );
    } catch (error) {
        console.error(
            `Error during login or registration for ${user.cfHandle}:`,
            error
        );
        throw error;
    } finally {
        await browser.close();
    }
};

// Helper function for Codeforces login
const loginToCodeforces = async (page, user) => {
    console.log("Navigating to Codeforces login page...");
    await page.goto("https://codeforces.com/enter", {
        waitUntil: "networkidle0",
        timeout: 300000, // 5 minutes
    });

    // Wait for Cloudflare challenge to be solved (if present)
    await handleCloudflareChallenge(page);

    console.log("Waiting for login form...");
    await page.waitForSelector('input[name="handleOrEmail"]', {
        visible: true,
        timeout: 60000, // 1 minute
    });

    console.log("Login form found. Entering credentials...");
    await page.type('input[name="handleOrEmail"]', user.cfHandle);
    await page.type('input[name="password"]', decrypt(user.cfPassword, user.cfPasswordIv));

    console.log("Submitting login form...");
    await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 }),
        page.click('input[type="submit"]'),
    ]);

    console.log("Checking for login errors...");
    const loginError = await page.$(".error");
    if (loginError) {
        throw new Error("Incorrect Codeforces credentials.");
    }

    console.log("Login successful for:", user.cfHandle);
};

// Helper function for contest registration
const registerForContests = async (page, user) => {
    console.log('Checking for upcoming contests...');
    await page.goto('https://codeforces.com/contests', { waitUntil: 'networkidle0', timeout: 60000 });

    const contestsInfo = await page.evaluate((userPreferences) => {
        const { selectedDivisions, includeNonDivisionContests } = userPreferences;
        
        const table = document.querySelector('.datatable table');
        if (!table) {
            console.error('Contests table not found');
            return { error: 'Table not found' };
        }

        const rows = table.querySelectorAll('tr');
        console.log('Rows found:', rows.length);

        return {
            contests: Array.from(rows).slice(1).map((row) => {
                const cells = row.querySelectorAll('td');
                if (cells.length < 6) {
                    console.error('Unexpected row structure');
                    return null;
                }
                const name = cells[0].innerText.trim();
                const startTime = cells[2].innerText.trim();
                const registerLink = cells[5].querySelector('a.red-link');
                const href = registerLink ? registerLink.href : null;
                const contestNumber = registerLink ? href.split('/').pop() : 'N/A';
                
                const divisionMatch = name.match(/div(?:ision)?\.?\s*(\d+)/i);
                const division = divisionMatch ? `Div. ${divisionMatch[1]}` : null;
                
                return {
                    name,
                    startTime,
                    contestNumber,
                    registerLink: href,
                    division
                };
            }).filter(contest => {
                if (!contest || !contest.registerLink) return false;
                
                if (contest.division) {
                    return selectedDivisions.some(div => 
                        div.toLowerCase() === contest.division.toLowerCase()
                    );
                } else {
                    return includeNonDivisionContests;
                }
            })
        };
    }, { 
        selectedDivisions: user.selectedDivisions, 
        includeNonDivisionContests: user.includeNonDivisionContests 
    });

    if (contestsInfo.error) {
        console.error('Error in page evaluation:', contestsInfo.error);
        return;
    }

    console.log(`Found ${contestsInfo.contests.length} eligible contests`);
    for (const contest of contestsInfo.contests) {
        console.log(`Registering for contest: ${contest.name}, Division: ${contest.division || 'N/A'}`);
        
        if (contest.registerLink) {
            try {
                await page.goto(contest.registerLink, { waitUntil: 'networkidle0', timeout: 60000 });
                await page.click('input.submit[type="submit"]');
                await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 });
                console.log(`Successfully registered for contest ${contest.name}`);
            } catch (error) {
                console.error(`Failed to register for contest ${contest.name}:`, error);
            }
        }
    }
};

// Function to handle Cloudflare challenge
const handleCloudflareChallenge = async (page) => {
    try {
        console.log("Checking for Cloudflare challenge...");
        const cloudflareSelector = "#cf-challenge-running";
        const challengeExists = await page.$(cloudflareSelector);

        if (challengeExists) {
            console.log(
                "Cloudflare challenge detected. Waiting for it to be solved..."
            );
            await page.waitForFunction(
                () => !document.querySelector("#cf-challenge-running"),
                { timeout: 60000 }
            );
            console.log("Cloudflare challenge solved.");
        } else {
            console.log("No Cloudflare challenge detected.");
        }
    } catch (error) {
        console.error("Error handling Cloudflare challenge:", error);
        throw error;
    }
};

// Function to stop automation for a user
const stopAutomation = (userId) => {
    if (scheduledTasks[userId]) {
        console.log("Stopping automation for user:", userId);
        scheduledTasks[userId].stop(); // Stop the cron job
        delete scheduledTasks[userId]; // Remove it from the scheduled tasks list
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
        const { username, handle, password, APIkey, selectedDivisions } = decryptData(req.body.data);

        // Check if the new cfHandle is already in use by another user
        if (handle) {
            const existingUser = await User.findOne({ cfHandle: handle });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return res
                    .status(400)
                    .json({ message: "Codeforces handle is already in use" });
            }
        }

        user.username = username || user.username;
        user.cfHandle = handle || user.cfHandle;
        if (password) {
            const { iv, encryptedData } = encrypt(password); // Encrypt password
            user.cfPassword = encryptedData;
            user.cfPasswordIv = iv;
        }
        user.cfApiKey = APIkey || user.cfApiKey;
        user.selectedDivisions = selectedDivisions || user.selectedDivisions;

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            cfHandle: updatedUser.cfHandle,
            selectedDivisions: updatedUser.selectedDivisions,
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
            selectedDivisions: user.selectedDivisions,
            isAutomated: user.isAutomated,
            automationPeriod: user.automationPeriod,
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