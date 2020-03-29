const ffmpeg = require("fluent-ffmpeg");
const Discord = require("discord.js");
const fs = require("fs");

const client = new Discord.Client();

const AudioMixer = require("audio-mixer");
const shotmixer = require();
const { SilenceStream } = require("./silence_stream");

client.on("ready", () => {
	console.log("I am ready!");
});

client.on("message", async message => {
	var elements = message.content.trim().split(" ");
	if (elements.length < 1) {
		return;
	}

	switch (elements[0]) {
		case "/ping":
			message.reply("pong");
			break;
		case "/join":
			// Only try to join the sender's voice channel if they are in one themselves
			// console.log(message);
			if (message.member.voice.channel) {
				// Creates a new audio mixer with the specified options
				let mixer = new AudioMixer.Mixer({
					channels: 2,
					bitDepth: 16,
					sampleRate: 48000,
					clearInterval: 250,
					highWaterMark: 1
				});
				let silence = mixer.input({
					channels: 1,
					bitDepth: 16,
					sampleRate: 48000,
					volume: 100,
					highWaterMark: 1
				});
				let silenceStream = new SilenceStream({
					sampleRate: 48000,
					bitDepth: 16,
					highWaterMark: 1
				});
				silenceStream.pipe(silence);

				const connection = await message.member.voice.channel.join();
				// Connection is an instance of VoiceConnection
				message.reply("I have successfully connected to the channel!");

				const ff = ffmpeg("chefbenzos.monitor")
					.inputFormat("pulse")
					.outputFormat("s16le")
					.outputOptions("-ac 2")
					.outputOptions("-ar 48.0k")
					.outputOptions("-bufsize 512");
				ff.on("error", (err, stdout, stderr) => {
					console.log(err);
					console.log(stdout);
					console.log(stderr);
				});

				const shotstream = ff.pipe();
				connection.play(shotstream, {
					type: "converted",
					highWaterMark: 1,
					volume: false
				});

				// Speaking shit
				const speakingUsers = {};
				connection.on("speaking", (user, speaking) => {
					if(!user || !user.id) {
						return;
					}		
					if (speaking.bitfield !== 0) {
						console.log("ififififi");
						console.log(speaking);

						const audioStream = connection.receiver.createStream(user, {
							mode: "pcm",
							end: "silence"
						});

						let input = mixer.input({
							channels: 2,
							bitDepth: 16,
							sampleRate: 48000,
							volume: 100,
							highWaterMark: 1
						});

						//audioStream.pipe(input);

						//testing ffmpeg only
						const ff2 = ffmpeg(audioStream)
							.inputFormat("s16le")
						// .audioChannels(2)
							.inputOptions("-ac 2")
							.inputOptions("-ar 48.0k")
							.inputOptions("-acodec pcm_s16le")
							.outputFormat("pulse")
							.outputOptions("-device mushit")
							.outputOptions("-bufsize 512")
							.outputOptions("-af apad=pad_len=100k")
							.output("suprise mothafucka!")
							.run();

						speakingUsers[user.id] = input;
					} else {
						console.log("bingbingbongbong");
						const input = speakingUsers[user.id];
						if (input) {
							mixer.removeInput(input);
						}
						speakingUsers[user.id] = undefined;
					}
				});
				/*const ff2 = ffmpeg(mixer)
	  .inputFormat("s16le")
				// .audioChannels(2)
	  .inputOptions("-ac 2")
	  .inputOptions("-ar 48.0k")
	  .inputOptions("-acodec pcm_s16le")
	  .outputFormat("pulse")
	  .outputOptions("-device mushit")
	  .outputOptions("-bufsize 512")
	  .output("suprise mothafucka!")
				//.outputFormat("opus")
				//.output("litershot.ogg")
	  .run();*/
			} else {
				message.reply("You need to join a voice channel first!");
			}
			break;
	}
});

const botToken = process.env.DISCORD_BOT_TOKEN;
client.login(botToken);
