var mouseIsDown = false;
window.onload = function() {
    
    document.body.onmousedown = function() { mouseIsDown = true };
    document.body.onmouseup = function() { mouseIsDown = false };

    // load data
    d3.queue()
        .defer(d3.csv, datafile)
        .await(render);
}

var separation; // separation between points along x
var yHeight; // max height of y axis

// elements
var showButton;
var showButtonText;

var lastVisibleX;
var lastVisibleY;

function render(error, data) {

    var visible = [];
    var hidden = [];
    var dataMax = null;
    for (var i = 0; i < data.length; i++) {

        // convert all data to integers
        data[i]['y'] = parseFloat(data[i]['y']);
        data[i]['hide'] = parseInt(data[i]['hide']);

        // separate data into visible and hidden
        // first data point marked (hide: 1) is separation point
        if (hidden.length === 0 && data[i]['hide'] === 0)
            visible.push(data[i]);
        else
            hidden.push(data[i]);

        // search for max data
        if (dataMax === null || data[i]['y'] > dataMax)
            dataMax = data[i]['y'];
    }

    // determine number of ticks
    var ticks = Math.ceil(dataMax / tickInterval);
    yHeight = ticks * tickInterval;

    // define dimensions of graph
    var canvas = d3.select('div#predictive-graph');
    canvas.style('width', px(graphWidth));
   
    // show the headline
    var headline = canvas.append('div')
        .html(title)
        .style('margin-left', px(padding))
        .style('margin-right', px(padding));
    makeHeadline(headline);
    
    // create main canvas
    var svg = canvas.append('svg')
        .style('width', px(graphWidth))
        .style('height', px(graphHeight + padding + buttonHeight))
        .style('margin-left', px(padding))
        .style('margin-right', px(padding));
    drawAxes(svg);
    
    // calculate space between points
    separation = innerGraphWidth / (data.length - 1);
    plotVisiblePoints(svg, visible);
    lastVisibleX = coordinateOfX(separation * (visible.length - 1));
    lastVisibleY = coordinateOfY(visible[visible.length - 1]['y']);

    // add button to show results
    showButton = svg.append('rect')
        .attr('x', innerGraphX + innerGraphWidth - buttonWidth)
        .attr('y', innerGraphY + innerGraphHeight + padding)
        .attr('width', buttonWidth)
        .attr('height', buttonHeight)
        .style('fill', showButtonColor)
        .style('visibility', 'hidden')
        .on('click', function() {
            plotHiddenPoints(svg, [visible[visible.length - 1]].concat(hidden), visible.length);
        });
    
    showButtonText = svg.append('text')
        .attr('x', innerGraphX + innerGraphWidth - (buttonWidth / 2))
        .attr('y', innerGraphY + innerGraphHeight + padding + (buttonWidth / 5))
        .attr('width', buttonWidth)
        .attr('height', buttonHeight)
        .style('font-family', mainFont)
        .style('font-size', buttonFontSize)
        .style('color', black)
        .style('text-anchor', 'middle')
        .style('visibility', 'hidden')
        .text(function() { return "Show Actual" })
        .on('click', function() {
            plotHiddenPoints(svg, [visible[visible.length - 1]].concat(hidden), visible.length);
        });
    
    svg.on('mousemove', mousemove)
}

var drawnPoints = [];
var pointReached = 0;

function mousemove() {
    if (!mouseIsDown) {
        if (pointReached < innerGraphX + (0.9 * innerGraphWidth)) {
            for (var i = 0; i < drawnPoints.length; i++) {
                drawnPoints[i].remove();
            }
            drawnPoints = [];
        }
        return;
    }
    svg = d3.select(this);
    mouseX = d3.mouse(svg.node())[0];
    mouseY = d3.mouse(svg.node())[1];
    if (mouseX > pointReached)
        pointReached = mouseX;

    // once threshold point is reached, show the button
    if (pointReached >= innerGraphX + (0.9 * innerGraphWidth)) {
        showButton.style('visibility', 'visible');
        showButtonText.style('visibility', 'visible');
    }
    point = drawPoint(svg, mouseX, mouseY, crimson, 0);
    drawnPoints.push(point);
}

