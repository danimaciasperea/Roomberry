	const STRAIGHT = 0x8000;
	const TURN_IN_PLACE_CW=0xFFFF;
	const TURN_IN_PLACE_CCW=0x0001;
	const FORWARD = 1;
	const BACKWARD = -1;
	const STOP = 0;
	const MMS = " mm/s";
	const MM = " mm";
	const PERCENT = " %";
	const MA = " mA";
	const MV = " mV";
	const CELSIUS = " °C";		
	const RATELIMIT = 300;	
	const N_HEIGHT = N_WIDTH = 160;
	const TRANSMAX = 300;
	const ROTMAX = 200;
	const OI_PASSIVE = 1;
	const OI_SAFE = 2;
	const OI_FULL = 3;
	const C_HEIGHT = C_WIDTH = 328;
	const MAX_SIGNAL = 1000;
	const NOTES = 16;
	const DAYS = 7;
	const DAYS_OF_WEEK = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
	const DAYS_OF_WEEK_SHORT = ["mon", "tues", "wed", "thurs", "fri", "sat", "sun"];
	const ERROR_LIMIT = 5;

	var titleString = "<span class=\"glyphicon glyphicon-time\"></span> ";	
	var openedClass = "glyphicon-folder-open";
	var closedClass = "glyphicon-folder-close";
	var refreshClass = "glyphicon-refresh";
	var refreshAnimatedClass = "glyphicon-refresh-animate";
	var imageClass = "glyphicon-camera";
	var videoClass = "glyphicon-facetime-video";
	var updatedClass = "updated";
	var nippleManager;
	var lastMoveCall = Date.now();
	var statusSnapshot = 'pause';
	var statusXMLRoomba = 'pause';
	var timerSnapshot;
	var timerXMLRoomba;
	var radius = STRAIGHT;
	var direction = FORWARD;
	var maxPWM = 255/100;
	var maxMotorPWM = 127/100;
	var stepIncrease = 5;
	var batteryGauge;
	var errorState = false; 
	var errorCounter = 0;
	var synth = new Tone.Synth().toMaster(); 
	var noteTemplate = "<div class=\"row\" id=\"rowX\"><div class=\"col-md-12\"><div class=\"col-md-1 col-xs-2\" style=\"height: 30px;padding-bottom: 0px;padding-top: 6px\"><p>X</p></div><div class=\"col-md-4 col-xs-10\"><div class=\"col-xs-4\" style=\"height: 30px;padding-bottom: 0px;padding-top: 6px;padding-left:0px;padding-right:0px\"><p>Nota:</p></div><div class=\"col-xs-8 no-padding\"><select id=\"noteLetterX\" onchange=\"playNote(X)\" style=\"height: 26px;width: 85px;\"><option value=\"12\">Silence</option><option value=\"0\">Do - C</option><option value=\"1\">Do# - C#</option><option value=\"2\">Re - D</option><option value=\"3\">Re# - D#</option><option value=\"4\">Mi - E</option><option value=\"5\">Fa - F</option><option value=\"6\">Fa# - F#</option><option value=\"7\">Sol - G</option><option value=\"8\">Sol# - G#</option><option value=\"9\">La - A</option><option value=\"10\">La - A#</option><option value=\"11\">Si - B</option></select></div></div><div class=\"col-md-3 col-xs-12\"><div class=\"col-xs-6\" style=\"height: 30px;padding-bottom: 0px;padding-top: 6px;padding-left:0px;padding-right:0px\">Escala: </div><div class=\"col-xs-6\"><input id=\"noteScaleX\" type=\"number\" name=\"quantity\" min=\"1\" max=\"9\" step=\"1\" value=\"4\" style=\"Width: 35Px; margin-top: 5px; text-align: center;height: 26px;\" onchange=\"validateLimits(this);playNote(X);\"></div></div><div class=\"col-md-4 col-xs-12\"><div class=\"col-xs-4\" style=\"height: 30px;padding-bottom: 0px;padding-top: 6px;padding-left:0px;padding-right:0px\">Duración: </div><div class=\"col-xs-8\" style=\"padding-right: 0px;\"> <input id=\"noteDurationX\" type=\"number\" name=\"quantity\" min=\"0\" max=\"30\" step=\"0.015625\" value=\"0.500000\" style=\" Width: 95px; margin-top: 5px; text-align: center;height: 26px;\" onchange=\"validateDuration(this);playNote(X);\"></div></div></div></div>";
	
	var assignmentTemplate = "<div class=\"row center-block\" id=\"rowX\" style=\"width: 250px;\"><div class=\"col-md-1 col-xs-1\" style=\"padding-top: 5px;\"><input id=\"SendX\" type=\"checkbox\" class=\"form-check-input\" onchange=\"dayScheduleToggled(X)\" value=\"0\" style=\"width: 15px;height: 15px;\"></div><div class=\"col-md-3 col-xs-3\" style=\"height: 30px;padding-bottom: 0px;padding-top: 6px\"><p>Y</p></div><div class=\"col-md-7 col-xs-7\" style=\"padding-top: 4px;\"><div class=\"col-xs-5 col-md-5 text-right no-padding\"><input id=\"hourX\" type=\"number\" min=\"0\" max=\"23\" step=\"1\" pattern=\"[0-9]{2}$\" value=\"12\" onchange=\"validateSchedule(this)\" style=\"text-align: center;width: 40px;\"></div><div class=\"col-xs-2 col-md-2\" style=\"padding-left: 5px;padding-right: 5px;padding-bottom: 0px;height: 26px;padding-top: 5px;\"><p style=\"text-align: center;\">:</p></div><div class=\"col-xs-5 col-md-5 text-left no-padding\"><input id=\"minuteX\" type=\"number\" min=\"0\" max=\"59\" step=\"1\" pattern=\"[0-9]{2}$\" value=\"00\" onchange=\"validateSchedule(this)\" style=\"text-align: center;width: 40px;\"></div></div></div>";
	
	var camParameters = 
	[	{name:"annotate_background",					type:"color",			value:"#808080"},	//0
		{name:"annotate_foreground",					type:"color",			value:"#ffffff"},	
		{name:"annotate_text_size",						type:"number", 			value:"30"},
		{name:"awb_mode", 								type:"select-one", 		value:"auto"},
		{name:"brightness", 							type:"number-input", 	value:"50"},
		{name:"contrast", 								type:"number-input", 	value:"0"},			//5
		{name:"drc_strength", 							type:"select-one", 		value:"off"},
		{name:"exposure_compensation", 					type:"number-input", 	value:"0"},
		{name:"exposure_mode", 							type:"select-one",		value:"off"},
		{name:"framerate-numerator", 					type:"number", 			value:"30"},
		{name:"hflip", 									type:"select-one", 		value:"False"},		//10
		{name:"image_denoise", 							type:"select-one", 		value:"True"},
		{name:"image_effect", 							type:"select-one",		value:"none"},
		{name:"iso", 									type:"number-input", 	value:"0"},
		{name:"local-annotate_text", 					type:"text", 			value:"Roomberry %d-%m-%Y %H:%M:%S"},
		{name:"local-snap_resolution_height", 			type:"number", 			value:"480"},		//15	
		{name:"local-snap_resolution_width", 			type:"number", 			value:"640"},
		{name:"local-snap_quality", 					type:"number", 			value:"10"},
		{name:"local-capture_quality", 					type:"number", 			value:"85"},
		{name:"resolution-height", 						type:"number", 			value:"972"},
		{name:"resolution-width", 						type:"number", 			value:"1296"},		//20
		{name:"rotation", 								type:"number", 			value:"0"},
		{name:"saturation", 							type:"number-input", 	value:"0"},
		{name:"sharpness", 								type:"number-input", 	value:"0"},
		{name:"vflip", 									type:"select-one", 		value:"False"},	
		{name:"video_denoise", 							type:"select-one", 		value:"True"},		//25
		{name:"video_stabilization", 					type:"select-one", 		value:"True"}
	];

	var roombaParameters = 
	[	{name:"oi_mode", 								type:"select-one",	value:"0",		unit:""},	//0
		{name:"voltage",								type:"number", 		value:"0",		unit:MV},
		{name:"current", 								type:"number", 		value:"0",		unit:MA},
		{name:"temperature",							type:"number", 		value:"0",		unit:CELSIUS},
		{name:"battery_charge",							type:"battery", 	value:"0",		unit:""},
		{name:"battery_capacity",						type:"", 			value:"2696",	unit:""},	//5
		{name:"charging_state",							type:"text", 		value:"",		unit:""},
		{name:"bumps_and_wheel_drops-bump_left",		type:"image",		value:"",		unit:""},
		{name:"bumps_and_wheel_drops-bump_right",		type:"image",		value:"",		unit:""},
		{name:"bumps_and_wheel_drops-wheel_drop_left",	type:"image",		value:"",		unit:""},			
		{name:"bumps_and_wheel_drops-wheel_drop_right",	type:"image",		value:"",		unit:""},	//10
		{name:"cliff_left_sensor",						type:"image",		value:"",		unit:""},
		{name:"cliff_front_left_sensor",				type:"image",		value:"",		unit:""},
		{name:"cliff_front_right_sensor",				type:"image",		value:"",		unit:""},
		{name:"cliff_right_sensor",						type:"image",		value:"",		unit:""},
		{name:"cliff_left_signal",						type:"image",		value:"",		unit:""},	//15
		{name:"cliff_front_left_signal",				type:"image",		value:"",		unit:""},
		{name:"cliff_front_right_signal",				type:"image",		value:"",		unit:""},
		{name:"cliff_right_signal",						type:"image",		value:"",		unit:""},
		{name:"light_bumper-left",						type:"image",		value:"",		unit:""},
		{name:"light_bumper-front_left",				type:"image",		value:"",		unit:""},	//20
		{name:"light_bumper-center_left",				type:"image",		value:"",		unit:""},
		{name:"light_bumper-center_right",				type:"image",		value:"",		unit:""},
		{name:"light_bumper-front_right",				type:"image",		value:"",		unit:""},
		{name:"light_bumper-right",						type:"image",		value:"",		unit:""},
		{name:"light_bump_left_signal",					type:"image",		value:"",		unit:""},	//25	
		{name:"light_bump_front_left_signal",			type:"image",		value:"",		unit:""},
		{name:"light_bump_center_left_signal",			type:"image",		value:"",		unit:""},
		{name:"light_bump_center_right_signal",			type:"image",		value:"",		unit:""},
		{name:"light_bump_front_right_signal",			type:"image",		value:"",		unit:""},
		{name:"light_bump_right_signal",				type:"image",		value:"",		unit:""},	//30	
		{name:"virtual_wall_sensor",					type:"image",		value:"",		unit:""},
		{name:"ir_character_left",						type:"image",		value:"",		unit:""},
		{name:"ir_character_right",						type:"image",		value:"",		unit:""},
		{name:"charging_sources-home_base",				type:"image",		value:"",		unit:""},	
		{name:"charging_sources-internal_charger",		type:"image",		value:"",		unit:""},   //35
		{name:"requested_velocity", 					type:"image",		value:"",		units:MMS},
		{name:"requested_radius", 						type:"image",		value:"",		units:MM},
		{name:"requested_left_velocity",				type:"image",		value:"",		units:MMS},
		{name:"requested_right_velocity",				type:"image",		value:"",		units:MMS},
		{name:"left_motor_current",						type:"image",		value:"",		units:MA},	//40
		{name:"right_motor_current",					type:"image",		value:"",		units:MA},
		{name:"main_brush_motor_current",				type:"image",		value:"",		units:MA},
		{name:"side_brush_motor_current",				type:"image",		value:"",		units:MA},
		{name:"distance",								type:"image",		value:"",		units:MM},
		{name:"angle",									type:"image",		value:"",		units:MM},	//45
		{name:"stasis-toggling",						type:"image",		value:"",		units:""},
		{name:"stasis-disabled",						type:"image",		value:"",		units:""}
	];		
	
	function programKeyboard()
	{
		$(document).keydown(function(e)
		{
			switch(e.which)
			{  
				case 37: // left
				leftRoomba();
				break;

				case 38: // up
				upRoomba();
				break;

				case 39: // right
				rightRoomba();
				break;

				case 40: // down
				downRoomba();
				break;
				
				case 13: // enter
				stopRoomba();
				break;
				
				case 107: // add
				updateInputOutput("requested_velocity", parseInt(requested_velocity_input.value) + stepIncrease, MMS);
				document.getElementById("speedSpin").value = requested_velocity_input.value;
				sendDrive();
				break;
				
				case 109: // substract
				updateInputOutput("requested_velocity", parseInt(requested_velocity_input.value) - stepIncrease, MMS);					
				document.getElementById("speedSpin").value = requested_velocity_input.value;
				sendDrive();
				break;
				
				default: return; // exit this handler for other keys
			}
			
			e.preventDefault();
		});
	}
	
	function downRoomba()
	{
		radius=STRAIGHT;
		direction=BACKWARD;
		sendDrive();
	}
	
	function upRoomba()
	{			
		radius=STRAIGHT;
		direction=FORWARD;
		sendDrive();
	}
	
	
	function rightRoomba()
	{
		direction=FORWARD;
		radius = TURN_IN_PLACE_CW;
		updateInputOutput("requested_radius", 0, MM);
		sendDrive();
	}	
	
	function leftRoomba()
	{
		direction=FORWARD;
		radius = TURN_IN_PLACE_CCW;
		updateInputOutput("requested_radius", 0, MM);
		sendDrive();
	}
	
	function stopDrivingRoomba()
	{
		updateInputOutput("requested_radius", 0, MM);
		updateInputOutput("requested_velocity", 0, MMS);
		updateInputOutput("requested_right_velocity", 0, MMS);
		updateInputOutput("requested_left_velocity", 0, MMS);
		document.getElementById("speedSpin").value = 0;
		sendDrive();
	}
	
	
	function stopRoomba()
	{			
		
		stopDrivingRoomba();			
		updateInputOutput("right_PWM", 0, MMS);
		updateInputOutput("left_PWM", 0, MMS);
		updateInputOutput("main_brush", 0, PERCENT);
		updateInputOutput("side_brush", 0, PERCENT);
		updateInputOutput("vacuum", 0, PERCENT);	
		
		sendMotorsPWM();
		
	}
	
	function updateInputOutput(id, value, unit)
	{
		document.getElementById(id + "_input").value = value;
		document.getElementById(id + "_output").value = value + unit;
	}
	
	function checkAvailableOps(oi_mode)
	{
		var disableAction = true;
		switch (parseInt(oi_mode))
		{
			case OI_PASSIVE:
			{
				 disableAction = true;
				 break;
			}
			case OI_SAFE:
			case OI_FULL:
			{
				disableAction = false;
			}
		}
		
		document.getElementById("roombaUpButton").disabled  = disableAction;
		document.getElementById("roombaLeftButton").disabled  = disableAction;
		document.getElementById("roombaStopButton").disabled  = disableAction;
		document.getElementById("roombaRightButton").disabled  = disableAction;
		document.getElementById("roombaDownButton").disabled  = disableAction;				
		document.getElementById("speedSpin").disabled  = disableAction;
		$("#speedSpin").parent().children("span").children().prop("disabled",disableAction);
		document.getElementById("advancedModeButton").disabled  = disableAction;
		document.getElementById("requested_velocity_input").disabled  = disableAction;
		document.getElementById("requested_radius_input").disabled  = disableAction;
		document.getElementById("requested_right_velocity_input").disabled  = disableAction;
		document.getElementById("requested_left_velocity_input").disabled  = disableAction;
		document.getElementById("right_PWM_input").disabled  = disableAction;
		document.getElementById("left_PWM_input").disabled  = disableAction; 
		document.getElementById("main_brush_input").disabled  = disableAction;
		document.getElementById("side_brush_input").disabled  = disableAction;
		document.getElementById("vacuum_input").disabled  = disableAction;
		document.getElementById("playLCDButton").disabled  = disableAction;
		document.getElementById("playSongButton").disabled  = disableAction;
		document.getElementById("loadSongButton").disabled  = disableAction;
		
		document.getElementById("clean").disabled  = errorState;
		document.getElementById("clean_spot").disabled  = errorState;
		document.getElementById("seek_dock").disabled  = errorState;
		document.getElementById("clean_max").disabled  = errorState;
		document.getElementById("power_down").disabled  = errorState;
		document.getElementById("setTimeButton").disabled  = errorState;
		document.getElementById("setScheduleButton").disabled  = errorState;			
		
		if (disableAction)
		{
			$("#advancedDrivingMode").collapse('hide');
			if (nippleManager && nippleManager[0]) nippleManager.destroy();
		}
		else
		{
			init_nipple();
		}			
	}
	
	function sendOIMode(oi_mode)
	{
		if (oi_mode == "") return;
		var op = "_change_mode";
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("POST", "roomberryWrapper.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send("op="+op+"&mode="+oi_mode);
		checkAvailableOps(oi_mode);
	}
	
	function sendDrive()
	{
		var op = "drive";
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("POST", "roomberryWrapper.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");			
		xmlhttp.send("op="+op+"&velocity="+document.getElementById("requested_velocity_input").value*direction+"&radius="+radius);			
	}

	function sendDriveDirect()
	{
		var op = "drive_direct";
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("POST", "roomberryWrapper.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");			
		xmlhttp.send("op="+op+"&right_velocity="+document.getElementById("requested_right_velocity_input").value+"&left_velocity="+document.getElementById("requested_left_velocity_input").value);			
	}

	function sendDrivePWM()
	{
		var op = "drive_pwm";
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("POST", "roomberryWrapper.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");			
		xmlhttp.send("op="+op+"&right_pwm="+ Math.round(document.getElementById("right_PWM_input").value*maxPWM)+"&left_pwm="+ Math.round(document.getElementById("left_PWM_input").value*maxPWM));			
	}

	function sendMotorsPWM()
	{
		var op = "set_motors_pwm";
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("POST", "roomberryWrapper.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");			
		xmlhttp.send("op="+op+"&main_brush_pwm="+ Math.round(document.getElementById("main_brush_input").value*maxMotorPWM)+"&side_brush_pwm="+ Math.round(document.getElementById("side_brush_input").value*maxMotorPWM)+"&vacuum_pwm="+ Math.round(document.getElementById("vacuum_input").value*maxMotorPWM));			
	}
	
	async function sendLCDMessage()
	{
		var op = "set_ascii_leds";
		var message = "    " + document.getElementById("messageLCD").value + "    ";
		for (var i=3; i<message.length; i++)
		{
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.open("POST", "roomberryWrapper.php", true);
			xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");			
			xmlhttp.send("op="+op+"&char1="+message.charCodeAt(i-3)+"&char2="+message.charCodeAt(i-2)+"&char3="+message.charCodeAt(i-1)+"&char4="+message.charCodeAt(i));				
			await sleep(500);
		}			
	}
	
	function playSong()
	{
		var op = "play_song";
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("POST", "roomberryWrapper.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send("op="+op+"&song_number="+songSelector.value);
	}
	
	function basicFunction(button)
	{
		var op = button.id;
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("POST", "roomberryWrapper.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send("op="+op);
	}
	
	function setCurrentTime()
	{
		var d = new Date();
		var op = "set_day_time";
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("POST", "roomberryWrapper.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send("op="+op+"&day="+d.getDay()+"&hour="+d.getHours()+"&minute="+d.getMinutes());
	}
	
	function getLastSnapshot() 
	{			
		var op = "lastSnapshot";
		var currentDate = (new Date()).getTime();
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (this.readyState == 4)
			{
				if (this.status == 200)
				{
					if (errorState)
					{
						// Update button icon + message
						errorState = false;
						errorCounter = 0;
						document.getElementById("roomberryStatusButton").className  = "btn-success btn-sm btn-round glyphicon glyphicon-signal";
						$(document.getElementById("roomberryStatusButton")).attr('data-original-title', "Conectado");
					}
					
					document.getElementById("snapshot").src = "multimedia/"+"snapR.jpg?"+currentDate;
					document.getElementById("snapshotA").setAttribute("href", "multimedia/"+"snapR.jpg?"+currentDate);
					document.getElementById("snapshotA").setAttribute("data-toggle","lightbox");
					document.getElementById("snapshotA").setAttribute("data-type","image");	
					document.getElementById("snapshot").style.maxWidth = "100%";
				}
				else
				{
					errorReceived();
				}
			}				
				
		};
		xmlhttp.open("POST", "roomberryWrapper.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send("op="+op);			
	}

	function getLastXMLCam()
	{			
		var op = "lastCamXML";
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (this.readyState == 4)
			{
				if (this.status == 200)
				{
					if (errorState)
					{
						// Update button icon + message
						errorState = false;
						errorCounter = 0;
						document.getElementById("roomberryStatusButton").className  = "btn-success btn-sm btn-round glyphicon glyphicon-signal";
						$(document.getElementById("roomberryStatusButton")).attr('data-original-title', "Conectado");
					}
					
					getXMLCam();
				}
				else
				{
					errorReceived();
				}
			}				
		};
		xmlhttp.open("POST", "roomberryWrapper.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send("op="+op);			
	}

	function getLastXMLRoomba()
	{			
		var op = "lastRoombaXML";
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (this.readyState == 4)
			{
				if (this.status == 200)
				{
					if (errorState)
					{
						// Update button icon + message
						errorState = false;
						errorCounter = 0;
						document.getElementById("roomberryStatusButton").className  = "btn-success btn-sm btn-round glyphicon glyphicon-signal";
						$(document.getElementById("roomberryStatusButton")).attr('data-original-title', "Conectado");
					}
					
					getXMLRoomba();
				}
				else
				{
					errorReceived();
				}
			}				
		};
		xmlhttp.open("POST", "roomberryWrapper.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send("op="+op);			
	}

	function getLastXMLMedia()
	{			 
		var op = "lastMediaXML";
		$("#mediaTree").children().children().className = "glyphicon glyphicon-refresh glyphicon-refresh-animate";
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (this.readyState == 4)
			{
				if (this.status == 200)
				{				
					document.getElementById("mediaTree").innerHTML = xmlhttp.responseText;
				}
				else
				{
					errorReceived();
				}
			}				
		};
		xmlhttp.open("POST", "roomberryWrapper.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send("op="+op);
	}

	function openMediaYear(yearSelected)
	{
		 $(yearSelected).children(".year").toggleClass(closedClass + " " + openedClass);
		 $(yearSelected).children().children().toggle();
		 event.stopPropagation();
	}

	function openMediaMonth(monthSelected)
	{
		 $(monthSelected).children(".month").toggleClass(openedClass + " " + closedClass);
		 $(monthSelected).children().children().toggle();
		 event.stopPropagation();
	}
		
	function openDay(daySelected)
	{
		$(daySelected).children(".day").toggleClass(openedClass + " " + closedClass);
		$(daySelected).children().children().toggle();
		event.stopPropagation();
	}					
		
	function openMediaFile(fileSelected)
	{
		op="getMedia";
		$(fileSelected).children(".video").toggleClass(videoClass + " " + refreshClass  + " " +  refreshAnimatedClass);
		$(fileSelected).children(".image").toggleClass(imageClass + " " + refreshClass  + " " +  refreshAnimatedClass);
		createMediaModal(fileSelected);
		
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function()
		{
			if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
			{		
				updateMultimediaModal(fileSelected,xmlhttp.responseText);
			}
		};
		xmlhttp.open("POST", "roomberryWrapper.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send("op="+op+"&file="+fileSelected.id);
		prepareSiblings(fileSelected);
		event.stopPropagation();
	}
 
	function createMediaModal(fileSelected)
	{
		$("#mediaModal").modal();
		$("#mediaModalContent").children().remove();			
		$("#mediaModalLoader").show();
		$("#mediaModal").bind("keyup", function(event) {
			if (event.keyCode == 27) { 
			   $("#mediaModal").unbind("keyup");
			   $("#mediaModal").modal('hide');
			   $("#mediaModal").children().remove();
			}
			if (event.keyCode == 39) {
				$("#mediaModal").unbind("keyup");
				nextImage();
			}
			if (event.keyCode == 37) {
				$("#mediaModal").unbind("keyup");
				prevImage();
			}
			if (event.keyCode == 32 && ($(fileSelected).children().hasClass("video"))) {
				$('#videoModal').get(0).paused ? $('#videoModal').get(0).play() : $('#videoModal').get(0).pause();
			}
			event.stopPropagation();
		});
	}
	
	function prepareSiblings(fileSelected){
	
		nextFile = $(fileSelected).next();
		prevFile = $(fileSelected).prev();
		if (prevFile.length == 0){
			$("#prevButton").css('display','none');
		} else {
			$("#prevButton").css('display','block');
		}
		if (nextFile.length == 0){
			$("#nextButton").css('display','none');
		} else {
			$("#nextButton").css('display','block');
		}
		
	}
	
	function prevImage()
	{
		if (prevFile.length > 0)
	{
			openMediaFile(document.getElementById(prevFile.attr('id')));
		}
	}

	function nextImage()
	{
		if (nextFile.length > 0)
		{
			openMediaFile(document.getElementById(nextFile.attr('id')));
		}
	}

	function updateMultimediaModal(fileSelected,fileName){											
			
		if ($(fileSelected).children().hasClass("image")){
			var img = $("<img />", { 
			  src: "multimedia/" + fileName,
			  class: "img-responsive",
			});
			$("#mediaModalContent").children().remove();
			img.appendTo($("#mediaModalContent"));
		} else {
			var video = $("<video/>", { 
			  src: "multimedia/" + fileName,
			  id: "videoModal",
			  class: "video img-responsive",
			  type: 'video/mp4',
			  controls: true,
			  autoplay: true
			});
			video.appendTo($("#mediaModalContent"));					
		}
		$("#mediaModalLoader").hide();	
		$(".video.img-responsive").click(function(){this.paused?this.play():this.pause();});					
		$(fileSelected).children(".video").toggleClass(videoClass + " " + refreshClass  + " " +  refreshAnimatedClass);
		$(fileSelected).children(".image").toggleClass(imageClass + " " + refreshClass  + " " +  refreshAnimatedClass);					
			
	}


	function getXMLCam()
	{			
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				var xmlDoc = this.responseXML;
				for (var i in camParameters)
				{	
					camParameters[i].value = xmlDoc.getElementsByTagName(camParameters[i].name)[0].textContent;
				}		
				refreshHTMLCam();
			}
		};
		xmlhttp.open("GET", "cam.xml", true);
		xmlhttp.send();			
	}	

	function getXMLRoomba()
	{			
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				var xmlDoc = this.responseXML;
				for (var i in roombaParameters)
				{	
					roombaParameters[i].value = xmlDoc.getElementsByTagName(roombaParameters[i].name)[0].textContent;
				}		
				refreshHTMLRoomba();
				paintRoombaCanva();
			}
		};
		xmlhttp.open("GET", "roomba.xml", true);
		xmlhttp.send();			
	}

	function refreshHTMLCam()
	{
		for (i in camParameters) 
		{		
			switch(camParameters[i].type)
			{
				case "color":
					$(document.getElementById(camParameters[i].name)).colorpicker('setValue', camParameters[i].value);
					break;
				case "number":
				case "select-one":
				case "text":			
					document.getElementById(camParameters[i].name).value = camParameters[i].value;
					break;
				case "number-input":
					updateInputOutput(camParameters[i].name, camParameters[i].value, "");
					break;
				default:
					break;
			}
		}
	}
		
	function refreshHTMLRoomba()
	{
		for (i in roombaParameters) {
			
			switch(roombaParameters[i].type)
			{
				case "number":					
					document.getElementById(roombaParameters[i].name).value = roombaParameters[i].value + " " + roombaParameters[i].unit;
					break;
				case "select-one":
					if (document.getElementById(roombaParameters[i].name).value != roombaParameters[i].value)
					{
						document.getElementById(roombaParameters[i].name).value = roombaParameters[i].value;
						document.getElementById(roombaParameters[i].name).onchange();
					}
					
					break;
				case "battery":
					batteryGauge.refresh(roombaParameters[i].value/roombaParameters[parseInt(i)+1].value*100);
					break;
				case "text":
					switch(roombaParameters[i].name + "-" + roombaParameters[i].value)
					{
						case "charging_state-0":
							document.getElementById(roombaParameters[i].name).value = "Sin cargar";
						break;
						case "charging_state-1":
							document.getElementById(roombaParameters[i].name).value = "Carga completa";
						break;
						case "charging_state-2":
							document.getElementById(roombaParameters[i].name).value = "Cargando";
						break;
						case "charging_state-3":
							document.getElementById(roombaParameters[i].name).value = "Carga mantenimiento";
						break;
						case "charging_state-4":
							document.getElementById(roombaParameters[i].name).value = "-";
						break;
						case "charging_state-5":
							document.getElementById(roombaParameters[i].name).value = "Error de carga";
						break;
						default:
							document.getElementById(roombaParameters[i].name).value = "-";
						break;
							
					}
					break;
				default:
					break;
			}				
		}
	}
	
	function updateRefreshRateSnapshot(interval)
	{		
		interval.value = parseFloat(interval.value).toFixed(1);
		
		if (statusSnapshot=='play')
		{
			clearInterval(timerSnapshot);
			timerSnapshot = setInterval(function(){ getLastSnapshot() }, interval.value * 1000);
		}
	}
	
	function updateRefreshRateXMLRoomba(interval)
	{		
		interval.value = parseFloat(interval.value).toFixed(1);
		if (statusXMLRoomba=='play')
		{
			clearInterval(timerXMLRoomba);
			timerXMLRoomba = setInterval(function(){ getLastXMLRoomba() }, interval.value * 1000);
		}
	}
	
	function toogleRefreshSnapshotButton()
	{		
		if(statusSnapshot=='play')
		{
		  statusSnapshot = 'pause';
		  document.getElementById("refreshSnapshotButton").className  = "btn btn-success glyphicon glyphicon-play";
		  clearInterval(timerSnapshot);
		}
		else if(statusSnapshot=='pause')
		{
		  statusSnapshot = 'play';  
		  document.getElementById("refreshSnapshotButton").className  = "btn btn-warning glyphicon glyphicon-pause";  
		  updateRefreshRateSnapshot(document.getElementById("refreshSnapshotRateInput"));
		}
	}
	
	function toogleRefreshRoombaXMLButton()
	{		
		if(statusXMLRoomba=='play')
		{
		  statusXMLRoomba = 'pause';
		  document.getElementById("refreshRoombaXMLButton").className  = "btn btn-success glyphicon glyphicon-play";
		  clearInterval(timerXMLRoomba);
		}
		else if(statusXMLRoomba=='pause')
		{
		  statusXMLRoomba = 'play';  
		  document.getElementById("refreshRoombaXMLButton").className  = "btn btn-warning glyphicon glyphicon-pause";
		  updateRefreshRateXMLRoomba(document.getElementById("refreshXMLRoombaRateInput"));
		}
	}
	
	function setCamAttr(attribute)
	{
		validateLimits(attribute);
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("POST", "roomberryWrapper.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		if (attribute.id.endsWith("ground")) xmlhttp.send("op=cam&"+attribute.id+"=" + rgbToHex($("#"+attribute.id+"").val()));
		else if (attribute.id == "local-annotate_text") xmlhttp.send("op=cam&local-annotate_text="+attribute.value.replace(/ /g, '%20'));
		else xmlhttp.send("op=cam&"+attribute.id.split("_input")[0] + "=" + attribute.value);
	} 

	function rgbToHex(stringColor)
	{
		var r, g, b;
		var aux;
		aux = stringColor.split(",");
		r = Number(aux[0].substring(aux[0].indexOf("(")+1));
		g = Number(aux[1]);
		b = Number(aux[2].substring(0,aux[2].indexOf(")")));
		return "" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
	}

	function setDefaultCamValues()
	{
		camParameters[0].value = "#808080";
		camParameters[1].value = "#ffffff";
		camParameters[2].value = "30";
		camParameters[3].value = "auto";
		camParameters[4].value = "50";
		camParameters[5].value = "0";
		camParameters[6].value = "off";
		camParameters[7].value = "0";
		camParameters[8].value = "off";
		camParameters[9].value = "30";
		camParameters[10].value = "False";
		camParameters[11].value = "True";
		camParameters[12].value = "none";
		camParameters[13].value = "0";
		camParameters[14].value = "Roomberry %d-%m-%Y %H:%M:%S";
		camParameters[15].value = "480";
		camParameters[16].value = "640";
		camParameters[17].value = "10";
		camParameters[18].value = "85";
		camParameters[19].value = "972";
		camParameters[20].value = "1296";
		camParameters[21].value = "0";
		camParameters[22].value = "0";
		camParameters[23].value = "0";
		camParameters[24].value = "False";
		camParameters[25].value = "True";
		camParameters[26].value = "True";

		refreshHTMLCam();
		for (i in camParameters) 
		{
			if (camParameters[i].type != "number-input")
				setCamAttr(document.getElementById(camParameters[i].name));
			else setCamAttr(document.getElementById(camParameters[i].name + "_input"));
		}
	}

	
	function init_nipple()
	{
		if (!nippleManager || !nippleManager[0])
		{
			nippleManager = nipplejs.create({
			zone: document.getElementById('zone_joystick'),
			color: "#000",
			size: N_HEIGHT,
			position: {left: '50%', top: '50%'},
			mode: 'static',
			threshold: 0.2,
			lockX: true,
			lockY: true
			});
		
			nippleManager.on('move', function (evt, data){
				if (Date.now()  - lastMoveCall > RATELIMIT)
				{
					updateInputOutput("requested_radius", 0, MM);
					updateInputOutput("requested_velocity", 0, MMS);
					document.getElementById("speedSpin").value = 0;
					trans = ((N_HEIGHT / 2) - (data.instance.frontPosition.y + (N_HEIGHT /2))) / (N_HEIGHT / 2);
					rot = ((N_WIDTH / 2) - (data.instance.frontPosition.x + (N_WIDTH /2))) / (N_WIDTH / 2);
					vr = parseInt(trans * TRANSMAX + rot * ROTMAX);
					vl = parseInt(trans * TRANSMAX - rot * ROTMAX);
					lastMoveCall = Date.now();
					updateInputOutput("requested_right_velocity", vr, MMS);
					updateInputOutput("requested_left_velocity", vl, MMS);
					sendDriveDirect();
				}
			});

			nippleManager.on('end', function (evt, data) 
			{
				updateInputOutput("requested_right_velocity", 0, MMS);
				updateInputOutput("requested_left_velocity", 0, MMS);
				sendDriveDirect();
			});	
		}			
	}
	
	function init()
	{			
		batteryGauge = new JustGage({
			id: "batteryGauge",
			value: 0,
			min: 0,
			max: 100,
			hideInnerShadow: true,
			donut: true,
			symbol: '%',
			pointer: true,
			gaugeN_WIDTHScale: 0.7,
			levelColorsGradient:false,
			counter: true,
			customSectors: {
				length: true,
				ranges: [{
				  color : "#dc3545",
				  lo : 0,
				  hi : 20
				},{
				  color : "#ffc107",
				  lo : 21,
				  hi : 40
				},{
				  color : "#28a745",
				  lo : 41,
				  hi : 100
				}]
			},
			pointerOptions: {
			  toplength: -5,
			  bottomlength: 10,
			  bottomN_WIDTH: 6,
			  color: '#8e8e93',
			  stroke: '#ffffff',
			  stroke_N_WIDTH: 2,
			  stroke_linecap: 'round'
			},
		}); 				
	
		getLastSnapshot();
		getLastXMLRoomba();
		getLastXMLCam();
		getLastXMLMedia(); 
		
		document.getElementById("refreshSnapshotButton").click();
		document.getElementById("refreshRoombaXMLButton").click();	

		var speedSpin = $("input[name='speedSpin']").TouchSpin({
			min: 0,
			max: 500,
			step: 1,
			stepintervaldelay: 5,
			decimals: 0,
			postfix: MMS,
			verticalbuttons: true,
			postfix_extraclass: "spinner-output",
			booster: true,
			boostat: 10
		});
		speedSpin.on("change", function(e){
			updateInputOutput("requested_velocity", document.getElementById("speedSpin").value, MMS);
			sendDrive();
		});

		$('#annotate_background').colorpicker({format: 'rgb'});		
		$('#annotate_foreground').colorpicker({format: 'rgb'});	
        $('#annotate_background').colorpicker().on('changeColor', function(e) {
			if (e.color.toHex() != (camParameters[0].value))
			{
				setCamAttr(document.getElementById('annotate_background'));
			}
			camParameters[0].value = e.color.toHex();	
		});
		$('#annotate_foreground').colorpicker().on('changeColor', function(e) {
			if (e.color.toHex() != (camParameters[0].value))
			{
				setCamAttr(document.getElementById('annotate_foreground'));
			}
			camParameters[0].value = e.color.toHex();	
		});
		programKeyboard();
		checkAvailableOps(roombaParameters[0].value);
		$('[data-toggle="tooltip"]').tooltip({html: true});
	
	}
	
	function sleep (time)
	{
		return new Promise((resolve) => setTimeout(resolve, time));
	}
	
	function formatPrint(name, sensor, signal)
	{
		console.log(name + " - " + sensor + " - " + signal);  
	}
	
	function paintRoombaCanva()
	{
		var c = document.getElementById("roombaCanva");
		var ctx = c.getContext("2d");
		
		// Clean the scene
		ctx.clearRect(0, 0, C_WIDTH, C_HEIGHT+42);
		ctx.lineWidth=1;
		
		// Do not paint if system is in error state
		if (errorState)
		{
			ctx.stroke();
			return;
		}

		// Cliff sensors from right to left
		colouredRectangle(ctx, C_WIDTH/2, C_HEIGHT/2, C_WIDTH/3, -C_HEIGHT/6, roombaParameters[14].value, roombaParameters[18].value);
		colouredRectangle(ctx, C_WIDTH/2, C_HEIGHT/2 - C_HEIGHT/6, C_WIDTH/3, -C_HEIGHT/6, roombaParameters[13].value, roombaParameters[17].value);
		colouredRectangle(ctx, C_WIDTH/2, C_HEIGHT/2, -C_WIDTH/3, -C_HEIGHT/6, roombaParameters[12].value, roombaParameters[16].value);
		colouredRectangle(ctx, C_WIDTH/2, C_HEIGHT/2 - C_HEIGHT/6, -C_WIDTH/3, -C_HEIGHT/6, roombaParameters[11].value, roombaParameters[15].value);
		
		// IR Sensors right, left, omni
		circleSector(ctx, C_WIDTH/2, C_HEIGHT/2, 0, 3 * Math.PI / 2, true, ((C_HEIGHT/2)-10), roombaParameters[32].value);
		circleSector(ctx, C_WIDTH/2, C_HEIGHT/2, Math.PI, 3 * Math.PI / 2, false, ((C_HEIGHT/2)-10), roombaParameters[33].value);
		
		// Some cleaning
		ctx.globalCompositeOperation =  "xor";			
		ctx.beginPath();					 
		ctx.arc(C_HEIGHT/2, C_WIDTH/2, C_HEIGHT/4 + 10, 0, 2 * Math.PI);
		ctx.fillStyle = "white";
		ctx.fill();					
		ctx.globalCompositeOperation =  "source-over";	
		
		// Roomba shape
		ctx.beginPath();
		ctx.arc(C_HEIGHT/2, C_WIDTH/2, C_HEIGHT/4, 0, 2 * Math.PI);
		ctx.lineWidth = 1;
		ctx.strokeStyle = "rgba(144, 144, 144, 1)";
		ctx.fillStyle = "rgba(144, 144, 144, 0.2)";
		ctx.fill();
		ctx.stroke();
			
		// Roomba buttons shape
		ctx.beginPath();				
		ctx.arc(C_HEIGHT/2, C_WIDTH/2, C_HEIGHT/10, 0, 2 * Math.PI);
		ctx.lineWidth = 1;
		ctx.strokeStyle = "rgba(144, 144, 144, 1)";
		ctx.fillStyle = "rgba(144, 144, 144, 0.4)"; 
		ctx.fill();
		ctx.stroke();

		// Roomba clean button shape
		ctx.beginPath();				
		ctx.arc(C_HEIGHT/2, C_WIDTH/2, C_HEIGHT/18, 0, 2 * Math.PI);
		ctx.lineWidth = 1;
		ctx.strokeStyle = "rgba(144, 144, 144, 1)";
		ctx.fillStyle = "rgba(144, 144, 144, 0.2)";
		ctx.fill(); 
		ctx.stroke();

		// Roomba caster shape
		ctx.beginPath();			
		ctx.arc(C_WIDTH/2, C_HEIGHT/2-C_HEIGHT/4+20, C_HEIGHT/24, 0, 2 * Math.PI);
		ctx.lineWidth = 1;
		ctx.strokeStyle = (roombaParameters[47].value == "True" ? "rgba(212, 63, 58, 0.2)" : "rgba(144, 144, 144, 1)");
		ctx.fillStyle = (roombaParameters[47].value == "True" ? "rgba(212, 63, 58, 0.2)" : (roombaParameters[46].value == "True" ? "rgba(144, 144, 144, 0.8)" : "rgba(144, 144, 144, 0)"));
		ctx.fill();
		ctx.stroke();
		
		// Print home or internal if roomba is in home base
		if (roombaParameters[34].value == "True" || roombaParameters[35].value == "True")
		{
			var message = (roombaParameters[34].value == "True") ? "Home" : "Internal";
			ctx.beginPath();
			ctx.fillStyle = "rgba(255, 255, 255, 1)";
			ctx.fillText(message, C_WIDTH/2-ctx.measureText(message).width/2, C_HEIGHT/2+2); 
		}
		
		// Wheels right and left
		roundedRect(ctx, C_WIDTH/2 + C_WIDTH/7, C_HEIGHT/2 - C_HEIGHT/16, C_WIDTH/14,  C_HEIGHT/8, 5, roombaParameters[10].value);  
		roundedRect(ctx, C_WIDTH/2 - C_WIDTH/7 - C_WIDTH/14, C_HEIGHT/2 - C_HEIGHT/16, C_WIDTH/14,  C_HEIGHT/8, 5, roombaParameters[9].value);
		
		// Bumps right and left
		circularTrapezoid(ctx, C_WIDTH/2 + C_HEIGHT/4, C_HEIGHT/2, C_WIDTH/2, C_HEIGHT/2, C_HEIGHT/4, 10, 0, 3 * Math.PI / 2, true, roombaParameters[8].value);
		circularTrapezoid(ctx, C_WIDTH/2 - C_HEIGHT/4, C_HEIGHT/2, C_WIDTH/2, C_HEIGHT/2, C_HEIGHT/4, 10, Math.PI, 3 * Math.PI / 2, false, roombaParameters[7].value);			
		circularTrapezoid(ctx, C_WIDTH/2 + C_HEIGHT/4, C_HEIGHT/2, C_WIDTH/2, C_HEIGHT/2, C_HEIGHT/4, 10, 0, Math.PI, false, 0);
								
		// Light Bumbers from right to left
		rotatedRect(ctx, 15, roombaParameters[24].value, roombaParameters[30].value, 2000);			
		rotatedRect(ctx, 45, roombaParameters[23].value, roombaParameters[29].value, 1000);
		rotatedRect(ctx, 75, roombaParameters[22].value, roombaParameters[28].value, 1000);
		rotatedRect(ctx, 105, roombaParameters[21].value, roombaParameters[27].value, 500);
		rotatedRect(ctx, 135, roombaParameters[20].value, roombaParameters[26].value, 1000);
		rotatedRect(ctx, 165, roombaParameters[19].value, roombaParameters[25].value, 300);

		// Virtual Wall sensor
		rotatedRect(ctx, 90, roombaParameters[31].value, 3, 4, C_WIDTH/2);
		
		// Status values
		ctx.beginPath();
		ctx.strokeStyle = "rgba(144, 144, 144, 1)";
		ctx.strokeRect(5,C_HEIGHT/4*3 + 17 + 20, 320, 80);
		statusValue(ctx, 10, C_HEIGHT/4*3 + 30 + 20, roombaParameters[36]);
		statusValue(ctx, 10, C_HEIGHT/4*3 + 45 + 20, roombaParameters[37]);
		statusValue(ctx, 10, C_HEIGHT/4*3 + 60 + 20, roombaParameters[38]);
		statusValue(ctx, 10, C_HEIGHT/4*3 + 75 + 20, roombaParameters[39]);
		statusValue(ctx, 10, C_HEIGHT/4*3 + 90 + 20, roombaParameters[44]);
		statusValue(ctx, 180, C_HEIGHT/4*3 + 30 +20, roombaParameters[42]);
		statusValue(ctx, 180, C_HEIGHT/4*3 + 45 +20, roombaParameters[43]);
		statusValue(ctx, 180, C_HEIGHT/4*3 + 60 +20, roombaParameters[40]);
		statusValue(ctx, 180, C_HEIGHT/4*3 + 75 +20, roombaParameters[41]);		
		statusValue(ctx, 180, C_HEIGHT/4*3 + 90 +20, roombaParameters[45]);		

		// formatPrint("distance", roombaParameters[44].value);
		// formatPrint("angle", roombaParameters[45].value);
	}

	function formatText(string)
	{
		var aux = string.replace(/_/g, " ");
		aux = aux.replace(/requested /g, "");
		aux = aux.replace(/current/g, "cur.");
		aux = aux.replace(/main brush/g, "MB");
		aux = aux.replace(/side brush/g, "SB");		
		return aux.charAt(0).toUpperCase() + aux.slice(1) + ":";
	}
		
	function statusValue(ctx, posX, posY, parameter)
	{
		ctx.beginPath();
		ctx.font = "11px Arial";
		ctx.fillStyle = "rgba(144, 144, 144, 1)";
		ctx.fillText(formatText(parameter.name),posX,posY);	
		ctx.fillText(parameter.value,posX + 85, posY);
		ctx.fillText(parameter.units,posX + 115, posY);

	}

	function circleSector(ctx, centerX, centerY, startAngle, endAngle, counterclockwise, radius, valueIR)
	{
		if (valueIR != 0)
		{
			ctx.beginPath();
			ctx.moveTo(centerX,centerY);
			ctx.arc(centerX,centerY,radius,startAngle,endAngle, counterclockwise);
			ctx.lineTo(centerX,centerY);
			ctx.strokeStyle = "rgba(144, 144, 144, 1)";
			ctx.fillStyle = "rgba(144, 144, 144, 0.2)";
			ctx.stroke();
			ctx.fill();
			
			ctx.font = "14px Arial";
			ctx.fillStyle = "rgba(144, 144, 144, 1)";
			var message = "";
			switch (parseInt(valueIR))
			{
				case 130: message = "Adelante";break;
				case 131: message = "Derecha";break;
				case 132: message = "Spot";break;
				case 133: message = "Max";break;
				case 134: message = "Pequeño";break;
				case 135: message = "Medio";break;
				case 136: message = "Limpiar";break;
				case 137: message = "Stop";break;
				case 138: message = "Power";break;
				case 139: message = "Arco izq.";break;
				case 140: message = "Arco der.";break;
				case 141: message = "Stop";break;
				case 161: message = "Dock \u{2191}";break;
				case 162: message = "Pared virt.";break;
				case 164: message = "Dock \u{2190}";break;
				case 165: message = "Dock \u{2190} + \u{2191}";break;
				case 168: message = "Dock \u{2192}";break;
				case 169: message = "Dock \u{2192} + \u{2191}";break;
				case 172: message = "Dock \u{2190} + \u{2191}";break;
				case 173: message = "Dock \u{2190} + \u{2191} + \u{2191}";break;
			}
			
			if (counterclockwise)
			{
				ctx.fillText(message,centerX + 5,centerY - radius + 40);		
			}
			else
			{
				ctx.fillText(message,centerX - ctx.measureText(message).width - 5, centerY - radius + 40);
			}				
		}
	}
	
	function rotatedRect(ctx, angle, sensor, signal, maxSignal, length=60)
	{
		if (sensor == "False") return;

		ctx.beginPath();
		var radius = C_HEIGHT/4 + 15 + length - ( parseFloat((signal>maxSignal?maxSignal:signal) / maxSignal) * length);
		ctx.strokeStyle = "rgba(144, 144, 144, 1)";
		ctx.fillStyle = "rgba(144, 144, 144, 0.4)";
		
		ctx.translate(C_WIDTH/2, C_HEIGHT/2);
		ctx.translate(radius * Math.cos(angle * Math.PI / 180),  - radius * Math.sin(angle * Math.PI / 180));
		ctx.rotate(((270-angle)%180) * Math.PI/180 );
		
		ctx.rect(-length/2, 10,length,-10);
		ctx.stroke();
		ctx.fill();
		
		// reset current transformation matrix to the identity matrix
		ctx.setTransform(1, 0, 0, 1, 0, 0);
				
		
	}

	function colouredRectangle(ctx, x, y, width, height, sensor, signal)
	{	
		var fillColor = "rgba(";
		var strokeColor = "rgba(";
		if (sensor == "False") 
		{
			return;
			//fillColor += "144, 144, 144, " + parseFloat((MAX_SIGNAL-signal) / MAX_SIGNAL).toFixed(1) + ")";
			//strokeColor += "144, 144, 144, 0.5)";
		}			
		else
		{
			fillColor += "212, 63, 58, 0.4)";// + parseFloat((MAX_SIGNAL-signal) / MAX_SIGNAL).toFixed(1) + ")";
			strokeColor += "212, 63, 58, 1)";
		}		

		ctx.beginPath();		
		ctx.fillStyle = fillColor;
		ctx.strokeStyle = strokeColor;
		ctx.rect(x,y,width,height);
		ctx.fill();
		ctx.stroke();
	}
	
	function circularTrapezoid(ctx, startX, startY, centerX, centerY, radius, width, startAngle, endAngle, counterclockwise = false, sensor)
	{
		ctx.beginPath();
		ctx.moveTo(startX, startY);		
		ctx.lineTo(startX + (width * ((	startX>centerX)?1:-1)), startY);
		ctx.arc(centerX, centerY, radius + Math.abs(width), startAngle, endAngle, counterclockwise);
		ctx.lineTo(startX + (radius * (counterclockwise?-1:(((endAngle - startAngle)*(counterclockwise?-1:1) >= Math.PI ) ? -2 : 1))), startY  + (radius * (((endAngle - startAngle)*(counterclockwise?-1:1) >= Math.PI ) ? 0 : -1)));
		ctx.arc(centerX, centerY, radius, endAngle, startAngle, !counterclockwise);
		ctx.strokeStyle = (sensor == "True" ? "rgba(212, 63, 58, 1)" : "rgba(144, 144, 144, 1)");
		ctx.fillStyle = (sensor == "True" ? "rgba(212, 63, 58, 0.2)" : "rgba(144, 144, 144, 0.2)");
		ctx.fill();
		ctx.stroke();
	}
	
	function roundedRect(ctx,x,y,width,height,radius,sensor)
	{
		ctx.beginPath();
		ctx.moveTo(x,y+radius);
		ctx.lineTo(x,y+height-radius);
		ctx.quadraticCurveTo(x,y+height,x+radius,y+height);
		ctx.lineTo(x+width-radius,y+height);
		ctx.quadraticCurveTo(x+width,y+height,x+width,y+height-radius);
		ctx.lineTo(x+width,y+radius);
		ctx.quadraticCurveTo(x+width,y,x+width-radius,y);
		ctx.lineTo(x+radius,y);
		ctx.quadraticCurveTo(x,y,x,y+radius);
		ctx.strokeStyle = (sensor == "True" ? "rgba(212, 63, 58, 1)" : "rgba(144, 144, 144, 1)");
		ctx.fillStyle = (sensor == "True" ? "rgba(212, 63, 58, 0.2)" : "rgba(144, 144, 144, 0.2)");
		ctx.fill();
		ctx.stroke();
	}

	function errorReceived()
	{			
		if (errorCounter++ > ERROR_LIMIT)
		{
			errorState = true;
			resetVector(roombaParameters);
			
			// Stop automatic polling of snapshots and xmls
			if(statusSnapshot=='play')
			{
			  statusSnapshot = 'pause';
			  document.getElementById("refreshSnapshotButton").className  = "btn btn-success glyphicon glyphicon-play";
			  clearInterval(timerSnapshot);
			}

			if(statusXMLRoomba=='play')
			{
			  statusXMLRoomba = 'pause';
			  document.getElementById("refreshRoombaXMLButton").className  = "btn btn-success glyphicon glyphicon-play";
			  clearInterval(timerXMLRoomba);
			}
			
			// Update button icon + message
			document.getElementById("roomberryStatusButton").className  = "btn-danger btn-sm btn-round glyphicon glyphicon-signal";
			$(document.getElementById("roomberryStatusButton")).attr('data-original-title', "Desconectado");

			// Deactivate buttons
			checkAvailableOps(roombaParameters[0].value);
			refreshHTMLRoomba();
			paintRoombaCanva();
		}
	}
		
	function resetVector(vector)
	{
		for (index = 0; index < vector.length; ++index) {
			vector[index].value = "";
		}
	}
	
	function editSong()
	{			
		$("#editRoombaModal").modal();
		document.getElementById("editRoombaModalTitle").innerHTML = "<span class=\"glyphicon glyphicon-edit\"></span> Editar Canción " + (Number(document.getElementById("songSelector").value)+1);
		var HTTPCode = "";
		for (var i = 0; i < NOTES; i++)
		{
			var currentNote = noteTemplate.replace(/X/g, i);
			HTTPCode+=currentNote;													
		}
		
		document.getElementById("uploadModalButton").onclick = function (){uploadSong();};
		document.getElementById("modalTable").innerHTML = HTTPCode;	
		document.getElementById("saveNameModalInput").value = "Canción " + (Number(document.getElementById("songSelector").value)+1);	
		document.getElementById("playModalButton").style.visibility = 'visible';
		document.getElementById("saveNameModalInput").style.visibility = 'visible';		
		document.getElementById("saveModalButton").style.visibility = 'visible';	
		document.getElementById("deleteModalButton").style.visibility = 'visible';	
		loadSongsSelector();
	}
	
	function deleteSong()
	{
		var op = "delete_song";
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200)
				{
					loadSongsSelector();
				}
		};	
		xmlhttp.open("POST", "roomberryWrapper.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send("op="+op+"&song_name="+document.getElementById("songNamesModalSelect").value);
	}

	function editSchedule()
	{			
		$("#editRoombaModal").modal();
		document.getElementById("editRoombaModalTitle").innerHTML = "<span class=\"glyphicon glyphicon-edit\"></span> Editar Programa";
		var HTTPCode = "";
		for (var i = 0; i < DAYS; i++)
		{
			var currentAssignment = assignmentTemplate.replace(/X/g, i).replace(/Y/, DAYS_OF_WEEK[i]);
			HTTPCode+=currentAssignment;													
		}
		document.getElementById("uploadModalButton").onclick = function (){uploadSchedule();};		
		document.getElementById("modalTable").innerHTML = HTTPCode;
		
		document.getElementById("playModalButton").style.visibility = 'hidden';
		document.getElementById("saveModalButton").style.visibility = 'hidden';			
		document.getElementById("saveNameModalInput").style.visibility = 'hidden';
		document.getElementById("songNamesModalSelect").style.visibility = 'hidden';
		document.getElementById("deleteModalButton").style.visibility = 'hidden';


		
		for (var i = 0; i < DAYS; i++)
		{
				dayScheduleToggled(i);												
		}
	}
	
	function dayScheduleToggled(dayNumber)
	{
		var checked = document.getElementById("Send"+dayNumber).checked;
		(document.getElementById("hour"+dayNumber).disabled) = !checked;
		(document.getElementById("minute"+dayNumber).disabled) = !checked;
	}
	
	function validateSchedule(inputDay)
	{
		inputDay.value="".padStart(2 -inputDay.value.length,"0")+inputDay.value;
		if (!inputDay.validity.valid)
		{			
			if (inputDay.value > inputDay.max) inputDay.value = inputDay.max;
			else if (inputDay.value < inputDay.min) inputDay.value = inputDay.min;
		}
	}
	
	function validateLimits(inputParameter)
	{
		if (!inputParameter.validity.valid)
		{			
			if (inputParameter.value > inputParameter.max) inputParameter.value = inputParameter.max;
			else if (inputParameter.value < inputParameter.min) inputParameter.value = inputParameter.min;
			else inputParameter.stepDown();
		}
	}
	
	function validateDuration(inputNote)
	{
		if (inputNote.value.indexOf(".") == -1) inputNote.value += ".000000";
		inputNote.value+="".padEnd(6 -(inputNote.value.length - inputNote.value.indexOf(".") - 1),"0");
		validateLimits(inputNote);
	}

	function playNote(index, time="+0") 
	{				
		if (document.getElementById("noteLetter"+index).value < 12 && document.getElementById("noteScale"+index).value != "" && document.getElementById("noteDuration"+index).value != "")
		{				
			synth.triggerAttackRelease(document.getElementById("noteLetter"+index)[(Number(document.getElementById("noteLetter"+index).value)+1)].innerHTML.split("-")[1].trim() + document.getElementById("noteScale"+index).value, document.getElementById("noteDuration"+index).value, time);
			
		}			
	}
	
	function playSongSimulate()
	{			
		var part = new Tone.Part(function(time, index){playNote(index, time)});
		var index = 0;
		var time = 0;
		for (index = 0; index < NOTES; index++)
		{
			part.add(time, index);
			time += Number(document.getElementById("noteDuration"+index).value);
		}
		part.probability = 1;
		Tone.Transport.start();
		part.start();
	}
	
	function saveSongXML()
	{
		var songXML = "<song>";
		for (index = 0; index < NOTES; index++)
		{
			songXML += "<note><noteLetter>"+document.getElementById("noteLetter"+index).value+"</noteLetter><noteScale>"+document.getElementById("noteScale"+index).value+"</noteScale><noteDuration>"+document.getElementById("noteDuration"+index).value+"</noteDuration></note>";			
		}
		songXML += "</song>";
		
		var op = "save_xml_song";
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200)
				{
					loadSongsSelector();
				}
		};
		xmlhttp.open("POST", "roomberryWrapper.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded"); 
		xmlhttp.send("op="+op+"&song_name="+document.getElementById("saveNameModalInput").value+"&xml_string="+songXML);					
	}
	 
	function loadSongsSelector()
	{
		var op = "load_xml_songs";
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200)
				{
					document.getElementById("songNamesModalSelect").innerHTML = this.responseText;
					document.getElementById("songNamesModalSelect").style.visibility = 'visible';
				}
		};
		xmlhttp.open("POST", "roomberryWrapper.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send("op="+op);
	}
	
	function loadSongFromXML(selectedSong)
	{
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				var xmlDoc = this.responseXML;
				var notes = xmlDoc.getElementsByTagName("note");
				for (var i = 0; i < NOTES; i++)
				{
					document.getElementById("noteLetter"+i).value =  notes[i].children[0].textContent;
					document.getElementById("noteScale"+i).value =  notes[i].children[1].textContent;
					document.getElementById("noteDuration"+i).value =  notes[i].children[2].textContent;
				}
				document.getElementById("saveNameModalInput").value = selectedSong.slice(0, -4);
			}
		};
		xmlhttp.open("GET", "songs/"+selectedSong, true);
		xmlhttp.send();	
	} 
		
		
	function uploadSong()
	{
		var notes = "";
		var partialNotes = "";
		
		for (index = 0; index < NOTES; index++)
		{	
			partialNotes += "("+((document.getElementById("noteLetter"+index).value == 12)?127:((Number(document.getElementById("noteScale"+index).value)+1)*12+Number(document.getElementById("noteLetter"+index).value)))+","+(Number(document.getElementById("noteDuration"+index).value)/0.015625)+"),";
	
			// if last note was not silent, add partialNotes to notes list
			if (document.getElementById("noteLetter"+index).value != 12)
			{
				notes += partialNotes;
				partialNotes = "";
			}				
		}
		
		var op = "set_song";
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("POST", "roomberryWrapper.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send("op="+op+"&song_number="+songSelector.value+"&notes="+notes.slice(0, -1));
		
	}

	function uploadSchedule()
	{
		var schedule = "";
		for (var i = 0; i < DAYS; i++)
		{
			schedule += "&"+DAYS_OF_WEEK_SHORT[i]+"_hour="+(document.getElementById("Send"+i).checked?document.getElementById("hour"+i).value:0)+"&"+DAYS_OF_WEEK_SHORT[i]+"_min="+(document.getElementById("Send"+i).checked?document.getElementById("minute"+i).value:0);													
		}

		var op = "set_schedule";
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("POST", "roomberryWrapper.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send("op="+op+schedule);
	}

	function capturePicture()
	{
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("POST", "roomberryWrapper.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send("op=cam_capture");
	}

	function captureRecord()
	{
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("POST", "roomberryWrapper.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send("op=cam_record&duration=" + document.getElementById("videoCaptureDuration").value);
	}
