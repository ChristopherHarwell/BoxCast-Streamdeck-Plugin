let websocket = null,
  uuid = null,
  actionInfo = {};

function connectElgatoStreamDeckSocket(
  inPort,
  inPropertyInspectorUUID,
  inRegisterEvent,
  inInfo,
  inActionInfo
) {
  uuid = inPropertyInspectorUUID;
  actionInfo = JSON.parse(inActionInfo);

  websocket = new WebSocket("ws://localhost:" + inPort);

  websocket.onopen = function () {
    // WebSocket is connected, register the Property Inspector
    let json = {
      event: inRegisterEvent,
      uuid: inPropertyInspectorUUID,
    };
    websocket.send(JSON.stringify(json));

    json = {
      event: "getSettings",
      context: uuid,
    };
    websocket.send(JSON.stringify(json));

    json = {
      event: "getGlobalSettings",
      context: uuid,
    };
    websocket.send(JSON.stringify(json));
  };

  websocket.onmessage = function (evt) {
    // Received message from Stream Deck
    const jsonObj = JSON.parse(evt.data);
    if (jsonObj.event === "didReceiveSettings") {
      const payload = jsonObj.payload.settings;
      initiateElement("broadcastId", payload.broadcastId);
      initiateElement("broadcastPreview", payload.broadcastPreview);
      initiateElement("channelId", payload.channelId);
      initiateElement("broadcastPoster", payload.broadcastPoster);
      initiateElement("boxcasterId", payload.boxcasterId);
      initiateElement("boxcasterName", payload.boxcasterName);
      initiateElement("audioSource", payload.audioSource);
      initiateElement("startsAt", payload.startsAt);
      initiateElement("stopsAt", payload.stopsAt);
      initiateElement("timeframe", payload.timeframe);
      initiateElement("isPrivate", payload.isPrivate);
      initiateElement("isTicketed", payload.streamSource);
      initiateElement("streamSource", payload.isTicketed);
      initiateElement("ticketPrice", payload.ticketPrice);
      initiateElement("streamSource", payload.streamSource);
      initiateElement("freeVariant", payload.freeVariant);
      initiateElement("viewerUrl", payload.viewerUrl);
      initiateElement("totalViewCount", payload.totalViewCount);
      initiateElement("totalMinutesViewed", payload.totalMinutesViewed);
      initiateElement("totalActiveViewerCount", payload.totalActiveViewerCount);
      initiateElement("inChannelIds", payload.inChannelIds);
      initiateElement("staticPlaylistUrl", payload.staticPlaylistUrl);
    }
    if (jsonObj.event === "didReceiveGlobalSettings") {
      const payload = jsonObj.payload.settings;
      initiateElement("apiKey", payload.apiKey);
      initiateElement("provider", payload.provider, "weatherApi");
      const el = document.querySelector(".sdpi-wrapper");
      el && el.classList.remove("hidden");
    }
  };
}

/**
 * 
 * @param {*} element 
 * @param {*} value 
 * @param {*} fallback 
 * @returns The element value. If the value is undefined it returns ""
 */
function initiateElement(element, value, fallback = "") {
  if (typeof value === "undefined") {
    document.getElementById(element).value = fallback;
    return;
  }
  document.getElementById(element).value = value;
}

function updateSettings() {
  if (websocket && websocket.readyState === 1) {
    let payload = {};
    payload.cityName = document.getElementById("cityName").value;
    payload.frequency = document.getElementById("frequency").value;
    payload.unit = document.getElementById("unit").value;
    payload.roundDegree = document.getElementById("roundDegree").value;
    payload.displayCity = parseInt(
      document.getElementById("displayCity").value
    );
    const json = {
      event: "setSettings",
      context: uuid,
      payload: payload,
    };
    websocket.send(JSON.stringify(json));
  }
}

function updateGlobal() {
  if (websocket && websocket.readyState === 1) {
    let payload = {};
    payload.provider = document.getElementById("provider").value;
    payload.apiKey = document.getElementById("apiKey").value;
    const json = {
      event: "setGlobalSettings",
      context: uuid,
      payload,
    };
    websocket.send(JSON.stringify(json));
  }
}

function openPage(site) {
  if (websocket && websocket.readyState === 1) {
    const json = {
      event: "openUrl",
      payload: {
        url: `https://${site}`,
      },
    };
    websocket.send(JSON.stringify(json));
  }
}
// TODO: Change this to use the BoxCast auth urls
function getProviderUrl() {
  const provider = document.getElementById("provider").value || "weatherApi";
  let url;
  switch (provider) {
    case "weatherApi":
      url = "weatherapi.com/my/";
      break;
    case "openWeatherMap":
      url = "home.openweathermap.org/api_keys";
      break;
  }
  return url;
}
