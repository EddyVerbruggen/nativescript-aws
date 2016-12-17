// patch {N}'s xhr because AWS uses a few events that cause {N} to throw 'unsupported' errors
require("xhr");

var xhrAddEventListenerOrig = XMLHttpRequest.prototype.addEventListener;
XMLHttpRequest.prototype.addEventListener = function(eventName, callback) {
  if (eventName === "readystatechange") {
    this.onreadystatechange = callback;
  } else if (eventName === "progress") {
    this.onprogress = callback;
  } else if (eventName === "timeout") {
    this.ontimeout = callback;
  } else {
    xhrAddEventListenerOrig.call(this, eventName, callback);
  }
};
if (!XMLHttpRequest.prototype.upload) {
  XMLHttpRequest.prototype['upload'] = {
    addEventListener: function() {}
  };
}

module.exports = require("aws-sdk");