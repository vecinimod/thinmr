function cluster(address, callback){
    that = this;
    this.myId = '';
    this.clients = {};
    this.initialcall = true;
    this.rooms = {}
    this.configuration = {
	yourID:function(c, d){c.myId = d.yourID; if(c.initialcall){callback(c); c.initialcall=false};},
	getClients:function(c, d){c.clients[d.room] = d.clients},
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
	console.log('cluster',c.configuration,'data',data);
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
	this.servers[addr].cluster = this;
	this.servers[addr].on('data', function(da){
	    console.log('data received',da);
	    if(da.constructor.name === 'Object'){
		if(this.getConfiguredFunction(this, da)===undefined){
		    console.log('no handler configured for message',da);
		}else{
		    console.log('data',da)
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
  var clients = [];
  var options = {
  transformer: 'socksjs',
  parser: 'JSON',
  requestTimeout: 1000
  };
  var primus = new Primus.connect('ws://localhost:8080', options);
  primus.on('data', 
  function (data) {
  console.log('MSG:', data);
  //figure out how/use eval to send fn's and eval on data..on
  if(data.clients!==undefined){
  clients = data.clients
  }
  if(data.fnc!==undefined){
  fns[data.fnc](data.args)//eventually switch to using 'call'
  }
  }
  );
  var fns = {
  pass:function(ss){primus.write({room:'chat',who:'*',msg:ss+'passthru'})},
  recadd:function(x){
  var tmp=0;for(i=0;i<x;i++){tmp = tmp +1};
  primus.write({room:'chat',who:'*',msg:tmp})
  }
  }
  primus.write({ room: 'chat', who:'*',msg: 'getMyID' });
  primus.write({ room: 'chat', who: '*', msg: 'Hello some one' });
  primus.write({ room: 'chat', who:'*', msg: {fnc:'pass',args:'hi fn'} });
  primus.write({ room: 'chat', who:'*', msg: {fnc:'recadd',args:100} });

  //create lapply function
  function lapply(x, fn){
  var ll = [];
  if(x.constructor.name = 'Object'){
  ix = Object.keys(x)
  for(ii in ix){
  ll.push(fn(x[ix[ii]]))
  }
  } else {
  for(ii in x){
  ll.push(fn(x[ii]))
  }
  }
  console.log(ll);
  return ll;
  }
  //get list of workers!=this one
  setTimeout(function(){primus.write({room: 'chat', who:'*', msg: 'getClients'})}, 1000);

  /*function callRecAdd(x){
  return primus.write({ room: 'chat', who:x, msg: {fnc:'recadd',args:1e7} });
  }
  function roomForEach(room, fn){
  primus.writeAndWait({room:room},
  function(err, response) {
  lapply(response, fn)
  }
  );
  }

  roomForEach('chat', callRecAdd)
*/
/*
  function lapplyRoom(room, v, fn){
  var nv = v;
  //TODO: first create fn to get myid
  //then call next step make sure to exclude myid
  //otherwise when server avoids myspark, we lose
  //those maps
  primus.writeAndWait({room:room},
  function(err, response) {
  // Write the servers response to console
  console.log(response)
  godo(response)
  }
  )
  function godo(resp){
  //for(ii=0;ii<nv.length;ii++){
  while(nv.length>0){
  console.log('xi ', xi)
  for(jj in Object.keys(resp)){
  var xi = nv.pop()
  console.log('xi:',xi,'resp:'+resp[Object.keys(resp)[jj]])
  fn(resp[Object.keys(resp)[jj]], xi, room)
  }
  }
  }
  }
  function range(a, b){
  res = [];
  for(ii=a;ii<=b;ii++){
  res.push(ii);
  }
  return res;
  }
  function callRecAdd2(x, n, rm){
  return primus.write({ room: rm, who:x, msg: {fnc:'recadd',args:n} });
  }
  setTimeout(function(){lapplyRoom('chat',[1e6,1e6], callRecAdd2)}, 2000)
  rowCount = 0;
  errorCount = 0;
  firstError = '';
  stepped=0;
  rescsv = []
  function stepFn(results, parser)
  {
  stepped++;
  if (results)
  {
  if (results.data)
  //console.log(results.data)
  rowCount += results.data.length;
  rescsv.push(results.data);//TODO: push to socket, spark
  if (results.errors)
  {
  errorCount += results.errors.length;
  firstError = firstError || results.errors[0];
  }
  }
  }

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
