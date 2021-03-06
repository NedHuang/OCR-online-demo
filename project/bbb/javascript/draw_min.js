/*****************************************************************************
created by Mingzhe Huang @ Founder IT Group, 06/2018

declare variables
1.  returned, added, deleted分别是 含有 服务器传回来的识别框，用户添加的识别框，服务器传回但是被删掉的识别框（false positive的例子) 的数组
2.  _backups后缀意为备份，想用户提供一键清除所有改动服务
3.  每一个识别框长以json形式存储，包含 category 和 vertexes属性，前者可以为table,formula, image, 后者为一个包含四个点坐标(x,y)的二维数组（左上，右上，坐下，右下，例如
    box = {"category": "table","vertexes":[[210,10],[310,10],[310,110],[210,110]]}
4.  box_category 是全局变量，修改此变量以改变生成的识别框的种类
5.  action_array:记录用户的操作的数组，每一项是一个json, 下称为action, index 为此array的某元素的位置。未有操作时， index初始化为-1；
6.  action为json格式，包含act和obj 两个属性，act为string,记录其操作类型， obj为操作对象(识别框),例如
    action = {"act": "add_new_box", "obj":{"category": "table","vertexes":[[210,10],[310,10],[310,110],[210,110]]}}
7.  point_pair 含有两个点的坐标，记录鼠标按下与松开的位置（对角线的两个顶点生成矩形）
8.  对于任何操作，抛弃当前index以及之后的action, 把本操作加入action_array(undo 和 redo的规则)
9.  涉及到 delete的操作，清空canvas，调用 draw_all() 根据已经更新的数组重新绘制
******************************************************************************/
var canvas = document.getElementById("canvas");
var context = canvas.getContext('2d');
var returned_backups = [{"category": "image","vertexes":[[10,10],[110,10],[110,110],[10,110]]}, {"category": "table","vertexes":[[10,10],[50,10],[50,50],[10,50]]}];
var added_backups = [];
var deleted_backups = [];

var returned = [{"category": "image","vertexes":[[10,10],[110,10],[110,110],[10,110]]}, {"category": "table","vertexes":[[10,10],[50,10],[50,50],[10,50]]}];
var added = [];
var deleted = [];

var action_array = [];
var box_category = "table";
var index = - 1;
var point_pair = [];

/*********************************************************
监听事件.
**********************************************************/
// mousedown behavior while in edit mode
edit_mousedown = function(e) {
  // a point is a array with two element, x-coordinate and y-coordinate,
  // add the point where user start to draw the box to point pair
  var point_start = [e.offsetX,e.offsetY];
  point_pair.push(point_start);
}

edit_mouseup = function(e){
  // make add the point where user release the left button of mouse to point pair
  var point_end = [e.offsetX,e.offsetY];
  point_pair.push(point_end);
  // the four coordinates for drawing a bounding box
  var upper_left = new Array();
  var upper_right = new Array();
  var lower_left = new Array();
  var lower_right = new Array();
  // the array that contains the four vertexes of a rectangle
  var vertexes = new Array();
  // the four lines that make the rectangle, their intersections are the four vertexes
  var left = Math.min(point_pair[0][0],point_pair[1][0]);
  var right = Math.max(point_pair[0][0],point_pair[1][0]);
  var upper = Math.min(point_pair[0][1],point_pair[1][1]);
  var lower = Math.max(point_pair[0][1],point_pair[1][1]);

  // the four vertexes
  upper_left.push(left,upper);
  upper_right.push(right,upper);
  lower_left.push(left,lower);
  lower_right.push(right,lower);

  // push four points to the vertexes array, generate new 
  vertexes.push(upper_left,upper_right,lower_right,lower_left);
  // update the added array,the action array and the index
  var new_box = {"category":box_category,"vertexes":vertexes};
  var new_action ={'act':'add_new_box', "obj":new_box};

  added.push(new_box);
  // check if we need to abandon the modification(the rest of the action_array)
  if(index == action_array.length - 1){
    draw(new_box);
    action_array.push(new_action);
    index = index + 1;
  }
  else{
    // replace everything in the action_array after the index by this new_action
    draw(new_box);
    action_array.splice(index + 1,action_array.length - index , new_action);
    // action_array.push(new_action);
    // no need to update index, because splice replaces the everything starts from the index
    index = index + 1;
    console.log("abandon");
    
  }
  point_pair = [];
  console.log("added length: " + added.length + ", returned length: " + returned.length + ", deleted.length: " + deleted.length);
}

// mousedown event for erase_mode(deleting), mouseup后清除mousemove事件
// this function generates an array of points and for each points, it calls delete_box()
erase_mousedown = function(e){
  context.strokeStyle = "#000000";
  eraser_path = [];
  x_start = e.offsetX;
  y_start = e.offsetY;
  

  eraser_path.push([x_start,y_start]);  
  context.moveTo(x_start, y_start);
  // canvas.onmousemove = function (e) {
  //   var x_end = e.offsetX;
  //   var y_end = e.offsetY;
  //   context.lineTo(x_end, y_end);
  //   context.stroke();
  //   if(Math.abs(x_start - x_end) + Math.abs(y_start - y_end) > 20){
  //     x_start = x_end;
  //     v_start = y_end;
  //     eraser_path.push([x_start,y_start]);
  //   }
  // }
  // canvas.onmouseup = erase_mouseup;
}

