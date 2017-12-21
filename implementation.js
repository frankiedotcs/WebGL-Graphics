
/*Homework2 for WebGL for Frankie Ruttenbur
First part of homework is the webgl_helper.js code*/


// Initializes WebGL
function initWebGL(canvas) {
  var ctx = null;
  ctx = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

  if (!ctx) {
    alert("Unable to initialize WebGL; your browser may not support it.");
  }

  return ctx;
}

// Creates and compiles a shader
function getShader(gl, kind, script){
  var shader = gl.createShader(kind);
  gl.shaderSource(shader, script);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw (kind == gl.VERTEX_SHADER? "vertex" : "fragment") + " compile error: " + gl.getShaderInfoLog(shader);
  }

  return shader;
}

// Creates and links a program using the given scripts.
function initShaders(gl, vs_script, fs_script){
  var v_shader = getShader(gl, gl.VERTEX_SHADER, vs_script);
  var f_shader = getShader(gl, gl.FRAGMENT_SHADER, fs_script);

  var program = gl.createProgram();
  gl.attachShader(program, v_shader);
  gl.attachShader(program, f_shader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw ("Linking error: " + gl.getProgramInfoLog (program));
  }

  return program;
}

/* Initializes and enables one or more buffers for the given
   attributes data which is expected to be of the following form:

   data[{
     name: "attribute_name",
     size: 3,
     data: vertices array or number of vertices to reserve memory
           for or undefined if buffer was defined in a previous element,
     indices: indicies array to use with drawElements.
     stride: how many floats in per vertex data,
     offset: at what index within the per vertex
             data the item's portion of data starts
   }]
*/
function initBuffers(gl, program, data){
  var buffers = {}
  var fSize = Float32Array.BYTES_PER_ELEMENT;
  data.forEach(function(item){
    if(item.data !== undefined){
      // Create the buffer
      var buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      buffers[item.name] = buffer;

      if(typeof(item.data) !== 'number'){
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(item.data), gl.STATIC_DRAW);
      }else{
        gl.bufferData(gl.ARRAY_BUFFER, fSize * item.size * item.data, gl.STATIC_DRAW);
      }

      if(item.indices !== undefined){
        var indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(item.indices), gl.STATIC_DRAW);
      }
    }

    // Get the location of and enable the attribute
    var attribute = gl.getAttribLocation(program, item.name);
    var stride = fSize * (item.stride || 0);
    var offset = fSize * (item.offset || 0);
    gl.vertexAttribPointer(attribute, item.size, gl.FLOAT, false, stride, offset);
    gl.enableVertexAttribArray(attribute);
  });

  return buffers;
}

// Clears the canvas and sets the background color.
function clear(gl, color){
  gl.clearColor(...color);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function setColor(r,g,b){
  color = [];
  color.push(r, g, b);
}

function pointAt(x, y, ps){
  ptsize = ps;

  //the initBuffers
  initBuffers(gl, program, [{
    name: "coordinates",
    size: 3,
    data: [x, y, 0.0]
  },{
    name: "colors",
    size: 3,
    data: color
  }]);

  //rendering
  gl.uniform1f(ptsizeLoc, ptsize);
  gl.drawArrays(gl.POINTS, 0, 1);
}

function lineBetween(x1, y1, x2, y2){
  initBuffers(gl, program, [{
    name: "coordinates",
    size: 3,
    data: [x1, y1, 0, x2, y2, 0]
  },{
    name: "colors",
    size: 3,
    data: [color[0], color[1], color[2], color[0], color[1], color[2]]
  }]);

  gl.uniform1f(ptsizeLoc, ptsize);
  gl.drawArrays(gl.LINES, 0, 2); //tells you to pass in however big the lines array is / 3

}//ends lineBetween function

function ellipseAt (x, y, width, height){

  var vertices = [];
  var hH = height/2;
  var hW = width/2;
  var centerX = x + hW;
  var centerY = y - hH;
  var n = 360;



  for(var i = 0.01 * Math.PI; i <= n; i += .01){
    var radians = 2 * Math.PI * i / n; //radians
    vertices.push(hW * (Math.cos(radians)) + centerX,
    hH*(Math.sin(radians)) + centerY, 0.0);
  }

  var colors = [];

  for(var i = 0; i < vertices.length / 3; i++){
    colors.push(color[0], color[1], color[2]);
  }

  //THE initBuffers
  initBuffers(gl, program, [{
    name: "coordinates",
    size: 3,
    data: vertices
  },{
    name: "colors",
    size: 3,
    data: colors
  }]);

  // Render
  gl.uniform1f(ptsizeLoc, ptsize);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 3);

}

function polygon(){
  var vertices = [];
  //THE COORDINATES LOGGED INTO THE ARRAYS//
  for (var i = 0; i < arguments.length; i += 2){
    vertices.push(arguments[i], arguments[i+1], 0);
  }

  var colors = [];

  for(var i = 0; i < vertices.length / 3; i++){
    colors.push(color[0], color[1], color[2]);
  }

  initBuffers(gl, program, [{
    name: "coordinates",
    size: 3,
    data: vertices
  },{
    name: "colors",
    size: 3,
    data: colors
  }]);

    // Render
  gl.uniform1f(ptsizeLoc, ptsize);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 3);
}//ends polygon

//VERTEX SHADER
var vshader = "attribute vec3 coordinates; " +
              "attribute vec3 colors; " +
              "varying vec4 vColor; " +
              "uniform float ptsize; " +
              "void main(void) { " +
              "gl_Position = vec4(coordinates, 1.0); "+
              "gl_PointSize = ptsize;"+
              "vColor = vec4(colors, 1.0); } ";
//FRAGMENT SHADER
var fshader = "varying mediump vec4 vColor;"+
              "void main(void) {"+
              "gl_FragColor = vColor; } ";


//GLOBAL VARIABLES
var canvas = document.querySelector("canvas");//the canvas
var gl = initWebGL(canvas); //sets gl to canvas
var program = initShaders(gl,vshader,fshader);//setColor
gl.useProgram(program);
var ptsizeLoc = gl.getUniformLocation(program, "ptsize");
var ptsize = 2.0;

var color = [0, 0, 0];
