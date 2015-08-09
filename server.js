#!/bin/env node
var express = require('express');
var app = express();
var http = require('http').createServer(app);
/*
http://app-lovingwebsockets.rhcloud.com/  <= your current HTTP URL
http://app-lovingwebsockets.rhcloud.com:8000/ <= WebSockets enables HTTP URL
https://app-lovingwebsockets.rhcloud.com/  <= your current HTTPs URL
https://app-lovingwebsockets.rhcloud.com:8443/ <= WebSockets enables HTTPs URL
*/
var port = process.env.OPENSHIFT_NODEJS_PORT || 8443;
var server_ip_add = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
//var server_ip_add = process.env.OPENSHIFT_NODEJS_IP || '192.168.1.18';
var io = require('socket.io')(http);
io.set('origins', '*:*');
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
    next();
});
app.get('/', function (req, res) {
    res.send('Hello world! I am listening on '+ server_ip_add+':'+port);
});
var sockets = {};
io.on('connection', function (socket) {
    var idUser = '';
    console.log(socket.id + ' is connected!');

    socket.emit('getId', {cmd: 'getId'});

    socket.on('getId', function (data) { // {id: '88237'}
        console.log('getId'+ data);
        sockets[data.id] = {user: data.user, socket: socket};
        idUser = data.id;

        var online = {};
        for(var i in sockets){
            online[i] = sockets[i].user;
        }
        console.log('User online: '+online);
        io.emit('online', {data: online});
    });

    socket.on('sendsms', function (data) { // {from: '1225', to: '88237', msg:'this is conten msg'}
        console.log(data);
        sockets[data.to].socket.emit('sendsms', data);
    });

    socket.on('typing', function(data){ // {from: '125', to: '8888', msg: true}
        console.log(' typing'+data);
        //sockets[data.to].socket.emit('isTyping', data);
    });

    socket.on('disconnect', function(){
        console.log(socket.id+' is disconnected!'+idUser);
        if(idUser in sockets){
            delete sockets[idUser];
        }

        var online = {};
        for(var i in sockets){
            online[i] = sockets[i].user;
        }
        console.log('User online: '+online);
        io.emit('online', {data: online});
    });


    // get result of send sms in client
    socket.on('result', function(data){
        console.log(data);
    });

    // get status deactive
    socket.on('deactive', function (data) {
        console.log(data +' has deactive!');
    })

    // get online status
});
http.listen(port, server_ip_add, function (){
    console.log('Server listening on '+server_ip_add+':'+port);
});

