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
var ticks;

// elements
var showButton;
var showButtonText;

var lastVisibleX;
var lastVisibleY;
var visibleSegments;
var requiredGuessCount;
var dataLen;

var visible = [];
var hidden = [];

function render(error, data) {

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
    ticks = Math.ceil(dataMax / tickInterval) + 2;
    yHeight = ticks * tickInterval;
    visibleSegments = visible.length - 1;
    requiredGuessCount = data.length - visibleSegments - 1;
    dataLen = data.length;

    // define dimensions of graph
    var canvas = d3.select('div#predictive-graph');
    canvas.style('width', px(graphWidth));
   
    // show the headline
    var headline = canvas.append('div')
        .html(title)
        .style('margin-left', px(padding))
        .style('margin-right', px(padding));
    makeHeadline(headline);
    
    // calculate space between points
    separation = innerGraphWidth / (data.length - 1);

    // create main canvas
    var svg = canvas.append('svg')
        .style('width', px(graphWidth))
        .style('height', px(graphHeight + padding + buttonHeight))
        .style('margin-left', px(padding))
        .style('margin-right', px(padding));
    drawAxes(svg);
    labelAxes(svg, data);
    drawTicksX(svg);
    
    plotVisiblePoints(svg, visible);
    lastVisibleX = coordinateOfX(separation * (visible.length - 1));
    lastVisibleY = coordinateOfY(visible[visible.length - 1]['y']);

    // add button to show results
    showButton = svg.append('rect')
        .attr('x', innerGraphX + innerGraphWidth - buttonWidth)
        .attr('y', innerGraphY + innerGraphHeight + 2 * padding)
        .attr('width', buttonWidth)
        .attr('height', buttonHeight)
        .style('fill', showButtonColor)
        .style('visibility', 'hidden')
        .on('click', function() {
            plotHiddenPoints(svg, [visible[visible.length - 1]].concat(hidden), visible.length);
        });
    
    showButtonText = svg.append('text')
        .attr('x', innerGraphX + innerGraphWidth - (buttonWidth / 2))
        .attr('y', innerGraphY + innerGraphHeight + 2 * padding + (buttonWidth / 5))
        .attr('width', buttonWidth)
        .attr('height', buttonHeight)
        .style('font-family', mainFont)
        .style('font-size', buttonFontSize)
        .style('color', black)
        .style('text-anchor', 'middle')
        .style('visibility', 'hidden')
        .text(function() { return "Show Actual"; })
        .on('click', function() {
            plotHiddenPoints(svg, [visible[visible.length - 1]].concat(hidden), visible.length);
        });

    svg.on('mousemove', mousemove)
        .on('mouseup', mouseup)
}

var drawnLines = [];
var temporaryLine = null;
var doneGuessing = false;

var lastReachedX;
var lastReachedY;

function mousemove() {

    // if done guessing, then don't change the drawing
    if (doneGuessing) {
        return;
    } else if (!mouseIsDown) {
        eraseLines(); 
        return;
    }

    // determine current position
    svg = d3.select(this);
    mouseX = d3.mouse(svg.node())[0];
    mouseY = d3.mouse(svg.node())[1];
    
    // update lastReachedX and Y if there's nothing drawn
    if (drawnLines.length === 0) {
        lastReachedX = lastVisibleX;
        lastReachedY = lastVisibleY;
    }

    // don't allow traveling backwards
    if (mouseX < lastReachedX)
        mouseX = lastReachedX;
    
    // get rid of the previous temporary line if one is there
    if (temporaryLine !== null) {
        temporaryLine.remove();
        temporaryLine = null;
    }
    
    // if we've reached a new separator line, make the line official
    if (mouseX >= lastReachedX + separation) {

        // create the official line and add it to a drawn line
        var newLine = svg.append('path')
            .attr('d', line([
                [lastReachedX, lastReachedY],
                [lastReachedX + separation, mouseY]
            ]))
            .attr('stroke', guessColor)
            .attr('stroke-width', 4);
        drawnLines.push(newLine);

        // update our last reached positions
        lastReachedX += separation;
        lastReachedY = mouseY;
        
        // if we've drawn enough line segments, then done guessing
        if (drawnLines.length >= requiredGuessCount) {
            doneGuessing = true;
            
            if (useButton) {
                showButton.style('visibility', 'visible');
                showButtonText.style('visibility', 'visible');
            } else {
                plotHiddenPoints(svg, [visible[visible.length - 1]].concat(hidden), visible.length);
            }
        }
    } else {

        // if we haven't reached a new separator, draw a temporary line
        temporaryLine = svg.append('path')
            .attr('d', line([
                [lastReachedX, lastReachedY],
                [mouseX, mouseY]
            ]))
            .attr('stroke', guessColor)
            .attr('stroke-dasharray', '5 5')
            .attr('stroke-width', 4);
    }
}

