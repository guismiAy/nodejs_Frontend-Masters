#!/usr/bin/env node

"use strict"

var util = require("util");
var path = require("path");
var http = require("http");
var express = require("express");
var sqlite3 = require("sqlite3");
var staticAlias = require("node-static-alias");

/***************************************** */
const DB_PATH = path.join(__dirname, "my.db");
const WEB_PATH  = path.join(__dirname, "public");
const HTTP_PORT = 8090;

var delay = util.promisify(setTimeout);

var myDB = new sqlite3.Database(DB_PATH);
var SQL3 = {
    run (...args){
        return new Promise(function c(resolve, reject){
            myDB.run(...args, function onResult(err){
                if (err) reject(err);
                else resolve(this);
            });
        });
    },
    get: util.promisify(myDB.get.bind(myDB)),
    all: util.promisify(myDB.all.bind(myDB)),
    exec: util.promisify(myDB.exec.bind(myDB)),
};

var fileServer = new staticAlias.Server(WEB_PATH,{
    cache: 100,
    serverInfo: "Node workshop ex05",
    alias: [
        {
			match: /^\/(?:index\/?)?(?:[?#].*$)?$/,
			serve: "index.html",
			force: true,
		},
		{
			match: /^\/js\/.+$/,
			serve: "<% absPath %>",
			force: true,
		},
		{
			match: /^\/(?:[\w\d]+)(?:[\/?#].*$)?$/,
			serve: function onMatch(params) {
				return `${params.basename}.html`;
			},
		},
		{
			match: /[^]/,
			serve: "404.html",
		},
    ],
});

var httpserv  = http.createServer(handleRequest);

main();

function main(){
    httpserv.listen(HTTP_PORT);
    console.log(`Listeen on httpss://localhost: ${HTTP_PORT}`);
}

async function handleRequest(req, res){
    if (req.url == "/get-users"){
        delay(1000);
        let users = await getAllRecords();

        res.writeHead(200, {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache"
        });
        res.end(JSON.stringify(users));
    }else{
        fileServer.serve(req, res);
    }
}

async function getAllRecords(){
    var result = await SQL3.all(
        `SELECT
            Other.data AS 'other',
            Something.data AS something
        FROM
            Something JOIN Other
            ON (
                Something.otherID = Other.id
            )
        ORDER BY
            Other.id DESC,
            Something.data ASC`
    );
    if (result && result.length > 0){
        return result;
    }
}