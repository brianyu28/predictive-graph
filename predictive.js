window.onload = function() {

    // load data
    d3.queue()
        .defer(d3.csv, datafile)
        .await(render);
}

var separation; // separation between points along x
var yHeight; // max height of y axis

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
        .style('height', px(graphHeight))
        .style('margin-left', px(padding))
        .style('margin-right', px(padding));
    drawAxes(svg);
    
    // calculate space between points
    separation = innerGraphWidth / (data.length - 1);
    plotVisiblePoints(svg, visible);
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

function plotVisiblePoints(svg, visible) {
   var dataLine = d3.line()
        .x(function(d, i) {
            return innerGraphX + i * separation
        })
        .y(function(d) {
            return innerGraphY + innerGraphHeight - yDistance(d['y'], yHeight, innerGraphHeight)
        });

    var visibleLine = svg.append('path')
        .attr('d', dataLine(visible))
        .attr('fill', 'none')
        .attr('stroke', black)
        .attr('stroke-width', 3);

    // animate drawing of visible line
    var visLineLength = visibleLine.node().getTotalLength();
    visibleLine
        .attr('stroke-dasharray', visLineLength + ' ' + visLineLength)
        .attr('stroke-dashoffset', visLineLength)
        .transition()
        .duration(1000)
        .delay(400)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0);

    var xCoord = 0;
    for (var i = 0; i < visible.length; i++) {
        var ydist = yDistance(visible[i]['y'], yHeight, innerGraphHeight);
        drawPoint(svg,
                innerGraphX + xCoord,
                innerGraphY + innerGraphHeight - ydist,
                black);
        xCoord += separation;
    }
}    
 

function drawPoint(svg, x, y, color) {
    var circle = svg.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 5)
        .attr('fill', color);
}

