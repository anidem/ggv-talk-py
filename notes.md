<!-- notes.md -->

## Overview
Application that allows user clients (students) to join a private Slack channel and chat with a slack user client (tutor). Students interact through chat ui embedded in host application. Tutors interact through slack application where they can join and monitor multiple slack channels. A slack channel is reserved for a tutor and a single student in a one to many relationship.

## Application Components

Major components consist of a Slack client app, a browser client app, and ggvtalk, an intermediary communication proxy.

### Slack Client - slack
Slack application provides ui and generates and handles events relevant to a logged in Slack user account. Slack is the tutor's client.

#### API (implemented in Slack API)

### Brower Client - ggvuser
HTML/js client served from ggvtalk application. HTML client is embedded in iframe in host application. ggvuser is the student client.

#### Events
register (username, room_name, display_name)

- establishes a socket.io connection with ggvtalk
- connection is created with username, room_name, and display_name

send_msg (msg)

- implemented as a form submit in client js.
- socket.emit

recv_msg (event, data)

- route to relevant event handler in client js.
- socket.on (event) 

monitor_mode()

- put ui in monitor mode (remove chat input ui) but allow message display panel to continue to render incoming messages.

### GGVTalk - ggvtalk
ggvtalk is a nodejs server application that exposes the following services to ggvuser and slack components.

#### ggvtalk <==> ggvuser

- message handling: ggvtalk relays messages from ggvuser to slack private channel
- on boarding coordination from ggvuser client
- chat ui assets (html, js, css)

#### Events

register (username, room_name, display_name): ggvuser ==> ggvtalk

1. creates or joins specified room, sets username and display_name attributes for socket object.

2. determines online status of slack private channel tutor
	
	a. If tutor (associated slack user account) not detected, send message to ggvuser that tutor not available send monitor_mode event.

	b. Else continue with step 3.

3. add necessary private channel info to socket object. Necessary in order to relay messages between correct slack and ggvuser via a common socket.io room

4. sends message to ggvuser that slack tutor is online

#### ggvtalk <==> slack

- message handling: ggvtalk relays messages from slack to ggvuser
- message handling: ggvtalk handles and relays events (tutor online status, etc.) to ggvuser
- on boarding coordination from slack client




