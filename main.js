$('#div_Control').hide();
///
///     Socket.io Connect
///
const socket = io('https://tmlsocketio.herokuapp.com/');
var remoteID='';
var recognizing;
var final_transcript = '';
var imshow_transcript = '';
var recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.lang = 'en-PH';
recognition.interimResults = true;


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
             }
         });


///
///     Get Online User List From Socket.io Server
///
socket.on('ONLINE_USER_LIST',arrUserInfo => {
    $('#div-chat').show();
    $('#div-assign').hide();
    arrUserInfo.forEach(user =>{
        const {name,peerId} = user;
        $('#ulUser').append(`<li id="${peerId}">${name}</li>`);
     });

    socket.on('NEW_USER',user => {
        const {name,peerId} = user;
        $('#ulUser').append(`<li id="${peerId}">${name}</li>`);
    });
    
    socket.on('USER_DISCONNECT',peerId => {
        $(`#${peerId}`).remove();
    });
});

///
///     Check Dupplicate User Name
///
socket.on('ASSIGN_FAIL',() =>{
    alert('This UserName Is Already Assigned!');
});


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
var my_peer;
var peer = new Peer({
    key: 'peerjs', 
    host: 'tmlpeerjs.herokuapp.com', 
    secure: true, 
    port: 443,
    config: customConfig
    });
peer.on('open', id => {
    my_peer=id;
    $('#my-peer').append(id);
    $('#btnSignUp').click(() => {
        const username = $('#txtUsername').val();
        socket.emit('NEW_USER_ASSIGN', { name: username, peerId: id });
    });
});


var key_count=0;
var key_max=100;
var stream_flag=false;
var control_speed=0;
var control_turn=0;
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
          const call = peer.call(id, stream);
          // call.on('stream', remoteStream => playStream('remoteStream', remoteStream));
    });

        
    } //end of if
      
     else {
      
      speed = Number(document.getElementById('linearXText').value);
      turn = Number(document.getElementById('angularZText').value);
      switch (data) {
        case 73:  //forward
        //console.log('move forward');  
        console.log("forward");
        target_speed = speed;
        target_turn = 0;       
        break;
        
        case 188: //backward
        console.log('move backward');
        target_speed = -speed;
        target_turn = 0;
        break;

        case 74: //turn left
        console.log('turn left');
        target_speed = 0;
        target_turn = turn;
        break;

        case 76: //turn right
        console.log('turn right');
        target_speed = 0;
        target_turn = -turn;
        break;

        case 75: //stop
        console.log("stop");
        target_speed = 0;
        target_turn = 0;
        break;
       
        default: 
        {
          console.log('out of desired key '+data)
        }; //end of default
      }; //emd of switch
      for (count = 0;count <=10; count++){
          if (target_speed > control_speed)
                control_speed = Math.min( target_speed, control_speed + 0.02 );
            else if (target_speed < control_speed)
                control_speed = Math.max( target_speed, control_speed - 0.02 );
            else
                control_speed = target_speed;

            if (target_turn > control_turn)
                control_turn = Math.min( target_turn, control_turn + 0.1 );
            else if (target_turn < control_turn)
                control_turn = Math.max( target_turn, control_turn - 0.1 );
            else
                control_turn = target_turn;

            if (/*(oldSpeed !== control_speed)||(oldTurn !== control_turn)*/ true){
           var twist = new ROSLIB.Message({
                 linear : {
                 x : control_speed,
                 y : 0.0,
                 z : 0.0
                },
                angular : {
                x : 0.0,
                y : 0.0,
                z : control_turn
                }
            });

            cmdVel.publish(twist);


          }; //end of different speed check

        /*twist.linear.x = control_speed;
        twist.angular.z = control_turn;
*/
        // Publish the message 
        
        console.log('control_speed = '+control_speed);
       console.log('control_turn = '+control_turn);
      };//end of for loop

    };  //end of else
     }); //end of data receive event
}); //end of connection event


///
///     Window Closing Handler
///
window.onunload = window.onbeforeunload = function(e) {
  if (!!peer && !peer.destroyed) {
    peer.destroy();
  }
};


///
/// Function to HIDE and SHOW UI div
///
function toggle_div() {
    var x = document.getElementById("div_UI");
    if (x.style.display === "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }

    var x = document.getElementById("div_Control");
    if (x.style.display === "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }
    return 1;
    return 1;
}



///
///		Callee Event Handler
///
peer.on('call', call => {
    openStream()
    .then(stream => {
        call.answer(stream);
       // playStream('localStream', stream);
        call.on('stream', remoteStream => playStream('remoteStream', remoteStream));
  
	 });



});


///
///   Callee Event Handler
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
