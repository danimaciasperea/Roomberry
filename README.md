# Roomberry

**Roomberry** is a surveillance robot based on **Roomba** using a **Raspberry Pi Zero W** and a **camera module**. A demo of Roomberry's capabilities as well as the web interface developed to interact with the robot can be seen in the following video:

[![Roomberry Demo](https://domoticproject.com/wp-content/uploads/2018/08/RoomberryDemoVisualCue.png)](https://www.youtube.com/watch?&v=kQcQSE5pvNA "Roomberry Demo")

## Requirements

To build this project you will need:
-	A **mini DIN 7 male connector** (DIN 8 is compatible too) with Roomba's pin 3 (RxD), 4 (TxD) and 5 (BRC).
-	A compatible **Roomba** (series 600/700/800) adapted to provide a regulated 5 V power source direct from the battery using an step-down (Pololu D24V5F5 is a good option).
-	A **Raspberry Pi Zero W** with Raspbian Stretch Lite version installed. The following software should also be installed: pyserial library, picamera [package](https://github.com/waveform80/picamera). and an adapted version of Matthew Witherwax' Python iRobot [library](https://github.com/danimaciasperea/irobot). 
-	A **Raspberry camera module** (I used Version 1).
-	A HAT (Hardware Attached on Top) board to connect Raspberry's GPIO with a **Logical Level Converter** (Roomba's Serial is 5 V compatible but Raspberry uses 3.3 V).
<p align="center">
<img src="https://domoticproject.com/wp-content/uploads/2018/08/Roofino_Roomba_RaspberryPiZeroW_Camera2.jpg">
</p>
<p align="center">
<img src="https://domoticproject.com/wp-content/uploads/2018/08/Roomberry-Front-View.jpg">
</p>

## How it works

`Roomberry.py` creates a **multithreading python web server** that interacts with Roomba and the camera module installed. This code is intended to run as a daemon and handles the HTTP GET Requests performed against the Raspberry Pi.

To install it just download the last release and configure it as a service:
```bash
wget https://github.com/danimaciasperea/Roomberry/archive/V1.1.tar.gz /tmp/
tar -xvf /tmp/V1.1.tar.gz

# Before doing next step, adapt the code to your environment (serial port used, IFTTT Key, etc.)
sudo cp /tmp/v1.1/roomberry/roomberry.py /usr/local/bin/
sudo cp /tmp/v1.1/roomberry/roomberry.service lib/systemd/system/

sudo systemctl enable roomberry.service
system roomberry start

```

The commands sent to the robot are encoded in the **request's  URL query string**. The URL path should start with `cam` or `roomba` depending on the device that will execute the operation. If the command needs one or more parameters, they should be just passed as a field-value pair in the query string.

For instance:

```bash
#Send a clean command to Roomba
curl roomberry/roomba/?op=clean

#Drive Roomba straight at 20 mm/s
curl roomberry/roomba/?op=drive&velocity=20&radius=32768

#Set camera saturation to 65
curl roomberry/cam/?op=cam&saturation=65

#Download picture taken the 10th 08 2018 at 10:28:49
wget roomberry/cam/20180810/20180810-102849.jpg
```

To use the **web interface** you will need a Raspberry running `apache2` with `PHP` enabled. Just deploy the web-application on the web server path. For instance:

```bash
sudo cp -R /tmp/v1.1/web-app/ /var/www/
```

It has been designed using Bootstrap framework (HTML5 and Javascript with AJAX requests). You will probably need to adapt the `HTML` code to your particular needs/environment.

<p align="center">
<img src="https://domoticproject.com/wp-content/uploads/2018/08/Screen-capture-WebInterface-Roomberry.png">
</p>

Find the complete instructions on how to build this project in the following [post](https://domoticproject.com/roomberry-surveillance-robot-roomba-raspberry-pi-zero-w-camera/).

## License
This project is licensed under the MIT License - see the  [license file](LICENSE.md) for details

## Legal Notice
Roomba is a trademark of iRobot Corporation. All other trademarks are the property of their respective owners.

## Acknowledgments

-  Matthew Witherwax' Python iRobot [library](https://github.com/julianpistorius/irobot).
-  Picamera [package](https://github.com/waveform80/picamera).



