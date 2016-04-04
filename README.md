# node-sstv
A Slow-Scan Television (SSTV) encoder for node.js.

```js
var fs = require('fs'),
    Speaker = require('speaker'), // npm install speaker
    SSTV = require('./index.js');

function play(pcm) { speaker.write(pcm); }

function onParse() {
	for (var m in SSTV.Modes) {
		var encoder = new SSTV.Encoder();
		encoder.on('data', play);
		encoder.encode(SSTV.Modes[m], this);
	}
}

function onRead(err, data) {
	if (err !== null) {
		console.log(err);
    } else {
		new SSTV.Picture(data).on('ready', onParse);
	}
}

var speaker = new Speaker({ channels : 1, bitDepth : 16, sampleRate : 44100 });
fs.readFile('/path/to/some/picture.png', onRead);
```

####SSTV.Picture

#####Properties

#####Methods

#####Events


####SSTV.Encoder

#####Properties

#####Methods

#####Events


####SSTV.Modes

#####Properties

	- ROBOT_BW_8
	- ROBOT_BW_12
	- ROBOT_COLOR_36
	- ROBOT_COLOR_72
	- MARTIN_1
	- MARTIN_2
	- SCOTTIE_1
	- SCOTTIE_2
	- SCOTTIE_DX
	- FAX480