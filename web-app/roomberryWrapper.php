<?php

	/**
     * Calculate if the file passed as parameter is or not a video.
     *
     * @param str $filepath File path including extension.
     *
     * @return True if the file is a video, false otherwise.
     */
	function isVideo($filepath)
	{
		return (substr($filepath, -5, 5) == ".h264");
	}
	
	/**
     * Obtain the day of the week that corresponds to the day passed as parameter.
     *
     * @param int $year Year.
     * @param int $month Month.
     * @param int $day Day.
     *
     * @return The day of the week corresponding to the day/month/year passed as parameter.
     */	
	function dayOfWeek($year,$month,$day)
	{
		return date("w", strtotime($year.$month.$day));
	}
	
	/**
	 * Remove multimedia files older than parameter minutes
	 *
	 * @param int $minutesToKeep Maximal number of minutes to keep the multimedia files.
	 *
	 */	 
	function removeOldMultimedia($minutesToKeep)
	{
		global $multimediaPath;

		$files = glob($multimediaPath."*");
		$now   = time();

		foreach ($files as $file)
		{
			if (is_file($file) && ($now - filemtime($file) >= 60 * $minutesToKeep))
			{
				unlink($file);
			}
		}
	}

	// read the config file
	$config = parse_ini_file('config.ini',true);			
	$basePath = $config['roomberry']['basePath'];
	$songsPath = $config['roomberry']['songsPath'];
	$multimediaPath = $config['roomberry']['multimediaPath'];
	$curlTimeout = $config['roomberry']['curlTimeout'];	
	$url = $config['roomberry']['url'];
	
	$snapFilename = "snapR.jpg";
	$roombaXMLFilename = "roomba.xml";
	$camXMLFilename = "cam.xml";
	$mediaXMLFilename = "media.xml";	
	
	$snapUrl = $url."/cam/snap.jpg";
	$roombaXMLUrl = $url."/roomba/roomba.xml";
	$camXMLUrl = $url."/cam/cam.xml";
	$mediaXMLUrl = $url."/cam/media.xml";	

	// create a curl object to communicate with calduino
	$ch = curl_init();
	curl_setopt($ch,CURLOPT_TIMEOUT, $curlTimeout);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_FORBID_REUSE, 1);	
	
	/* if started from commandline, wrap ops to  $_POST */
	if (!isset($_SERVER["HTTP_HOST"]))
	{
	  parse_str($argv[1], $_POST);
	}
	
	if (isset($_POST["op"]))
	{
		$op = $_POST["op"];
	}
	
	switch ($op) 
	{	
		case "lastSnapshot":
		
			//Create multimedia folder if it does not exists
			if (!is_dir($multimediaPath)) mkdir($multimediaPath, 0755);	
			
			if(@copy($snapUrl, $multimediaPath.$snapFilename."new"))
			{
				@rename($multimediaPath.$snapFilename."new", $multimediaPath.$snapFilename);
			}
			else
			{
				http_response_code(500);
				exit(1);
			}
			break;

		case "lastCamXML":					
			if(@copy($camXMLUrl, $basePath.$camXMLFilename."new"))
			{
				@rename($basePath.$camXMLFilename."new", $basePath.$camXMLFilename);
			}
			else
			{
				http_response_code(500);
				exit(1);
			}
			break;	
			
		case "lastRoombaXML":					
			if(@copy($roombaXMLUrl, $basePath.$roombaXMLFilename."new"))
			{
				@rename($basePath.$roombaXMLFilename."new", $basePath.$roombaXMLFilename);
			}
			else
			{
				http_response_code(500);
				exit(1);
			}
			break;

		case "getMedia":
			$file = $_POST["file"];
			
			//Create multimedia folder if it does not exists
			if (!is_dir($multimediaPath)) mkdir($multimediaPath, 0755);
			
			// remove photos and videos older than removeOldMultimedia minutes
			removeOldMultimedia($config['roomberry']['removeOldMultimedia']);
			
			if (isVideo($file))
			{
				if (file_exists($multimediaPath.explode('.',explode('/',$file)[1])[0].".mp4"))
				{
					echo explode('.',explode('/',$file)[1])[0].".mp4";
				}
				else if(copy($url."/cam/".$file, $multimediaPath.explode('/',$file)[1]))
				{
					// Convert to mp4
					$unixCommand = "MP4Box -quiet -add ". $multimediaPath.explode('/',$file)[1]. " ".$multimediaPath.explode('.',explode('/',$file)[1])[0].".mp4". " 2>&1";;
					shell_exec ($unixCommand);
										
					// Delete h264 file
					unlink($multimediaPath.explode('/',$file)[1]);

					echo explode('.',explode('/',$file)[1])[0].".mp4";
						
				}
				else
				{
					http_response_code(500);
					exit(1);
				}
			}
			else if ((file_exists($multimediaPath.explode('/',$file)[1])) || (copy($url."/cam/".$file, $multimediaPath.explode('/',$file)[1])))
			{
				echo explode('/',$file)[1];
			}
			else
			{
				http_response_code(500);
				exit(1);
			}
			break;

		case "lastMediaXML":					
			if(@copy($mediaXMLUrl, $basePath.$mediaXMLFilename."new"))
			{
				@rename($basePath.$mediaXMLFilename."new", $basePath.$mediaXMLFilename);
				$xml = simplexml_load_file ($basePath.$mediaXMLFilename);
				$lastYear = $lastMonth = 0;				
				$httpResponse = "";

				foreach ($xml->folder as $folder)
				{
					$currentYear = substr($folder['day'],0,4);
					$currentMonth = substr($folder['day'],4,2);
					$day = substr($folder['day'],6,2);
					$firstOpen = false;
					$closeMonths = false;

					if ($currentYear!=$lastYear)
					{	
						$httpResponse .= ($lastYear != 0) ? "</ul></li></ul></li>" : "";
						$httpResponse .= ($lastYear != 0) ? "<li onclick=\"getLastXMLMedia();openMediaYear(this)\"><i class=\"glyphicon glyphicon-folder-close year\" id=".$currentYear."></i><a>".$currentYear."</a><ul>" :
															"<li onclick=\"getLastXMLMedia();openMediaYear(this)\"><i class=\"glyphicon glyphicon-folder-open year\" id=".$currentYear."></i><a>".$currentYear."</a><ul>";
						$closeMonths=($lastYear != 0) ? true : false;											
						$lastYear=$currentYear;
						$lastMonth = 0;						
					}
					if ($currentMonth!=$lastMonth)
					{
						$httpResponse .= ($lastMonth != 0) ? "</ul></li>" : "";
						$httpResponse .= $closeMonths ?
												"<li style=\"display: none;\" onclick=\"openMediaMonth(this)\"><i class=\"glyphicon glyphicon-folder-close month\" id=".$currentYear.$currentMonth."></i><a>".$config['common']['month'][intval($currentMonth)-1]."</a><ul>" :
												"<li onclick=\"openMediaMonth(this)\"><i class=\"glyphicon glyphicon-folder-close month\" id=".$currentYear.$currentMonth."></i><a>".$config['common']['month'][intval($currentMonth)-1]."</a><ul>";	
						$lastMonth=$currentMonth;
					}

					$httpResponse .= "<li ".($firstOpen ? "" : "style=\"display: none;\"" )." onclick=\"openDay(this)\" id=".$currentYear.$currentMonth.$day."><i class=\"glyphicon glyphicon-folder-close day\"></i><a>".$config['common']['day'][dayOfWeek($currentYear,$currentMonth,$day)]." ".$day."</a><ul>";
					
					foreach ($folder->file as $file)
					{
						if ($file['type'] == "record")
						{
							$httpResponse.= "<li style=\"display: none;\" onclick=\"openMediaFile(this)\" id=".$folder['day']."/".$file['path']."><i class=\"glyphicon glyphicon-facetime-video video\"></i><a>".substr($file['path'],9,2).":".substr($file['path'],11,2).":".substr($file['path'],13,2)."</a></li>";						
						}
						else if ($file['type'] == "capture")
						{
							$httpResponse.= "<li style=\"display: none;\" onclick=\"openMediaFile(this)\" id=".$folder['day']."/".$file['path']."><i class=\"glyphicon glyphicon-camera image\"></i><a>".substr($file['path'],9,2).":".substr($file['path'],11,2).":".substr($file['path'],13,2)."</a></li>";
						}
					}	
	
					$httpResponse .= "</ul></li>";
				}
				$httpResponse .= "</ul></ul></ul>";
				echo $httpResponse;
			}
			else
			{
				http_response_code(500);
				exit(1);
			}
			break;
		
		case "save_xml_song":
			$xml_string = $_POST["xml_string"];
			$song_name = $_POST["song_name"];
			$xml = simplexml_load_string($xml_string);
			if (!is_dir($songsPath)) mkdir($songsPath, 0755);
			$xml->asXml($songsPath.$song_name.".xml");			
			break;
			
		case "load_xml_songs":
			$html_string = "<option disabled selected value></option>";
			foreach (glob($songsPath."*.xml") as $song)
			{
				$html_string .= "<option value=\"".basename($song)."\">".basename($song)."</option>";
			}
			echo $html_string;
			break;

		case "delete_song":
			$song_name = $_POST["song_name"];
			unlink($songsPath.$song_name);
			break;
			
		case "_change_mode":
		case "drive":
		case "drive_direct":
		case "drive_pwm":
		case "set_motors_pwm":
		case "set_ascii_leds":
		case "play_song":
		case "set_song":
		case "set_schedule":
		case "clean":
		case "clean_spot":
		case "seek_dock":
		case "clean_max":
		case "power_down":
		case "set_day_time":
		case "reset_roomba_distance_angle":
			$url.="/roomba/?".file_get_contents('php://input');
			curl_setopt($ch,CURLOPT_URL,$url);				
			curl_exec($ch);
			break;

		case "cam_capture":
		case "cam_record":
		case "cam":
			$url.="/cam/?".file_get_contents('php://input');
			curl_setopt($ch,CURLOPT_URL,$url);				
			curl_exec($ch);
			break;
			
		default :			
			break;
	}
	exit(0);

?>