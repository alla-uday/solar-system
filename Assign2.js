var canvas;
var gl;

var vMatrix;
var pMatrix;

var va = vec4(0.0, 0.0, -1.0,1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);

var scaleSphere = [4, 2, 1.3, 1.65, 1, 0.5];
var speedAroundOrbit = [0, 60, 50, 40, 45, 70];
var sphereRotation = [50, 30, 40, 70, 20, 60];
var distance = [0, 8, 13, 17, 20, 15];

var attachPlanet = false;
var positions = [];
var normals = [];
var index = 0;

var time = 0.0;
var timer = new Timer();

var lowPositionBuffer;
var lowNormalBuffer;

var mediumPositionBuffer;
var mediumNormalBuffer;

var highPositionBuffer;
var highNormalBuffer;

var bestPositionBuffer;
var bestNormalBuffer;

var pos;
var norm;

var u_modelViewMatrix;
var u_projectionMatrix;
var u_modelViewLightMatrix;

var u_gouraudAmbientProduct;
var u_gouraudDiffuseProduct;
var u_gouraudSpecularProduct;


var u_phongAmbientProduct;
var u_phongDiffuseProduct;
var u_phongSpecularProduct;

 var u_lightPosition;
 var u_gouraudShininess;
 var u_phongShininess;

 var N = 1;

var redOrange =  [
	mult(vec4(0.4, 0.4, 0.4, 1.0), vec4(1.4, 0.2, 0.1, 1.0)),
	mult(vec4(0.5, 0.5, 0.5, 1.0), vec4(1.4, 0.2, 0.1, 1.0)),
	mult(vec4(0.4, 0.4, 0.4, 1.0), vec4(1.4, 0.2, 0.1, 1.0))
];

var icyGrey = [
	mult(vec4(0.4, 0.4, 0.4, 1.0), vec4(0.8, 0.9, 1.0, 1.0)),
	mult(vec4(0.5, 0.5, 0.5, 1.0), vec4(0.8, 0.9, 1.0, 1.0)),
	mult(vec4(0.8, 0.8, 0.8, 1.0), vec4(0.8, 0.9, 1.0, 1.0))
];

var bluishGreen = [
	mult(vec4(0.4, 0.4, 0.4, 1.0), vec4(0.1, 0.9, 0.8, 1.0)),
	mult(vec4(0.5, 0.5, 0.5, 1.0), vec4(0.1, 0.9, 0.8, 1.0)),
	mult(vec4(0.8, 0.8, 0.8, 1.0), vec4(0.1, 0.9, 0.8, 1.0))
];

var lightBlue = [
	mult(vec4(0.4, 0.4, 0.4, 1.0), vec4(0.1, 0.8, 1.0, 1.0)),
	mult(vec4(0.5, 0.5, 0.5, 1.0), vec4(0.1, 0.8, 1.0, 1.0)),
	mult(vec4(0.8, 0.8, 0.8, 1.0), vec4(0.1, 0.8, 1.0, 1.0))
];
var brownOrange = [
	mult(vec4(0.4, 0.4, 0.4, 1.0), vec4(0.7, 0.4, 0.1, 1.0)),
	mult(vec4(0.5, 0.5, 0.5, 1.0), vec4(0.7, 0.4, 0.1, 1.0)),
	mult(vec4(0.0, 0.0, 0.0, 1.0), vec4(0.7, 0.4, 0.1, 1.0)),
];

var moon = [
	mult(vec4(0.5, 0.5, 0.5, 1.0), vec4(0.4, 0.3, 0.6, 1.0)),
	mult(vec4(0.7, 0.7, 0.7, 1.0), vec4(0.4, 0.3, 0.6, 1.0)),
	mult(vec4(0.2, 0.2, 0.2, 1.0), vec4(0.4, 0.3, 0.6, 1.0)),
];

var degreeOfRotation = 0;
var heightCam = 35 
var xAxis = 0; 
var yAxis = -25; 
var zAxis = 0; 
var sunPositionZ = -40;

var shininess = 50;
var lightPosition = vec3(0.0, 0.0, 0.0);

