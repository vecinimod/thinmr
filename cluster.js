function cluster(address, callback){
    that = this;
    this.myId = '';
    this.initialcall = true;
    this.rooms = {}
    this.configuration = {
	yourID:function(c, d){c.myId = d.yourID; if(c.initialcall){callback(c); c.initialcall=false};},
	room:function(c, d){if(c.rooms[d.room]===undefined){c.rooms[d.room] = {clients:d.msg.clients, joinHist:[d.msg.joined]}} else {c.rooms[d.room].clients = d.msg.clients;c.rooms[d.room].joinHist.push(d.msg.joined)}},
	store: function(c, d){if(c.data==undefined){c.data = {};};if(c.data[d.store.dest]==undefined){c.data[d.store.dest] = {}};if(d.store.data.constructor.name==='String'){c.data[d.store.dest][d.store.step] = Papa.parse(d.store.data,{dynamicTyping:true}).data;}else{c.data[d.store.dest][d.store.step] = d.store.data;}}
    };
    this.config = function(cfg){
	this.configuration = configuration;
	var oks = Object.keys(cfg);
	for(var ii in oks){
	    this.configuration[oks[ii]] = cfg[oks[ii]];
	}
    };
    this.getConfiguredFunction = function(c, data){
	return c.configuration[Object.keys(data)[0]];
    }
    this.servers = {};
    this.addServer = function(addr, opts){
	if(opts===undefined){
	    var opts = {
		transformer: 'socksjs',
		parser: 'JSON',
		requestTimeout: 1000
	    };
	}
	this.servers[addr] = new Primus.connect(addr, opts);
	//	this.servers[addr].cluster = this;
	this.servers[addr].on('data', function(da){
	    console.log('data received',da);
	    if(da.constructor.name === 'Object'){
		if(this.getConfiguredFunction(this, da)===undefined){
		    console.log('no handler configured for message',da);
		}else{
		    this.getConfiguredFunction(this, da)(this, da);
		}
	    }
	}, that)
	this.refreshMyId();
    }
    this.refreshMyId = function(addr){
	if(addr === undefined){
	    var addr = Object.keys(this.servers)[0]
	}
	this.servers[addr].write(
	    {msg:'getMyID'}
	)
    }
    this.addServer(address);
    this.joinRoom = function(name, addr){
	if(addr === undefined){
	    var addr = Object.keys(this.servers)[0]
	}
	var id = this.myId
	this.servers[addr].write({room: name, who:'*'})
    }
}
repArr = function(arr, i){
    return arr[i % arr.length]
}

//clus1.parse('/tmp.csv, 'dude', 'newda')
cluster.prototype.parse = function(source, clusRoom, dest, cfg){
    that = this
    console.log(that)
    if(cfg===undefined){
	var cfg = {
	    delimiter: ",",
	    header: false,
	    dynamicTyping: false,
	    preview: false,
	    //	step: stepFn,
	    encoding: "",
	    clusRoom: clusRoom,//{cluster:cluster,addr:addr,room:room}
	    worker: false,
	    comments: false,
	    complete: function(){console.log(rowCount, errorCount,firstError, stepped, rescsv)},
	    download: true,
	    keepEmptyRows: false,
	    chunkSize: 2.5*1024*1024,
	    doNotParse: true,
	    chunk: cstepFn //this is misnomer? only fires on full file if step=undefined//update: I fixed it, this feature gimped by auth on purpose?, idk?
	}
    }
    var crowCount = 0;
    var cerrorCount = 0;
    var cfirstError = '';
    var cstepped=0;
    var crescsv = []
    console.log(that.rooms)
    var whos = that.rooms[clusRoom.room].clients    
    console.log('whos',whos)
    //to support the repeat of ordered list items, for sending out chunks evenly
    function cstepFn(resultz, parser)
    {
	//console.log(results);
	if (resultz)
	{
	    cstepped++
	    whostep = repArr(whos, cstepped)
	    console.log('cstepped',cstepped,'whostep', whostep)
	    if (resultz.data)
	    {
		if(clusRoom!==undefined){

		    that.servers[addr].write(
			{room: clusRoom.room, who: whostep, msg:{store:{dest:dest, step:cstepped, data:resultz.data}}}
		    )
		} else {
		    //console.log(resultz.data)
		    crescsv.push(resultz.data);//TODO: push to socket, spark
		}
		crowCount += resultz.data.length;
	    }
	    if (resultz.errors)
	    {
		cerrorCount += resultz.errors.length;
		cfirstError = cfirstError || resultz.errors[0];
	    }
	    if (resultz.constructor.name === 'String'){
		if(clusRoom!==undefined){
		    that.servers[addr].write(
			{room: clusRoom.room, who: whostep, msg:{store:{dest:dest, step:cstepped, data:resultz}}}
		    )
		} else 
		{
		    crescsv.push(resultz);
		}
		//TODO: for each chunk, create, run function that sends out chunk to
		//each worker
		//primus.write({ room: 'dt', who:'*', msg: {fnc:'recadd',args:n} })
	    }
	}
    }
    this.parser =  Papa.parse(source, cfg)
    
}

joindude = function(cl){
    console.log(cl);
    cl.joinRoom(name = 'dude')
};
var clus1 = new cluster(addr = 'http://localhost:8080', callback = joindude);
pull = function(file){clus1.parse(file, {addr:'http://localhost:8080',room:'dude'}, 'dd')}
