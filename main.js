

///
///     Deply TURN Server via Ajax
///
let customConfig;
         $.ajax ({
             url: "https://global.xirsys.net/_turn/tranloi2512.github.io/",
             type: "PUT",
             async: false,
             headers: {
               "Authorization": "Basic " + btoa("tranloi2512:1504b54e-a2d9-11e7-b628-1c12c2a160ac")
             },
             success: function (res){
               console.log("ICE List: "+res.v.iceServers);
               customConfig = res.v.iceServers;
             }});

///
///     Check wheather audio or video activation
///
var video_enable = true;
var audio_enable = false;
function video_handleClick(cb1) {
  console.log("Video enable = " + cb1.checked);
  video_enable = cb1.checked;
}

function audio_handleClick(cb2) {
  console.log("Audio enable = " + cb2.checked);
  audio_enable = cb2.checked;
}


///
///   ROSLIB for public control topic
///
var ros = new ROSLIB.Ros({
      url : 'ws://localhost:9090'
    });

ros.on('connection', function() {
    console.log('Connected to websocket server.');
  });

ros.on('error', function(error) {
    console.log('Error connecting to websocket server: ', error);
  });

ros.on('close', function() {
    console.log('Connection to websocket server closed.');
  });

///
///   PUBLISH A TOPIC 
///
var speed_linear = 0.18;
var speed_angular = 0.2;
var speed_step = 0.01;
var speed_max = 0.3;
var speed_min = 0.1;
var cmdVel = new ROSLIB.Topic({
  ros : ros,
  name : '/chefbot_cmd_vel',
  messageType : 'geometry_msgs/Twist'
});

var twist = new ROSLIB.Message({
linear : {
  x : 0.0,
  y : 0.0,
  z : 0.0
},
angular : {
  x :  0.0,
  y :  0.0,
  z :  0.0
}
});


///
///		Creat Peerjs Connect
///
const peer = new Peer({
       key: 'peerjs', 
       host: 'tmlpeerjs.herokuapp.com', 
       secure: true, 
       port: 443,
       config: customConfig
       });
    peer.on('open', id => {
    $('#my-peer').append(id);
   /* $('#btnSignUp').click(() => {
        const username = $('#txtUsername').val();
        socket.emit('NEW_USER_ASSIGN', { name: username, peerId: id });
    });*/
});

var key_count=0;
var key_max=100;
var stream_flag=false;
peer.on('connection', function(conn) {
  // Receive messages
      conn.on('data', function(data) {
      //console.log('Received: ', data);
      if (stream_flag==false)
      {
        const id = data;
        console.log('start server streaming to id ...'+id);        
        stream_flag = true;
        console.log('flag'+stream_flag);
        openStream()
          .then(stream => {
            playStream('localStream', stream);
          const call = peer.call(id, stream);
          // call.on('stream', remoteStream => playStream('remoteStream', remoteStream));
    });

        
    } //end of if
      
     else {
      
     

      switch (data) {
        case 73:   
         console.log('UP'); 
        twist.linear.x = speed_linear;
        twist.angular.z = 0;        
        break;
        
        case 74:  
        console.log('LEFT');
        twist.linear.x = 0;
        twist.angular.z = speed_angular;
     
        break;
        
        case 188:   
        console.log('DOWN');
        twist.linear.x = -speed_linear;
        twist.angular.z = 0;        
        break;
    
        case 76:   
        console.log('RIGHT');
        twist.linear.x = 0;
        twist.angular.z = -speed_angular;        
        break;
        
        case 75:   
        console.log('STOP');
        twist.linear.x = 0;
        twist.angular.z = 0;
        break;

        case 85:   
        console.log('UP - LEFT');
        twist.linear.x = speed_linear;
        twist.angular.z = speed_angular;
        break;

        case 79:   
        console.log('UP - RIGHT');
        twist.linear.x = speed_linear;
        twist.angular.z = -speed_angular;        
        break;

        case 77:   
        console.log('DOWN - LEFT');
        twist.linear.x = -speed_linear;
        twist.angular.z = speed_angular;
        break;

        case 190:   
        console.log('DOWN - RIGHT');
        twist.linear.x = 0;
        twist.angular.z = speed_angular;
        break;
        
        case 87:         
          if (speed_linear <= speed_max )
              {
                speed_linear+=speed_step;
              };
          console.log('Increase Linear Speed:'+speed_linear);
          break;
        
        case 83:        
          if (speed_linear >= speed_min)
              {
                speed_linear -=speed_step;
              }
          console.log('Decrease Linear Speed:' +speed_linear);
          break;

        case 82:         
          if(speed_angular <= speed_max)
            {
                speed_angular += speed_step;
            }
          console.log('Increase Angular Speed:' + speed_angular);
          break;
       
        case 70:         
          if(speed_angular >= speed_min)
            {
                speed_angular -= speed_step;
            }
          console.log('Decrease Angular Speed:' +speed_angular);
          break;        
        default: 
        {
          console.log('out of desired key '+data)
        }; //end of default
      }; //emd of switch
 
      // Got all parame from key board event, 
      for (count = 0;count <=10; count++){
          if (speed_linear > current_linear)
                current_linear = Math.min( speed_linear, current_linear + speed_step );
            else if (speed_linear < current_linear)
                current_linear = Math.max( speed_linear, current_linear - speed_step );
            else
                current_linear = speed_linear;

            if (speed_angular > current_angular)
                current_angular = Math.min( speed_angular, current_angular + speed_step );
            else if (speed_angular < current_angular)
                current_angular = Math.max( speed_angular, current_angular - speed_step );
            else
                current_angular = speed_angular;

          
            var twist = new ROSLIB.Message({
                 linear : {
                 x : current_linear,
                 y : 0.0,
                 z : 0.0
                },
                angular : {
                x : 0.0,
                y : 0.0,
                z : current_angular
                }
            });

            console.log("Linear speed:",current_linear);
            console.log("Linear angular:",current_angular);

            cmdVelTopic.publish(twist);


       };    //end of different speed check
    };  //end of else
     }); //end of data receive event
}); //end of connection event


///
///     


///
///     Window Closing Handler
///
window.onunload = window.onbeforeunload = function(e) {
  if (!!peer && !peer.destroyed) {
    peer.destroy();
  }
};



///
///		Callee Event Handler
///
peer.on('call', call => {
    console.log('Received Call Request...Start Streaming')
    openStream()
    .then(stream => {
        call.answer(stream);
       // playStream('localStream', stream);  //Dont display local stream on server side

        call.on('stream', remoteStream => playStream('remoteStream', remoteStream));
    });
});




///
///		Get Media Stream
///
function openStream(){
	console.log('Debug: video:'+video_enable);
  console.log('Debug: audio'+audio_enable);
  const config = {audio:audio_enable,video:video_enable};
	return navigator.mediaDevices.getUserMedia(config);
}

///
///		Play Media on canvas
///
function playStream(idVideoTag,stream){
	const video = document.getElementById(idVideoTag);
	video.srcObject = stream;
	video.play();
}

