# node-sstv
A Slow-Scan Television (SSTV) encoder for node.js.

```js
var fs = require('fs'),
    Speaker = require('speaker'), // npm install speaker
    SSTV = require('./index.js');

function play(pcm) { speaker.write(pcm); }

function onParse(err) {
	if (err !== null) {
		console.log(err);
		return;
	}
	for (var m in SSTV.Modes) {
		var encoder = new SSTV.Encoder();
		encoder.encode(SSTV.Modes[m], this, play);
	}
}

function onRead(err, data) {
	if (err !== null) {
		console.log(err);
    } else {
		var picture = new SSTV.Picture();
		picture.load(data, onParse);
	}
}

var speaker = new Speaker({ channels : 1, bitDepth : 16, sampleRate : 44100 });
fs.readFile('/path/to/some/picture.png', onRead);
```

####SSTV.Picture

```js
var picture = new SSTV.Picture(*Buffer*);
```

#####Methods
- load(*Buffer*, [,*callback*])
	- Load an image from a Buffer into this *SSTV.Picture* instance.
	- The *Buffer* argument must contain raw PNG, JPEG, or BMP data, eg. as read from a file.
	- The *this* context for the callback function will be that of this instance of *SSTV.Picture*.

#####Events
- error
- ready
	- The *ready* event is fired once the picutre passed to the constructor (or to the *.load* method) has been parsed.
	- The *this* context for the *ready* callback function will be that of the *SSTV.Picture* object which fired the event.

####SSTV.Encoder

#####Methods
- encode(*mode*, *Picture* [, *callback*])

#####Events
- data


####SSTV.Modes

Mode identifiers for use with *SSTV.Encoder.encode(mode, picture)*.

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