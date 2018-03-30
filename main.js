

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
             }});


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
        default: 
        {
          console.log('out of desired key '+data)
        }; //end of default
      }; //emd of switch
 
      // Got all parame from key board event, 
      // TO DO: Publish chefbot_cmd_vel topic
     cmdVel.publish(twist);
    };  //end of else
     }); //end of data receive event
}); //end of connection event


///
///     Use ROSLIB for publishing cmd/Twist topic
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
	const config = {audio:false,video:true};
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