erase_onmousemove = function (e) {
  var x_end = e.offsetX;
  var y_end = e.offsetY;
    context.strokeStyle = "#000000";
  context.lineTo(x_end, y_end);
  context.stroke();
  if(Math.abs(x_start - x_end) + Math.abs(y_start - y_end) > 20){
    x_start = x_end;
    v_start = y_end;
    eraser_path.push([x_start,y_start]);
  }
}

erase_mouseup = function () {
  delete_box(eraser_path);
  console.log("1");
  draw_all();
  eraser_path = [];
  canvas.onmousemove = null;
}


/*********************************************************
添加/删除 box
**********************************************************/

// call calculate_distance for each box and it returns true if the distance <= 10 pixel。
// if the box is in added array, just delete, otherwise, delete and append it into deleted array
function delete_box(path){
  for(var i = 0; i < path.length; i++){
    var x = path[i][0];
    var y = path[i][1];
    for(var j =0; j < added.length;j++){
      var top = added[j].vertexes[0][1];
      var left = added[j].vertexes[0][0];
      var right = added[j].vertexes[2][0];
      var bot = added[j].vertexes[2][1];
      if(calculate_diatance(x,y,left,top,right,bot)){
        var deleted_box = added[j];
        added.splice(j,1);
        var new_action = {"act":"delete_added_box", "obj":deleted_box};
        // update the index when delete a box
        j = j - 1;
        if(index == action_array.length - 1){
          action_array.push(new_action);
          index = index + 1;
        }
        else{
          action_array.splice(index, action_array.length - index);
          action_array.push(new_action);
        }
      }
    }
    for(var j =0; j < returned.length;j++){
      var top = returned[j].vertexes[0][1];
      var left = returned[j].vertexes[0][0];
      var right = returned[j].vertexes[2][0];
      var bot = returned[j].vertexes[2][1];
      if(calculate_diatance(x,y,left,top,right,bot)){
        var deleted_box = returned[j];
        returned.splice(j,1);
        // record this false positive instance by pushing the box into "deleted"array
        deleted.push(deleted_box);
        var new_action = {"act":"delete_returned_box", "obj":deleted_box};
        // update the index
        j = j - 1;
        if(index == action_array.length - 1){
          action_array.push(new_action);
          index = index + 1;
        }
        else{
          action_array.splice(index, action_array.length - index);
          action_array.push(new_action);
        }
      }      
    }
  }
}


// if the sum of distance from the point to a pair of edges is smaller than the height/width + 20 pixel, return true;
function calculate_diatance(x,y,x_1,y_1,x_2,y_2){
  if( (Math.abs(x-x_1)+Math.abs(x_2-x)<=Math.abs(x_1-x_2)+20) && (Math.abs(y-y_1)+Math.abs(y_2-y)<=Math.abs(y_1-y_2)+20) ){
    // console.log(('x,y,x_1,y_1,x_2,y_2: ' + x + " "+ y + " " + x_1 + " " + y_1+ " "+ x_2 + " " +y_2 ));
    // console.log('x - x_1: ' + (x - x_1));
    // console.log('x_2 - x: ' + (x_2 - x));
    // console.log('y - y_1: ' + (y - y_1));
    // console.log('y_2 - y: ' + (y_2 - y));
    return true;
  }
  return false;
}



/*********************************************************
画图
**********************************************************/

function draw(input_box){
  var vertexes = input_box.vertexes;
  if(input_box.category == "image"){
    context.lineWidth = 2;
    context.strokeStyle = "#3232CD";
  }

  if(input_box.category == "formula"){
    context.lineWidth = 2;
    context.strokeStyle = "#F5270B";
  }
  if(input_box.category == "table"){
    context.lineWidth = 2;
    context.strokeStyle = "#32CD32";
  }
  // draw the box
  context.beginPath();
  for (var i = 0; i < 4; i++) {
    if(i != 3){
      context.moveTo(vertexes[i][0],vertexes[i][1]);
      context.lineTo(vertexes[i+1][0],vertexes[i+1][1]);
      context.stroke();
    }else{
      context.moveTo(vertexes[3][0],vertexes[3][1]);
      context.lineTo(vertexes[0][0],vertexes[0][1]);
      context.stroke();
    }
  }
  //console.log("draw rectangle: " + input_box);
  context.closePath();
}


function draw_all(){
  console.log("re-draw " + added.length +"items in added and " + returned.length + " items in returned, in index " + index);
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  for (var i = 0; i < added.length; i++) {
    draw(added[i]);
  }
  for (var i = 0; i < returned.length; i++) {
    draw(returned[i]);
  }
}

/*********************************************************
操作+实现逻辑
**********************************************************/

