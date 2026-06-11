const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const pino = require('pino');
const connectToDatabase = require('../models/db');
const { body, validationResult } = require('express-validator');

dotenv.config(); 
const router = express.Router();
const logger = pino();

const JWT_SECRET = process.env.JWT_SECRET || 'giftlink_secret_key';

router.post('/register', async (req, res) => {
    try {
        const db = await connectToDatabase();

        const collection = db.collection('users');

        const existingUser = await collection.findOne({ email: req.body.email });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(req.body.password, salt);
        const email = req.body.email;

        const user = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: email,
            password: hash
        };

        const result = await collection.insertOne(user);

        const authtoken = jwt.sign(
            { id: result.insertedId },
            JWT_SECRET
        );

        logger.info('User registered successfully');

        res.json({ authtoken, email });
    } catch (e) {
        logger.error(e);
        return res.status(500).send('Internal server error');
    }
});

router.post('/login', async (req, res) => {
    try {
        // Task 1: Connect to MongoDB
        const db = await connectToDatabase();

        // Task 2: Access users collection
        const collection = db.collection('users');

        // Task 3: Check for user credentials
        const user = await collection.findOne({ email: req.body.email });

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        // Task 4: Check password against encrypted password
        const passwordCompare = await bcryptjs.compare(req.body.password, user.password);

        if (!passwordCompare) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        // Task 5: Fetch user details
        const userName = user.firstName;
        const userEmail = user.email;

        // Task 6: Create JWT authentication
        const authtoken = jwt.sign(
            { id: user._id },
            JWT_SECRET
        );

        res.json({ authtoken, userName, userEmail });

    } catch (e) {
        logger.error(e);
        return res.status(500).send('Internal server error');
    }
});

router.put(
    '/update',
    [
        body('firstName').optional().isLength({ min: 1 }).withMessage('First name cannot be empty'),
        body('lastName').optional().isLength({ min: 1 }).withMessage('Last name cannot be empty'),
        body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],
    async (req, res) => {
        // Task 2: Validate input
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            // Task 3: Check if email is present in header
            const email = req.headers.email;

            if (!email) {
                return res.status(400).json({ error: 'Email header is required' });
            }

            // Task 4: Connect to MongoDB and access users collection
            const db = await connectToDatabase();
            const collection = db.collection('users');

            // Task 5: Find user credentials in database
            const existingUser = await collection.findOne({ email: email });

            if (!existingUser) {
                return res.status(404).json({ error: 'User not found' });
            }

            const updateFields = {
                updatedAt: new Date()
            };

            if (req.body.firstName) {
                updateFields.firstName = req.body.firstName;
            }

            if (req.body.lastName) {
                updateFields.lastName = req.body.lastName;
            }

            if (req.body.password) {
                const salt = await bcryptjs.genSalt(10);
                updateFields.password = await bcryptjs.hash(req.body.password, salt);
            }

            // Task 6: Update user credentials in database
            await collection.updateOne(
                { email: email },
                { $set: updateFields }
            );

            // Task 7: Create JWT authentication
            const authtoken = jwt.sign(
                { id: existingUser._id },
                JWT_SECRET
            );

            res.json({ authtoken });

        } catch (e) {
            logger.error(e);
            return res.status(500).send('Internal server error');
        }
    }
);

module.exports = router;
