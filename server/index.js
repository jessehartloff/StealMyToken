const express = require('express');
const router = express.Router();


router.get('/', function (req, res, next) {
	res.sendFile("index.html",);
});

router.post('/chat', function(req, res, next){
	const message = req.body;

	let authToken = req.cookies.auth_token;
	// console.log(authToken)
	if(!authToken){
		authToken = "none";
	}
	const user_collection = req.db.get("users");
	user_collection.findOne({auth_token: authToken}, function (err, profile) {
		if(err){
			return;
		}

		const fullMessage = {username: "anon", message: beSafe(message.message), token: "none"}
		if(profile){
			fullMessage.username = beSafe(profile.username);
			// fullMessage.token = profile.token;
		}
		const collection = req.db.get('chat');
		collection.insert(fullMessage);

		req.wss.clients.forEach(function(client) {
			client.send(JSON.stringify(fullMessage));
		})

		res.send("received message")
	});

});

router.get('/chat-history', function(req, res, next){
	const collection = req.db.get('chat');
	collection.find({}, {"_id": 0}, function (err, allHistory) {
		const history = [];
		for (let message of allHistory) {
			history.push(message);
		}
		res.send(JSON.stringify(history));
	});
});


function beSafe(dirty) {
	if(dirty.toLowerCase().includes("he has a human girlfriend")){
		dirty = "[Bee Movie Script]";
	}
	const maxLength = 1000;
	if(dirty.length > maxLength){
		dirty = dirty.substring(0, maxLength);
	}
	// return dirty;
	return dirty.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

module.exports = router;





