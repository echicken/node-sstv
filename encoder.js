var util = require('util'),
	EventEmitter = require('events'),
	Modes = require('./modes.js');

var Encoder = function (options) {

	EventEmitter.call(this);

	var self = this, tones = [], phase = 0;

	if (typeof options !== 'object') options = {}
	this.volume = options.volume || 8192;
	this.sampleRate = options.sampleRate || 44100;

	this._addSample = function (frequency, tick) {
		var m = this.volume * Math.sin(phase);
		phase = phase + ((2 * Math.PI * frequency) / this.sampleRate);
		if (phase > (2 * Math.PI)) phase = phase - (2 * Math.PI);
		tones.push(m&255);
		tones.push((m>>8)&255);
	}

	this._tone = function (frequency, duration) {
		var samples = this.sampleRate * (duration * .001);
		for (var s = 0; s < samples; s++) {
			this._addSample(frequency, s);
		}
	}

	function reset() {
		tones = [];
		phase = 0;
	}

	function deedleEedleMeepMeep() {
		self._tone(1900, 100);
		self._tone(1500, 100);
		self._tone(1900, 100);
		self._tone(1500, 100);
		self._tone(2300, 100);
		self._tone(1500, 100);
		self._tone(2300, 100);
		self._tone(1500, 100);
	}

	function calibrationHeader(b) {

		self._tone(1900, 300);	// Leader
		self._tone(1200, 10);	// Break
		self._tone(1900, 300);	// Leader

		// VIS code 'b', LSB first, even parity
		self._tone(1200, 30);	// VIS start bit
		var parity = 0; // Parity accumulator
		for (var n = 0; n < 7; n++) {
			self._tone(b&(1<<n) ? 1100 : 1300, 30); // A 1 or a 0
			if (b&(1<<n)) parity++; // Parity accumulator
		}
		self._tone(parity % 2 === 0 ? 1300 : 1100, 30); // Parity bit
		self._tone(1200, 30); // VIS stop bit

	}

	this._start = function (mode) {
		reset();
		deedleEedleMeepMeep();
		calibrationHeader(mode);
	}

	this._finish = function () {
		var ret = new Buffer(tones);
		reset();
		this.emit('data', ret);
		return ret;
	}

}
util.inherits(Encoder, EventEmitter);

Encoder.prototype.RobotBW = function (variant, picture, callback) {

	var self = this, syncTime, yScanTime, width, visCode;

	switch (variant) {
		case 0: // 8
			syncTime = 10;
			yScanTime = 56;
			width = 160;
			visCode = 2;
			break;
		case 1: // 12
			syncTime = 7;
			yScanTime = 93;
			width = 160;
			visCode = 6;
			break;
		default:
			break;
	}

	var samples = this.sampleRate * (yScanTime * .001);
	var scale = width / samples;

	function scan(line) {
		self._tone(1200, syncTime);
		for (var s = 0; s < samples; s++) {
			self._addSample(line[Math.floor(s * scale)].y, s);
		}
	}

	function encode() {
		self._start(visCode);
		picture.YUV_AF.forEach(scan);
		var data = self._finish();
		if (typeof callback === 'function') callback(data);
	}

	picture.scale(120, encode);

}

Encoder.prototype.RobotColour = function (variant, picture, callback) {

	var self = this, yScanTime, uvScanTime, visCode, vPorchTone;

	switch (variant) {
		case 0: // 36
			yScanTime = 88;
			uvScanTime = 44;
			visCode = 8;
			vPorchTone = 1900;
			break;
		case 1: // 72
			yScanTime = 138;
			uvScanTime = 69;
			visCode = 12;
			vPorchTone = 1500;
			break;
		default:
			break;
	}

	var ySamples = this.sampleRate * (yScanTime * .001),
		uvSamples = this.sampleRate * (uvScanTime * .001);

	var yScale = 320 / ySamples,
		uvScale = 320 / uvSamples;

	function addSamples(line, samples, scale, yuv) {
		for (var s = 0; s < samples; s++) {
			self._addSample(line[Math.floor(s * scale)][yuv], s);
		}
	}

	function yScan(line) {
		self._tone(1200, 9);
		self._tone(1500, 3);
		addSamples(line, ySamples, yScale, 'y');
	}

	/*	I'm being lazy and not averaging the U & V values for every two lines.
		I doubt if it will make much of a difference once implemented, but it's
		on my mental to-do list anyhow. */
	function uScan(line) {
		self._tone(1500, 4.5);
		self._tone(1900, 1.5);
		addSamples(line, uvSamples, uvScale, 'u');
	}

	function vScan(line) {
		self._tone(2300, 4.5);
		self._tone(vPorchTone, 1.5);
		addSamples(line, uvSamples, uvScale, 'v');
	}

	function scan36(e, i) {
		yScan(e);
		(i % 2 === 0 ? uScan : vScan)(e);
	}

	function scan72(e) {
		yScan(e);
		uScan(e);
		vScan(e);
	}

	function encode() {
		self._start(visCode);
		picture.YUV_AF.forEach(variant === 0 ? scan36 : scan72);
		var data = self._finish();
		if (typeof callback === 'function') callback(data);
	}

	picture.scale(240, encode);

}

