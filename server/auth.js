const crypto = require('crypto');
const express = require('express');
const {response} = require("express");
const router = express.Router();

const mongo = require('mongodb');
const monk = require('monk');
const db = monk('mongo:27017/tokens');

router.get('/', function (req, res, next) {
	res.sendFile("index.html",);
});

router.post('/register', function (req, res, next) {

	let responseText = register(req.body.username, req.body.password1, req.body.password2);
	res.send(responseText);

});

function register(username, password1, password2){

	if (password1 === password2) {
		let password = password1;
		const token = crypto.randomBytes(2).toString('base64');
		const salt = crypto.randomBytes(80).toString('base64');
		const hash = hashFunction(password, salt);
		const collection = db.get("users");
		const authToken = crypto.randomBytes(20).toString('base64');
		collection.insert({username: username, password: hash, salt: salt, token: token, auth_token: authToken}, function (err) {
			return "Registered username: " + username;
		})
	} else {
		return "Passwords did not match";
	}
}

router.post('/login', function (req, res, next) {
	// const data = {username: username, password: password}
	const collection = req.db.get("users");
	collection.findOne({username: req.body.username}, function (err, profile) {
		if (!profile) {
			res.send("Couldn't find username " + req.body.username);
		} else {
			const newHash = hashFunction(req.body.password, profile.salt);
			if (newHash === profile.password) {
				// authed
				const authToken = profile.auth_token;
				res.cookie("auth_token", authToken, {maxAge: 10000000});
				res.send(JSON.stringify({username: profile.username, token: profile.token, auth_token: authToken}));
			} else {
				res.send("Incorrect password")
			}
		}
	})

});

router.get('/am-i-logged-in', function (req, res, next) {
	const authToken = req.cookies.auth_token;
	if (!authToken) {
		res.send("no");
	} else {
		const collection = req.db.get("users");
		collection.findOne({auth_token: authToken}, function (err, profile) {
			if (!profile) {
				res.send("no");
			} else {
				res.send(JSON.stringify({username: profile.username, token: profile.token, password: profile.password}))
			}
		})
	}
})

router.post('/check_token', function (req, res, next) {
	const collection = req.db.get("users");
	collection.findOne({username: "hartloff"}, function (err, profile) {
		if(!profile){
			res.send("no hartloff account|");
		}else {
			if (req.body.token === profile.token) {
				let authToken = req.cookies.auth_token;
				collection.findOne({auth_token: authToken}, function (err, profile) {
					const hackedMessage = {hacked: true, username: "anon"};
					if (profile) {
						hackedMessage.username = profile.username;
					}
					req.wss.clients.forEach(function (client) {
						client.send(JSON.stringify(hackedMessage));
					})
					res.send("🎉🎉 You hacked me! Great work!! 🎉🎉|");
				});
			} else {
				res.send("You didn't hack me| the actual token was " + profile.token + " but you guessed " + req.body.token);
			}
		}
	})
});

function hashFunction(plainText, salt = "") {
	return crypto.createHash('sha256').update(plainText + salt).digest('base64');
	// return plainText;
}

// const myPassword = "1234";
const myPassword = crypto.randomBytes(10).toString('base64');
register("hartloff", myPassword, myPassword);

module.exports = router;





