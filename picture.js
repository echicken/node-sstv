var PNG = require('pngjs').PNG,
	JPEG = require('jpeg-js'),
	sharp = require('sharp');

var Picture = function (options, callback) {

	var self = this, data = [], width = 0, height = 0;

	function toAF(n) {
		return 1500 + Math.min(255, Math.max(0, n)) * 3.1372549;
	}

	function RGBtoYUV(r, g, b) {
		return {
			y : 16 + (.003906 * ((65.738 * r) + (129.057 * g) + (25.064 * b))),
			u : 128 + (
				.003906 * ((112.439 * r) + (-94.154 * g) + (-18.285 * b))
			),
			v : 128 + (
				.003906 * ((-37.945 * r) + (-74.494 * g) + (112.439 * b))
			)
		}
	}

	function pixelToYuvAf(index) {
		var yuv = RGBtoYUV(data[index], data[index + 1], data[index + 2]);
		return { y : toAF(yuv.y), u : toAF(yuv.u), v : toAF(yuv.v) };
	}

	function pixelToRgbAf(index) {
		return {
			r : toAF(data[index]),
			g : toAF(data[index + 1]),
			b : toAF(data[index + 2])
		};
	}

	function lineToYuvAF(y) {
		var line = [];
		for (var x = 0; x < width; x++) {
			line[x] = pixelToYuvAf(((width * y + x)<<2));
		}
		return line;
	}

	function imageToYuvAf() {
		var lines = [];
		for (var y = 0; y < height; y++) {
			lines[y] = lineToYuvAF(y);
		}
		return lines;
	}

	function lineToRgbAf(y) {
		var line = [];
		for (var x = 0; x < width; x++) {
			line[x] = pixelToRgbAf(((width * y + x)<<2));
		}
		return line;
	}

	function imageToRgbAf() {
		var lines = [];
		for (var y = 0; y < height; y++) {
			lines[y] = lineToRgbAf(y);
		}
		return lines;
	}

	function init() {

		switch (options.type.toLowerCase()) {
			case 'png':
				var png = new PNG();
				png.parse(
					options.data,
					function (err, pData) {
						data = pData.data;
						width = png.width;
						height = png.height;
						callback.call(self);
					}
				);
				break;
			case 'jpg':
			case 'jpeg':
				var jpeg = JPEG.decode(options.data);
				data = jpeg.data;
				width = jpeg.width;
				height = jpeg.height;
				callback.call(self);
				break;
			default:
				throw 'Invalid image type.';
				break;
		}

	}

	this.__defineGetter__('YUV_AF', function () { return imageToYuvAf(); });
	this.__defineGetter__('RGB_AF', function () { return imageToRgbAf(); });

	this.scale = function (height, cb) {
		sharp(options.data).resize(null, height).png().toBuffer(
			function (err, data, info) {
				options.data = data;
				callback = cb;
				init();
			}
		);
	}

	init();

}

module.exports = Picture;