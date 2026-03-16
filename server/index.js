
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
require('dotenv').config();
require('./passport');

const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(session({ secret: process.env.SESSION_SECRET || 'opendots_secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// --- Auth Routes ---
app.get('/', (req, res) => res.send('OpenDots Auth Server Running'));

// Google OAuth
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
	res.redirect('http://localhost:3000/profile');
});

// GitHub OAuth
app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/' }), (req, res) => {
	res.redirect('http://localhost:3000/profile');
});

// Get current user profile
app.get('/api/user', (req, res) => {
	if (req.isAuthenticated()) {
		res.json(req.user);
	} else {
		res.status(401).json({ error: 'Not authenticated' });
	}
});

// Logout
app.get('/auth/logout', (req, res) => {
	req.logout(() => {
		res.redirect('http://localhost:3000/');
	});
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
