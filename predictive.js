window.onload = function() {

    // define dimensions of graph
    var canvas = d3.select('div#predictive-graph');
    canvas.style('width', px(graphWidth));
   
    // show the headline
    var headline = canvas.append('div')
        .html(title)
        .style('margin-left', px(padding))
        .style('margin-right', px(padding));
    makeHeadline(headline);

    var svg = canvas.append('svg')
        .style('width', px(graphWidth))
        .style('height', px(graphHeight))
        .style('margin-left', px(padding))
        .style('margin-right', px(padding));

    var xAxis = svg.append('path')
        .attr('d', line([
                [0.05 * graphWidth, 0],
                [0.05 * graphWidth, 0.95 * graphHeight]
        ]))
        .attr('stroke', black)
        .attr('stroke-width', 3);

    var yAxis = svg.append('path')
        .attr('d', line([
                [0.05 * graphWidth, 0.95 * graphHeight],
                [0.95 * graphWidth, 0.95 * graphHeight]
        ]))
        .attr('stroke', black)
        .attr('stroke-width', 3);

    xAxis.transition(transition)
        .attr('d', line([
                [0.95 * graphWidth, 0],
                [0.95 * graphWidth, 0.95 * graphHeight]
        ]));

}

function makeHeadline(headline) {
    headline.style('color', blue1)
        .style('text-align', 'center')
        .style('font-family', mainFont)
        .style('font-size', px(headlineSize));
}