function triangle(a, b, c, type, n) {

	if(type==0) { 
		var t1 = subtract(b, a);
		var t2 = subtract(c, a);
		var normal = normalize(cross(t1, t2));
		normal = vec4(normal);

		if(n) {
			normals.push(scale1(-1,normal));
			normals.push(scale1(-1,normal));
			normals.push(scale1(-1,normal));
		}
		else {
			normals.push(normal);
			normals.push(normal);
			normals.push(normal);
		}
	}
	else { 
		
		if(n) {
			normals.push(scale1(-1,a));
			normals.push(scale1(-1,b));
			normals.push(scale1(-1,c));
		}
		else {
			normals.push(a);
			normals.push(b);
			normals.push(c);
		}
		
	}

	positions.push(a);
	positions.push(b);
	positions.push(c);

	index += 3;
}

function divideTriangle(a, b, c, count, type, n) {
    if ( count > 0 ) {
                
        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var bc = mix(b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);
                                
        divideTriangle(a, ab, ac, count-1, type, n);
        divideTriangle(ab, b, bc, count-1, type, n);
        divideTriangle(bc, c, ac, count-1, type, n);
        divideTriangle(ab, bc, ac, count-1, type, n);
    }
    else { 
        triangle(a, b, c, type, n);
    }
}

function tetrahedron(a, b, c, d, n, type, iN) {
    divideTriangle(a, b, c, n, type, iN);
    divideTriangle(d, c, b, n, type, iN);
    divideTriangle(a, d, b, n, type, iN);
    divideTriangle(a, c, d, n, type, iN);
}

function setPhong() {
	gl.uniform1f(uniform_gouraud, false);
	gl.uniform1f(uniform_phong, true);
}

function setGouraud() {
	gl.uniform1f(uniform_gouraud, true);
	gl.uniform1f(uniform_phong, false);
}


