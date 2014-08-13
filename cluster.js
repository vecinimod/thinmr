function cluster(address, callback){
    that = this;
    this.myId = '';
    this.initialcall = true;
    this.rooms = {}
    this.configuration = {
	yourID:function(c, d){c.myId = d.yourID; if(c.initialcall){callback(c); c.initialcall=false};},
	room:function(c, d){if(c.rooms[d.room]===undefined){c.rooms[d.room] = {clients:d.msg.clients, joinHist:[d.msg.joined]}} else {c.rooms[d.room].clients = d.msg.clients;c.rooms[d.room].joinHist.push(d.msg.joined)}}
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

joindude = function(cl){console.log(cl);cl.joinRoom(name = 'dude')};
var clus1 = new cluster(addr = 'http://localhost:8080', callback = joindude);

/*
crowCount = 0;
cerrorCount = 0;
cfirstError = '';
cstepped=0;
crescsv = []
//to support the repeat of ordered list items, for sending out chunks evenly
repArr = function(arr, i){
    return arr[i % arr.length]
}
function cstepFn(resultz, parser)
{
    //console.log(results);
    cstepped++;
    if (resultz)
    {
	if (resultz.data)
	    //console.log(resultz.data)
	    crowCount += resultz.data.length;
	crescsv.push(resultz.data);//TODO: push to socket, spark
	if (resultz.errors)
	{
	    cerrorCount += resultz.errors.length;
	    cfirstError = cfirstError || resultz.errors[0];
	}
	if (resultz.constructor.name === 'String'){
	    crescsv.push(resultz);
	    //TODO: for each chunk, create, run function that sends out chunk to
	    //each worker
	    primus.write({ room: 'dt', who:'*', msg: {fnc:'recadd',args:n} })
	}
    }
}

papacfg = {
    delimiter: ",",
    header: false,
    dynamicTyping: false,
    preview: false,
    //	step: stepFn,
    encoding: "",
    worker: false,
    comments: false,
    complete: function(){console.log(rowCount, errorCount,firstError, stepped, rescsv)},
    download: true,
    keepEmptyRows: false,
    chunkSize: 2.5*1024*1024,
    doNotParse: true,
    chunk: cstepFn //this is misnomer? only fires on full file if step=undefined//update: I fixed it, this feature gimped by auth on purpose?, idk?
}
tmpcsv = Papa.parse('/tmp.csv', papacfg)
//TODO: methods for reading a remote file and breaking into n chunks by total/max chunk size and number of workers
*/
