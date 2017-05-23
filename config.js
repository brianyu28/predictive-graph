var title = 'Guess the change in Harvard&rsquo;s endowment.';

var datafile = "http://media.thecrimson.com/widgets/hmc/data.csv";
var tickInterval = 10;

var xLabel = "Year";
var yLabel = "Endowment Size (in billions of dollars)";

var graphWidth = 0.9 * window.innerWidth;
if (graphWidth > 600)
    graphWidth = 600;
var graphHeight = 0.7 * window.innerHeight;

// configuration options
var useButton = false;