function makeHeadline(headline) {
    headline.style('color', blue1)
        .style('text-align', 'center')
        .style('font-family', mainFont)
        .style('font-size', px(headlineSize));
}

function drawAxes(svg) {
    var xAxis = svg.append('path')
        .attr('d', line([
                [innerGraphX, innerGraphY],
                [innerGraphX, innerGraphY + innerGraphHeight]
        ]))
        .attr('stroke', black)
        .attr('stroke-width', 3);

    var yAxis = svg.append('path')
        .attr('d', line([
                [innerGraphX, innerGraphY + innerGraphHeight],
                [innerGraphX + innerGraphWidth, innerGraphY + innerGraphHeight]
        ]))
        .attr('stroke', black)
        .attr('stroke-width', 3);
}

function plotVisiblePoints(svg, data) {
    var j = 0; // number of line segments already drawn
    var xCoord = separation; // x location of next point

    // draw initial point
    drawPoint(svg, coordinateOfX(0), coordinateOfY(data[0]['y']), black, 0);

    var dataLine = d3.line()
        .x(function(d, i) {
            return coordinateOfX((i + j) * separation);
        })
        .y(function(d) {
            return coordinateOfY(d['y']);
        });

    for (var i = 0; i < data.length - 1; i++) {
        var visibleLine = svg.append('path')
            .attr('d', dataLine(data.slice(i, i + 2)))
            .attr('fill', 'none')
            .attr('stroke', black)
            .attr('stroke-width', 3);

        // animate drawing of visible line
        var visLineLength = visibleLine.node().getTotalLength();
        visibleLine
            .attr('stroke-dasharray', visLineLength + ' ' + visLineLength)
            .attr('stroke-dashoffset', visLineLength)
            .transition()
            .duration(400)
            .delay(400 * j + 400)
            .ease(d3.easeLinear)
            .attr('stroke-dashoffset', 0);

        j++;

        drawPoint(svg,
                coordinateOfX(xCoord),
                coordinateOfY(data[i+1]['y']),
                black, 400 * (j+1));
        xCoord += separation;

    }

}    

function plotHiddenPoints(svg, data, pointsDone) {
    var j = pointsDone - 1; // total number of segments drawn
    var k = 0; // number of hidden segments drawn 
    var xCoord = separation * pointsDone;
    
    // draw the initial point
    drawPoint(svg,
            coordinateOfX(xCoord - separation),
            coordinateOfY(data[0]['y']), green, 0);

    var dataLine = d3.line()
        .x(function(d, i) {
            return coordinateOfX((i + j) * separation);
        })
        .y(function(d) {
            return coordinateOfY(d['y']);
        });

    for (var i = 0; i < data.length - 1; i++) {
        var hiddenLine = svg.append('path')
            .attr('d', dataLine(data.slice(i, i + 2)))
            .attr('fill', 'none')
            .attr('stroke', green)
            .attr('stroke-width', 3);

        // animate drawing of hidden line
        var hidLineLength = hiddenLine.node().getTotalLength();
        hiddenLine
            .attr('stroke-dasharray', hidLineLength + ' ' + hidLineLength)
            .attr('stroke-dashoffset', hidLineLength)
            .transition()
            .duration(400)
            .delay(400 * k + 400)
            .ease(d3.easeLinear)
            .attr('stroke-dashoffset', 0);
        
        j++;
        k++;

        drawPoint(svg,
                coordinateOfX(xCoord),
                coordinateOfY(data[i+1]['y']),
                green, 400 * (k+1));
        xCoord += separation;
    }
}

// determines the X coordinate of a particular x data value
function coordinateOfX(x) {
    return innerGraphX + x;
}

// determines the Y coordinate of a particular y data value
function coordinateOfY(y) {
    var ydist = yDistance(y, yHeight, innerGraphHeight);
    return innerGraphY + innerGraphHeight - ydist;
}

function drawPoint(svg, x, y, color, delay) {
    var circle = svg.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 5)
        .attr('fill', color)
        .attr('visibility', 'hidden');

    circle.transition()
        .duration(10)
        .delay(delay)
        .ease(d3.easeLinear)
        .style('visibility', 'visible');

    return circle;
}

