var tough = require('tough-cookie');
var request = require('request');
var q = require('q');
var cheerio = require('cheerio');

//Cookie jar
var j;

//Request Configs
var ua =  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36';

var sat = '';
var lastsynckey = '';
var alarmState = '';
var deviceUpdateCB = function () {};
var zoneUpdateCB = function () {};
var statusUpdateCB = function () {};

pulse = function(username, password) {

	this.authenticated = false;
	this.isAuthenticating = false;
	this.clients = [];

	this.configure({
		username: username,
		password: password
	});

	/* heartbeat */
	var pulseInterval = setInterval(this.sync.bind(this),5000);
};

module.exports = pulse;

(function() {

	this.config = {
		initialurl: 'https://portal.adtpulse.com/myhome/access/signin.jsp',
		authUrl: 'https://portal.adtpulse.com/myhome/access/signin.jsp?e=n&e=n&&partner=adt',
		sensorUrl: 'https://portal.adtpulse.com/myhome/ajax/homeViewDevAjax.jsp',
		orbUrl: 'https://portal.adtpulse.com/myhome/ajax/orb.jsp',
		statusChangeUrl: 'https://portal.adtpulse.com/myhome/quickcontrol/serv/ChangeVariableServ',
		otherStatusUrl: 'https://portal.adtpulse.com/myhome/ajax/currentStates.jsp',
		syncUrl: 'https://portal.adtpulse.com/myhome/Ajax/SyncCheckServ',
		logoutUrl: 'https://portal.adtpulse.com/myhome/access/signout.jsp'
	};

	this.configure = function(options) {
		for(o in options){
			this.config[o] = options[o];
		}
	};

	this.login = function () {

		var deferred = q.defer();
		var that = this;

		if(this.authenticated){
			deferred.resolve()
		} else {
			console.log('Pulse: Authenticating');

			j = request.jar();

			that.isAuthenticating = true;
			request(
				{
					url: this.config.initialurl,
					jar: j,
					headers: {
						'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
						'User-Agent': ua
					},
				},
				function() {
					request.post(that.config.authUrl,
						{
							followAllRedirects: true,
							jar: j,
							headers: {
								'Host': 'portal.adtpulse.com',
								'User-Agent': ua
							},
							form:{
								username: that.config.username,
								password: that.config.password
							}
						},
						function(err, httpResponse, body){
							that.isAuthenticating = false;
							if(err || httpResponse.req.path !== '/myhome/9.7.0-31/summary/summary.jsp'){
								that.authenticated = false;
								console.log('Pulse: Authentication Failed'+err);
								deferred.reject()
							} else {
								that.authenticated = true;
								console.log('Pulse: Authentication Success');
								deferred.resolve();
								//	that.updateAll.call(that);
							}
						}
					);
				}
			);
		}



		return deferred.promise
	},

	this.logout = function () {

		var that = this;

		request(
			{
				url: this.config.logoutUrl,
				jar: j,
				headers: {
					'User-Agent': ua
				}
			},
			function () {
				that.authenticated = false;
			}
		)
	},

	this.updateAll = function () {
		var that = this;
		this.getAlarmStatus();
	}


	this.onStatusUpdate = function (updateCallback) {
		statusUpdateCB = updateCallback;
	},

	this.getAlarmStatus = function () {
		console.log('Pulse: Getting Alarm Statuses');
		var deferred = q.defer();

		request(
			{
				url: this.config.orbUrl,
				jar: j,
				headers: {
					'User-Agent': ua
				},
			},
			function(err, httpResponse, body) {
				if(err){
					deferred.reject();
				} else {
					$ = cheerio.load(body);
					alarmState
					var newState = $('#divOrbTextSummary span').text();
					if(alarmState != newState){
						statusUpdateCB(newState);
					}
					alarmState = newState;
					deferred.resolve(newState);
				}

			}
		);

		return deferred.promise;
	},


	this.setAlarmStateStay = function (){this.setAlarmState('disarmed','stay');},

	this.setAlarmStateAway = function (){this.setAlarmState('disarmed','away');},

	this.setAlarmStateOff = function (){this.setAlarmState('away','off');},

	this.setAlarmState = function (armstate, arm) {

		var deferred = q.defer();

		// url: "https://portal.adtpulse.com/myhome/9.7.0-31/quickcontrol/armDisarmRRA.jsp?href=rest/adt/ui/client/security/setArmState&armstate=disarmed&arm=stay",
		// url: "https://portal.adtpulse.com/myhome/9.7.0-31/quickcontrol/armDisarmRRA.jsp?href=rest/adt/ui/client/security/setArmState&armstate=disarmed&arm=away",
		//url: "https://portal.adtpulse.com/myhome/9.7.0-31/quickcontrol/armDisarmRRA.jsp?href=rest/adt/ui/client/security/setArmState&armstate=away&arm=off",


		var url = "https://portal.adtpulse.com/myhome/9.7.0-31/quickcontrol/armDisarmRRA.jsp?href=rest/adt/ui/client/security/setArmState&armstate="+armstate+"&arm="+arm;

		request(
			{
				url: url,
				jar: j,
				headers: {
					'User-Agent': ua,
					'Referer': 'https://portal.adtpulse.com/myhome/summary/summary.jsp'
				},
			},
			function(err, httpResponse, body) {
				if(err){
					onsole.log('Pulse setAlarmState Failed');
					deferred.reject();
				} else {
					console.log('Pulse setAlarmState Success');
					deferred.resolve();
				}

			}
		);

		return deferred.promise;

	}

	this.pulse = function(uid) {
		if(this.clients.indexOf(uid) >= 0){
			console.log('Pulse: Client Lost', uid);
			this.clients.splice(this.clients.indexOf(uid),1)
		} else {
			console.log('Pulse: New Client', uid);
			this.clients.push(uid);
			this.sync();
		}

	}

	this.sync = function () {
		if(this.clients.length && !this.isAuthenticating){
			var that = this;
			this.login().then(function(){
				var url = that.config.syncUrl+"?t="+Date.now();
				request({
					url: url,
					jar: j,
					followAllRedirects: true,
					headers: {
						'User-Agent': ua,
						'Referer': 'https://portal.adtpulse.com/myhome/summary/summary.jsp'
					},
				},function(err, response, body){
					console.log('Pulse: Syncing', body, lastsynckey);
					if(err || !body || body.indexOf("<html") > -1){
						that.authenticated = false;
						console.log('Pulse: Sync Failed');
					} else if (lastsynckey != body || "1-0-0" == body) {
					 	lastsynckey = body;
					 	that.updateAll.call(that);
					 }
				})
			})

		} else {

		}

	}
}).call(pulse.prototype);
