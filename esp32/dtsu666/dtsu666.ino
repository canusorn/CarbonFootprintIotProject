// library by esp32
#include <WiFi.h>
#include <NetworkClient.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include <HTTPUpdateServer.h>

#include <MQTT.h>          //mqtt by Joël Gähwiler
#include <ModbusMaster.h>  // ModbusMaster by Doc Walker

#include <Wire.h>              // Wire library for I2C communication
#include <Adafruit_SSD1306.h>  // Adafruit SSD1306 library by Adafruit
#include <Adafruit_GFX.h>      // Adafruit GFX library by Adafruit

// ตั้งชื่อสำหรับเข้าถึงผ่าน domain name
const char *host = "esp32-device1";
const char ssid[] = "G6PD_2.4G";
const char pass[] = "570610193";
const char email[] = "anusorn1998@gmail.com";

#define SERVER "pi.local"
// #define SERVER "192.168.1.221"
#define UPDATETIME 5  // update time in second

// pin ที่สั่ง on off
#define CONTROLPIN 15

// คอมเม้นเมื่อใช้งานต่อเซนเซอร์จริง
// #define TESTMODE
#define ADDRESS 1

#define MAX485_RO 18
#define MAX485_RE 9
#define MAX485_DE 9
#define MAX485_DI 21

#define RS485Serial Serial1

ModbusMaster node;
WiFiClient net;
MQTTClient client(512);
WebServer httpServer(80);
HTTPUpdateServer httpUpdater;

#define OLED_RESET 0
Adafruit_SSD1306 oled(OLED_RESET);

unsigned long lastMillis = 0;
char espid[32];
float varfloat[16];
const uint8_t numVariables = 16;
String keyname[numVariables] = {
  "Va", "Vb", "Vc",
  "Ia", "Ib", "Ic",
  "Pa", "Pb", "Pc",
  "PFa", "PFb", "PFc", "f",
  "Et", "Ei", "Ee"
};
uint8_t timetoupdate = 0;
uint8_t checkSubscribe = 0;

void connect() {
  Serial.print("checking wifi...");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(1000);
  }

  if (MDNS.begin(host)) {
    Serial.println("mDNS responder started");
  }

  httpUpdater.setup(&httpServer);
  httpServer.begin();

  MDNS.addService("http", "tcp", 80);
  Serial.printf("HTTPUpdateServer ready! Open http://%s.local/update in your browser\n", host);

  Serial.print("\nMQTT connecting...");
  while (!client.connect(espid, email, "pi")) {
    Serial.print(".");
    delay(1000);
  }

  Serial.println("\nconnected!");

  client.subscribe(String(espid) + String("/#"));
  client.subscribe("control/" + String(espid));
}

void messageReceived(String &topic, String &payload) {
  Serial.println("incoming: " + topic + " - " + payload);
  checkSubscribe = 0;
  
  if (topic == String(espid) + String("/update")) {
    Serial.println("publish success");
  }
  else if (topic == String(espid) + "/control") {
    Serial.println("Control command received: " + payload);
    
    // Parse JSON payload
    // Expected format: {"command":"ON","timestamp":"...","user":"..."}
    if (payload.indexOf("\"command\":\"ON\"") != -1) {
      Serial.println("Turning device ON");
      // Add your device ON logic here
      // For example: digitalWrite(RELAY_PIN, HIGH);
      digitalWrite(CONTROLPIN, HIGH);

      // Send confirmation back
      String confirmTopic = String(espid) + "/confirm";
      client.publish(confirmTopic, "{\"status\":\"ON\",\"timestamp\":\"" + String(millis()) + "\"}");
    }
    else if (payload.indexOf("\"command\":\"OFF\"") != -1) {
      Serial.println("Turning device OFF");
      // Add your device OFF logic here
      // For example: digitalWrite(RELAY_PIN, LOW);
      digitalWrite(CONTROLPIN, LOW);
      
      // Send confirmation back
      String confirmTopic = String(espid) + "/confirm";
      client.publish(confirmTopic, "{\"status\":\"OFF\",\"timestamp\":\"" + String(millis()) + "\"}");
    }
    else {
      Serial.println("Unknown control command");
    }
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, pass);
  RS485Serial.begin(9600, SERIAL_8N1, MAX485_RO, MAX485_DI);  // serial สำหรับติดต่อกับ MAX485

  // Set control pin as output
  pinMode(CONTROLPIN, OUTPUT);
  digitalWrite(CONTROLPIN, LOW);

  //------Display LOGO at start------
  oled.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  oled.clearDisplay();
  oled.setTextSize(1);
  oled.setTextColor(WHITE);
  oled.setCursor(0, 0);
  oled.print("Carbon\nFootprint\nProject");
  oled.display();

  node.preTransmission(preTransmission);  // Callbacks allow us to configure the RS485 transceiver correctly
  node.postTransmission(postTransmission);
  node.begin(ADDRESS, RS485Serial);

  readEspid();

  client.begin(SERVER, net);
  client.onMessage(messageReceived);

  connect();
}

