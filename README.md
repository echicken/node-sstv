# node-sstv
A Slow-Scan Television (SSTV) encoder for node.js.

- SSTV.Picture({ type : String ('png' or 'jpeg'), data : Buffer }, callback)
- SSTV.Encoder()
	- .encode(mode, picture, callback)
- SSTV.Modes
	- .ROBOT_BW_8
	- .ROBOT_BW_12
	- .ROBOT_COLOR_36
	- .ROBOT_COLOR_72
	- .MARTIN_1
	- .MARTIN_2
	- .SCOTTIE_1
	- .SCOTTIE_2
	- .SCOTTIE_DX
	- .FAX480

```js
var fs = require('fs'),
	Speaker = require('speaker'), // npm install speaker
	SSTV = require('sstv');

function play(pcm) { speaker.write(pcm); }

function onParse() {
	var encoder = new SSTV.Encoder();
	encoder.encode(SSTV.Modes.ROBOT_COLOR_36, this, play);
}

function onRead(err, data) {
	if (err !== null) {
		console.log(err);
		return;
	}
	var picture = new SSTV.Picture({ type : 'png', data : data }, onParse);
}

var speaker = new Speaker({ channels : 1, bitDepth : 16, sampleRate : 44100 });

fs.readFile('/path/to/some/picture.png', onRead);
```