#include <WiFi.h>
#include <MQTT.h>         //mqtt by Joël Gähwiler
#include <ModbusMaster.h> // ModbusMaster by Doc Walker
#include <NetworkClient.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include <HTTPUpdateServer.h>

// ตั้งชื่อสำหรับเข้าถึงผ่าน domain name
const char *host = "esp32-device1";
const char ssid[] = "G6PD_2.4G";
const char pass[] = "570610193";
const char email[] = "anusorn1998@gmail.com";

#define SERVER "pi.local"
#define UPDATETIME 5 // update time in second

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

unsigned long lastMillis = 0;
char espid[32];
float var[16];
const uint8_t numVariables = 16;
String keyname[numVariables] = {
    "Va", "Vb", "Vc",
    "Ia", "Ib", "Ic",
    "Pa", "Pb", "Pc",
    "PFa", "PFb", "PFc", "f",
    "Et", "Ei", "Ee"};
uint8_t timetoupdate = 0;
uint8_t checkSubscribe = 0;

void connect()
{
    Serial.print("checking wifi...");
    while (WiFi.status() != WL_CONNECTED)
    {
        Serial.print(".");
        delay(1000);
    }

    if (MDNS.begin(host))
    {
        Serial.println("mDNS responder started");
    }

    httpUpdater.setup(&httpServer);
    httpServer.begin();

    MDNS.addService("http", "tcp", 80);
    Serial.printf("HTTPUpdateServer ready! Open http://%s.local/update in your browser\n", host);

    Serial.print("\nMQTT connecting...");
    while (!client.connect(espid, email, "pi"))
    {
        Serial.print(".");
        delay(1000);
    }

    Serial.println("\nconnected!");

    client.subscribe(String(espid) + String("/#"));
}

void messageReceived(String &topic, String &payload)
{
    Serial.println("incoming: " + topic + " - " + payload);
    checkSubscribe = 0;
}

void setup()
{
    Serial.begin(115200);
    WiFi.begin(ssid, pass);
    RS485Serial.begin(9600, SERIAL_8N1, MAX485_RO, MAX485_DI); // serial สำหรับติดต่อกับ MAX485

    node.preTransmission(preTransmission); // Callbacks allow us to configure the RS485 transceiver correctly
    node.postTransmission(postTransmission);
    node.begin(ADDRESS, RS485Serial);

    readEspid();

    client.begin(SERVER, net);
    client.onMessage(messageReceived);

    connect();
}

void loop()
{
    httpServer.handleClient();
    client.loop();
    if (!client.connected())
    {
        connect();
    }

    if (millis() - lastMillis > 1000)
    {
        lastMillis = millis();

        bool isCanRead = readFromMeter();

        timetoupdate++;
        if (timetoupdate >= UPDATETIME && isCanRead)
        {
            timetoupdate = 0;

            updateParameter();

            checkSubscribe++;
            if (checkSubscribe >= 10)
            {
                client.subscribe(String(espid) + String("/#"));
            }
        }
    }
}

