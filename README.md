# HTTP to MQTT bridge
Receive requests using HTTP and transfer them to your MQTT broker. The HTTP to MQTT bridge is written using Node JS with [Express](https://expressjs.com/) for HTTP server and [MQTT.js](https://www.npmjs.com/package/mqtt) client.

By default, the `http_to_mqtt` will listen on port 5000 and connect to a test mqtt server.  
The MQTT Broker (and other settings) can be specified by environment variables or .env file.

## Settings (Environment Variables)
```dotenv
MQTT_HOST=mqtt://test.mosquitto.org
MQTT_USER=
MQTT_PASS=
MQTT_CLIENT_ID=
API_KEY=MY_SECRET_KEY
DEBUG_MODE=false
PORT=5000
```
PS: Leave API_KEY empty for disabling it

## Docker Run
```sh
docker run -p 5000:5000 \
-e MQTT_HOST=mqtt://test.mosquitto.org \
-e API_KEY=MY_SECRET_KEY \
uilton/http_to_mqtt:latest
```


#### Publish to a topic
Publish a message to the topic 'MyTopic' (API_KEY is not necessary if it's not defined as environment variable)

Sending as POST with topic, message and api_key as body
```bash
curl -H "Content-Type: application/json" "http://localhost:5000/publish"  -d '{"topic" : "MyTopic", "message" : "hi", "api_key": "MY_SECRET_KEY" }'
```

OR

Sending as POST with 'topic' and 'message' as body and API_KEY as Header
```bash
curl -H "Content-Type: application/json" -H "API_KEY: MY_SECRET_KEY" "http://localhost:5000/publish"  -d '{"topic" : "MyTopic", "message" : "hi" }'
```

OR

Sending as GET (/publish/:topic/:message) and with api_key as Query Parameter
```bash
curl "http://localhost:5000/publish/MyTopic/hi?api_key=MY_SECRET_KEY"
```

OR

Sending as GET (/publish/:topic/:message) and with api_key as HEADER
```bash
curl -H "API_KEY: MY_SECRET_KEY" "http://localhost:5000/publish/MyTopic/hi"
```

OR

Sending as GET (/publish) with topic and message as Query Parameter and api_key as HEADER
```bash
curl -H "API_KEY: MY_SECRET_KEY" "http://localhost:5000/publish?topic=MyTopic&message=hi"
```

Response:
```
OK
```

#### Subscribe to a topic

You can subscribe to a topic.  `http_to_mqtt` will keep the connection open and wait for messages from the MQTT Broker and will send them as response when received.

Listen for messages in the topic 'MyTopic'.  Use `-ivs --raw` to see messages come in as they are received.

Sending as GET with 'topic' and 'api_key' as Query Parameter
```bash
curl -ivs --raw "http://localhost:5000/subscribe?topic=MyTopic&api_key=MY_SECRET_KEY"
```

OR

Sending as GET (/subscribe/:topic) with 'topic' as Path Parameter and 'API_KEY' as HEADER
```bash
curl -H "API_KEY: MY_SECRET_KEY" -ivs --raw "http://localhost:5000/subscribe/MyTopic"
```

output:
```
*   Trying ::1...
* TCP_NODELAY set
* Connected to localhost (::1) port 5000 (#0)
> GET /subscribe?topic=MyTopic HTTP/1.1
> Host: localhost:5000
> User-Agent: curl/7.54.1
> Accept: */*
>
```

Whenever a message is published to the topic MyTopic curl will output the message.

Use mosquitto_pub to publish a message (or send as http request, as above):
```bash
mosquitto_pub -t 'MyTopic' -m 'I sent this message using Mosquitto'
```

curl output:
```
<
23
I sent this message using Mosquitto
```