void loop() {
  httpServer.handleClient();
  client.loop();
  if (!client.connected()) {
    connect();
  }

  if (millis() - lastMillis > 1000) {
    lastMillis = millis();

    bool isCanRead = readFromMeter();

    displayUpdate(isCanRead);

    timetoupdate++;
    if (timetoupdate >= UPDATETIME && isCanRead) {
      timetoupdate = 0;

      updateParameter();

      checkSubscribe++;
      if (checkSubscribe >= 10)  // resubscribe after 10 times
      {
        client.subscribe(String(espid) + String("/#"));
      }
    }
  }
}

bool readFromMeter() {

#ifdef TESTMODE
  varfloat[0] = random(2000, 2500) * 0.1;  // Va
  varfloat[1] = random(2000, 2500) * 0.1;  // Vb
  varfloat[2] = random(2000, 2500) * 0.1;  // Vc
  varfloat[3] = random(0, 1000) * 0.01;    // Ia
  varfloat[4] = random(0, 1000) * 0.01;    // Ib
  varfloat[5] = random(0, 1000) * 0.01;    // Ic

  // power with signed
  // int16_t power = int16_t(node.getResponseBuffer(8)); // Pa
  varfloat[6] = random(0, 5000) / 1000.0;  // to kW
  // power = int(node.getResponseBuffer(9));             // Pb
  varfloat[7] = random(0, 5000) / 1000.0;  // to kW
  // power = int(node.getResponseBuffer(10));            // Pc
  varfloat[8] = random(0, 5000) / 1000.0;  // to kW

  varfloat[9] = random(800, 1000) * 0.001;   // PFa
  varfloat[10] = random(800, 1000) * 0.001;  // PFb
  varfloat[11] = random(800, 1000) * 0.001;  // PFc

  varfloat[12] = random(4980, 5020) * 0.01;  // f

  varfloat[13] = 1.3;  // Et

  varfloat[14] = 1.2;  // Ei

  varfloat[15] = 0;  // Ee
#else

  uint32_t var[16];
  uint8_t result;
  uint32_t tempdouble = 0x00000000;
  result = node.readInputRegisters(0x2006, 64);
  disConnect();
  if (result == node.ku8MBSuccess) {
    // voltage
    tempdouble = (node.getResponseBuffer(0) << 16) + node.getResponseBuffer(1);
    var[0] = tempdouble;

    tempdouble = (node.getResponseBuffer(2) << 16) + node.getResponseBuffer(3);
    var[1] = tempdouble;

    tempdouble = (node.getResponseBuffer(4) << 16) + node.getResponseBuffer(5);
    var[2] = tempdouble;

    // current
    tempdouble = (node.getResponseBuffer(6) << 16) + node.getResponseBuffer(7);
    var[3] = tempdouble;

    tempdouble = (node.getResponseBuffer(8) << 16) + node.getResponseBuffer(9);
    var[4] = tempdouble;

    tempdouble = (node.getResponseBuffer(10) << 16) + node.getResponseBuffer(11);
    var[5] = tempdouble;

    // power
    tempdouble = (node.getResponseBuffer(14) << 16) + node.getResponseBuffer(15);
    var[6] = tempdouble;

    tempdouble = (node.getResponseBuffer(16) << 16) + node.getResponseBuffer(17);
    var[7] = tempdouble;

    tempdouble = (node.getResponseBuffer(18) << 16) + node.getResponseBuffer(19);
    var[8] = tempdouble;

    // pf
    tempdouble = (node.getResponseBuffer(30) << 16) + node.getResponseBuffer(31);
    var[9] = tempdouble;

    tempdouble = (node.getResponseBuffer(32) << 16) + node.getResponseBuffer(33);
    var[10] = tempdouble;

    tempdouble = (node.getResponseBuffer(34) << 16) + node.getResponseBuffer(35);
    var[11] = tempdouble;

    // freq
    tempdouble = (node.getResponseBuffer(62) << 16) + node.getResponseBuffer(63);
    var[12] = tempdouble;

    // convert floating point
    // V
    varfloat[0] = hexToFloat(var[0]) * 0.1;
    varfloat[1] = hexToFloat(var[1]) * 0.1;
    varfloat[2] = hexToFloat(var[2]) * 0.1;
    // I
    varfloat[3] = hexToFloat(var[3]) * 0.001;
    varfloat[4] = hexToFloat(var[4]) * 0.001;
    varfloat[5] = hexToFloat(var[5]) * 0.001;
    // P to kW
    varfloat[6] = hexToFloat(var[6]) * 0.1 * 0.001;
    varfloat[7] = hexToFloat(var[7]) * 0.1 * 0.001;
    varfloat[8] = hexToFloat(var[8]) * 0.1 * 0.001;
    // pf
    varfloat[9] = hexToFloat(var[9]) * 0.001;
    varfloat[10] = hexToFloat(var[10]) * 0.001;
    varfloat[11] = hexToFloat(var[11]) * 0.001;
    // Freq
    varfloat[12] = hexToFloat(var[12]) * 0.01;
    
  } else {
    Serial.println("Error 0x2000 reading");
    return false;
  }

  result = node.readInputRegisters(0x4101E, 12);
  disConnect();
  if (result == node.ku8MBSuccess) /* If there is a response */
  {
    // ImpEnergy
    tempdouble = (node.getResponseBuffer(0) << 16) + node.getResponseBuffer(1);
    var[14] = tempdouble;

    // ExpEnergy
    tempdouble = (node.getResponseBuffer(10) << 16) + node.getResponseBuffer(11);
    var[15] = tempdouble;

    //  Etotal
    var[13] = var[14] - var[15];

    varfloat[13] = hexToFloat(var[13]);
    varfloat[14] = hexToFloat(var[14]);
    varfloat[15] = hexToFloat(var[15]);
  } else {
    Serial.println("Error Energy reading");
    return false;
  }

#endif

  Serial.println("Va: " + String(varfloat[0]));
  Serial.println("Vb: " + String(varfloat[1]));
  Serial.println("Vc: " + String(varfloat[2]));
  Serial.println("Ia: " + String(varfloat[3]));
  Serial.println("Ib: " + String(varfloat[4]));
  Serial.println("Ic: " + String(varfloat[5]));
  Serial.println("Pa: " + String(varfloat[6]));
  Serial.println("Pb: " + String(varfloat[7]));
  Serial.println("Pc: " + String(varfloat[8]));
  Serial.println("PFa: " + String(varfloat[9]));
  Serial.println("PFb: " + String(varfloat[10]));
  Serial.println("PFc: " + String(varfloat[11]));
  Serial.println("f: " + String(varfloat[12]));
  Serial.println("Et: " + String(varfloat[13]));
  Serial.println("Ei: " + String(varfloat[14]));
  Serial.println("Ee: " + String(varfloat[15]));
  Serial.println("----------------------");

  return true;
}