window.onload = function init() {
	canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { 
    	alert( "WebGL isn't available" ); 
    }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    gl.enable(gl.DEPTH_TEST);

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    document.onkeydown = function(k) {
		k = k || window.event;
		
        if(k.keyCode===38 && !attachPlanet) {
            heightCam =heightCam - N;
        }
        else if(k.keyCode===40 && !attachPlanet) {
            heightCam = heightCam + N;
        }

        else if(k.keyCode===37  ) {
            degreeOfRotation = degreeOfRotation - N;
        }
        else if(k.keyCode===39 ) { 
            degreeOfRotation = degreeOfRotation + N;
        }
        else if(k.keyCode===65) { 
			attachPlanet = true;
		}
		else if(k.keyCode===68) {
			attachPlanet = false;
		}
 
        else if(k.keyCode===32){ 
            zAxis = zAxis + N;
        }
        else if(k.keyCode===49){ 
            N = 1;
        }
        else if(k.keyCode===50){ 
            N = 2;
        }
        else if(k.keyCode===51){ 
            N = 3;
        }
        else if(k.keyCode===52){ 
            N = 4;
        }
        else if(k.keyCode===53){ 
            N=5;
        }
        else if(k.keyCode== 54){ 
           N = 6;
        }
        else if(k.keyCode== 55){ 
            N = 7;
        }
        else if(k.keyCode== 56){ 
           N = 8;
        }
        else if(k.keyCode== 57){ 
            N = 9;
        }

    
        else if(k.keyCode===82) { 
             degreeOfRotation = 0; 
			 heightCam = 35; 
			 xAxis = 0; 
			 yAxis = -25; 
			 zAxis = 0; 
			 sunPositionZ = -40;
			 N = 1;
           
        }

	};
	tetrahedron(va, vb, vc, vd, 2, 0, 0); 

	lowPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lowPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
    
    lowNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lowNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

	tetrahedron(va, vb, vc, vd, 3, 1, 1);

    mediumPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mediumPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
    mediumNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mediumNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
	
	tetrahedron(va, vb, vc, vd, 4, 1, 1);

    highPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, highPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
    highNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, highNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

	tetrahedron(va, vb, vc, vd, 5, 1, 1);
	bestPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, bestPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
    bestNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bestNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    pos = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(pos);

    norm = gl.getAttribLocation(program, "vNormal");
    gl.enableVertexAttribArray(norm);

    gl.bindBuffer(gl.ARRAY_BUFFER, lowPositionBuffer);
    gl.vertexAttribPointer(pos, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, lowNormalBuffer);
    gl.vertexAttribPointer(norm, 4, gl.FLOAT, false, 0, 0);

	u_modelViewMatrix = gl.getUniformLocation(program, "modelViewMatrix");
    u_projectionMatrix = gl.getUniformLocation(program, "projectionMatrix");

    u_gouraudAmbientProduct = gl.getUniformLocation(program, "aPG");
    u_gouraudDiffuseProduct = gl.getUniformLocation(program, "dPG");
    u_gouraudSpecularProduct = gl.getUniformLocation(program, "sPG");

    u_lightPosition = gl.getUniformLocation(program, "lightPosition");
    u_gouraudShininess = gl.getUniformLocation(program, "gouraudShininess");
    u_phongShininess = gl.getUniformLocation(program, "phongShininess");


    u_phongAmbientProduct = gl.getUniformLocation(program, "aPP");
    u_phongDiffuseProduct = gl.getUniformLocation(program, "dPP");
    u_phongSpecularProduct = gl.getUniformLocation(program, "sPP");

    vMatrix = lookAt(vec3(0,0,0), vec3(0,0,0), vec3(0,1,0));
    pMatrix = perspective(45, canvas.width/canvas.height, 0.001, 1000);

    uniform_gouraud = gl.getUniformLocation(program, "Gouraud");
	uniform_phong = gl.getUniformLocation(program, "Phong");
	gl.uniform1f(uniform_gouraud, false);
	gl.uniform1f(uniform_phong, false);

	u_modelViewLightMatrix = gl.getUniformLocation(program, "modelViewLightMatrix");
	modelViewLightMatrix = vMatrix;
	modelViewLightMatrix = mult(modelViewLightMatrix, rotate(degreeOfRotation, [0, 1, 0])); 
	modelViewLightMatrix = mult(modelViewLightMatrix, rotate(heightCam, [1, 0, 0]));
	modelViewLightMatrix = mult(modelViewLightMatrix, translate(vec3(xAxis, yAxis, zAxis))); 
	modelViewLightMatrix = mult(modelViewLightMatrix, translate(vec3(0, 0, sunPositionZ)));
	gl.uniformMatrix4fv(u_modelViewLightMatrix, false, flatten(modelViewLightMatrix));
	
    timer.reset();

    render();
}
function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    time += timer.getElapsedTime() / 1000;

    if(attachPlanet) {
		
		heightCam=0;
		yAxis=0;
		
		var posEye = mat4();
		
		posEye = mult(posEye, translate(vec3(0, 0, sunPositionZ)));
		posEye = mult(posEye, rotate(time*speedAroundOrbit[3], [0, 1, 0]));
		posEye = mult(posEye, translate(vec3(0, 0, distance[3])));
	
		var eye = vec3(-posEye[0][0], -posEye[0][1], -posEye[0][2]);
		
		vMatrix = lookAt(eye, vec3(0, 0, 0), vec3(0, 1, 0));
	}
	else {
		
		vMatrix = lookAt(vec3(0, 0, 0), vec3(0, 0, 0), vec3(0, 1, 0));
	}
    createSphere(0,3,redOrange);
    createSphere(1,0,icyGrey);
    
    setGouraud();
    createSphere(2,1,bluishGreen);

    setPhong();
    createSphere(3,3,lightBlue);

    createSphere(4,2,brownOrange);

    createMoon(5,moon);

  
    window.requestAnimFrame(render);


}

