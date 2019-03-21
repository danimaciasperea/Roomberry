__author__ = 'Daniel Macías Perea (dani.macias.perea@gmail.com'

import picamera
import xml.etree.ElementTree as ET
import requests
import logging
import traceback
from fractions import Fraction
from ast import literal_eval
from socketserver import ThreadingMixIn
from pathlib import Path
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse, quote
from os import curdir, sep, remove, path, makedirs, stat, walk, listdir
from os.path import join, isdir, islink
from irobot.robots.create2 import Create2
from time import sleep, time, strftime, localtime
from threading import Thread, Lock
from subprocess import call

CAM_RESOLUTION = (1296, 972)
SNAP_RESOLUTION = (640, 480)
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
SNAP_QUALITY = 60
CAPTURE_QUALITY = 80
CAM_FRAMERATE = 30
CAM_ROTATION = 0
BATTERY_WATCHDOG_SLEEP_TIME = 600
IFTTT_KEY = ''
BATTERY_CRITICAL_LEVEL = 0.1
BATTERY_LOW_LEVEL = 0.3
PORT_NUMBER = 80
PORT_SERIAL = '/dev/serial0'
BRC_GPIO = 27
LOCK_TIMEOUT = 15
ANNOTATE_TEXT_SIZE = 30
ANNOTATE_TEXT = 'Roomberry %d-%m-%Y %H:%M:%S'
ANNOTATE_FOREGROUND_COLOR = '#ffffff'
ANNOTATE_BACKGROUND_COLOR = '#808080'
PATH_TO_WWW='/tmp'
PATH_TO_ROOMBA='/roomba/'
PATH_TO_CAM='/cam/'
PATH_TO_MEDIA='/media'
PATH_TO_ROOMBA_XML = PATH_TO_ROOMBA + 'roomba.xml'
PATH_TO_CAM_XML = PATH_TO_CAM + 'cam.xml'
PATH_TO_MEDIA_XML = PATH_TO_CAM + 'media.xml'
PATH_TO_SNAP = PATH_TO_CAM + 'snap.jpg'
PATH_TO_LOG = '/var/log/roomberry.log'

CAM_XML_TAGS = [ ('annotate_background'), ('annotate_foreground'), ( 'annotate_text_size'), ('awb_mode'), ('brightness'), ('contrast'), ('drc_strength'), \
    ('exposure_compensation'), ('exposure_mode'), ('framerate', 'numerator'), ('hflip'), ('image_denoise'), ('image_effect'), ('iso'), \
    ('local','annotate_text'), ('local','snap_resolution_height'), ('local','snap_resolution_width'), ('local','snap_quality'), \
    ('local','capture_quality'), ('recording'), ('resolution', 'width'), ('resolution', 'height'), ('rotation'), ('saturation'), \
    ('sharpness'), ('vflip'), ('video_denoise'), ('video_stabilization')]
    
ROOMBA_XML_TAGS = [('bumps_and_wheel_drops','bump_left'), ('bumps_and_wheel_drops','bump_right'), ('bumps_and_wheel_drops','wheel_drop_left'), \
    ('bumps_and_wheel_drops','wheel_drop_right'), ('cliff_left_sensor'), ('cliff_front_left_sensor'), ('cliff_front_right_sensor'), \
    ('cliff_right_sensor'), ('virtual_wall_sensor'), ('dirt_detect_sensor'), ('ir_character_left'), ('ir_character_right'), \
    ('distance'), ('angle'), ('charging_state'), ('voltage'), ('current'), ('temperature'), ('battery_charge'), ('battery_capacity'), \
    ('cliff_left_signal'), ('cliff_front_left_signal'), ('cliff_front_right_signal'), ('cliff_right_signal'), \
    ('charging_sources', 'internal_charger'), ('charging_sources', 'home_base'), ('oi_mode'), ('requested_velocity'), ('requested_radius'), \
    ('requested_left_velocity'), ('requested_right_velocity'), ('left_encoder_counts'), ('right_encoder_counts'), ('light_bumper', 'left'), \
    ('light_bumper', 'front_left'), ('light_bumper', 'center_left'), ('light_bumper', 'center_right'), ('light_bumper', 'front_right'), \
    ('light_bumper', 'right'), ('light_bump_left_signal'), ('light_bump_front_left_signal'), ('light_bump_center_left_signal'), \
    ('light_bump_center_right_signal'), ('light_bump_front_right_signal'), ('light_bump_right_signal'), ('left_motor_current'), ('right_motor_current'), \
    ('main_brush_motor_current'), ('side_brush_motor_current'), ('stasis', 'toggling'), ('stasis', 'disabled')]
    
