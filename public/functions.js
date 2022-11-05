let myUsername = "anon"

document.addEventListener("keypress", function (event) {
	if (event.code === "Enter") {
		sendChat();
	}
});

function init() {
	ajax(false, "/chat-history", function (data) {
		const history = JSON.parse(data);
		for (const message of history) {
			renderChatMessages(message);
		}
	})
	ajax(false, "/am-i-logged-in", function (data){
		if(data !== "no"){
			console.log(data);
			loggedIn(JSON.parse(data));
		}
	})
}

function sendChat() {
	const message = getAndClear("chat");
	const data = {message: message, username: myUsername}
	if(message !== "") {
		console.log("sending " + JSON.stringify(data))
		ajax(data, "/chat", function (response) {
			setMessageFromServer(response);
		})
	}
}

function renderChatMessages(message) {
	const elem = document.getElementById("messages");
	elem.innerHTML += '<b v="' + message.token + '">' + message.username + "</b>: " + message.message + "<br/>";
}

function setMessageFromServer(message) {
	const elem = document.getElementById("message_from_server");
	elem.innerHTML = message;
}


function register() {
	const username = getAndClear("r_username")
	const password1 = getAndClear("r_password")
	const password2 = getAndClear("r_password2")
	const data = {username: username, password1: password1, password2: password2}
	ajax(data, "/register", function (response) {
		setMessageFromServer(response);
	})
}

function loggedIn(data){
	const elem = document.getElementById('auth');
	elem.innerHTML = "";
	elem.innerHTML += "Logged in as: " + data.username + "<br/>";
	elem.innerHTML += "Your token is: " + data.token + "<br/>";
}

function login() {
	const username = getAndClear("l_username")
	const password = getAndClear("l_password")
	const data = {username: username, password: password}
	ajax(data, "/login", function (response) {
		if(response.charAt(0) === '{'){
			loggedIn(JSON.parse(response));
		}else{
			setMessageFromServer(response);
		}
	})

}

function hacked() {
	const token = getAndClear("token")
	const data = {token: token}
	ajax(data, "/check_token", function (response) {
		setMessageFromServer(response);
	})
}


function getAndClear(elementId) {
	const elem = document.getElementById(elementId);
	const theValue = elem.value;
	elem.value = "";
	return theValue;
}

function ajax(data, path, callback) {
	const request = new XMLHttpRequest();
	request.onreadystatechange = function () {
		if (this.readyState === 4 && this.status === 200) {
			callback(this.response);
		}
	};
	if (!data) {
		request.open("GET", path);
		request.send();
	} else {
		request.open("POST", path);
		request.setRequestHeader("Content-Type", "application/json")
		request.send(JSON.stringify(data));
	}
}