function createMoon(i, planet){
	gl.bindBuffer(gl.ARRAY_BUFFER, highPositionBuffer);
		gl.vertexAttribPointer(pos, 4, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, highNormalBuffer);
		gl.vertexAttribPointer(norm, 4, gl.FLOAT, false, 0, 0);

		gl.uniform3fv(u_lightPosition, flatten(lightPosition));
	gl.uniform4fv(u_gouraudAmbientProduct, flatten(planet[0]));
    gl.uniform4fv(u_gouraudDiffuseProduct, flatten(planet[1]));
    gl.uniform4fv(u_gouraudSpecularProduct, flatten(planet[2]));
    gl.uniform1f(u_gouraudShininess, shininess);
	gl.uniform4fv(u_phongAmbientProduct, flatten(planet[0]));
    gl.uniform4fv(u_phongDiffuseProduct, flatten(planet[1]));
    gl.uniform4fv(u_phongSpecularProduct, flatten(planet[2]));
    gl.uniform1f(u_phongShininess, shininess);

    mvMatrix = vMatrix;
	mvMatrix = mult(mvMatrix, rotate(degreeOfRotation, [0, 1, 0])); 
	mvMatrix = mult(mvMatrix, rotate(heightCam, [1, 0, 0]));
	mvMatrix = mult(mvMatrix, translate(vec3(xAxis, yAxis, zAxis))); 
	mvMatrix = mult(mvMatrix, translate(vec3(0, 0, sunPositionZ)));
	mvMatrix = mult(mvMatrix, rotate(time*speedAroundOrbit[2], [0, 1, 0])); 
	mvMatrix = mult(mvMatrix, translate(vec3(0, 0, distance[2]))); 
	mvMatrix = mult(mvMatrix, rotate(time*speedAroundOrbit[5], [0, 1, 0])); 
	mvMatrix = mult(mvMatrix, translate(vec3(0, 0, 2)));
	mvMatrix = mult(mvMatrix, scale(vec3(scaleSphere[i], scaleSphere[i], scaleSphere[i])));
	mvMatrix = mult(mvMatrix, rotate(time*sphereRotation[i], [0, 1, 0]));
	
    gl.uniformMatrix4fv(u_modelViewMatrix, false, flatten(mvMatrix));
    gl.uniformMatrix4fv(u_projectionMatrix, false, flatten(pMatrix));

	for( var i=0; i<index; i+=3) 
        gl.drawArrays(gl.TRIANGLES, i, 3);

}
function createSphere(i, complexity, planet) {

	// choose which buffers to use based on complexity parame	
	if(complexity == 3){
		gl.bindBuffer(gl.ARRAY_BUFFER, bestPositionBuffer);
		gl.vertexAttribPointer(pos, 4, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, bestNormalBuffer);
		gl.vertexAttribPointer(norm, 4, gl.FLOAT, false, 0, 0);

	}
	else if(complexity===2) {
		gl.bindBuffer(gl.ARRAY_BUFFER, highPositionBuffer);
		gl.vertexAttribPointer(pos, 4, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, highNormalBuffer);
		gl.vertexAttribPointer(norm, 4, gl.FLOAT, false, 0, 0);
	}
	else if(complexity===1) {
		gl.bindBuffer(gl.ARRAY_BUFFER, mediumPositionBuffer);
		gl.vertexAttribPointer(pos, 4, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, mediumNormalBuffer);
		gl.vertexAttribPointer(norm, 4, gl.FLOAT, false, 0, 0);
	}
	else {
		gl.bindBuffer(gl.ARRAY_BUFFER, lowPositionBuffer);
		gl.vertexAttribPointer(pos, 4, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, lowNormalBuffer);
		gl.vertexAttribPointer(norm, 4, gl.FLOAT, false, 0, 0);
	}
	
	gl.uniform3fv(u_lightPosition, flatten(lightPosition));
	gl.uniform4fv(u_gouraudAmbientProduct, flatten(planet[0]));
    gl.uniform4fv(u_gouraudDiffuseProduct, flatten(planet[1]));
    gl.uniform4fv(u_gouraudSpecularProduct, flatten(planet[2]));
    gl.uniform1f(u_gouraudShininess, shininess);
	gl.uniform4fv(u_phongAmbientProduct, flatten(planet[0]));
    gl.uniform4fv(u_phongDiffuseProduct, flatten(planet[1]));
    gl.uniform4fv(u_phongSpecularProduct, flatten(planet[2]));
    gl.uniform1f(u_phongShininess, shininess);

    mvMatrix = vMatrix;
	mvMatrix = mult(mvMatrix, rotate(degreeOfRotation, [0, 1, 0])); // allow rotational navigation
	mvMatrix = mult(mvMatrix, rotate(heightCam, [1, 0, 0]));
	mvMatrix = mult(mvMatrix, translate(vec3(xAxis, yAxis, zAxis))); // allow translational navigation
	mvMatrix = mult(mvMatrix, translate(vec3(0, 0, sunPositionZ)));
	mvMatrix = mult(mvMatrix, rotate(time*speedAroundOrbit[i], [0, 1, 0]));
	mvMatrix = mult(mvMatrix, translate(vec3(0, 0, distance[i])));
	mvMatrix = mult(mvMatrix, scale(vec3(scaleSphere[i], scaleSphere[i], scaleSphere[i])));
	mvMatrix = mult(mvMatrix, rotate(time*sphereRotation[i], [0, 1, 0]));
	
    gl.uniformMatrix4fv(u_modelViewMatrix, false, flatten(mvMatrix));
    gl.uniformMatrix4fv(u_projectionMatrix, false, flatten(pMatrix));

	for( var i=0; i<index; i+=3) 
        gl.drawArrays(gl.TRIANGLES, i, 3);

	
}