// enter the edit mode and change the eventlistner
function edit_mode(){
  canvas.removeEventListener("mousedown",erase_mousedown);
  canvas.removeEventListener("onmousemove", erase_onmousemove);
  canvas.removeEventListener("mouseup",erase_mouseup);
  canvas.addEventListener("mousedown", edit_mousedown);
  canvas.addEventListener("mouseup",edit_mouseup);
}


  // change the eventlistener
function erase_mode(){
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  canvas.removeEventListener("mousedown", edit_mousedown);
  canvas.removeEventListener("mouseup",edit_mouseup);
  context.lineWidth = 2;
  context.strokeStyle = "#000000";
  canvas.addEventListener("mousedown",erase_mousedown);
  canvas.addEventListener("onmousemove", erase_onmousemove);
  canvas.addEventListener("mouseup",erase_mouseup);
}


function undo(){
  //console.log("before undo, index is: " + index +", length is: " + action_array.length + ", added length is " + added.length);
  if(index == -1){
    // nothing can be undone, disable the button
    alert("nothing can be undone");
  }
  else{
    var last_action = action_array[index];
    console.log(last_action.act);
    index = index - 1;
    if(last_action.act == "add_new_box"){
      added.splice(added.length-1,1);
      console.log("2");
      draw_all();
      //console.log("undo adding box, after undo, index is: " + index +", action length is: " + action_array.length + ", added length is " + added.length);
    }
    if(last_action.act == "delete_added_box"){
      // alert("undo delete_added_box");
      added.push(last_action.obj);
      console.log("3");
      draw_all();
      //console.log("undo deleting added box, after undo, index is: " + index +", action length is: " + action_array.length + ", added length is " + added.length);
    }
    if(last_action.act == "delete_returned_box"){
      returned.push(last_action.obj);
      deleted.pop();
      console.log("4");
      // returned.push(deleted.pop());
      draw_all();
    }
  }  
}

function redo(){
  console.log("before redo index is: " + index +", length is: " + action_array.length + ", added length is " + added.length);
  if(index >= action_array.length-1){
    alert("nothing can be redone");
  }else{
    index = index + 1;
    var action_to_be_revoked = action_array[index];
    if(action_to_be_revoked.act == 'add_new_box'){
      added.push(action_to_be_revoked.obj);
      console.log("5");
      draw_all();
      console.log("after redo index is: " + index +", length is: " + action_array.length + ", added length is " + added.length);
    }
    if(action_to_be_revoked.act == "delete_added_box"){
      added.pop(action_to_be_revoked.obj);
      console.log("6");
      draw_all();
    }
    if(action_to_be_revoked.act == "delete_returned_box"){
      returned.pop();
      deleted.push(action_to_be_revoked.obj);
      // deleted.push(returned.pop());
      console.log("7");
      draw_all();
    }
  }
}


function change_category_to_formula(){
  box_category = "formula";
}

function change_category_to_image(){
  box_category = "image";
}

function change_category_to_table(){
  box_category = "table";
}

//保存修改，将参数存入 backups
function save_change(){
  returned_backups = jQuery.extend(true, {}, returned);
  added_backups = jQuery.extend(true, {}, added);
  deleted_backups = jQuery.extend(true, {}, deleted);
}


/*********************************************************
测试用 function
**********************************************************/

// print all retuened box to console
function print_returned(){
  console.log("returned_box:");
  for(var i =0; i< returned.length; i++){
    print_box(returned[i]);
  }
}

// print all added box to console
function print_added(){
  console.log("added_box:");
  for(var i=0;i<added.length; i++){
    print_box(added[i]);
  }
}

// print all deleted object to console
function print_deleted(){
  console.log("deleted_box:" + deleted.length);
  for(var i =0; i< deleted.length; i++){
    print_box(deleted[i]);
  }
}

function print_box(box){
  console.log("category: "+box.category+"; vertexes: left: "+box.vertexes[0][0]+", top: "+box.vertexes[0][1]+", right: "+box.vertexes[2][0]+", bot: "+box.vertexes[0][1]);
}


function reset() {
  returned = jQuery.extend(true, {}, returned_backups);
  added = jQuery.extend(true, {}, added_backups);
  deleted = jQuery.extend(true, {}, deleted_backups);
}

//将保存后的结果传回 server
function makechange(){
  var obj = JSON.stringify(
  {
    "user": user,
    "returned_boxes": returned_backups,
    "added_boxes": added_backups,
    "deleted_boxes": deleted_backups,
  });

  $.ajax(
  {
    url: "// server的 地址",
    type:"post",
    data: obj,
    // processData:false,
    // contentType:false,
    success:function(res){
      var obj = JSON.parse(obj);
      alert("您所做的修改已保存到服务器");
    },
    error:function(err){
      alert("网络链接失败");
    }
  })
}

// the img and the canvas with same size
resize = function(){
  var img = $('#current_page_img');
  // img.height(600);
  var width = document.getElementById('current_page_img').width;
  var height = document.getElementById('current_page_img').height;
  var canvas = document.getElementById('canvas');

  canvas.height = height;
  canvas.width = width;
}

window.onload = resize;
