var WifiMode = {NULL:1, AP:2, CLIENT:3};
var WS_PORT = 8080;
var SETTINGS_FILE = "./pistream_settings.json";

var fs = require('fs');
var wpa_supplicant = require('wireless-tools/wpa_supplicant');
var udhcpc = require('wireless-tools/udhcpc');
var hostapd = require('wireless-tools/hostapd');

var hostapdOptions = require('./hostapd_options.json');
var settings = require(SETTINGS_FILE);

//check if we should try to start in AP or client mode
if(settings.wifi_mode == WifiMode.CLIENT && settings.stored_connections != null){
  startClientMode(settings.stored_connections);
} else {
  startAPMode();
}

private void startAPMode(){
  hostapd.enable(hostapdOptions, function(err){
    if(err){
      //CRITICAL FAILURE
    } else {
      settings.wifi_mode = WifiMode.AP;
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings));
      startServer();
    }
  });
}

private void startClientMode(connection){
  wpa_supplicant.enable(connection, function(err){
    if(err){
      connectionFailure();
    } else {
      dhcp(connection);
    }
  });
}

private void dhcp(connection){
  var options = {
    interface:'wlan0';
  };
  udhcpc.enable(options, function(err){
    if(err){
      connectionFailure();
    } else {
      settings.wifi_mode = WifiMode.CLIENT;
      settings.stored_connection = connection;
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings));
      startServer();
    }
  });
}

private void connectionFailure(){
  udhcpc.disable('wlan0', function(err){
    if(settings.wifi_mode == WifiMode.NULL){
      startAPMode();
    } else if (wifiMode == WifiMode.AP) {
      //send failure message to WS connections
    }
  });
}

private void stopClientMode(connection){
  udhcpc.disable('wlan0', function(err){
    wpa_supplicant.disable(connection, function(err){
      startAPMode();
    });
  });
}

private void startServer(){
  //start listening for WS commands
  const WebSocket = require('ws');
  const wss = new WebSocket.server({port:WS_PORT});

  wss.on('connection', function connection(ws){
    ws.on('message', function incoming(message){
      //TODO: handle malformed message JSON
      var msg = JSON.parse(message);
      switch(msg.type){

        case 'connectToLAN':
          if(settings.wifi_mode == WifiMode.AP){
            startClientMode(msg.connection);
            //TODO: handle failure and return error response
          } else {
            //TODO: respond with error, must be in AP mode to attempt LAN connect
          }
          break;

        case 'disconnectFromLAN':
          if(settings.wifi_mode == WifiMode.CLIENT){
            stopClientMode(msg.connection);
            //TODO: handle failure and return error response
          } else {
            //TODO: respond with error, must be in CLIENT mode to attempt LAN disconnect
          }
          break;

        case 'getSources':
          break;

        case 'getZones':
          break;

        case 'connectToSnapServer':
          break;

        case 'disconnectFromSnapServer':
          break;

        case 'play':
          break;

        case 'stop':
          break;

        case 'volume':
          break;

        case 'shuffle':
          break;

        case 'repeat':
          break;

        case 'skip':
          break;

        case 'back':
          break;

        case 'slide':
          break;
      }
    })
  }
}