Encoder.prototype.Martin = function (variant, picture, callback) {

	var self = this, scanTime, visCode;

	switch (variant) {
		case 0: // M1
			scanTime = 146.432;
			visCode = 44;
			break;
		case 1: // M2
			scanTime = 73.216;
			visCode = 40;
			break;
		default:
			break;
	}

	var samples = this.sampleRate * (scanTime * .001);
	var scale = 320 / samples;

	function sync() {
		self._tone(1200, 4.862);
		self._tone(1500, 0.572);
	}

	function scan(line, colour) {
		for (var s = 0; s < samples; s++) {
			self._addSample(line[Math.floor(s * scale)][colour], s);
		}
		self._tone(1500, 0.572); // Separator
	}

	function cycle(line) {
		sync();
		scan(line, 'g');
		scan(line, 'b');
		scan(line, 'r');
	}

	function encode() {
		self._start(visCode);
		picture.RGB_AF.forEach(cycle);
		var data = self._finish();
		if (typeof callback === 'function') callback(data);
	}

	picture.scale(256, encode);

}

Encoder.prototype.Scottie = function (variant, picture, callback) {

	var self = this, scanTime, visCode;

	switch (variant) {
		case 0: // 1
			scanTime = 138.24;
			visCode = 60;
			break;
		case 1: // 2
			scanTime = 88.064;
			visCode = 56;
			break;
		case 2: // DX
			scanTime = 345.6;
			visCode = 76;
			break;
		default:
			break;
	}

	var samples = self.sampleRate * (scanTime * .001);
	var scale = 320 / samples;

	function sync() {
		self._tone(1200, 9);
		self._tone(1500, 1.5);
	}

	function separate() {
		self._tone(1500, 1.5);
	}

	function scan(line, colour) {
		for (var s = 0; s < samples; s++) {
			self._addSample(line[Math.floor(s * scale)][colour], s);
		}
	}

	function cycle(line) {
		separate();
		scan(line, 'g');
		separate();
		scan(line, 'b');
		sync();
		scan(line, 'r');
	}

	function encode() {
		self._start(visCode);
		picture.RGB_AF.forEach(cycle);
		var data = self._finish();
		if (typeof callback === 'function') callback(data);
	}

	picture.scale(256, encode);

}

Encoder.prototype.Fax480 = function (picture, callback) {

	var self = this;
	var samples = this.sampleRate * (262.144 * .001);
	var scale = 512 / samples;

	function header() {
		self._tone(2300, 2.05);
		self._tone(1500, 2.05);
	}

	function phasingInterval() {
		self._tone(1200, 5.12);
		self._tone(2300, 262.144);
	}

	function scan(line) {
		self._tone(1200, 5.12);
		for (var s = 0; s < samples; s++) {
			self._addSample(line[Math.floor(s * scale)].y, s);
		}
	}

	function encode() {
		for (var n = 0; n < 1220; n++) {
			header();
		}
		for (var n = 0; n < 20; n++) {
			phasingInterval();
		}
		picture.YUV_AF.forEach(scan);
		var data = self._finish();
		if (typeof callback === 'function') callback(data);
	}

	picture.scale(480, encode);

}

Encoder.prototype.encode = function (mode, picture, callback) {
	switch (mode) {
		case Modes.ROBOT_BW_8:
			this.RobotBW(0, picture, callback);
			break;
		case Modes.ROBOT_BW_12:
			this.RobotBW(1, picture, callback);
			break;
		case Modes.ROBOT_COLOR_36:
		case Modes.ROBOT_COLOUR_36:
			this.RobotColour(0, picture, callback);
			break;
		case Modes.ROBOT_COLOR_72:
		case Modes.ROBOT_COLOUR_72:
			this.RobotColour(1, picture, callback);
			break;
		case Modes.MARTIN_1:
			this.Martin(0, picture, callback);
			break;
		case Modes.MARTIN_2:
			this.Martin(1, picture, callback);
			break;
		case Modes.SCOTTIE_1:
			this.Scottie(0, picture, callback);
			break;
		case Modes.SCOTTIE_2:
			this.Scottie(1, picture, callback);
			break;
		case Modes.SCOTTIE_DX:
			this.Scottie(2, picture, callback);
			break;
		case Modes.FAX480:
			this.Fax480(picture, callback);
			break;
		default:
			break;
	}
}

module.exports = Encoder;