bool readFromMeter()
{

#ifdef TESTMODE
    var[0] = random(2000, 2500) * 0.1; // Va
    var[1] = random(2000, 2500) * 0.1; // Vb
    var[2] = random(2000, 2500) * 0.1; // Vc
    var[3] = random(0, 1000) * 0.01;   // Ia
    var[4] = random(0, 1000) * 0.01;   // Ib
    var[5] = random(0, 1000) * 0.01;   // Ic

    // power with signed
    // int16_t power = int16_t(node.getResponseBuffer(8)); // Pa
    var[6] = random(0, 5000) / 1000.0; // to kW
    // power = int(node.getResponseBuffer(9));             // Pb
    var[7] = random(0, 5000) / 1000.0; // to kW
    // power = int(node.getResponseBuffer(10));            // Pc
    var[8] = random(0, 5000) / 1000.0; // to kW

    var[9] = random(800, 1000) * 0.001;  // PFa
    var[10] = random(800, 1000) * 0.001; // PFb
    var[11] = random(800, 1000) * 0.001; // PFc

    var[12] = random(4980, 5020) * 0.01; // f

    var[13] = 1.3; // Et

    var[14] = 1.2; // Ei

    var[15] = 0; // Ee
#else
    uint8_t result;
    result = node.readInputRegisters(0x0000, 51);
    disConnect();
    if (result == node.ku8MBSuccess) /* If there is a response */
    {
        var[0] = node.getResponseBuffer(0) * 0.1;  // Va
        var[1] = node.getResponseBuffer(1) * 0.1;  // Vb
        var[2] = node.getResponseBuffer(2) * 0.1;  // Vc
        var[3] = node.getResponseBuffer(3) * 0.01; // Ia
        var[4] = node.getResponseBuffer(4) * 0.01; // Ib
        var[5] = node.getResponseBuffer(5) * 0.01; // Ic

        // power with signed
        int16_t power = int16_t(node.getResponseBuffer(8)); // Pa
        var[6] = power / 1000.0;                            // to kW
        power = int(node.getResponseBuffer(9));             // Pb
        var[7] = power / 1000.0;                            // to kW
        power = int(node.getResponseBuffer(10));            // Pc
        var[8] = power / 1000.0;                            // to kW

        var[9] = node.getResponseBuffer(20) * 0.001;  // PFa
        var[10] = node.getResponseBuffer(21) * 0.001; // PFb
        var[11] = node.getResponseBuffer(22) * 0.001; // PFc

        var[12] = node.getResponseBuffer(26) * 0.01; // f

        var[13] = node.getResponseBuffer(30) / 100.0; // Et

        var[14] = node.getResponseBuffer(40) / 100.0; // Ei

        var[15] = node.getResponseBuffer(50) / 100.0; // Ee
    }
    else
    {
        Serial.println("error read sensor");
        return false;
    }
#endif

    Serial.println("Va: " + String(var[0]));
    Serial.println("Vb: " + String(var[1]));
    Serial.println("Vc: " + String(var[2]));
    Serial.println("Ia: " + String(var[3]));
    Serial.println("Ib: " + String(var[4]));
    Serial.println("Ic: " + String(var[5]));
    Serial.println("Pa: " + String(var[6]));
    Serial.println("Pb: " + String(var[7]));
    Serial.println("Pc: " + String(var[8]));
    Serial.println("PFa: " + String(var[9]));
    Serial.println("PFb: " + String(var[10]));
    Serial.println("PFc: " + String(var[11]));
    Serial.println("f: " + String(var[12]));
    Serial.println("Et: " + String(var[13]));
    Serial.println("Ei: " + String(var[14]));
    Serial.println("Ee: " + String(var[15]));
    Serial.println("----------------------");

    return true;
}

void updateParameter()
{
    String payload = "{";
    for (uint8_t i = 0; i < numVariables; i++)
    {
        if (i)
            payload += ",";

        payload += "\"" + keyname[i] +
                   "\":" + String(var[i], getDecimalPlacesForDisplay(var[i]));
    }
    payload += "}";

    Serial.println("Update to server : " + String(SERVER));
    Serial.println(payload);
    client.publish(String(espid) + String("/update"), payload.c_str());
}

int getDecimalPlacesForDisplay(float value)
{
    String s = String(value, 3); // Convert to string with high precision
    int dotIndex = s.indexOf('.');
    if (dotIndex == -1)
    {
        return 0; // No decimal point, it's an integer
    }

    int decimalCount = 0;
    // Iterate from the end of the string backwards to find the last non-zero
    // digit
    for (int i = s.length() - 1; i > dotIndex; i--)
    {
        if (s.charAt(i) != '0')
        {
            decimalCount = i - dotIndex;
            break;
        }
    }
    return decimalCount;
}

void readEspid()
{
    uint32_t chipId = 0;

    for (int i = 0; i < 41; i = i + 8)
    {
        chipId |= ((ESP.getEfuseMac() >> (40 - i)) & 0xff) << i;
    }
    // DEBUGLN("ESP32 Chip model = " + String(ESP.getChipModel()) + "Rev " +
    // String(ESP.getChipRevision())); DEBUGLN("Chip ID: "); DEBUGLN(chipId, HEX);
    String espid_s = String(ESP.getChipModel()) + '-' + String(ESP.getChipRevision()) +
                     "_" + String(chipId, HEX);

    uint8_t ArrayLength = min((int)espid_s.length() + 1, (int)sizeof(espid)); // The +1 is for the 0x00h Terminator
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

void disConnect()
{
    pinMode(MAX485_RE, INPUT); /* Define RE Pin as Signal Output for RS485 converter. Output pin means Arduino command the pin signal to go high or low so that signal is received by the converter*/
    pinMode(MAX485_DE, INPUT); /* Define DE Pin as Signal Output for RS485 converter. Output pin means Arduino command the pin signal to go high or low so that signal is received by the converter*/
}

void update_started()
{
    Serial.println("CALLBACK:  HTTP update process started");
}

void update_finished()
{
    Serial.println("CALLBACK:  HTTP update process finished");
}

void update_progress(int cur, int total)
{
    Serial.printf("CALLBACK:  HTTP update process at %d of %d bytes...\n", cur, total);
}

void update_error(int err)
{
    Serial.printf("CALLBACK:  HTTP update fatal error code %d\n", err);
}