function eraseLines() {
    // if mouse isn't down, then erase any drawn lines
    for (var i = 0; i < drawnLines.length; i++) {
        drawnLines[i].remove();
    }
    drawnLines = [];

    // need to erase the temporary line too
    if (temporaryLine !== null) {
        temporaryLine.remove();
        temporaryLine = null;
    }
}

function mouseup() {
    if (!doneGuessing) {
        eraseLines();
    }
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
        .attr('stroke-width', 4);

    var yAxis = svg.append('path')
        .attr('d', line([
                [innerGraphX, innerGraphY + innerGraphHeight],
                [innerGraphX + innerGraphWidth, innerGraphY + innerGraphHeight]
        ]))
        .attr('stroke', black)
        .attr('stroke-width', 4);
}

function drawTicksX(svg) {
    for (var i = 1; i < dataLen; i++) {
        svg.append('path')
            .attr('d', line([
                [innerGraphX + separation * i, innerGraphY],
                [innerGraphX + separation * i, innerGraphY + innerGraphHeight]
            ]))
            .attr('stroke', black)
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '1 1');
    }
}

function labelAxes(svg, data) {
    
    // label the x ticks
    for (var i = 0; i < data.length; i++) {
        var label = data[i]['x'];
    
        svg.append('text')
            .attr('x', innerGraphX + i * separation)
            .attr('y', innerGraphY + innerGraphHeight + padding)
            .attr('width', separation)
            .attr('height', padding)
            .style('font-family', mainFont)
            .style('font-size', labelFontSize)
            .style('color', black)
            .style('text-anchor', 'middle')
            .text(function () { return label; });
    }
    
    // label the y ticks
    for (var i = 0; i < ticks; i++) {
        var height = i * tickInterval;

        svg.append('text')
            .attr('x', innerGraphX - padding)
            .attr('y', innerGraphY + innerGraphHeight - (height / yHeight) * innerGraphHeight)
            .attr('width', separation) 
            .attr('height', padding)
            .style('font-family', mainFont)
            .style('font-size', labelFontSize)
            .style('color', black)
            .style('text-anchor', 'end')
            .text(function() { return height; });
    }

    // label the y axis
    svg.append('text')
        .attr('x', - innerGraphWidth / 2)
        .attr('y', padding)
        .attr('width', innerGraphWidth)
        .attr('height', padding)
        .attr('font-family', mainFont)
        .attr('transform', 'rotate(-90)')
        .style('font-size', labelFontSize)
        .style('color', black)
        .style('text-anchor', 'middle')
        .text(function() { return yLabel; });

    // label the x axis
    svg.append('text')
        .attr('x', innerGraphX + innerGraphWidth / 2)
        .attr('y', innerGraphY + innerGraphHeight + 3 * padding)
        .attr('width', innerGraphWidth)
        .attr('height', padding)
        .attr('font-family', mainFont)
        .style('font-size', labelFontSize)
        .style('color', black)
        .style('text-anchor', 'middle')
        .text(function() { return xLabel; });
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
            .attr('stroke-width', 4);

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

    showKey(svg);

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
            .attr('stroke-width', 4);

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

function showKey(svg) {

    // red box
    svg.append('rect')
        .attr('x', innerGraphX)
        .attr('y', innerGraphY + innerGraphHeight + 4 * padding)
        .attr('width', padding)
        .attr('height', padding)
        .style('fill', guessColor);

    // red box corresponds to your guess
    svg.append('text')
        .attr('x', innerGraphX + 2 * padding)
        .attr('y', innerGraphY + innerGraphHeight + 5 * padding)
        .attr('width', 0.15 * innerGraphWidth)
        .attr('height', padding)
        .style('font-family', mainFont)
        .style('font-size', labelFontSize)
        .style('color', black)
        .style('text-anchor', 'start')
        .text(function() { return "Your Guess"; });
    
    // green box
    svg.append('rect')
        .attr('x', innerGraphX + 4 * padding + 0.15 * innerGraphWidth)
        .attr('y', innerGraphY + innerGraphHeight + 4 * padding)
        .attr('width', padding)
        .attr('height', padding)
        .style('fill', correctColor); 

    // green box corresponds to actual
    svg.append('text')
        .attr('x', innerGraphX + 6 * padding + 0.15 * innerGraphWidth)
        .attr('y', innerGraphY + innerGraphHeight + 5 * padding)
        .attr('width', 0.15 * innerGraphWidth)
        .attr('height', padding)
        .style('font-family', mainFont)
        .style('font-size', labelFontSize)
        .style('color', black)
        .style('text-anchor', 'start')
        .text(function() { return "Actual Data"; });
        
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

