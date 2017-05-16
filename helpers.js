function px(x) {
    return x + 'px';
}

// determines how far from axis y value should be
function yDistance(yValue, maxValue, graphHeight) {
    return (yValue / maxValue) * graphHeight;
}

function disableSelection(text) {
    text.style('-webkit-touch-callout', 'none')
        .style('-webkit-user-select', 'none')
        .style('-khtml-user-select', 'none')
        .style('-moz-user-select', 'none')
        .style('-ms-user-select', 'none')
        .style('-o-user-select', 'none')
        .style('user-select', 'none')
}

var line = d3.line()
    .x(function(d) { return d[0]; })
    .y(function(d) { return d[1]; });

var transition = d3.transition()
    .duration(750)
    .delay(500)
    .ease(d3.easeLinear);

