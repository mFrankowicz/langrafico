var dataContainer;
var socket;
var bars;

function setup() {
  createCanvas(600, 400);
  
  // Using custom DOM elements to store and access animated variables
  dataContainer = d3.select('body').append('custom');
  
  
  socket = io.connect('192.168.1.2:8080');
  // We make a named event called 'mouse' and write an
  // anonymous callback function
  
  textAlign(CENTER);
  
  // Periodic function that produces a series of D3 transitions.
  refresh();
  setInterval(refresh, 2000);
  
  // Replace the draw() loop with d3.timer. You can rename drawFunction()
	// draw()
  // and use the draw() loop. To my eye, the animation is not as smooth.
  d3.timer(drawFunction);
}


// Refresh function contains only D3
function refresh() {
  var values;
  var rand = Math.random() * 30 + 10;
  var slope = Math.random() * 6 - 3;
  values = d3.range(20).map(function(i) { 
    var val = i*slope + rand + Math.random() * 3;
    return (val > 50) ? 50 : val;
  }) 
  
  x = d3.scaleLinear()
    .domain([0, values.length])
    .range([0, width]);
  
  y = d3.scaleLinear()
    .domain([0, 50])
    .range([height, 0]);
 
  // bind generated data to custom dom elements
  var bars = dataContainer.selectAll('.bars').data(values);
  
  // store variables for visual representation. These will be used
  // later by p5 methods.
  bars
    .enter()
    .append('rect')
    .attr('height', 120)
    .attr('class', 'bars')
    .attr('x', function(d, i) { return x(i) })
    .attr('dx', function(d) { return width/values.length - 1;})
    .attr('y', function(d) { return height; })
  
  bars
    .transition()
    .duration(2000)
    .delay(function(d,i) { return i * 50;})
    .attr('height', function(d) { return height - y(d); })
    .attr('x', function(d, i) { return x(i) })
    .attr('y', function(d) { return  y(d); })
 
}

// Draw function contains no D3.
function drawFunction() {
  background(255);
  noStroke();
  
  // p5.dom
  bars = selectAll('rect','bars');
    
  for(var i = 0; i < bars.length; i++) {
	
    var thisbar = bars[i];
    
    
    push();
    translate(thisbar.attribute('x'), thisbar.attribute('y'));
    
    if((mouseX > thisbar.attribute('x')) && (mouseX < (int(thisbar.attribute('x')) + int(thisbar.attribute('dx'))))) {
      fill('brown');
    } else {
      fill('red');
    }
    rect(1,1, thisbar.attribute('dx'), thisbar.attribute('height'));
    fill('white')
    text(int(thisbar.attribute('height')),thisbar.attribute('dx')/2 + 2, 15);
    pop();
  }
  stroke('black');
  strokeWeight(3);
  line(0,height,width,height);
  noStroke();
}

function mouseDragged() {
	  // Draw some white circles
	 // fill(255);
	 // noStroke();
	 // ellipse(mouseX,mouseY,80,80);
	  // Send the mouse coordinates
	  sendmouse(mouseX,mouseY);
	 // sendData(80,60)
	}

function keyTyped(){
	/*
	  for(var i = 0; i < bars.length; i++) {
		  var thisbar = bars[i];
		  
		  
			.attr('height', 120)
		    .attr('class', 'bars')
		    .attr('x', function(d, i) { return x(i) })
		    .attr('dx', function(d) { return width/values.length - 1;})
		    .attr('y', function(d) { return height; })
		  
		  c = bars[i].attribute('class')
		  x = bars[i].attribute('x')
		  y = bars[i].attribute('y')
		  h = bars[i].attribute('height')
		  dx = bars[i].attribute('dx')
		  
		  sendData(c,x,y,h,dx)
	  }
	  */
}

	// Function for sending to the socket
function sendmouse(xpos, ypos) {
	  // We are sending!
	  console.log("sendmouse: " + xpos + " " + ypos);
	  
	  // Make a little object with and y
	  var data = {
	    x: xpos,
	    y: ypos
	  };

	  // Send that object to the socket
	  socket.emit('mouse',data);
}

function sendData(_class, _x, _y, _height, _dx){
	var data = {
			c: _class,
			x: _x,
			y: _y,
			h: _height,
			dx: _dx
		  };
	
	socket.emit('barh',data);
}
