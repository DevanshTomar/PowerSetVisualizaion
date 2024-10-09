// import drawMultiTreeMap from "./multi_treemap.js";
import { highlightMultiTreeMap } from "./multi_treemap.js";

var globalData = null;
var selectArr = null; 

export default function drawBarChart(data, attribute) {
    // convert data to a format we can use to build bar chart
    const barChartData = prepareDataForBarChart(data, attribute);

    const barChartMargin = {top: 20, right: 20, bottom: 40, left: 80},
        barChartWidth = 225 - barChartMargin.left - barChartMargin.right,
        barChartHeight = (barChartData.length * 20) - barChartMargin.top - barChartMargin.bottom;
    
    const barChartSvg = d3.select("#barchart_svg")
        .attr("width", barChartWidth + barChartMargin.left + barChartMargin.right)
        .attr("height", barChartHeight + barChartMargin.top + barChartMargin.bottom)
        .append("g")
        .attr("transform", `translate(${barChartMargin.left}, ${barChartMargin.top})`);
    
    let maxFrequency = 0;
    for (let i = 0; i < barChartData.length; i++) {
        if (barChartData[i]['frequency'] > maxFrequency) {
            maxFrequency = barChartData[i]['frequency'];
        }
    }

    // X Axis
    var xScale = d3.scaleLinear()
        .domain([0, maxFrequency])
        .range([0, barChartWidth]);
    
    var xAxis = d3.axisBottom(xScale);
    xAxis.ticks(5);

    barChartSvg.append("g")
        .attr("transform", `translate(0, ${barChartHeight})`)
        .call(xAxis)
        .selectAll("text")
            .attr("transform", "translate(-10,0) rotate(-45)")
            .style("text-anchor", "end");
    
    // Y axis
    var yScale = d3.scaleBand()
        .range([ 0, barChartHeight ])
        .domain(barChartData.map(function(d) { return d[attribute]; }))
        .padding(.1);
    
    barChartSvg.append("g")
        .call(d3.axisLeft(yScale));
    
    //Bars
    barChartSvg.selectAll(".bar")
        .data(barChartData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", xScale(0) )
        .attr("y", (d) => yScale(d[attribute]))
        .attr("width", (d) => xScale(d['frequency']))
        .attr("height", yScale.bandwidth() )
        .attr("fill", "#69b3a2");

    // Overlay rectangles for click events
    barChartSvg.selectAll(".overlay")
        .data(barChartData)
        .enter()
        .append("rect")
        .attr("class", "overlay")
        .attr("x", -100)
        .attr("y", d => yScale(d[attribute]) - 2)
        .attr("width", d => barChartWidth + 120)
        .attr("height", yScale.bandwidth() + 5)
        .attr("fill", "#69b3a2")
        .style("opacity", 0) 
        .on("click", function(d) {
            // Handle click event on overlay (can also access 'd' for corresponding bar data)
            var selection = d.target.__data__[attribute];
            if (selectArr === null) {
                selectArr = [];
                selectArr.push(selection);
            } else {
                if (selectArr.includes(selection)) {
                    selectArr = selectArr.filter(item => item != selection);
                } else {
                    selectArr.push(selection);
                }
            }
            barChartSvg.selectAll(".overlay")
                .style("opacity", 0)
                .data(barChartData)
                .filter(function(d) {
                    if (selectArr.includes(d[attribute])) {
                        return d;
                    }
                })
                .style("opacity", "30%");
            highlightMultiTreeMap(selectArr);
        });
}

export function prepareDataForBarChart(data, attribute) {
    const frequencyMap = new Map();
    
    data.forEach(row => {
        const restaurantType = row[attribute].split(', ');
        restaurantType.forEach(element => {
            if (frequencyMap.has(element)) {
                frequencyMap.set(element, frequencyMap.get(element) + 1);
            } else {
                frequencyMap.set(element, 1);
            }
        });
    });

    const barChartData = [];
    
    frequencyMap.forEach((value, key) => {
        barChartData.push(
            { [attribute]: key, "frequency": value }
        );
    });
    
    barChartData.sort((a, b) => b.frequency - a.frequency);
    
    return barChartData;
}

export function resetSelection() {
    selectArr = null;
}

export function getSelection() {
    return selectArr;
}
