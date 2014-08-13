var rooms = require('../../')
, Primus = require('primus')
, http = require('http')
, fs = require('fs');

var server = http.createServer(function server(req, res) {
    if(req.url==='/PapaParse/papaparse.js'){
	res.setHeader('Content-Type', 'text/javascript');
	fs.createReadStream(__dirname + req.url).pipe(res);
    } else if(req.url==='/cluster.js'){
	res.setHeader('Content-Type', 'text/javascript');
	fs.createReadStream(__dirname + req.url).pipe(res);
    } else if(req.url==='/tmp.csv'){
	console.log('req.headers.range', req.headers.range);
	var sz = fs.stat(__dirname+'/tmp.csv', 
			 function(e,s){
			     console.log('file size',s.size);
			     res.setHeader('Content-Range', '*/'+s.size);
			     console.log('req.headers.range',req.headers.range);
			     if(req.headers.range!==undefined){
				 var strtend = req.headers.range.split('=')[1].split('-');
				 var moo = {start:parseInt(strtend[0]), end:parseInt(strtend[1])};
				 console.log(moo);
			     }
			     fs.createReadStream(__dirname + req.url, moo).pipe(res);
			 }
			);
    }else{
	res.setHeader('Content-Type', 'text/html');
	fs.createReadStream(__dirname + '/index.html').pipe(res);
    }
}
			       
			      );


// Primus server.
var primus = new Primus(server, 
			{ transformer: 'sockjs', 
			  parser: 'JSON',
			  requestTimeout: 10000
			});
// add rooms to Primus
primus.use('rooms', rooms);

primus.on('connection', function(spark){
    spark.on('data', function(data){
	var room = data.room;
	var message = data.msg;
	if(message==='getClients'){
	    spark.write({room:room, clients: spark.room(room).clients()});
	    return;
	}
	if(message==='getMyID'){
	    spark.write({yourID : spark.id});
	    return;
	}
	var who = data.who;
	console.log('room',room,'msg', message, 'who',who,'rooms', spark.rooms());
	// check if spark is already in this room
	if ((spark.rooms().indexOf(room)!==undefined)&&(spark.rooms().indexOf(room)>0)) {
	    send();
	} else {
	    console.log('created room',room);
	    // join the room
	    spark.join(room, function(){
		if(message===undefined){
		    message = {room:room, msg:{joined:spark.id,clients:spark.room(room).clients()}};//TODO:roomleaveNote
		    console.log('message created',message);
		}
		send();
	    }
		      );
	}

	function send() {
	    if((who===undefined)||(who==='*')){
		spark.room(room).write(message);
	    } else if(who==='notme'){
		spark.room(room).except(spark.id).write(message);
	    } else { //write out to all in vector of id's sent in who.
		var notin = []
		var roomCli = spark.room(room).clients();
		console.log('roomCli',roomCli, 'who',who);
		for(ii in roomCli){
		    if(who.constructor.name==='String'){ //only one to send to
			if(who!==roomCli[ii]){
			    notin.push(roomCli[ii])
			}
		    } else {
			if(who.indexOf(roomCli[ii])<0){
			    notin.push(roomCli[ii])
			}
		    }
		}
		console.log('notin',notin);
		if(notin.length >0){
		    console.log('room',room,'clients',spark.room(room).clients(),'notin',notin, 'who',who, 'msg',message)
		    spark.room(room).except(notin).write(message);
		} else {
		    console.log('notin zero posting to all', message)
		    spark.room(room).write(message);
		}
	    }
	}
    }
	    );
}
	 )


// Start server listening
server.listen(process.env.PORT || 8080, function(){
    console.log('\033[96mlistening on localhost:8080 \033[39m');
}
	     );
