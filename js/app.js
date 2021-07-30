const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const argmax = (arr) =>
{
	let index = 0;
	let max = 0;

	for (let i = 0; i < arr.length; i++) {
		if (max < arr[i])
		{
			index = i;
			max = arr[i];
		}
	}

	return index;
};

const width = 28;
const height = 28;
const scale = 20;

var app = new Vue({
	el: "#app",
	data: {
		epoches: 0,
		outputIndex: -1,
		outputs: new Array(10).fill(0)
	},
	methods: {
		round(x) {
			return String(x).substring(0, 5);
		}
	}
});

var mousePositionX = 0;
var mousePositionY = 0;

var mouseDown = false;

var colors = CreateTwoWorldArray(height, width);

var canvas = document.getElementById("paint-canvas");
var context = canvas.getContext("2d");

var canvasWidth = canvas.width = width * scale;
var canvasHeight = canvas.height = height * scale;

var pixelWidth = canvas.width / width;
var pixelHeight = canvas.height / height;

var network = JSON.parse(network_json);

app.epoches = network.epochs_count;

DrawBackground();

function CreateTwoWorldArray(length, long_length) {
	let arr = new Array(length);

	for (let i = 0; i < arr.length; i++) {
		arr[i] = new Array(long_length).fill(0);
	}

	return arr;
}

function DrawRect(color, x, y) {
	context.fillStyle = color;
	context.fillRect(x * pixelWidth, y * pixelHeight, pixelWidth, pixelHeight);
}

function DrawBackground() {
	context.fillStyle = "#000";
	context.fillRect(0, 0, canvasWidth, canvasHeight);
}

function DrawCanvas() {
	DrawBackground();

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (colors[y][x] > 0) {
				let color = colors[y][x] * 255;

				DrawRect(`rgb(${color}, ${color}, ${color})`, x, y);
			}
		}
	}
}

function Update() {
	let xMouse = Math.floor(mousePositionX / pixelWidth);
	let yMouse = Math.floor(mousePositionY / pixelHeight);

	if (mouseDown) {
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				let val = Math.pow(x - xMouse, 2) + Math.pow(y - yMouse, 2);

				if (val < 1) val = 1;

				colors[y][x] += 0.1 / (val * val);

				if (colors[y][x] > 1) colors[y][x] = 1;
			}
		}

		DrawCanvas();
	}
}

function FeedForword() {
	if (network == null)
	{
		alert("Network not found.");
		return;
	}

	let inputs = new Array(width * height);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			inputs[y * height + x] = colors[y][x];
		}
	}

	network.layers[0].neurons = inputs;

	for (let i = 1; i < network.topology.layer_count; i++) {
		let currentLayer = network.layers[i - 1];
		let nextLayer = network.layers[i];

		for (let j = 0; j < nextLayer.size; j++) {
			nextLayer.neurons[j] = 0;

			for (let k = 0; k < currentLayer.size; k++) {
				nextLayer.neurons[j] += currentLayer.neurons[k] * currentLayer.weights[k][j];
			}

			nextLayer.neurons[j] += nextLayer.biases[j];
			nextLayer.neurons[j] = sigmoid(nextLayer.neurons[j]);
		}
	}

	let neurons = network.layers[network.topology.layer_count - 1].neurons;

	let maxNeuronIndex = argmax(neurons);

	app.outputs = neurons;
	app.outputIndex = maxNeuronIndex;
}

window.onkeydown = (target) =>
{
	let key = target.keyCode;

	if (key == 67) {
		colors = CreateTwoWorldArray(height, width);

		app.outputs = new Array(10).fill(0);
		app.outputIndex = -1;

		DrawBackground();
	}
};
canvas.onmousedown = (target) => mouseDown = true;
canvas.onmouseup = (target) =>
{
	mouseDown = false;

	FeedForword();
};
canvas.onmousemove = (target) => 
{
	mousePositionX = target.offsetX;
	mousePositionY = target.offsetY;
};

setInterval(Update, 1000 / 60);
