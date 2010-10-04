#!/usr/bin/env node
/*
 Copyright (c) 2010 Benjamin Schmaus
 Copyright (c) 2010 Jonathan Lee 

 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.
*/

var options = require('./options');
options.process();

if (!options.get('url'))
    options.help();
if (options.get('quiet'))
    QUIET = true;
if (options.get('reportInterval'))
    MONITOR_INTERVAL = options.get('reportInterval') * 1000;

require('../dist/nodeloadlib');

TEST_MONITOR.on('update', function(tests) {
    var stats = tests[0].stats;
    summary = {
        ts: new Date(),
        ttlReqs: stats['result-codes'].lastSummary.cumulative.total,
        reqs: stats['result-codes'].lastSummary.interval.total,
        "req/s": stats['result-codes'].lastSummary.interval.rps,
        min: stats['latency'].lastSummary.interval.min,
        average: stats['latency'].lastSummary.interval.avg,
        median: stats['latency'].lastSummary.interval.median,
        "95%": stats['latency'].lastSummary.interval["95%"],
        "99%": stats['latency'].lastSummary.interval["99%"],
        max: stats['latency'].lastSummary.interval.max
    }
    qputs(JSON.stringify(summary));
})

TEST_MONITOR.on('start', function(tests) { testStart = new Date(); });
TEST_MONITOR.on('end', function(tests) {

    var stats = tests[0].stats;
    var elapsedSeconds = ((new Date()) - testStart)/1000;
    pad = function (str, width) { return str + (new Array(width-str.length)).join(" "); }
    printItem = function(name, val, padLength) {
        if (padLength == undefined) padLength = 40;
        qputs(pad(name + ":", padLength) + " " + val);
    }

    qputs('');
    printItem('Server', options.get('host') + ":" + options.get('port'));

    if (options.get('requestGeneratorModule') == null) {
        printItem('HTTP Method', options.get('method'))
        printItem('Document Path', options.get('path'))
    } else {
        printItem('Request Generator', options.get('requestGeneratorModule'));
    }

    printItem('Concurrency Level', options.get('numClients'));
    printItem('Number of requests', stats['result-codes'].cumulative.length);
    printItem('Body bytes transferred', stats['request-bytes'].cumulative.total + stats['response-bytes'].cumulative.total);
    printItem('Elapsed time (s)', elapsedSeconds.toFixed(2));
    printItem('Requests per second', (stats['result-codes'].cumulative.length/elapsedSeconds).toFixed(2));
    printItem('Mean time per request (ms)', stats['latency'].cumulative.mean().toFixed(2));
    printItem('Time per request standard deviation', stats['latency'].cumulative.stddev().toFixed(2));
    
    qputs('\nPercentages of requests served within a certain time (ms)');
    printItem("  Min", stats['latency'].cumulative.min, 6);
    printItem("  Avg", stats['latency'].cumulative.mean().toFixed(1), 6);
    printItem("  50%", stats['latency'].cumulative.percentile(.5), 6)
    printItem("  95%", stats['latency'].cumulative.percentile(.95), 6)
    printItem("  99%", stats['latency'].cumulative.percentile(.99), 6)
    printItem("  Max", stats['latency'].cumulative.max, 6);
});

runTest({
    name: 'nodeload',
    host: options.get('host'),
    port: options.get('port'),
    requestGenerator: options.get('requestGenerator'),
    method: options.get('method'),
    path: options.get('path'),
    requestData: options.get('requestData'),
    numClients: options.get('numClients'),
    numRequests: options.get('numRequests'),
    timeLimit: options.get('timeLimit'),
    targetRps: options.get('targetRps'),
    stats: ['latency', 'result-codes', 'bytes']
});
