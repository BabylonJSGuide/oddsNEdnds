var writeMaths = function() {
	var myDiv = document.createElement('div');
	var html = '<math xmlns = "http://www.w3.org/1998/Math/MathML">';
	html += '<mrow>';
    html += '<msup><mi>a</mi><mn>2</mn></msup>';
    html += '<mo>+</mo>';
	html += '<msup><mi>b</mi><mn>2</mn></msup>';
    html += '<mo> = </mo>';
    html += '<msup><mi>c</mi><mn>2</mn></msup>';
    html += '</mrow>';
	html += '</math>';
	myDiv.innerHTML = html;
	myDiv.style.position = 'absolute';
	myDiv.style.top = '50px';
	myDiv.style.right = '20px';
	document.body.appendChild('myDiv');
};