#This class represents the web server and makes camera and roomba
#available to incoming HTTP requests   
class RoomberryServer(ThreadingMixIn, HTTPServer):

    def __init__(self, server_address, server_handler, serial_port, brc_pin):
        super().__init__(server_address, server_handler)
        self.logger = logging.getLogger('Roomberry')
        
        #Initialize camera
        self.camera_lock = Lock()        
        self.start_camera()
        self.last_camera_operation = time()
        
        #Wake up an initialize roomba
        self.roomba = Create2(serial_port, brc_pin, enable_quirks=False)
        self.roomba.logger.disabled = True
        self.roomba_lock = Lock()
        self.distance = 0
        self.angle = 0
        
        #Start watchdog thread
        self.battery_watchdog_thread = Thread(target = self.battery_watchdog)
        self.battery_watchdog_thread.setDaemon(True)
        
    def start(self):
        self.logger.info('Rooomberry Server correctly started.')
        self.battery_watchdog_thread.start()
        self.serve_forever()
        
    def stop(self):
        self.logger.info('Rooomberry Server correctly stopped.')  
        self.server_close()
        
        if self.roomba_lock.locked():
            self.roomba_lock.release()
        self.roomba.stop()
        
        if self.camera_lock.locked():
            self.camera_lock.release()
        self.camera.close()
            
    def handle_error(self, request, client_address):
        self.logger.info('Exception happened during processing of request from %s', client_address, exc_info=True)        
        
    def battery_watchdog(self):
        self.roomba_lock.acquire(timeout=LOCK_TIMEOUT)
        battery_capacity = self.roomba.battery_capacity
        self.roomba_lock.release()
        
        while True:
            try:
                self.roomba_lock.acquire(timeout=LOCK_TIMEOUT)
                battery_charge = self.roomba.battery_charge
                home_base = self.roomba.charging_sources.home_base
                self.roomba_lock.release()
                battery_level = (battery_charge / battery_capacity)
                
                if (time() - self.last_camera_operation) >= BATTERY_WATCHDOG_SLEEP_TIME - 15 and not self.camera.closed:
                    self.camera.close()
                    self.logger.info('Closing camera due to inactivity.')
                
                if battery_level < BATTERY_CRITICAL_LEVEL and not home_base:
                    self.logger.info('Battery reached critic level. Stopping and turning off Roomberry.')
                    self.roomba_lock.acquire(timeout=LOCK_TIMEOUT)
                    self.roomba.power_down()
                    self.roomba.stop()
                    self.roomba_lock.release()
                    requests.post("https://maker.ifttt.com/trigger/roomberry_battery_critical/with/key/" + IFTTT_KEY, data={"value1" :  str(round(float(battery_level * 100),1)) + "%"})
                    call("sudo shutdown -h now", shell=True) 
                     
                elif battery_level < BATTERY_LOW_LEVEL and not home_base:
                    self.logger.info('Battery reached warning level. Searching dock station.')
                    self.roomba_lock.acquire(timeout=LOCK_TIMEOUT)
                    self.roomba.seek_dock()    
                    self.roomba_lock.release()  
                    requests.post("https://maker.ifttt.com/trigger/roomberry_battery_low/with/key/" + IFTTT_KEY, data={"value1" :  str(round(float(battery_level * 100),1)) + "%"})
            
            except Exception as e:
                self.logger.error('error: Battery Watchdog failed: ' + str(e) + '\n' +traceback.format_exc())
                
            sleep(BATTERY_WATCHDOG_SLEEP_TIME)
       
    def start_camera(self):     
        self.annotate_text = ANNOTATE_TEXT
        self.snap_quality = SNAP_QUALITY
        self.capture_quality = CAPTURE_QUALITY
        self.resolution = CAM_RESOLUTION
        self.framerate = CAM_FRAMERATE
        self.snap_resolution_height = SNAP_RESOLUTION[1]
        self.snap_resolution_width = SNAP_RESOLUTION[0]
        self.camera = picamera.PiCamera(resolution=self.resolution, framerate=self.framerate)
        self.camera.rotation = CAM_ROTATION
        self.camera.annotate_text_size = ANNOTATE_TEXT_SIZE
        self.camera.annotate_foreground = picamera.Color.from_string(ANNOTATE_FOREGROUND_COLOR)
        self.camera.annotate_background = picamera.Color.from_string(ANNOTATE_BACKGROUND_COLOR)          
        
