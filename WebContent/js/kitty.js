function myFunction() {
	var myNumber = 2;
	var txt = "";
	while (myNumber != Infinity) {
		myNumber = myNumber * myNumber;
		txt = txt + myNumber + "<br>";
	}
	document.getElementById("demo").innerHTML = txt;
	var x = 123;
	var y = new Number(123);

	document.getElementById("demo").innerHTML = typeof x + "<br>" + typeof y;
}

function drawSomething() {
	var c = document.getElementById("myCanvas");
	var cxt = c.getContext("2d");
	cxt.moveTo(10, 10);
	cxt.lineTo(150, 50);
	cxt.lineTo(10, 50);
	cxt.stroke();
}


function printToConsole(message){
	console.log(message);
}

var nums = [0, 1];

function addNum(){
	var num = nums[nums.length - 1] + 1;
	nums[nums.length] = num;
}

function printAllNum(){
	for(index = 0; index < nums.length; index++){
		printToConsole(nums[index]);
	}
}

function isArray(myArray) {
    return myArray.constructor.toString().indexOf("Array") > -1;
}