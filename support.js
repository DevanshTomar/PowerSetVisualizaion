import drawBarChart from "./barchart.js";
import drawMultiTreeMap from "./multi_treemap.js";
import { resetWidthHeight } from "./multi_treemap.js";
import { resetSelection, getSelection } from "./barchart.js";

const attr1 = "restaurant type";
const attr2 = "cuisines type";
let filter_limit = 10;
let selected_attr = attr2;

export function selectHistogram() {
    console.log("histogram selected");
    let histogram_svg = d3.select("#histogram_svg");
    let piechart_svg = d3.select("#piechart_svg");

    histogram_svg
        .attr("height", "230px")
        .style("min-height", "230px");

    piechart_svg
        .attr("height", "0px")
        .style("min-height", "0px");
}

export function selectPie() {
    console.log("pie selected");
    let histogram_svg = d3.select("#histogram_svg");
    let piechart_svg = d3.select("#piechart_svg");

    histogram_svg
        .attr("height", "0px")
        .style("min-height", "0px");

    piechart_svg
        .attr("height", "230px")
        .style("min-height", "230px");
}

export function selectRestaurant() {
    console.log("showing restaurant data");
    selected_attr = attr1;

    d3.select("#barchart_svg").selectAll("*").remove();
    d3.select("#treemap_svg").selectAll("*").remove();
    d3.select("#histogram_svg").selectAll("*").remove();
    d3.select("#piechart_svg").selectAll("*").remove();
    d3.select("#tableContainer").selectAll("*").remove();

    d3.csv("./zomato.csv").then(data => {
        resetWidthHeight();
        resetSelection();
        drawMultiTreeMap(data, selected_attr, filter_limit, null); // data, attribute, minimum intersections required for a square to be shown, selected barchart tiles
        drawBarChart(data, selected_attr, filter_limit);
    });
}

export function selectCuisine() {
    console.log("showing cuisine data");
    selected_attr = attr2;

    d3.select("#barchart_svg").selectAll("*").remove();
    d3.select("#treemap_svg").selectAll("*").remove();
    d3.select("#histogram_svg").selectAll("*").remove();
    d3.select("#piechart_svg").selectAll("*").remove();
    d3.select("#tableContainer").selectAll("*").remove();

    d3.csv("./zomato.csv").then(data => {
        resetWidthHeight();
        resetSelection();
        drawMultiTreeMap(data, selected_attr, filter_limit, null); // data, attribute, minimum intersections required for a square to be shown, selected barchart tiles
        drawBarChart(data, selected_attr, filter_limit);
    });
}

export function sliderChange(value) {
    console.log("updating minimum intersection value to " + value);
    
    filter_limit = value;

    d3.select("#treemap_svg").selectAll("*").remove();

    d3.csv("./zomato.csv").then(data => {
        resetWidthHeight();
        drawMultiTreeMap(data, selected_attr, filter_limit, getSelection()); // data, attribute, minimum intersections required for a square to be shown, selected barchart tiles
    });
}