#This class will handle any incoming request from the browser 
class RoomberryHandler(BaseHTTPRequestHandler):
    
    def __init__(self, request, client_address, server):
        self.logger = logging.getLogger('Roomberry')
        super(RoomberryHandler, self).__init__(request, client_address, server)
        
    #Create an empty tree for cam values
    def create_cam_xml(self):
        
        root = ET.Element("cam")
        for tag in CAM_XML_TAGS:
            if type(tag) is tuple:
                ET.SubElement(root, '-'.join(tag) )
            else:
                ET.SubElement(root, tag)
        tree = ET.ElementTree(root)        
        return tree
    
    #Update the xml file with cam configuration
    def get_cam_xml(self):
        
        #Load the XML file. If it does not exists, create an empty tree
        xml_file = Path(PATH_TO_WWW + PATH_TO_CAM_XML)
        if xml_file.exists():
           tree = ET.parse(PATH_TO_WWW + PATH_TO_CAM_XML)
        else:
           tree = self.create_cam_xml()
        
        #Read the xml file structure
        root = tree.getroot()       
        
        #Check if the camera is closed due to inactivity
        if (self.server.camera_lock.acquire(timeout=LOCK_TIMEOUT)):
            if self.server.camera.closed:                            
                self.logger.info('Waking up camera.')
                self.server.start_camera()
            self.server.camera_lock.release() 
        
        #Update sensor information from the cam         
        for i in range(len(CAM_XML_TAGS)):
            if type(CAM_XML_TAGS[i]) is tuple:
                if CAM_XML_TAGS[i][0] == 'local':
                    root[i].text = str(getattr(self.server, CAM_XML_TAGS[i][1]))
                else:
                    root[i].text = str(getattr(getattr(self.server.camera, CAM_XML_TAGS[i][0]), CAM_XML_TAGS[i][1]))
            else:
                if (self.server.camera_lock.acquire(timeout=LOCK_TIMEOUT)): 
                    root[i].text = str(getattr(self.server.camera, CAM_XML_TAGS[i]))
                    self.server.camera_lock.release()

        tree.write(PATH_TO_WWW + PATH_TO_CAM_XML)  
        return
        
    #Create an empty tree for Roomba sensors
    def create_roomba_xml(self):
        
        root = ET.Element("roomba")
        for tag in ROOMBA_XML_TAGS:
            if type(tag) is tuple:
                ET.SubElement(root, '-'.join(tag) )
            else:
                ET.SubElement(root, tag)
        tree = ET.ElementTree(root)        
        return tree
    
    #Update the xml file with Roomba sensors
    def get_roomba_xml(self):
        
        #Load the XML file. If it does not exists, create an empty tree
        xml_file = Path(PATH_TO_WWW + PATH_TO_ROOMBA_XML)
        if xml_file.exists():
           tree = ET.parse(PATH_TO_WWW + PATH_TO_ROOMBA_XML)
        else:
           tree = self.create_roomba_xml()
        
        #Read the xml file structure
        root = tree.getroot()       
        
        #Update sensor information from the roomba
        if self.server.roomba_lock.acquire(timeout=LOCK_TIMEOUT):
            sensor_group100 = self.server.roomba.sensor_group100
            self.server.roomba_lock.release()
        
        bumps_and_wheel_drops = sensor_group100.bumps_and_wheel_drops
        light_bumper = sensor_group100.light_bumper      
        
        #Update the XML files with the sensor data obtained     
        for i in range(len(ROOMBA_XML_TAGS)):
            if ROOMBA_XML_TAGS[i] == "distance":
                self.server.distance += abs(getattr(sensor_group100, ROOMBA_XML_TAGS[i]))
                root[i].text = str(self.server.distance)
            elif ROOMBA_XML_TAGS[i] == "angle":
                self.server.angle += abs(getattr(sensor_group100, ROOMBA_XML_TAGS[i]))
                root[i].text = str(self.server.angle)            
            elif type(ROOMBA_XML_TAGS[i]) is tuple:
                root[i].text = str(getattr(getattr(sensor_group100, ROOMBA_XML_TAGS[i][0]), ROOMBA_XML_TAGS[i][1])) 
            else:
                root[i].text = str(getattr(sensor_group100, ROOMBA_XML_TAGS[i]))                               
        tree.write(PATH_TO_WWW + PATH_TO_ROOMBA_XML)        
        return

    #Update the xml file with multimedia files
    def get_media_xml(self):

        #Remove, if exists, previous media xml
        xml_file = Path(PATH_TO_WWW + PATH_TO_MEDIA_XML)   
        if xml_file.exists():
           remove(PATH_TO_WWW + PATH_TO_MEDIA_XML)
        
        media_dictionary = {}
        for dirpath, dirs, files in walk(PATH_TO_MEDIA + '/' + PATH_TO_CAM):            
            if files:
                media_dictionary[dirpath] = sorted(files, reverse=True) 
        
        root = ET.Element("files")

        for k, v in sorted(media_dictionary.items(), key=lambda item: (item[1], item[0]), reverse=True):
            aux = ET.SubElement(root, "folder", day = k.split('/')[-1])
            for file in v: 
                if file.endswith('.jpg'):
                    ET.SubElement(aux, "file", type = "capture", path = file)
                elif file.endswith('.h264'):
                    ET.SubElement(aux, "file", type = "record", path = file)

        tree = ET.ElementTree(root)      
        tree.write(PATH_TO_WWW + PATH_TO_MEDIA_XML)   
      
    def update_cam_snap(self):
    
        #Check if the camera is closed due to inactivity
        if (self.server.camera_lock.acquire(timeout=LOCK_TIMEOUT)):
            if self.server.camera.closed:                            
                self.logger.info('Waking up camera.')
                self.server.start_camera()
            
            #Get the snap
            self.server.camera.annotate_text = strftime(self.server.annotate_text, localtime(time()))
            self.server.camera.capture(PATH_TO_WWW + PATH_TO_SNAP, resize = tuple((self.server.snap_resolution_width, self.server.snap_resolution_height)), quality = self.server.capture_quality)
            self.server.camera_lock.release() 

    def cam_record(self, duration):
    
        #Check if the camera is closed due to inactivity
        if (self.server.camera_lock.acquire(timeout=LOCK_TIMEOUT)):
            if self.server.camera.closed:                            
                self.logger.info('Waking up camera.')
                self.server.start_camera()
            self.server.camera_lock.release() 
    
        # Do not use lock, allow capture and record concurrently
        year, month, day, hour, minute, second = strftime("%Y,%m,%d,%H,%M,%S", localtime(time())).split(',')
        self._create_day_folder(year, month, day)
        self.server.camera.start_recording(PATH_TO_MEDIA + '/' + PATH_TO_CAM + '/' + year + month + day + '/' + year + month + day + '-' + hour + minute + second + '.h264', format = 'h264', quality = round(40-self.server.capture_quality/100.0*30))
        self.server.camera.wait_recording(int(duration))
        self.server.camera.stop_recording()

    def cam_capture(self):
    
        #Check if the camera is closed due to inactivity
        if (self.server.camera_lock.acquire(timeout=LOCK_TIMEOUT)):
            if self.server.camera.closed:                            
                self.logger.info('Waking up camera.')
                self.server.start_camera() 
            
            # Get the capture
            year, month, day, hour, minute, second = strftime("%Y,%m,%d,%H,%M,%S", localtime(time())).split(',')
            self._create_day_folder(year, month, day)
            self.server.camera.annotate_text = strftime(self.server.annotate_text, localtime(time()))
            self.server.camera.capture(PATH_TO_MEDIA + '/' + PATH_TO_CAM + '/' + year + month + day  + '/' + year + month + day + '-' + hour + minute + second + '.jpg', quality = self.server.snap_quality)
            self.server.camera_lock.release()    

    def send_reply(self, basePath=PATH_TO_WWW, mimetype=None):          
        self.send_response(200)
        self.send_header('Content-type', mimetype)
        if mimetype != None:
            f = open(basePath + self.path, 'rb')
            statinfo = stat(basePath + self.path)
            self.send_header("Content-length", statinfo.st_size)
            self.end_headers()
            self.wfile.write(f.read())
            f.close()
        else:
            self.end_headers()
            
    def send_error_reply(self, error_message):
        self.send_error(400, error_message)

    def reset_roomba_distance_angle(self):
        self.server.distance = self.server.angle = 0
            
    #Handler for the GET requests 
    def do_GET(self):      
        
        try:
            #Camera operations
            if self.path.startswith(PATH_TO_CAM):
         
                if self.path == PATH_TO_CAM_XML:
                    self.get_cam_xml()             
                    self.send_reply(mimetype='text/xml')
                elif self.path == PATH_TO_MEDIA_XML:
                    self.get_media_xml()             
                    self.send_reply(mimetype='text/xml')                    
                elif self.path == PATH_TO_SNAP:
                    self.update_cam_snap()
                    self.send_reply(mimetype='image/jpg')
                elif self.path.endswith('.jpg'):
                    self.send_reply(PATH_TO_MEDIA,'image/jpg')
                elif self.path.endswith('.h264'):
                    self.send_reply(PATH_TO_MEDIA,'video/H264')
                else:
                    dict_qs = parse_qs(urlparse(self.path).query)
                    
                    #Get the operation to be executed 
                    operation = dict_qs['op'][0]

                    #Convert the values of the query string, removing key 'op'
                    dict_qs = dict([key, value[0]] for key, value in dict_qs.items() if key!='op')

                    #Set operation in the camera
                    if operation == 'cam':                   
                        for k, v in dict_qs.items():             
                            if 'local' not in k:
                                if k.endswith('ground'):
                                    v = picamera.Color.from_string("#" + v)
                                elif k == 'framerate-numerator':
                                    v = Fraction(int(v),1)
                                    k = 'framerate'
                                elif k == 'resolution-height':
                                    v = (self.server.camera.resolution.width,int(v))
                                    k = 'resolution'
                                elif k == 'resolution-width':
                                    v = (int(v), self.server.camera.resolution.height)
                                    k = 'resolution'
                                elif v in ('True', 'False'):
                                    v = self._bool_convert(v)
                                elif self._is_int(v):
                                    v = int(v)                                                           
                                if self.server.camera_lock.acquire(timeout=LOCK_TIMEOUT):
                                    setattr(self.server.camera, k, v)
                                    self.server.camera_lock.release()                                
                            else:
                                if k != 'local-annotate_text':
                                    v = int(v)
                                if self.server.camera_lock.acquire(timeout=LOCK_TIMEOUT):
                                    setattr(self.server, k.split('-')[1], v)
                                    self.server.camera_lock.release() 
                                    
                    #Exec operation in the camera (lock in the function)                       
                    else:
                        getattr(self, operation)(**dict_qs)
                            
                    self.send_reply()                   
                self.server.last_camera_operation = time()
                    
            #Roomba operations
            elif self.path.startswith(PATH_TO_ROOMBA):
                if self.path == PATH_TO_ROOMBA_XML:
                    self.get_roomba_xml()                
                    self.send_reply(mimetype='text/xml')
                else:               
                    dict_qs = parse_qs(urlparse(self.path).query)
                    
                    #Get the operation to be executed and convert the values of the query string, removing key 'op'
                    operation = dict_qs['op'][0]
                    dict_qs = dict([key, self._dictionary_Parser(key,value[0])] for key, value in dict_qs.items() if key!='op')
                    
                    if operation == 'reset_roomba_distance_angle':
                        self.reset_roomba_distance_angle()
                    else:
                        #Lock roomba access during operation
                        if self.server.roomba_lock.acquire(timeout=LOCK_TIMEOUT):
                            getattr(self.server.roomba, operation)(**dict_qs)
                            self.server.roomba_lock.release()
                    
                    self.send_reply()                    
            else: 
                self.server.logger.error('error: bad parsed request.')
                self.send_error_reply('Bad parsed request')
        
        except Exception as e:
            if self.server.roomba_lock.locked():
                self.server.roomba_lock.release()                    
            if self.server.camera_lock.locked():
                self.server.camera_lock.release()
            if path.isfile(PATH_TO_WWW + PATH_TO_CAM_XML):
                remove(PATH_TO_WWW + PATH_TO_CAM_XML)
            if path.isfile(PATH_TO_WWW + PATH_TO_ROOMBA_XML):
                remove(PATH_TO_WWW + PATH_TO_ROOMBA_XML)
            self.server.logger.error('error: bad parsed request: ' + str(e) + '\n' +traceback.format_exc())
            self.send_error_reply(str(e))
            return

    def log_message(self, format, *args):
        self.logger.debug("%s - - %s" % (self.address_string(), format % args))

    @staticmethod     
    def _is_int(v):
        try:     i = int(v)
        except:  return False
        return True
    
    @staticmethod
    def _bool_convert(s):
        return s == "True"
   
    @staticmethod        
    def _dictionary_Parser(key, value):
        #Convert the string captured in a list
        if key == 'notes':
            return literal_eval('['+(value)+']')
        else:
            return int(value)

    @staticmethod 
    def _create_day_folder(year, month, day):        
        if not path.isdir(PATH_TO_MEDIA + '/' + PATH_TO_CAM + '/' + year + month + day):
            makedirs(PATH_TO_MEDIA + '/' + PATH_TO_CAM + '/' + year + month + day)
          