void updateParameter() {
  String payload = "{";
  for (uint8_t i = 0; i < numVariables; i++) {
    if (i)
      payload += ",";

    payload += "\"" + keyname[i] + "\":" + String(varfloat[i], getDecimalPlacesForDisplay(varfloat[i]));
  }
  payload += "}";

  Serial.println("Update to server : " + String(SERVER));
  Serial.println(payload);
  client.publish(String(espid) + String("/update"), payload.c_str());
}

// ---- ฟังก์ชันแสดงผลฝ่านจอ OLED ----
void displayUpdate(bool isCanRead) {
  //------Update OLED------
  oled.clearDisplay();
  oled.setTextSize(1);
  oled.setCursor(0, 0);
  if (isCanRead) {

    oled.println("3P [kW]");

    oled.setCursor(0, 15);
    oled.print("Pa ");
    if (varfloat[6] < 10)
      oled.print(varfloat[6], 2);
    else
      oled.print(varfloat[6], 0);

    oled.setCursor(0, 26);
    oled.print("Pb ");
    if (varfloat[7] < 10)
      oled.print(varfloat[7], 2);
    else
      oled.print(varfloat[7], 0);

    oled.setCursor(0, 37);
    oled.print("Pc ");
    if (varfloat[8] < 10)
      oled.print(varfloat[8], 2);
    else
      oled.print(varfloat[8], 0);
  } else {
    oled.println("No Sensor");
  }
  oled.display();
}

