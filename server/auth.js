const crypto = require('crypto');
const express = require('express');
const router = express.Router();


router.get('/', function (req, res, next) {
	res.sendFile("index.html",);
});

router.post('/register', function (req, res, next) {
	// const data = {username: username, password1: password1, password2: password2}

	if (req.body.password1 === req.body.password2) {
		let password = req.body.password1;
		const username = req.body.username;
		const authToken = crypto.randomBytes(80).toString('base64');
		let token = crypto.randomBytes(1000).toString('base64');
		const salt = crypto.randomBytes(80).toString('base64');
		const hash = hashFunction(password, salt);
		const collection = req.db.get("users");
		collection.insert({username: username, password: hash, salt: salt, token: token, auth_token: authToken}, function (err) {
			res.send("Registered username: " + username)
		})
	} else {
		res.send("Passwords did not match");
	}
});

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
				res.send(JSON.stringify({username: profile.username, token: "no more", auth_token: authToken}));
			} else {
				res.send("Incorrect password, expected: " + profile.password + " with salt " + profile.salt)
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
				res.send(JSON.stringify({username: profile.username, token: hashFunction(profile.token), password: profile.password}))
			}
		})
	}
})

router.post('/check_token', function (req, res, next) {
	const collection = req.db.get("users");
	collection.findOne({username: "hartloff"}, function (err, profile) {
		if(!profile){
			res.send("no hartloff account");
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
					res.send("🎉🎉 You hacked me! Great work!! 🎉🎉");
				});
			} else {
				res.send("You didn't hack me");
			}
		}
	})
});

function hashFunction(plainText, salt = "") {
	return crypto.createHash('sha256').update(plainText + salt).digest('base64');
	// return plainText;
}

module.exports = router;