def run(http_port=PORT_NUMBER, serial_port=PORT_SERIAL, brc_pin=BRC_GPIO):
     
    #Logging configuration
    logger = logging.getLogger('Roomberry')
    hdlr = logging.FileHandler(PATH_TO_LOG)
    formatter = logging.Formatter(LOG_FORMAT)
    hdlr.setFormatter(formatter)
    logger.addHandler(hdlr) 
    logger.setLevel(logging.DEBUG)    
    
    #Check that required paths exist
    if not path.exists(PATH_TO_WWW + PATH_TO_CAM):
        makedirs(PATH_TO_WWW + PATH_TO_CAM)
    if path.isfile(PATH_TO_WWW + PATH_TO_CAM_XML):
        remove(PATH_TO_WWW + PATH_TO_CAM_XML)
    if not path.exists(PATH_TO_WWW + PATH_TO_ROOMBA):
        makedirs(PATH_TO_WWW + PATH_TO_ROOMBA)
    if path.isfile(PATH_TO_WWW + PATH_TO_ROOMBA_XML):
        remove(PATH_TO_WWW + PATH_TO_ROOMBA_XML)
            
    #Initialize web server
    httpd = RoomberryServer(('', http_port), RoomberryHandler, serial_port, brc_pin)
    
    try:
        httpd.start()
       
    #Turn off in controlled way
    #ToDo bind with service stop
    except (KeyboardInterrupt):
        httpd.stop()

if __name__ == "__main__":
    from sys import argv

    if len(argv) == 4:
        run(port=int(argv[1]), serial_port=int(argv[2]), keep_alive_pin=int(argv[3]))
    else:
        run()
        
