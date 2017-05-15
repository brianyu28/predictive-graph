function px(x) {
    return x + 'px';
}

var line = d3.line()
    .x(function(d) { return d[0]; })
    .y(function(d) { return d[1]; });

var transition = d3.transition()
    .duration(750)
    .delay(500)
    .ease(d3.easeLinear);
