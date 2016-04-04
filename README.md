# node-sstv
A Slow-Scan Television (SSTV) encoder for node.js.

```js
var fs = require('fs'),
    Speaker = require('speaker'), // npm install speaker
    SSTV = require('./index.js');

function play(pcm) { speaker.write(pcm); }

function onRead(err, data) {
	if (err !== null) {
		console.log(err);
		return;
    }
	for (var m in SSTV.Modes) {
		new SSTV.Encoder().encode(SSTV.Modes[m], data, play);
	}
}

var speaker = new Speaker({ channels : 1, bitDepth : 16, sampleRate : 44100 });
fs.readFile('/path/to/some/picture.png', onRead);
```

####SSTV.Encoder

Produces a *Buffer* of PCM audio data based on a *Buffer* of PNG, JPEG, or BMP image data (eg. as read from a file).

#####Methods

- encode(*mode*, *picture* [, *callback*])
	- *mode* is one of the properties of *SSTV.Modes* (see below).
	- *picture* is a *Buffer* containing the image data (see example above). 
	- Optional function *callback* will receive one argument, a *Buffer* containing PCM audio data.

#####Events

- data
	- The *data* event is fired once the image has been encoded as audio.  Listener will receive one argument, a *Buffer* containing PCM audio data.

####SSTV.Modes

Mode identifiers for use with *SSTV.Encoder.encode(mode, picture)*.

Additional modes can be added if anybody wants them.  I've implemented a variety of "popular", "fast", or interesting ones to start with.

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