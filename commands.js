/**
 * This is the file where the bot commands are located
 *
 * @license MIT license
 */

var http = require('http');
var sys = require('sys');

var RP = {
	state: false,
	plot: '',
	called: false,
	setAt: []
}
var Host = {
	state: false,
	nick: '',
	called: false
}

var mainRP = Object.create(RP);
var mainHost = Object.create(Host);
var amphyRP = Object.create(RP);
var amphyHost = Object.create(Host);
var roomRP, roomHost;


function getRP(room) {
	if (room === 'roleplaying') return mainRP;
	if (room === 'amphyrp') return amphyRP;
}
function getHost(room) {
	if (room === 'roleplaying') return mainHost;
	if (room === 'amphyrp') return amphyHost;
}

exports.commands = {
	// Roleplaying commands
	newrp: 'setrp',
	setrp: function(arg, by, room, con) {
		if (!this.hasRank(by, '+%@#~')) return false;
		roomRP = getRP(room);
		if (!arg) return this.say(con, room, 'Please enter an RP.');
		var username = by.slice(1);
		roomRP.plot = arg;
		roomRP.state = true;
		var setAt = new Date();
		roomRP.setAt = [setAt.getHours(), setAt.getMinutes(), setAt.getSeconds()];
		this.say(con, room, 'The RP was set to ' + arg + '.');
	},
	newhost: 'sethost',
	sethost: function(arg, by, room, con) {
		if (!this.hasRank(by, '+%@#~')) return false;
		roomHost = getHost(room);
		if (!roomRP.state || !roomRP) return this.say(con, room, 'There is no RP, so there is no host.');
		if (!arg) return this.say(con, room, 'Please enter a host.');
		roomHost.state = true;
		roomHost.nick = arg;
		this.say(con, room, 'The host was set to ' + arg + '.');
	},
	removehost: 'rmhost',
	rmhost: function(arg, by, room, con) {
		if (!this.hasRank(by, '+%@#~')) return false;
		roomHost = getHost(room);
		if (!roomHost.state || !roomRP) return this.say(con, room, 'There is no host to remove.');
		roomHost.state = false;
		roomHost.nick = '';
		this.say(con, room, 'The host has been removed.');
	},
	endrp: function(arg, by, room, con) {
		if (!this.hasRank(by, '+%@#~')) return false;
		roomRP = getRP(room);
		roomHost = getHost(room);
		if (!roomRP.state) return this.say(con, room, 'There is no RP to end.');
		roomRP.state = false;
		roomRP.plot = '';
		roomRP.setBy = '';
		roomHost.state = false;
		roomHost.nick = '';
		this.say(con, room, '/wall The RP has ended.');
	},
	rp: function(arg, by, room, con) {
		roomRP = getRP(room);
		if (!roomRP || !roomRP.plot) return this.say (con, room, 'There is no ongoing RP.');
		if (roomRP.called) {
			var text = '/pm ' + by + ', ';
		} else {
			var text = '';
		}
		var start = roomRP.setAt;
		var now = new Date();
		var current = [now.getHours(), now.getMinutes(), now.getSeconds()];
		current[2] = ((current[2] - start[2]) < 0) ? ((current[2] - start[2] + 60) && (--current[1])) : (current[2] - start[2]);
		current[1] = ((current[1] - start[1]) < 0) ? ((current[1] - start[1] + 60) && (--current[0])) : (current[1] - start[1]);
		current[0] = ((current[0] - start[0]) < 0) ? (current[0] - start[0] + 24) : (current[0] - start[0]);
		var progress = current[0] + ':' + ((current[1] < 10) ? ('0' + current[1]) : current[1]) + ':' + ((current[2] < 10) ? ('0' + current[2]) : current[2]);
		if (roomRP.state) this.say(con, room, text + 'The RP is ' + roomRP.plot + ', in progress for ' + progress + '.');
		roomRP.called = true;
		setTimeout(function() { roomRP.called = false }, 60 * 1000);
	},
	host: function(arg, by, room, con) {
		roomHost = getHost(room);
		if (!roomHost || !roomHost.nick) return this.say(con, room, 'There is no host.');
		if (roomHost.called) {
			var text = '/pm ' + by + ', ';
		} else {
			var text = '';
		}
		if (roomHost.state) this.say(con, room, text + 'The host is ' + roomHost.nick + '.');
		roomHost.called = true;
		setTimeout(function() { roomHost.called = false }, 60 * 1000);
	},
	rpplug: 'plug',
	plug: function(arg, by, room, con) {
		if (room !== 'roleplaying' && room !== 'amphyrp') return;
		if (this.hasRank(by, '+%@#~') || room.charAt(0) === ',') {
			var text = '';
		} else {
			var text = '/pm ' + by + ', ';
		}
		this.say(con, room, text + 'Come join our plug.dj! http://plug.dj/a8f892a9/');
	},
	vc: function (arg, by, room, con) {
		if (room !== 'roleplaying' && room !== 'amphyrp') return;
		if (this.hasRank(by, '+%@#~') || room.charAt(0) === ',') {
			var text = '';
		} else {
			var text = '/pm ' + by + ', ';
		}
		if (by === '@Morfent' && room === 'amphyrp') return this.say(con, room, 'Special AmphyRP voice challenge: PM a mod any day but Wednesday and Saturday. Good luck!');
		this.say(con, room, text + '/wall We\'re holding a contest for best user-made RP! The prize is room voice, and the deadline\'s May 20th. Info: tinyurl.com/RPVoiceChallenge');
	},
	ampclear: function (arg, by, room, con) {
		if (!this.hasRank(by, '@#~') || room.charAt(0) === ',') return false;
		if (room !== 'amphyrp') return this.say(con, room, 'This command is not meant to be used outside of AmphyRP.');
		if (amphyRP.state) return this.say(con, room, 'Please wait until the RP is over before clearing the voice list.');
		var voices = this.amphyVoices;
		var self = this;
		while (voices.length > 0) {
			for (var i in voices) {
				self.say(con, room, '/roomdevoice ' + voices[i])
			var voice = voices.splice(i, 1);
			}
		}
		this.amphyVoices = [];
	},
	voice: function (arg, by, room, con) {
		if (room.charAt(0) !== ',') return false;
		if (!amphyRP.state) return this.say(con, room, '.voice can only be used while an RP is in progress.');
		this.say(con, 'amphyrp', '/roomvoice ' + by);
	},

	/**
	 * Help commands
	 *
	 * These commands are here to provide information about the bot.
	 */

	about: function(arg, by, room, con) {
		if (this.hasRank(by, '#~') || room.charAt(0) === ',') {
			var text = '';
		} else {
			var text = '/pm ' + by + ', ';
		}
		text += '**Pokémon Showdown Bot** by: Quinella and TalkTakesTime';
		this.say(con, room, text);
	},
	help: 'guide',
	guide: function(arg, by, room, con) {
		if (this.hasRank(by, '#~') || room.charAt(0) === ',') {
			var text = '';
		} else {
			var text = '/pm ' + by + ', ';
		}
		if (config.botguide) {
			text += 'A guide on how to use this bot can be found here: ' + config.botguide;
		} else {
			text += 'There is no guide for this bot. PM the owner with any questions.';
		}
		this.say(con, room, text);
	},

	/**
	 * Dev commands
	 *
	 * These commands are here for highly ranked users (or the creator) to use
	 * to perform arbitrary actions that can't be done through any other commands
	 * or to help with upkeep of the bot.
	 */

	reload: function(arg, by, room, con) {
		if (!this.hasRank(by, '#~')) return false;
		try {
			this.uncacheTree('./commands.js');
			Commands = require('./commands.js').commands;
			this.say(con, room, 'Commands reloaded.');
		} catch (e) {
			error('failed to reload: ' + sys.inspect(e));
		}
	},
	custom: function(arg, by, room, con) {
		if (!this.hasRank(by, '~')) return false;
		// Custom commands can be executed in an arbitrary room using the syntax
		// ".custom [room] command", e.g., to do !data pikachu in the room lobby,
		// the command would be ".custom [lobby] !data pikachu". However, using
		// "[" and "]" in the custom command to be executed can mess this up, so
		// be careful with them.
		if (arg.indexOf('[') === 0 && arg.indexOf(']') > -1) {
			var tarRoom = arg.slice(1, arg.indexOf(']'));
			arg = arg.substr(arg.indexOf(']') + 1).trim();
		}
		this.say(con, tarRoom || room, arg);
	},
	js: function(arg, by, room, con) {
		if (config.excepts.indexOf(toId(by)) === -1) return false;
		try {
			var result = eval(arg.trim());
			this.say(con, room, JSON.stringify(result));
		} catch (e) {
			this.say(con, room, e.name + ": " + e.message);
		}
	},

	/**
	 * Room Owner commands
	 *
	 * These commands allow room owners to personalise settings for moderation and command use.
	 */

	settings: 'set',
	set: function(arg, by, room, con) {
		if (!this.hasRank(by, '%@&#~') || room.charAt(0) === ',') return false;

		var settable = {
			say: 1,
			joke: 1,
			choose: 1,
			usagestats: 1,
			buzz: 1,
			helix: 1,
			survivor: 1,
			games: 1,
			wifi: 1,
			monotype: 1,
			autoban: 1,
			happy: 1,
			guia: 1
		};
		var modOpts = {
			flooding: 1,
			caps: 1,
			stretching: 1,
			bannedwords: 1,
			snen: 1
		};

		var opts = arg.split(',');
		var cmd = toId(opts[0]);
		if (cmd === 'mod' || cmd === 'm' || cmd === 'modding') {
			if (!opts[1] || !toId(opts[1]) || !(toId(opts[1]) in modOpts)) return this.say(con, room, 'Incorrect command: correct syntax is .set mod, [' +
				Object.keys(modOpts).join('/') + '](, [on/off])');

			if (!this.settings['modding']) this.settings['modding'] = {};
			if (!this.settings['modding'][room]) this.settings['modding'][room] = {};
			if (opts[2] && toId(opts[2])) {
				if (!this.hasRank(by, '#~')) return false;
				if (!(toId(opts[2]) in {on: 1, off: 1}))  return this.say(con, room, 'Incorrect command: correct syntax is .set mod, [' +
					Object.keys(modOpts).join('/') + '](, [on/off])');
				if (toId(opts[2]) === 'off') {
					this.settings['modding'][room][toId(opts[1])] = 0;
				} else {
					delete this.settings['modding'][room][toId(opts[1])];
				}
				this.writeSettings();
				this.say(con, room, 'Moderation for ' + toId(opts[1]) + ' in this room is now ' + toId(opts[2]).toUpperCase() + '.');
				return;
			} else {
				this.say(con, room, 'Moderation for ' + toId(opts[1]) + ' in this room is currently ' +
					(this.settings['modding'][room][toId(opts[1])] === 0 ? 'OFF' : 'ON') + '.');
				return;
			}
		} else {
			if (!Commands[cmd]) return this.say(con, room, '.' + opts[0] + ' is not a valid command.');
			var failsafe = 0;
			while (!(cmd in settable)) {
				if (typeof Commands[cmd] === 'string') {
					cmd = Commands[cmd];
				} else if (typeof Commands[cmd] === 'function') {
					if (cmd in settable) {
						break;
					} else {
						this.say(con, room, 'The settings for .' + opts[0] + ' cannot be changed.');
						return;
					}
				} else {
					this.say(con, room, 'Something went wrong. PM TalkTakesTime here or on Smogon with the command you tried.');
					return;
				}
				failsafe++;
				if (failsafe > 5) {
					this.say(con, room, 'The command ".' + opts[0] + '" could not be found.');
					return;
				}
			}

			var settingsLevels = {
				off: false,
				disable: false,
				'+': '+',
				'%': '%',
				'@': '@',
				'&': '&',
				'#': '#',
				'~': '~',
				on: true,
				enable: true
			};
			if (!opts[1] || !opts[1].trim()) {
				var msg = '';
				if (!this.settings[cmd] || (!this.settings[cmd][room] && this.settings[cmd][room] !== false)) {
					msg = '.' + cmd + ' is available for users of rank ' + (cmd === 'autoban' ? '#' : config.defaultrank) + ' and above.';
				} else if (this.settings[cmd][room] in settingsLevels) {
					msg = '.' + cmd + ' is available for users of rank ' + this.settings[cmd][room] + ' and above.';
				} else if (this.settings[cmd][room] === true) {
					msg = '.' + cmd + ' is available for all users in this room.';
				} else if (this.settings[cmd][room] === false) {
					msg = '.' + cmd + ' is not available for use in this room.';
				}
				this.say(con, room, msg);
				return;
			} else {
				if (!this.hasRank(by, '#~')) return false;
				var newRank = opts[1].trim();
				if (!(newRank in settingsLevels)) return this.say(con, room, 'Unknown option: "' + newRank + '". Valid settings are: off/disable, +, %, @, &, #, ~, on/enable.');
				if (!this.settings[cmd]) this.settings[cmd] = {};
				this.settings[cmd][room] = settingsLevels[newRank];
				this.writeSettings();
				this.say(con, room, 'The command .' + cmd + ' is now ' +
					(settingsLevels[newRank] === newRank ? ' available for users of rank ' + newRank + ' and above.' :
					(this.settings[cmd][room] ? 'available for all users in this room.' : 'unavailable for use in this room.')))
			}
		}
	},
	blacklist: 'autoban',
	ban: 'autoban',
	ab: 'autoban',
	autoban: function(arg, by, room, con) {
		if (!this.canUse('autoban', room, by) || room.charAt(0) === ',') return false;
		if (!this.hasRank(this.ranks[toId(room)] || ' ', '@&#~')) return this.say(con, room, config.nick + ' requires rank of @ or higher to (un)blacklist.');

		arg = arg.split(',');
		var added = [];
		var illegalNick = [];
		var alreadyAdded = [];
		if (!arg.length || (arg.length === 1 && !arg[0].trim().length)) return this.say(con, room, 'You must specify at least one user to blacklist.');
		for (var i = 0; i < arg.length; i++) {
			var tarUser = toId(arg[i]);
			if (tarUser.length < 1 || tarUser.length > 18) {
				illegalNick.push(tarUser);
				continue;
			}
			if (!this.blacklistUser(tarUser, room)) {
				alreadyAdded.push(tarUser);
				continue;
			}
			this.say(con, room, '/roomban ' + tarUser + ', Blacklisted user');
			added.push(tarUser);
		}

		var text = '';
		if (added.length) {
			text += 'User(s) "' + added.join('", "') + '" added to blacklist successfully. ';
			this.writeSettings();
		}
		if (alreadyAdded.length) text += 'User(s) "' + alreadyAdded.join('", "') + '" already present in blacklist. ';
		if (illegalNick.length) text += 'All ' + (text.length ? 'other ' : '') + 'users had illegal nicks and were not blacklisted.';
		this.say(con, room, text);
	},
	unblacklist: 'unautoban',
	unban: 'unautoban',
	unab: 'unautoban',
	unautoban: function(arg, by, room, con) {
		if (!this.canUse('autoban', room, by) || room.charAt(0) === ',') return false;
		if (!this.hasRank(this.ranks[toId(room)] || ' ', '@&#~')) return this.say(con, room, config.nick + ' requires rank of @ or higher to (un)blacklist.');

		arg = arg.split(',');
		var removed = [];
		var notRemoved = [];
		if (!arg.length || (arg.length === 1 && !arg[0].trim().length)) return this.say(con, room, 'You must specify at least one user to unblacklist.');
		for (var i = 0; i < arg.length; i++) {
			var tarUser = toId(arg[i]);
			if (tarUser.length < 1 || tarUser.length > 18) {
				notRemoved.push(tarUser);
				continue;
			}
			if (!this.unblacklistUser(tarUser, room)) {
				notRemoved.push(tarUser);
				continue;
			}
			this.say(con, room, '/roomunban ' + tarUser);
			removed.push(tarUser);
		}

		var text = '';
		if (removed.length) {
			text += 'User(s) "' + removed.join('", "') + '" removed from blacklist successfully. ';
			this.writeSettings();
		}
		if (notRemoved.length) text += (text.length ? 'No other ' : 'No ') + 'specified users were present in the blacklist.';
		this.say(con, room, text);
	},
	viewbans: 'viewblacklist',
	vab: 'viewblacklist',
	viewautobans: 'viewblacklist',
	viewblacklist: function(arg, by, room, con) {
		if (!this.canUse('bl', room, by) || room.charAt(0) === ',') return false;

		// use .js Object.keys(this.settings.blacklist.roleplaying).slice(number of blacklisted users) and save to settings.js manually in between restarts
		var text = '';
		if (!this.settings.blacklist || !this.settings.blacklist[room]) {
			text = 'No users are blacklisted in this room.';
		} else {
			var nickList = Object.keys(this.settings.blacklist[room]);
			text = 'The following users are blacklisted: ' + nickList.join(', ');
			if (text.length > 300) text = 'Too many users to list. Number of users since last restart: ' + this.settings.oldab + ', number of users added: ' + (nickList.length - this.settings.oldab);
			if (!nickList.length) text = 'No users are blacklisted in this room.';
		}
		this.say(con, room, '/pm ' + by + ', ' + text);
	},
	banword: function(arg, by, room, con) {
		if (!this.hasRank(by, '~')) return false;

		if (!this.settings['bannedwords']) this.settings['bannedwords'] = {};
		this.settings['bannedwords'][arg.trim().toLowerCase()] = 1;
		this.writeSettings();
		this.say(con, room, 'Word "' + arg.trim().toLowerCase() + '" banned.');
	},
	unbanword: function(arg, by, room, con) {
		if (!this.hasRank(by, '~')) return false;

		if (!this.settings['bannedwords']) this.settings['bannedwords'] = {};
		delete this.settings['bannedwords'][arg.trim().toLowerCase()];
		this.writeSettings();
		this.say(con, room, 'Word "' + arg.trim().toLowerCase() + '" unbanned.');
	},

	/**
	 * General commands
	 *
	 * Add custom commands here.
	 */

	tell: 'say',
	say: function(arg, by, room, con) {
		if (!this.canUse('say', room, by)) return false;
		this.say(con, room, stripCommands(arg) + ' (' + by + ' said this)');
	},
	joke: function(arg, by, room, con) {
		if (!this.canUse('joke', room, by)) return false;
		var self = this;

		var reqOpt = {
			hostname: 'api.icndb.com',
			path: '/jokes/random',
			method: 'GET'
		};
		var req = http.request(reqOpt, function(res) {
			res.on('data', function(chunk) {
				try {
					var data = JSON.parse(chunk);
					self.say(con, room, data.value.joke);
				} catch (e) {
					self.say(con, room, 'Sorry, couldn\'t fetch a random joke... :(');
				}
			});
		});
		req.end();
	},
	choose: function(arg, by, room, con) {
		if (arg.indexOf(',') === -1) {
			var choices = arg.split(' ');
		} else {
			var choices = arg.split(',');
		}
		choices = choices.filter(function(i) {return (toId(i) !== '')});
		if (choices.length < 2) return this.say(con, room, (room.charAt(0) === ',' ? '': '/pm ' + by + ', ') + '.choose: You must give at least 2 valid choices.');
		var choice = choices[Math.floor(Math.random()*choices.length)];
		this.say(con, room, ((this.canUse('choose', room, by) || room.charAt(0) === ',') ? '':'/pm ' + by + ', ') + stripCommands(choice));
	},
	usage: 'usagestats',
	usagestats: function(arg, by, room, con) {
		if (this.canUse('usagestats', room, by) || room.charAt(0) === ',') {
			var text = '';
		} else {
			var text = '/pm ' + by + ', ';
		}
		text += 'http://sim.smogon.com:8080/Stats/2014-04/';
		this.say(con, room, text);
	},
	seen: function(arg, by, room, con) {
		var text = (room.charAt(0) === ',' ? '' : '/pm ' + by + ', ');
		if (toId(arg) === toId(by)) {
			text += 'Have you looked in the mirror lately?';
		} else if (toId(arg) === toId(config.nick)) {
			text += 'You might be either blind or illiterate. Might want to get that checked out.';
		} else if (!this.chatData[toId(arg)] || !this.chatData[toId(arg)].lastSeen) {
			text += 'The user ' + arg.trim() + ' has never been seen.';
		} else {
			text += arg.trim() + ' was last seen ' + this.getTimeAgo(this.chatData[toId(arg)].seenAt) + ' ago, ' + this.chatData[toId(arg)].lastSeen;
		}
		this.say(con, room, text);
	},
	helix: function(arg, by, room, con) {
		if (this.canUse('helix', room, by) || room.charAt(0) === ',') {
			var text = '';
		} else {
			var text = '/pm ' + by + ', ';
		}

		var rand = Math.floor(20 * Math.random()) + 1;

		switch (rand) {
	 		case 1: text += "Signs point to yes."; break;
	  		case 2: text += "Yes."; break;
			case 3: text += "Reply hazy, try again."; break;
			case 4: text += "Without a doubt."; break;
			case 5: text += "My sources say no."; break;
			case 6: text += "As I see it, yes."; break;
			case 7: text += "You may rely on it."; break;
			case 8: text += "Concentrate and ask again."; break;
			case 9: text += "Outlook not so good."; break;
			case 10: text += "It is decidedly so."; break;
			case 11: text += "Better not tell you now."; break;
			case 12: text += "Very doubtful."; break;
			case 13: text += "Yes - definitely."; break;
			case 14: text += "It is certain."; break;
			case 15: text += "Cannot predict now."; break;
			case 16: text += "Most likely."; break;
			case 17: text += "Ask again later."; break;
			case 18: text += "My reply is no."; break;
			case 19: text += "Outlook good."; break;
			case 20: text += "Don't count on it."; break;
		}
		this.say(con, room, text);
	},

	/**
	 * Room specific commands
	 *
	 * These commands are used in specific rooms on the Smogon server.
	 */
	guia: function(arg, by, room, con) {
		// this command is a guide for the Spanish room
		if (!(toId(room) === 'espaol' && config.serverid === 'showdown')) return false;
		var text = '';
		if (!this.canUse('guia', room, by)) {
			text += '/pm ' + by + ', ';
		}
		text += 'Si sos nuevo en el sitio, revisa nuestra **Guía Introductoria** (http://goo.gl/Db1wPf) compilada por ``1 + Tan²x = Sec²x``!';
		this.say(con, room, text);
	},
	wifi: function(arg, by, room, con) {
		// links to the 
		if (!(toId(room) === 'wifi' && config.serverid === 'showdown')) return false;
		var text = '';
		if (!this.canUse('wifi', room, by)) {
			text += '/pm ' + by + ', ';
		}
		var messages = {
			rules: 'The rules for the Wi-Fi room can be found here: http://pstradingroom.weebly.com/rules.html',
			faq: 'Wi-Fi room FAQs: http://pstradingroom.weebly.com/faqs.html',
			faqs: 'Wi-Fi room FAQs: http://pstradingroom.weebly.com/faqs.html',
			scammers: 'List of known scammers: http://tinyurl.com/psscammers',
			cloners: 'List of approved cloners: http://goo.gl/WO8Mf4',
			tips: 'Scamming prevention tips: http://pstradingroom.weebly.com/scamming-prevention-tips.html',
			breeders: 'List of breeders: http://tinyurl.com/WiFIBReedingBrigade',
			signup: 'Breeders Sign Up: http://tinyurl.com/GetBreeding',
			bans: 'Ban appeals: http://pstradingroom.weebly.com/ban-appeals.html',
			banappeals: 'Ban appeals: http://pstradingroom.weebly.com/ban-appeals.html',
			lists: 'Major and minor list compilation: http://tinyurl.com/WifiSheets'
		};
		text += (toId(arg) ? (messages[toId(arg)] || 'Unknown option. General links can be found here: http://pstradingroom.weebly.com/links.html') : 'Links can be found here: http://pstradingroom.weebly.com/links.html');
		this.say(con, room, text);
	},
	mono: 'monotype',
	monotype: function(arg, by, room, con) {
		// links and info for the monotype room
		if (!(toId(room) === 'monotype' && config.serverid === 'showdown')) return false;
		var text = '';
		if (!this.canUse('monotype', room, by)) {
			text += '/pm ' + by + ', ';
		}
		var messages = {
			forums: 'The monotype room\'s forums can be found here: http://psmonotypeforum.createaforum.com/index.php',
			plug: 'The monotype room\'s plug can be found here: http://plug.dj/monotype-3-am-club/',
			rules: 'The monotype room\'s rules can be found here: http://psmonotype.wix.com/psmono#!rules/cnnz',
			site: 'The monotype room\'s site can be found here: http://www.psmonotype.wix.com/psmono',
			league: 'Information on the Monotype League can be found here: http://themonotypeleague.weebly.com/'
		};
		text += (toId(arg) ? (messages[toId(arg)] || 'Unknown option. General information can be found here: http://www.psmonotype.wix.com/psmono') : 'Welcome to the monotype room! Please visit our site to find more information. The site can be found here: http://www.psmonotype.wix.com/psmono');
		this.say(con, room, text);
	},
	survivor: function(arg, by, room, con) {
		// contains links and info for survivor in the Survivor room
		if (!(toId(room) === 'survivor' && config.serverid === 'showdown')) return false;
		var text = '';
		if (!this.canUse('survivor', room, by)) {
			text += '/pm ' + by + ', ';
		}
		var gameTypes = {
			hg: "http://survivor-ps.weebly.com/hunger-games.html",
			hungergames: "http://survivor-ps.weebly.com/hunger-games.html",
			classic: "http://survivor-ps.weebly.com/classic.html"
		};
		arg = toId(arg);
		if (arg) {
			if (!(arg in gameTypes)) return this.say(con, room, "Invalid game type. The game types can be found here: http://survivor-ps.weebly.com/themes.html");
			text += "The rules for this game type can be found here: " + gameTypes[arg];
		} else {
			text += "The list of game types can be found here: http://survivor-ps.weebly.com/themes.html";
		}
		this.say(con, room, text);
	},
	games: function(arg, by, room, con) {
		// lists the games for the games room
		if (!(toId(room) === 'gamecorner' && config.serverid === 'showdown')) return false;
		var text = '';
		if (!this.canUse('games', room, by)) {
			text += '/pm ' + by + ', ';
		}
		this.say(con, room, text + 'Game List: 1. Would You Rather, 2. NickGames, 3. Scattegories, 4. Commonyms, 5. Questionnaires, 6. Funarios, 7. Anagrams, 8. Spot the Reference, 9. Pokemath, 10. Liar\'s Dice');
		this.say(con, room, text + '11. Pun Game, 12. Dice Cup, 13. Who\'s That Pokemon?, 14. Pokemon V Pokemon (BST GAME), 15. Letter Getter, 16. Missing Link, 17. Parameters! More information can be found here: http://psgamecorner.weebly.com/games.html');
	},
	happy: function(arg, by, room, con) {
		// info for The Happy Place
		if (!(toId(room) === 'thehappyplace' && config.serverid === 'showdown')) return false;
		var text = '';
		if (!this.canUse('happy', room, by)) text += '/pm ' + by + ', ';
		this.say(con, room, text + "The Happy Place, at its core, is a friendly environment for anyone just looking for a place to hang out and relax. We also specialize in taking time to give advice on life problems for users. Need a place to feel at home and unwind? Look no further!");
	},


	/**
	 * Jeopardy commands
	 *
	 * The following commands are used for Jeopardy in the Academics room
	 * on the Smogon server.
	 */


	b: 'buzz',
	buzz: function(arg, by, room, con) {
		if (this.buzzed || !this.canUse('buzz', room, by) || room.charAt(0) === ',') return false;
		this.say(con, room, '**' + by.substr(1) + ' has buzzed in!**');
		this.buzzed = by;
		var self = this;
		this.buzzer = setTimeout(function(con, room, buzzMessage) {
			self.say(con, room, buzzMessage);
			self.buzzed = '';
		}, 7000, con, room, by + ', your time to answer is up!');
	},
	reset: function(arg, by, room, con) {
		if (!this.buzzed || !this.hasRank(by, '%@&#~') || room.charAt(0) === ',') return false;
		clearTimeout(this.buzzer);
		this.buzzed = '';
		this.say(con, room, 'The buzzer has been reset.');
	},
};
