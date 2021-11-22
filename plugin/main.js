let websocket = null,
  pluginUUID = null,
  apiKey = "",
  provider = "";

function connectElgatoStreamDeckSocket(
  inPort,
  inPluginUUID,
  inRegisterEvent,
  inInfo
) {
  pluginUUID = inPluginUUID;

  // Open the web socket
  websocket = new WebSocket("ws://localhost:" + inPort);

  websocket.onopen = function () {
    // WebSocket is connected, register the plugin
    const json = {
      event: inRegisterEvent,
      uuid: inPluginUUID,
    };

    websocket.send(JSON.stringify(json));
  };

  websocket.onmessage = function (evt) {
    // Received message from Stream Deck
    const jsonObj = JSON.parse(evt.data);
    const context = jsonObj["context"];

    if (jsonObj["event"] === "keyUp") {
      let cityName = "";
      let unit = "";
      let displayCity = 0;
      let roundDegree = true;
      let frequency = null;

      if (
        jsonObj.payload.settings != null &&
        jsonObj.payload.settings.hasOwnProperty("cityName") &&
        jsonObj.payload.settings.hasOwnProperty("unit") &&
        jsonObj.payload.settings.hasOwnProperty("frequency") &&
        jsonObj.payload.settings.hasOwnProperty("roundDegree")

      ) {
        cityName = jsonObj.payload.settings["cityName"].toLowerCase();
        unit = jsonObj.payload.settings["unit"];
        displayCity = jsonObj.payload.settings["displayCity"];
        roundDegree = jsonObj.payload.settings["roundDegree"] === "true";
        frequency =
          jsonObj.payload.settings["frequency"] !== "0"
            ? parseInt(jsonObj.payload.settings["frequency"])
            : false;
      }

      if (cityName === "" || apiKey === "") {
        const json = {
          event: "showAlert",
          context: jsonObj.context,
        };
        websocket.send(JSON.stringify(json));
      } else {
        sendRequest(context, cityName, displayCity, unit, roundDegree);
        if (frequency) {
          setInterval(
            () => sendRequest(context, cityName, displayCity, unit, roundDegree),
            frequency
          );
        }
      }
    } else if (jsonObj["event"] === "didReceiveGlobalSettings") {
      if (
        jsonObj.payload.settings != null &&
        jsonObj.payload.settings.hasOwnProperty("apiKey")
      ) {
        apiKey = jsonObj.payload.settings["apiKey"];
        provider = jsonObj.payload.settings["provider"] || "weatherApi";
      }
    } else if (jsonObj["event"] === "keyDown") {
      const json = {
        event: "getGlobalSettings",
        context: pluginUUID,
      };

      websocket.send(JSON.stringify(json));
    }
  };
}

function sendAuthRequest(clientId, clientSecret) {
  try {
    fetch('https://api.boxcast.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      form: {
        grant_type: 'client_credentials',
        scope: 'owner',
      },
      auth: {
        user: clientId,
        pass: clientSecret,
      }
    })
  } catch (error) {
    console.error(error);
  } finally {
    (err, response, body) => {
      if (!err && response.statusCode == 200) {
        console.log(JSON.parse(body));
      } else {
        console.error(err, JSON.parse(body));
      }
    }
  }
  function sendBroadcastRequest() {
    let clientId = "";
    let clientSecret = "";
    try {
      sendAuthRequest(clientId, clientSecret);
    } catch (err) { }
    fetch(`https://api.boxcast.com/account/broadcasts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        name: "Hello World",
        description: "This is a test broadcast",
        broadcast_type: "live",
        start_time: "2020-01-01T00:00:00Z",
        end_time: "2020-01-01T00:00:00Z",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const json = {
          event: "showAlert",
          context: pluginUUID,
          payload: {
            title: "Broadcast Created",
            message: `Broadcast created successfully with ID: ${data.id}`,
          },
        };
        websocket.send(JSON.stringify(json));
      })
      .catch((err) => {
        const json = {
          event: "showAlert",
          context: pluginUUID,
          payload: {
            title: "Error",
            message: `Error creating broadcast: ${err}`,
          },
        };
        websocket.send(JSON.stringify(json));
      });
  }