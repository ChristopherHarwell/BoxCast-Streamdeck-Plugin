
$SD.on("connected", (jsonObj) => connected(jsonObj));

function connected(jsn) {
  $SD.on("com.boxcast.stream-manager.http.keyDown", (jsonObj) =>
    sendHttp(jsonObj)
  );
}

/**
 * @param {{
 *   context: string,
 *   payload: {
 *     settings: {
 *       url?: string,
 *       method?: string,
 *       body?: string,
 *     }
 *   },
 * }} data
 */
function sendHttp(data) {
  const { url, method, body } = data.payload.settings;
  log("sendHttp", { url, method, body });
  if (!url || !method) {
    showAlert(data.context);
    return;
  }
  fetch(url, {
    cache: "no-cache",
    method,
    body,
  })
    .then(checkResponseStatus)
    .then(() => showOk(data.context))
    .catch((err) => {
      showAlert(data.context);
      logErr(err);
    });
}

/**
 * @param {void | Response} resp
 * @returns {Promise<Response>}
 */
async function checkResponseStatus(resp) {
  if (!resp) {
    throw new Error();
  }
  if (!resp.ok) {
    throw new Error(`${resp.status}: ${resp.statusText}\n${await resp.text()}`);
  }
  return resp;
}

/**
 * @param {WebSocket} ws
 */
function onOpen(ws) {
  log(`Connection to ${ws.url} opened`);
}

/**
 * @param {WebSocket} ws
 * @param {CloseEvent} evt
 */
function onClose(ws, evt) {
  log(`Connection to ${ws.url} closed:`, evt.code, evt.reason);
}

/**
 * @param {string} context
 */
function showOk(context) {
  $SD.api.showOk(context);
}

/**
 * @param {string} context
 */
function showAlert(context) {
  $SD.api.showAlert(context);
}

/**
 * @param  {...unknown} msg
 */
function log(...msg) {
  console.log(...msg);
  // $SD.api.logMessage(msg.map(stringify).join(" "));
}

/**
 * @param  {...unknown} msg
 */
function logErr(...msg) {
  console.error(...msg);
  // $SD.api.logMessage(msg.map(stringify).join(" "));
}

/**
 * @param {unknown} input
 * @returns {string}
 */
function stringify(input) {
  if (typeof input !== "object" || input instanceof Error) {
    return input.toString();
  }
  return JSON.stringify(input, null, 2);
}
