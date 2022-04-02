let socket = new WebSocket('ws://' + window.location.host);

socket.onmessage = function (message) {
	const parsedMessage = JSON.parse(message.data);
	if (parsedMessage.hacked) {
		const elem = document.getElementById("everything");
		elem.innerHTML = "<h1>This site was hacked by " + parsedMessage.username + "</h1>"
	} else {
		renderChatMessages(parsedMessage);
	}
};




