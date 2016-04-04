var util = require('util'),
	EventEmitter = require('events'),
	Jimp = require('jimp');

var Picture = function (data) {

	EventEmitter.call(this);

	var self = this, image = { bitmap : { data : [], width : 0, height : 0 }};

	function toAF(n) {
		return 1500 + Math.min(255, Math.max(0, n)) * 3.1372549;
	}

	function RGBtoYUV(r, g, b) {
		return {
			y : 16+(.003906*((65.738*r)+(129.057*g)+(25.064*b))),
			u : 128+(.003906*((112.439*r)+(-94.154*g)+(-18.285*b))),
			v : 128+(.003906*((-37.945*r)+(-74.494*g)+(112.439*b)))
		}
	}

	function pixelToYuvAf(index) {
		var yuv = RGBtoYUV(
			image.bitmap.data[index],
			image.bitmap.data[index + 1],
			image.bitmap.data[index + 2]
		);
		return { y : toAF(yuv.y), u : toAF(yuv.u), v : toAF(yuv.v) };
	}

	function pixelToRgbAf(index) {
		return {
			r : toAF(image.bitmap.data[index]),
			g : toAF(image.bitmap.data[index + 1]),
			b : toAF(image.bitmap.data[index + 2])
		};
	}

	function lineToYuvAf(y) {
		var line = [];
		for (var x = 0; x < image.bitmap.width; x++) {
			line[x] = pixelToYuvAf(((image.bitmap.width * y + x)<<2));
		}
		return line;
	}

	function imageToYuvAf() {
		var lines = [];
		for (var y = 0; y < image.bitmap.height; y++) {
			lines[y] = lineToYuvAf(y);
		}
		return lines;
	}

	function lineToRgbAf(y) {
		var line = [];
		for (var x = 0; x < image.bitmap.width; x++) {
			line[x] = pixelToRgbAf(((image.bitmap.width * y + x)<<2));
		}
		return line;
	}

	function imageToRgbAf() {
		var lines = [];
		for (var y = 0; y < image.bitmap.height; y++) {
			lines[y] = lineToRgbAf(y);
		}
		return lines;
	}

	this.__defineGetter__('YUV_AF', function () { return imageToYuvAf(); });
	this.__defineGetter__('RGB_AF', function () { return imageToRgbAf(); });
	this.__defineGetter__('data', function () { return image.bitmap.data; });
	this.__defineGetter__('width', function () { return image.bitmap.width; });
	this.__defineGetter__('height',	function () {return image.bitmap.height;});

	this.load = function (buf) {
		Jimp.read(
			buf,
			function (err, img) {
				if (err !== null) {
					self.emit('error', err);
				} else {
					image = img;
					self.emit('ready')
				}				
			}
		);
	}

	this.scale = function (height, callback) {
		image.resize(Jimp.AUTO, height);
		callback.call(this);
	}

	if (data instanceof Buffer) this.load(data);

}
util.inherits(Picture, EventEmitter);

module.exports = Picture;