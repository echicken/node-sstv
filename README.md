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

#####Methods

- load(*Buffer*)
- scale(*height*, *callback*)

#####Events

- ready


####SSTV.Encoder

#####Methods

- encode(*mode*, *Picture*)

#####Events

- data


####SSTV.Modes

Mode identifiers for use with *SSTV.Encoder.encode(mode, picture)*.

#####Properties

- ROBOT_BW_8
- ROBOT_BW_12
	- Robot Research black & white 8 & 12 second modes
- ROBOT_COLOR_36
- ROBOT_COLOR_72
	- Robot Research colour 36 & 72 second modes
- MARTIN_1
- MARTIN_2
- SCOTTIE_1
- SCOTTIE_2
- SCOTTIE_DX
- FAX480