int getDecimalPlacesForDisplay(float value) {
  String s = String(value, 3);  // Convert to string with high precision
  int dotIndex = s.indexOf('.');
  if (dotIndex == -1) {
    return 0;  // No decimal point, it's an integer
  }

  int decimalCount = 0;
  // Iterate from the end of the string backwards to find the last non-zero
  // digit
  for (int i = s.length() - 1; i > dotIndex; i--) {
    if (s.charAt(i) != '0') {
      decimalCount = i - dotIndex;
      break;
    }
  }
  return decimalCount;
}

void readEspid() {
  uint32_t chipId = 0;

  for (int i = 0; i < 41; i = i + 8) {
    chipId |= ((ESP.getEfuseMac() >> (40 - i)) & 0xff) << i;
  }
  // DEBUGLN("ESP32 Chip model = " + String(ESP.getChipModel()) + "Rev " +
  // String(ESP.getChipRevision())); DEBUGLN("Chip ID: "); DEBUGLN(chipId, HEX);
  String espid_s = String(ESP.getChipModel()) + '-' + String(ESP.getChipRevision()) + "_" + String(chipId, HEX);

  uint8_t ArrayLength = min((int)espid_s.length() + 1, (int)sizeof(espid));  // The +1 is for the 0x00h Terminator
  espid_s.toCharArray(espid, ArrayLength);
}

void preTransmission() /* transmission program when triggered*/
{
  pinMode(MAX485_RE, OUTPUT); /* Define RE Pin as Signal Output for RS485 converter. Output pin means Arduino command the pin signal to go high or low so that signal is received by the converter*/
  pinMode(MAX485_DE, OUTPUT); /* Define DE Pin as Signal Output for RS485 converter. Output pin means Arduino command the pin signal to go high or low so that signal is received by the converter*/

  digitalWrite(MAX485_RE, 1); /* put RE Pin to high*/
  digitalWrite(MAX485_DE, 1); /* put DE Pin to high*/
  delay(1);                   // When both RE and DE Pin are high, converter is allow to transmit communication
}

void postTransmission() /* Reception program when triggered*/
{

  delay(3);                   // When both RE and DE Pin are low, converter is allow to receive communication
  digitalWrite(MAX485_RE, 0); /* put RE Pin to low*/
  digitalWrite(MAX485_DE, 0); /* put DE Pin to low*/
}

void disConnect() {
  pinMode(MAX485_RE, INPUT); /* Define RE Pin as Signal Output for RS485 converter. Output pin means Arduino command the pin signal to go high or low so that signal is received by the converter*/
  pinMode(MAX485_DE, INPUT); /* Define DE Pin as Signal Output for RS485 converter. Output pin means Arduino command the pin signal to go high or low so that signal is received by the converter*/
}

void update_started() {
  Serial.println("CALLBACK:  HTTP update process started");
}

void update_finished() {
  Serial.println("CALLBACK:  HTTP update process finished");
}

void update_progress(int cur, int total) {
  Serial.printf("CALLBACK:  HTTP update process at %d of %d bytes...\n", cur, total);
}

void update_error(int err) {
  Serial.printf("CALLBACK:  HTTP update fatal error code %d\n", err);
}


float hexToFloat(uint32_t hex_value) {
  union {
    uint32_t i;
    float f;
  } u;

  u.i = hex_value;
  return u.f;
}